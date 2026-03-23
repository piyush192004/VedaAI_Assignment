'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, FileText, Lightbulb, BookOpen, Settings, Plus, X } from 'lucide-react';
import { useProfileStore } from '@/store/profileStore';

const NAV = [
  { href: '/',            icon: LayoutGrid, label: 'Home',                soon: false },
  { href: '/groups',      icon: Users,      label: 'My Groups',            soon: true  },
  { href: '/assignments', icon: FileText,   label: 'Assignments',          soon: false },
  { href: '/toolkit',     icon: Lightbulb,  label: "AI Teacher's Toolkit", soon: false },
  { href: '/library',     icon: BookOpen,   label: 'My Library',           soon: true  },
];

interface Props { onClose?: () => void; }

export default function Sidebar({ onClose }: Props) {
  const pathname = usePathname();
  const profile = useProfileStore((s) => s.profile);

  const schoolName = profile.schoolName || 'Your School';
  const schoolLocation = profile.schoolLocation || 'Location';
  const avatar = profile.avatar || '';
  const name = profile.name || 'Teacher';

  return (
    <aside className="h-full w-[240px] bg-white flex flex-col border-r border-gray-100 fixed md:fixed left-0 top-0 z-20" style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
      {/* Logo row */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8470A] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L9 4L15 14H3Z" fill="white" fillOpacity="0.9"/>
              <path d="M6 14L9 9L12 14H6Z" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">VedaAI</span>
        </Link>
        {/* Close button mobile */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-5">
        <Link
          href="/create"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label, soon }) => {
          const active = href === '/assignments'
            ? pathname.startsWith('/assignments')
            : href === '/toolkit'
            ? pathname.startsWith('/toolkit')
            : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gray-900' : 'text-gray-400'}`} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">SOON</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-3">
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
            pathname === '/settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Settings className="w-4 h-4 text-gray-400" />
          Settings
        </Link>

        {/* School card */}
        <Link href="/profile" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors mt-1">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#E8470A]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#E8470A] text-sm">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{schoolName}</p>
            <p className="text-xs text-gray-500 truncate">{schoolLocation}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
