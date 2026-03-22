export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
  difficulty: Difficulty;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number; // in minutes
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  fileContent?: string; // extracted text from uploaded PDF/txt
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[]; // for MCQ
  answer?: string;
}

export interface GeneratedSection {
  title: string; // Section A, B, etc.
  instruction: string;
  questions: GeneratedQuestion[];
  totalMarks: number;
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  totalMarks: number;
  sections: GeneratedSection[];
  generatedAt: string;
}

export interface WSMessage {
  type: 'job_queued' | 'job_processing' | 'job_completed' | 'job_failed' | 'progress';
  assignmentId: string;
  jobId?: string;
  payload?: unknown;
  message?: string;
  progress?: number;
}
