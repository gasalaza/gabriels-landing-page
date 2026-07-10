export interface MeResponse {
  login: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface MessagesResponse {
  items: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
}

function readCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)__csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]!) : '';
}

export async function getMe(): Promise<MeResponse> {
  const res = await fetch('/api/admin/me', { credentials: 'include' });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.error || 'UNAUTHENTICATED');
  }
  return (await res.json()) as MeResponse;
}

export async function getMessages(limit = 20, offset = 0): Promise<MessagesResponse> {
  const res = await fetch(`/api/admin/messages?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.error || 'UNKNOWN');
  }
  return (await res.json()) as MessagesResponse;
}

export async function markRead(id: string, read: boolean): Promise<void> {
  const res = await fetch(`/api/admin/messages/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': readCsrfToken(),
    },
    body: JSON.stringify({ read }),
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.error || 'UNKNOWN');
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': readCsrfToken(),
    },
  });
}
