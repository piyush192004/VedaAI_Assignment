export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
  difficulty: Difficulty;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  file?: File | null;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface GeneratedSection {
  title: string;
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

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  jobId?: string;
  jobStatus: JobStatus;
  generatedPaper?: GeneratedPaper;
  createdAt: string;
  updatedAt: string;
}

export interface WSMessage {
  type: 'connected' | 'job_queued' | 'job_processing' | 'job_completed' | 'job_failed' | 'progress';
  assignmentId: string;
  jobId?: string;
  payload?: GeneratedPaper;
  message?: string;
  progress?: number;
}
