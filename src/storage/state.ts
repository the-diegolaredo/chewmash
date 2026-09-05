import { dedupeTransactions } from '../lib/transactions';
import type {
  AwayPeriod,
  BalanceSnapshot,
  DiningTransaction,
  PlanSettings,
} from '../lib/types';

export const STORAGE_SCHEMA_VERSION = 1 as const;

export interface ChewMashState {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  plan: PlanSettings;
  transactions: DiningTransaction[];
  balanceSnapshots: BalanceSnapshot[];
  updatedAt: string | null;
}

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  startingBudget: 3295,
  startDate: '2026-08-19',
  endDate: '2026-12-18',
  awayPeriods: [
    { start: '2026-11-23', end: '2026-11-29' },
  ],
};

export function createDefaultState(): ChewMashState {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    plan: clonePlan(DEFAULT_PLAN_SETTINGS),
    transactions: [],
    balanceSnapshots: [],
    updatedAt: null,
  };
}

export function sanitizeState(input: unknown): ChewMashState {
  const record = asRecord(input);
  if (!record) return createDefaultState();

  const rawTransactions = Array.isArray(record.transactions)
    ? record.transactions
    : [];
  const transactions = dedupeTransactions(
    rawTransactions
      .map(coerceTransaction)
      .filter((value): value is DiningTransaction => value !== null),
  );

  const rawSnapshots = Array.isArray(record.balanceSnapshots)
    ? record.balanceSnapshots
    : Array.isArray(record.snapshots)
      ? record.snapshots
      : [];
  const balanceSnapshots = rawSnapshots
    .map(coerceSnapshot)
    .filter((value): value is BalanceSnapshot => value !== null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    plan: coercePlan(record.plan ?? record.settings),
    transactions,
    balanceSnapshots,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
  };
}

export function cloneState(state: ChewMashState): ChewMashState {
  return {
    ...state,
    plan: clonePlan(state.plan),
    transactions: state.transactions.map(transaction => ({ ...transaction })),
    balanceSnapshots: state.balanceSnapshots.map(snapshot => ({ ...snapshot })),
  };
}

function coercePlan(input: unknown): PlanSettings {
  const record = asRecord(input);
  if (!record) return clonePlan(DEFAULT_PLAN_SETTINGS);

  // Accept both the new typed field names and the old vanilla app names so a
  // future one-time migration can reuse this sanitizer.
  const startingBudget = finiteNonNegative(
    record.startingBudget ?? record.budget,
  );
  const startDate = dateString(record.startDate ?? record.start);
  const endDate = dateString(record.endDate ?? record.end);

  const awayInput = Array.isArray(record.awayPeriods)
    ? record.awayPeriods
    : Array.isArray(record.breaks)
      ? record.breaks
      : [];
  const awayPeriods = awayInput
    .map(coerceAwayPeriod)
    .filter((value): value is AwayPeriod => value !== null);

  return {
    startingBudget: startingBudget ?? DEFAULT_PLAN_SETTINGS.startingBudget,
    startDate: startDate ?? DEFAULT_PLAN_SETTINGS.startDate,
    endDate: endDate ?? DEFAULT_PLAN_SETTINGS.endDate,
    awayPeriods: awayPeriods.length
      ? awayPeriods
      : DEFAULT_PLAN_SETTINGS.awayPeriods.map(period => ({ ...period })),
  };
}

function coerceAwayPeriod(input: unknown): AwayPeriod | null {
  if (Array.isArray(input)) {
    const start = dateString(input[0]);
    const end = dateString(input[1]);
    return start && end ? { start, end } : null;
  }

  const record = asRecord(input);
  if (!record) return null;
  const start = dateString(record.start);
  const end = dateString(record.end);
  return start && end ? { start, end } : null;
}

function coerceTransaction(input: unknown): DiningTransaction | null {
  const record = asRecord(input);
  if (!record) return null;

  const date = dateString(record.date);
  const amount = finitePositive(record.amount);
  if (!date || amount === null) return null;

  const rawLocation = stringValue(record.rawLocation)
    ?? stringValue(record.location)
    ?? 'Unknown';

  return {
    date,
    time: stringValue(record.time) ?? undefined,
    rawLocation,
    location: stringValue(record.location) ?? rawLocation,
    amount,
    source: stringValue(record.source) ?? undefined,
  };
}

function coerceSnapshot(input: unknown): BalanceSnapshot | null {
  const record = asRecord(input);
  if (!record) return null;

  // Explicitly reject null/undefined balances. Number(null) === 0 caused the
  // original $193/day regression, so conversion only happens after type checks.
  const rawBalance = record.balance ?? record.endingBalance;
  const balance = finiteNonNegative(rawBalance);
  const date = dateString(record.date ?? record.snapshotDate);
  if (!date || balance === null) return null;

  return {
    date,
    balance,
    source: stringValue(record.source) ?? undefined,
  };
}

function clonePlan(plan: PlanSettings): PlanSettings {
  return {
    ...plan,
    awayPeriods: plan.awayPeriods.map(period => ({ ...period })),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function dateString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function finitePositive(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function finiteNonNegative(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
