// ============================================
// Quorum — Shared Domain Types
// ============================================
// These types are the contract between the
// frontend and backend. Keep them lean.
// ============================================

// --- Organization ---

export interface Organization {
  id: string;
  name: string;
  plan: OrgPlan;
  dataResidencyRegion?: string;
  createdAt: string;
}

export type OrgPlan = 'personal' | 'team' | 'enterprise';

// --- User ---

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  orgId: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  name: string;
  avatarUrl?: string;
}

// --- Auth ---

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

// --- Meeting ---

export interface Meeting {
  id: string;
  title: string;
  orgId: string;
  hostId: string;
  status: MeetingStatus;
  roomName: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export type MeetingStatus = 'scheduled' | 'live' | 'ended';

export interface CreateMeetingDto {
  title: string;
}

export interface MeetingTokenResponse {
  token: string;
  url: string;
}

// --- Participant ---

export interface Participant {
  id: string;
  userId: string;
  meetingId: string;
  joinedAt: string;
  leftAt?: string;
}

// --- Agent (Phase 5+ placeholder) ---

export type AgentState = 'idle' | 'researching' | 'responding';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AgentInteraction {
  id: string;
  meetingId: string;
  invokedBy: string;
  query: string;
  response: string;
  sources: AgentSource[];
  confidence: ConfidenceLevel;
  disputed: boolean;
  timestamp: string;
}

export interface AgentSource {
  title: string;
  url?: string;
  type: 'internal' | 'external';
  snippet?: string;
}
