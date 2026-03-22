import Groq from "groq-sdk";
import {
  AssignmentInput,
  GeneratedPaper,
  GeneratedSection,
  GeneratedQuestion,
} from "../types";
import { v4 as uuidv4 } from "uuid";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

function buildPrompt(input: AssignmentInput): string {
  const sectionDescriptions = input.questionConfigs
    .map((qc, idx) => {
      const sectionLetter = String.fromCharCode(65 + idx);
      return `Section ${sectionLetter}: ${qc.count} ${qc.type.replace(
        /_/g,
        " "
      )} questions, ${qc.marks} marks each, difficulty: ${qc.difficulty}`;
    })
    .join("\n");

  const fileContext = input.fileContent
    ? `\n\nReference Material (use this as primary source):\n${input.fileContent.slice(
        0,
        3000
      )}`
    : "";

  return `You are an expert educator creating a formal examination paper.

Assignment Details:
- Title: ${input.title}
- Subject: ${input.subject}
- Grade Level: ${input.gradeLevel}
- Total Marks: ${input.totalMarks}
- Duration: ${input.duration} minutes
${
  input.additionalInstructions
    ? `- Special Instructions: ${input.additionalInstructions}`
    : ""
}

Question Sections Required:
${sectionDescriptions}
${fileContext}

Return ONLY a valid JSON object. No markdown. No explanation. Start with { and end with }.

{
  "title": "${input.title}",
  "subject": "${input.subject}",
  "gradeLevel": "${input.gradeLevel}",
  "duration": ${input.duration},
  "totalMarks": ${input.totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "totalMarks": 10,
      "questions": [
        {
          "id": "q_a_1",
          "text": "What is the capital of France?",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 2,
          "options": ["A) London", "B) Paris", "C) Berlin", "D) Rome"]
        }
      ]
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
1. Output ONLY raw JSON — no markdown, no backticks, no text before or after
2. Use double quotes for all strings — never single quotes
3. Do not use contractions like do not use apostrophes at all in text
4. MCQ: exactly 4 options formatted as "A) ...", "B) ...", "C) ...", "D) ..."
5. true_false: options must be ["True", "False"]
6. fill_blank: use ___ in the question text
7. short_answer and long_answer: no options field needed
8. Question ids: "q_a_1", "q_a_2", "q_b_1" etc.
9. Each section totalMarks = sum of its question marks
10. Questions must be specific and appropriate for ${input.gradeLevel}
`;
}

function parseResponse(
  rawText: string,
  input: AssignmentInput
): GeneratedPaper {
  let text = rawText.trim();

  // Strip markdown fences if present
  text = text
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  // Extract JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Parse failed, raw response:", text.slice(0, 400));
    throw new Error(
      "Failed to parse AI response as JSON: " + (e as Error).message
    );
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("Invalid paper structure: missing sections");
  }

  const sections: GeneratedSection[] = parsed.sections.map((section: any) => ({
    title: section.title || "Section",
    instruction: section.instruction || "Attempt all questions",
    totalMarks: Number(section.totalMarks) || 0,
    questions: (section.questions || []).map(
      (q: any): GeneratedQuestion => ({
        id: q.id || uuidv4(),
        text: q.text || "",
        type: q.type || "short_answer",
        difficulty: q.difficulty || "medium",
        marks: Number(q.marks) || 1,
        options: q.options,
        answer: q.answer,
      })
    ),
  }));

  return {
    title: parsed.title || input.title,
    subject: parsed.subject || input.subject,
    gradeLevel: parsed.gradeLevel || input.gradeLevel,
    duration: Number(parsed.duration) || input.duration,
    totalMarks: Number(parsed.totalMarks) || input.totalMarks,
    sections,
    generatedAt: parsed.generatedAt || new Date().toISOString(),
  };
}

export async function generateQuestionPaper(
  input: AssignmentInput,
  onProgress?: (progress: number) => void
): Promise<GeneratedPaper> {
  const prompt = buildPrompt(input);
  onProgress?.(10);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an expert educator. You always respond with valid JSON only. Never use markdown. Never add explanation.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 8192,
    response_format: { type: "json_object" }, // forces pure JSON output
  });

  onProgress?.(80);

  const text = completion.choices[0]?.message?.content || "";
  const paper = parseResponse(text, input);

  onProgress?.(100);
  return paper;
}
