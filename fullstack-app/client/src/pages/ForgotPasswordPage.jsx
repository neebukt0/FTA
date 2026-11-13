import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetPassword } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 - запрос email, 2 - ввод токена и нового пароля
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, message } = useSelector((state) => state.auth);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const result = await dispatch(forgotPassword(email));
    setLoading(false);

    if (forgotPassword.fulfilled.match(result)) {
      setStep(2);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;

    setLoading(true);
    const result = await dispatch(resetPassword({ email, token, newPassword }));
    setLoading(false);

    if (resetPassword.fulfilled.match(result)) {
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <AuthLayout
      title="Восстановление пароля"
      footer={
        <>
          Вспомнили пароль? <Link to="/login">Войти</Link>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {step === 1 ? (
        <form onSubmit={handleRequestSubmit}>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Отправка...' : 'Отправить инструкции'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit}>
          <div className="field">
            <label className="label" htmlFor="token">Токен из консоли сервера</label>
            <input
              id="token"
              className="input"
              placeholder="Введите токен"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="newPassword">Новый пароль</label>
            <input
              id="newPassword"
              type="password"
              className="input"
              placeholder="Не менее 6 символов"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Сохранение...' : 'Установить новый пароль'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
