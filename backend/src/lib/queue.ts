import { Queue, QueueEvents } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL into connection options for BullMQ
// BullMQ uses its own bundled ioredis — pass URL string directly
const connection = { url: redisUrl, maxRetriesPerRequest: null as null };

export const questionGenerationQueue = new Queue('question-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const queueEvents = new QueueEvents('question-generation', {
  connection: { url: redisUrl, maxRetriesPerRequest: null as null },
});

export async function addGenerationJob(assignmentId: string, data: unknown) {
  const job = await questionGenerationQueue.add(
    'generate-questions',
    { assignmentId, data },
    { jobId: `gen-${assignmentId}` }
  );
  return job;
}
