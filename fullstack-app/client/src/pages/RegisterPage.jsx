import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, registerUser } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

// Простая маска телефона +7 (XXX) XXX-XX-XX
const formatPhone = (raw) => {
  let value = raw.replace(/\D/g, '');
  if (value.startsWith('7') || value.startsWith('8')) {
    value = value.substring(1);
  }

  let formatted = '+7';
  if (value.length > 0) formatted += ' (' + value.substring(0, 3);
  if (value.length >= 4) formatted += ') ' + value.substring(3, 6);
  if (value.length >= 7) formatted += '-' + value.substring(6, 8);
  if (value.length >= 9) formatted += '-' + value.substring(8, 10);

  return formatted;
};

// Все правила проверки полей регистрации собраны в одну схему.
const schema = z
  .object({
    firstName: z.string().trim().min(1, 'Введите имя'),
    lastName: z.string().trim().min(1, 'Введите фамилию'),
    username: z
      .string()
      .trim()
      .min(3, 'От 3 до 20 символов')
      .max(20, 'От 3 до 20 символов')
      .regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры и _'),
    email: z
      .string()
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Некорректный адрес электронной почты'),
    phone: z
      .string()
      .refine((value) => value.replace(/\D/g, '').length === 11, 'Введите номер полностью'),
    birthDate: z.string().min(1, 'Укажите дату рождения'),
    password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

const inputClass = (fieldError) => `input${fieldError ? ' input-error' : ''}`;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      birthDate: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    // Убираем прошлую ошибку сервера перед новой попыткой.
    dispatch(clearError());

    const result = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(result)) {
      navigate('/analysis');
    }
  };

  return (
    <AuthLayout
      title="Регистрация"
      footer={
        <>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="label" htmlFor="firstName">Имя *</label>
          <input
            id="firstName"
            className={inputClass(errors.firstName)}
            placeholder="Введите имя"
            {...register('firstName')}
          />
          {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="lastName">Фамилия *</label>
          <input
            id="lastName"
            className={inputClass(errors.lastName)}
            placeholder="Введите фамилию"
            {...register('lastName')}
          />
          {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="username">Имя пользователя (username) *</label>
          <input
            id="username"
            className={inputClass(errors.username)}
            placeholder="От 3 до 20 символов (латиница, цифры)"
            {...register('username')}
          />
          {errors.username && <p className="field-error">{errors.username.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="email">Электронная почта *</label>
          <input
            id="email"
            type="email"
            className={inputClass(errors.email)}
            placeholder="example@domain.com"
            {...register('email')}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">Номер телефона *</label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <input
                id="phone"
                type="tel"
                className={inputClass(errors.phone)}
                placeholder="+7 (___) ___-__-__"
                name={field.name}
                value={field.value}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="birthDate">Дата рождения *</label>
          <input
            id="birthDate"
            type="date"
            className={inputClass(errors.birthDate)}
            {...register('birthDate')}
          />
          {errors.birthDate && <p className="field-error">{errors.birthDate.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Пароль *</label>
          <div className="password-wrap">
            <input
              id="password"
              className={inputClass(errors.password)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Не менее 6 символов"
              autoComplete="new-password"
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
          {errors.password ? (
            <p className="field-error">{errors.password.message}</p>
          ) : (
            <p className="form-hint">Требования: минимум 6 символов.</p>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">Подтверждение пароля *</label>
          <div className="password-wrap">
            <input
              id="confirmPassword"
              className={inputClass(errors.confirmPassword)}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="field-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block">
          {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
      </form>
    </AuthLayout>
  );
}
