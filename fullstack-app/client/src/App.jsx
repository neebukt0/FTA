import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import TransactionsPage from './pages/TransactionsPage';
import { AnalysisDashboardPage } from './pages/AnalysisDashboardPage';
import AdminPage from './pages/AdminPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';

export default function App() {
  const dispatch = useDispatch();

  // При первой загрузке приложения делаем контрольный запрос на /auth/refresh
  // для восстановления сессии по HttpOnly-куке.
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Защищенные роуты */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/analysis" element={<AnalysisDashboardPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/analysis" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/analysis" replace />} />
    </Routes>
  );
}
