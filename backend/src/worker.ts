import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { Assignment } from './models/Assignment';
import { generateQuestionPaper } from './lib/ai';
import { wsManager } from './lib/websocket';
import { WebSocketServer } from 'ws';
import http from 'http';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai');

// Create a minimal HTTP server for WebSocket in worker
const server = http.createServer();
const wss = new WebSocketServer({ server });
wsManager.init(wss);

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker(
  'question-generation',
  async (job: Job) => {
    const { assignmentId } = job.data;
    console.log(`Processing job ${job.id} for assignment ${assignmentId}`);

    // Update status to processing
    await Assignment.findByIdAndUpdate(assignmentId, { jobStatus: 'processing' });

    wsManager.broadcast(assignmentId, {
      type: 'job_processing',
      assignmentId,
      jobId: job.id,
      message: 'Generating your question paper...',
      progress: 0,
    });

    // Fetch assignment from DB
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    // Generate the paper
    const paper = await generateQuestionPaper(
      {
        title: assignment.title,
        subject: assignment.subject,
        gradeLevel: assignment.gradeLevel,
        dueDate: assignment.dueDate.toISOString(),
        totalMarks: assignment.totalMarks,
        duration: assignment.duration,
        questionConfigs: assignment.questionConfigs as any,
        additionalInstructions: assignment.additionalInstructions,
        fileContent: assignment.fileContent,
      },
      (progress) => {
        wsManager.broadcast(assignmentId, {
          type: 'progress',
          assignmentId,
          jobId: job.id,
          progress,
          message: `Generating questions... ${progress}%`,
        });
      }
    );

    // Save generated paper
    await Assignment.findByIdAndUpdate(assignmentId, {
      jobStatus: 'completed',
      generatedPaper: paper,
    });

    // Notify frontend
    wsManager.broadcast(assignmentId, {
      type: 'job_completed',
      assignmentId,
      jobId: job.id,
      payload: paper,
      message: 'Question paper generated successfully!',
      progress: 100,
    });

    return paper;
  },
  {
    connection,
    concurrency: 3,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', async (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
  if (job?.data?.assignmentId) {
    await Assignment.findByIdAndUpdate(job.data.assignmentId, { jobStatus: 'failed' });
    wsManager.broadcast(job.data.assignmentId, {
      type: 'job_failed',
      assignmentId: job.data.assignmentId,
      jobId: job.id,
      message: err.message || 'Generation failed. Please try again.',
    });
  }
});

console.log('Worker started, waiting for jobs...');
