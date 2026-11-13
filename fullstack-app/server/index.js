import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDB } from './db.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createTransactionRouter } from './routes/transactionRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

initDB().then((db) => {
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/transactions', createTransactionRouter(db));
  app.use('/api/admin', createAdminRouter(db));

  app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
});
