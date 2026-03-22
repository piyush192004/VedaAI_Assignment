import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import mongoose from "mongoose";
import assignmentRoutes from "./routes/assignments";
import toolkitRoutes from "./routes/toolkit";
import authRoutes from "./routes/auth";
import { wsManager } from "./lib/websocket";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://veda-ai-assignment.vercel.app",
      /\.vercel\.app$/, // allow all vercel preview URLs
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/toolkit", toolkitRoutes);
app.get("/health", (req, res) => res.json({ status: "ok" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
wsManager.init(wss);

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
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}
start();
