function validateTransaction({ amount, type, category }) {
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return 'Некорректная сумма транзакции';
  }
  if (!['income', 'expense'].includes(type)) {
    return 'Неверный тип транзакции';
  }
  if (!category || !String(category).trim()) {
    return 'Укажите категорию';
  }
  return null;
}

/** Вклад транзакции в баланс: доход увеличивает накопления, расход уменьшает. */
function signedAmount(type, amount) {
  const value = Number(amount);
  return type === 'expense' ? -value : value;
}

export function createTransactionController(db) {
  return {
    async list(req, res) {
      const userId = req.user.userId;
      const { page = 1, limit = 10, search = '', type = '', category = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      let where = 'WHERE userId = ?';
      const params = [userId];
      if (type) { where += ' AND type = ?'; params.push(type); }
      if (category) { where += ' AND category = ?'; params.push(category); }
      if (search) { where += ' AND (description LIKE ? OR category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      const total = await db.get(`SELECT COUNT(*) as c FROM transactions ${where}`, params);
      const rows = await db.all(`SELECT * FROM transactions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
      res.json({ data: rows, total: total.c, page: Number(page), limit: Number(limit) });
    },

    async create(req, res) {
      const userId = req.user.userId;
      const { amount, type, category, description } = req.body;
      const validationError = validateTransaction({ amount, type, category });
      if (validationError) return res.status(400).json({ message: validationError });

      const numericAmount = Number(amount);

      await db.exec('BEGIN');
      try {
        const result = await db.run(
          'INSERT INTO transactions (userId, amount, type, category, description, createdAt) VALUES (?,?,?,?,?,?)',
          [userId, numericAmount, type, category || '', description || '', new Date().toISOString()]
        );
        await db.run(
          'UPDATE users SET savings = COALESCE(savings, 0) + ? WHERE id = ?',
          [signedAmount(type, numericAmount), userId]
        );
        const created = await db.get('SELECT * FROM transactions WHERE id = ?', [result.lastID]);
        await db.exec('COMMIT');
        return res.json(created);
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    },

    async update(req, res) {
      const userId = req.user.userId;
      const { id } = req.params;
      const { amount, type, category, description } = req.body;
      const validationError = validateTransaction({ amount, type, category });
      if (validationError) return res.status(400).json({ message: validationError });

      const existing = await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
      if (!existing) return res.status(404).json({ message: 'Транзакция не найдена' });

      const numericAmount = Number(amount);
      // Баланс меняем только на разницу между новой и старой транзакцией.
      const balanceDelta = signedAmount(type, numericAmount) - signedAmount(existing.type, existing.amount);

      await db.exec('BEGIN');
      try {
        await db.run(
          'UPDATE transactions SET amount=?, type=?, category=?, description=? WHERE id=? AND userId=?',
          [numericAmount, type, category || '', description || '', id, userId]
        );
        if (balanceDelta !== 0) {
          await db.run(
            'UPDATE users SET savings = COALESCE(savings, 0) + ? WHERE id = ?',
            [balanceDelta, userId]
          );
        }
        const updated = await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
        await db.exec('COMMIT');
        return res.json(updated);
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    },

    async remove(req, res) {
      const userId = req.user.userId;
      const { id } = req.params;

      const existing = await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
      if (!existing) return res.status(404).json({ message: 'Транзакция не найдена' });

      await db.exec('BEGIN');
      try {
        await db.run('DELETE FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
        await db.run(
          'UPDATE users SET savings = COALESCE(savings, 0) - ? WHERE id = ?',
          [signedAmount(existing.type, existing.amount), userId]
        );
        await db.exec('COMMIT');
        return res.json({ ok: true });
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
