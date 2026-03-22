import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const questionGenerationQueue = new Queue('question-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const queueEvents = new QueueEvents('question-generation', {
  connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }),
});

export async function addGenerationJob(assignmentId: string, data: unknown) {
  const job = await questionGenerationQueue.add(
    'generate-questions',
    { assignmentId, data },
    { jobId: `gen-${assignmentId}` }
  );
  return job;
}
