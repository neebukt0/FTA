import { memo, useMemo } from 'react';
import { formatMoney } from '../../features/analytics/analyticsUtils';

const COLORS = ['#6d28d9', '#2563eb', '#0891b2', '#d97706', '#dc2626', '#65a30d', '#9333ea'];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 78;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Кольцевая диаграмма расходов по категориям (SVG, без внешних библиотек) */
export const DonutChart = memo(function DonutChart({ data }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.total, 0), [data]);

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d, index) => {
      const fraction = total > 0 ? d.total / total : 0;
      const segment = {
        ...d,
        fraction,
        offset,
        color: COLORS[index % COLORS.length],
      };
      offset += fraction;
      return segment;
    });
  }, [data, total]);

  return (
    <div className="chart donut-chart">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="chart-svg"
        role="img"
        aria-label="Расходы по категориям"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />

        {segments.map((segment) => (
          <circle
            key={segment.category}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={segment.color}
            strokeWidth={STROKE}
            strokeDasharray={`${segment.fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={-segment.offset * CIRCUMFERENCE}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          >
            <title>{`${segment.category}: ${formatMoney(segment.total)}`}</title>
          </circle>
        ))}

        <text x={CENTER} y={CENTER - 4} className="donut-value" textAnchor="middle">
          {formatMoney(total)}
        </text>
        <text x={CENTER} y={CENTER + 16} className="donut-caption" textAnchor="middle">
          расходы
        </text>
      </svg>

      <ul className="donut-legend">
        {segments.map((segment) => (
          <li key={segment.category}>
            <span className="dot" style={{ background: segment.color }} />
            <span className="legend-label">{segment.category}</span>
            <span className="legend-value">{formatMoney(segment.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
