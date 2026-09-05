import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type FakeCell = { innerText: string; textContent: string };
type FakeRow = { querySelectorAll: (selector: string) => FakeCell[] };

declare global {
  // eslint-disable-next-line no-var
  var chewmashCaptureGet: ((document: unknown) => {
    matchedTransactions: number;
    balance: number | null;
    transactions: Array<{ date: string; time: string; rawLocation: string; location: string; amount: number; source: string }>;
  }) | undefined;
}

function fakeDocument(rows: string[][], bodyText = '') {
  const fakeRows: FakeRow[] = rows.map(values => ({
    querySelectorAll: selector => selector === 'th,td'
      ? values.map(value => ({ innerText: value, textContent: value }))
      : [],
  }));

  return {
    body: { innerText: bodyText },
    querySelectorAll(selector: string) {
      if (selector === 'table tr') return fakeRows;
      if (selector === 'table') return [{}];
      return [];
    },
  };
}

describe('mobile GET capture script', () => {
  beforeEach(() => {
    delete globalThis.chewmashCaptureGet;
    const source = readFileSync(fileURLToPath(new URL('./mobile-capture.js', import.meta.url)), 'utf8');
    // This is the same plain JS resource that the iOS prototype injects into WKWebView.
    (0, eval)(source);
  });

  it('extracts only debit transactions and normalizes a Grubhub merchant', () => {
    const result = globalThis.chewmashCaptureGet!(fakeDocument([
      ['DATE & TIME', 'ACTIVITY DETAILS', 'AMOUNT (CURRENCY)'],
      ['09/05/2026 12:14 PM', 'Grubhub Panda Express 1234', '- $13.07'],
      ['09/05/2026 12:20 PM', 'Deposit', '$20.00'],
    ]));

    expect(result.matchedTransactions).toBe(1);
    expect(result.transactions[0]).toEqual({
      date: '2026-09-05',
      time: '12:14 PM',
      rawLocation: 'Grubhub Panda Express 1234',
      location: 'Panda Express',
      amount: 13.07,
      source: 'GET sync',
    });
  });

  it('deduplicates matching rows and keeps missing balance as null', () => {
    const row = ['09/05/2026 8:02 AM', 'Starbucks 1001', '− $6.25'];
    const result = globalThis.chewmashCaptureGet!(fakeDocument([row, row]));

    expect(result.matchedTransactions).toBe(1);
    expect(result.balance).toBeNull();
  });

  it('captures a visible balance when GET exposes one', () => {
    const result = globalThis.chewmashCaptureGet!(fakeDocument([
      ['09/05/2026 6:45 PM', 'Vista Grande', '- $11.50'],
    ], 'Current Balance: $2,915.81'));

    expect(result.balance).toBe(2915.81);
  });
});
