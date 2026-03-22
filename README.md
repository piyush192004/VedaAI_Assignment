# VedaAI – AI Assessment Creator

> Full-stack AI-powered question paper generator for teachers. Built for the VedaAI Full Stack Engineering Assignment.

**Live Demo**: http://localhost:3000  
**Tech Stack**: Next.js 16 · Node.js/Express · MongoDB Atlas · Redis Cloud · BullMQ · Groq AI · WebSocket · Zustand · TypeScript

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                    │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Auth    │  │ Assignment │  │ Question │  │  AI Toolkit  │    │
│  │  Pages   │  │   Form     │  │  Paper   │  │  (Ans. Key)  │    │
│  └──────────┘  └────────────┘  └──────────┘  └──────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Zustand Stores: authStore · assignmentStore · profileStore│  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────┐    ┌───────────────────────────────┐     │
│  │  WebSocket Client  │    │     Axios API Client (JWT)    │     │
│  └────────────────────┘    └───────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                │  HTTP/REST + JWT         │  WebSocket (ws://)
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express + TS)              │
│  POST /api/auth/signup      POST /api/auth/login                 │
│  GET  /api/assignments      POST /api/assignments                │
│  GET  /api/assignments/:id  POST /api/assignments/:id/regenerate │
│  POST /api/toolkit/answer-key                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │         JWT Auth Middleware (requireAuth)                │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
        │                    │                    │
┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
│  MongoDB Atlas│   │  Redis Cloud    │   │   Groq AI        │
│  - Users      │   │  - BullMQ jobs  │   │  llama-3.3-70b   │
│  - Assignments│   │  - Job state    │   │  (JSON mode)     │
└───────────────┘   └─────────────────┘   └──────────────────┘
                            │
                ┌────────────────────────┐
                │    BullMQ Worker       │
                │  (separate process)    │
                │  1. Dequeue job        │
                │  2. Build AI prompt    │
                │  3. Call Groq API      │
                │  4. Parse JSON response│
                │  5. Save to MongoDB    │
                │  6. Notify via WS      │
                └────────────────────────┘
```

---

## Flow: Assignment Creation → Paper Generation

```
Teacher fills form
      │
      ▼
POST /api/assignments  ──→  MongoDB (status: pending)
      │
      ▼
BullMQ.add(job)  ──→  Redis queue
      │
      ▼  (WebSocket: job_queued)
Worker picks up job
      │
      ▼
Build structured prompt (sections, types, difficulty, marks)
      │
      ▼
Groq API (llama-3.3-70b, response_format: json_object)
      │
      ▼
Parse + validate JSON → GeneratedPaper structure
      │
      ▼
MongoDB update (status: completed, generatedPaper: {...})
      │
      ▼  (WebSocket: job_completed + paper payload)
Frontend receives WS message → renders QuestionPaper component
```

---

## Features

### Core (Required)

- ✅ **Assignment Creation Form** — file upload, due date, question types, marks, difficulty, additional instructions
- ✅ **AI Question Generation** — structured prompt → Groq → parsed JSON → typed sections/questions
- ✅ **Sections A, B, C...** — auto-organized by question type
- ✅ **Difficulty tags** — Easy / Moderate / Hard badges per question
- ✅ **WebSocket real-time updates** — live progress with step indicators
- ✅ **BullMQ background jobs** — async generation with retry logic
- ✅ **Redis** — job queue state management
- ✅ **MongoDB** — users + assignments + generated papers stored per-user
- ✅ **Zustand state management** — authStore, assignmentStore, profileStore

### Output Page

- ✅ Student info section (Name, Roll Number, Section inputs)
- ✅ Grouped sections with title + instructions
- ✅ Each question: text, difficulty badge, marks
- ✅ Clean exam paper layout with answer lines
- ✅ Download as PDF (html2canvas + jsPDF, multi-page)
- ✅ Regenerate action bar

### Bonus

- ✅ **PDF Export** — proper multi-page A4 formatting
- ✅ **Authentication** — JWT signup/login, per-user data isolation
- ✅ **Mobile Responsive** — bottom nav, hamburger sidebar, adaptive layouts
- ✅ **AI Teacher's Toolkit** — Answer Key Generator (PDF upload → OCR → Groq)
- ✅ **Notifications** — real-time bell with paper_created / answer_key_created events
- ✅ **Profile Management** — name, school, avatar upload, persisted
- ✅ **Settings page** — toggle preferences

---

## Project Structure

```
vedaai/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server + WebSocket
│   │   ├── worker.ts         # BullMQ worker process
│   │   ├── lib/
│   │   │   ├── ai.ts         # Groq prompt builder + parser
│   │   │   ├── auth.ts       # JWT sign/verify + requireAuth middleware
│   │   │   ├── queue.ts      # BullMQ + Redis setup
│   │   │   └── websocket.ts  # WS manager (per-assignment rooms)
│   │   ├── models/
│   │   │   ├── User.ts       # User schema + bcrypt
│   │   │   └── Assignment.ts # Assignment schema (userId scoped)
│   │   ├── routes/
│   │   │   ├── auth.ts       # /signup /login /me /profile
│   │   │   ├── assignments.ts# CRUD + regenerate (auth protected)
│   │   │   └── toolkit.ts    # Answer key generation
│   │   └── types/index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/              # Next.js App Router pages
    │   │   ├── login/        # Login page
    │   │   ├── signup/       # 2-step signup
    │   │   ├── assignments/  # List + detail pages
    │   │   ├── create/       # Assignment creation form
    │   │   ├── toolkit/      # AI tools (answer key)
    │   │   ├── profile/      # Profile editor + avatar
    │   │   └── settings/     # App settings
    │   ├── components/
    │   │   ├── AppShell.tsx      # Layout wrapper (desktop+mobile)
    │   │   ├── Sidebar.tsx       # Desktop nav + school card
    │   │   ├── TopBar.tsx        # Header + notifications + profile
    │   │   ├── MobileNav.tsx     # Bottom tab navigation
    │   │   ├── AuthGuard.tsx     # Route protection
    │   │   ├── CreateAssignmentForm.tsx
    │   │   └── QuestionPaper.tsx # Formatted paper + PDF export
    │   ├── store/
    │   │   ├── authStore.ts      # JWT + user (persisted)
    │   │   ├── assignmentStore.ts# WS message handler
    │   │   └── profileStore.ts   # Profile + notifications (persisted)
    │   ├── lib/api.ts            # Axios + auto JWT injection
    │   ├── hooks/useWebSocket.ts
    │   └── types/index.ts
    ├── .env.example
    └── package.json
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free)
- Redis Cloud account (free)
- Groq API key (free at console.groq.com)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in .env:
# MONGODB_URI=mongodb+srv://...
# REDIS_URL=redis://default:...@...
# GROQ_API_KEY=gsk_...
# JWT_SECRET=your-secret-key

npm install
npm run dev        # Terminal 1 — API server on :4000
npm run worker     # Terminal 2 — BullMQ worker
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws

npm install --legacy-peer-deps
npm run dev        # Terminal 3 — Next.js on :3000
```

### Environment Variables

**Backend `.env`**

```
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://default:pass@host:port
GROQ_API_KEY=gsk_...
JWT_SECRET=change-this-in-production
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

---

## AI Prompt Strategy

The prompt builder (`backend/src/lib/ai.ts`) converts form input into a structured prompt:

1. **Input parsing** — questionConfigs map to "Section A: 10 MCQ questions, 1 mark each, difficulty: medium"
2. **Strict JSON schema** — exact structure is embedded in the prompt with a worked example
3. **Response format** — `response_format: { type: 'json_object' }` forces pure JSON from Groq
4. **Low temperature** (0.1) — maximizes consistency and correctness
5. **Post-processing** — `parseGeneratedPaper()` validates structure, normalizes fields, generates UUIDs for missing IDs

No raw LLM output is ever rendered — all content goes through the typed `GeneratedPaper` → `GeneratedSection` → `GeneratedQuestion` chain.

---

## API Reference

| Method | Endpoint                        | Auth | Description                  |
| ------ | ------------------------------- | ---- | ---------------------------- |
| POST   | /api/auth/signup                | ❌   | Create account               |
| POST   | /api/auth/login                 | ❌   | Get JWT token                |
| GET    | /api/auth/me                    | ✅   | Get current user             |
| PUT    | /api/auth/profile               | ✅   | Update profile               |
| GET    | /api/assignments                | ✅   | List user's assignments      |
| POST   | /api/assignments                | ✅   | Create + queue generation    |
| GET    | /api/assignments/:id            | ✅   | Get assignment + paper       |
| POST   | /api/assignments/:id/regenerate | ✅   | Re-queue generation          |
| DELETE | /api/assignments/:id            | ✅   | Delete assignment            |
| POST   | /api/toolkit/answer-key         | ✅   | Generate answer key from PDF |
| POST   | /api/toolkit/answer-key-text    | ✅   | Generate from extracted text |

---

## WebSocket Events

Connect: `ws://localhost:4000/ws?assignmentId=<id>`

| Event            | Direction     | Payload                                      |
| ---------------- | ------------- | -------------------------------------------- |
| `job_queued`     | Server→Client | `{ assignmentId, jobId, message }`           |
| `job_processing` | Server→Client | `{ assignmentId, progress: 10 }`             |
| `progress`       | Server→Client | `{ assignmentId, progress: 0-100, message }` |
| `job_completed`  | Server→Client | `{ assignmentId, payload: GeneratedPaper }`  |
| `job_failed`     | Server→Client | `{ assignmentId, message }`                  |
