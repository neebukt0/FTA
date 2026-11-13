import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { adminApi } from '../api/admin';
import './admin.css';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE = 300;

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

function formatMoney(value) {
  return money.format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU');
}

function userLabel(user) {
  const name = [user.userFirstName, user.userLastName].filter(Boolean).join(' ');
  if (name) return name;
  return user.userUsername || user.userEmail || `Пользователь #${user.userId}`;
}

export default function AdminPage() {
  const currentUser = useSelector((state) => state.auth.user);

  const [tab, setTab] = useState('users');
  const [notice, setNotice] = useState(null);

  // Пользователи
  const [users, setUsers] = useState([]);
  const [usersStatus, setUsersStatus] = useState('loading');
  const [usersError, setUsersError] = useState(null);
  const [busyUserId, setBusyUserId] = useState(null);

  // Транзакции
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('idle');
  const [txError, setTxError] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await adminApi.users();
      setUsers(data.data);
      setUsersError(null);
      setUsersStatus('succeeded');
    } catch (error) {
      setUsersError(error.response?.data?.message || 'Не удалось загрузить пользователей');
      setUsersStatus('failed');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    adminApi
      .users()
      .then(({ data }) => {
        if (cancelled) return;
        setUsers(data.data);
        setUsersError(null);
        setUsersStatus('succeeded');
      })
      .catch((error) => {
        if (cancelled) return;
        setUsersError(error.response?.data?.message || 'Не удалось загрузить пользователей');
        setUsersStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadUsers = useCallback(() => {
    setUsersStatus('loading');
    setUsersError(null);
    return loadUsers();
  }, [loadUsers]);

  const loadTransactions = useCallback(async (page, search, type) => {
    try {
      const { data } = await adminApi.transactions({
        page,
        limit: PAGE_SIZE,
        search,
        type,
      });
      setTransactions(data.data);
      setTxTotal(data.total);
      setTxError(null);
      setTxStatus('succeeded');
    } catch (error) {
      setTxError(error.response?.data?.message || 'Не удалось загрузить транзакции');
      setTxStatus('failed');
    }
  }, []);

  // Загружаем транзакции при открытии вкладки и при изменении поиска/фильтра
  useEffect(() => {
    if (tab !== 'transactions') return undefined;

    const timer = setTimeout(() => {
      setTxStatus('loading');
      loadTransactions(txPage, txSearch, txType);
    }, SEARCH_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [tab, txPage, txSearch, txType, loadTransactions]);

  const toggleBlock = useCallback(
    async (user) => {
      const nextBlocked = !user.isBlocked;
      const question = nextBlocked
        ? `Заблокировать пользователя ${user.email}?`
        : `Разблокировать пользователя ${user.email}?`;
      if (!window.confirm(question)) return;

      setBusyUserId(user.id);
      setUsersError(null);
      setNotice(null);
      try {
        await adminApi.setBlocked(user.id, nextBlocked);
        setNotice(
          nextBlocked
            ? `Пользователь ${user.email} заблокирован`
            : `Пользователь ${user.email} разблокирован`
        );
        await loadUsers();
      } catch (error) {
        setUsersError(error.response?.data?.message || 'Не удалось изменить статус пользователя');
      } finally {
        setBusyUserId(null);
      }
    },
    [loadUsers]
  );

  const deleteUser = useCallback(
    async (user) => {
      if (
        !window.confirm(
          `Удалить пользователя ${user.email} вместе со всеми его транзакциями? Действие необратимо.`
        )
      ) {
        return;
      }

      setBusyUserId(user.id);
      setUsersError(null);
      setNotice(null);
      try {
        await adminApi.removeUser(user.id);
        setNotice(`Пользователь ${user.email} удалён`);
        await loadUsers();
      } catch (error) {
        setUsersError(error.response?.data?.message || 'Не удалось удалить пользователя');
      } finally {
        setBusyUserId(null);
      }
    },
    [loadUsers]
  );

  const handleTxSearch = useCallback((event) => {
    setTxSearch(event.target.value);
    setTxPage(1);
  }, []);

  const handleTxType = useCallback((event) => {
    setTxType(event.target.value);
    setTxPage(1);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(txTotal / PAGE_SIZE)),
    [txTotal]
  );

  return (
    <div>
      <div className="page-head">
        <h1>Админ-панель</h1>
        <p className="page-subtitle">Управление пользователями и просмотр всех транзакций</p>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {usersError && <div className="alert alert-error">{usersError}</div>}

      <div className="admin-tabs">
        <button
          type="button"
          className={`btn${tab === 'users' ? ' btn-primary' : ''}`}
          onClick={() => setTab('users')}
        >
          Пользователи ({users.length})
        </button>
        <button
          type="button"
          className={`btn${tab === 'transactions' ? ' btn-primary' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Транзакции
        </button>
        <button type="button" className="btn btn-ghost" onClick={reloadUsers}>
          Обновить
        </button>
      </div>

      {tab === 'users' ? (
        <section className="card">
          {usersStatus === 'loading' ? (
            <div className="state-block">
              <div className="spinner" />
              <p>Загрузка пользователей...</p>
            </div>
          ) : usersStatus === 'failed' ? (
            <div className="state-block">
              <p>Не удалось загрузить пользователей</p>
              <button type="button" className="btn" onClick={reloadUsers}>
                Повторить
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="state-block">
              <p>Пользователей пока нет</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th>Транзакций</th>
                    <th>Доходы</th>
                    <th>Расходы</th>
                    <th>Баланс</th>
                    <th className="col-actions">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.userId;
                    const busy = busyUserId === user.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-user">
                            <span className="admin-user-name">
                              {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                                user.username ||
                                '—'}
                              {isSelf && <span className="admin-self"> (вы)</span>}
                            </span>
                            <span className="admin-user-meta">{user.email}</span>
                            {user.username && (
                              <span className="admin-user-meta">@{user.username}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              user.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'
                            }`}
                          >
                            {user.role === 'admin' ? 'админ' : 'пользователь'}
                          </span>
                        </td>
                        <td>
                          {user.isBlocked ? (
                            <span className="badge badge-blocked">заблокирован</span>
                          ) : user.isActivated ? (
                            <span className="badge badge-active">активен</span>
                          ) : (
                            <span className="badge badge-pending">не активирован</span>
                          )}
                        </td>
                        <td>{user.transactionsCount}</td>
                        <td className="admin-money income">{formatMoney(user.totalIncome)}</td>
                        <td className="admin-money expense">{formatMoney(user.totalExpense)}</td>
                        <td className="admin-money">{formatMoney(user.savings)}</td>
                        <td className="col-actions">
                          <div className="admin-actions">
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={isSelf || busy}
                              onClick={() => toggleBlock(user)}
                            >
                              {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={isSelf || busy}
                              onClick={() => deleteUser(user)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <div className="admin-toolbar">
            <input
              className="input"
              value={txSearch}
              onChange={handleTxSearch}
              placeholder="Поиск по описанию, категории, email или username"
            />
            <select className="select" value={txType} onChange={handleTxType}>
              <option value="">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>

          {txStatus === 'loading' ? (
            <div className="state-block">
              <div className="spinner" />
              <p>Загрузка транзакций...</p>
            </div>
          ) : txStatus === 'failed' ? (
            <div className="state-block">
              <p>{txError || 'Не удалось загрузить транзакции'}</p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setTxStatus('loading');
                  loadTransactions(txPage, txSearch, txType);
                }}
              >
                Повторить
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="state-block">
              <p>Транзакций не найдено</p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Пользователь</th>
                      <th>Сумма</th>
                      <th>Тип</th>
                      <th>Категория</th>
                      <th>Описание</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>
                          <div className="admin-user">
                            <span className="admin-user-name">{userLabel(tx)}</span>
                            <span className="admin-user-meta">{tx.userEmail}</span>
                          </div>
                        </td>
                        <td className="admin-money">{formatMoney(tx.amount)}</td>
                        <td>
                          <span className={`badge badge-${tx.type}`}>
                            {tx.type === 'income' ? 'доход' : 'расход'}
                          </span>
                        </td>
                        <td>{tx.category || '—'}</td>
                        <td>{tx.description || '—'}</td>
                        <td>{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination admin-pagination">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                  <span className="admin-page-info">
                    Страница {txPage} из {totalPages} · всего {txTotal}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={txPage >= totalPages}
                    onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
