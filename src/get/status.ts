import { browser } from 'wxt/browser';

export const GET_SYNC_STATUS_KEY = 'chewmash.get-sync.v1';

export interface GetSyncStatus {
  capturedAt: string;
  tableCount: number;
  rowCount: number;
  matchedTransactions: number;
  newTransactions: number;
  balanceFound: boolean;
  error: string | null;
}

export async function readGetSyncStatus(): Promise<GetSyncStatus | null> {
  const result = await browser.storage.local.get(GET_SYNC_STATUS_KEY);
  return sanitizeGetSyncStatus(result[GET_SYNC_STATUS_KEY]);
}

export async function writeGetSyncStatus(status: GetSyncStatus): Promise<void> {
  await browser.storage.local.set({ [GET_SYNC_STATUS_KEY]: status });
}

export function sanitizeGetSyncStatus(value: unknown): GetSyncStatus | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.capturedAt !== 'string') return null;

  return {
    capturedAt: record.capturedAt,
    tableCount: safeCount(record.tableCount),
    rowCount: safeCount(record.rowCount),
    matchedTransactions: safeCount(record.matchedTransactions),
    newTransactions: safeCount(record.newTransactions),
    balanceFound: record.balanceFound === true,
    error: typeof record.error === 'string' && record.error.trim() ? record.error.trim() : null,
  };
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}
