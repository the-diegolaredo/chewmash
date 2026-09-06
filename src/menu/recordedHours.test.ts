import { describe, expect, it } from 'vitest';
import { PICK_LOCATIONS } from './grubhub';
import { openStatusesForLocations } from './hours';
import { buildRecordedCalPolyHours } from './recordedHours';

describe('recorded Cal Poly operating hours', () => {
  it('matches every Picks restaurant whose menu is ready', () => {
    const at = new Date(2026, 8, 8, 12, 0, 0);
    const schedule = buildRecordedCalPolyHours(at);
    const ready = PICK_LOCATIONS.filter(location => location.menuStatus === 'ready');
    const statuses = openStatusesForLocations(schedule, ready, at);

    const unmatched = [...statuses.values()]
      .filter(status => status.matchedSourceName === null)
      .map(status => status.locationId);

    expect(unmatched).toEqual([]);
  });

  it('uses the recorded Panda Express Sunday and Monday schedule', () => {
    const sunday = new Date(2026, 8, 6, 12, 0, 0);
    const schedule = buildRecordedCalPolyHours(sunday);
    const panda = PICK_LOCATIONS.find(location => location.id === 'panda-express')!;

    expect(openStatusesForLocations(schedule, [panda], sunday).get(panda.id)?.open).toBe(true);
    expect(openStatusesForLocations(schedule, [panda], new Date(2026, 8, 7, 12, 0, 0)).get(panda.id)?.open).toBe(false);
  });

  it('preserves split service windows instead of treating gaps as open', () => {
    const balance = PICK_LOCATIONS.find(location => location.id === 'balance-cafe')!;
    const schedule = buildRecordedCalPolyHours(new Date(2026, 8, 8, 10, 45, 0));

    expect(openStatusesForLocations(schedule, [balance], new Date(2026, 8, 8, 10, 45, 0)).get(balance.id)?.open).toBe(false);
    expect(openStatusesForLocations(schedule, [balance], new Date(2026, 8, 8, 11, 15, 0)).get(balance.id)?.open).toBe(true);
  });

  it('combines Plant Ivy lunch and dinner rows into one Picks location', () => {
    const plantIvy = PICK_LOCATIONS.find(location => location.id === 'plant-ivy')!;
    const schedule = buildRecordedCalPolyHours(new Date(2026, 8, 8, 18, 0, 0));

    expect(openStatusesForLocations(schedule, [plantIvy], new Date(2026, 8, 8, 13, 0, 0)).get(plantIvy.id)?.open).toBe(true);
    expect(openStatusesForLocations(schedule, [plantIvy], new Date(2026, 8, 8, 18, 0, 0)).get(plantIvy.id)?.open).toBe(true);
    expect(openStatusesForLocations(schedule, [plantIvy], new Date(2026, 8, 10, 18, 0, 0)).get(plantIvy.id)?.open).toBe(false);
  });
});
