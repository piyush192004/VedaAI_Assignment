'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSMessage } from '@/types';
import { getAssignmentWebSocketUrl } from '@/lib/runtime';

export function useWebSocket(assignmentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setWsConnected, setWsRef, handleWSMessage } = useAssignmentStore();

  const connect = useCallback(() => {
    const url = getAssignmentWebSocketUrl(assignmentId);
    if (!url) {
      setWsConnected(false);
      return;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWsRef(ws);

    ws.onopen = () => {
      setWsConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleWSMessage(message);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 3s
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [assignmentId, setWsConnected, setWsRef, handleWSMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { ws: wsRef.current };
}
