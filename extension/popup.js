(() => {
  const $ = id => document.getElementById(id);
  const STATUS_KEY = 'chewmashGetStatus';
  const PAYLOAD_KEY = 'chewmashGetPayload';

  async function renderStored() {
    const stored = await chrome.storage.local.get([STATUS_KEY, PAYLOAD_KEY]);
    const status = stored[STATUS_KEY];
    const payload = stored[PAYLOAD_KEY];
    if (!status) {
      $('status').textContent = 'No capture attempted yet.';
      $('details').textContent = '';
      return;
    }
    const count = Number(status.matchedTransactions || 0);
    $('status').className = count > 0 ? 'ok' : 'bad';
    $('status').textContent = count > 0
      ? `Captured ${count} transaction${count === 1 ? '' : 's'}.`
      : 'Capture ran, but no transactions matched.';
    $('details').textContent = `Tables: ${status.tableCount ?? 0} · Rows: ${status.rowCount ?? 0} · Frame: ${status.frame || 'unknown'}${payload?.capturedAt ? ` · Saved: ${new Date(payload.capturedAt).toLocaleTimeString()}` : ''}${status.error ? ` · Error: ${status.error}` : ''}`;
  }

  function captureGetPageInTab() {
    const dateRe = /\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/;
    const timeRe = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/i;
    const amountRe = /[-−]?\s*\$\s*\d[\d,]*\.\d{2}/g;

    function toIsoDate(value) {
      const m = String(value || '').match(dateRe);
      if (!m) return null;
      const year = m[3].length === 2 ? Number(`20${m[3]}`) : Number(m[3]);
      return `${year}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`;
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
      const cells = [...row.querySelectorAll('th,td')]
        .map(c => (c.innerText || c.textContent || '').replace(/\s+/g,' ').trim())
        .filter(Boolean);
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
        rawLocation = cells.slice(dateIdx + 1, amountIdx)
          .filter(c => !/^First Year Plus$/i.test(c))
          .join(' ')
          .trim();
      }

      if (!rawLocation) {
        rawLocation = cells.find(c =>
          !dateRe.test(c) &&
          !timeRe.test(c) &&
          !(c.match(amountRe) || []).length &&
          !/^First Year Plus$/i.test(c)
        ) || 'Unknown';
      }

      return {
        date: toIsoDate(date),
        time: time.replace(/\s+/g,' ').toUpperCase(),
        rawLocation,
        location: normalizeLocation(rawLocation),
        amount: Math.abs(signed)
      };
    }

    const found = [];
    const rows = [...document.querySelectorAll('table tr')];
    for (const row of rows) {
      const parsed = parseRow(row);
      if (parsed?.date && parsed.amount > 0) found.push(parsed);
    }

    const seen = new Set();
    const transactions = found.filter(t => {
      const key = `${t.date}|${t.time}|${t.rawLocation}|${t.amount.toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let balance = null;
    const bodyText = document.body?.innerText || '';
    for (const re of [
      /(?:available|current|ending)\s+balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i,
      /balance\s*:?\s*\$\s*([\d,]+\.\d{2})/i
    ]) {
      const m = bodyText.match(re);
      if (m) {
        const n = Number(m[1].replace(/,/g,''));
        if (Number.isFinite(n)) { balance = n; break; }
      }
    }

    return {
      href: location.href,
      frame: window === top ? 'top' : 'iframe',
      tableCount: document.querySelectorAll('table').length,
      rowCount: rows.length,
      transactions,
      balance
    };
  }

  $('capture').addEventListener('click', async () => {
    $('status').className = '';
    $('status').textContent = 'Capturing…';
    $('details').textContent = '';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found.');
      if (!/^https:\/\/get\.cbord\.com\/calpoly\//i.test(tab.url || '')) {
        throw new Error('Open the Cal Poly GET site first.');
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: captureGetPageInTab
      });

      const candidates = (results || [])
        .map(r => r.result)
        .filter(Boolean)
        .sort((a,b) => (b.transactions?.length || 0) - (a.transactions?.length || 0));

      if (!candidates.length) throw new Error('The GET page could not be inspected.');
      const best = candidates[0];
      const transactions = Array.isArray(best.transactions) ? best.transactions : [];

      const now = new Date();
      const capturedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const status = {
        attemptedAt: now.toISOString(),
        url: best.href,
        frame: best.frame,
        tableCount: best.tableCount,
        rowCount: best.rowCount,
        matchedTransactions: transactions.length,
        balance: best.balance,
        error: null
      };

      const payload = {
        schemaVersion: 1,
        capturedAt: now.toISOString(),
        capturedDate,
        balance: Number.isFinite(Number(best.balance)) ? Number(best.balance) : null,
        transactions
      };

      await chrome.storage.local.set({
        [STATUS_KEY]: status,
        ...(transactions.length || payload.balance !== null ? { [PAYLOAD_KEY]: payload } : {})
      });

      await renderStored();
    } catch (e) {
      $('status').className = 'bad';
      $('status').textContent = 'Could not capture this page.';
      $('details').textContent = `${e?.message || e}.`;
    }
  });

  renderStored().catch(() => {});
})();
