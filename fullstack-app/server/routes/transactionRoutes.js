import express from 'express';
import { createTransactionController, authMiddleware } from '../controllers/transactionController.js';

export function createTransactionRouter(db) {
  const router = express.Router();
  const c = createTransactionController(db);
  router.use(authMiddleware);
  router.get('/', c.list);
  router.post('/', c.create);
  router.put('/:id', c.update);
  router.delete('/:id', c.remove);
  return router;
}
