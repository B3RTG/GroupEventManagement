import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(255),
});

// ── Groups ────────────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const joinGroupSchema = z.object({
  code: z.string().min(4).max(20).toUpperCase(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['co_admin', 'member']),
});

// ── Events ────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  eventType: z.string().default('padel'),
  location: z.string().max(500).optional(),
  locationUrl: z.string().url().optional().or(z.literal('')),
  timezone: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(15).max(480),
  trackCount: z.number().int().min(1).max(20),
  capacityPerTrack: z.number().int().min(1).max(50),
  registrationOpensAt: z.string().datetime({ offset: true }).optional(),
  registrationClosesAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = createEventSchema.partial();

// ── Guests ────────────────────────────────────────────────

export const createGuestSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const registerGuestSchema = z.object({
  guestId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(255).optional(),
}).refine((data) => data.guestId || data.displayName, {
  message: 'Either guestId or displayName is required',
});

// ── Inferred types ────────────────────────────────────────

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type RegisterGuestInput = z.infer<typeof registerGuestSchema>;
