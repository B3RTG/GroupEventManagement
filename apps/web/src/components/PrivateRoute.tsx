import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router';
import { selectIsLoggedIn } from '../store/authSlice';

export function PrivateRoute() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
