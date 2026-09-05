(() => {
  'use strict';

  if (!/\/calpoly\/full\/history\.php/i.test(location.pathname)) return;

  const STORAGE_KEY = 'chewmashGetPayload';
  const STATUS_KEY = 'chewmashGetStatus';
  const dateRe = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
  const timeRe = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
  const amountRe = /[-−]?\s*\$\s*\d[\d,]*\.\d{2}/g;

  function toIsoDate(value) {
    const m = String(value || '').match(dateRe);
    if (!m) return null;
    const year = m[3].length === 2 ? Number(`20${m[3]}`) : Number(m[3]);
    return `${year}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`;
  }

  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function normalizeLocation(value) {
    return String(value || 'Unknown')
      .replace(/^Grubhub\s+/i, '')
      .replace(/\s+\d{3,4}$/i, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown';
  }

  function moneyNumber(value) {
    const s = String(value || '').replace(/−/g, '-').replace(/\s+/g, '');
    const n = Number(s.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function parseRow(row) {
    const cells = [...row.querySelectorAll('th,td')].map(c => (c.innerText || c.textContent || '').replace(/\s+/g,' ').trim()).filter(Boolean);
    if (cells.length < 3) return null;
    const joined = cells.join(' | ');
    if (/account name|activity details|amount\s*\(currency\)/i.test(joined)) return null;

    const date = joined.match(dateRe)?.[0];
    const time = joined.match(timeRe)?.[0];
    const amounts = joined.match(amountRe) || [];
    if (!date || !time || !amounts.length) return null;

    const amountToken = amounts.at(-1);
    const signed = moneyNumber(amountToken);
    if (signed === null || signed >= 0) return null;

    const dateIdx = cells.findIndex(c => dateRe.test(c) || timeRe.test(c));
    const amountIdx = cells.findIndex(c => (c.match(amountRe) || []).length);
    let rawLocation = '';
    if (dateIdx >= 0 && amountIdx > dateIdx) {
      rawLocation = cells.slice(dateIdx + 1, amountIdx).filter(c => !/^First Year Plus$/i.test(c)).join(' ').trim();
    }
    if (!rawLocation) {
      rawLocation = cells.find(c => !dateRe.test(c) && !timeRe.test(c) && !(c.match(amountRe)||[]).length && !/^First Year Plus$/i.test(c)) || 'Unknown';
    }

    return {
      date: toIsoDate(date),
      time: time.replace(/\s+/g,' ').toUpperCase(),
      rawLocation,
      location: normalizeLocation(rawLocation),
      amount: Math.abs(signed)
    };
  }

  function parseTransactions() {
    const found = [];
    const rows = [...document.querySelectorAll('table tr')];
    for (const row of rows) {
      const parsed = parseRow(row);
      if (parsed?.date && parsed.amount > 0) found.push(parsed);
    }
    const seen = new Set();
    return found.filter(t => {
      const k = `${t.date}|${t.time}|${t.rawLocation}|${t.amount.toFixed(2)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function parseBalance() {
    const text = document.body?.innerText || '';
    for (const re of [/(?:available|current|ending)\s+balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,/balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i]) {
      const m = text.match(re);
      if (m) return Number(m[1].replace(/,/g,''));
    }
    return null;
  }

  async function capture() {
    let transactions = [];
    let balance = null;
    let error = null;
    try {
      transactions = parseTransactions();
      balance = parseBalance();
    } catch (e) {
      error = String(e?.message || e);
    }

    const status = {
      attemptedAt: new Date().toISOString(),
      url: location.href,
      frame: window === top ? 'top' : 'iframe',
      tableCount: document.querySelectorAll('table').length,
      rowCount: document.querySelectorAll('table tr').length,
      matchedTransactions: transactions.length,
      balance,
      error
    };
    await chrome.storage.local.set({ [STATUS_KEY]: status });

    if (!transactions.length && balance === null) return status;
    const payload = {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      capturedDate: localDate(),
      balance,
      transactions
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: payload, [STATUS_KEY]: status });
    return status;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'CHEWMASH_CAPTURE_NOW') return;
    capture().then(status => sendResponse({ ok: true, status })).catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  });

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => capture().catch(() => {}), 300);
  };
  schedule();
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(() => observer.disconnect(), 15000);
})();
