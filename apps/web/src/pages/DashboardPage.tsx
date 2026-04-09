import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetMyGroupsQuery, useJoinGroupMutation } from '../store/api/groupsApi';
import { useGetMyUpcomingEventsQuery } from '../store/api/eventsApi';
import type { Group, GroupRole, UpcomingEvent } from '@gem/api-client';

// ── Role badge ────────────────────────────────────────────────
const ROLE_CFG: Record<GroupRole, { label: string; cls: string }> = {
  owner:    { label: 'Owner',  cls: 'bg-secondary/10 text-secondary' },
  co_admin: { label: 'Admin',  cls: 'bg-secondary/10 text-secondary' },
  member:   { label: 'Member', cls: 'bg-surface-container-high text-on-surface-variant' },
};

function RoleBadge({ role }: { role: GroupRole }) {
  const { label, cls } = ROLE_CFG[role];
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── Group card ────────────────────────────────────────────────
function GroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/groups/${group.id}`)}
      className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] shadow-soft p-6 flex flex-col hover:-translate-y-1 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary">group</span>
        </div>
        <RoleBadge role={group.role} />
      </div>
      <h3 className="font-headline text-xl font-bold tracking-tight text-primary mb-2">
        {group.name}
      </h3>
      <div className="mt-auto flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">group</span>
        <span className="text-xs font-semibold">{group.memberCount} members</span>
      </div>
    </div>
  );
}

// ── Upcoming event card ───────────────────────────────────────
function UpcomingEventCard({ event }: { event: UpcomingEvent }) {
  const navigate = useNavigate();
  const date     = new Date(event.scheduledAt);
  const isFull   = event.confirmedCount >= event.totalCapacity;

  const regBadge = event.myRegistration === 'confirmed'
    ? { label: 'Confirmed', cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' }
    : event.myRegistration === 'waitlisted'
    ? { label: 'Waitlisted', cls: 'bg-surface-container-high text-on-surface-variant' }
    : null;

  return (
    <div
      onClick={() => navigate(`/groups/${event.groupId}/events/${event.id}`)}
      className="flex-shrink-0 w-64 bg-surface-container-lowest rounded-2xl shadow-soft p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3"
    >
      {/* Date chip + group */}
      <div className="flex items-center justify-between">
        <div className="bg-surface-container-high px-3 py-1.5 rounded-lg text-center">
          <span className="block text-xl font-black font-headline leading-none">{date.getDate()}</span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant">
            {date.toLocaleString('en', { month: 'short' })}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 text-right max-w-[7rem] truncate">
          {event.groupName}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-headline font-bold text-primary text-base leading-tight line-clamp-2">
        {event.title}
      </h4>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-auto">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`flex items-center gap-1 font-semibold ${isFull ? 'text-error' : 'text-secondary'}`}>
          <span className="material-symbols-outlined text-sm">group</span>
          {event.confirmedCount}/{event.totalCapacity}
        </span>
      </div>

      {/* Registration badge or CTA */}
      {regBadge ? (
        <span className={`self-start text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${regBadge.cls}`}>
          {regBadge.label}
        </span>
      ) : (
        <span className="self-start text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary">
          {isFull ? 'Join waitlist →' : 'Register →'}
        </span>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="md:col-span-12 bg-surface-container-lowest rounded-[1.5rem] shadow-soft p-16 flex flex-col items-center gap-4 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">group_off</span>
      <p className="font-headline font-extrabold text-xl text-primary">No groups yet</p>
      <p className="text-on-surface-variant text-sm max-w-xs">
        Join a group using an invite code, or ask an administrator to add you.
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export function DashboardPage() {
  const [code, setCode]   = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const { data: groups = [], isLoading } = useGetMyGroupsQuery();
  const { data: upcomingEvents = [], isLoading: loadingUpcoming } = useGetMyUpcomingEventsQuery();
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setJoinError(null);
    try {
      await joinGroup({ inviteCode: trimmed }).unwrap();
      setCode('');
    } catch {
      setJoinError('Invalid or expired invite code.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ── Join a Group ── */}
      <section className="relative rounded-2xl overflow-hidden mb-10 bg-primary-container px-6 py-5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-container" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Label */}
            <div className="flex-shrink-0">
              <p className="text-white font-headline font-bold text-sm tracking-tight">Join a group</p>
              <p className="text-white/50 text-xs">Enter your invite code</p>
            </div>
            {/* Input + button */}
            <div className="flex-1 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-1 min-w-0 bg-white/5 border border-white/20 focus:border-tertiary-fixed-dim text-white placeholder:text-white/30 rounded-xl px-4 py-2.5 font-mono uppercase tracking-widest text-sm outline-none transition-colors"
                placeholder="GEM-XXXX"
                type="text"
              />
              <button
                onClick={handleJoin}
                disabled={isJoining || !code.trim()}
                className="flex-shrink-0 bg-tertiary-fixed-dim text-on-tertiary-fixed font-headline font-bold px-5 py-2.5 rounded-xl hover:bg-tertiary-fixed transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? '…' : 'Join'}
              </button>
            </div>
          </div>
          {joinError && (
            <p className="text-error text-xs font-semibold mt-2">{joinError}</p>
          )}
        </div>
      </section>

      {/* ── Upcoming events ── */}
      {(loadingUpcoming || upcomingEvents.length > 0) && (
        <section className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-headline text-3xl font-extrabold tracking-tighter text-primary">
                Upcoming Events
              </h2>
              <p className="text-on-surface-variant text-sm">Your next scheduled sessions across all groups.</p>
            </div>
          </div>

          {loadingUpcoming ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 h-48 bg-surface-container-lowest rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingEvents.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Group list ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tighter text-primary">
            Your Curations
          </h2>
          <p className="text-on-surface-variant">Active training environments and editorial groups.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] h-48 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
