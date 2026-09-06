import type { PickMenuItem, PickMealPeriod, PickType } from './grubhubCatalog';

export interface PickRecommendation {
  item: PickMenuItem;
  score: number;
  fitsBudget: boolean;
  remainingAfter: number;
  reasons: string[];
}

export interface PickSelection {
  picks: PickRecommendation[];
  byType: Record<PickType, PickRecommendation[]>;
}

const QUOTAS: Record<PickType, number> = {
  fast: 3,
  drink: 2,
  healthy: 4,
};

export function mealPeriodForMoment(date: Date): PickMealPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 || hour < 2) return 'dinner';
  return 'all-day';
}

export function buildPicks(
  items: PickMenuItem[],
  options: {
    now: Date;
    remainingToday: number;
    openRestaurantIds?: ReadonlySet<string>;
  },
): PickSelection {
  const mealPeriod = mealPeriodForMoment(options.now);
  const eligible = items.filter(item => !options.openRestaurantIds || options.openRestaurantIds.has(item.restaurantId));
  const ranked = eligible
    .map(item => score(item, options.remainingToday, mealPeriod))
    .sort((a, b) => b.score - a.score || a.item.price - b.item.price || a.item.name.localeCompare(b.item.name));

  const byType: Record<PickType, PickRecommendation[]> = {
    fast: selectCategory(ranked.filter(pick => pick.item.type === 'fast'), QUOTAS.fast),
    drink: selectCategory(ranked.filter(pick => pick.item.type === 'drink'), QUOTAS.drink),
    healthy: selectCategory(ranked.filter(pick => pick.item.type === 'healthy'), QUOTAS.healthy),
  };

  return {
    byType,
    picks: [...byType.fast, ...byType.drink, ...byType.healthy],
  };
}

export function randomSolidPick(picks: PickRecommendation[]): PickRecommendation | null {
  if (!picks.length) return null;
  const solid = picks.filter(pick => pick.item.solidFood);
  const pool = solid.length ? solid : picks;
  const weighted = pool.flatMap(pick => {
    const copies = pick.fitsBudget ? 3 : 1;
    return Array.from({ length: copies }, () => pick);
  });
  return weighted[Math.floor(Math.random() * weighted.length)] ?? pool[0] ?? null;
}

function selectCategory(ranked: PickRecommendation[], limit: number): PickRecommendation[] {
  if (ranked.length <= limit) return ranked;

  const selected: PickRecommendation[] = [];
  const restaurantCounts = new Map<string, number>();

  for (const pick of ranked) {
    const count = restaurantCounts.get(pick.item.restaurantId) ?? 0;
    if (count >= 1 && ranked.some(other =>
      !selected.includes(other)
      && (restaurantCounts.get(other.item.restaurantId) ?? 0) === 0,
    )) continue;
    selected.push(pick);
    restaurantCounts.set(pick.item.restaurantId, count + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const pick of ranked) {
      if (selected.includes(pick)) continue;
      selected.push(pick);
      if (selected.length >= limit) break;
    }
  }

  return selected;
}

function score(item: PickMenuItem, remainingToday: number, mealPeriod: PickMealPeriod): PickRecommendation {
  let total = 0;
  const reasons: string[] = [];
  const remainingAfter = remainingToday - item.price;
  const fitsBudget = remainingAfter >= -0.005;

  if (item.mealPeriods.includes(mealPeriod) || item.mealPeriods.includes('all-day')) {
    total += 52;
    reasons.push('fits the current meal time');
  } else if (mealPeriod === 'all-day') {
    total += 18;
  } else {
    total -= 32;
  }

  if (fitsBudget) {
    total += 58;
    reasons.push('fits what you have left today');
    if (remainingToday > 0) {
      const share = item.price / remainingToday;
      if (share >= 0.25 && share <= 0.75) total += 10;
      if (share <= 0.35) total += 5;
    }
  } else {
    total -= 85 + Math.min(40, Math.abs(remainingAfter) * 2);
    reasons.push('over today’s remaining target');
  }

  if (item.type === 'healthy') total += 5;
  if (item.solidFood) total += 4;

  return { item, score: total, fitsBudget, remainingAfter, reasons };
}
