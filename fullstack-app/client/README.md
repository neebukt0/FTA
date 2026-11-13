# Finance Tracker — клиент

React 19 + Vite клиент для приложения учёта финансов.

Полная документация проекта — в [../README.md](../README.md).

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
```

API проксируется на `http://localhost:5000` через `vite.config.js`.

## Структура

- `src/pages` — страницы (`/login`, `/register`, `/transactions`, `/analysis`)
- `src/components` — `Layout`, `ProtectedRoute`, `AuthLayout`, SVG-графики
- `src/features` — Redux-слайсы (`auth`, `transactions`) и утилиты аналитики
- `src/api` — axios-клиенты
- `src/app` — store и хранилище access-токена

## Скрипты

- `npm run dev` — dev-сервер
- `npm run build` — production-сборка
- `npm run lint` — ESLint
- `npm run preview` — предпросмотр сборки
