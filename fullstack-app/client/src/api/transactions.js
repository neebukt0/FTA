import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('accessToken');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export default api;
export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id) => api.delete(`/transactions/${id}`),
};
