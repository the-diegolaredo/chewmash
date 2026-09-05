import { describe, expect, it } from 'vitest';
import { mealPeriodFromName, normalizeDineOnCampusMenuPayload } from './dineoncampus';

describe('Dine On Campus normalization', () => {
  it('normalizes item details without inventing missing fields', () => {
    const items = normalizeDineOnCampusMenuPayload(
      {
        date: '2026-09-05',
        period: {
          categories: [{
            name: 'Grill',
            items: [{
              id: 'abc',
              name: 'Breakfast Burrito',
              desc: 'Eggs and potatoes',
              portion: '1 burrito',
              price: '$8.75',
              nutrients: [
                { name: 'Calories', value: '640' },
                { name: 'Protein (g)', value: '24' },
              ],
              filters: [{ name: 'Vegetarian' }],
            }],
          }],
        },
      },
      { id: 'loc', name: 'Brunch' },
      { id: 'period', name: 'Breakfast', slug: 'breakfast' },
      '2026-09-05',
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'abc',
      name: 'Breakfast Burrito',
      location: 'Brunch',
      station: 'Grill',
      period: 'breakfast',
      price: 8.75,
      calories: 640,
      portion: '1 burrito',
      description: 'Eggs and potatoes',
      filters: ['Vegetarian'],
    });
  });

  it('keeps unpublished prices unknown', () => {
    const items = normalizeDineOnCampusMenuPayload(
      { period: { categories: [{ name: 'Bowls', items: [{ name: 'Rice Bowl' }] }] } },
      { id: 'loc', name: 'Vista Grande' },
      { id: 'period', name: 'Lunch' },
      '2026-09-05',
    );

    expect(items[0]?.price).toBeNull();
    expect(items[0]?.calories).toBeNull();
  });

  it('maps brunch to breakfast and everyday to all-day', () => {
    expect(mealPeriodFromName('Weekend Brunch')).toBe('breakfast');
    expect(mealPeriodFromName('Everyday')).toBe('all-day');
    expect(mealPeriodFromName('Dinner')).toBe('dinner');
  });
});
