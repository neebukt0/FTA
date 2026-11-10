import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../features/transactions/transactionsSlice';

const schema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  description: z.string().optional(),
});

export default function TransactionsPage() {
  const dispatch = useDispatch();
  const { items, total, page, limit } = useSelector((s) => s.transactions);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = (p = 1) => dispatch(fetchTransactions({ page: p, limit: 10, search, type: typeFilter }));

  useEffect(() => { load(1); }, [search, typeFilter]);

  const onSubmit = (data) => {
    if (editing) { dispatch(updateTransaction({ id: editing.id, ...data })); setEditing(null); }
    else dispatch(createTransaction(data));
    reset();
  };

  const startEdit = (t) => { setEditing(t); reset(t); };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <h2>Transactions</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="number" step="0.01" {...register('amount')} placeholder="amount" />
        {errors.amount && <span>amount required</span>}
        <select {...register('type')}><option value="income">income</option><option value="expense">expense</option></select>
        <input {...register('category')} placeholder="category" />
        <input {...register('description')} placeholder="description" />
        <button type="submit">{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); reset(); }}>Cancel</button>}
      </form>

      <div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">all</option><option value="income">income</option><option value="expense">expense</option>
        </select>
      </div>

      <table>
        <thead><tr><th>Amount</th><th>Type</th><th>Category</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>{t.amount}</td><td>{t.type}</td><td>{t.category}</td><td>{t.description}</td>
              <td>
                <button onClick={() => startEdit(t)}>Edit</button>
                <button onClick={() => dispatch(deleteTransaction(t.id))}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => load(p)} disabled={p === page}>{p}</button>
        ))}
      </div>
    </div>
  );
}
