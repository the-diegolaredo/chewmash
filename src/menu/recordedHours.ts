import type { WeeklyHoursSchedule } from './hours';

type WindowString = `${string}-${string}`;
type DayWindows = readonly WindowString[];
type WeeklyWindows = readonly [
  DayWindows,
  DayWindows,
  DayWindows,
  DayWindows,
  DayWindows,
  DayWindows,
  DayWindows,
];

interface RecordedHoursRule {
  name: string;
  days: WeeklyWindows;
}

/**
 * Official Cal Poly Dine On Campus hours transcribed from the user-provided
 * Hours of Operation recording for the week beginning September 6, 2026.
 *
 * Dine On Campus currently blocks ChewMash's browser-side API request with
 * Cloudflare/CORS, so Picks evaluates this local snapshot instead of guessing
 * or failing whenever the third-party endpoint is unavailable.
 */
export const RECORDED_HOURS_SOURCE_WEEK = '2026-09-06';
export const RECORDED_HOURS_SOURCE_LABEL = 'Cal Poly Dine On Campus · week of Sep 6, 2026';
const RECORDED_HOURS_CAPTURED_AT = '2026-09-06T23:43:18.000Z';

const CLOSED: DayWindows = [];

const RULES: RecordedHoursRule[] = [
  // 1901 Marketplace
  rule('Chick-fil-A', [CLOSED, ['11:00-21:00'], ['07:00-21:00'], ['07:00-21:00'], ['07:00-21:00'], ['07:00-21:00'], ['11:00-21:00']]),
  rule('Red Radish', [CLOSED, ['11:00-16:00'], ['10:30-16:00'], ['10:30-16:00'], ['10:30-16:00'], ['10:30-15:00'], ['11:00-16:00']]),
  rule('Kai Poke', [CLOSED, CLOSED, ['10:30-16:00'], ['10:30-16:00'], ['10:30-16:00'], ['10:30-15:00'], CLOSED]),
  rule("Julian's", [CLOSED, CLOSED, ['07:00-15:00'], ['07:00-15:00'], ['07:00-15:00'], ['07:00-14:00'], CLOSED]),
  rule('Panda Express', [['11:00-21:00'], CLOSED, ['10:30-21:00'], ['10:30-21:00'], ['10:30-21:00'], ['10:30-21:00'], CLOSED]),
  rule('Poly Choice', [CLOSED, CLOSED, ['10:30-16:30'], ['10:30-16:30'], ['10:30-16:30'], ['10:30-14:00'], CLOSED]),
  rule('Pom & Honey', [['11:00-16:00'], CLOSED, ['10:30-16:30'], ['10:30-16:30'], ['10:30-16:30'], ['10:30-14:00'], CLOSED]),

  // Vista Grande
  rule('The Deli at Market Grand Ave', [['08:00-18:00'], ['08:00-18:00'], ['07:00-19:00'], ['07:00-19:00'], ['07:00-19:00'], ['07:00-18:00'], ['08:00-18:00']]),
  rule('Balance Café', [
    ['09:00-13:00', '13:30-16:00', '17:00-21:00'],
    ['09:00-13:00', '13:30-16:00', '17:00-21:00'],
    ['07:00-10:30', '11:00-16:00', '17:00-22:00'],
    ['07:00-10:30', '11:00-16:00', '17:00-22:00'],
    ['07:00-10:30', '11:00-16:00', '17:00-22:00'],
    ['07:00-10:30', '11:00-16:00', '17:00-21:00'],
    ['09:00-13:00', '13:30-16:00', '17:00-21:00'],
  ]),
  rule('Brunch', [
    ['09:00-14:00', '17:00-21:00'],
    ['09:00-14:00', '17:00-21:00'],
    ['07:00-12:00', '17:00-21:00'],
    ['07:00-12:00', '17:00-21:00'],
    ['07:00-12:00', '17:00-21:00'],
    ['07:00-12:00', '17:00-21:00'],
    ['09:00-14:00', '17:00-21:00'],
  ]),
  rule('Hearth', [['17:00-21:00'], ['11:00-21:00'], ['10:30-22:00'], ['10:30-22:00'], ['10:30-22:00'], ['10:30-21:00'], ['11:00-21:00']]),
  rule('Jamba', [['09:00-15:00'], ['09:00-15:00'], ['07:00-19:00'], ['07:00-19:00'], ['07:00-19:00'], ['07:00-17:00'], ['09:00-17:00']]),
  rule('Mingle + Nosh', [['17:00-21:00'], ['17:00-21:00'], ['10:30-22:00'], ['10:30-22:00'], ['10:30-22:00'], ['10:30-17:00'], ['11:00-21:00']]),
  rule('Noodles', [CLOSED, ['17:00-21:00'], ['17:00-21:00'], ['17:00-21:00'], ['17:00-21:00'], ['17:00-21:00'], CLOSED]),
  rule('Streats', [
    ['11:00-21:00'],
    ['11:00-21:00'],
    ['10:30-14:00', '17:00-21:00'],
    ['10:30-14:00', '17:00-21:00'],
    ['10:30-14:00', '17:00-21:00'],
    ['10:30-14:00', '17:00-21:00'],
    ['11:00-21:00'],
  ]),

  // Kennedy Library / University Union / Scout
  rule('Sequel', [CLOSED, CLOSED, ['10:00-18:00'], ['10:00-18:00'], ['10:00-18:00'], ['10:00-16:00'], CLOSED]),
  rule('Shake Smart', [['09:00-21:00'], ['09:00-21:00'], ['07:00-22:00'], ['07:00-22:00'], ['07:00-22:00'], ['07:00-22:00'], ['09:00-21:00']]),
  rule('Starbucks', [['08:00-17:30'], ['08:00-17:30'], ['06:30-21:00'], ['06:30-21:00'], ['06:30-21:00'], ['06:30-20:00'], ['08:00-17:30']]),
  rule('Scout Coffee Co.', [['07:30-15:00'], ['07:30-15:00'], ['06:30-16:00'], ['06:30-16:00'], ['06:30-16:00'], ['06:30-15:00'], ['07:30-15:00']]),

  // Mott Lawn / PAC Circle. Lunch and dinner rows are combined so one Picks
  // location can be evaluated across both official service periods.
  rule('G. Brothers Taqueria - Lunch', [CLOSED, CLOSED, ['11:00-14:00'], ['11:00-14:00'], ['11:00-14:00'], CLOSED, CLOSED]),
  rule('Plant Ivy', [
    CLOSED,
    CLOSED,
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00'],
    CLOSED,
    CLOSED,
  ]),
  rule('Jewel of India', [
    ['17:00-20:00'],
    CLOSED,
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00'],
    CLOSED,
    CLOSED,
  ]),
  rule("What's Cookin' Kosher", [
    CLOSED,
    CLOSED,
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-14:00', '17:00-20:00'],
    ['11:00-13:00'],
    CLOSED,
  ]),

  // Poly Canyon Village
  rule('Einstein Bros. Bagels', [['09:00-15:00'], ['09:00-15:00'], ['07:00-15:00'], ['07:00-15:00'], ['07:00-15:00'], ['07:00-15:00'], ['09:00-15:00']]),
  rule('Subway at PCV', [['09:00-22:00'], CLOSED, ['09:00-22:00'], ['09:00-22:00'], ['09:00-22:00'], ['09:00-22:00'], ['09:00-00:00']]),
  rule('Taco Bell', [['16:00-21:00'], ['16:00-21:00'], ['16:00-23:00'], ['16:00-23:00'], ['16:00-23:00'], ['16:00-23:00'], ['16:00-21:00']]),
];

export function buildRecordedCalPolyHours(at: Date = new Date()): WeeklyHoursSchedule {
  const sunday = startOfLocalWeek(at);
  const locations: WeeklyHoursSchedule['locations'] = RULES.map(entry => ({
    name: entry.name,
    slug: slugify(entry.name),
    is_building: false,
    week: entry.days.map((windows, day) => ({
      day,
      date: localIsoDate(addLocalDays(sunday, day)),
      closed: windows.length === 0,
      always_open: false,
      hours: windows.map(parseWindow),
    })),
  }));

  return {
    locations,
    fetchedAt: RECORDED_HOURS_CAPTURED_AT,
  };
}

function rule(name: string, days: WeeklyWindows): RecordedHoursRule {
  return { name, days };
}

function parseWindow(value: WindowString) {
  const [start, end] = value.split('-');
  const [startHour, startMinutes] = start.split(':').map(Number);
  const [endHour, endMinutes] = end.split(':').map(Number);
  return {
    start_hour: startHour,
    start_minutes: startMinutes,
    end_hour: endHour,
    end_minutes: endMinutes,
  };
}

function startOfLocalWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay(), 12, 0, 0);
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12, 0, 0);
}

function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
