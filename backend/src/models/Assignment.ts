import mongoose, { Schema, Document } from 'mongoose';
import { GeneratedPaper, JobStatus } from '../types';

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  totalMarks: number;
  duration: number;
  questionConfigs: { type: string; count: number; marks: number; difficulty: string }[];
  additionalInstructions?: string;
  fileContent?: string;
  jobId?: string;
  jobStatus: JobStatus;
  generatedPaper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:      { type: String, required: true, trim: true },
    subject:    { type: String, required: true, trim: true },
    gradeLevel: { type: String, required: true },
    dueDate:    { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    duration:   { type: Number, required: true, min: 1 },
    questionConfigs: [{
      type:       { type: String, required: true },
      count:      { type: Number, required: true, min: 1 },
      marks:      { type: Number, required: true, min: 1 },
      difficulty: { type: String, required: true },
    }],
    additionalInstructions: { type: String },
    fileContent:            { type: String },
    jobId:                  { type: String },
    jobStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    generatedPaper: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
