import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { UserModel } from './models/userModel.js';
import { seedDB } from './seed.js';

/**
 * Адаптер над встроенным в Node модулем `node:sqlite` (Node >= 22.5).
 * Повторяет асинхронный API пакета `sqlite`, поэтому модели и контроллеры
 * продолжают использовать привычные db.get / db.all / db.run / db.exec.
 * Это избавляет проект от нативной сборки sqlite3 и Visual Studio.
 */
class SQLiteAdapter {
  constructor(filename) {
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async exec(sql) {
    this.db.exec(sql);
  }

  async get(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  async all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  async run(sql, params = []) {
    const result = this.db.prepare(sql).run(...params);
    return {
      ...result,
      // node:sqlite отдаёт lastInsertRowid, а модели используют lastID
      lastID: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async close() {
    this.db.close();
  }
}

export async function initDB() {
  const filename = path.resolve(process.cwd(), 'database.sqlite');
  const db = new SQLiteAdapter(filename);

  await UserModel.createTable(db);
  await seedDB(db);

  return db;
}
