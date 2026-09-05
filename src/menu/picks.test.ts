import { describe, expect, it } from 'vitest';
import type { DineOnCampusMenuItem } from './dineoncampus';
import { mealPeriodForHour, rankMenuPicks, surprisePool } from './picks';

function item(overrides: Partial<DineOnCampusMenuItem>): DineOnCampusMenuItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? 'Meal',
    location: overrides.location ?? 'Vista Grande',
    locationId: overrides.locationId ?? 'loc',
    station: overrides.station ?? 'Grill',
    period: overrides.period ?? 'lunch',
    periodName: overrides.periodName ?? 'Lunch',
    date: overrides.date ?? '2026-09-05',
    price: overrides.price ?? null,
    calories: overrides.calories ?? 500,
    portion: overrides.portion ?? null,
    description: overrides.description ?? null,
    filters: overrides.filters ?? [],
  };
}

describe('Picks recommendation engine', () => {
  it('uses time of day for meal periods', () => {
    expect(mealPeriodForHour(8)).toBe('breakfast');
    expect(mealPeriodForHour(12)).toBe('lunch');
    expect(mealPeriodForHour(18)).toBe('dinner');
  });

  it('prefers meal-period matches that fit the remaining daily target', () => {
    const picks = rankMenuPicks([
      item({ id: 'a', name: 'Lunch Bowl', period: 'lunch', price: 10 }),
      item({ id: 'b', name: 'Dinner Plate', period: 'dinner', price: 9 }),
      item({ id: 'c', name: 'Expensive Lunch', period: 'lunch', price: 25 }),
    ], { remainingToday: 15, mealPeriod: 'lunch', limit: 3 });

    expect(picks[0]?.item.name).toBe('Lunch Bowl');
    expect(picks[0]?.fitsBudget).toBe(true);
    expect(picks.find(pick => pick.item.name === 'Expensive Lunch')?.fitsBudget).toBe(false);
  });

  it('still recommends menu items when Dine On Campus does not publish prices', () => {
    const picks = rankMenuPicks([
      item({ id: 'a', name: 'Unknown Price Bowl', period: 'lunch', price: null }),
      item({ id: 'b', name: 'Breakfast Toast', period: 'breakfast', price: null }),
    ], { remainingToday: 12, mealPeriod: 'lunch' });

    expect(picks[0]?.item.name).toBe('Unknown Price Bowl');
    expect(picks[0]?.fitsBudget).toBeNull();
  });

  it('keeps surprise choices inside the affordable relevant pool when possible', () => {
    const picks = rankMenuPicks([
      item({ id: 'a', name: 'Fits Lunch', period: 'lunch', price: 8 }),
      item({ id: 'b', name: 'Over Lunch', period: 'lunch', price: 18 }),
      item({ id: 'c', name: 'Fits Dinner', period: 'dinner', price: 7 }),
    ], { remainingToday: 10, mealPeriod: 'lunch', limit: 3 });

    const pool = surprisePool(picks, 'lunch');
    expect(pool.map(pick => pick.item.name)).toEqual(['Fits Lunch']);
  });
});
