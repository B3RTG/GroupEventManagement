import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  useGetMyGroupsQuery,
  useJoinGroupMutation,
} from "../store/api/groupsApi";
import type { Group } from "@gem/api-client";

// ── Helpers ──────────────────────────────────────────────────

const ROLE_CFG: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-primary text-on-primary" },
  co_admin: {
    label: "Admin",
    cls: "bg-secondary-container text-on-secondary-container",
  },
  member: {
    label: "Member",
    cls: "bg-surface-container-high text-on-surface-variant",
  },
};

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Group card ────────────────────────────────────────────────

function GroupCard({ group }: { group: Group }) {
  const isAdmin = group.role === "owner" || group.role === "co_admin";
  const roleCfg = ROLE_CFG[group.role] ?? ROLE_CFG.member;

  return (
    <div className="flex flex-col justify-between gap-6 p-6 rounded-xl bg-surface-container-lowest shadow-soft border border-outline-variant/10 hover:shadow-md transition-all">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-xl">
              group
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex-shrink-0 ${roleCfg.cls}`}
          >
            {roleCfg.label}
          </span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-lg text-primary leading-tight">
            {group.name}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Since {formatCreatedAt(group.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-sm">group</span>
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/15">
        <Link
          to={`/groups/${group.id}`}
          className="flex-1 text-center py-2 rounded-lg bg-primary text-on-primary text-sm font-bold transition-all hover:bg-primary-container active:scale-95"
        >
          View Group
        </Link>
        {isAdmin && (
          <Link
            to={`/groups/${group.id}/edit`}
            className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant text-sm font-bold transition-all hover:bg-surface-container-highest active:scale-95"
            title="Edit group"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Join widget ───────────────────────────────────────────────

function JoinWidget() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joinGroup, { isLoading }] = useJoinGroupMutation();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return;
    try {
      const group = await joinGroup({
        inviteCode: code.trim().toUpperCase(),
      }).unwrap();
      navigate(`/groups/${group.id}`);
    } catch {
      setError("Invalid or expired invite code. Please check and try again.");
    }
  }

  return (
    <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10">
      <h3 className="font-headline font-bold text-base text-primary mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-xl">
          add_link
        </span>
        Join a Group
      </h3>
      <p className="text-xs text-on-surface-variant mb-4">
        Enter an invite code shared by a group owner.
      </p>
      <form onSubmit={handleJoin} className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="INVITE CODE"
          maxLength={12}
          className="flex-1 bg-surface-container border-none rounded-lg px-4 py-2.5 font-mono font-bold text-sm tracking-widest uppercase text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          {isLoading ? "Joining…" : "Join →"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-xs text-on-error-container bg-error-container px-3 py-2 rounded-lg font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export function GroupsPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading } = useGetMyGroupsQuery();

  return (
    <main className="pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div className="space-y-1">
          <nav className="flex gap-2 text-sm text-on-surface-variant mb-4 font-medium uppercase tracking-widest">
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-primary font-bold">Groups</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight font-headline">
            Your Groups
          </h1>
          {!isLoading && groups.length > 0 && (
            <p className="text-on-surface-variant text-sm">
              You are part of {groups.length}{" "}
              {groups.length === 1 ? "group" : "groups"}.
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/groups/new")}
          className="self-start md:self-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Create Group
        </button>
      </header>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-surface-container rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Groups grid */}
      {!isLoading && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && groups.length === 0 && (
        <div className="text-center py-24 mb-10">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">
            group_off
          </span>
          <p className="font-headline font-extrabold text-xl text-primary mb-2">
            No groups yet
          </p>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto mb-8">
            Create your first group or join one with an invite code.
          </p>
          <button
            onClick={() => navigate("/groups/new")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold transition-all hover:bg-primary-container active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Group
          </button>
        </div>
      )}

      {/* Join widget */}
      <div className="max-w-lg">
        <JoinWidget />
      </div>
    </main>
  );
}
