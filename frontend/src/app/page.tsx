'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, Key, BookOpen, Lightbulb, Clock,
  Award, ChevronRight, Sparkles, TrendingUp, CheckCircle2,
  LayoutGrid, Zap, Lock
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useProfileStore } from '@/store/profileStore';
import { listAssignments } from '@/lib/api';
import { Assignment } from '@/types';
import { format } from 'date-fns';

const STATUS_COLOR: Record<string, string> = {
  completed:  'bg-emerald-100 text-emerald-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-blue-100 text-blue-700',
  failed:     'bg-red-100 text-red-700',
};

export default function HomePage() {
  const profile = useProfileStore((s) => s.profile);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    listAssignments()
      .then((data) => setAssignments(data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = assignments.filter((a) => a.jobStatus === 'completed').length;
  const total = assignments.length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell title="Home">
      <div className="p-6 max-w-5xl space-y-6">

        {/* ── Greeting banner ── */}
        <div className="rounded-2xl bg-gray-900 text-white px-7 py-6 flex items-center justify-between overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-64 h-full opacity-5">
            <div className="absolute right-8 top-4 w-32 h-32 rounded-full border-4 border-white" />
            <div className="absolute right-20 bottom-2 w-20 h-20 rounded-full border-2 border-white" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 text-sm mb-1">{greeting()},</p>
            <h1 className="text-2xl font-bold">{profile.name || 'Teacher'} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">{profile.schoolName} · {profile.designation || 'Educator'}</p>
          </div>
          <Link
            href="/create"
            className="relative z-10 flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Assignments', value: total,     icon: FileText,     color: 'bg-blue-50 text-blue-600'    },
            { label: 'Papers Generated',  value: completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'AI Tools',          value: 1,         icon: Sparkles,     color: 'bg-amber-50 text-amber-600'  },
            { label: 'Coming Soon',       value: 2,         icon: Zap,          color: 'bg-purple-50 text-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* ── Recent Assignments ── */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Recent Assignments</h2>
              </div>
              <Link href="/assignments" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {loading && (
                <div className="p-5 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && assignments.length === 0 && (
                <div className="py-10 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No assignments yet</p>
                  <Link href="/create" className="inline-flex items-center gap-1 text-xs text-gray-900 font-semibold mt-2 hover:underline">
                    <Plus className="w-3 h-3" /> Create one
                  </Link>
                </div>
              )}

              {!loading && assignments.map((a) => (
                <div
                  key={a._id}
                  onClick={() => router.push(`/assignments/${a._id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.subject} · Due {format(new Date(a.dueDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[a.jobStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {a.jobStatus}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>

            {!loading && assignments.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
                <Link href="/create" className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Create new assignment
                </Link>
              </div>
            )}
          </div>

          {/* ── Quick actions ── */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                </h2>
              </div>
              <div className="p-3 space-y-2">
                <Link href="/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">New Assignment</p>
                    <p className="text-[10px] text-gray-400">Generate a question paper</p>
                  </div>
                </Link>
                <Link href="/toolkit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
                  <Key className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Answer Key Generator</p>
                    <p className="text-[10px] text-gray-500">Upload PDF → get answers</p>
                  </div>
                </Link>
                <Link href="/assignments" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
                  <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">View Assignments</p>
                    <p className="text-[10px] text-gray-500">{total} total · {completed} completed</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Tools showcase ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Tools
            </h2>
            <Link href="/toolkit" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              Open Toolkit <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Active tool */}
            <Link href="/toolkit" className="bg-gray-900 rounded-2xl p-5 text-white hover:bg-gray-800 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">Answer Key Generator</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">Upload any question paper PDF and get a fully structured answer key instantly using AI.</p>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-medium group-hover:gap-2 transition-all">
                Try now <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Coming soon tools */}
            {[
              {
                icon: BookOpen,
                title: 'Rubric Builder',
                desc: 'Auto-generate detailed marking rubrics for any assignment type with custom criteria.',
                eta: 'Coming Soon',
              },
              {
                icon: Lightbulb,
                title: 'Quiz Maker',
                desc: 'Convert your notes, chapters, or topics into ready-to-use quizzes in seconds.',
                eta: 'Coming Soon',
              },
            ].map(({ icon: Icon, title, desc, eta }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <Lock className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{eta}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="font-semibold text-sm text-gray-400 mb-1">{title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Upcoming platform features ── */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            On the Roadmap
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Track student performance across assignments' },
              { icon: '👥', title: 'My Groups',            desc: 'Organise students into classes and groups'   },
              { icon: '📚', title: 'My Library',           desc: 'Save and reuse question banks and templates'  },
              { icon: '🤖', title: 'Auto Grading',         desc: 'AI-powered grading for submitted papers'     },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-3.5">
                <span className="text-xl">{icon}</span>
                <p className="text-xs font-semibold text-gray-800 mt-2">{title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
