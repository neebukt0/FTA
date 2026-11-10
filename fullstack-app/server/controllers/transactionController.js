import jwt from 'jsonwebtoken';

const ACCESS_SECRET = 'super-access-secret-key-123';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Нет токена' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Токен невалиден' });
  }
}

export function createTransactionController(db) {
  return {
    async list(req, res) {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const { amount, type, category, description } = req.body;
      await db.run('INSERT INTO transactions (userId, amount, type, category, description, createdAt) VALUES (?,?,?,?,?,?)', [userId, amount, type, category || '', description || '', new Date().toISOString()]);
      const last = await db.get('SELECT last_insert_rowid() as id');
      res.json(await db.get('SELECT * FROM transactions WHERE id = ?', [last.id]));
    },
    async update(req, res) {
      const userId = req.user.id;
      const { id } = req.params;
      const { amount, type, category, description } = req.body;
      await db.run('UPDATE transactions SET amount=?, type=?, category=?, description=? WHERE id=? AND userId=?', [amount, type, category || '', description || '', id, userId]);
      res.json(await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, userId]));
    },
    async remove(req, res) {
      const userId = req.user.id;
      const { id } = req.params;
      await db.run('DELETE FROM transactions WHERE id = ? AND userId = ?', [id, userId]);
      res.json({ ok: true });
    },
  };
}
