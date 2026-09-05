(() => {
  'use strict';

  // Only inspect the GET transaction-history page. Other Cal Poly GET pages are ignored.
  if (!/\/calpoly\/full\/history\.php$/i.test(location.pathname)) return;

  const STORAGE_KEY = 'chewmashGetPayload';
  const dateRe = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
  const timeRe = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
  const amountRe = /-?\$\s*\d[\d,]*\.\d{2}/g;

  function toIsoDate(value) {
    const match = String(value || '').match(dateRe);
    if (!match) return null;
    const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function localDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function normalizeLocation(value) {
    return String(value || 'Unknown')
      .replace(/^Grubhub\s+/i, '')
      .replace(/\s+\d{3,4}$/, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown';
  }

  function moneyNumber(value) {
    const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function looksLikeHeader(text) {
    return /account name|date\s*&?\s*time|activity details|amount\s*\(currency\)|transaction history/i.test(text);
  }

  function parseTransactionRow(row) {
    const cells = [...row.querySelectorAll('th,td')]
      .map(cell => cell.innerText.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (cells.length < 2) return null;

    const joined = cells.join(' | ');
    if (looksLikeHeader(joined)) return null;

    const dateMatch = joined.match(dateRe);
    const timeMatch = joined.match(timeRe);
    const amounts = joined.match(amountRe) || [];
    if (!dateMatch || !timeMatch || !amounts.length) return null;

    // GET spending rows are charges. Ignore deposits/credits so the app does not
    // accidentally treat plan funding as dining spend.
    const amountToken = amounts[amounts.length - 1];
    const signedAmount = moneyNumber(amountToken);
    if (signedAmount === null || signedAmount >= 0) return null;

    const dateCellIndex = cells.findIndex(cell => dateRe.test(cell) || timeRe.test(cell));
    const amountCellIndex = cells.findIndex(cell => (cell.match(amountRe) || []).length > 0);

    let detailCandidates = cells.filter((cell, index) => {
      if (index === dateCellIndex || index === amountCellIndex) return false;
      if (dateRe.test(cell) || timeRe.test(cell) || amountRe.test(cell)) return false;
      if (/^First Year Plus$/i.test(cell)) return false;
      if (/^Dining Dollars?$/i.test(cell)) return false;
      return !looksLikeHeader(cell);
    });

    // The activity-detail cell is usually between the date/time and amount cells.
    if (dateCellIndex >= 0 && amountCellIndex > dateCellIndex) {
      const between = cells.slice(dateCellIndex + 1, amountCellIndex).filter(cell =>
        !/^First Year Plus$/i.test(cell) && !looksLikeHeader(cell)
      );
      if (between.length) detailCandidates = between;
    }

    const rawLocation = (detailCandidates.sort((a, b) => b.length - a.length)[0] || 'Unknown').trim();
    return {
      date: toIsoDate(dateMatch[0]),
      time: timeMatch[0].replace(/\s+/g, ' ').toUpperCase(),
      rawLocation,
      location: normalizeLocation(rawLocation),
      amount: Math.abs(signedAmount)
    };
  }

  function parseTransactions() {
    const rows = [];
    document.querySelectorAll('table tr').forEach(row => {
      const parsed = parseTransactionRow(row);
      if (parsed?.date && parsed.amount > 0) rows.push(parsed);
    });

    const seen = new Set();
    return rows.filter(txn => {
      const key = `${txn.date}|${txn.time}|${txn.rawLocation}|${txn.amount.toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function parseBalance() {
    const text = document.body?.innerText || '';
    const patterns = [
      /(?:available|current|ending)\s+balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
      /balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = Number(match[1].replace(/,/g, ''));
        if (Number.isFinite(value)) return value;
      }
    }
    return null;
  }

  async function capture() {
    const transactions = parseTransactions();
    const balance = parseBalance();
    if (!transactions.length && balance === null) return false;

    const payload = {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      capturedDate: localDate(),
      balance,
      transactions
    };

    // Store structured dining data only. Do not store cookies, credentials,
    // the raw page HTML, student IDs, or other GET page contents.
    await chrome.storage.local.set({ [STORAGE_KEY]: payload });
    return true;
  }

  let timer = null;
  function scheduleCapture() {
    clearTimeout(timer);
    timer = setTimeout(() => capture().catch(() => {}), 250);
  }

  scheduleCapture();
  const observer = new MutationObserver(scheduleCapture);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();
