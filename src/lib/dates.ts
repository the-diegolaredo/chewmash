import type { AwayPeriod, IsoDate, PlanSettings } from './types';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  return ISO_DATE_RE.test(value);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const [year, month, day] = String(date).split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

export function clampDate(date: IsoDate, min: IsoDate, max: IsoDate): IsoDate {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export function isAway(date: IsoDate, awayPeriods: AwayPeriod[]): boolean {
  return awayPeriods.some(({ start, end }) => start <= end && date >= start && date <= end);
}

export function campusDates(settings: PlanSettings): IsoDate[] {
  const { startDate, endDate, awayPeriods } = settings;
  if (!isIsoDate(String(startDate)) || !isIsoDate(String(endDate)) || startDate > endDate) return [];

  const dates: IsoDate[] = [];
  for (let date: IsoDate = startDate; date <= endDate; date = addDays(date, 1)) {
    if (!isAway(date, awayPeriods)) dates.push(date);
  }
  return dates;
}
