import { dedupeTransactions } from '../lib/transactions';
import type {
  BalanceSnapshot,
  DiningTransaction,
  PlanSettings,
} from '../lib/types';
import {
  cloneState,
  createDefaultState,
  sanitizeState,
  type ChewMashState,
} from './state';

export const STORAGE_KEY = 'chewmash.state.v1';

export interface StorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ChewMashStateRepository {
  load(): Promise<ChewMashState>;
  save(state: ChewMashState): Promise<ChewMashState>;
  update(mutator: (state: ChewMashState) => ChewMashState | void): Promise<ChewMashState>;
  mergeTransactions(transactions: DiningTransaction[]): Promise<ChewMashState>;
  addBalanceSnapshot(snapshot: BalanceSnapshot): Promise<ChewMashState>;
  updatePlan(plan: PlanSettings): Promise<ChewMashState>;
  clearDiningData(): Promise<ChewMashState>;
  reset(): Promise<ChewMashState>;
}

export function createStateRepository(
  storage: StorageAreaLike,
  now: () => string = () => new Date().toISOString(),
): ChewMashStateRepository {
  let writeQueue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<ChewMashState> {
    const result = await storage.get(STORAGE_KEY);
    return sanitizeState(result[STORAGE_KEY]);
  }

  async function save(state: ChewMashState): Promise<ChewMashState> {
    const clean = sanitizeState({
      ...state,
      updatedAt: now(),
    });
    await storage.set({ [STORAGE_KEY]: clean });
    return cloneState(clean);
  }

  function queueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const next = writeQueue.then(operation, operation);
    writeQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  async function update(
    mutator: (state: ChewMashState) => ChewMashState | void,
  ): Promise<ChewMashState> {
    return queueWrite(async () => {
      const current = await load();
      const working = cloneState(current);
      const result = mutator(working) ?? working;
      return save(result);
    });
  }

  async function mergeTransactions(
    transactions: DiningTransaction[],
  ): Promise<ChewMashState> {
    return update(state => {
      state.transactions = dedupeTransactions([
        ...state.transactions,
        ...transactions,
      ]);
    });
  }

  async function addBalanceSnapshot(
    snapshot: BalanceSnapshot,
  ): Promise<ChewMashState> {
    return update(state => {
      const next = sanitizeState({
        ...state,
        balanceSnapshots: [...state.balanceSnapshots, snapshot],
      });
      state.balanceSnapshots = dedupeSnapshots(next.balanceSnapshots);
    });
  }

  async function updatePlan(plan: PlanSettings): Promise<ChewMashState> {
    return update(state => {
      state.plan = sanitizeState({ ...state, plan }).plan;
    });
  }

  async function clearDiningData(): Promise<ChewMashState> {
    return update(state => {
      state.transactions = [];
      state.balanceSnapshots = [];
    });
  }

  async function reset(): Promise<ChewMashState> {
    return queueWrite(async () => {
      await storage.remove(STORAGE_KEY);
      return createDefaultState();
    });
  }

  return {
    load,
    save,
    update,
    mergeTransactions,
    addBalanceSnapshot,
    updatePlan,
    clearDiningData,
    reset,
  };
}

function dedupeSnapshots(snapshots: BalanceSnapshot[]): BalanceSnapshot[] {
  const byKey = new Map<string, BalanceSnapshot>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.date}|${snapshot.balance.toFixed(2)}`;
    byKey.set(key, snapshot);
  }
  return [...byKey.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
