import type { PickLocation } from './grubhub';

const API_BASE = 'https://apiv4.dineoncampus.com';
const SITES_URL = `${API_BASE}/sites/public`;

export interface LocationOpenStatus {
  locationId: string;
  open: boolean;
  closesAt: string | null;
  matchedSourceName: string | null;
}

interface RawHourWindow {
  start_hour: number;
  start_minutes: number;
  end_hour: number;
  end_minutes: number;
}

interface RawScheduleDay {
  day: number;
  date: string;
  closed: boolean;
  always_open: boolean;
  hours: RawHourWindow[];
}

interface RawScheduleLocation {
  name: string;
  slug: string;
  is_building: boolean;
  week: RawScheduleDay[];
}

export interface WeeklyHoursSchedule {
  locations: RawScheduleLocation[];
  fetchedAt: string;
}

export async function fetchCalPolyWeeklyHours(
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<WeeklyHoursSchedule> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const siteId = await discoverCalPolySiteId(fetchImpl, options.signal);
  const payload = await fetchJson(
    fetchImpl,
    `${API_BASE}/locations/weekly_schedule?site_id=${encodeURIComponent(siteId)}`,
    options.signal,
  );
  const record = asRecord(payload);
  const rawLocations = record && Array.isArray(record.theLocations) ? record.theLocations : [];
  const locations = rawLocations
    .map(parseScheduleLocation)
    .filter((value): value is RawScheduleLocation => value !== null);

  if (!locations.length) throw new Error('Dine On Campus did not return operating hours.');
  return { locations, fetchedAt: new Date().toISOString() };
}

export function openStatusesForLocations(
  schedule: WeeklyHoursSchedule,
  locations: PickLocation[],
  at: Date,
): Map<string, LocationOpenStatus> {
  const result = new Map<string, LocationOpenStatus>();
  for (const location of locations) {
    const matched = matchScheduleLocation(schedule.locations, location.hoursAliases);
    const status = matched
      ? evaluateSchedule(matched, at)
      : { open: false, closesAt: null };
    result.set(location.id, {
      locationId: location.id,
      open: status.open,
      closesAt: status.closesAt,
      matchedSourceName: matched?.name ?? null,
    });
  }
  return result;
}

export function formatClosingTime(value: string | null): string | null {
  if (!value) return null;
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function evaluateSchedule(location: RawScheduleLocation, at: Date): { open: boolean; closesAt: string | null } {
  const today = localIsoDate(at);
  const yesterday = localIsoDate(new Date(at.getFullYear(), at.getMonth(), at.getDate() - 1, 12));
  const minutes = at.getHours() * 60 + at.getMinutes();

  const todayRow = location.week.find(day => day.date === today);
  if (todayRow?.always_open) return { open: true, closesAt: null };
  if (todayRow && !todayRow.closed) {
    for (const window of todayRow.hours) {
      const start = window.start_hour * 60 + window.start_minutes;
      const end = window.end_hour * 60 + window.end_minutes;
      if (end > start && minutes >= start && minutes < end) {
        return { open: true, closesAt: hhmm(window.end_hour, window.end_minutes) };
      }
      if (end <= start && minutes >= start) {
        return { open: true, closesAt: hhmm(window.end_hour, window.end_minutes) };
      }
    }
  }

  const previousRow = location.week.find(day => day.date === yesterday);
  if (previousRow && !previousRow.closed) {
    for (const window of previousRow.hours) {
      const start = window.start_hour * 60 + window.start_minutes;
      const end = window.end_hour * 60 + window.end_minutes;
      if (end <= start && minutes < end) {
        return { open: true, closesAt: hhmm(window.end_hour, window.end_minutes) };
      }
    }
  }

  return { open: false, closesAt: null };
}

function matchScheduleLocation(
  scheduleLocations: RawScheduleLocation[],
  aliases: string[],
): RawScheduleLocation | null {
  const normalizedAliases = aliases.map(normalizeName);
  const candidates = scheduleLocations.filter(location => !location.is_building);

  for (const alias of normalizedAliases) {
    const exact = candidates.find(location => normalizeName(location.name) === alias);
    if (exact) return exact;
  }

  for (const alias of normalizedAliases) {
    const fuzzy = candidates.find(location => {
      const name = normalizeName(location.name);
      return name.includes(alias) || alias.includes(name);
    });
    if (fuzzy) return fuzzy;
  }

  return null;
}

async function discoverCalPolySiteId(fetchImpl: typeof fetch, signal?: AbortSignal): Promise<string> {
  const payload = await fetchJson(fetchImpl, SITES_URL, signal);
  const record = asRecord(payload);
  const rawSites = Array.isArray(payload)
    ? payload
    : record && Array.isArray(record.sites)
      ? record.sites
      : [];

  const candidates = rawSites
    .map(asRecord)
    .filter((value): value is Record<string, unknown> => value !== null)
    .map(site => ({ site, score: calPolyScore(site) }))
    .sort((left, right) => right.score - left.score);

  const winner = candidates[0];
  const id = winner && winner.score > 0 ? cleanString(winner.site.id) : null;
  if (!id) throw new Error('Could not identify the Cal Poly Dine On Campus site.');
  return id;
}

function calPolyScore(site: Record<string, unknown>): number {
  const name = cleanString(site.name)?.toLowerCase() ?? '';
  const slug = (cleanString(site.slug) || cleanString(site.short_name) || cleanString(site.shortName) || '').toLowerCase();
  if (slug === 'calpoly' || slug === 'cal-poly') return 100;
  if (name.includes('california polytechnic state university')) return 95;
  if (name.includes('cal poly') && (name.includes('san luis') || name.includes('slo'))) return 90;
  if (name === 'cal poly') return 80;
  return 0;
}

function parseScheduleLocation(value: unknown): RawScheduleLocation | null {
  const record = asRecord(value);
  if (!record) return null;
  const name = cleanString(record.name);
  if (!name) return null;
  const week = Array.isArray(record.week)
    ? record.week.map(parseScheduleDay).filter((day): day is RawScheduleDay => day !== null)
    : [];
  return {
    name,
    slug: cleanString(record.slug) ?? '',
    is_building: record.is_building === true,
    week,
  };
}

function parseScheduleDay(value: unknown): RawScheduleDay | null {
  const record = asRecord(value);
  if (!record) return null;
  const date = cleanString(record.date);
  if (!date) return null;
  const hours = Array.isArray(record.hours)
    ? record.hours.map(parseHourWindow).filter((window): window is RawHourWindow => window !== null)
    : [];
  return {
    day: finiteNumber(record.day) ?? 0,
    date,
    closed: record.closed === true,
    always_open: record.always_open === true,
    hours,
  };
}

function parseHourWindow(value: unknown): RawHourWindow | null {
  const record = asRecord(value);
  if (!record) return null;
  const startHour = finiteNumber(record.start_hour);
  const startMinutes = finiteNumber(record.start_minutes);
  const endHour = finiteNumber(record.end_hour);
  const endMinutes = finiteNumber(record.end_minutes);
  if ([startHour, startMinutes, endHour, endMinutes].some(part => part === null)) return null;
  return {
    start_hour: startHour!,
    start_minutes: startMinutes!,
    end_hour: endHour!,
    end_minutes: endMinutes!,
  };
}

async function fetchJson(fetchImpl: typeof fetch, url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Dine On Campus returned HTTP ${response.status} for hours.`);
  return await response.json() as unknown;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
