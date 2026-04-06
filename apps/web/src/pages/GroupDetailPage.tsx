import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  useGetGroupQuery,
  useGetMembersQuery,
  useRegenerateInviteCodeMutation,
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
} from '../store/api/groupsApi';
import { useGetEventsQuery } from '../store/api/eventsApi';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/authSlice';
import type { GroupRole, Event, GroupMember } from '@gem/api-client';

type Tab = 'events' | 'members';

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function rolePriority(r: GroupRole) {
  return r === 'owner' ? 0 : r === 'co_admin' ? 1 : 2;
}

// ── Event card ────────────────────────────────────────────────
function EventCard({ event, groupId }: { event: Event; groupId: string }) {
  const navigate = useNavigate();
  const isFull   = event.confirmedCount >= event.totalCapacity;
  const statusColors: Record<string, string> = {
    published:  'bg-secondary-fixed text-on-secondary-fixed-variant',
    draft:      'bg-surface-container-high text-on-surface-variant',
    cancelled:  'bg-error-container text-on-error-container',
    completed:  'bg-surface-container-highest text-on-surface-variant',
  };

  return (
    <div
      onClick={() => navigate(`/groups/${groupId}/events/${event.id}`)}
      className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-surface-container-high px-4 py-2 rounded-lg text-center min-w-[56px]">
          <span className="block text-2xl font-black font-headline leading-none">
            {new Date(event.scheduledAt).getDate()}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
            {new Date(event.scheduledAt).toLocaleString('en', { month: 'short' })}
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[event.status] ?? ''}`}>
          {event.status}
        </span>
      </div>
      <h4 className="text-lg font-bold font-headline text-primary mb-1">{event.title}</h4>
      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant mt-3">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {formatTime(event.scheduledAt)}
        </span>
        {event.location && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {event.location}
          </span>
        )}
        <span className={`flex items-center gap-1 font-semibold ${isFull ? 'text-error' : 'text-secondary'}`}>
          <span className="material-symbols-outlined text-sm">group</span>
          {event.confirmedCount}/{event.totalCapacity}
        </span>
      </div>
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────
function MemberRow({
  member,
  isAdmin,
  currentUserId,
  groupId,
}: {
  member: GroupMember;
  isAdmin: boolean;
  currentUserId: string | undefined;
  groupId: string;
}) {
  const [changeRole] = useChangeMemberRoleMutation();
  const [remove]     = useRemoveMemberMutation();
  const isOwner      = member.role === 'owner';
  const isSelf       = member.userId === currentUserId;
  const canManage    = isAdmin && !isOwner && !isSelf;

  const roleBadgeClass: Record<GroupRole, string> = {
    owner:    'bg-tertiary-fixed-dim text-on-tertiary-fixed',
    co_admin: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    member:   'bg-surface-container-high text-on-surface-variant',
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-surface-container last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center">
        {member.avatarUrl
          ? <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" />
          : <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
        }
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface text-sm truncate">
          {member.displayName}
          {isSelf && <span className="ml-2 text-xs text-on-surface-variant font-normal">(you)</span>}
        </p>
        <p className="text-xs text-on-surface-variant">Joined {formatDate(member.joinedAt)}</p>
      </div>
      {/* Role badge */}
      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${roleBadgeClass[member.role]}`}>
        {member.role.replace('_', ' ')}
      </span>
      {/* Admin actions */}
      {canManage && (
        <div className="flex items-center gap-1">
          {member.role === 'member' && (
            <button
              onClick={() => changeRole({ groupId, userId: member.userId, role: 'co_admin' })}
              title="Promote to admin"
              className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-lg">arrow_upward</span>
            </button>
          )}
          {member.role === 'co_admin' && (
            <button
              onClick={() => changeRole({ groupId, userId: member.userId, role: 'member' })}
              title="Demote to member"
              className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-lg">arrow_downward</span>
            </button>
          )}
          <button
            onClick={() => { if (confirm(`Remove ${member.displayName}?`)) remove({ groupId, userId: member.userId }); }}
            title="Remove member"
            className="p-1.5 rounded-lg hover:bg-error-container transition-colors text-error"
          >
            <span className="material-symbols-outlined text-lg">person_remove</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export function GroupDetailPage() {
  const { groupId = '' }  = useParams<{ groupId: string }>();
  const navigate          = useNavigate();
  const currentUser       = useAppSelector(selectUser);
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [copied, setCopied]       = useState(false);

  const { data: group,   isLoading: loadingGroup   } = useGetGroupQuery(groupId);
  const { data: events = [], isLoading: loadingEvents } = useGetEventsQuery(groupId);
  const { data: members = [], isLoading: loadingMembers } = useGetMembersQuery(groupId);
  const [regenerateCode] = useRegenerateInviteCodeMutation();

  const isAdmin = group?.role === 'owner' || group?.role === 'co_admin';

  const upcomingEvents = events
    .filter(e => e.status === 'published' && new Date(e.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const sortedMembers = [...members].sort((a, b) => rolePriority(a.role) - rolePriority(b.role));

  const copyInviteCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingGroup) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-surface-container rounded animate-pulse mb-4" />
        <div className="h-64 bg-surface-container-lowest rounded-[1.5rem] animate-pulse" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">search_off</span>
        <p className="font-headline font-extrabold text-xl text-primary mb-2">Group not found</p>
        <button onClick={() => navigate('/dashboard')} className="text-secondary-container text-sm font-bold hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ── Header ── */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* Breadcrumb */}
            <nav className="flex gap-2 text-sm text-on-surface-variant mb-4 font-medium uppercase tracking-widest">
              <Link to="/dashboard" className="hover:text-primary transition-colors">Groups</Link>
              <span>/</span>
              <span className="text-primary font-bold">Details</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-primary leading-none mb-3">
              {group.name}
            </h1>
          </div>

          {/* Invite code — only for admins */}
          {isAdmin && group.inviteCode && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Active Invitation Code
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={copyInviteCode}
                  className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-4 hover:bg-surface-bright transition-colors duration-300 group"
                >
                  <span className="text-xl font-mono font-black tracking-widest text-primary">
                    {group.inviteCode}
                  </span>
                  <span className="material-symbols-outlined text-secondary opacity-50 group-hover:opacity-100 transition-opacity">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
                <button
                  onClick={() => regenerateCode(groupId)}
                  title="Regenerate code"
                  className="p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-bright transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">refresh</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            {/* Tab nav */}
            <nav className="space-y-2">
              {(['events', 'members'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl font-headline font-bold transition-all hover:translate-x-1 ${
                    activeTab === tab
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-base capitalize">{tab}</span>
                  <span className="material-symbols-outlined">
                    {tab === 'events' ? 'calendar_today' : 'group'}
                  </span>
                </button>
              ))}
            </nav>

            {/* Stats */}
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6">
                Group Stats
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-3xl font-black font-headline text-primary">{group.memberCount}</p>
                  <p className="text-sm text-on-surface-variant font-medium">Active Members</p>
                </div>
                <div className="h-px bg-outline-variant/20 w-full" />
                <div>
                  <p className="text-3xl font-black font-headline text-primary">{upcomingEvents.length}</p>
                  <p className="text-sm text-on-surface-variant font-medium">Upcoming Events</p>
                </div>
                <div className="h-px bg-outline-variant/20 w-full" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60">
                    Your role
                  </p>
                  <p className="font-headline font-bold text-primary capitalize mt-1">
                    {group.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-9">

          {/* ── Events tab ── */}
          {activeTab === 'events' && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black font-headline tracking-tight text-primary">
                  Upcoming Events
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/groups/${groupId}/events/new`)}
                    className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:bg-primary-container transition-colors"
                  >
                    Create Event
                  </button>
                )}
              </div>

              {loadingEvents ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-surface-container-lowest rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">event_busy</span>
                  <p className="font-headline font-bold text-primary mb-1">No upcoming events</p>
                  <p className="text-on-surface-variant text-sm">
                    {isAdmin ? 'Create the first event for this group.' : 'Check back later.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} groupId={groupId} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Members tab ── */}
          {activeTab === 'members' && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black font-headline tracking-tight text-primary">
                  Members
                  <span className="ml-3 text-base font-semibold text-on-surface-variant">({group.memberCount})</span>
                </h2>
              </div>

              {loadingMembers ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-surface-container-lowest rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-xl shadow-soft p-6">
                  {sortedMembers.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      isAdmin={isAdmin}
                      currentUserId={currentUser?.id}
                      groupId={groupId}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
