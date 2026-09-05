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
      await chrome.tabs.sendMessage(tab.id, { type: 'CHEWMASH_CAPTURE_NOW' });
      await new Promise(r => setTimeout(r, 150));
      await renderStored();
    } catch (e) {
      $('status').className = 'bad';
      $('status').textContent = 'Could not capture this page.';
      $('details').textContent = `${e?.message || e}. If you just reloaded the extension, refresh the GET page and try again.`;
    }
  });

  renderStored().catch(() => {});
})();
