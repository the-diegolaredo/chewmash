import { describe, expect, it } from 'vitest';
import { dedupeTransactions, normalizeLocation, transactionKey } from './transactions';
import type { DiningTransaction } from './types';

describe('transaction helpers', () => {
  it('normalizes Grubhub prefixes and location suffixes', () => {
    expect(normalizeLocation('Grubhub Jamba Juice 1305')).toBe('Jamba Juice');
    expect(normalizeLocation('Grubhub Hearth 1323')).toBe('Hearth');
  });

  it('dedupes the same purchase across GET sync and PDF import', () => {
    const pdf: DiningTransaction = {
      date: '2026-09-04',
      time: '11:18:57 AM',
      rawLocation: 'Grubhub Jamba Juice 1305',
      location: 'Jamba Juice',
      amount: 9.49,
      source: 'September.pdf',
    };
    const get: DiningTransaction = {
      ...pdf,
      source: 'GET sync',
    };

    expect(transactionKey(pdf)).toBe(transactionKey(get));
    expect(dedupeTransactions([pdf, get])).toHaveLength(1);
  });

  it('stores charges as positive spend values', () => {
    const result = dedupeTransactions([
      { date: '2026-09-04', location: 'Subway Aero', amount: -13.07 },
    ]);

    expect(result[0]?.amount).toBe(13.07);
  });
});
