import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout }     from '../layouts/AppLayout';
import { AuthLayout }    from '../layouts/AuthLayout';
import { PrivateRoute }  from '../components/PrivateRoute';

// Pages (placeholder imports — implementations in sprints 7.2–7.6)
import { LoginPage }         from '../pages/LoginPage';
import { DashboardPage }     from '../pages/DashboardPage';
import { GroupDetailPage }   from '../pages/GroupDetailPage';
import { EventDetailPage }   from '../pages/EventDetailPage';
import { EventCreatePage }   from '../pages/EventCreatePage';
import { ProfilePage }       from '../pages/ProfilePage';
import { NotFoundPage }      from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  // ── Unauthenticated routes ───────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // ── Authenticated routes ─────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true,                                       element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard',                                element: <DashboardPage /> },
          { path: '/groups/:groupId',                          element: <GroupDetailPage /> },
          { path: '/groups/:groupId/events/new',               element: <EventCreatePage /> },
          { path: '/groups/:groupId/events/:eventId',          element: <EventDetailPage /> },
          { path: '/groups/:groupId/events/:eventId/edit',     element: <EventCreatePage /> },
          { path: '/profile',                                  element: <ProfilePage /> },
        ],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
]);
