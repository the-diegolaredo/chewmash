import type { MealPeriod } from './dineoncampus';
import {
  LOCATION_BY_ID,
  type PickType,
  type RecordedMenuItem,
} from './grubhub';
import { PICK_MENU_ITEMS } from './pickCatalog';

export interface RecordedPick {
  item: RecordedMenuItem;
  score: number;
  fitsBudget: boolean;
  remainingAfter: number;
  why: string;
}

export interface PickSelection {
  picks: RecordedPick[];
  counts: Record<PickType, number>;
}

const QUOTAS: Record<PickType, number> = {
  fast: 3,
  drink: 2,
  healthy: 4,
};

const VARIANT_STEPS: Record<PickType, number> = {
  fast: 2,
  drink: 3,
  healthy: 5,
};

export function mealPeriodForHour(hour: number): MealPeriod {
  if (!Number.isFinite(hour)) return 'other';
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 || hour < 2) return 'dinner';
  return 'other';
}

export function mealPeriodLabel(period: MealPeriod): string {
  switch (period) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    default: return 'Late night';
  }
}

export function selectRecordedPicks(options: {
  remainingToday: number;
  mealPeriod: MealPeriod;
  openLocationIds: Set<string>;
  items?: RecordedMenuItem[];
  variant?: number;
}): PickSelection {
  const items = options.items ?? PICK_MENU_ITEMS;
  const variant = Math.max(0, Math.floor(options.variant ?? 0));
  const scored = items
    .filter(item => options.openLocationIds.has(item.locationId))
    .filter(item => isEligibleAtPeriod(item, options.mealPeriod))
    .filter(item => !isGenericDrink(item))
    .map(item => scoreItem(item, options.remainingToday, options.mealPeriod));

  const picks: RecordedPick[] = [];
  const counts: Record<PickType, number> = { fast: 0, drink: 0, healthy: 0 };

  for (const type of ['fast', 'drink', 'healthy'] as const) {
    const candidates = scored
      .filter(pick => pick.item.type === type)
      .sort(comparePicks);
    const ordered = orderForVariant(candidates, QUOTAS[type], variant, type);
    const selected = chooseWithRestaurantVariety(ordered, QUOTAS[type]);
    picks.push(...selected);
    counts[type] = selected.length;
  }

  return { picks, counts };
}

export function solidPickPool(picks: RecordedPick[]): RecordedPick[] {
  const solid = picks.filter(pick => pick.item.type !== 'drink');
  if (!solid.length) return picks;
  const affordable = solid.filter(pick => pick.fitsBudget);
  return affordable.length ? affordable : solid;
}

function orderForVariant(
  candidates: RecordedPick[],
  limit: number,
  variant: number,
  type: PickType,
): RecordedPick[] {
  if (variant <= 0 || candidates.length <= limit) return candidates;

  // Refreshes only rotate through strong candidates. If there are enough
  // affordable choices to fill the category, an over-budget option never gets
  // promoted just for novelty.
  const affordable = candidates.filter(pick => pick.fitsBudget);
  const preferred = affordable.length >= limit ? affordable : candidates;
  const poolSize = Math.min(preferred.length, Math.max(limit + 1, limit * 3));
  const pool = preferred.slice(0, poolSize);
  if (pool.length <= 1) return candidates;

  const offset = (variant * VARIANT_STEPS[type]) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const poolSet = new Set(pool);
  return [...rotated, ...candidates.filter(pick => !poolSet.has(pick))];
}

function chooseWithRestaurantVariety(candidates: RecordedPick[], limit: number): RecordedPick[] {
  const selected: RecordedPick[] = [];
  const usedLocations = new Set<string>();

  for (const pick of candidates) {
    if (usedLocations.has(pick.item.locationId)) continue;
    selected.push(pick);
    usedLocations.add(pick.item.locationId);
    if (selected.length >= limit) return selected;
  }

  for (const pick of candidates) {
    if (selected.includes(pick)) continue;
    selected.push(pick);
    if (selected.length >= limit) break;
  }

  return selected;
}

function scoreItem(item: RecordedMenuItem, remainingToday: number, mealPeriod: MealPeriod): RecordedPick {
  const remainingAfter = remainingToday - item.price;
  const fitsBudget = remainingAfter >= -0.005;
  let score = 0;
  const reasons: string[] = [];

  if (fitsBudget) {
    score += 120;
    reasons.push('fits today’s remaining target');
    if (remainingToday > 0) {
      const budgetShare = item.price / remainingToday;
      if (budgetShare >= 0.3 && budgetShare <= 0.8) score += 15;
      if (budgetShare > 1) score -= 15;
    }
  } else {
    score -= 90 + Math.min(60, Math.abs(remainingAfter) * 4);
    reasons.push(`${currency(Math.abs(remainingAfter))} over today’s target`);
  }

  if (item.periods.includes(mealPeriod)) {
    score += 45;
    reasons.push(`works for ${mealPeriodLabel(mealPeriod).toLowerCase()}`);
  }

  if (item.type === 'healthy') {
    if (item.vegan) score += 6;
    if (item.vegetarian) score += 3;
  }

  // When the remaining target is tight, cheaper options should naturally rise.
  if (remainingToday <= 12) score += Math.max(0, 24 - item.price * 1.5);
  else score += Math.max(0, 10 - item.price * 0.25);

  const locationName = LOCATION_BY_ID.get(item.locationId)?.name;
  return {
    item,
    score,
    fitsBudget,
    remainingAfter,
    why: reasons.slice(0, 2).join(' · ') || `Available at ${locationName ?? 'an open location'}`,
  };
}

function isEligibleAtPeriod(item: RecordedMenuItem, period: MealPeriod): boolean {
  if (period === 'other') return item.periods.includes('other') || item.periods.includes('dinner');
  return item.periods.includes(period);
}

function isGenericDrink(item: RecordedMenuItem): boolean {
  if (item.type !== 'drink') return false;
  const value = `${item.name} ${item.description ?? ''}`.toLowerCase();
  return /\b(fountain|bottled water|water bottle|smartwater|dasani|aquafina|coke bottle|pepsi bottle|sprite bottle|monster 16|energy drink)\b/.test(value);
}

function comparePicks(left: RecordedPick, right: RecordedPick): number {
  return right.score - left.score
    || Number(right.fitsBudget) - Number(left.fitsBudget)
    || left.item.price - right.item.price
    || left.item.name.localeCompare(right.item.name);
}

function currency(value: number): string {
  return `$${value.toFixed(2)}`;
}
