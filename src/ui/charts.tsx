import { useEffect, useState } from 'react';
import pandaLogo from '../assets/brands/panda.svg?url';
import chickFilALogo from '../assets/brands/chick-fil-a.svg?url';
import subwayLogo from '../assets/brands/subway.svg?url';
import jambaLogo from '../assets/brands/jamba.svg?url';
import tacoBellLogo from '../assets/brands/taco-bell.svg?url';
import starbucksLogo from '../assets/brands/starbucks.svg?url';
import shakeSmartLogo from '../assets/brands/shake-smart.svg?url';
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

type BrandMark = 'panda' | 'chickfila' | 'subway' | 'jamba' | 'tacobell' | 'starbucks' | 'shakesmart';

const brandLogos: Record<BrandMark, string> = {
  panda: pandaLogo,
  chickfila: chickFilALogo,
  subway: subwayLogo,
  jamba: jambaLogo,
  tacobell: tacoBellLogo,
  starbucks: starbucksLogo,
  shakesmart: shakeSmartLogo,
};

function brandForLocation(name: string): BrandMark | null {
  const value = name.toLowerCase();
  if (value.includes('panda express')) return 'panda';
  if (value.includes('chick-fil-a') || value.includes('chick fil a')) return 'chickfila';
  if (value.includes('subway')) return 'subway';
  if (value.includes('jamba')) return 'jamba';
  if (value.includes('taco bell')) return 'tacobell';
  if (value.includes('starbucks')) return 'starbucks';
  if (value.includes('shake smart') || value.includes('shakesmart')) return 'shakesmart';
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
  const isWide = brand === 'jamba' || brand === 'shakesmart';
  const isTall = brand === 'tacobell';
  const width = isWide ? 44 : isTall ? 28 : 34;
  const height = isWide ? 30 : isTall ? 40 : 34;
  return (
    <image
      href={brandLogos[brand]}
      x={cx - width / 2}
      y={cy - height / 2}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      pointerEvents="none"
    />
  );
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
