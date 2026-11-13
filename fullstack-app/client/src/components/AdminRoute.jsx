import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export function AdminRoute() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role !== 'admin') {
    return <Navigate to="/analysis" replace />;
  }

  return <Outlet />;
}
