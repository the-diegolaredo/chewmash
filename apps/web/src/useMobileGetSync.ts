import { useCallback, useState } from 'react';
import type { ConnectorSyncStatus } from '../../../src/connector/protocol';
import type { ChewMashState } from '../../../src/storage/state';
import { webStateRepository } from '../../../src/storage/web';
import { localDate, money } from '../../../src/ui/utils';
import { captureGetOnDevice, isNativeMobileApp } from './platform/native';

const SYNC_HISTORY_KEY = 'chewmash:get-sync-history:v1';
const MAX_SYNC_HISTORY = 6;
const SYNC_HISTORY_EVENT = 'chewmash:get-sync-history';

export interface MobileGetSyncModel {
  available: boolean;
  busy: boolean;
  message: string | null;
  syncStatus: ConnectorSyncStatus | null;
  connect: () => Promise<void>;
}

export function useMobileGetSync(onState: (state: ChewMashState) => void): MobileGetSyncModel {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ConnectorSyncStatus | null>(() => readLatestSyncStatus());
  const available = isNativeMobileApp();

  const connect = useCallback(async () => {
    setMessage(null);
    if (!available) {
      setMessage('Native GET sync is only available in the chewmash iOS app.');
      return;
    }

    setBusy(true);
    try {
      const payload = await captureGetOnDevice();
      if (payload.cancelled) {
        setMessage('GET sync cancelled.');
        return;
      }

      const before = await webStateRepository.load();
      let after = await webStateRepository.mergeTransactions(payload.transactions ?? []);
      if (typeof payload.balance === 'number' && Number.isFinite(payload.balance) && payload.balance >= 0) {
        after = await webStateRepository.addBalanceSnapshot({
          date: localDate(),
          balance: payload.balance,
          source: 'GET mobile sync',
        });
      }

      const added = Math.max(0, after.transactions.length - before.transactions.length);
      const status: ConnectorSyncStatus = {
        capturedAt: payload.capturedAt || new Date().toISOString(),
        tableCount: payload.tableCount ?? 0,
        rowCount: payload.rowCount ?? 0,
        matchedTransactions: payload.matchedTransactions ?? payload.transactions?.length ?? 0,
        newTransactions: added,
        balanceFound: typeof payload.balance === 'number',
        error: null,
      };

      rememberSyncStatus(status);
      setSyncStatus(status);
      onState(after);
      setMessage(
        `${status.matchedTransactions} purchase${status.matchedTransactions === 1 ? '' : 's'} found · ${added} new${status.balanceFound ? ` · balance ${money(payload.balance!)}` : ''}`,
      );
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : String(reason);
      const status: ConnectorSyncStatus = {
        capturedAt: new Date().toISOString(),
        tableCount: 0,
        rowCount: 0,
        matchedTransactions: 0,
        newTransactions: 0,
        balanceFound: false,
        error: text,
      };
      rememberSyncStatus(status);
      setSyncStatus(status);
      setMessage(`GET sync could not finish: ${text}`);
    } finally {
      setBusy(false);
    }
  }, [available, onState]);

  return { available, busy, message, syncStatus, connect };
}

function readLatestSyncStatus(): ConnectorSyncStatus | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const first = parsed[0];
    return isSyncStatus(first) ? first : null;
  } catch {
    return null;
  }
}

function rememberSyncStatus(status: ConnectorSyncStatus) {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const current = Array.isArray(parsed) ? parsed.filter(isSyncStatus) : [];
    const next = [status, ...current.filter(item => item.capturedAt !== status.capturedAt)].slice(0, MAX_SYNC_HISTORY);
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SYNC_HISTORY_EVENT));
  } catch {
    // Sync history is UI metadata only; storage failures should not block a successful import.
  }
}

function isSyncStatus(value: unknown): value is ConnectorSyncStatus {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.capturedAt === 'string'
    && typeof record.tableCount === 'number'
    && typeof record.rowCount === 'number'
    && typeof record.matchedTransactions === 'number'
    && typeof record.newTransactions === 'number'
    && typeof record.balanceFound === 'boolean'
    && (record.error === null || typeof record.error === 'string');
}
