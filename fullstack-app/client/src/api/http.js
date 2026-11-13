import axios from 'axios';
import { getAccessToken } from '../app/tokenStorage';

// Единственный axios-инстанс приложения.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // отправляем HttpOnly refresh-куку
});

// Access-токен передаём в заголовке Authorization
api.interceptors.request.use((cfg) => {
  const token = getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
