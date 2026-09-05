/*
 * chewmash mobile GET capture prototype.
 *
 * IMPORTANT: This script is only intended to be evaluated after native code has
 * verified the exact URL https://get.cbord.com/calpoly/full/history.php.
 * It reads transaction-table text and an optional visible balance. It does not
 * inspect forms, inputs, cookies, localStorage, credentials, or raw HTML.
 */
(function installChewmashGetCapture(root) {
  const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
  const TIME_RE = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
  const AMOUNT_RE = /[-−]?\s*\$\s*\d[\d,]*\.\d{2}/g;

  function normalizeLocation(value) {
    return String(value || '')
      .replace(/^Grubhub\s+/i, '')
      .replace(/\s+\d{3,4}$/i, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown';
  }

  function toIsoDate(value) {
    const match = String(value || '').match(DATE_RE);
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const yearRaw = match[3];
    const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
    if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function moneyNumber(value) {
    const normalized = String(value || '').replace(/−/g, '-').replace(/\s+/g, '');
    const number = Number(normalized.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(number) ? number : null;
  }

  function parseRow(cells) {
    const cleanCells = cells.map(value => String(value || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (cleanCells.length < 3) return null;

    const joined = cleanCells.join(' | ');
    if (/account name|activity details|amount\s*\(currency\)/i.test(joined)) return null;

    const dateToken = joined.match(DATE_RE)?.[0];
    const timeToken = joined.match(TIME_RE)?.[0];
    const amounts = joined.match(AMOUNT_RE) || [];
    if (!dateToken || !timeToken || !amounts.length) return null;

    const signedAmount = moneyNumber(amounts[amounts.length - 1]);
    if (signedAmount === null || signedAmount >= 0) return null;

    const dateIndex = cleanCells.findIndex(cell => DATE_RE.test(cell) || TIME_RE.test(cell));
    const amountIndex = cleanCells.findIndex(cell => (cell.match(AMOUNT_RE) || []).length > 0);

    let rawLocation = '';
    if (dateIndex >= 0 && amountIndex > dateIndex) {
      rawLocation = cleanCells
        .slice(dateIndex + 1, amountIndex)
        .filter(cell => !/^First Year Plus$/i.test(cell))
        .join(' ')
        .trim();
    }

    if (!rawLocation) {
      rawLocation = cleanCells.find(cell =>
        !DATE_RE.test(cell)
        && !TIME_RE.test(cell)
        && (cell.match(AMOUNT_RE) || []).length === 0
        && !/^First Year Plus$/i.test(cell),
      ) || 'Unknown';
    }

    const date = toIsoDate(dateToken);
    if (!date) return null;

    return {
      date,
      time: timeToken.replace(/\s+/g, ' ').toUpperCase(),
      rawLocation,
      location: normalizeLocation(rawLocation),
      amount: Math.abs(signedAmount),
      source: 'GET sync',
    };
  }

  function parseBalance(text) {
    const patterns = [
      /(?:available|current|ending)\s+balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
      /balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
    ];
    for (const pattern of patterns) {
      const match = String(text || '').match(pattern);
      if (!match || !match[1]) continue;
      const number = Number(match[1].replace(/,/g, ''));
      if (Number.isFinite(number) && number >= 0) return number;
    }
    return null;
  }

  function key(transaction) {
    return [transaction.date, transaction.time, transaction.rawLocation, transaction.amount.toFixed(2)].join('|');
  }

  root.chewmashCaptureGet = function chewmashCaptureGet(doc) {
    const rows = Array.from(doc.querySelectorAll('table tr'));
    const seen = new Set();
    const transactions = [];

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('th,td')).map(cell => cell.innerText || cell.textContent || '');
      const parsed = parseRow(cells);
      if (!parsed) continue;
      const transactionKey = key(parsed);
      if (seen.has(transactionKey)) continue;
      seen.add(transactionKey);
      transactions.push(parsed);
    }

    const balance = parseBalance(doc.body?.innerText || '');
    return {
      version: 1,
      capturedAt: new Date().toISOString(),
      tableCount: doc.querySelectorAll('table').length,
      rowCount: rows.length,
      matchedTransactions: transactions.length,
      balance,
      transactions,
    };
  };
})(globalThis);
