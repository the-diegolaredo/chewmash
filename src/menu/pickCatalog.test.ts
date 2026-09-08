import { describe, expect, it } from 'vitest';
import { PICK_LOCATIONS, RECORDED_MENU_ITEMS } from './grubhub';
import { RECORDED_MENU_SUPPLEMENT } from './grubhubSupplement';
import { RECORDED_MENU_SEPT7 } from './grubhubSept7';
import { PICK_MENU_ITEMS } from './pickCatalog';
import { selectRecordedPicks } from './recordedPicks';

const genericDrink = /\b(fountain|bottled water|water bottle|smartwater|dasani|aquafina|coke bottle|pepsi bottle|sprite bottle|monster|energy drink)\b/i;

describe('recorded Grubhub Picks catalog', () => {
  it('has unique source item ids', () => {
    const all = [...RECORDED_MENU_ITEMS, ...RECORDED_MENU_SUPPLEMENT, ...RECORDED_MENU_SEPT7];
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

  it('includes the newly supplied Chick-fil-A and Brunch recordings in the active catalog', () => {
    expect(PICK_MENU_ITEMS.some(item => item.locationId === 'chick-fil-a')).toBe(true);
    expect(PICK_MENU_ITEMS.some(item => item.locationId === 'brunch')).toBe(true);
  });

  it('can fill the requested 3 fast / 2 drink / 4 healthy grid at lunch when catalog locations are open', () => {
    const openLocationIds = new Set(PICK_LOCATIONS.map(location => location.id));
    const selection = selectRecordedPicks({
      remainingToday: 25,
      mealPeriod: 'lunch',
      openLocationIds,
    });
    expect(selection.picks).toHaveLength(9);
    expect(selection.counts).toEqual({ fast: 3, drink: 2, healthy: 4 });
  });

  it('has candidate coverage across every recorded restaurant with Picks menu data', () => {
    const represented = new Set(PICK_MENU_ITEMS.map(item => item.locationId));
    const missing = PICK_LOCATIONS
      .filter(location => !represented.has(location.id))
      .map(location => location.name);
    expect(missing).toEqual([]);
  });
});
