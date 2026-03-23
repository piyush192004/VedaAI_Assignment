const LOCAL_API_URL = 'http://localhost:4000';
const LOCAL_WS_URL = 'ws://localhost:4000/ws';

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function logMissingEnv(name: string) {
  if (typeof window !== 'undefined') {
    console.error(`Missing required environment variable: ${name}`);
  }
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_API_URL;
  }

  logMissingEnv('NEXT_PUBLIC_API_URL');
  return '';
}

export function getWebSocketBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }

  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    try {
      const wsUrl = new URL(apiBaseUrl);
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl.pathname = '/ws';
      wsUrl.search = '';
      wsUrl.hash = '';
      return stripTrailingSlash(wsUrl.toString());
    } catch {
      logMissingEnv('NEXT_PUBLIC_WS_URL');
      return '';
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_WS_URL;
  }

  logMissingEnv('NEXT_PUBLIC_WS_URL');
  return '';
}

export function getAssignmentWebSocketUrl(assignmentId?: string) {
  const baseUrl = getWebSocketBaseUrl();
  if (!baseUrl) {
    return '';
  }

  if (!assignmentId) {
    return baseUrl;
  }

  return `${baseUrl}?assignmentId=${assignmentId}`;
}
