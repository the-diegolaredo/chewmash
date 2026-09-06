import type { GetConnectorModel } from '../useGetConnector';

export function ConnectorSummary({ connector }: { connector: GetConnectorModel }) {
  const status = connector.syncStatus;
  const detected = connector.installed
    ? `Connector${connector.version ? ` v${connector.version}` : ''} detected.`
    : connector.checking
      ? 'Looking for the chewmash connector…'
      : 'Connector not detected. The current Chrome beta can be installed now; Chrome Web Store distribution comes later.';
  const lastSync = status
    ? ` Last GET capture: ${new Date(status.capturedAt).toLocaleString()} · ${status.matchedTransactions} matched.`
    : '';

  return (
    <div className="sync-summary">
      {connector.message ?? `${detected}${lastSync}`}
    </div>
  );
}
