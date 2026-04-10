import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Event,
  UpcomingEvent,
  Track,
  Registration,
  WaitlistEntry,
  UUID,
} from '@gem/api-client';
import type { CreateEventInput, UpdateEventInput } from '@gem/validators';
import { baseQueryWithReauth } from '../baseQuery';

export interface EventKey { groupId: UUID; eventId: UUID }
export interface TrackKey extends EventKey { trackId: UUID }

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Event', 'Track', 'Registration', 'Waitlist'],
  endpoints: (build) => ({
    // ── My upcoming events (cross-group) ─────────────────
    getMyUpcomingEvents: build.query<UpcomingEvent[], { limit?: number } | void>({
      query: (args) => {
        const limit = args?.limit ?? 10;
        return `/events/upcoming?limit=${limit}`;
      },
      providesTags: [{ type: 'Event', id: 'UPCOMING' }],
    }),

    // ── Events ───────────────────────────────────────────
    getEvents: build.query<Event[], UUID>({
      query: (groupId) => `/groups/${groupId}/events`,
      providesTags: (_r, _e, groupId) => [{ type: 'Event', id: groupId }],
    }),

    getEvent: build.query<Event, { groupId: UUID; id: UUID }>({
      query: ({ groupId, id }) => `/groups/${groupId}/events/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Event', id }],
    }),

    createEvent: build.mutation<Event, { groupId: UUID } & CreateEventInput>({
      query: ({ groupId, ...body }) => ({
        url: `/groups/${groupId}/events`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: 'Event', id: groupId }],
    }),

    updateEvent: build.mutation<void, { groupId: UUID; id: UUID } & UpdateEventInput>({
      query: ({ groupId, id, ...body }) => ({
        url: `/groups/${groupId}/events/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Event', id }],
    }),

    publishEvent: build.mutation<void, EventKey & { id: UUID }>({
      query: ({ groupId, id }) => ({
        url: `/groups/${groupId}/events/${id}/publish`,
        method: 'POST',
      }),
      async onQueryStarted({ groupId, id }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          eventsApi.util.updateQueryData('getEvents', groupId, (draft) => {
            const ev = draft.find(e => e.id === id);
            if (ev) ev.status = 'published';
          })
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
      invalidatesTags: (_r, _e, { id, groupId }) => [
        { type: 'Event', id },
        { type: 'Event', id: groupId },
        { type: 'Event', id: 'UPCOMING' },
      ],
    }),

    cancelEvent: build.mutation<void, EventKey & { id: UUID }>({
      query: ({ groupId, id }) => ({
        url: `/groups/${groupId}/events/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { id, groupId }) => [
        { type: 'Event', id },
        { type: 'Event', id: groupId },
        { type: 'Event', id: 'UPCOMING' },
      ],
    }),

    // ── Tracks ───────────────────────────────────────────
    getTracks: build.query<Track[], EventKey>({
      query: ({ groupId, eventId }) => `/groups/${groupId}/events/${eventId}/tracks`,
      providesTags: (_r, _e, { eventId }) => [{ type: 'Track', id: eventId }],
    }),

    createTrack: build.mutation<Track, EventKey & { name: string; capacity: number; sortOrder: number }>({
      query: ({ groupId, eventId, ...body }) => ({
        url: `/groups/${groupId}/events/${eventId}/tracks`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Track', id: eventId }],
    }),

    updateTrack: build.mutation<void, TrackKey & { name: string; sortOrder: number }>({
      query: ({ groupId, eventId, trackId, ...body }) => ({
        url: `/groups/${groupId}/events/${eventId}/tracks/${trackId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Track', id: eventId }],
    }),

    deleteTrack: build.mutation<void, TrackKey>({
      query: ({ groupId, eventId, trackId }) => ({
        url: `/groups/${groupId}/events/${eventId}/tracks/${trackId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Track', id: eventId }],
    }),

    // ── Registrations ─────────────────────────────────────
    getRegistrations: build.query<Registration[], EventKey>({
      query: ({ groupId, eventId }) => `/groups/${groupId}/events/${eventId}/registrations`,
      providesTags: (_r, _e, { eventId }) => [{ type: 'Registration', id: eventId }],
    }),

    register: build.mutation<{ registrationId: UUID; registeredAt: string }, EventKey>({
      query: ({ groupId, eventId }) => ({
        url: `/groups/${groupId}/events/${eventId}/registrations`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { eventId, groupId: gid }) => [
        { type: 'Registration', id: eventId },
        { type: 'Event', id: eventId },
        { type: 'Event', id: gid },
      ],
    }),

    cancelRegistration: build.mutation<void, EventKey>({
      query: ({ groupId, eventId }) => ({
        url: `/groups/${groupId}/events/${eventId}/registrations`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { eventId, groupId: gid }) => [
        { type: 'Registration', id: eventId },
        { type: 'Event', id: eventId },
        { type: 'Event', id: gid },
      ],
    }),

    registerGuest: build.mutation<
      { registrationId: UUID; registeredAt: string },
      EventKey & { displayName: string; email?: string }
    >({
      query: ({ groupId, eventId, ...body }) => ({
        url: `/groups/${groupId}/events/${eventId}/registrations/guest`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { eventId, groupId: gid }) => [
        { type: 'Registration', id: eventId },
        { type: 'Event', id: eventId },
        { type: 'Event', id: gid },
      ],
    }),

    // ── Waitlist ──────────────────────────────────────────
    getWaitlistPosition: build.query<WaitlistEntry, EventKey>({
      query: ({ groupId, eventId }) => `/groups/${groupId}/events/${eventId}/waitlist/position`,
      providesTags: (_r, _e, { eventId }) => [{ type: 'Waitlist', id: eventId }],
    }),

    joinWaitlist: build.mutation<{ entryId: UUID; position: number; joinedAt: string }, EventKey>({
      query: ({ groupId, eventId }) => ({
        url: `/groups/${groupId}/events/${eventId}/waitlist`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Waitlist', id: eventId }],
    }),

    leaveWaitlist: build.mutation<void, EventKey>({
      query: ({ groupId, eventId }) => ({
        url: `/groups/${groupId}/events/${eventId}/waitlist`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: 'Waitlist', id: eventId }],
    }),
  }),
});

export const {
  useGetMyUpcomingEventsQuery,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useGetTracksQuery,
  useCreateTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
  useGetRegistrationsQuery,
  useRegisterMutation,
  useCancelRegistrationMutation,
  useRegisterGuestMutation,
  useGetWaitlistPositionQuery,
  useJoinWaitlistMutation,
  useLeaveWaitlistMutation,
} = eventsApi;
