import type { BalanceSnapshot, DiningTransaction, IsoDate } from '../lib/types';

export function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(value) ? value : 0);
}

export function localDate(): IsoDate {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function humanDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value || '—';
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function latestBalanceSnapshot(snapshots: BalanceSnapshot[], asOf: IsoDate): BalanceSnapshot | null {
  return [...snapshots]
    .filter(snapshot => snapshot.date <= asOf && Number.isFinite(snapshot.balance) && snapshot.balance >= 0)
    .sort((left, right) => String(left.date).localeCompare(String(right.date)))
    .at(-1) ?? null;
}

export function spendOnDate(transactions: DiningTransaction[], date: IsoDate): number {
  return transactions.reduce((sum, transaction) => transaction.date === date ? sum + transaction.amount : sum, 0);
}

export function mostRecentDataDate(transactions: DiningTransaction[], snapshots: BalanceSnapshot[]): IsoDate | null {
  const dates = [
    ...transactions.map(transaction => transaction.date),
    ...snapshots.map(snapshot => snapshot.date),
  ].filter(Boolean).sort();
  return dates.at(-1) ?? null;
}
