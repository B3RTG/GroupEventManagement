import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { getInitials } from '@gem/utils';

/**
 * Main app shell: glassmorphism fixed navbar (Athletic Editorial design) + page content.
 */
export function AppLayout() {
  const user     = useSelector(selectUser);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-body">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 glass-nav shadow-sm flex items-center justify-between px-6 md:px-8">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-8">
          <Link
            to="/dashboard"
            className="text-lg font-black tracking-tighter text-on-surface font-headline"
          >
            GEM
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavItem to="/dashboard" label="Dashboard" />
          </div>
        </div>

        {/* Right: notifications + avatar → profile */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            title={user?.displayName ?? 'Profile'}
            className="w-9 h-9 rounded-full overflow-hidden bg-primary-container text-on-primary-container text-sm font-bold font-headline flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              : (user ? getInitials(user.displayName) : '?')
            }
          </button>
        </div>
      </nav>

      {/* ── Page content (offset for fixed navbar) ─────────── */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'font-headline tracking-tight font-bold transition-colors text-sm',
          isActive
            ? 'text-on-surface border-b-2 border-on-surface pb-0.5'
            : 'text-on-surface-variant hover:text-on-surface',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}
