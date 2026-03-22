import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'paper_created' | 'answer_key_created' | 'generation_failed' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  assignmentId?: string;
}

export interface Profile {
  name: string;
  email: string;
  mobile: string;
  schoolName: string;
  schoolLocation: string;
  designation: string;
  className: string;
  avatar: string;
}

interface ProfileState {
  profile: Profile;
  notifications: Notification[];
  setProfile: (p: Partial<Profile>) => void;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: () => number;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: {
        name: 'John Doe',
        email: 'john.doe@school.edu',
        mobile: '+91 98765 43210',
        schoolName: 'Delhi Public School',
        schoolLocation: 'Bokaro Steel City',
        designation: 'Senior Teacher',
        className: 'Grade 9-10',
        avatar: '',
      },
      notifications: [],

      setProfile: (p) =>
        set((state) => ({ profile: { ...state.profile, ...p } })),

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).slice(2),
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50), // keep last 50
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: 'vedaai-profile' }
  )
);
