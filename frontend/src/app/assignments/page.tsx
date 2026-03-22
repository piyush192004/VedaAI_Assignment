'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Plus, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { listAssignments, deleteAssignment } from '@/lib/api';
import { Assignment } from '@/types';
import AppShell from '@/components/AppShell';
import { format } from 'date-fns';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    listAssignments().then(setAssignments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try { await deleteAssignment(id); } catch {}
    setAssignments(prev => prev.filter(a => a._id !== id));
    setOpenMenu(null);
  };

  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd-MM-yyyy'); } catch { return d; } };

  const statusColor = (s: string) => {
    if (s === 'completed')  return 'text-emerald-600 bg-emerald-50';
    if (s === 'processing') return 'text-amber-600 bg-amber-50';
    if (s === 'failed')     return 'text-red-600 bg-red-50';
    return 'text-gray-500 bg-gray-100';
  };

  return (
    <AppShell title="Assignment">
      <div className="p-4 md:p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="text-base md:text-lg font-bold text-gray-900">Assignments</h1>
        </div>
        <p className="text-xs md:text-sm text-gray-500 mb-4 pl-4">Manage and create assignments for your classes.</p>

        {/* Filter + search */}
        <div className="flex items-center gap-2 mb-4">
          <button className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /><span className="hidden sm:inline">Filter By</span>
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Assignment"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="relative w-32 h-32 mb-5">
              <div className="absolute inset-4 rounded-full bg-gray-200/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-14 h-18 bg-white rounded-lg shadow border border-gray-200 flex flex-col p-2 gap-1">
                    <div className="h-1.5 bg-gray-800 rounded w-7" />
                    <div className="h-1 bg-gray-200 rounded" /><div className="h-1 bg-gray-200 rounded w-3/4" />
                  </div>
                  <div className="absolute -bottom-3 -right-4 w-8 h-8 rounded-full border-4 border-gray-400 bg-white flex items-center justify-center">
                    <span className="text-red-500 text-[10px] font-bold">✕</span>
                  </div>
                  <div className="absolute -top-2 -left-2 text-blue-400 text-xs">✦</div>
                </div>
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
              Create your first assignment to start collecting and grading student submissions.
            </p>
            <Link href="/create" className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" />Create Your First Assignment
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 md:p-5 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Assignment list — single column on mobile, grid on desktop */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a, i) => (
              <div
                key={a._id}
                className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 hover:shadow-md transition-all cursor-pointer animate-fade-up relative"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => router.push(`/assignments/${a._id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{a.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{a.subject} · {a.gradeLevel}</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === a._id ? null : a._id); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === a._id && (
                      <div className="absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { router.push(`/assignments/${a._id}`); setOpenMenu(null); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Eye className="w-3.5 h-3.5" />View
                        </button>
                        <button onClick={() => handleDelete(a._id)} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span><span className="font-medium text-gray-700">Assigned</span>: {fmtDate(a.createdAt)}</span>
                    <span><span className="font-medium text-gray-700">Due</span>: {fmtDate(a.dueDate)}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(a.jobStatus)}`}>
                    {a.jobStatus === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {a.jobStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop FAB */}
        {!loading && filtered.length > 0 && (
          <div className="hidden md:block fixed bottom-8 right-8">
            <Link href="/create" className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg">
              <Plus className="w-4 h-4" />Create Assignment
            </Link>
          </div>
        )}
      </div>

      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </AppShell>
  );
}
