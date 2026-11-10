import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { UserModel } from './models/userModel.js';
import { seedDB } from './seed.js';

export async function initDB() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  await UserModel.createTable(db);

  await seedDB(db);

  return db;
}
