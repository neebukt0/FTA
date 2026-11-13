import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../features/transactions/transactionsSlice';
import {
  formatMoney,
  getCategoryBreakdown,
  getMonthlySeries,
  getSummary,
} from '../features/analytics/analyticsUtils';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';
import './dashboard.css';

const PERIODS = [
  { value: 6, label: '6 месяцев' },
  { value: 12, label: '12 месяцев' },
  { value: 0, label: 'Всё время' },
];

const StatCard = memo(function StatCard({ label, value, variant = '' }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${variant}`}>{value}</div>
    </div>
  );
});

export function AnalysisDashboardPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.transactions);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    dispatch(fetchTransactions({ page: 1, limit: 1000, search: '', type: '' }));
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(fetchTransactions({ page: 1, limit: 1000, search: '', type: '' }));
  }, [dispatch]);

  // Агрегации выполняем только при смене данных или периода
  const summary = useMemo(() => getSummary(items), [items]);
  const monthly = useMemo(() => getMonthlySeries(items, months === 0 ? 0 : months), [items, months]);
  const categories = useMemo(() => getCategoryBreakdown(items, 'expense', 6), [items]);

  const handlePeriodChange = useCallback((value) => {
    setMonths(value);
  }, []);

  const isLoading = status === 'loading';
  const isFailed = status === 'failed';
  const isEmpty = status === 'succeeded' && items.length === 0;

  return (
    <div>
      <div className="dashboard-head">
        <div>
          <h1>Аналитика</h1>
          <p className="page-subtitle">Финансовая аналитика по вашим транзакциям</p>
        </div>

        <div className="period-switch">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              className={`btn btn-sm${months === period.value ? ' btn-primary' : ''}`}
              onClick={() => handlePeriodChange(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error transaction-error">
          <span>{error}</span>
          <button type="button" className="btn btn-sm" onClick={handleRetry}>
            Повторить
          </button>
        </div>
      )}

      {isLoading && (
        <div className="card state-block">
          <div className="spinner" />
          <p>Загрузка данных...</p>
        </div>
      )}

      {isFailed && (
        <div className="card state-block">
          <p>Не удалось загрузить данные</p>
          <button type="button" className="btn" onClick={handleRetry}>
            Повторить
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="card state-block">
          <p>Нет данных для анализа</p>
          <p className="state-hint">Добавьте транзакции, чтобы увидеть графики</p>
          <Link className="btn btn-primary" to="/transactions">
            Добавить транзакцию
          </Link>
        </div>
      )}

      {status === 'succeeded' && items.length > 0 && (
        <>
          <div className="grid grid-stats">
            <StatCard label="Доходы" value={formatMoney(summary.income)} variant="income" />
            <StatCard label="Расходы" value={formatMoney(summary.expense)} variant="expense" />
            <StatCard
              label="Баланс"
              value={formatMoney(summary.balance)}
              variant={summary.balance >= 0 ? 'income' : 'expense'}
            />
            <StatCard label="Транзакций" value={summary.count} />
          </div>

          <div className="grid grid-charts dashboard-charts">
            <section className="card chart-card">
              <h3>Доходы и расходы по месяцам</h3>
              <BarChart data={monthly} />
            </section>

            <section className="card chart-card">
              <h3>Расходы по категориям</h3>
              {categories.length > 0 ? (
                <DonutChart data={categories} />
              ) : (
                <div className="state-block">
                  <p>Расходов пока нет</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
