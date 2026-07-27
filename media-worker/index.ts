import "dotenv/config";
import { Worker, Queue, Job } from "bullmq";
import { QueueNames } from "@podcasts/shared";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import pino from "pino";
import { db, pool, episode, job as jobSchema } from "./db";
import { eq } from "drizzle-orm";
import { downloadBlob, uploadBlob, extractBlobNameFromUrl } from "./storage";
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
  audioUrl: string;
  userId: string;
}

function validateJobPayload(data: unknown): JobPayload {
  const d = data as Record<string, unknown>;
  const missing: string[] = [];

  if (!d?.episodeId || typeof d.episodeId !== "string") missing.push("episodeId");
  if (!d?.jobId || typeof d.jobId !== "string") missing.push("jobId");
  if (!d?.audioUrl || typeof d.audioUrl !== "string") missing.push("audioUrl");
  if (!d?.userId || typeof d.userId !== "string") missing.push("userId");

  if (missing.length > 0) {
    throw new Error(`Invalid job payload: missing fields [${missing.join(", ")}]`);
  }

  return {
    episodeId: d.episodeId as string,
    jobId: d.jobId as string,
    audioUrl: d.audioUrl as string,
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
  const { episodeId, jobId, audioUrl, userId } = payload;
  const log = logger.child({ jobId, episodeId });

  log.info("media_processing_started");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-"));
  const inputPath = path.join(tempDir, "input.webm");
  const outputPath = path.join(tempDir, "output.m4a");

  try {
    await updateJobProgress(jobId, 10);
    await job.updateProgress(10);

    // 1. Download audio
    const blobName = extractBlobNameFromUrl(audioUrl);
    if (!blobName) throw new Error(`Invalid audio URL format: ${audioUrl}`);

    log.info({ blobName }, "downloading_blob");
    await downloadBlob(blobName, inputPath);
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

    // 4. Upload processed audio back to Azure
    const newBlobName = `processed/${episodeId}.m4a`;
    log.info({ newBlobName }, "uploading_processed_audio");
    const newUrl = await uploadBlob(outputPath, newBlobName, "audio/m4a");

    const stats = fs.statSync(outputPath);

    // 5. Update Database
    log.info("updating_database");
    await db
      .update(episode)
      .set({
        audioUrl: newUrl,
        fileSizeBytes: stats.size,
        mimeType: "audio/m4a",
        updatedAt: new Date(),
      })
      .where(eq(episode.id, episodeId));

    await updateJobProgress(jobId, 100, "media_done");
    await job.updateProgress(100);

    log.info("media_processing_completed");

    // Enqueue for AI Worker via BullMQ
    log.info("enqueuing_ai_job");
    await aiQueue.add("process-ai", {
      jobId,
      episodeId,
      userId,
      audioUrl: newUrl,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    log.error({ err: error }, "job_failed");

    await db
      .update(jobSchema)
      .set({ status: "failed", error: errorMessage, updatedAt: new Date() })
      .where(eq(jobSchema.id, jobId));

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
