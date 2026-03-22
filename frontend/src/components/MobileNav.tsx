'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, Lightbulb, BookOpen, Plus } from 'lucide-react';

const TABS = [
  { href: '/',            icon: LayoutGrid, label: 'Home'       },
  { href: '/assignments', icon: FileText,   label: 'Assignments' },
  { href: '/library',     icon: BookOpen,   label: 'Library'     },
  { href: '/toolkit',     icon: Lightbulb,  label: 'AI Toolkit'  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-gray-800 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === '/assignments'
            ? pathname.startsWith('/assignments')
            : href === '/toolkit'
            ? pathname.startsWith('/toolkit')
            : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-white' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-gray-500'}`}>
                {label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-[#E8470A] mt-0.5" />}
            </Link>
          );
        })}

        {/* FAB create button */}
        <Link
          href="/create"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5"
        >
          <div className="w-9 h-9 rounded-full bg-[#E8470A] flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-gray-500">Create</span>
        </Link>
      </div>
    </nav>
  );
}
