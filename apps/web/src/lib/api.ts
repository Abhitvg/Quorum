export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Typed fetch wrapper for the Quorum API.
 * Uses credentials: 'include' so httpOnly cookies are sent automatically.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // Network error (API server not running, CORS, DNS failure, etc.)
    throw new ApiError(0, 'Cannot connect to server. Please ensure the API is running.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || 'Request failed');
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Auth ---

export interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    orgId: string;
    createdAt: string;
  };
}

// --- Meetings ---

export interface MeetingItem {
  id: string;
  title: string;
  hostId: string;
  status: string;
  roomName?: string;
  createdAt: string;
  updatedAt?: string;
  endedAt?: string | null;
}

export interface ParticipantItem {
  identity: string;
  name?: string;
  joinedAt?: number;
  metadata?: string;
}

export interface TrackItem {
  sid: string;
  name?: string;
  muted?: boolean;
}

export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      apiFetch<UserResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),

    login: (email: string, password: string) =>
      apiFetch<UserResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

    me: () => apiFetch<UserResponse>('/auth/me'),
  },

  meetings: {
    create: (title: string) =>
      apiFetch<{ meeting: MeetingItem }>('/meetings', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),

    list: () => apiFetch<{ meetings: MeetingItem[] }>('/meetings'),

    get: (id: string) => apiFetch<{ meeting: MeetingItem }>(`/meetings/${id}`),

    getToken: (id: string) =>
      apiFetch<{ token: string; url: string }>(`/meetings/${id}/token`, {
        method: 'POST',
      }),

    summonAgent: (id: string) =>
      apiFetch<{ success: boolean }>(`/meetings/${id}/summon-agent`, {
        method: 'POST',
      }),

    end: (id: string) =>
      apiFetch<{ meeting: MeetingItem }>(`/meetings/${id}/end`, {
        method: 'POST',
      }),

    // Phase 3 — Host Controls

    getParticipants: (id: string) =>
      apiFetch<{ participants: ParticipantItem[] }>(`/meetings/${id}/participants`),

    muteParticipant: (id: string, identity: string, trackSid: string, muted: boolean) =>
      apiFetch<{ track: TrackItem }>(`/meetings/${id}/participants/${identity}/mute`, {
        method: 'POST',
        body: JSON.stringify({ trackSid, muted }),
      }),

    kickParticipant: (id: string, identity: string) =>
      apiFetch<void>(`/meetings/${id}/participants/${identity}`, {
        method: 'DELETE',
      }),
  },
};
