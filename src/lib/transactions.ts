import type { DiningTransaction, IsoDate } from './types';

export function normalizeLocation(value: string | null | undefined): string {
  return String(value || 'Unknown')
    .replace(/^Grubhub\s+/i, '')
    .replace(/\s+\d{3,4}$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Unknown';
}

export function normalizeTransaction(transaction: DiningTransaction): DiningTransaction | null {
  const amount = Math.abs(Number(transaction.amount));
  if (!transaction.date || !Number.isFinite(amount) || amount <= 0) return null;

  const rawLocation = transaction.rawLocation || transaction.location;
  return {
    ...transaction,
    rawLocation,
    location: normalizeLocation(rawLocation),
    amount,
  };
}

export function transactionKey(transaction: DiningTransaction): string {
  return [
    transaction.date,
    String(transaction.time || '').trim().toUpperCase(),
    normalizeLocation(transaction.rawLocation || transaction.location),
    Math.abs(Number(transaction.amount) || 0).toFixed(2),
  ].join('|');
}

export function dedupeTransactions(transactions: DiningTransaction[]): DiningTransaction[] {
  const seen = new Set<string>();
  const result: DiningTransaction[] = [];

  for (const candidate of transactions) {
    const normalized = normalizeTransaction(candidate);
    if (!normalized) continue;
    const key = transactionKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result.sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));
}

export function itemizedSpend(transactions: DiningTransaction[], through?: IsoDate): number {
  return transactions.reduce((total, transaction) => {
    if (through && transaction.date > through) return total;
    return total + (Number(transaction.amount) || 0);
  }, 0);
}

export function dailyTotals(transactions: DiningTransaction[]): Map<IsoDate, number> {
  const totals = new Map<IsoDate, number>();
  for (const transaction of transactions) {
    totals.set(transaction.date, (totals.get(transaction.date) || 0) + (Number(transaction.amount) || 0));
  }
  return totals;
}

export function latestTransactionDate(transactions: DiningTransaction[]): IsoDate | null {
  let latest: IsoDate | null = null;
  for (const transaction of transactions) {
    if (!latest || transaction.date > latest) latest = transaction.date;
  }
  return latest;
}
