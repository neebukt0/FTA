import express from 'express';
import { createTransactionController } from '../controllers/transactionController.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createTransactionRouter(db) {
  const router = express.Router();
  const c = createTransactionController(db);
  router.use(createAuthMiddleware(db));
  router.get('/', c.list);
  router.post('/', c.create);
  router.put('/:id', c.update);
  router.delete('/:id', c.remove);
  return router;
}
