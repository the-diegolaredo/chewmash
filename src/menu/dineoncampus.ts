export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'all-day' | 'other';

export interface DineOnCampusMenuItem {
  id: string;
  name: string;
  location: string;
  locationId: string;
  station: string | null;
  period: MealPeriod;
  periodName: string;
  date: string;
  price: number | null;
  calories: number | null;
  portion: string | null;
  description: string | null;
  filters: string[];
}

interface DiningLocation {
  id: string;
  name: string;
}

interface DiningPeriod {
  id: string;
  name: string;
  slug?: string;
}

const API_BASE = 'https://apiv4.dineoncampus.com';
const SITES_URL = `${API_BASE}/sites/public`;
const MENU_CACHE_MIN_ITEMS = 1;

// Public Dine On Campus identifiers. These are a resilience fallback only;
// live site/location discovery runs first so newly added Cal Poly venues can
// appear without a chewmash release.
const KNOWN_CALPOLY_LOCATIONS: DiningLocation[] = [
  { name: '1901 Kitchen', id: '66bbafe2c625af0582e2bf84' },
  { name: 'Balance Café', id: '68b87ec0b758aa2ffbefce7d' },
  { name: 'Brunch', id: '64d5552d351d5305edbfb3e8' },
  { name: 'Campus Market', id: '6525a669351d5306a1177d06' },
  { name: 'Chick-fil-A', id: '659c29edc625af07f9dfe571' },
  { name: 'CP Partners Pavilion', id: '6662080ee45d4307d241cbaa' },
  { name: 'Einstein Bros. Bagels', id: '6440848ac625af079eb667be' },
  { name: 'G. Brothers Taqueria - Lunch', id: '64e9246c351d53067ffdbc9d' },
  { name: 'Grill at Campus Market', id: '689b735b0d4474603172a953' },
  { name: 'Grubhub Robots', id: '6706a38ec625af0173152bac' },
  { name: 'Health Shack', id: '64d67df0c625af06b2ab80db' },
  { name: 'Hearth', id: '64d5552c351d5305edbfb3d6' },
  { name: 'Hilltop', id: '649c5d53c625af06345771a1' },
  { name: 'Jamba', id: '644080d9c625af07f4319dc2' },
  { name: 'Jewel of India - Dinner', id: '64e91c16351d530693f676af' },
  { name: 'Jewel of India - Lunch', id: '644085c7c625af080de6568a' },
  { name: "Julian's", id: '65b06964c625af0b9bc2e50f' },
  { name: "Julian's Library", id: '687eaf43ef69769fe7128d47' },
  { name: 'Market at Grand Ave', id: '64ad9961e45d4367c97cf97b' },
  { name: 'Mingle + Nosh', id: '64d5552d351d5305edbfb40a' },
  { name: 'Noodles', id: '64d5552d351d5305edbfb3ed' },
  { name: 'Panda Express', id: '659c2cc3e45d4308b4202efc' },
  { name: 'Picos', id: '65b199c4c625af0ad308d398' },
  { name: 'Plant Ivy - Dinner', id: '64e91b22351d53066bf88556' },
  { name: 'Plant Ivy - Lunch', id: '644085d0c625af086b8960b9' },
  { name: 'Poly Choice', id: '65b19b85c625af0abf21a76f' },
  { name: 'Pom & Honey', id: '65b19831e45d4308ffa19f5c' },
  { name: 'Red Radish', id: '65b0649ce45d43098ed6a75c' },
  { name: 'Scout Coffee Co.', id: '644081afc625af078a0deee5' },
  { name: 'Sequel', id: '687ea36d831b8cd0040de988' },
  { name: 'Shake Smart', id: '6440825fc625af080de60c54' },
  { name: 'Starbucks', id: '644082cac625af07c8eee340' },
  { name: 'Streats', id: '64d5552c351d5305edbfb3dc' },
  { name: "Streats (Wed. Chef's Table)", id: '64d5035f351d5306009c9cb4' },
  { name: 'Subway at Kennedy Library', id: '6440850dc625af07de8e08a2' },
  { name: 'Subway at PCV', id: '6440855dc625af07b34e8999' },
  { name: 'Taco Bell', id: '65428d15351d53063a1ff021' },
  { name: 'The Deli at Market Grand Ave', id: '6499ed3ec625af065670cb22' },
  { name: 'UU Market', id: '649b3022c625af062051f582' },
  { name: 'Vista Grande Express', id: '64d6b253e45d430659d67b91' },
  { name: 'Wednesday BBQ (at Campus Market Grill)', id: '66f6fa15e45d43013252108e' },
  { name: "What's Cookin' Kosher - Dinner", id: '64e91c66351d5306d2f151c1' },
  { name: "What's Cookin' Kosher - Lunch", id: '659c33dbe45d4308f6de890c' },
];

export function mealPeriodFromName(name: string, slug = ''): MealPeriod {
  const value = `${name} ${slug}`.toLowerCase();
  if (value.includes('breakfast') || value.includes('brunch')) return 'breakfast';
  if (value.includes('lunch')) return 'lunch';
  if (value.includes('dinner') || value.includes('supper')) return 'dinner';
  if (value.includes('everyday') || value.includes('all day') || value.includes('all-day')) return 'all-day';
  return 'other';
}

export function normalizeDineOnCampusMenuPayload(
  payload: unknown,
  location: DiningLocation,
  period: DiningPeriod,
  date: string,
): DineOnCampusMenuItem[] {
  if (!isRecord(payload)) return [];
  if (payload.closedOnDate === true) return [];

  const periodPayload = isRecord(payload.period) ? payload.period : {};
  const categories = Array.isArray(periodPayload.categories) ? periodPayload.categories : [];
  const normalizedPeriod = mealPeriodFromName(period.name, period.slug ?? '');
  const results: DineOnCampusMenuItem[] = [];

  for (const category of categories) {
    if (!isRecord(category)) continue;
    const station = cleanString(category.name);
    const items = Array.isArray(category.items) ? category.items : [];

    for (const item of items) {
      if (!isRecord(item)) continue;
      const name = cleanString(item.name);
      if (!name) continue;

      const id = cleanString(item.id) || `${location.id}:${period.id}:${station ?? 'menu'}:${name}`;
      const filters = Array.isArray(item.filters)
        ? item.filters.map(filter => isRecord(filter) ? cleanString(filter.name) : cleanString(filter)).filter((value): value is string => Boolean(value))
        : [];

      results.push({
        id,
        name,
        location: location.name,
        locationId: location.id,
        station,
        period: normalizedPeriod,
        periodName: period.name,
        date: cleanString(payload.date) || date,
        price: readPublishedPrice(item),
        calories: readCalories(item.nutrients),
        portion: cleanString(item.portion),
        description: cleanString(item.desc) || cleanString(item.description),
        filters: [...new Set(filters)],
      });
    }
  }

  return results;
}

export async function fetchCalPolyMenu(
  date: string,
  options: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<DineOnCampusMenuItem[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Menu date must use YYYY-MM-DD.');
  const fetchImpl = options.fetchImpl ?? fetch;
  const locations = await discoverCalPolyLocations(fetchImpl, options.signal);

  const menus = await mapLimit(locations, 5, async location => {
    try {
      const periodsPayload = await fetchJson(
        fetchImpl,
        `${API_BASE}/locations/${encodeURIComponent(location.id)}/periods/?date=${encodeURIComponent(date)}`,
        options.signal,
      );
      const periods = readPeriods(periodsPayload);
      if (!periods.length) return [];

      const locationItems: DineOnCampusMenuItem[] = [];
      for (const period of periods.slice(0, 6)) {
        try {
          const menuPayload = await fetchJson(
            fetchImpl,
            `${API_BASE}/locations/${encodeURIComponent(location.id)}/menu?date=${encodeURIComponent(date)}&period=${encodeURIComponent(period.id)}`,
            options.signal,
          );
          locationItems.push(...normalizeDineOnCampusMenuPayload(menuPayload, location, period, date));
        } catch {
          // A location may publish some periods but not others. One missing menu
          // should not prevent Picks from using the rest of campus.
        }
      }
      return locationItems;
    } catch {
      return [];
    }
  });

  const deduped = dedupeMenuItems(menus.flat());
  if (deduped.length < MENU_CACHE_MIN_ITEMS) {
    throw new Error('Dine On Campus did not return any Cal Poly menu items right now.');
  }
  return deduped;
}

async function discoverCalPolyLocations(
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<DiningLocation[]> {
  try {
    const sitesPayload = await fetchJson(fetchImpl, SITES_URL, signal);
    const sites = Array.isArray(sitesPayload)
      ? sitesPayload
      : isRecord(sitesPayload) && Array.isArray(sitesPayload.sites)
        ? sitesPayload.sites
        : [];
    const site = sites
      .filter(isRecord)
      .map(record => ({ record, score: calPolySiteScore(record) }))
      .sort((left, right) => right.score - left.score)[0];

    const siteId = site && site.score > 0 ? cleanString(site.record.id) : null;
    if (!siteId) return KNOWN_CALPOLY_LOCATIONS;

    const locationsPayload = await fetchJson(
      fetchImpl,
      `${API_BASE}/locations/status_by_site?siteId=${encodeURIComponent(siteId)}`,
      signal,
    );
    const rawLocations = Array.isArray(locationsPayload)
      ? locationsPayload
      : isRecord(locationsPayload) && Array.isArray(locationsPayload.locations)
        ? locationsPayload.locations
        : [];

    const locations = rawLocations
      .filter(isRecord)
      .map(record => ({ id: cleanString(record.id), name: cleanString(record.name) }))
      .filter((location): location is DiningLocation => Boolean(location.id && location.name));

    return locations.length ? dedupeLocations(locations) : KNOWN_CALPOLY_LOCATIONS;
  } catch {
    return KNOWN_CALPOLY_LOCATIONS;
  }
}

function calPolySiteScore(record: Record<string, unknown>): number {
  const name = cleanString(record.name)?.toLowerCase() ?? '';
  const slug = (cleanString(record.slug) || cleanString(record.short_name) || cleanString(record.shortName) || '').toLowerCase();
  if (slug === 'calpoly' || slug === 'cal-poly') return 100;
  if (name.includes('california polytechnic state university')) return 90;
  if (name.includes('cal poly') && (name.includes('san luis') || name.includes('slo'))) return 85;
  if (name === 'cal poly') return 80;
  return 0;
}

function readPeriods(payload: unknown): DiningPeriod[] {
  const raw = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.periods)
      ? payload.periods
      : [];

  return raw
    .filter(isRecord)
    .map(record => ({
      id: cleanString(record.id),
      name: cleanString(record.name),
      slug: cleanString(record.slug) ?? undefined,
    }))
    .filter((period): period is DiningPeriod => Boolean(period.id && period.name));
}

async function fetchJson(fetchImpl: typeof fetch, url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Dine On Campus returned HTTP ${response.status}.`);
  return await response.json() as unknown;
}

function readCalories(value: unknown): number | null {
  if (!Array.isArray(value)) return null;
  for (const nutrient of value) {
    if (!isRecord(nutrient)) continue;
    const name = cleanString(nutrient.name)?.toLowerCase() ?? '';
    if (name !== 'calories') continue;
    return parseNumber(nutrient.value);
  }
  return null;
}

function readPublishedPrice(item: Record<string, unknown>): number | null {
  for (const key of ['price', 'retail_price', 'retailPrice', 'cost']) {
    const result = parsePriceValue(item[key]);
    if (result !== null) return result;
  }
  for (const key of ['pricing', 'prices']) {
    const result = parsePriceContainer(item[key]);
    if (result !== null) return result;
  }
  return null;
}

function parsePriceContainer(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const result = parsePriceContainer(entry);
      if (result !== null) return result;
    }
    return null;
  }
  if (!isRecord(value)) return parsePriceValue(value);
  for (const key of ['price', 'amount', 'value', 'retail', 'cost']) {
    const result = parsePriceValue(value[key]);
    if (result !== null) return result;
  }
  return null;
}

function parsePriceValue(value: unknown): number | null {
  const number = parseNumber(value);
  return number !== null && number > 0 && number < 100 ? number : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function dedupeMenuItems(items: DineOnCampusMenuItem[]): DineOnCampusMenuItem[] {
  const byKey = new Map<string, DineOnCampusMenuItem>();
  for (const item of items) {
    const key = `${item.id}|${item.locationId}|${item.periodName}|${item.station ?? ''}`;
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return [...byKey.values()];
}

function dedupeLocations(locations: DiningLocation[]): DiningLocation[] {
  const byId = new Map<string, DiningLocation>();
  for (const location of locations) byId.set(location.id, location);
  return [...byId.values()];
}

async function mapLimit<T, R>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await worker(values[index]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => run()));
  return results;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
