import { useEffect, useState } from 'react';
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

function fullDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DaySpendModal({
  date,
  transactions,
  onClose,
}: {
  date: IsoDate;
  transactions: DiningTransaction[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const byLocation = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.date !== date) continue;
    const location = normalizeLocation(transaction.rawLocation || transaction.location);
    byLocation.set(location, (byLocation.get(location) ?? 0) + transaction.amount);
  }
  const rows = [...byLocation.entries()].sort((left, right) => right[1] - left[1]);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div
      className="metric-modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="metric-modal"
        style={{ width: 'min(100%, 640px)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-spend-modal-title"
      >
        <button className="metric-modal-close" type="button" onClick={onClose} aria-label="Close daily spending details">×</button>
        <span className="metric-modal-kicker">Daily spending</span>
        <h2 id="day-spend-modal-title">{fullDate(date)}</h2>
        <strong className="metric-modal-value">{money(total)}</strong>
        <div className="metric-modal-body">
          <p>Total itemized Dining Dollars spent that day.</p>
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr><th>Dining location</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {rows.length ? rows.map(([location, value]) => (
                  <tr key={location}><td>{location}</td><td>{money(value)}</td></tr>
                )) : (
                  <tr><td colSpan={2} className="empty-cell">No Dining Dollars purchases recorded for this day.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function LocationSpendModal({
  location,
  transactions,
  onClose,
}: {
  location: string;
  transactions: DiningTransaction[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const matching = transactions
    .filter(transaction => normalizeLocation(transaction.rawLocation || transaction.location) === location)
    .sort((left, right) => `${right.date} ${right.time ?? ''}`.localeCompare(`${left.date} ${left.time ?? ''}`));
  const total = matching.reduce((sum, transaction) => sum + transaction.amount, 0);
  const overallTotal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const average = matching.length ? total / matching.length : 0;
  const share = overallTotal ? total / overallTotal * 100 : 0;
  const recent = matching.slice(0, 8);

  return (
    <div
      className="metric-modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="metric-modal"
        style={{ width: 'min(100%, 680px)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-spend-modal-title"
      >
        <button className="metric-modal-close" type="button" onClick={onClose} aria-label={`Close ${location} spending details`}>×</button>
        <span className="metric-modal-kicker">Dining location</span>
        <h2 id="location-spend-modal-title">{location}</h2>
        <strong className="metric-modal-value">{money(total)}</strong>
        <div className="metric-modal-body">
          <p>Total itemized Dining Dollars spent at this location.</p>
          <div className="detail-grid">
            <div><span>Purchases</span><strong>{matching.length}</strong></div>
            <div><span>Average purchase</span><strong>{money(average)}</strong></div>
            <div><span>Share of itemized spend</span><strong>{share.toFixed(1)}%</strong></div>
          </div>
          <div>
            <h3 style={{ marginBottom: 8, fontSize: 13, color: '#444d56' }}>Recent transactions</h3>
            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr><th>Date</th><th>Time</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {recent.length ? recent.map((transaction, index) => (
                    <tr key={`${transaction.date}-${transaction.time ?? ''}-${transaction.amount}-${index}`}>
                      <td>{shortDate(String(transaction.date))}</td>
                      <td>{transaction.time ?? '—'}</td>
                      <td>{money(transaction.amount)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="empty-cell">No transactions recorded for this location.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {matching.length > recent.length ? (
              <small className="detail-source">Showing the {recent.length} most recent of {matching.length} purchases.</small>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
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
  const [selectedDate, setSelectedDate] = useState<IsoDate | null>(null);
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
    <>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily spending line and dot chart. Select a dot to open that day's spending details.">
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
        {values.map((value, index) => {
          const date = dates[index]!;
          const openDetails = () => setSelectedDate(date);
          return (
            <g
              key={date}
              role="button"
              tabIndex={0}
              aria-label={`${fullDate(date)}: ${money(value)}. Open daily spending details.`}
              onClick={openDetails}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetails();
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <title>{shortDate(String(date))}: {money(value)} · click for details</title>
              <circle cx={x(index)} cy={y(value)} r={10} fill="transparent" />
              <circle
                className={value > 0 ? 'chart-dot' : 'chart-dot chart-dot-empty'}
                cx={x(index)}
                cy={y(value)}
                r={value > 0 ? 4 : 2.4}
                pointerEvents="none"
              />
            </g>
          );
        })}
        {labels.map(index => (
          <text key={index} className="chart-axis" x={x(index)} y={height - 8} textAnchor="middle">
            {shortDate(String(dates[index]))}
          </text>
        ))}
      </svg>
      {selectedDate ? (
        <DaySpendModal date={selectedDate} transactions={transactions} onClose={() => setSelectedDate(null)} />
      ) : null}
    </>
  );
}

type BrandMark = 'panda' | 'chickfila' | 'subway' | 'jamba' | 'starbucks' | 'shakesmart';

function brandForLocation(name: string): BrandMark | null {
  const value = name.toLowerCase();
  if (value.includes('panda express')) return 'panda';
  if (value.includes('chick-fil-a') || value.includes('chick fil a')) return 'chickfila';
  if (value.includes('subway')) return 'subway';
  if (value.includes('jamba')) return 'jamba';
  if (value.includes('starbucks')) return 'starbucks';
  if (value.includes('shake smart')) return 'shakesmart';
  return null;
}

function compactLabelLines(name: string): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  if (!words.length) return ['Dining'];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= 13 || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && current) lines.push(current);
  const used = lines.join(' ').length;
  if (used < name.length && lines.length) {
    const last = lines.length - 1;
    lines[last] = `${lines[last]!.slice(0, 10)}…`;
  }
  return lines.slice(0, 2);
}

function DiningBrandMark({ brand, cx, cy }: { brand: BrandMark; cx: number; cy: number }) {
  const transform = `translate(${cx - 16} ${cy - 16})`;
  switch (brand) {
    case 'panda':
      return (
        <g transform={transform} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#b7282e" />
          <circle cx="16" cy="16" r="10.2" fill="#fff" />
          <circle cx="10.3" cy="10.2" r="3" fill="#1d2428" />
          <circle cx="21.7" cy="10.2" r="3" fill="#1d2428" />
          <ellipse cx="12.4" cy="15.7" rx="2.5" ry="3.2" fill="#1d2428" />
          <ellipse cx="19.6" cy="15.7" rx="2.5" ry="3.2" fill="#1d2428" />
          <circle cx="16" cy="20.7" r="1.6" fill="#1d2428" />
        </g>
      );
    case 'chickfila':
      return (
        <g transform={transform} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#fff" stroke="#d5233f" strokeWidth="2" />
          <path d="M22.8 8.9c-1.7-1.5-3.7-2.2-6.1-2.2-5.3 0-9.3 4-9.3 9.4 0 5.3 4 9.2 9.2 9.2 2.2 0 4.2-.6 5.8-1.8l-2.7-3.2c-.8.5-1.8.8-2.9.8-2.8 0-4.9-2.1-4.9-5 0-2.9 2.1-5.1 4.9-5.1 1.2 0 2.2.4 3.1 1l2.9-3.1Z" fill="#d5233f" />
          <circle cx="24.1" cy="9" r="1.5" fill="#d5233f" />
        </g>
      );
    case 'subway':
      return (
        <g transform={transform} aria-hidden="true">
          <rect x="1" y="5" width="30" height="22" rx="8" fill="#07883f" />
          <path d="M8 20h10.5v-3.4l6 5.4-6 5.2v-3.3H8Z" fill="#f9d616" transform="translate(0 -4)" />
          <path d="M24 12H13.5v3.4l-6-5.4 6-5.2v3.3H24Z" fill="#fff" transform="translate(0 4)" />
        </g>
      );
    case 'jamba':
      return (
        <g transform={transform} aria-hidden="true">
          <circle cx="16" cy="17" r="13.5" fill="#f28b2d" />
          <path d="M16 10c1.6-5 5.8-7.4 10.2-6.7-1 4.7-4.5 7.5-10.2 7.9Z" fill="#4a8b45" />
          <path d="M11 17c4.6-2.7 9.1-2.2 12 1.2-3.2 3.5-8.7 4-12 1.7Z" fill="#fff" opacity=".95" />
        </g>
      );
    case 'starbucks':
      return (
        <g transform={transform} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#00754a" />
          <path d="m16 6 2.4 6.1 6.6.4-5.1 4.2 1.7 6.4-5.6-3.6-5.6 3.6 1.7-6.4L7 12.5l6.6-.4Z" fill="#fff" />
        </g>
      );
    case 'shakesmart':
      return (
        <g transform={transform} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#315f46" />
          <path d="m18.6 4.8-8.3 12h5.1l-2 10.4 8.3-12h-5.1Z" fill="#fff" />
        </g>
      );
  }
}

export function PlaceSpendChart({ transactions }: { transactions: DiningTransaction[] }) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const location = normalizeLocation(transaction.rawLocation || transaction.location);
    totals.set(location, (totals.get(location) ?? 0) + transaction.amount);
  }

  const rows = [...totals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 7);
  if (!rows.length) return <div className="empty-chart">Import transactions to see spending by location.</div>;

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  const width = 620;
  const height = 300;
  const left = 22;
  const right = 14;
  const top = 18;
  const bottom = 88;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const slot = innerWidth / rows.length;
  const barWidth = Math.min(46, slot * 0.58);
  const greenShades = ['#154f3a', '#1b5a41', '#23654a', '#2d7053', '#397c5e', '#48896a', '#5b9679'];
  const baseline = top + innerHeight;

  return (
    <>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Spending by dining location bar chart. Select a bar to open location details.">
        {[0, 1, 2, 3].map(step => {
          const yy = top + innerHeight - innerHeight * step / 3;
          return <line key={step} className="chart-grid" x1={left} x2={width - right} y1={yy} y2={yy} />;
        })}
        <line className="chart-grid" x1={left} x2={width - right} y1={baseline} y2={baseline} />
        {rows.map(([name, value], index) => {
          const barHeight = value / max * innerHeight;
          const x = left + slot * index + (slot - barWidth) / 2;
          const y = baseline - barHeight;
          const centerX = x + barWidth / 2;
          const percent = total ? value / total * 100 : 0;
          const brand = brandForLocation(name);
          const labelLines = compactLabelLines(name);
          const active = hoveredLocation === name;
          const openDetails = () => setSelectedLocation(name);
          return (
            <g
              key={name}
              role="button"
              tabIndex={0}
              aria-label={`${name}: ${money(value)}, ${percent.toFixed(1)} percent of itemized location spending. Open recent transactions.`}
              onClick={openDetails}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetails();
                }
              }}
              onMouseEnter={() => setHoveredLocation(name)}
              onMouseLeave={() => setHoveredLocation(current => current === name ? null : current)}
              onFocus={() => setHoveredLocation(name)}
              onBlur={() => setHoveredLocation(current => current === name ? null : current)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <title>{name}: {money(value)} · {percent.toFixed(1)}% · click for recent transactions</title>
              <rect
                x={left + slot * index}
                y={top}
                width={slot}
                height={innerHeight + 72}
                fill="transparent"
                pointerEvents="all"
              />
              <rect
                x={x}
                y={active ? Math.max(top, y - 2) : y}
                width={barWidth}
                height={active ? barHeight + Math.min(2, y - top) : barHeight}
                rx={active ? 5 : 3}
                fill={greenShades[index % greenShades.length]}
                stroke={active ? '#ffffff' : 'transparent'}
                strokeWidth={active ? 1.5 : 0}
                style={{
                  opacity: active ? 1 : .9,
                  filter: active ? 'drop-shadow(0 5px 5px rgba(21,79,58,.24))' : 'none',
                  transition: 'opacity .16s ease, filter .16s ease',
                }}
              />
              <text
                x={centerX}
                y={Math.max(top + 10, y - 8)}
                textAnchor="middle"
                style={{
                  fill: '#355b4a',
                  fontSize: 10,
                  fontWeight: 750,
                  opacity: active ? 1 : 0,
                  transition: 'opacity .16s ease',
                  pointerEvents: 'none',
                }}
              >
                {money(value)}
              </text>
              <text className="chart-axis" x={centerX} y={baseline + 17} textAnchor="middle">{percent.toFixed(0)}%</text>
              {brand ? (
                <DiningBrandMark brand={brand} cx={centerX} cy={baseline + 51} />
              ) : (
                <text className="chart-axis" x={centerX} y={baseline + 43} textAnchor="middle">
                  {labelLines.map((line, lineIndex) => (
                    <tspan key={line} x={centerX} dy={lineIndex === 0 ? 0 : 13}>{line}</tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {selectedLocation ? (
        <LocationSpendModal location={selectedLocation} transactions={transactions} onClose={() => setSelectedLocation(null)} />
      ) : null}
    </>
  );
}
