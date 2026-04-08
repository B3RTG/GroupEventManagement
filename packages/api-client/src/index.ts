// ── Shared types matching backend DTOs ────────────────────

export type UUID = string;
export type ISODateString = string;

// Auth
export interface User {
  id: UUID;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  pushToken: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  /** Lifetime in seconds */
  expiresIn: number;
  user: User;
}

// Groups
export type GroupRole = 'owner' | 'co_admin' | 'member';

export interface Group {
  id: UUID;
  name: string;
  slug: string;
  inviteCode: string;
  inviteLinkEnabled: boolean;
  ownerId: UUID;
  memberCount: number;
  role: GroupRole;
  createdAt: ISODateString;
}

export interface GroupMember {
  userId: UUID;
  displayName: string;
  avatarUrl: string | null;
  role: GroupRole;
  joinedAt: ISODateString;
}

// Events
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export interface Event {
  id: UUID;
  groupId: UUID;
  title: string;
  description: string | null;
  eventType: string;
  location: string | null;
  locationUrl: string | null;
  timezone: string;
  scheduledAt: ISODateString;
  durationMinutes: number;
  status: EventStatus;
  trackCount: number;
  capacityPerTrack: number;
  totalCapacity: number;
  confirmedCount: number;
  waitlistCount: number;
  myRegistration: RegistrationStatus | null;
}

export interface UpcomingEvent {
  id: UUID;
  groupId: UUID;
  groupName: string;
  title: string;
  eventType: string;
  location: string | null;
  status: EventStatus;
  scheduledAt: ISODateString;
  totalCapacity: number;
  confirmedCount: number;
  myRegistration: RegistrationStatus | null;
}

export interface Track {
  id: UUID;
  eventId: UUID;
  name: string;
  capacity: number;
  sortOrder: number;
}

// Registrations
export interface Registration {
  id: UUID;
  eventId: UUID;
  userId: UUID;
  displayName: string;
  status: 'confirmed' | 'cancelled';
  registeredAt: ISODateString;
  isGuestRegistration: boolean;
  promotedFromWaitlist: boolean;
}

export interface WaitlistEntry {
  id: UUID;
  eventId: UUID;
  userId: UUID;
  displayName: string;
  joinedAt: ISODateString;
  position: number;
}

// Notifications
export type NotificationChannel = 'push' | 'email' | 'in_app';

export interface Notification {
  id: UUID;
  type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  readAt: ISODateString | null;
  createdAt: ISODateString;
}

// API plumbing
export interface ApiError {
  type: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Client configuration ──────────────────────────────────

let _baseUrl = '/api/v1';
let _getToken: (() => string | null) | null = null;

export function configureApiClient(options: {
  baseUrl: string;
  getToken: () => string | null;
}) {
  _baseUrl = options.baseUrl;
  _getToken = options.getToken;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = _getToken?.();
  const response = await fetch(`${_baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      type: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}`,
    }));
    throw error;
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
