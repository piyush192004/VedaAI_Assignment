import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Assignment } from '../models/Assignment';
import { addGenerationJob } from '../lib/queue';
import { wsManager } from '../lib/websocket';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === '.pdf' || ext === '.txt');
  },
});

// GET /api/assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .select('-generatedPaper -fileContent')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: assignments });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
  }
});

// GET /api/assignments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
  }
});

// POST /api/assignments
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, subject, gradeLevel, dueDate, totalMarks, duration, questionConfigs, additionalInstructions } = req.body;

    if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required' });
    if (!subject?.trim()) return res.status(400).json({ success: false, error: 'Subject is required' });
    if (!dueDate) return res.status(400).json({ success: false, error: 'Due date is required' });

    let parsedConfigs = [];
    try { parsedConfigs = typeof questionConfigs === 'string' ? JSON.parse(questionConfigs) : questionConfigs; }
    catch { return res.status(400).json({ success: false, error: 'Invalid questionConfigs' }); }

    let fileContent: string | undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.txt') fileContent = fs.readFileSync(req.file.path, 'utf-8');
      else if (ext === '.pdf') {
        try { const pdfParse = require('pdf-parse'); const data = await pdfParse(fs.readFileSync(req.file.path)); fileContent = data.text; } catch {}
      }
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      subject: subject.trim(),
      gradeLevel,
      dueDate: new Date(dueDate),
      totalMarks: Number(totalMarks),
      duration: Number(duration),
      questionConfigs: parsedConfigs,
      additionalInstructions: additionalInstructions?.trim(),
      fileContent,
      jobStatus: 'pending',
    });

    const job = await addGenerationJob(assignment._id.toString(), { assignmentId: assignment._id.toString() });
    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    wsManager.broadcast(assignment._id.toString(), {
      type: 'job_queued',
      assignmentId: assignment._id.toString(),
      jobId: job.id,
      message: 'Assignment created, generation queued...',
    });

    res.status(201).json({ success: true, data: { assignmentId: assignment._id, jobId: job.id, status: 'pending' } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
  }
});

// POST /api/assignments/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

    await Assignment.findByIdAndUpdate(req.params.id, { jobStatus: 'pending', generatedPaper: null });
    const job = await addGenerationJob(req.params.id, { assignmentId: req.params.id });
    await Assignment.findByIdAndUpdate(req.params.id, { jobId: job.id });

    wsManager.broadcast(req.params.id, { type: 'job_queued', assignmentId: req.params.id, jobId: job.id, message: 'Regeneration queued...' });
    res.json({ success: true, data: { jobId: job.id, status: 'pending' } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await Assignment.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Assignment not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
  }
});

export default router;
