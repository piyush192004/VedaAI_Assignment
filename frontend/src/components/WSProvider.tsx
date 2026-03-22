'use client';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function WSProvider({ children, assignmentId }: { children: React.ReactNode; assignmentId?: string }) {
  useWebSocket(assignmentId);
  return <>{children}</>;
}
