import { fetchCalPolyMenu, type DineOnCampusMenuItem } from '../../../src/menu/dineoncampus';

const CACHE_KEY_PREFIX = 'chewmash.menu.v1';
const FRESH_FOR_MS = 30 * 60 * 1_000;

interface CachedMenu {
  date: string;
  fetchedAt: string;
  items: DineOnCampusMenuItem[];
}

export interface WebMenuResult {
  items: DineOnCampusMenuItem[];
  fetchedAt: string;
  source: 'cache' | 'dineoncampus' | 'connector';
}

export async function loadWebMenu(
  date: string,
  connectorFetch?: (date: string) => Promise<DineOnCampusMenuItem[] | null>,
  force = false,
): Promise<WebMenuResult> {
  const cached = readCache(date);
  if (!force && cached && Date.now() - Date.parse(cached.fetchedAt) < FRESH_FOR_MS) {
    return { ...cached, source: 'cache' };
  }

  let directError: unknown = null;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9_000);
    try {
      const items = await fetchCalPolyMenu(date, { signal: controller.signal });
      const fetchedAt = new Date().toISOString();
      writeCache({ date, fetchedAt, items });
      return { items, fetchedAt, source: 'dineoncampus' };
    } finally {
      window.clearTimeout(timer);
    }
  } catch (error) {
    directError = error;
  }

  if (connectorFetch) {
    try {
      const items = await connectorFetch(date);
      if (items?.length) {
        const fetchedAt = new Date().toISOString();
        writeCache({ date, fetchedAt, items });
        return { items, fetchedAt, source: 'connector' };
      }
    } catch {
      // The stale cache below is preferable to failing the whole Picks page.
    }
  }

  if (cached?.items.length) return { ...cached, source: 'cache' };

  const message = directError instanceof Error && directError.name !== 'AbortError'
    ? directError.message
    : 'Dine On Campus did not respond in time.';
  throw new Error(`${message} Install or reload the chewmash connector and try again.`);
}

function readCache(date: string): CachedMenu | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}:${date}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CachedMenu>;
    if (parsed.date !== date || typeof parsed.fetchedAt !== 'string' || !Array.isArray(parsed.items)) return null;
    return { date, fetchedAt: parsed.fetchedAt, items: parsed.items as DineOnCampusMenuItem[] };
  } catch {
    return null;
  }
}

function writeCache(cache: CachedMenu) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}:${cache.date}`, JSON.stringify(cache));
  } catch {
    // Menu caching is an optimization. Picks still works without storage space.
  }
}
