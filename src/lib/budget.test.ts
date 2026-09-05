import { describe, expect, it } from 'vitest';
import { calculateBudgetStats, validBalanceSnapshot } from './budget';
import type { DiningTransaction, PlanSettings } from './types';

const settings: PlanSettings = {
  startingBudget: 100,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  awayPeriods: [{ start: '2026-01-05', end: '2026-01-06' }],
};

const transactions: DiningTransaction[] = [
  { date: '2026-01-01', location: 'Cafe', amount: 10 },
  { date: '2026-01-04', location: 'Market', amount: 14 },
  { date: '2026-01-08', location: 'Future purchase', amount: 50 },
];

describe('calculateBudgetStats', () => {
  it('calculates average from itemized spend divided by elapsed campus days', () => {
    const stats = calculateBudgetStats({ settings, transactions, asOf: '2026-01-04' });

    expect(stats.totalCampusDays).toBe(8);
    expect(stats.elapsedCampusDays).toBe(4);
    expect(stats.itemizedSpent).toBe(24);
    expect(stats.averageSpentPerCampusDay).toBe(6);
    expect(stats.targetPerCampusDay).toBe(12.5);
  });

  it('does not turn a missing balance into a zero-dollar balance', () => {
    const stats = calculateBudgetStats({
      settings,
      transactions,
      asOf: '2026-01-04',
      balanceSnapshot: null,
    });

    expect(stats.officialBalance).toBeNull();
    expect(stats.officialSpent).toBeNull();
    expect(stats.paceSpend).toBe(24);
    expect(stats.status).toBe('under');
  });

  it('still treats a real zero-dollar balance as valid', () => {
    const stats = calculateBudgetStats({
      settings,
      transactions,
      asOf: '2026-01-04',
      balanceSnapshot: { date: '2026-01-04', balance: 0, source: 'statement' },
    });

    expect(stats.officialBalance).toBe(0);
    expect(stats.officialSpent).toBe(100);
    expect(stats.paceSpend).toBe(100);
    expect(stats.status).toBe('over');
  });

  it('ignores a balance snapshot dated after the requested as-of date', () => {
    expect(validBalanceSnapshot({ date: '2026-01-08', balance: 50 }, '2026-01-04')).toBeNull();
  });

  it('excludes away periods from campus-day counts', () => {
    const stats = calculateBudgetStats({ settings, transactions: [], asOf: '2026-01-10' });
    expect(stats.totalCampusDays).toBe(8);
    expect(stats.elapsedCampusDays).toBe(8);
  });
});
