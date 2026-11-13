// Секреты JWT в одном месте. В продакшене задаются через переменные окружения,
// локально используется предсказуемый fallback для разработки.
export const ACCESS_SECRET = process.env.ACCESS_SECRET || 'super-access-secret-key-123';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super-refresh-secret-key-456';
