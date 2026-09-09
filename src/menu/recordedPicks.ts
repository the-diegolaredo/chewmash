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

const LOCATION_VARIANT_STEPS: Record<PickType, number> = {
  fast: 1,
  drink: 1,
  healthy: 2,
};

const MAX_ITEMS_PER_LOCATION_REFRESH_POOL = 6;
const LOCATION_REFRESH_POOL_MULTIPLIER = 2;
const LOCATION_REFRESH_POOL_EXTRA = 2;
const STRONG_ITEM_SCORE_WINDOW = 28;

// When these traditional fast-food spots are open and fit the user's target,
// nudge them toward the three Fast Food slots. Refreshes are still allowed to
// rotate another restaurant into the row so the grid does not become stale.
const PREFERRED_FAST_FOOD_LOCATIONS = new Set([
  'panda-express',
  'chick-fil-a',
  'taco-bell',
]);

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
    const selected = chooseVariantPicks(candidates, QUOTAS[type], variant, type);
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

function chooseVariantPicks(
  candidates: RecordedPick[],
  limit: number,
  variant: number,
  type: PickType,
): RecordedPick[] {
  if (!candidates.length || limit <= 0) return [];

  // First pick one refresh-aware representative from every restaurant. This is
  // the key difference from the old global rotation: Panda, Subway, Chick-fil-A,
  // etc. can now rotate through their own menus instead of always contributing
  // whichever single item happened to be their highest static score.
  const byLocation = new Map<string, RecordedPick[]>();
  for (const pick of candidates) {
    const group = byLocation.get(pick.item.locationId) ?? [];
    group.push(pick);
    byLocation.set(pick.item.locationId, group);
  }

  const representatives = [...byLocation.values()]
    .map(group => representativeForVariant(group, variant))
    .sort(comparePicks);

  // If there are enough affordable restaurants to fill the category, keep the
  // refresh entirely inside that affordable set. Otherwise preserve the old
  // behavior and allow the best over-target options to fill remaining slots.
  const affordableRepresentatives = representatives.filter(pick => pick.fitsBudget);
  const source = affordableRepresentatives.length >= limit
    ? affordableRepresentatives
    : representatives;

  const poolSize = Math.min(
    source.length,
    Math.max(limit + LOCATION_REFRESH_POOL_EXTRA, limit * LOCATION_REFRESH_POOL_MULTIPLIER),
  );
  const refreshPool = source.slice(0, poolSize);
  const rest = source.slice(poolSize);
  const ordered = variant > 0 && refreshPool.length > 1
    ? [
        ...rotate(
          refreshPool,
          (variant * LOCATION_VARIANT_STEPS[type]) % refreshPool.length,
        ),
        ...rest,
      ]
    : [...refreshPool, ...rest];

  let selected = ordered.slice(0, limit);

  // Keep the user's earlier fast-food preference without freezing all three
  // fast slots forever. On refreshed grids, at least two classic fast-food
  // locations stay represented when they are available in the eligible pool.
  if (type === 'fast' && variant > 0) {
    selected = ensurePreferredFastFoodFloor(selected, ordered, limit);
  }

  // Usually there are more unique restaurants than slots. This fallback only
  // matters at hours with very few open places and lets multiple items from the
  // same restaurant fill otherwise-empty slots.
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map(pick => pick.item.id));
    const fallback = variant > 0 && candidates.length > 1
      ? rotate(candidates, variant % candidates.length)
      : candidates;
    for (const pick of fallback) {
      if (selectedIds.has(pick.item.id)) continue;
      selected.push(pick);
      selectedIds.add(pick.item.id);
      if (selected.length >= limit) break;
    }
  }

  return selected.slice(0, limit);
}

function representativeForVariant(group: RecordedPick[], variant: number): RecordedPick {
  const sorted = [...group].sort(comparePicks);
  const affordable = sorted.filter(pick => pick.fitsBudget);
  const source = affordable.length ? affordable : sorted;
  if (variant <= 0 || source.length <= 1) return source[0] ?? sorted[0];

  const bestScore = source[0]?.score ?? 0;
  let pool = source
    .filter(pick => bestScore - pick.score <= STRONG_ITEM_SCORE_WINDOW)
    .slice(0, MAX_ITEMS_PER_LOCATION_REFRESH_POOL);

  // A restaurant with several perfectly usable items should still change even
  // when one item has a modest score lead. We never cross from affordable into
  // over-target options just to create novelty because `source` is already
  // affordability-filtered whenever that is possible.
  if (pool.length < 2 && source.length > 1) {
    pool = source.slice(0, Math.min(source.length, MAX_ITEMS_PER_LOCATION_REFRESH_POOL));
  }

  return pool[variant % pool.length] ?? source[0] ?? sorted[0];
}

function ensurePreferredFastFoodFloor(
  selected: RecordedPick[],
  ordered: RecordedPick[],
  limit: number,
): RecordedPick[] {
  const availablePreferred = ordered.filter(pick =>
    PREFERRED_FAST_FOOD_LOCATIONS.has(pick.item.locationId),
  );
  const required = Math.min(2, limit, availablePreferred.length);
  if (required <= 0) return selected;

  const result = [...selected];
  let preferredCount = result.filter(pick =>
    PREFERRED_FAST_FOOD_LOCATIONS.has(pick.item.locationId),
  ).length;

  for (const preferred of availablePreferred) {
    if (preferredCount >= required) break;
    if (result.some(pick => pick.item.locationId === preferred.item.locationId)) continue;

    const replaceIndex = [...result]
      .map((pick, index) => ({ pick, index }))
      .reverse()
      .find(({ pick }) => !PREFERRED_FAST_FOOD_LOCATIONS.has(pick.item.locationId))
      ?.index;
    if (replaceIndex === undefined) break;

    result[replaceIndex] = preferred;
    preferredCount += 1;
  }

  return result;
}

function rotate<T>(values: T[], offset: number): T[] {
  if (!values.length) return [];
  const normalized = ((offset % values.length) + values.length) % values.length;
  if (!normalized) return [...values];
  return [...values.slice(normalized), ...values.slice(0, normalized)];
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

  if (item.type === 'fast' && PREFERRED_FAST_FOOD_LOCATIONS.has(item.locationId)) {
    score += 32;
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
