import { browser } from 'wxt/browser';

const GET_HISTORY_URL = 'https://get.cbord.com/calpoly/full/history.php';
const WEB_APP_URL = 'https://the-diegolaredo.github.io/chewmash/';
const ALLOWED_WEB_PREFIXES = [
  'https://the-diegolaredo.github.io/chewmash/',
  'https://chewmash.app/',
];

export default defineBackground(() => {
  browser.action.onClicked.addListener(async () => {
    await browser.tabs.create({ url: WEB_APP_URL });
  });

  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (typeof message !== 'object' || message === null) return undefined;
    if ((message as { type?: string }).type !== 'CHEWMASH_OPEN_GET_FROM_WEB') return undefined;

    const senderUrl = sender.url ?? '';
    if (!ALLOWED_WEB_PREFIXES.some(prefix => senderUrl.startsWith(prefix))) {
      throw new Error('chewmash rejected a connector request from an untrusted page.');
    }

    const existing = await browser.tabs.query({ url: `${GET_HISTORY_URL}*` });
    const tab = existing[0];

    if (tab?.id !== undefined) {
      await browser.tabs.update(tab.id, { active: true });
      await browser.tabs.reload(tab.id);
    } else {
      await browser.tabs.create({ url: GET_HISTORY_URL, active: true });
    }

    return { openedGet: true };
  });
});
