// ── Date formatting ───────────────────────────────────────

/**
 * Formats a date in the event's local timezone (not the viewer's).
 * Always use the event timezone, not the user's.
 */
export function formatEventDate(isoDate: string, timezone: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatShortDate(isoDate: string, timezone: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatTime(isoDate: string, timezone: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function isUpcoming(isoDate: string): boolean {
  return new Date(isoDate) > new Date();
}

export function isPast(isoDate: string): boolean {
  return new Date(isoDate) < new Date();
}

// ── Capacity helpers ──────────────────────────────────────

export type CapacityColor = 'green' | 'yellow' | 'red';

export function getCapacityColor(confirmed: number, total: number): CapacityColor {
  const ratio = confirmed / total;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.75) return 'yellow';
  return 'green';
}

export function formatCapacity(confirmed: number, total: number): string {
  return `${confirmed}/${total}`;
}

export function hasAvailableSpots(confirmed: number, total: number): boolean {
  return confirmed < total;
}

// ── Error handling ────────────────────────────────────────

export interface ApiError {
  type: string;
  message: string;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as ApiError).type === 'string' &&
    typeof (error as ApiError).message === 'string'
  );
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}

// ── String helpers ────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
