import jwt from 'jsonwebtoken';
import { ACCESS_SECRET } from '../config.js';
import { UserModel } from '../models/userModel.js';

/**
 * Проверяет access-токен и актуальное состояние пользователя в БД.
 * Дополнительно запрещает доступ заблокированным аккаунтам,
 * чтобы блокировка действовала сразу, не дожидаясь истечения токена.
 */
export function createAuthMiddleware(db) {
  return async function authMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет токена' });
      }

      const token = header.slice(7);
      let decoded;
      try {
        decoded = jwt.verify(token, ACCESS_SECRET);
      } catch {
        return res.status(401).json({ message: 'Токен невалиден или истёк' });
      }

      const user = await UserModel.findById(db, decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Аккаунт заблокирован администратором' });
      }

      // Роль берём из БД, а не из токена: если права отозваны,
      // это сработает сразу, а не через 15 минут.
      req.user = {
        ...decoded,
        role: user.role || 'user',
        isBlocked: !!user.isBlocked,
      };

      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Ошибка проверки авторизации' });
    }
  };
}

/** Пропускает только администраторов. Ставится после authMiddleware. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для администратора' });
  }
  return next();
}
