import { describe, expect, it } from 'vitest';
import type { PickLocation } from './grubhub';
import { openStatusesForLocations, type WeeklyHoursSchedule } from './hours';

const location: PickLocation = {
  id: 'panda-express',
  name: 'Panda Express',
  hoursAliases: ['Panda Express'],
  mapQuery: 'Panda Express, Cal Poly',
  menuStatus: 'ready',
};

const schedule = {
  fetchedAt: '2026-09-06T12:00:00.000Z',
  locations: [
    {
      name: 'Panda Express',
      slug: 'panda-express',
      is_building: false,
      week: [
        {
          day: 0,
          date: '2026-09-06',
          closed: false,
          always_open: false,
          hours: [{ start_hour: 10, start_minutes: 30, end_hour: 20, end_minutes: 0 }],
        },
      ],
    },
  ],
} as WeeklyHoursSchedule;

describe('Dine On Campus weekly hours', () => {
  it('marks a matching restaurant open inside its window', () => {
    const at = new Date(2026, 8, 6, 12, 0, 0);
    const status = openStatusesForLocations(schedule, [location], at).get(location.id);
    expect(status?.open).toBe(true);
    expect(status?.closesAt).toBe('20:00');
  });

  it('marks the restaurant closed outside its window', () => {
    const at = new Date(2026, 8, 6, 21, 0, 0);
    const status = openStatusesForLocations(schedule, [location], at).get(location.id);
    expect(status?.open).toBe(false);
  });

  it('keeps unmatched names closed rather than guessing', () => {
    const unknown = { ...location, id: 'unknown', name: 'Unknown Cafe', hoursAliases: ['Unknown Cafe'] };
    const at = new Date(2026, 8, 6, 12, 0, 0);
    const status = openStatusesForLocations(schedule, [unknown], at).get(unknown.id);
    expect(status?.open).toBe(false);
    expect(status?.matchedSourceName).toBeNull();
  });
});
