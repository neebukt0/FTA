import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from '../features/transactions/transactionsSlice';
import './transactions.css';

const LIMIT = 10;
const SEARCH_DEBOUNCE = 300;

const schema = z.object({
  amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Укажите категорию'),
  description: z.string().optional(),
});

// Строка таблицы  memoized: перерисовывается только при смене данных или обработчиков
const TransactionRow = memo(function TransactionRow({ transaction, onEdit, onDelete }) {
  return (
    <tr>
      <td>{Number(transaction.amount).toFixed(2)}</td>
      <td>
        <span className={`badge badge-${transaction.type}`}>
          {transaction.type === 'income' ? 'доход' : 'расход'}
        </span>
      </td>
      <td>{transaction.category}</td>
      <td>{transaction.description || '—'}</td>
      <td className="col-actions">
        <div className="row-actions">
          <button type="button" className="btn btn-sm" onClick={() => onEdit(transaction)}>
            Изменить
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(transaction.id)}
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function TransactionsPage() {
  const dispatch = useDispatch();
  const { items, total, page, limit, status, error } = useSelector((s) => s.transactions);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense', amount: '', category: '', description: '' },
  });

  // Первую загрузку делаем сразу, а изменения поиска/фильтра — с дебаунсом
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      dispatch(fetchTransactions({ page: 1, limit: LIMIT, search: '', type: '' }));
      return undefined;
    }

    const timer = setTimeout(() => {
      dispatch(fetchTransactions({ page: 1, limit: LIMIT, search, type: typeFilter }));
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [dispatch, search, typeFilter]);

  const loadPage = useCallback(
    (p) => {
      dispatch(fetchTransactions({ page: p, limit: LIMIT, search, type: typeFilter }));
    },
    [dispatch, search, typeFilter]
  );

  const handleEdit = useCallback(
    (transaction) => {
      setEditing(transaction);
      reset({
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
      });
    },
    [reset]
  );

  const handleCancel = useCallback(() => {
    setEditing(null);
    reset({ type: 'expense', amount: '', category: '', description: '' });
  }, [reset]);

  const handleDelete = useCallback(
    async (id) => {
      const result = await dispatch(deleteTransaction(id));
      if (deleteTransaction.fulfilled.match(result)) {
        const newTotal = total - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / limit));
        const targetPage = page > maxPage ? maxPage : page;
        dispatch(fetchTransactions({ page: targetPage, limit, search, type: typeFilter }));
      }
    },
    [dispatch, total, limit, page, search, typeFilter]
  );

  const onSubmit = useCallback(
    async (data) => {
      const result = editing
        ? await dispatch(updateTransaction({ id: editing.id, ...data }))
        : await dispatch(createTransaction(data));

      const succeeded =
        updateTransaction.fulfilled.match(result) || createTransaction.fulfilled.match(result);

      if (succeeded) {
        setEditing(null);
        reset({ type: 'expense', amount: '', category: '', description: '' });
        dispatch(fetchTransactions({ page: 1, limit, search, type: typeFilter }));
      }
    },
    [dispatch, editing, reset, limit, search, typeFilter]
  );

  // Номера страниц вычисляем только при смене total/limit
  const pages = useMemo(() => {
    const totalPages = Math.ceil(total / limit) || 1;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [total, limit]);

  const isLoading = status === 'loading';
  const isFailed = status === 'failed';

  return (
    <div>
      <div className="page-head">
        <h1>Транзакции</h1>
        <p className="page-subtitle">Учёт доходов и расходов</p>
      </div>

      {error && (
        <div className="alert alert-error transaction-error">
          <span>{error}</span>
          <button type="button" className="btn btn-sm" onClick={() => loadPage(page)}>
            Повторить
          </button>
        </div>
      )}

      <section className="card form-card">
        <h2>{editing ? 'Редактировать транзакцию' : 'Новая транзакция'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="tx-form">
          <div className="tx-field">
            <label className="label" htmlFor="amount">
              Сумма
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              className={`input${errors.amount ? ' input-error' : ''}`}
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && <p className="field-error">{errors.amount.message}</p>}
          </div>

          <div className="tx-field">
            <label className="label" htmlFor="type">
              Тип
            </label>
            <select id="type" className="select" {...register('type')}>
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </div>

          <div className="tx-field">
            <label className="label" htmlFor="category">
              Категория
            </label>
            <input
              id="category"
              className={`input${errors.category ? ' input-error' : ''}`}
              placeholder="Например, Продукты"
              {...register('category')}
            />
            {errors.category && <p className="field-error">{errors.category.message}</p>}
          </div>

          <div className="tx-field">
            <label className="label" htmlFor="description">
              Описание
            </label>
            <input
              id="description"
              className="input"
              placeholder="Необязательно"
              {...register('description')}
            />
          </div>

          <div className="tx-actions">
            <button type="submit" className="btn btn-primary">
              {editing ? 'Сохранить' : 'Добавить'}
            </button>
            {editing && (
              <button type="button" className="btn" onClick={handleCancel}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="toolbar">
          <input
            className="input toolbar-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по описанию или категории"
          />
          <select
            className="select toolbar-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Все типы</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>

        {isLoading ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Загрузка транзакций...</p>
          </div>
        ) : isFailed ? (
          <div className="state-block">
            <p>Не удалось загрузить транзакции</p>
            <button type="button" className="btn" onClick={() => loadPage(page)}>
              Повторить
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="state-block">
            <p>Транзакций пока нет</p>
            <p className="state-hint">Добавьте первую транзакцию через форму выше</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Сумма</th>
                    <th>Тип</th>
                    <th>Категория</th>
                    <th>Описание</th>
                    <th className="col-actions">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {pages.length > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => loadPage(page - 1)}
                >
                  ←
                </button>
                {pages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm${p === page ? ' btn-primary' : ''}`}
                    onClick={() => loadPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page >= pages.length}
                  onClick={() => loadPage(page + 1)}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
