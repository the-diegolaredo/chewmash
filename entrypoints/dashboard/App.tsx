import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { GET_SYNC_STATUS_KEY, readGetSyncStatus, type GetSyncStatus } from '../../src/get/status';
import { stateRepository } from '../../src/storage/extension';
import { STORAGE_KEY } from '../../src/storage/repository';
import type { ChewMashState } from '../../src/storage/state';

const GET_HISTORY_URL = 'https://get.cbord.com/calpoly/full/history.php';

export function App() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [syncStatus, setSyncStatus] = useState<GetSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingGet, setOpeningGet] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nextState, nextStatus] = await Promise.all([
        stateRepository.load(),
        readGetSyncStatus(),
      ]);
      setState(nextState);
      setSyncStatus(nextStatus);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read local extension storage.');
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onStorageChanged = (changes: Record<string, unknown>, areaName: string) => {
      if (areaName !== 'local') return;
      if (STORAGE_KEY in changes || GET_SYNC_STATUS_KEY in changes) void refresh();
    };

    browser.storage.onChanged.addListener(onStorageChanged);
    return () => browser.storage.onChanged.removeListener(onStorageChanged);
  }, [refresh]);

  async function openGetSync() {
    setOpeningGet(true);
    setError(null);
    try {
      const existing = await browser.tabs.query({ url: `${GET_HISTORY_URL}*` });
      const tab = existing[0];
      if (tab?.id !== undefined) {
        await browser.tabs.update(tab.id, { active: true });
        await browser.tabs.reload(tab.id);
      } else {
        await browser.tabs.create({ url: GET_HISTORY_URL });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open GET.');
    } finally {
      setOpeningGet(false);
    }
  }

  return (
    <main>
      <header>ChewMash</header>
      <section className="hero">
        <div>
          <p className="eyebrow">Private extension dashboard</p>
          <h1>React migration</h1>
          <p>Dining data stays in this extension. GET sync now writes directly into the same local store.</p>
        </div>
        <button type="button" onClick={openGetSync} disabled={openingGet}>
          {openingGet ? 'Opening GET…' : 'Sync from GET'}
        </button>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {!state ? (
        <p>Loading private extension storage…</p>
      ) : (
        <dl className="stats">
          <div>
            <dt>Starting budget</dt>
            <dd>${state.plan.startingBudget.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Transactions</dt>
            <dd>{state.transactions.length}</dd>
          </div>
          <div>
            <dt>Balance snapshots</dt>
            <dd>{state.balanceSnapshots.length}</dd>
          </div>
        </dl>
      )}

      <section className="sync-card">
        <h2>GET sync</h2>
        {!syncStatus ? (
          <p>No GET capture yet. Open GET once and the transaction-history page will sync automatically.</p>
        ) : syncStatus.error ? (
          <p className="error">Last sync error: {syncStatus.error}</p>
        ) : (
          <>
            <p>
              Last capture matched <strong>{syncStatus.matchedTransactions}</strong> transactions and added{' '}
              <strong>{syncStatus.newTransactions}</strong> new ones.
            </p>
            <p className="muted">
              {new Date(syncStatus.capturedAt).toLocaleString()} · {syncStatus.rowCount} table rows
              {syncStatus.balanceFound ? ' · balance found' : ' · no balance shown on this GET page'}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
