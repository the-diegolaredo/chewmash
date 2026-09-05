(() => {
  'use strict';

  const APP_ORIGIN = 'https://the-diegolaredo.github.io';
  const APP_PATH_PREFIX = '/chewmash';
  const STORAGE_KEY = 'chewmashGetPayload';

  if (location.origin !== APP_ORIGIN || !location.pathname.startsWith(APP_PATH_PREFIX)) return;

  function send(type, payload = null) {
    window.postMessage({ source: 'chewmash-extension', type, payload }, APP_ORIGIN);
  }

  async function sendStoredData() {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    send('CHEWMASH_GET_DATA', stored[STORAGE_KEY] || null);
  }

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== APP_ORIGIN) return;
    const message = event.data;
    if (!message || message.source !== 'chewmash-app') return;
    if (message.type === 'CHEWMASH_GET_DATA_REQUEST') {
      sendStoredData().catch(() => send('CHEWMASH_GET_DATA', null));
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) return;
    send('CHEWMASH_GET_DATA', changes[STORAGE_KEY].newValue || null);
  });

  send('CHEWMASH_EXTENSION_READY');
})();
