import express from 'express';
import { createAuthMiddleware, requireAdmin } from '../middleware/auth.js';
import { createAdminController } from '../controllers/adminController.js';

export function createAdminRouter(db) {
  const router = express.Router();
  const c = createAdminController(db);

  // Все админ-маршруты требуют валидный токен и роль admin
  router.use(createAuthMiddleware(db), requireAdmin);

  router.get('/users', c.listUsers);
  router.get('/transactions', c.listTransactions);
  router.patch('/users/:id/block', c.setUserBlocked);
  router.delete('/users/:id', c.deleteUser);

  return router;
}
