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

  it('keeps the primary list to at most one beverage when food options are available', () => {
    const foods = Array.from({ length: 12 }, (_, index) => item({
      id: `food-${index}`,
      name: `Lunch Plate ${index + 1}`,
      location: index % 2 === 0 ? 'Vista Grande' : '1901 Marketplace',
      station: index % 3 === 0 ? 'Panda Express' : 'Kitchen',
      period: 'lunch',
      price: 9,
      calories: 550,
    }));
    const drinks = [
      item({ id: 'drink-1', name: 'Caramel Frappuccino Blended Beverage', location: 'Noodles', station: 'Noodles', calories: 380 }),
      item({ id: 'drink-2', name: 'Iced Caffe Latte', location: 'Starbucks', station: 'Coffee', calories: 180 }),
      item({ id: 'drink-3', name: 'Strawberry Refresher', location: 'Cafe', station: 'Cold Bar', calories: 120 }),
      item({ id: 'drink-4', name: 'Vanilla Sweet Cream Cold Brew', location: 'Cafe', station: 'Cold Bar', calories: 160 }),
    ];

    const picks = rankMenuPicks([...drinks, ...foods], { remainingToday: 20, mealPeriod: 'lunch', limit: 12 });
    const drinkNames = new Set(drinks.map(drink => drink.name));
    const drinkPicks = picks.filter(pick => drinkNames.has(pick.item.name));

    expect(picks).toHaveLength(12);
    expect(drinkPicks.length).toBeLessThanOrEqual(1);
    expect(picks.length - drinkPicks.length).toBeGreaterThanOrEqual(11);
  });

  it('boosts solid food from Vista Grande, 1901, and fast-food counters', () => {
    const picks = rankMenuPicks([
      item({ id: 'generic', name: 'Lunch Plate', location: 'Generic Cafe', station: 'Kitchen', calories: 500 }),
      item({ id: 'vg', name: 'Chicken Rice Bowl', location: 'Vista Grande', station: 'Hearth', calories: 500 }),
      item({ id: '1901', name: 'Poke Bowl', location: '1901 Marketplace', station: 'Kai Poke', calories: 500 }),
      item({ id: 'fast', name: 'Chicken Sandwich', location: '1901 Marketplace', station: 'Chick-fil-A', calories: 500 }),
    ], { remainingToday: 20, mealPeriod: 'lunch', limit: 4 });

    expect(picks.slice(0, 3).map(pick => pick.item.id)).toEqual(expect.arrayContaining(['vg', '1901', 'fast']));
    expect(picks[3]?.item.id).toBe('generic');
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
