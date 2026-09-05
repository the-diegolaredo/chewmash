import { useCallback, useEffect, useState } from 'react';
import type { ConnectorSnapshot, ConnectorSyncStatus } from '../../../src/connector/protocol';
import type { DineOnCampusMenuItem } from '../../../src/menu/dineoncampus';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { webStateRepository } from '../../../src/storage/web';
import { requestConnector, subscribeConnectorMessages } from './connector';

const SYNC_HISTORY_KEY = 'chewmash:get-sync-history:v1';
const MAX_SYNC_HISTORY = 6;
export const GET_SYNC_HISTORY_EVENT = 'chewmash:get-sync-history';

export interface GetConnectorModel {
  installed: boolean;
  checking: boolean;
  busy: boolean;
  version: string | null;
  message: string | null;
  syncStatus: ConnectorSyncStatus | null;
  syncHistory: ConnectorSyncStatus[];
  connect: () => Promise<void>;
  fetchMenu: (date: string) => Promise<DineOnCampusMenuItem[] | null>;
}

export function useGetConnector(
  onState: (state: ChewMashState) => void,
): GetConnectorModel {
  const [installed, setInstalled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<ConnectorSyncStatus[]>(() => readGetSyncHistory());
  const [syncStatus, setSyncStatus] = useState<ConnectorSyncStatus | null>(() => readGetSyncHistory()[0] ?? null);

  const rememberSyncStatus = useCallback((status: ConnectorSyncStatus) => {
    setSyncHistory(current => {
      const next = [
        status,
        ...current.filter(item => item.capturedAt !== status.capturedAt),
      ].slice(0, MAX_SYNC_HISTORY);
      writeSyncHistory(next);
      return next;
    });
  }, []);

  const applySnapshot = useCallback(async (snapshot: ConnectorSnapshot) => {
    const clean = sanitizeState({
      transactions: snapshot.transactions,
      balanceSnapshots: snapshot.balanceSnapshots,
      updatedAt: snapshot.updatedAt,
    });
    const before = await webStateRepository.load();
    let after = await webStateRepository.mergeTransactions(clean.transactions);
    for (const balanceSnapshot of clean.balanceSnapshots) {
      after = await webStateRepository.addBalanceSnapshot(balanceSnapshot);
    }

    onState(after);
    setSyncStatus(snapshot.syncStatus);
    if (snapshot.syncStatus) rememberSyncStatus(snapshot.syncStatus);

    const added = Math.max(0, after.transactions.length - before.transactions.length);
    if (snapshot.syncStatus?.error) {
      setMessage(`GET sync error: ${snapshot.syncStatus.error}`);
    } else if (snapshot.syncStatus) {
      setMessage(`${after.transactions.length} purchases available · ${added} newly copied to this website`);
    }
  }, [onState, rememberSyncStatus]);

  useEffect(() => {
    const unsubscribe = subscribeConnectorMessages(message => {
      if (message.type === 'CHEWMASH_CONNECTOR_READY') {
        setInstalled(true);
        setChecking(false);
        setVersion(message.payload.version);
        return;
      }

      if (message.type === 'CHEWMASH_CONNECTOR_UPDATE') {
        setInstalled(true);
        setChecking(false);
        setVersion(message.payload.version);
        if (message.payload.snapshot) void applySnapshot(message.payload.snapshot);
      }
    });

    return unsubscribe;
  }, [applySnapshot]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      for (const delay of [0, 350, 800]) {
        if (delay) await new Promise(resolve => window.setTimeout(resolve, delay));
        if (cancelled) return;
        const response = await requestConnector('ping', 700);
        if (response?.ok && response.payload?.version) {
          if (cancelled) return;
          setInstalled(true);
          setChecking(false);
          setVersion(response.payload.version);
          return;
        }
      }
      if (!cancelled) setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setMessage(null);
    setBusy(true);
    try {
      let detected = installed;
      if (!detected) {
        const ping = await requestConnector('ping', 900);
        detected = Boolean(ping?.ok && ping.payload?.version);
        if (detected) {
          setInstalled(true);
          setVersion(ping?.payload?.version ?? null);
        }
      }

      if (!detected) {
        setMessage('The chewmash connector is not installed or needs to be reloaded. Install the current Chrome beta, then refresh this page. PDF import still works without the extension.');
        return;
      }

      const response = await requestConnector('sync', 2_500);
      if (!response) {
        setMessage('The connector did not respond. Reload the extension and this page, then try again.');
        return;
      }
      if (!response.ok) {
        setMessage(response.error || 'The connector could not open GET.');
        return;
      }

      setVersion(response.payload?.version ?? version);
      if (response.payload?.snapshot) await applySnapshot(response.payload.snapshot);
      setMessage('GET opened. Sign in normally if needed. When Transaction History loads, chewmash will copy the parsed purchases into this website automatically.');
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, installed, version]);

  const fetchMenu = useCallback(async (date: string): Promise<DineOnCampusMenuItem[] | null> => {
    if (!installed) return null;
    const response = await requestConnector('menu', 20_000, { date });
    if (!response) throw new Error('The connector did not respond to the menu request.');
    if (!response.ok) throw new Error(response.error || 'The connector could not fetch the Dine On Campus menu.');
    return response.payload?.menu ?? null;
  }, [installed]);

  return {
    installed,
    checking,
    busy,
    version,
    message,
    syncStatus,
    syncHistory,
    connect,
    fetchMenu,
  };
}

export function readGetSyncHistory(): ConnectorSyncStatus[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isConnectorSyncStatus).slice(0, MAX_SYNC_HISTORY);
  } catch {
    return [];
  }
}

function writeSyncHistory(history: ConnectorSyncStatus[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SYNC_HISTORY)));
    window.dispatchEvent(new Event(GET_SYNC_HISTORY_EVENT));
  } catch {
    // Sync history is optional UI metadata; storage failures should not block syncing.
  }
}

function isConnectorSyncStatus(value: unknown): value is ConnectorSyncStatus {
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
