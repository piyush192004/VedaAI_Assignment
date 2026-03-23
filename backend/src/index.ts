import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import mongoose from "mongoose";
import { Worker, Job } from "bullmq";
import assignmentRoutes from "./routes/assignments";
import toolkitRoutes from "./routes/toolkit";
import authRoutes from "./routes/auth";
import { wsManager } from "./lib/websocket";
import { Assignment } from "./models/Assignment";
import { generateQuestionPaper } from "./lib/ai";

const app = express();
const PORT = process.env.PORT || 4000;
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/toolkit", toolkitRoutes);
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
wsManager.init(wss);

// ── Inline BullMQ Worker (runs in same process) ──
function startWorker() {
  const connection = { url: redisUrl, maxRetriesPerRequest: null as null };

  const worker = new Worker(
    "question-generation",
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(
        `⚙️  Processing job ${job.id} for assignment ${assignmentId}`
      );

      await Assignment.findByIdAndUpdate(assignmentId, {
        jobStatus: "processing",
      });

      wsManager.broadcast(assignmentId, {
        type: "job_processing",
        assignmentId,
        jobId: job.id,
        message: "Generating your question paper...",
        progress: 0,
      });

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

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
            type: "progress",
            assignmentId,
            jobId: job.id,
            progress,
            message: `Generating questions... ${progress}%`,
          });
        }
      );

      await Assignment.findByIdAndUpdate(assignmentId, {
        jobStatus: "completed",
        generatedPaper: paper,
      });

      wsManager.broadcast(assignmentId, {
        type: "job_completed",
        assignmentId,
        jobId: job.id,
        payload: paper,
        message: "Question paper generated successfully!",
        progress: 100,
      });

      return paper;
    },
    { connection, concurrency: 3 }
  );

  worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));

  worker.on("failed", async (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    if (job?.data?.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        jobStatus: "failed",
      });
      wsManager.broadcast(job.data.assignmentId, {
        type: "job_failed",
        assignmentId: job.data.assignmentId,
        jobId: job.id,
        message: err.message || "Generation failed. Please try again.",
      });
    }
  });

  console.log("✅ BullMQ worker started (inline)");
}

async function start() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/vedaai"
    );
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket ready on ws://localhost:${PORT}/ws`);
    });

    // Start worker in same process after DB is connected
    startWorker();
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
