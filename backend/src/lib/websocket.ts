import { WebSocket, WebSocketServer } from 'ws';
import { WSMessage } from '../types';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  init(wss: WebSocketServer) {
    this.wss = wss;

    wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '/', `http://localhost`);
      const assignmentId = url.searchParams.get('assignmentId') || 'global';

      if (!this.clients.has(assignmentId)) {
        this.clients.set(assignmentId, new Set());
      }
      this.clients.get(assignmentId)!.add(ws);

      console.log(`WS client connected for assignment: ${assignmentId}`);

      ws.on('close', () => {
        this.clients.get(assignmentId)?.delete(ws);
        console.log(`WS client disconnected from assignment: ${assignmentId}`);
      });

      ws.on('error', (err) => {
        console.error('WS error:', err);
      });

      ws.send(JSON.stringify({ type: 'connected', assignmentId }));
    });
  }

  broadcast(assignmentId: string, message: WSMessage) {
    const msg = JSON.stringify(message);

    // Send to assignment-specific clients
    const assignmentClients = this.clients.get(assignmentId);
    if (assignmentClients) {
      assignmentClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }

    // Also send to global listeners
    const globalClients = this.clients.get('global');
    if (globalClients) {
      globalClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  }

  broadcastAll(message: WSMessage) {
    const msg = JSON.stringify(message);
    this.clients.forEach((clientSet) => {
      clientSet.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    });
  }
}

export const wsManager = new WebSocketManager();
