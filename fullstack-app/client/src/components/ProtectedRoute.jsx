import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const { user, isLoading } = useSelector((state) => state.auth);

  // Пока идет асинхронный запрос на /auth/refresh, показываем экран загрузки
  if (isLoading) {
    return (
      <div className="state-block">
        <div className="spinner" />
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  // Если пользователя нет в Redux — перенаправляем на /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
