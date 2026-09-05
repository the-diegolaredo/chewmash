import { campusDates, clampDate } from './dates';
import { itemizedSpend } from './transactions';
import type { BalanceSnapshot, BudgetStats, DiningTransaction, IsoDate, PlanSettings } from './types';

export interface CalculateBudgetInput {
  settings: PlanSettings;
  transactions: DiningTransaction[];
  asOf: IsoDate;
  balanceSnapshot?: BalanceSnapshot | null;
}

export function validBalanceSnapshot(
  snapshot: BalanceSnapshot | null | undefined,
  asOf: IsoDate,
): BalanceSnapshot | null {
  if (!snapshot) return null;
  if (!Number.isFinite(snapshot.balance) || snapshot.balance < 0) return null;
  if (snapshot.date > asOf) return null;
  return snapshot;
}

/**
 * How much of today's planned Dining Dollars target remains after today's
 * itemized purchases. A negative value means the user is over today's target.
 * Work in cents so the UI never exposes floating-point artifacts.
 */
export function dailyTargetRemaining(targetPerCampusDay: number, spentToday: number): number {
  if (!Number.isFinite(targetPerCampusDay) || !Number.isFinite(spentToday)) return 0;
  return Math.round((targetPerCampusDay - spentToday) * 100) / 100;
}

export function calculateBudgetStats({
  settings,
  transactions,
  asOf,
  balanceSnapshot,
}: CalculateBudgetInput): BudgetStats {
  const allCampusDays = campusDates(settings);
  const clampedAsOf = clampDate(asOf, settings.startDate, settings.endDate);
  const elapsed = allCampusDays.filter((date) => date <= clampedAsOf);
  const remaining = allCampusDays.filter((date) => date >= clampedAsOf);
  const targetPerCampusDay = allCampusDays.length > 0
    ? settings.startingBudget / allCampusDays.length
    : 0;

  // Average spend is intentionally itemized-spend based. It should answer
  // "what have I actually spent per campus day?" and must not be distorted
  // by a missing or stale balance snapshot.
  const itemized = itemizedSpend(transactions, clampedAsOf);
  const averageSpentPerCampusDay = elapsed.length > 0 ? itemized / elapsed.length : 0;

  const snapshot = validBalanceSnapshot(balanceSnapshot, clampedAsOf);
  const officialBalance = snapshot?.balance ?? null;
  const officialSpent = officialBalance === null
    ? null
    : Math.max(0, settings.startingBudget - officialBalance);

  // Budget pace prefers an authoritative balance when one exists. Otherwise,
  // it safely falls back to itemized spend. Crucially, null is never coerced
  // into a $0 balance.
  const paceSpend = officialSpent ?? itemized;
  const expectedSpend = targetPerCampusDay * elapsed.length;
  const paceDelta = expectedSpend - paceSpend;
  const tolerance = Math.max(1, targetPerCampusDay * 0.05);
  const status = paceDelta > tolerance ? 'under' : paceDelta < -tolerance ? 'over' : 'on';

  const planningBalance = officialBalance ?? Math.max(0, settings.startingBudget - itemized);
  const safePerRemainingDay = remaining.length > 0 ? planningBalance / remaining.length : 0;

  return {
    asOf: clampedAsOf,
    totalCampusDays: allCampusDays.length,
    elapsedCampusDays: elapsed.length,
    remainingCampusDays: remaining.length,
    targetPerCampusDay,
    itemizedSpent: itemized,
    officialBalance,
    officialSpent,
    paceSpend,
    averageSpentPerCampusDay,
    expectedSpend,
    paceDelta,
    status,
    safePerRemainingDay,
  };
}
