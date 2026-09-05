import { campusDates } from '../lib/dates';
import { dailyTotals, normalizeLocation } from '../lib/transactions';
import type { DiningTransaction, IsoDate, PlanSettings } from '../lib/types';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function shortDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DailySpendChart({
  transactions,
  settings,
  asOf,
  target,
}: {
  transactions: DiningTransaction[];
  settings: PlanSettings;
  asOf: IsoDate;
  target: number;
}) {
  const dates = campusDates(settings).filter(date => date <= asOf);
  const totals = dailyTotals(transactions);
  if (!dates.length) return <div className="empty-chart">No campus days to display yet.</div>;

  const values = dates.map(date => totals.get(date) ?? 0);
  const max = Math.max(target * 1.35, ...values, 1);
  const width = 680;
  const height = 250;
  const left = 42;
  const right = 14;
  const top = 16;
  const bottom = 34;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const x = (index: number) => left + (dates.length === 1 ? innerWidth / 2 : index * innerWidth / (dates.length - 1));
  const y = (value: number) => top + innerHeight - (value / max) * innerHeight;
  const labels = [...new Set([0, Math.floor((dates.length - 1) / 2), dates.length - 1])];
  const linePoints = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily spending line and dot chart">
      {[0, 1, 2, 3, 4].map(step => {
        const value = max * step / 4;
        const yy = y(value);
        return (
          <g key={step}>
            <line className="chart-grid" x1={left} x2={width - right} y1={yy} y2={yy} />
            <text className="chart-axis" x={left - 7} y={yy + 4} textAnchor="end">${Math.round(value)}</text>
          </g>
        );
      })}
      <line className="chart-target" x1={left} x2={width - right} y1={y(target)} y2={y(target)} />
      {values.length > 1 ? <polyline className="chart-line" points={linePoints} /> : null}
      {values.map((value, index) => (
        <circle
          key={dates[index]}
          className={value > 0 ? 'chart-dot' : 'chart-dot chart-dot-empty'}
          cx={x(index)}
          cy={y(value)}
          r={value > 0 ? 4 : 2.4}
        >
          <title>{shortDate(String(dates[index]))}: {money(value)}</title>
        </circle>
      ))}
      {labels.map(index => (
        <text key={index} className="chart-axis" x={x(index)} y={height - 8} textAnchor="middle">
          {shortDate(String(dates[index]))}
        </text>
      ))}
    </svg>
  );
}

export function PlaceSpendChart({ transactions }: { transactions: DiningTransaction[] }) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const location = normalizeLocation(transaction.rawLocation || transaction.location);
    totals.set(location, (totals.get(location) ?? 0) + transaction.amount);
  }

  const rows = [...totals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 7);
  if (!rows.length) return <div className="empty-chart">Import transactions to see spending by location.</div>;

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  const width = 560;
  const height = 260;
  const left = 18;
  const right = 10;
  const top = 18;
  const bottom = 74;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const slot = innerWidth / rows.length;
  const barWidth = Math.min(42, slot * 0.6);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Spending by dining location bar chart">
      {[0, 1, 2, 3].map(step => {
        const yy = top + innerHeight - innerHeight * step / 3;
        return <line key={step} className="chart-grid" x1={left} x2={width - right} y1={yy} y2={yy} />;
      })}
      {rows.map(([name, value], index) => {
        const barHeight = value / max * innerHeight;
        const x = left + slot * index + (slot - barWidth) / 2;
        const y = top + innerHeight - barHeight;
        const percent = total ? value / total * 100 : 0;
        const short = name.length > 14 ? `${name.slice(0, 12)}…` : name;
        return (
          <g key={name}>
            <rect className="chart-bar" x={x} y={y} width={barWidth} height={barHeight} rx={2}>
              <title>{name}: {money(value)} · {percent.toFixed(1)}%</title>
            </rect>
            <text className="chart-axis" x={x + barWidth / 2} y={top + innerHeight + 16} textAnchor="middle">{percent.toFixed(0)}%</text>
            <text
              className="chart-axis"
              transform={`translate(${x + barWidth / 2},${height - 8}) rotate(-42)`}
              textAnchor="end"
            >
              {short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
