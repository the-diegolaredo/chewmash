import { browser } from 'wxt/browser';
import { fetchCalPolyMenu } from '../src/menu/dineoncampus';

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
    const type = (message as { type?: string }).type;
    if (type !== 'CHEWMASH_OPEN_GET_FROM_WEB' && type !== 'CHEWMASH_FETCH_MENU_FROM_WEB') return undefined;

    const senderUrl = sender.url ?? '';
    if (!ALLOWED_WEB_PREFIXES.some(prefix => senderUrl.startsWith(prefix))) {
      throw new Error('chewmash rejected a connector request from an untrusted page.');
    }

    if (type === 'CHEWMASH_FETCH_MENU_FROM_WEB') {
      const date = (message as { date?: unknown }).date;
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid Dine On Campus menu date.');
      }
      return { menu: await fetchCalPolyMenu(date) };
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
