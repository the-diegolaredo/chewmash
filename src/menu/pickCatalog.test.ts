import { describe, expect, it } from 'vitest';
import { PICK_LOCATIONS, RECORDED_MENU_ITEMS } from './grubhub';
import { RECORDED_MENU_SUPPLEMENT } from './grubhubSupplement';
import { PICK_MENU_ITEMS } from './pickCatalog';
import { selectRecordedPicks } from './recordedPicks';

const genericDrink = /\b(fountain|bottled water|water bottle|smartwater|dasani|aquafina|coke bottle|pepsi bottle|sprite bottle|monster|energy drink)\b/i;

describe('recorded Grubhub Picks catalog', () => {
  it('has unique source item ids', () => {
    const all = [...RECORDED_MENU_ITEMS, ...RECORDED_MENU_SUPPLEMENT];
    expect(new Set(all.map(item => item.id)).size).toBe(all.length);
  });

  it('only references known locations and positive menu prices', () => {
    const locations = new Set(PICK_LOCATIONS.map(location => location.id));
    for (const item of PICK_MENU_ITEMS) {
      expect(locations.has(item.locationId), item.id).toBe(true);
      expect(Number.isFinite(item.price), item.id).toBe(true);
      expect(item.price, item.id).toBeGreaterThan(0);
    }
  });

  it('does not include generic bottled, fountain, or energy drinks', () => {
    const bad = PICK_MENU_ITEMS.filter(item =>
      item.type === 'drink' && genericDrink.test(`${item.name} ${item.description ?? ''}`),
    );
    expect(bad.map(item => item.id)).toEqual([]);
  });

  it('keeps pending Chick-fil-A and Brunch out of the active menu catalog', () => {
    const pending = new Set(
      PICK_LOCATIONS.filter(location => location.menuStatus === 'pending').map(location => location.id),
    );
    expect([...pending].sort()).toEqual(['brunch', 'chick-fil-a']);
    expect(PICK_MENU_ITEMS.some(item => pending.has(item.locationId))).toBe(false);
  });

  it('can fill the requested 3 fast / 2 drink / 4 healthy grid at lunch when catalog locations are open', () => {
    const openLocationIds = new Set(
      PICK_LOCATIONS.filter(location => location.menuStatus === 'ready').map(location => location.id),
    );
    const selection = selectRecordedPicks({
      remainingToday: 25,
      mealPeriod: 'lunch',
      openLocationIds,
    });
    expect(selection.picks).toHaveLength(9);
    expect(selection.counts).toEqual({ fast: 3, drink: 2, healthy: 4 });
  });

  it('has candidate coverage across nearly every recorded ready restaurant', () => {
    const represented = new Set(PICK_MENU_ITEMS.map(item => item.locationId));
    const missing = PICK_LOCATIONS
      .filter(location => location.menuStatus === 'ready')
      .filter(location => !represented.has(location.id))
      .map(location => location.name);
    expect(missing).toEqual([]);
  });
});
