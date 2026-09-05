import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { dedupeTransactions } from '../src/lib/transactions';
import { parseGetBalanceText, parseGetRowCells } from '../src/get/parser';
import { writeGetSyncStatus, type GetSyncStatus } from '../src/get/status';
import { stateRepository } from '../src/storage/extension';

const HISTORY_PATH = '/calpoly/full/history.php';

export default defineContentScript({
  matches: ['https://get.cbord.com/calpoly/*'],
  runAt: 'document_idle',
  main() {
    if (location.pathname.toLowerCase() !== HISTORY_PATH) return;

    let debounceTimer: number | undefined;
    let captureInFlight = false;
    let captureAgain = false;

    async function capture(): Promise<GetSyncStatus> {
      if (captureInFlight) {
        captureAgain = true;
        return readFallbackStatus();
      }
      captureInFlight = true;

      try {
        const rows = [...document.querySelectorAll<HTMLTableRowElement>('table tr')];
        const parsed = rows
          .map(row => {
            const cells = [...row.querySelectorAll<HTMLElement>('th,td')]
              .map(cell => cell.innerText || cell.textContent || '');
            return parseGetRowCells(cells);
          })
          .filter((value): value is NonNullable<typeof value> => value !== null);

        const transactions = dedupeTransactions(parsed);
        const balance = parseGetBalanceText(document.body?.innerText ?? '');

        const before = await stateRepository.load();
        let after = before;
        if (transactions.length) {
          after = await stateRepository.mergeTransactions(transactions);
        }
        if (balance !== null) {
          after = await stateRepository.addBalanceSnapshot({
            date: localDate(),
            balance,
            source: 'GET sync',
          });
        }

        const status: GetSyncStatus = {
          capturedAt: new Date().toISOString(),
          tableCount: document.querySelectorAll('table').length,
          rowCount: rows.length,
          matchedTransactions: transactions.length,
          newTransactions: Math.max(0, after.transactions.length - before.transactions.length),
          balanceFound: balance !== null,
          error: null,
        };
        await writeGetSyncStatus(status);
        return status;
      } catch (error) {
        const status: GetSyncStatus = {
          capturedAt: new Date().toISOString(),
          tableCount: document.querySelectorAll('table').length,
          rowCount: document.querySelectorAll('table tr').length,
          matchedTransactions: 0,
          newTransactions: 0,
          balanceFound: false,
          error: error instanceof Error ? error.message : String(error),
        };
        await writeGetSyncStatus(status);
        return status;
      } finally {
        captureInFlight = false;
        if (captureAgain) {
          captureAgain = false;
          scheduleCapture(100);
        }
      }
    }

    function scheduleCapture(delay = 350) {
      if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        void capture();
      }, delay);
    }

    function readFallbackStatus(): GetSyncStatus {
      return {
        capturedAt: new Date().toISOString(),
        tableCount: document.querySelectorAll('table').length,
        rowCount: document.querySelectorAll('table tr').length,
        matchedTransactions: 0,
        newTransactions: 0,
        balanceFound: false,
        error: null,
      };
    }

    browser.runtime.onMessage.addListener(message => {
      if (typeof message !== 'object' || message === null) return undefined;
      if ((message as { type?: string }).type !== 'CHEWMASH_CAPTURE_NOW') return undefined;
      return capture();
    });

    scheduleCapture(0);
    const observer = new MutationObserver(() => scheduleCapture());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15_000);
  },
});

function localDate(): string {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
