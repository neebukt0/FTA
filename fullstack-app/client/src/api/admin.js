import api from './http';

export const adminApi = {
  users: () => api.get('/admin/users'),
  transactions: (params) => api.get('/admin/transactions', { params }),
  setBlocked: (id, blocked) => api.patch(`/admin/users/${id}/block`, { blocked }),
  removeUser: (id) => api.delete(`/admin/users/${id}`),
};
