import { describe, expect, it } from 'vitest';
import type { DiningTransaction, PlanSettings } from '../lib/types';
import { createStateRepository, STORAGE_KEY, type StorageAreaLike } from './repository';
import { createDefaultState, DEFAULT_PLAN_SETTINGS, sanitizeState } from './state';

class MemoryStorage implements StorageAreaLike {
  data: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return key in this.data ? { [key]: this.data[key] } : {};
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.data, items);
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }
}

const sampleTransaction: DiningTransaction = {
  date: '2026-09-04',
  time: '12:30 PM',
  rawLocation: 'Grubhub Jamba Juice 1305',
  location: 'Jamba Juice',
  amount: 9.49,
  source: 'GET sync',
};

describe('typed extension storage', () => {
  it('returns a safe default state when storage is empty', async () => {
    const repository = createStateRepository(new MemoryStorage());
    const state = await repository.load();

    expect(state).toEqual(createDefaultState());
    expect(state.plan.startingBudget).toBe(3295);
  });

  it('stores data under one versioned extension key', async () => {
    const storage = new MemoryStorage();
    const repository = createStateRepository(storage, () => '2026-09-05T03:00:00.000Z');

    await repository.mergeTransactions([sampleTransaction]);

    expect(Object.keys(storage.data)).toEqual([STORAGE_KEY]);
    const stored = storage.data[STORAGE_KEY] as { updatedAt?: string };
    expect(stored.updatedAt).toBe('2026-09-05T03:00:00.000Z');
  });

  it('dedupes the same purchase captured from PDF and GET', async () => {
    const storage = new MemoryStorage();
    const repository = createStateRepository(storage);

    await repository.mergeTransactions([
      { ...sampleTransaction, source: 'September.pdf' },
    ]);
    const state = await repository.mergeTransactions([
      { ...sampleTransaction, source: 'GET sync' },
    ]);

    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0]?.amount).toBe(9.49);
  });

  it('rejects missing balances instead of coercing null to zero', () => {
    const state = sanitizeState({
      plan: DEFAULT_PLAN_SETTINGS,
      balanceSnapshots: [
        { date: '2026-09-04', balance: null, source: 'GET sync' },
      ],
    });

    expect(state.balanceSnapshots).toEqual([]);
  });

  it('preserves a real zero-dollar balance', () => {
    const state = sanitizeState({
      plan: DEFAULT_PLAN_SETTINGS,
      balanceSnapshots: [
        { date: '2026-12-18', balance: 0, source: 'statement.pdf' },
      ],
    });

    expect(state.balanceSnapshots).toHaveLength(1);
    expect(state.balanceSnapshots[0]?.balance).toBe(0);
  });

  it('understands legacy vanilla state field names for future migration', () => {
    const state = sanitizeState({
      settings: {
        budget: 3295,
        start: '2026-08-19',
        end: '2026-12-18',
        breaks: [['2026-11-23', '2026-11-29']],
      },
      transactions: [sampleTransaction],
      snapshots: [
        {
          snapshotDate: '2026-09-04',
          endingBalance: 3000,
          source: 'September.pdf',
        },
      ],
    });

    expect(state.plan.startDate).toBe('2026-08-19');
    expect(state.plan.awayPeriods).toEqual([
      { start: '2026-11-23', end: '2026-11-29' },
    ]);
    expect(state.balanceSnapshots[0]?.balance).toBe(3000);
  });

  it('clears dining history without resetting plan settings', async () => {
    const storage = new MemoryStorage();
    const repository = createStateRepository(storage);
    const customPlan: PlanSettings = {
      startingBudget: 2500,
      startDate: '2026-08-20',
      endDate: '2026-12-15',
      awayPeriods: [],
    };

    await repository.updatePlan(customPlan);
    await repository.mergeTransactions([sampleTransaction]);
    await repository.addBalanceSnapshot({
      date: '2026-09-04',
      balance: 2200,
      source: 'statement.pdf',
    });

    const state = await repository.clearDiningData();

    expect(state.plan.startingBudget).toBe(2500);
    expect(state.transactions).toEqual([]);
    expect(state.balanceSnapshots).toEqual([]);
  });

  it('reset removes stored state entirely', async () => {
    const storage = new MemoryStorage();
    const repository = createStateRepository(storage);

    await repository.mergeTransactions([sampleTransaction]);
    expect(storage.data[STORAGE_KEY]).toBeTruthy();

    const reset = await repository.reset();
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
    expect(reset).toEqual(createDefaultState());
  });
});
