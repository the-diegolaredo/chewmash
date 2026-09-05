import { normalizeLocation } from '../lib/transactions';
import type { DiningTransaction, IsoDate } from '../lib/types';

const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
const TIME_RE = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
const AMOUNT_RE = /[-−]?\s*\$\s*\d[\d,]*\.\d{2}/g;

export function toIsoDate(value: string): IsoDate | null {
  const match = value.match(DATE_RE);
  if (!match) return null;
  const [, monthRaw, dayRaw, yearRaw] = match;
  if (!monthRaw || !dayRaw || !yearRaw) return null;

  const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function moneyNumber(value: string): number | null {
  const normalized = value.replace(/−/g, '-').replace(/\s+/g, '');
  const number = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : null;
}

export function parseGetRowCells(cells: string[]): DiningTransaction | null {
  const cleanCells = cells.map(value => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (cleanCells.length < 3) return null;

  const joined = cleanCells.join(' | ');
  if (/account name|activity details|amount\s*\(currency\)/i.test(joined)) return null;

  const dateToken = joined.match(DATE_RE)?.[0];
  const timeToken = joined.match(TIME_RE)?.[0];
  const amounts = joined.match(AMOUNT_RE) ?? [];
  if (!dateToken || !timeToken || !amounts.length) return null;

  const signedAmount = moneyNumber(amounts.at(-1) ?? '');
  if (signedAmount === null || signedAmount >= 0) return null;

  const dateIndex = cleanCells.findIndex(cell => DATE_RE.test(cell) || TIME_RE.test(cell));
  const amountIndex = cleanCells.findIndex(cell => (cell.match(AMOUNT_RE) ?? []).length > 0);

  let rawLocation = '';
  if (dateIndex >= 0 && amountIndex > dateIndex) {
    rawLocation = cleanCells
      .slice(dateIndex + 1, amountIndex)
      .filter(cell => !/^First Year Plus$/i.test(cell))
      .join(' ')
      .trim();
  }

  if (!rawLocation) {
    rawLocation = cleanCells.find(cell =>
      !DATE_RE.test(cell)
      && !TIME_RE.test(cell)
      && (cell.match(AMOUNT_RE) ?? []).length === 0
      && !/^First Year Plus$/i.test(cell),
    ) ?? 'Unknown';
  }

  const date = toIsoDate(dateToken);
  if (!date) return null;

  return {
    date,
    time: timeToken.replace(/\s+/g, ' ').toUpperCase(),
    rawLocation,
    location: normalizeLocation(rawLocation),
    amount: Math.abs(signedAmount),
    source: 'GET sync',
  };
}

export function parseGetBalanceText(text: string): number | null {
  const patterns = [
    /(?:available|current|ending)\s+balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
    /balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const number = Number(match[1].replace(/,/g, ''));
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return null;
}
