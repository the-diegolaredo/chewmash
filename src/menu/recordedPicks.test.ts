import { describe, expect, it } from 'vitest';
import type { RecordedMenuItem } from './grubhub';
import { PICK_MENU_ITEMS } from './pickCatalog';
import { mealPeriodForHour, selectRecordedPicks, solidPickPool } from './recordedPicks';

function item(id: string, type: RecordedMenuItem['type'], locationId: string, price: number): RecordedMenuItem {
  return {
    id,
    type,
    locationId,
    name: id,
    price,
    periods: ['lunch'],
  };
}

describe('recorded Picks engine', () => {
  it('maps time of day into meal periods', () => {
    expect(mealPeriodForHour(8)).toBe('breakfast');
    expect(mealPeriodForHour(12)).toBe('lunch');
    expect(mealPeriodForHour(18)).toBe('dinner');
    expect(mealPeriodForHour(3)).toBe('other');
  });

  it('returns the 3 fast / 2 drink / 4 healthy contract when enough open candidates exist', () => {
    const items: RecordedMenuItem[] = [
      item('f1', 'fast', 'a', 8), item('f2', 'fast', 'b', 9), item('f3', 'fast', 'c', 10),
      item('d1', 'drink', 'd', 5), item('d2', 'drink', 'e', 6),
      item('h1', 'healthy', 'f', 7), item('h2', 'healthy', 'g', 8), item('h3', 'healthy', 'h', 9), item('h4', 'healthy', 'i', 10),
    ];
    const result = selectRecordedPicks({
      items,
      remainingToday: 20,
      mealPeriod: 'lunch',
      openLocationIds: new Set(items.map(value => value.locationId)),
    });

    expect(result.picks).toHaveLength(9);
    expect(result.counts).toEqual({ fast: 3, drink: 2, healthy: 4 });
  });

  it('refreshes to a different eligible set while preserving the category contract', () => {
    const items: RecordedMenuItem[] = [
      ...Array.from({ length: 6 }, (_, index) => item(`f${index + 1}`, 'fast', `f-loc-${index + 1}`, 8)),
      ...Array.from({ length: 4 }, (_, index) => item(`d${index + 1}`, 'drink', `d-loc-${index + 1}`, 6)),
      ...Array.from({ length: 8 }, (_, index) => item(`h${index + 1}`, 'healthy', `h-loc-${index + 1}`, 7)),
    ];
    const openLocationIds = new Set(items.map(value => value.locationId));
    const first = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 0 });
    const refreshed = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 1 });

    expect(refreshed.counts).toEqual({ fast: 3, drink: 2, healthy: 4 });
    expect(refreshed.picks.every(pick => pick.fitsBudget)).toBe(true);
    expect(refreshed.picks.map(pick => pick.item.id)).not.toEqual(first.picks.map(pick => pick.item.id));
  });

  it('rotates menu items inside the same restaurant instead of pinning one item forever', () => {
    const items: RecordedMenuItem[] = [
      item('a-one', 'fast', 'a', 8), item('a-two', 'fast', 'a', 8.25),
      item('b-one', 'fast', 'b', 8), item('b-two', 'fast', 'b', 8.25),
      item('c-one', 'fast', 'c', 8), item('c-two', 'fast', 'c', 8.25),
      item('d1', 'drink', 'd', 5), item('d2', 'drink', 'e', 6),
      item('h1', 'healthy', 'f', 7), item('h2', 'healthy', 'g', 8), item('h3', 'healthy', 'h', 9), item('h4', 'healthy', 'i', 10),
    ];
    const openLocationIds = new Set(items.map(value => value.locationId));
    const first = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 0 });
    const refreshed = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 1 });

    const firstFastByLocation = new Map(
      first.picks.filter(pick => pick.item.type === 'fast').map(pick => [pick.item.locationId, pick.item.id]),
    );
    const refreshedFastByLocation = new Map(
      refreshed.picks.filter(pick => pick.item.type === 'fast').map(pick => [pick.item.locationId, pick.item.id]),
    );

    expect([...refreshedFastByLocation.entries()].every(([locationId, id]) =>
      firstFastByLocation.get(locationId) !== id,
    )).toBe(true);
  });

  it('rotates restaurants across refreshes when more good locations exist than slots', () => {
    const items: RecordedMenuItem[] = [
      ...Array.from({ length: 6 }, (_, index) => item(`f${index + 1}`, 'fast', `fast-${index + 1}`, 9)),
      item('d1', 'drink', 'd', 5), item('d2', 'drink', 'e', 6),
      item('h1', 'healthy', 'h1', 7), item('h2', 'healthy', 'h2', 8), item('h3', 'healthy', 'h3', 9), item('h4', 'healthy', 'h4', 10),
    ];
    const openLocationIds = new Set(items.map(value => value.locationId));
    const first = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 0 });
    const refreshed = selectRecordedPicks({ items, remainingToday: 25, mealPeriod: 'lunch', openLocationIds, variant: 1 });

    const firstFastLocations = first.picks.filter(pick => pick.item.type === 'fast').map(pick => pick.item.locationId);
    const refreshedFastLocations = refreshed.picks.filter(pick => pick.item.type === 'fast').map(pick => pick.item.locationId);
    expect(refreshedFastLocations).not.toEqual(firstFastLocations);
    expect(new Set([...firstFastLocations, ...refreshedFastLocations]).size).toBeGreaterThan(3);
  });

  it('never recommends a closed location', () => {
    const items = [
      item('open', 'fast', 'open-location', 8),
      item('closed', 'fast', 'closed-location', 5),
    ];
    const result = selectRecordedPicks({
      items,
      remainingToday: 20,
      mealPeriod: 'lunch',
      openLocationIds: new Set(['open-location']),
    });

    expect(result.picks.map(pick => pick.item.id)).toEqual(['open']);
  });

  it('prefers items that fit the remaining daily target', () => {
    const items = [
      item('fits', 'fast', 'a', 8),
      item('over', 'fast', 'b', 18),
      item('fits2', 'fast', 'c', 9),
    ];
    const result = selectRecordedPicks({
      items,
      remainingToday: 10,
      mealPeriod: 'lunch',
      openLocationIds: new Set(['a', 'b', 'c']),
    });

    expect(result.picks[0]?.item.id).toBe('fits');
    expect(result.picks[0]?.fitsBudget).toBe(true);
    expect(result.picks.at(-1)?.item.id).toBe('over');
  });

  it('nudges Panda Express, Chick-fil-A, and Taco Bell into the fast-food slots when all are open and affordable', () => {
    const items = [
      item('panda', 'fast', 'panda-express', 9),
      item('cfa', 'fast', 'chick-fil-a', 9),
      item('taco', 'fast', 'taco-bell', 9),
      item('hearth', 'fast', 'hearth', 9),
      item('noodles', 'fast', 'noodles', 9),
      item('subway', 'fast', 'subway-dexter', 9),
    ];
    const result = selectRecordedPicks({
      items,
      remainingToday: 20,
      mealPeriod: 'lunch',
      openLocationIds: new Set(items.map(value => value.locationId)),
    });

    expect(new Set(result.picks.map(pick => pick.item.locationId))).toEqual(
      new Set(['panda-express', 'chick-fil-a', 'taco-bell']),
    );
  });

  it('keeps at least two preferred fast-food locations on refreshed grids when they are available', () => {
    const items = [
      item('panda', 'fast', 'panda-express', 9),
      item('cfa', 'fast', 'chick-fil-a', 9),
      item('taco', 'fast', 'taco-bell', 9),
      item('hearth', 'fast', 'hearth', 9),
      item('noodles', 'fast', 'noodles', 9),
      item('subway', 'fast', 'subway-dexter', 9),
    ];
    const result = selectRecordedPicks({
      items,
      remainingToday: 20,
      mealPeriod: 'lunch',
      openLocationIds: new Set(items.map(value => value.locationId)),
      variant: 1,
    });
    const preferred = new Set(['panda-express', 'chick-fil-a', 'taco-bell']);
    expect(result.picks.filter(pick => preferred.has(pick.item.locationId))).toHaveLength(2);
  });

  it('includes the newly recorded Chick-fil-A and Brunch menus in the shared Picks catalog', () => {
    expect(PICK_MENU_ITEMS.some(value => value.locationId === 'chick-fil-a' && value.name === 'Chick-fil-A Chicken Sandwich')).toBe(true);
    expect(PICK_MENU_ITEMS.some(value => value.locationId === 'brunch' && value.name === 'Chicken Strips & Fries')).toBe(true);
  });

  it('keeps Pick for me focused on solid food when solid choices exist', () => {
    const result = selectRecordedPicks({
      items: [item('food', 'healthy', 'a', 8), item('drink', 'drink', 'b', 5)],
      remainingToday: 12,
      mealPeriod: 'lunch',
      openLocationIds: new Set(['a', 'b']),
    });

    expect(solidPickPool(result.picks).map(pick => pick.item.id)).toEqual(['food']);
  });
});
