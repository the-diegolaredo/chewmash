import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  CONNECTOR_EXTENSION_SOURCE,
  isConnectorRequest,
  type ConnectorResponse,
  type ConnectorSnapshot,
} from '../src/connector/protocol';
import { GET_SYNC_STATUS_KEY, readGetSyncStatus } from '../src/get/status';
import { STORAGE_KEY } from '../src/storage/repository';
import { stateRepository } from '../src/storage/extension';

const WEB_MATCHES = [
  'https://the-diegolaredo.github.io/chewmash/*',
  'https://chewmash.app/*',
] as const;

export default defineContentScript({
  matches: [...WEB_MATCHES],
  runAt: 'document_idle',
  main() {
    const version = browser.runtime.getManifest().version;

    const post = (message: unknown) => {
      window.postMessage(message, window.location.origin);
    };

    async function readSnapshot(): Promise<ConnectorSnapshot> {
      const [state, syncStatus] = await Promise.all([
        stateRepository.load(),
        readGetSyncStatus(),
      ]);

      return {
        transactions: state.transactions.map(transaction => ({
          date: transaction.date,
          time: transaction.time,
          rawLocation: transaction.rawLocation,
          location: transaction.location,
          amount: transaction.amount,
          source: transaction.source,
        })),
        balanceSnapshots: state.balanceSnapshots.map(snapshot => ({
          date: snapshot.date,
          balance: snapshot.balance,
          source: snapshot.source,
        })),
        syncStatus,
        updatedAt: state.updatedAt,
      };
    }

    async function publishUpdate() {
      try {
        post({
          source: CONNECTOR_EXTENSION_SOURCE,
          type: 'CHEWMASH_CONNECTOR_UPDATE',
          payload: {
            version,
            snapshot: await readSnapshot(),
          },
        });
      } catch {
        // The website can request a fresh snapshot again if local storage is
        // temporarily unavailable. Never expose raw extension errors to page JS.
      }
    }

    const onWindowMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (!isConnectorRequest(event.data)) return;

      void (async () => {
        const response: ConnectorResponse = {
          source: CONNECTOR_EXTENSION_SOURCE,
          type: 'CHEWMASH_CONNECTOR_RESPONSE',
          requestId: event.data.requestId,
          ok: true,
          payload: { version },
        };

        try {
          if (event.data.action === 'pull') {
            response.payload = {
              version,
              snapshot: await readSnapshot(),
            };
          } else if (event.data.action === 'sync') {
            const result = await browser.runtime.sendMessage({
              type: 'CHEWMASH_OPEN_GET_FROM_WEB',
            }) as { openedGet?: boolean } | undefined;
            response.payload = {
              version,
              openedGet: result?.openedGet === true,
              snapshot: await readSnapshot(),
            };
          }
        } catch (error) {
          response.ok = false;
          response.error = error instanceof Error ? error.message : 'Connector request failed.';
        }

        post(response);
      })();
    };

    const onStorageChanged = (changes: Record<string, unknown>, areaName: string) => {
      if (areaName !== 'local') return;
      if (!(STORAGE_KEY in changes) && !(GET_SYNC_STATUS_KEY in changes)) return;
      void publishUpdate();
    };

    window.addEventListener('message', onWindowMessage);
    browser.storage.onChanged.addListener(onStorageChanged);

    post({
      source: CONNECTOR_EXTENSION_SOURCE,
      type: 'CHEWMASH_CONNECTOR_READY',
      payload: { version },
    });
  },
});
