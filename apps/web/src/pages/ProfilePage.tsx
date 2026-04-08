import { useNavigate } from "react-router";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { useGetMyGroupsQuery } from "../store/api/groupsApi";
import { useLogoutSessionMutation } from "../store/api/authApi";
import type { GroupRole } from "@gem/api-client";

// ── Helpers ──────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_CFG: Record<GroupRole, { label: string; cls: string }> = {
  owner: {
    label: "Owner",
    cls: "bg-secondary-container/20 text-on-secondary-fixed-variant",
  },
  co_admin: {
    label: "Co-admin",
    cls: "bg-secondary-fixed text-on-secondary-fixed-variant",
  },
  member: {
    label: "Member",
    cls: "bg-surface-container-highest text-on-surface-variant",
  },
};

// ── Group icon by role ────────────────────────────────────────

const GROUP_ICONS: Record<
  GroupRole,
  { icon: string; bg: string; text: string }
> = {
  owner: {
    icon: "sprint",
    bg: "bg-primary-container",
    text: "text-on-primary",
  },
  co_admin: {
    icon: "directions_run",
    bg: "bg-secondary-container",
    text: "text-on-secondary-container",
  },
  member: {
    icon: "directions_bike",
    bg: "bg-surface-container-high",
    text: "text-primary",
  },
};

// ── Main page ─────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { data: groups = [], isLoading: loadingGroups } = useGetMyGroupsQuery();
  const [logoutSession, { isLoading: loggingOut }] = useLogoutSessionMutation();

  const initials = user?.displayName ? getInitials(user.displayName) : "?";

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  const ownedCount = groups.filter((g) => g.role === "owner").length;
  const activeCount = groups.length;

  return (
    <main className="pt-8 pb-16 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* ── Profile header ── */}
      <header className="relative mb-12 flex flex-col md:flex-row items-end gap-8">
        {/* Avatar */}
        <div className="relative group flex-shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-xl bg-surface-container-high flex items-center justify-center">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl md:text-5xl font-black font-headline text-on-surface-variant">
                {initials}
              </span>
            )}
          </div>
          {ownedCount > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-3 py-1 rounded-lg font-headline text-xs font-bold tracking-widest shadow-lg">
              GROUP OWNER
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-primary">
            {user?.displayName ?? "—"}
          </h1>
          {user?.email && (
            <div className="flex items-center gap-4 text-on-surface-variant text-sm font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  mail
                </span>
                {user.email}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-6 py-2.5 bg-error-container text-on-error-container rounded-lg font-headline font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
          <button className="p-2.5 bg-surface-container-highest rounded-lg hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ── Sidebar: 4 cols ── */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Stats card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft space-y-6">
            <h3 className="font-headline font-bold text-lg tracking-tight">
              Athlete Stats
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">
                  Active Groups
                </span>
                <span className="font-headline font-black text-xl text-primary">
                  {String(activeCount).padStart(2, "0")}
                </span>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">
                  Groups Owned
                </span>
                <span className="font-headline font-black text-xl text-primary">
                  {String(ownedCount).padStart(2, "0")}
                </span>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">
                  Account
                </span>
                <span className="font-headline font-black text-sm text-secondary">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* CTA card */}
          <div className="bg-primary-container text-on-primary-container rounded-xl p-8 overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-headline font-bold text-xl mb-2 text-white">
                Invite Your Friends
              </h4>
              <p className="text-sm opacity-80 mb-6 leading-relaxed">
                Share your group invite codes and grow your sports community.
              </p>
              <button
                onClick={() => navigate("/Groups")}
                className="w-full py-3 bg-tertiary-fixed-dim text-tertiary font-headline font-bold rounded-lg hover:bg-tertiary-fixed transition-colors active:scale-95"
              >
                Go to Groups
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span
                className="material-symbols-outlined text-9xl"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                group_add
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main: 8 cols ── */}
        <div className="lg:col-span-8 space-y-12">
          {/* Account Settings */}
          <section>
            <h2 className="font-headline font-extrabold text-2xl tracking-tighter mb-6">
              Account Settings
            </h2>
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-soft space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Email Address
                  </label>
                  <input
                    readOnly
                    type="email"
                    value={user?.email ?? "—"}
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-secondary/20 opacity-70 cursor-default"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Display Name
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={user?.displayName ?? "—"}
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-on-surface font-medium focus:ring-2 focus:ring-secondary/20 opacity-70 cursor-default"
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="pt-4 space-y-4">
                <h4 className="font-headline font-bold text-sm text-on-surface-variant border-b border-outline-variant/15 pb-2">
                  Notifications
                </h4>
                {[
                  {
                    label: "Push Notifications",
                    desc: "Real-time alerts for event starts and group updates.",
                    checked: true,
                  },
                  {
                    label: "Email Digest",
                    desc: "Weekly summary of upcoming events and group activity.",
                    checked: false,
                  },
                ].map((n) => (
                  <div
                    key={n.label}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-headline font-bold">{n.label}</p>
                      <p className="text-sm text-on-surface-variant">
                        {n.desc}
                      </p>
                    </div>
                    <div className="relative inline-flex items-center cursor-not-allowed">
                      <input
                        readOnly
                        checked={n.checked}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary opacity-60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* My Groups */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-headline font-extrabold text-2xl tracking-tighter">
                My Groups
              </h2>
              <button
                onClick={() => navigate("/Groups")}
                className="text-sm font-headline font-bold text-secondary hover:underline"
              >
                Explore All Groups
              </button>
            </div>

            {loadingGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-40 bg-surface-container-lowest rounded-xl animate-pulse shadow-soft"
                  />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-soft">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">
                  group_off
                </span>
                <p className="font-headline font-bold text-primary mb-1">
                  No groups yet
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-secondary text-sm font-bold hover:underline mt-1"
                >
                  Join or create a group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => {
                  const role = ROLE_CFG[group.role];
                  const iconCfg = GROUP_ICONS[group.role];
                  const initials2 = getInitials(group.name);
                  return (
                    <button
                      key={group.id}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="bg-surface-container-lowest p-6 rounded-xl space-y-4 hover:shadow-soft transition-shadow shadow-sm group text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className={`w-12 h-12 ${iconCfg.bg} rounded-lg flex items-center justify-center ${iconCfg.text}`}
                        >
                          <span className="material-symbols-outlined">
                            {iconCfg.icon}
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${role.cls}`}
                        >
                          {role.label}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-xl group-hover:text-secondary transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-sm text-on-surface-variant">
                          {group.memberCount}{" "}
                          {group.memberCount === 1 ? "Member" : "Members"}
                        </p>
                      </div>
                      {/* Avatar stack placeholder */}
                      <div className="flex -space-x-2 pt-2">
                        {[...Array(Math.min(3, group.memberCount))].map(
                          (_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full ring-2 ring-surface-container-lowest bg-surface-container-high flex items-center justify-center"
                            >
                              <span className="text-[9px] font-bold text-on-surface-variant">
                                {i === 0 ? initials2 : "?"}
                              </span>
                            </div>
                          ),
                        )}
                        {group.memberCount > 3 && (
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold ring-2 ring-surface-container-lowest">
                            +{group.memberCount - 3}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
