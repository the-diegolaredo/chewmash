import { describe, expect, it } from 'vitest';
import { calculateBudgetStats, dailyTargetRemaining, validBalanceSnapshot } from './budget';
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

  it('keeps a real zero-dollar balance valid without letting it override itemized pace', () => {
    const stats = calculateBudgetStats({
      settings,
      transactions,
      asOf: '2026-01-04',
      balanceSnapshot: { date: '2026-01-04', balance: 0, source: 'statement' },
    });

    expect(stats.officialBalance).toBe(0);
    expect(stats.officialSpent).toBe(100);
    expect(stats.paceSpend).toBe(24);
    expect(stats.status).toBe('under');
  });

  it('matches the known-good Fall 2026 budget-status example', () => {
    const fallSettings: PlanSettings = {
      startingBudget: 3295,
      startDate: '2026-08-19',
      endDate: '2026-12-18',
      awayPeriods: [{ start: '2026-11-23', end: '2026-11-29' }],
    };
    const fallTransactions: DiningTransaction[] = [
      { date: '2026-09-04', location: 'Itemized purchases', amount: 463.18 },
    ];

    const stats = calculateBudgetStats({
      settings: fallSettings,
      transactions: fallTransactions,
      asOf: '2026-09-04',
      balanceSnapshot: { date: '2026-09-04', balance: 2927.31, source: 'statement' },
    });

    expect(stats.totalCampusDays).toBe(115);
    expect(stats.elapsedCampusDays).toBe(17);
    expect(stats.targetPerCampusDay).toBeCloseTo(28.65217, 5);
    expect(stats.expectedSpend).toBeCloseTo(487.08696, 5);
    expect(stats.paceSpend).toBe(463.18);
    expect(stats.paceDelta).toBeCloseTo(23.90696, 5);
    expect(stats.status).toBe('under');
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

describe('dailyTargetRemaining', () => {
  it('subtracts today\'s itemized spend from the planned daily target', () => {
    expect(dailyTargetRemaining(28.65, 22.56)).toBe(6.09);
  });

  it('returns a negative amount when today is already over target', () => {
    expect(dailyTargetRemaining(28.65, 31)).toBe(-2.35);
  });
});
