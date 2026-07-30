import { Queue } from 'bullmq';
import { QueueNames } from '@podcasts/shared';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

const globalForQueue = globalThis as unknown as {
  podcastQueue: Queue | undefined;
};

export const podcastProcessingQueue = globalForQueue.podcastQueue ?? new Queue(QueueNames.MEDIA_PIPELINE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

if (process.env.NODE_ENV !== "production") globalForQueue.podcastQueue = podcastProcessingQueue;
