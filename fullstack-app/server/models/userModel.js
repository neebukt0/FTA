import bcrypt from 'bcryptjs';
import { TransactionModel } from './transactionModel.js';

export class UserModel {
  static async createTable(db) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT,
        username TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        birthDate TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        savings REAL DEFAULT 0,
        isActivated INTEGER DEFAULT 0,
        isBlocked INTEGER DEFAULT 0,
        activationToken TEXT,
        activationExpires INTEGER,
        resetTokenHash TEXT,
        resetTokenExpires INTEGER,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    await TransactionModel.createTable(db);

    const columnsToAdd = [
      'firstName TEXT',
      'lastName TEXT',
      'username TEXT',
      'phone TEXT',
      'birthDate TEXT',
      "role TEXT DEFAULT 'user'",
      'savings REAL DEFAULT 0',
      'isActivated INTEGER DEFAULT 0',
      'isBlocked INTEGER DEFAULT 0',
      'activationToken TEXT',
      'activationExpires INTEGER',
      'resetTokenHash TEXT',
      'resetTokenExpires INTEGER',
      'createdAt TEXT',
      'updatedAt TEXT',
    ];

    for (const col of columnsToAdd) {
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
      } catch (e) {}
    }
  }

  static async findByEmailOrUsername(db, login) {
    return await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [login, login]);
  }

  static async findByEmail(db, email) {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(db, id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  /** Все пользователи с агрегатами по транзакциям — для админ-панели. */
  static async listAll(db) {
    return await db.all(`
      SELECT
        u.id,
        u.firstName,
        u.lastName,
        u.username,
        u.email,
        u.phone,
        COALESCE(u.role, 'user') AS role,
        COALESCE(u.savings, 0) AS savings,
        COALESCE(u.isActivated, 0) AS isActivated,
        COALESCE(u.isBlocked, 0) AS isBlocked,
        u.createdAt,
        COUNT(t.id) AS transactionsCount,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS totalIncome,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS totalExpense
      FROM users u
      LEFT JOIN transactions t ON t.userId = u.id
      GROUP BY u.id
      ORDER BY u.id
    `);
  }

  static async setBlocked(db, id, blocked) {
    return await db.run('UPDATE users SET isBlocked = ? WHERE id = ?', [blocked ? 1 : 0, id]);
  }

  /** Удаляет пользователя вместе с его транзакциями в одной транзакции БД. */
  static async deleteById(db, id) {
    await db.exec('BEGIN');
    try {
      await db.run('DELETE FROM transactions WHERE userId = ?', [id]);
      const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
      await db.exec('COMMIT');
      return result.changes > 0;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  /** Сколько останется активных админов, если исключить указанного пользователя. */
  static async countActiveAdminsExcept(db, userId) {
    const row = await db.get(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND COALESCE(isBlocked, 0) = 0 AND id != ?",
      [userId]
    );
    return row?.c || 0;
  }

  static async create(db, userData) {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      birthDate,
      password,
      role = 'user',
      savings = 0,
      activationToken,
      activationExpires,
      createdAt,
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';

    const result = await db.run(
      `INSERT INTO users (
        firstName, lastName, username, email, phone, birthDate, 
        password, role, savings, isActivated, activationToken, activationExpires, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        firstName,
        lastName,
        username,
        email,
        cleanedPhone,
        birthDate,
        hashedPassword,
        role,
        savings,
        activationToken,
        activationExpires,
        createdAt,
      ]
    );

    return await this.findById(db, result.lastID);
  }

  static async updateActivation(db, email, activationToken, activationExpires) {
    await db.run(
      'UPDATE users SET activationToken = ?, activationExpires = ? WHERE email = ?',
      [activationToken, activationExpires, email]
    );
  }

  static async activateUser(db, email) {
    await db.run(
      'UPDATE users SET isActivated = 1, activationToken = NULL, activationExpires = NULL WHERE email = ?',
      [email]
    );
  }

  static async updatePasswordAndClearReset(db, email, hashedPassword) {
    await db.run(
      'UPDATE users SET password = ?, resetTokenHash = NULL, resetTokenExpires = NULL WHERE email = ?',
      [hashedPassword, email]
    );
  }

  static async setResetToken(db, email, resetTokenHash, resetTokenExpires) {
    await db.run(
      'UPDATE users SET resetTokenHash = ?, resetTokenExpires = ? WHERE email = ?',
      [resetTokenHash, resetTokenExpires, email]
    );
  }
}
