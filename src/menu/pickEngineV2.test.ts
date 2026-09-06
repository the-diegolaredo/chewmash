import { describe, expect, it } from 'vitest';
import { GRUBHUB_PICK_ITEMS } from './grubhubCatalog';
import { buildPicks, mealPeriodForMoment, randomSolidPick } from './pickEngineV2';

describe('Picks v2', () => {
  it('builds the requested 3 fast, 2 drink, 4 healthy grid', () => {
    const result = buildPicks(GRUBHUB_PICK_ITEMS, {
      now: new Date('2026-09-06T12:00:00'),
      remainingToday: 30,
    });

    expect(result.picks).toHaveLength(9);
    expect(result.byType.fast).toHaveLength(3);
    expect(result.byType.drink).toHaveLength(2);
    expect(result.byType.healthy).toHaveLength(4);
  });

  it('prefers affordable items when the remaining daily budget is small', () => {
    const result = buildPicks(GRUBHUB_PICK_ITEMS, {
      now: new Date('2026-09-06T12:00:00'),
      remainingToday: 7,
    });

    expect(result.byType.fast.some(pick => pick.fitsBudget)).toBe(true);
    expect(result.byType.drink.some(pick => pick.fitsBudget)).toBe(true);
    expect(result.byType.healthy.some(pick => pick.fitsBudget)).toBe(true);
  });

  it('can filter candidates to restaurants that are open', () => {
    const result = buildPicks(GRUBHUB_PICK_ITEMS, {
      now: new Date('2026-09-06T12:00:00'),
      remainingToday: 30,
      openRestaurantIds: new Set(['panda-express', 'shake-smart']),
    });

    expect(result.picks.every(pick => ['panda-express', 'shake-smart'].includes(pick.item.restaurantId))).toBe(true);
  });

  it('uses meal periods from the current hour', () => {
    expect(mealPeriodForMoment(new Date('2026-09-06T08:00:00'))).toBe('breakfast');
    expect(mealPeriodForMoment(new Date('2026-09-06T12:00:00'))).toBe('lunch');
    expect(mealPeriodForMoment(new Date('2026-09-06T18:00:00'))).toBe('dinner');
  });

  it('Pick for me favors solid food when solid picks exist', () => {
    const result = buildPicks(GRUBHUB_PICK_ITEMS, {
      now: new Date('2026-09-06T12:00:00'),
      remainingToday: 30,
    });

    for (let index = 0; index < 20; index += 1) {
      expect(randomSolidPick(result.picks)?.item.solidFood).toBe(true);
    }
  });
});
