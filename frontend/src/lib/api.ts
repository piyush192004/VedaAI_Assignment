import axios from 'axios';
import { Assignment, AssignmentFormData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: API_URL });

// Inject token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('vedaai-auth');
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {}
  }
  return config;
});

// ── Auth ──
export async function apiSignup(data: {
  name: string; email: string; password: string;
  schoolName?: string; schoolLocation?: string;
  designation?: string; className?: string; mobile?: string;
}) {
  const res = await api.post('/api/auth/signup', data);
  return res.data.data;
}

export async function apiLogin(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data.data;
}

export async function apiUpdateProfile(data: Record<string, string>) {
  const res = await api.put('/api/auth/profile', data);
  return res.data.data;
}

// ── Assignments ──
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
