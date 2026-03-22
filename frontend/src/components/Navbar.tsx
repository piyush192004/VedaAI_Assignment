'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Sparkles, BookOpen, Wifi, WifiOff } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import clsx from 'clsx';

export default function Navbar() {
  const pathname = usePathname();
  const wsConnected = useAssignmentStore((s) => s.wsConnected);

  return (
    <nav className="sticky top-0 z-50 border-b border-ink-800/60 bg-ink-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-ink-900" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">VedaAI</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* WS status */}
          <div className={clsx(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
            wsConnected
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-ink-500 border-ink-700 bg-ink-800'
          )}>
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {wsConnected ? 'Live' : 'Offline'}
          </div>

          <Link
            href="/assignments"
            className={clsx(
              'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors',
              pathname === '/assignments'
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-ink-300 hover:text-ink-100'
            )}
          >
            <BookOpen className="w-4 h-4" />
            Assignments
          </Link>

          <Link
            href="/create"
            className="flex items-center gap-1.5 text-sm bg-amber-500 hover:bg-amber-400 text-ink-900 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Paper
          </Link>
        </div>
      </div>
    </nav>
  );
}
