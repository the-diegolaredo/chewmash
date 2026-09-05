import type { BalanceSnapshot, DiningTransaction } from '../lib/types';

export const CONNECTOR_WEB_SOURCE = 'chewmash-web' as const;
export const CONNECTOR_EXTENSION_SOURCE = 'chewmash-connector' as const;

export type ConnectorAction = 'ping' | 'pull' | 'sync';

export interface ConnectorRequest {
  source: typeof CONNECTOR_WEB_SOURCE;
  type: 'CHEWMASH_CONNECTOR_REQUEST';
  action: ConnectorAction;
  requestId: string;
}

export interface ConnectorSyncStatus {
  capturedAt: string;
  tableCount: number;
  rowCount: number;
  matchedTransactions: number;
  newTransactions: number;
  balanceFound: boolean;
  error: string | null;
}

export interface ConnectorSnapshot {
  transactions: DiningTransaction[];
  balanceSnapshots: BalanceSnapshot[];
  syncStatus: ConnectorSyncStatus | null;
  updatedAt: string | null;
}

export interface ConnectorResponsePayload {
  version: string;
  snapshot?: ConnectorSnapshot;
  openedGet?: boolean;
}

export interface ConnectorResponse {
  source: typeof CONNECTOR_EXTENSION_SOURCE;
  type: 'CHEWMASH_CONNECTOR_RESPONSE';
  requestId: string;
  ok: boolean;
  payload?: ConnectorResponsePayload;
  error?: string;
}

export interface ConnectorReady {
  source: typeof CONNECTOR_EXTENSION_SOURCE;
  type: 'CHEWMASH_CONNECTOR_READY';
  payload: {
    version: string;
  };
}

export interface ConnectorUpdate {
  source: typeof CONNECTOR_EXTENSION_SOURCE;
  type: 'CHEWMASH_CONNECTOR_UPDATE';
  payload: ConnectorResponsePayload;
}

export type ConnectorPageMessage = ConnectorResponse | ConnectorReady | ConnectorUpdate;

export function isConnectorRequest(value: unknown): value is ConnectorRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.source === CONNECTOR_WEB_SOURCE
    && record.type === 'CHEWMASH_CONNECTOR_REQUEST'
    && typeof record.requestId === 'string'
    && record.requestId.length > 0
    && (record.action === 'ping' || record.action === 'pull' || record.action === 'sync');
}

export function isConnectorPageMessage(value: unknown): value is ConnectorPageMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.source !== CONNECTOR_EXTENSION_SOURCE || typeof record.type !== 'string') return false;

  if (record.type === 'CHEWMASH_CONNECTOR_READY') {
    return hasVersionPayload(record.payload);
  }

  if (record.type === 'CHEWMASH_CONNECTOR_UPDATE') {
    return hasVersionPayload(record.payload);
  }

  if (record.type === 'CHEWMASH_CONNECTOR_RESPONSE') {
    return typeof record.requestId === 'string'
      && record.requestId.length > 0
      && typeof record.ok === 'boolean';
  }

  return false;
}

function hasVersionPayload(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return typeof (value as Record<string, unknown>).version === 'string';
}
