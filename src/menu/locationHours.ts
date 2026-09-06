export interface DailyHoursWindow {
  opens: string;
  closes: string;
}

export type WeeklyHours = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DailyHoursWindow[]>>;

export interface RestaurantHoursRecord {
  restaurantId: string;
  weekly: WeeklyHours;
}

export const HOURS_SOURCE_URL = 'https://dineoncampus.com/calpoly/hours-of-operation';

// The official hours page is the intended source, but the normalized Fall 2026
// schedule is not committed yet. Picks remains hidden until this is populated.
export const RESTAURANT_HOURS: RestaurantHoursRecord[] = [];

export function openRestaurantIdsAt(moment: Date): Set<string> | null {
  if (!RESTAURANT_HOURS.length) return null;

  const day = moment.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const minuteOfDay = moment.getHours() * 60 + moment.getMinutes();
  const open = new Set<string>();

  for (const restaurant of RESTAURANT_HOURS) {
    const windows = restaurant.weekly[day] ?? [];
    if (windows.some(window => withinWindow(minuteOfDay, window))) open.add(restaurant.restaurantId);
  }

  return open;
}

function withinWindow(minuteOfDay: number, window: DailyHoursWindow): boolean {
  const opens = parseTime(window.opens);
  const closes = parseTime(window.closes);
  if (opens === null || closes === null) return false;
  if (closes >= opens) return minuteOfDay >= opens && minuteOfDay < closes;
  return minuteOfDay >= opens || minuteOfDay < closes;
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}
