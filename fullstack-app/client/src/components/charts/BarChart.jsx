import { memo, useMemo } from 'react';
import { formatMoney } from '../../features/analytics/analyticsUtils';

const WIDTH = 640;
const CHART_HEIGHT = 220;
const LABEL_HEIGHT = 28;

/** Столбчатая диаграмма доходов и расходов по месяцам (SVG, без внешних библиотек) */
export const BarChart = memo(function BarChart({ data }) {
  const maxValue = useMemo(
    () => Math.max(1, ...data.flatMap((d) => [d.income, d.expense])),
    [data]
  );

  const groupWidth = WIDTH / Math.max(1, data.length);
  const barWidth = Math.min(28, groupWidth / 3);

  return (
    <div className="chart">
      <div className="chart-legend">
        <span className="legend-item">
          <i className="dot dot-income" />
          Доходы
        </span>
        <span className="legend-item">
          <i className="dot dot-expense" />
          Расходы
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${CHART_HEIGHT + LABEL_HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label="Доходы и расходы по месяцам"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            x2={WIDTH}
            y1={CHART_HEIGHT * (1 - ratio)}
            y2={CHART_HEIGHT * (1 - ratio)}
            className="grid-line"
          />
        ))}

        {data.map((d, index) => {
          const groupX = index * groupWidth;
          const centerX = groupX + groupWidth / 2;
          const incomeHeight = (d.income / maxValue) * CHART_HEIGHT;
          const expenseHeight = (d.expense / maxValue) * CHART_HEIGHT;

          return (
            <g key={d.key}>
              <rect
                x={centerX - barWidth - 2}
                y={CHART_HEIGHT - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx="3"
                className="bar bar-income"
              >
                <title>{`${d.label}: доход ${formatMoney(d.income)}`}</title>
              </rect>
              <rect
                x={centerX + 2}
                y={CHART_HEIGHT - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                rx="3"
                className="bar bar-expense"
              >
                <title>{`${d.label}: расход ${formatMoney(d.expense)}`}</title>
              </rect>
              <text x={centerX} y={CHART_HEIGHT + 18} className="axis-label" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});
