'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, ArrowLeft, LayoutGrid, Check, Trash2, User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onMenuClick?: () => void;
}

const NOTIF_ICONS: Record<string, string> = {
  paper_created: '📄', answer_key_created: '🗝️', generation_failed: '❌', info: 'ℹ️',
};

export default function TopBar({ title = 'Assignment', showBack, backHref = '/assignments', onMenuClick }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { profile, notifications, markAllRead, markRead, clearNotifications, unreadCount } = useProfileStore();
  const { user, logout } = useAuthStore();
  const unread = mounted ? unreadCount() : 0;

  const displayName = user?.name || profile.name || 'Teacher';
  const displayAvatar = user?.avatar || profile.avatar || '';
  const displayInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {showBack && (
          <Link href={backHref} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
        )}

        <div className="hidden md:flex items-center gap-2 text-gray-500">
          <LayoutGrid className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <span className="md:hidden text-sm font-semibold text-gray-900">{title}</span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <Bell className="w-4 h-4 text-gray-600" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 md:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 flex items-center gap-1"><Check className="w-3 h-3" />All read</button>}
                  {notifications.length > 0 && <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>}
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center"><p className="text-2xl mb-2">🔔</p><p className="text-sm text-gray-400">No notifications yet</p></div>
                ) : notifications.map((n) => (
                  <div key={n.id}
                    onClick={() => { markRead(n.id); if (n.assignmentId) { router.push(`/assignments/${n.assignmentId}`); setNotifOpen(false); } }}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <span className="text-base flex-shrink-0">{NOTIF_ICONS[n.type] || 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#E8470A]/10 flex items-center justify-center text-sm font-bold text-[#E8470A]">
                {displayInitial}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-gray-700">{displayName}</span>
            <ChevronDown className="hidden md:block w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || profile.email}</p>
              </div>
              <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <User className="w-3.5 h-3.5 text-gray-400" />Edit Profile
              </Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
                Settings
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                <LogOut className="w-3.5 h-3.5" />Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
