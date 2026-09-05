import {
  CONNECTOR_WEB_SOURCE,
  isConnectorPageMessage,
  type ConnectorAction,
  type ConnectorPageMessage,
  type ConnectorRequest,
  type ConnectorResponse,
} from '../../../src/connector/protocol';

const DEFAULT_TIMEOUT_MS = 1_200;

export async function requestConnector(
  action: ConnectorAction,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  options: { date?: string } = {},
): Promise<ConnectorResponse | null> {
  const requestId = createRequestId();
  const request: ConnectorRequest = {
    source: CONNECTOR_WEB_SOURCE,
    type: 'CHEWMASH_CONNECTOR_REQUEST',
    action,
    requestId,
    ...(options.date ? { date: options.date } : {}),
  };

  return await new Promise(resolve => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };

    const finish = (response: ConnectorResponse | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(response);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (!isConnectorPageMessage(event.data)) return;
      if (event.data.type !== 'CHEWMASH_CONNECTOR_RESPONSE') return;
      if (event.data.requestId !== requestId) return;
      finish(event.data);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);
    window.addEventListener('message', onMessage);
    window.postMessage(request, window.location.origin);
  });
}

export function subscribeConnectorMessages(
  listener: (message: ConnectorPageMessage) => void,
): () => void {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    if (!isConnectorPageMessage(event.data)) return;
    listener(event.data);
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chewmash-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
