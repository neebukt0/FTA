import { UserModel } from '../models/userModel.js';

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role || 'user',
    savings: Number(user.savings) || 0,
    isActivated: !!user.isActivated,
    isBlocked: !!user.isBlocked,
    createdAt: user.createdAt,
    transactionsCount: Number(user.transactionsCount) || 0,
    totalIncome: Number(user.totalIncome) || 0,
    totalExpense: Number(user.totalExpense) || 0,
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createAdminController(db) {
  return {
    // GET /api/admin/users
    async listUsers(req, res) {
      try {
        const rows = await UserModel.listAll(db);
        return res.json({ data: rows.map(sanitizeUser) });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Не удалось загрузить пользователей' });
      }
    },

    // GET /api/admin/transactions?page=1&limit=20&search=&type=&userId=
    async listTransactions(req, res) {
      try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const { search = '', type = '', userId = '' } = req.query;

        let where = 'WHERE 1 = 1';
        const params = [];

        if (type === 'income' || type === 'expense') {
          where += ' AND t.type = ?';
          params.push(type);
        }

        if (userId) {
          const parsedUserId = parseId(userId);
          if (!parsedUserId) {
            return res.status(400).json({ message: 'Некорректный userId' });
          }
          where += ' AND t.userId = ?';
          params.push(parsedUserId);
        }

        if (search) {
          where += ' AND (t.description LIKE ? OR t.category LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
          const like = `%${search}%`;
          params.push(like, like, like, like);
        }

        const total = await db.get(
          `SELECT COUNT(*) AS c FROM transactions t JOIN users u ON u.id = t.userId ${where}`,
          params
        );

        const rows = await db.all(
          `SELECT
             t.id, t.userId, t.amount, t.type, t.category, t.description, t.createdAt,
             u.email AS userEmail,
             u.username AS userUsername,
             u.firstName AS userFirstName,
             u.lastName AS userLastName
           FROM transactions t
           JOIN users u ON u.id = t.userId
           ${where}
           ORDER BY t.id DESC
           LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return res.json({ data: rows, total: total?.c || 0, page, limit });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Не удалось загрузить транзакции' });
      }
    },

    // PATCH /api/admin/users/:id/block  { blocked: boolean }
    async setUserBlocked(req, res) {
      try {
        const id = parseId(req.params.id);
        if (!id) {
          return res.status(400).json({ message: 'Некорректный id пользователя' });
        }

        const { blocked } = req.body;
        if (typeof blocked !== 'boolean') {
          return res.status(400).json({ message: 'Поле blocked должно быть boolean' });
        }

        const target = await UserModel.findById(db, id);
        if (!target) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (id === req.user.userId) {
          return res.status(400).json({ message: 'Нельзя заблокировать собственный аккаунт' });
        }

        if (blocked && target.role === 'admin') {
          const otherAdmins = await UserModel.countActiveAdminsExcept(db, id);
          if (otherAdmins === 0) {
            return res.status(400).json({ message: 'Нельзя заблокировать последнего администратора' });
          }
        }

        await UserModel.setBlocked(db, id, blocked);

        return res.json({
          message: blocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
          user: sanitizeUser({ ...target, isBlocked: blocked }),
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Не удалось изменить статус пользователя' });
      }
    },

    // DELETE /api/admin/users/:id
    async deleteUser(req, res) {
      try {
        const id = parseId(req.params.id);
        if (!id) {
          return res.status(400).json({ message: 'Некорректный id пользователя' });
        }

        const target = await UserModel.findById(db, id);
        if (!target) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (id === req.user.userId) {
          return res.status(400).json({ message: 'Нельзя удалить собственный аккаунт' });
        }

        if (target.role === 'admin') {
          const otherAdmins = await UserModel.countActiveAdminsExcept(db, id);
          if (otherAdmins === 0) {
            return res.status(400).json({ message: 'Нельзя удалить последнего администратора' });
          }
        }

        const deleted = await UserModel.deleteById(db, id);
        if (!deleted) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        return res.json({ ok: true, message: 'Пользователь удалён' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Не удалось удалить пользователя' });
      }
    },
  };
}
