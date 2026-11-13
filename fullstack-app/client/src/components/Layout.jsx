import { useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';

export function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  return (
    <>
      <header className="app-header">
        <div className="container app-header-inner">
          <div className="app-brand">💰 Finance Tracker</div>

          <nav className="app-nav">
            <NavLink
              to="/transactions"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Транзакции
            </NavLink>
            <NavLink
              to="/analysis"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Аналитика
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Админка
              </NavLink>
            )}
          </nav>

          <div className="app-user">
            <span className="app-user-email" title={user?.email}>
              {user?.email}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container app-main">
        <Outlet />
      </main>
    </>
  );
}
