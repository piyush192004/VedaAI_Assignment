import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Toolkit API is working' });
});

async function extractPDFText(filePath: string): Promise<string> {
  // Strategy 1: standard pdf-parse
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    if (text.length > 30) {
      console.log('✅ pdf-parse succeeded, chars:', text.length);
      return text;
    }
  } catch (e) {
    console.log('pdf-parse failed:', e);
  }

  // Strategy 2: read raw PDF bytes and extract text streams manually
  try {
    const buffer = fs.readFileSync(filePath);
    const raw = buffer.toString('latin1');
    
    // Extract text between BT...ET blocks (PDF text operators)
    const textBlocks: string[] = [];
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      // Extract strings in parentheses: (text)Tj or (text)TJ
      const strRegex = /\(([^)]*)\)\s*T[jJ]/g;
      let strMatch;
      while ((strMatch = strRegex.exec(block)) !== null) {
        const str = strMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (str.trim()) textBlocks.push(str);
      }
      // Also extract array strings: [(text)] TJ
      const arrRegex = /\[([^\]]*)\]\s*TJ/g;
      let arrMatch;
      while ((arrMatch = arrRegex.exec(block)) !== null) {
        const inner = arrMatch[1];
        const innerStr = inner.replace(/\(([^)]*)\)/g, '$1').trim();
        if (innerStr) textBlocks.push(innerStr);
      }
    }
    
    if (textBlocks.length > 5) {
      const text = textBlocks.join(' ').replace(/\s+/g, ' ').trim();
      console.log('✅ Raw PDF extraction succeeded, chars:', text.length, 'blocks:', textBlocks.length);
      return text;
    }
  } catch (e) {
    console.log('Raw extraction failed:', e);
  }

  // Strategy 3: extract visible ASCII strings from binary
  try {
    const buffer = fs.readFileSync(filePath);
    const raw = buffer.toString('binary');
    // Find readable string runs (length > 4)
    const strings: string[] = [];
    let current = '';
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      if (c >= 32 && c <= 126) {
        current += raw[i];
      } else {
        if (current.length > 4) strings.push(current);
        current = '';
      }
    }
    // Filter to likely question text (contains letters and numbers)
    const meaningful = strings.filter(s => 
      /[a-zA-Z]{3,}/.test(s) && 
      s.length > 8 &&
      !s.startsWith('%') &&
      !s.includes('<<') &&
      !s.startsWith('/')
    );
    
    if (meaningful.length > 10) {
      const text = meaningful.join(' ');
      console.log('✅ String extraction found', meaningful.length, 'strings');
      return text;
    }
  } catch (e) {
    console.log('String extraction failed:', e);
  }

  throw new Error('Could not extract text from this PDF. It appears to be an image-only PDF. Please try a different PDF or copy-paste the questions as text.');
}

router.post('/answer-key', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    console.log('📨 /answer-key hit');
    console.log('   File:', req.file?.originalname || 'NONE');

    if (err) return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file received.' });

    console.log('✅ File saved:', req.file.path, '| Size:', req.file.size);

    let pdfText = '';
    try {
      pdfText = await extractPDFText(req.file.path);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Text extraction failed';
      return res.status(400).json({ success: false, error: msg });
    } finally {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    console.log('📝 Extracted text (first 300):', pdfText.slice(0, 300));

    const prompt = `You are an expert teacher. Below is the extracted text from a question paper PDF. Generate a complete answer key.

EXTRACTED TEXT:
${pdfText.slice(0, 7000)}

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "title": "paper title (infer from content)",
  "subject": "subject name",
  "totalMarks": 35,
  "answers": [
    {
      "questionNumber": "A1",
      "questionText": "the question",
      "answer": "complete correct answer",
      "explanation": "brief explanation",
      "marks": 1
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
- Cover EVERY question found in the text
- Use section prefix for question numbers: A1, A2, B1, C1 etc.
- Provide mathematically correct answers
- Keep explanations to 1-2 sentences`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert educator. Always respond with valid JSON only. No markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);
      console.log('✅ Answer key generated, answers:', parsed.answers?.length);
      res.json({ success: true, data: parsed });
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : 'AI generation failed';
      console.error('❌ AI error:', msg);
      res.status(500).json({ success: false, error: msg });
    }
  });
});

export default router;

// Text-based endpoint — receives pre-extracted text from browser PDF.js
router.post('/answer-key-text', async (req: Request, res: Response) => {
  const { text, filename } = req.body;
  console.log('📨 /answer-key-text hit, text length:', text?.length, 'file:', filename);

  if (!text || text.trim().length < 20) {
    return res.status(400).json({ success: false, error: 'No text content provided.' });
  }

  const prompt = `You are an expert teacher. Below is the extracted text from a question paper. Generate a complete answer key.

QUESTION PAPER TEXT:
${text.slice(0, 7000)}

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "title": "paper title (infer from content)",
  "subject": "subject name",
  "totalMarks": 35,
  "answers": [
    {
      "questionNumber": "A1",
      "questionText": "the question",
      "answer": "complete correct answer",
      "explanation": "brief explanation",
      "marks": 1
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
- Cover EVERY question found
- Use section prefix: A1, A2, B1, B2, C1 etc.
- Provide mathematically correct answers
- Explanations: 1-2 sentences max`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert educator. Respond with valid JSON only. No markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);
    console.log('✅ Answer key via text, answers:', parsed.answers?.length);
    res.json({ success: true, data: parsed });
  } catch (aiErr: unknown) {
    const msg = aiErr instanceof Error ? aiErr.message : 'AI generation failed';
    console.error('❌ AI error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});
