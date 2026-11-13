import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, loginUser } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

// Проверка полей входа описана одной схемой.
const schema = z.object({
  login: z.string().trim().min(1, 'Введите email или username'),
  password: z.string().min(1, 'Введите пароль'),
});

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const onSubmit = async (data) => {
    // Убираем прошлую ошибку сервера, чтобы она не висела во время нового запроса.
    dispatch(clearError());

    const result = await dispatch(loginUser(data));

    if (loginUser.fulfilled.match(result)) {
      navigate('/analysis');
    }
  };

  return (
    <AuthLayout
      title="Вход в систему"
      footer={
        <>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="label" htmlFor="login">
            Email или Username
          </label>
          <input
            id="login"
            className={`input${errors.login ? ' input-error' : ''}`}
            placeholder="Введите email или username"
            autoComplete="username"
            {...register('login')}
          />
          {errors.login && <p className="field-error">{errors.login.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Пароль
          </label>
          <div className="password-wrap">
            <input
              id="password"
              className={`input${errors.password ? ' input-error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Введите пароль"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <div style={{ textAlign: 'right', marginBottom: 15 }}>
          <Link to="/forgot-password" style={{ fontSize: 12 }}>
            Забыли пароль?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block">
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </AuthLayout>
  );
}
