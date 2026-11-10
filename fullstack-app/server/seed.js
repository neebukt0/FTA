import bcrypt from 'bcryptjs';
import { UserModel } from './models/userModel.js';
import { TransactionModel } from './models/transactionModel.js';

export async function seedDB(db) {
  const adminEmail = 'admin@example.com';
  const existing = await UserModel.findByEmail(db, adminEmail);
  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10);
    await db.run(
      `INSERT INTO users (firstName, lastName, username, email, phone, password, role, savings, isActivated, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Admin', 'User', 'admin', adminEmail, '', hashed, 'admin', 1000, 1, new Date().toISOString()]
    );
  }

  const admin = await UserModel.findByEmail(db, adminEmail);

  const count = await db.get('SELECT COUNT(*) as c FROM transactions WHERE userId = ?', [admin.id]);
  if (!count || count.c === 0) {
    const samples = [
      { amount: 500, type: 'income', category: 'Salary', description: 'Initial salary' },
      { amount: 100, type: 'expense', category: 'Food', description: 'Groceries' },
      { amount: 50, type: 'expense', category: 'Transport', description: 'Fuel' },
    ];
    for (const s of samples) {
      await TransactionModel.add(db, admin.id, s, UserModel);
    }
  }
}
