const MONTHS = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const round2 = (value) => Math.round(value * 100) / 100;

export function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Сводка по доходам/расходам */
export function getSummary(items) {
  let income = 0;
  let expense = 0;

  for (const item of items) {
    const amount = Number(item.amount) || 0;
    if (item.type === 'income') income += amount;
    else if (item.type === 'expense') expense += amount;
  }

  return {
    income: round2(income),
    expense: round2(expense),
    balance: round2(income - expense),
    count: items.length,
  };
}


export function getMonthlySeries(items, months = 6) {
  const buckets = new Map();

  if (months > 0) {
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(date);
      buckets.set(key, {
        key,
        label: MONTHS[date.getMonth()],
        income: 0,
        expense: 0,
      });
    }
  }

  for (const item of items) {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) continue;

    const key = monthKey(date);
    if (!buckets.has(key)) {
      if (months > 0) continue; // вне выбранного периода
      buckets.set(key, {
        key,
        label: MONTHS[date.getMonth()],
        income: 0,
        expense: 0,
      });
    }

    const bucket = buckets.get(key);
    const amount = Number(item.amount) || 0;
    if (item.type === 'income') bucket.income += amount;
    else if (item.type === 'expense') bucket.expense += amount;
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      income: round2(bucket.income),
      expense: round2(bucket.expense),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}


export function getCategoryBreakdown(items, type = 'expense', limit = 6) {
  const map = new Map();

  for (const item of items) {
    if (item.type !== type) continue;
    const category = item.category || 'Прочее';
    map.set(category, (map.get(category) || 0) + (Number(item.amount) || 0));
  }

  const sorted = Array.from(map, ([category, total]) => ({ category, total: round2(total) })).sort(
    (a, b) => b.total - a.total
  );

  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);

  if (rest.length > 0) {
    top.push({
      category: 'Прочее',
      total: round2(rest.reduce((sum, r) => sum + r.total, 0)),
    });
  }

  return top;
}
