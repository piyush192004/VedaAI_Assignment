import axios from 'axios';
import { Assignment, AssignmentFormData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: API_URL });

export async function createAssignment(formData: AssignmentFormData): Promise<{ assignmentId: string; jobId: string; status: string }> {
  const fd = new FormData();
  fd.append('title', formData.title);
  fd.append('subject', formData.subject);
  fd.append('gradeLevel', formData.gradeLevel);
  fd.append('dueDate', formData.dueDate);
  fd.append('totalMarks', String(formData.totalMarks));
  fd.append('duration', String(formData.duration));
  fd.append('questionConfigs', JSON.stringify(formData.questionConfigs));
  if (formData.additionalInstructions) fd.append('additionalInstructions', formData.additionalInstructions);
  if (formData.file) fd.append('file', formData.file);
  const res = await api.post('/api/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.data;
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await api.get(`/api/assignments/${id}`);
  return res.data.data;
}

export async function listAssignments(): Promise<Assignment[]> {
  const res = await api.get('/api/assignments');
  return res.data.data;
}

export async function regenerateAssignment(id: string): Promise<{ jobId: string }> {
  const res = await api.post(`/api/assignments/${id}/regenerate`);
  return res.data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/api/assignments/${id}`);
}
