import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetMyGroupsQuery, useJoinGroupMutation } from '../store/api/groupsApi';
import type { Group, GroupRole } from '@gem/api-client';

// ── Role badge ────────────────────────────────────────────────
function RoleBadge({ role }: { role: GroupRole }) {
  const label = role === 'owner' ? 'Owner' : role === 'co_admin' ? 'Admin' : 'Member';
  return (
    <span className="text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">
      {label}
    </span>
  );
}

// ── Featured group card (col-span-8) ─────────────────────────
function FeaturedGroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/groups/${group.id}`)}
      className="md:col-span-8 group cursor-pointer bg-surface-container-lowest rounded-[1.5rem] shadow-soft overflow-hidden transition-all hover:-translate-y-1"
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Avatar placeholder */}
        <div className="md:w-2/5 relative h-48 md:h-auto overflow-hidden bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-6xl opacity-40">groups</span>
          <div className="absolute top-4 left-4 bg-tertiary-fixed-dim text-on-tertiary-fixed text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
            <RoleBadge role={group.role} />
          </div>
        </div>
        {/* Info */}
        <div className="md:w-3/5 p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-primary">
                {group.name}
              </h3>
              <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold px-3 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-container flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm font-semibold">{group.memberCount} members</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Standard group card (col-span-4) ─────────────────────────
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

      {/* ── Hero: Join a Group ── */}
      <section className="relative rounded-[2rem] overflow-hidden mb-12 min-h-[280px] flex items-center bg-primary-container p-10 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-container" />
        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center w-full">
          {/* Left: headline */}
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
              Precision Through <br />
              <span className="text-tertiary-fixed-dim">Collective</span> Motion.
            </h1>
            <p className="text-on-primary-container text-base max-w-md leading-relaxed">
              Curate your athletic journey. Join exclusive training circles using a unique access code.
            </p>
          </div>
          {/* Right: invite code form */}
          <div className="bg-surface-container-lowest/10 backdrop-blur-md p-8 rounded-2xl border border-white/10">
            <label className="block text-white font-headline font-bold mb-3 tracking-tight">
              Enter Group Code
            </label>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-grow bg-white/5 border border-white/20 focus:border-tertiary-fixed-dim focus:ring-0 text-white placeholder:text-white/30 rounded-xl px-4 py-3 font-mono uppercase tracking-widest text-sm outline-none transition-colors"
                placeholder="GEM-XXXX"
                type="text"
              />
              <button
                onClick={handleJoin}
                disabled={isJoining || !code.trim()}
                className="bg-tertiary-fixed-dim text-on-tertiary-fixed font-headline font-bold px-6 py-3 rounded-xl hover:bg-tertiary-fixed transition-colors active:scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? '…' : 'Join'}
              </button>
            </div>
            {joinError ? (
              <p className="text-error text-xs mt-3 font-semibold">{joinError}</p>
            ) : (
              <p className="text-white/40 text-xs mt-3">Case sensitive. Contact your curator if you need a code.</p>
            )}
          </div>
        </div>
      </section>

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
          {groups.map((group, idx) =>
            idx === 0
              ? <FeaturedGroupCard key={group.id} group={group} />
              : <GroupCard key={group.id} group={group} />
          )}
        </div>
      )}
    </div>
  );
}
