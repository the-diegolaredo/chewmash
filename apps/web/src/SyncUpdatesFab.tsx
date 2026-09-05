import { useEffect, useState } from 'react';
import type { ConnectorSyncStatus } from '../../../src/connector/protocol';
import type { GetConnectorModel } from './useGetConnector';

export function SyncUpdatesFab({ connector }: { connector: GetConnectorModel }) {
  const [open, setOpen] = useState(false);
  const updates = connector.syncHistory.slice(0, 4);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <aside className={open ? 'sync-updates-fab open' : 'sync-updates-fab'} aria-label="GET sync updates">
      <div id="sync-updates-panel" className="sync-updates-stack" aria-hidden={!open} aria-live="polite">
        {connector.busy ? (
          <div className="sync-update-card live">
            <div className="sync-update-card-copy">
              <strong>Opening GET…</strong>
              <span>Waiting for your latest Transaction History sync.</span>
            </div>
            <span className="sync-update-pulse" aria-hidden="true" />
          </div>
        ) : null}

        {updates.length ? updates.map(status => (
          <SyncUpdateCard key={`${status.capturedAt}-${status.matchedTransactions}-${status.newTransactions}-${status.error ?? ''}`} status={status} />
        )) : !connector.busy ? (
          <div className="sync-update-card empty">
            <div className="sync-update-card-copy">
              <strong>No GET updates yet</strong>
              <span>Your latest syncs will appear here after you use Sync GET.</span>
            </div>
          </div>
        ) : null}
      </div>

      <button
        className="sync-updates-button"
        type="button"
        aria-label={open ? 'Hide GET sync updates' : 'Show GET sync updates'}
        aria-expanded={open}
        aria-controls="sync-updates-panel"
        onClick={() => setOpen(current => !current)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      </button>
    </aside>
  );
}

function SyncUpdateCard({ status }: { status: ConnectorSyncStatus }) {
  const captured = new Date(status.capturedAt);
  const time = Number.isNaN(captured.getTime())
    ? 'Recent sync'
    : captured.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  const title = status.error
    ? 'GET sync needs attention'
    : status.newTransactions > 0
      ? `${status.newTransactions} new purchase${status.newTransactions === 1 ? '' : 's'}`
      : 'GET is up to date';

  const detail = status.error
    ? status.error
    : `${status.matchedTransactions} purchase${status.matchedTransactions === 1 ? '' : 's'} matched${status.balanceFound ? ' · balance updated' : ''}`;

  return (
    <div className={status.error ? 'sync-update-card error' : 'sync-update-card'}>
      <div className="sync-update-card-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <time dateTime={status.capturedAt}>{time}</time>
    </div>
  );
}
