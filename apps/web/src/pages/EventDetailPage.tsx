import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  useGetEventQuery,
  useGetTracksQuery,
  useGetRegistrationsQuery,
  useGetWaitlistPositionQuery,
  useRegisterMutation,
  useCancelRegistrationMutation,
  useJoinWaitlistMutation,
  useLeaveWaitlistMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useRegisterGuestMutation,
  useCancelRegistrationByIdMutation,
} from '../store/api/eventsApi';
import { useGetGroupQuery } from '../store/api/groupsApi';
import type { EventStatus, Track } from '@gem/api-client';

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: tz,
  });
}

function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  });
}

function formatEndTime(iso: string, durationMinutes: number, tz: string) {
  const end = new Date(new Date(iso).getTime() + durationMinutes * 60000);
  return end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_CFG: Record<EventStatus, { label: string; cls: string }> = {
  published: { label: 'Live',       cls: 'bg-secondary-container text-on-secondary-container' },
  draft:     { label: 'Draft',      cls: 'bg-surface-container-high text-on-surface-variant' },
  cancelled: { label: 'Cancelled',  cls: 'bg-error-container text-on-error-container' },
  completed: { label: 'Completed',  cls: 'bg-surface-container-highest text-on-surface-variant' },
};

// ── Track card ────────────────────────────────────────────────

function TrackCard({ track, occupied }: { track: Track; occupied: number }) {
  const fillPct = track.capacity > 0 ? (occupied / track.capacity) * 100 : 0;
  const isFull  = occupied >= track.capacity;
  return (
    <div className="group relative overflow-hidden rounded-xl bg-surface-container-lowest border-ghost p-6 shadow-soft transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-headline font-bold text-lg text-primary">{track.name}</h4>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">{track.capacity} spots</p>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-black tracking-tighter ${
          isFull ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
        }`}>
          {isFull ? 'FULL' : 'OPEN'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-primary tabular-nums">
          {occupied}/{track.capacity}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export function EventDetailPage() {
  const { groupId = '', eventId = '' } = useParams<{ groupId: string; eventId: string }>();
  const navigate = useNavigate();

  const { data: group }                     = useGetGroupQuery(groupId);
  const { data: event, isLoading, isError } = useGetEventQuery({ groupId, id: eventId });
  const { data: tracks = [] }               = useGetTracksQuery({ groupId, eventId }, { skip: !event });
  const { data: registrations = [] }        = useGetRegistrationsQuery(
    { groupId, eventId },
    { skip: !event || event.status === 'draft' },
  );
  const { data: waitlistEntry }             = useGetWaitlistPositionQuery(
    { groupId, eventId },
    { skip: event?.myRegistration !== 'waitlisted' },
  );

  const [register,      { isLoading: registering   }] = useRegisterMutation();
  const [cancelReg,     { isLoading: cancellingReg }] = useCancelRegistrationMutation();
  const [joinWaitlist,  { isLoading: joiningWl     }] = useJoinWaitlistMutation();
  const [leaveWaitlist, { isLoading: leavingWl     }] = useLeaveWaitlistMutation();
  const [publishEvent,  { isLoading: publishing    }] = usePublishEventMutation();
  const [cancelEvent,   { isLoading: cancellingEv  }] = useCancelEventMutation();
  const [registerGuest,          { isLoading: registeringGuest }] = useRegisterGuestMutation();
  const [cancelRegistrationById, { isLoading: cancellingById   }] = useCancelRegistrationByIdMutation();

  const [guestFormOpen,  setGuestFormOpen]  = useState(false);
  const [guestName,      setGuestName]      = useState('');
  const [guestEmail,     setGuestEmail]     = useState('');
  const [guestFormError, setGuestFormError] = useState<string | null>(null);

  const isAdmin      = group?.role === 'owner' || group?.role === 'co_admin';
  const isActionBusy = registering || cancellingReg || joiningWl || leavingWl;

  // ── Loading ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-8 pb-20 animate-pulse">
        <div className="h-4 w-40 bg-surface-container rounded mb-6" />
        <div className="h-16 w-2/3 bg-surface-container rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="h-48 bg-surface-container-lowest rounded-xl" />
            <div className="h-40 bg-surface-container-lowest rounded-xl" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-80 bg-surface-container-lowest rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">search_off</span>
        <p className="font-headline font-extrabold text-xl text-primary mb-2">Event not found</p>
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-secondary text-sm font-bold hover:underline">
          Back to group
        </button>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────────

  const status         = STATUS_CFG[event.status];
  const isFull         = event.confirmedCount >= event.totalCapacity;
  const spotsLeft      = event.totalCapacity - event.confirmedCount;
  const capacityPct    = Math.min((event.confirmedCount / event.totalCapacity) * 100, 100);
  const isAlmostFull   = !isFull && spotsLeft <= Math.max(3, Math.round(event.totalCapacity * 0.2));
  const isPublished    = event.status === 'published';
  const isDraft        = event.status === 'draft';
  const isActive       = isPublished;
  const eventStatus    = event.status;
  const myRegistration = event.myRegistration;
  const waitlistCount  = event.waitlistCount;

  const sortedTracks   = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
  const confirmedRegs  = registrations.filter(r => r.status === 'confirmed');

  // Distribute confirmed count sequentially across tracks for display purposes
  // (registrations are event-level; tracks show estimated occupancy)
  const tracksWithOccupancy = (() => {
    let remaining = event.confirmedCount;
    return sortedTracks.map(track => {
      const occupied = Math.min(remaining, track.capacity);
      remaining -= occupied;
      return { track, occupied };
    });
  })();
  const previewRegs    = confirmedRegs.slice(0, 4);

  // ── Guest registration ─────────────────────────────────────

  async function handleRegisterGuest(e: React.FormEvent) {
    e.preventDefault();
    setGuestFormError(null);
    if (!guestName.trim()) { setGuestFormError('Display name is required.'); return; }
    try {
      await registerGuest({
        groupId, eventId,
        displayName: guestName.trim(),
        email: guestEmail.trim() || undefined,
      }).unwrap();
      setGuestFormOpen(false);
      setGuestName('');
      setGuestEmail('');
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail
        ?? 'Failed to register guest. Please try again.';
      setGuestFormError(msg);
    }
  }

  // ── Action button ──────────────────────────────────────────

  function ActionButton() {
    if (!isActive) {
      const label = eventStatus === 'cancelled'
        ? 'This event has been cancelled'
        : eventStatus === 'completed'
          ? 'This event has ended'
          : null;
      return label ? (
        <div className="w-full py-4 rounded-xl text-center text-sm font-semibold text-on-surface-variant bg-surface-container-high">
          {label}
        </div>
      ) : null;
    }

    switch (myRegistration) {
      case 'confirmed':
        return (
          <>
            <button
              onClick={() => cancelReg({ groupId, eventId })}
              disabled={isActionBusy}
              className="w-full py-4 bg-error-container text-on-error-container rounded-xl font-headline font-bold text-base hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
            >
              {cancellingReg ? 'Cancelling…' : 'Cancel Registration'}
            </button>
            <p className="mt-3 text-center text-xs text-on-surface-variant">You are registered for this event.</p>
          </>
        );
      case 'waitlisted':
        return (
          <div className="space-y-3">
            <div className="bg-surface-container-low rounded-xl p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Your waitlist position</p>
              <p className="text-4xl font-black font-headline text-primary leading-none">#{waitlistEntry?.position ?? '—'}</p>
            </div>
            <button
              onClick={() => leaveWaitlist({ groupId, eventId })}
              disabled={isActionBusy}
              className="w-full py-4 bg-surface-container-high text-on-surface rounded-xl font-headline font-bold text-base hover:bg-surface-container-highest disabled:opacity-50 transition-all active:scale-95"
            >
              {leavingWl ? 'Leaving…' : 'Leave Waitlist'}
            </button>
          </div>
        );
      default:
        return isFull ? (
          <>
            <button
              onClick={() => joinWaitlist({ groupId, eventId })}
              disabled={isActionBusy}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-headline font-bold text-lg hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              {joiningWl ? 'Joining…' : 'Join Waitlist'}
            </button>
            <p className="mt-3 text-center text-xs text-on-surface-variant">
              {waitlistCount} others are waiting.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => register({ groupId, eventId })}
              disabled={isActionBusy}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-headline font-bold text-lg hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              {registering ? 'Registering…' : 'Register'}
            </button>
            <p className="mt-3 text-center text-xs text-on-surface-variant">
              Free cancellation up to 24h before the event.
            </p>
          </>
        );
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <>
    {/* ── Guest modal ───────────────────────────────────────── */}
    {guestFormOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,16,30,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setGuestFormOpen(false); setGuestName(''); setGuestEmail(''); setGuestFormError(null); }}
        />
        <div className="relative bg-surface-container-lowest w-full max-w-md rounded-2xl p-8 shadow-soft border border-outline-variant/20">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-headline font-extrabold text-2xl text-primary">Add a Guest</h3>
            <button
              onClick={() => { setGuestFormOpen(false); setGuestName(''); setGuestEmail(''); setGuestFormError(null); }}
              className="p-1 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-outline">close</span>
            </button>
          </div>
          <form onSubmit={handleRegisterGuest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Guest Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter guest's full name"
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="For event updates"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
            {guestFormError && (
              <p className="text-xs font-bold text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {guestFormError}
              </p>
            )}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => { setGuestFormOpen(false); setGuestName(''); setGuestEmail(''); setGuestFormError(null); }}
                disabled={registeringGuest}
                className="flex-1 py-4 text-on-surface-variant font-bold hover:bg-surface-container-high rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registeringGuest}
                className="flex-1 py-4 bg-primary text-on-primary rounded-xl font-headline font-bold hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {registeringGuest ? 'Registering…' : 'Confirm Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    <main className="pt-8 pb-20 px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* ── Left column ── */}
        <div className="lg:col-span-8 space-y-12">

          {/* Hero section */}
          <section>
            <nav className="flex gap-2 text-sm text-on-surface-variant mb-4 font-medium uppercase tracking-widest">
              <Link to="/groups" className="hover:text-primary transition-colors">Groups</Link>
              <span>/</span>
              <Link to={`/groups/${groupId}`} className="hover:text-primary transition-colors">
                {group?.name ?? 'Group'}
              </Link>
              <span>/</span>
              <span className="text-primary font-bold">Event</span>
            </nav>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${status.cls}`}>
                  {status.label}
                </span>
                <span className="text-on-surface-variant text-sm font-medium">
                  {formatDate(event.scheduledAt, event.timezone)} · {formatTime(event.scheduledAt, event.timezone)}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter text-primary leading-tight">
                {event.title}
              </h1>
            </div>
          </section>

          {/* Description bento */}
          {(event.description || event.location) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.description && (
                <div className="bg-surface-container-low p-8 rounded-xl">
                  <h3 className="font-headline font-bold text-xl mb-4">About</h3>
                  <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}
              {event.location && (
                <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-xl mb-4">Location</h3>
                    <p className="text-on-surface-variant mb-2">{event.location}</p>
                    {event.locationUrl && (
                      <a
                        href={event.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-medium flex items-center gap-2 hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        View in Maps
                      </a>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-outline-variant/15">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-on-surface-variant">Duration</span>
                      <span className="text-primary flex items-center gap-1">
                        {Math.floor(event.durationMinutes / 60) > 0 && `${Math.floor(event.durationMinutes / 60)}h `}
                        {event.durationMinutes % 60 > 0 && `${event.durationMinutes % 60}m`}
                        <span className="material-symbols-outlined text-sm">timer</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tracks */}
          {tracksWithOccupancy.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-headline font-extrabold tracking-tight text-primary">
                  Assigned Tracks
                </h2>
                <span className="text-secondary font-bold text-sm tracking-widest uppercase">
                  {sortedTracks.length} {sortedTracks.length === 1 ? 'Court' : 'Courts'} Reserved
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracksWithOccupancy.map(({ track, occupied }) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    occupied={occupied}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Admin panel */}
          {isAdmin && (isDraft || isPublished) && (
            <section className="bg-surface-container-low rounded-xl p-6">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm tracking-wide uppercase mb-5">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                Admin Actions
              </div>
              <div className="flex flex-wrap gap-3">
                {isDraft && (
                  <button
                    onClick={() => publishEvent({ groupId, eventId, id: eventId })}
                    disabled={publishing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary-container disabled:opacity-50 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">publish</span>
                    {publishing ? 'Publishing…' : 'Publish Event'}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/groups/${groupId}/events/${eventId}/edit`)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-highest text-primary font-bold hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Edit Event
                </button>
                {isPublished && (
                  <button
                    onClick={() => {
                      if (confirm('Cancel this event? All registrants will be notified.')) {
                        cancelEvent({ groupId, eventId, id: eventId });
                      }
                    }}
                    disabled={cancellingEv}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-error-container text-on-error-container font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    {cancellingEv ? 'Cancelling…' : 'Cancel Event'}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">

          {/* Registration card */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-soft border-ghost">

            {/* Capacity bar */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-on-surface-variant">Current Capacity</span>
                <span className="text-xl font-headline font-black text-primary">
                  {event.confirmedCount}
                  <span className="text-sm text-on-surface-variant font-medium"> / {event.totalCapacity}</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              {isAlmostFull && !isFull && (
                <p className="mt-3 text-xs text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining!
                </p>
              )}
              {isFull && event.waitlistCount > 0 && (
                <p className="mt-3 text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  {event.waitlistCount} on waitlist
                </p>
              )}
            </div>

            {/* Info rows */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</p>
                  <p className="text-sm font-bold">{formatDate(event.scheduledAt, event.timezone)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Time</p>
                  <p className="text-sm font-bold">
                    {formatTime(event.scheduledAt, event.timezone)} – {formatEndTime(event.scheduledAt, event.durationMinutes, event.timezone)}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary">location_on</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Venue</p>
                    <p className="text-sm font-bold truncate">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bring a Guest */}
            {isAdmin && isPublished && !isFull && (
              <button
                onClick={() => { setGuestFormOpen(true); setGuestFormError(null); }}
                className="w-full group flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-secondary hover:bg-secondary/[0.02] transition-all mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-primary">Bring a Guest</p>
                    <p className="text-xs text-on-surface-variant">Expand the squad</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">chevron_right</span>
              </button>
            )}

            {/* Action */}
            <ActionButton />
          </div>

          {/* Registered players */}
          {confirmedRegs.length > 0 && (
            <div className="bg-surface-container-low rounded-xl p-6">
              <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-6">
                Registered Players
              </h4>
              <div className="space-y-4">
                {previewRegs.map(reg => (
                  <div key={reg.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-black flex-shrink-0">
                        {getInitials(reg.displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{reg.displayName}</p>
                        {reg.promotedFromWaitlist && (
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">From waitlist</p>
                        )}
                        {reg.isGuestRegistration && (
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Guest</p>
                        )}
                      </div>
                    </div>
                    {isAdmin && isPublished ? (
                      <button
                        onClick={() => cancelRegistrationById({ groupId, eventId, registrationId: reg.id })}
                        disabled={cancellingById}
                        title="Cancel registration"
                        className="flex-shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-base leading-none">person_remove</span>
                      </button>
                    ) : (
                      <span
                        className="material-symbols-outlined text-secondary text-sm flex-shrink-0"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        verified
                      </span>
                    )}
                  </div>
                ))}
                {confirmedRegs.length > 4 && (
                  <button className="w-full text-center text-xs font-bold text-secondary pt-2 border-t border-outline-variant/15 hover:underline transition-all">
                    See all {confirmedRegs.length} players
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
    </>
  );
}
