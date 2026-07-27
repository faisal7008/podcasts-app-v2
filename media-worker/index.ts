import "dotenv/config";
import { Worker, Queue, Job } from "bullmq";
import { QueueNames, StoragePaths } from "@podcasts/shared";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import pino from "pino";
import { db, pool, episode, job as jobSchema } from "./db";
import { eq } from "drizzle-orm";
import { storageProvider } from "./storage";
import { processAudio } from "./audio";

// --- Structured Logger ---
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

// --- Redis Connection ---
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// --- AI Queue (BullMQ, replaces raw redis.lpush) ---
const aiQueue = new Queue(QueueNames.AI_PIPELINE, { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// --- Job Payload Validation ---
interface JobPayload {
  episodeId: string;
  jobId: string;
  podcastId: string;
  userId: string;
}

function validateJobPayload(data: unknown): JobPayload {
  const d = data as Record<string, unknown>;
  const missing: string[] = [];

  if (!d?.episodeId || typeof d.episodeId !== "string") missing.push("episodeId");
  if (!d?.jobId || typeof d.jobId !== "string") missing.push("jobId");
  if (!d?.podcastId || typeof d.podcastId !== "string") missing.push("podcastId");
  if (!d?.userId || typeof d.userId !== "string") missing.push("userId");

  if (missing.length > 0) {
    throw new Error(`Invalid job payload: missing fields [${missing.join(", ")}]`);
  }

  return {
    episodeId: d.episodeId as string,
    jobId: d.jobId as string,
    podcastId: d.podcastId as string,
    userId: d.userId as string,
  };
}

// --- Progress Helper ---
async function updateJobProgress(
  jobId: string,
  progress: number,
  status: string = "processing"
) {
  await db
    .update(jobSchema)
    .set({ progress, status, updatedAt: new Date() })
    .where(eq(jobSchema.id, jobId));
}

// --- Main Job Processor ---
async function processJob(job: Job) {
  const payload = validateJobPayload(job.data);
  const { episodeId, jobId, podcastId, userId } = payload;
  const log = logger.child({ jobId, episodeId });

  log.info("media_processing_started");

  // Derive processed blob path
  const processedBlobPath = StoragePaths.processedAudio(episodeId);

  // Get raw blob path from the database (since extension varies)
  const [episodeRecord] = await db
    .select()
    .from(episode)
    .where(eq(episode.id, episodeId));

  if (!episodeRecord || !episodeRecord.rawBlob) {
    throw new Error(`Episode ${episodeId} not found or has no rawBlob`);
  }

  const rawBlobPath = episodeRecord.rawBlob;
  const ext = rawBlobPath.split(".").pop() || "webm";

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-"));
  const inputPath = path.join(tempDir, `input.${ext}`);
  const outputPath = path.join(tempDir, "output.m4a");

  try {
    await updateJobProgress(jobId, 10);
    await job.updateProgress(10);

    // 1. Download audio using blob path (not URL)
    log.info({ blobPath: rawBlobPath }, "downloading_blob");
    await storageProvider.downloadToFile(rawBlobPath, inputPath);
    await updateJobProgress(jobId, 30);
    await job.updateProgress(30);

    // 2. Process audio (normalize & convert)
    log.info("processing_audio");
    await processAudio(inputPath, outputPath);
    await updateJobProgress(jobId, 60);
    await job.updateProgress(60);

    // 3. Generate waveform (deferred to client)
    await updateJobProgress(jobId, 70);
    await job.updateProgress(70);

    // 4. Upload processed audio to deterministic path
    log.info({ blobPath: processedBlobPath }, "uploading_processed_audio");
    await storageProvider.uploadFile(outputPath, processedBlobPath, "audio/m4a", {
      episodeId,
      podcastId,
      userId,
      source: "media-worker",
      uploadedAt: new Date().toISOString(),
    });

    const stats = fs.statSync(outputPath);

    // 5. Update Database — store blob path, not URL
    log.info("updating_database");
    await db
      .update(episode)
      .set({
        processedBlob: processedBlobPath,
        fileSizeBytes: stats.size,
        mimeType: "audio/m4a",
        updatedAt: new Date(),
      })
      .where(eq(episode.id, episodeId));

    await updateJobProgress(jobId, 100, "media_done");
    await job.updateProgress(100);

    log.info("media_processing_completed");

    // Enqueue for AI Worker via BullMQ — only episodeId, no URLs
    log.info("enqueuing_ai_job");
    await aiQueue.add("process-ai", {
      jobId,
      episodeId,
      podcastId,
      userId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    log.error({ err: error }, "job_failed");

    await db
      .update(jobSchema)
      .set({ status: "failed", error: errorMessage, updatedAt: new Date() })
      .where(eq(jobSchema.id, jobId));

    await db
      .update(episode)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(episode.id, episodeId));

    throw error;
  } finally {
    // Always cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
    log.debug({ tempDir }, "temp_dir_cleaned");
  }
}

// --- Worker Setup ---
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "3");

const worker = new Worker(QueueNames.MEDIA_PIPELINE, processJob, {
  connection,
  concurrency,
});

worker.on("completed", (job) => {
  logger.info({ bullmqJobId: job.id }, "bullmq_job_completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    { bullmqJobId: job?.id, err: err.message },
    "bullmq_job_failed"
  );
});

worker.on("error", (err) => {
  logger.error({ err }, "worker_error");
});

logger.info(
  { queue: QueueNames.MEDIA_PIPELINE, concurrency },
  "media_worker_listening"
);

// --- Graceful Shutdown ---
async function shutdown(signal: string) {
  logger.info({ signal }, "shutdown_signal_received");

  // Stop accepting new jobs, wait for current ones to finish
  await worker.close();
  logger.info("worker_closed");

  // Close AI queue connection
  await aiQueue.close();
  logger.info("ai_queue_closed");

  // Close database pool
  await pool.end();
  logger.info("database_pool_closed");

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
