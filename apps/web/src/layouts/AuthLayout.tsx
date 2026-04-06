import { Outlet } from 'react-router';

/**
 * Centered layout for unauthenticated pages (login, OAuth callback).
 * No navbar, just the page content centered on screen.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Outlet />
    </div>
  );
}
