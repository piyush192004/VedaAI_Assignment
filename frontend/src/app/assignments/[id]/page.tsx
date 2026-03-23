'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  RefreshCw, Zap, CheckCircle2, ChevronRight,
  XCircle, BookOpen, Clock, Award
} from 'lucide-react';
import { getAssignment, regenerateAssignment } from '@/lib/api';
import { Assignment, WSMessage } from '@/types';
import AppShell from '@/components/AppShell';
import QuestionPaper from '@/components/QuestionPaper';
import { format } from 'date-fns';
import { getAssignmentWebSocketUrl } from '@/lib/runtime';

type PageStatus = 'loading' | 'pending' | 'processing' | 'completed' | 'failed';

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAssignment = async () => {
    try {
      const data = await getAssignment(id);
      setAssignment(data);
      // Always sync status from DB on fetch
      setStatus(data.jobStatus as PageStatus);
      if (data.jobStatus === 'processing') {
        setProgress(30);
        setMessage('Generating questions...');
      }
    } catch {
      setStatus('failed');
      setMessage('Could not load assignment.');
    }
  };

  // WebSocket for real-time updates
  useEffect(() => {
    const wsUrl = getAssignmentWebSocketUrl(id);
    if (!wsUrl) {
      setMessage('Missing WebSocket configuration.');
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        switch (msg.type) {
          case 'job_queued':
            setStatus('pending'); setProgress(0); setMessage(msg.message || 'Queued...'); break;
          case 'job_processing':
            setStatus('processing'); setProgress(10); setMessage(msg.message || 'Generating...'); break;
          case 'progress':
            setStatus('processing'); setProgress(msg.progress ?? 50); setMessage(msg.message || 'Generating...'); break;
          case 'job_completed':
            setStatus('completed'); setProgress(100); fetchAssignment(); break;
          case 'job_failed':
            setStatus('failed'); setMessage(msg.message || 'Generation failed.'); break;
        }
      } catch {}
    };

    ws.onerror = () => ws.close();
    return () => {
      ws.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchAssignment();
  }, [id]);

  // Poll when pending/processing
  useEffect(() => {
    if (status === 'pending' || status === 'processing') {
      pollRef.current = setInterval(async () => {
        const data = await getAssignment(id);
        setAssignment(data);
        if (data.jobStatus === 'completed' || data.jobStatus === 'failed') {
          setStatus(data.jobStatus as PageStatus);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, id]);

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      await regenerateAssignment(id);
      setStatus('pending');
      setProgress(0);
      setMessage('Re-queued for generation...');
      setAssignment(prev => prev ? { ...prev, jobStatus: 'pending', generatedPaper: undefined } : prev);
    } catch (err) {
      console.error('Regenerate failed', err);
    } finally {
      setRegenerating(false);
    }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
  };

  return (
    <AppShell title="Assignment" showBack backHref="/assignments">
      <div className="p-6 max-w-5xl">

        {/* Loading spinner */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          </div>
        )}

        {/* Assignment meta — shown for all non-loading states */}
        {assignment && status !== 'loading' && (
          <div className="mb-6 animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 pl-4">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />{assignment.subject}
              </span>
              <span className="text-gray-300">·</span>
              <span>{assignment.gradeLevel}</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />{assignment.duration} min
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                <Award className="w-3.5 h-3.5" />{assignment.totalMarks} marks
              </span>
              <span className="text-gray-300">·</span>
              <span>Due: {formatDate(assignment.dueDate)}</span>
            </div>
          </div>
        )}

        {/* Pending / Processing */}
        {(status === 'pending' || status === 'processing') && (
          <GeneratingView progress={progress} message={message} status={status} />
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card animate-fade-in">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Generation Failed</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {message || 'Something went wrong. Click below to try again.'}
            </p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Queuing...' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Completed */}
        {status === 'completed' && assignment?.generatedPaper && (
          <QuestionPaper
            paper={assignment.generatedPaper}
            onRegenerate={handleRegenerate}
            isRegenerating={regenerating}
          />
        )}

        {/* Edge case: completed but no paper (shouldn't happen but just in case) */}
        {status === 'completed' && !assignment?.generatedPaper && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card">
            <p className="text-gray-500 text-sm mb-4">Paper data not found.</p>
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function GeneratingView({
  progress,
  message,
  status,
}: {
  progress: number;
  message: string;
  status: string;
}) {
  const steps = [
    { label: 'Job Queued',           done: true },
    { label: 'Processing Input',     done: status === 'processing' || progress > 10 },
    { label: 'Generating Questions', done: progress > 40 },
    { label: 'Structuring Paper',    done: progress > 75 },
    { label: 'Finalizing',           done: progress >= 100 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-card animate-fade-in">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-60" />
        <div className="relative w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Zap className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Your Paper</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
        {message || 'AI is crafting questions tailored to your specifications...'}
      </p>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-lg mx-auto">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {step.done
                ? <CheckCircle2 className="w-3 h-3" />
                : <div className="w-1.5 h-1.5 rounded-full bg-current" />
              }
            </div>
            <span className={step.done ? 'text-emerald-600' : 'text-gray-400'}>{step.label}</span>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Updates are live via WebSocket · Usually takes 5–15 seconds
      </p>
    </div>
  );
}
