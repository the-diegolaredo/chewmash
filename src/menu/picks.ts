import type { DineOnCampusMenuItem, MealPeriod } from './dineoncampus';

export interface RankedPick {
  item: DineOnCampusMenuItem;
  score: number;
  fitsBudget: boolean | null;
  remainingAfter: number | null;
  why: string;
}

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
    case 'all-day': return 'All-day';
    default: return 'Anytime';
  }
}

export function rankMenuPicks(
  items: DineOnCampusMenuItem[],
  options: {
    remainingToday: number;
    mealPeriod: MealPeriod;
    limit?: number;
  },
): RankedPick[] {
  const limit = Math.max(1, options.limit ?? 6);
  const unique = dedupeByNameAndLocation(items)
    .filter(item => isMealLike(item))
    .map(item => scoreItem(item, options.remainingToday, options.mealPeriod))
    .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name));

  const selected: RankedPick[] = [];
  const locationCounts = new Map<string, number>();
  let drinkCount = 0;

  // Picks should read like a meal list, not a coffee menu. Keep a single drink
  // slot available for variety, but only after solid food has competed on score.
  const canAdd = (pick: RankedPick) => !isDrinkLike(pick.item) || drinkCount < 1;
  const add = (pick: RankedPick) => {
    selected.push(pick);
    locationCounts.set(pick.item.location, (locationCounts.get(pick.item.location) ?? 0) + 1);
    if (isDrinkLike(pick.item)) drinkCount += 1;
  };

  for (const pick of unique) {
    if (!canAdd(pick)) continue;
    const count = locationCounts.get(pick.item.location) ?? 0;
    if (count >= 2 && unique.length > limit) continue;
    add(pick);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const pick of unique) {
      if (selected.includes(pick) || !canAdd(pick)) continue;
      add(pick);
      if (selected.length >= limit) break;
    }
  }

  return selected;
}

export function surprisePool(
  picks: RankedPick[],
  mealPeriod: MealPeriod,
): RankedPick[] {
  const affordableAndRelevant = picks.filter(pick =>
    pick.fitsBudget !== false
    && (pick.item.period === mealPeriod || pick.item.period === 'all-day' || mealPeriod === 'other'),
  );
  if (affordableAndRelevant.length) return affordableAndRelevant;
  const affordable = picks.filter(pick => pick.fitsBudget !== false);
  return affordable.length ? affordable : picks;
}

function scoreItem(
  item: DineOnCampusMenuItem,
  remainingToday: number,
  mealPeriod: MealPeriod,
): RankedPick {
  let score = 0;
  const reasons: string[] = [];

  if (item.period === mealPeriod) {
    score += 60;
    reasons.push(`good ${mealPeriod} timing`);
  } else if (item.period === 'all-day') {
    score += 35;
    reasons.push('available all day');
  } else if (mealPeriod === 'other') {
    score += 20;
  } else {
    score -= 18;
  }

  let fitsBudget: boolean | null = null;
  let remainingAfter: number | null = null;
  if (item.price !== null) {
    remainingAfter = remainingToday - item.price;
    fitsBudget = remainingAfter >= -0.005;
    if (fitsBudget) {
      score += 50;
      reasons.push('fits what you have left today');
      if (remainingToday > 0) {
        const budgetUse = item.price / remainingToday;
        if (budgetUse >= 0.35 && budgetUse <= 0.85) score += 8;
      }
    } else {
      score -= 70 + Math.min(30, Math.abs(remainingAfter));
      reasons.push('over today’s remaining target');
    }
  } else {
    score += 8;
    reasons.push('menu price not published');
  }

  if (item.calories !== null) {
    if (item.calories >= 300) score += 5;
    if (item.calories < 120) score -= 8;
  }

  const lowerStation = (item.station ?? '').toLowerCase();
  if (/topping|condiment|sauce|ingredient|add[- ]?on/.test(lowerStation)) score -= 45;

  if (isDrinkLike(item)) {
    score -= 80;
  } else {
    score += solidFoodScore(item);
    score += preferredDiningScore(item);
  }

  return {
    item,
    score,
    fitsBudget,
    remainingAfter,
    why: sentenceCase(reasons.slice(0, 2).join(' · ')) || 'A menu option available today.',
  };
}

function isMealLike(item: DineOnCampusMenuItem): boolean {
  const name = item.name.toLowerCase();
  if (/^(ketchup|mustard|mayo|mayonnaise|ranch|hot sauce|salsa|syrup)$/.test(name)) return false;
  const station = (item.station ?? '').toLowerCase();
  if (/^ingredients?$/.test(station)) return false;
  return true;
}

function isDrinkLike(item: DineOnCampusMenuItem): boolean {
  const station = (item.station ?? '').toLowerCase();
  const name = item.name.toLowerCase();
  const description = (item.description ?? '').toLowerCase();
  const haystack = `${name} ${station} ${description}`;

  return /\b(coffee|beverage|drink|smoothie|juice|tea|espresso|latte|mocha|cappuccino|frappuccino|refresher|cold brew|americano|macchiato|lemonade|soda|cola|coke|pepsi|sprite|root beer|energy drink|boba|milkshake|protein shake|hot chocolate|chocolate milk|water)\b/.test(haystack);
}

function solidFoodScore(item: DineOnCampusMenuItem): number {
  const haystack = `${item.name} ${item.station ?? ''} ${item.description ?? ''}`.toLowerCase();
  let score = 0;

  if (/\b(bowl|plate|platter|burger|sandwich|wrap|burrito|taco|quesadilla|pizza|pasta|noodle|rice|chicken|beef|pork|turkey|salmon|tuna|poke|salad|soup|toast|bagel|egg|omelet|fries|tenders|wings|sushi|roll|gyro|falafel|steak|meal|entree|entrée)\b/.test(haystack)) {
    score += 18;
  }
  if (item.calories !== null && item.calories >= 250) score += 5;

  return score;
}

function preferredDiningScore(item: DineOnCampusMenuItem): number {
  const venue = `${item.location} ${item.station ?? ''}`.toLowerCase();

  // Favor the places students are most likely to look to for an actual meal:
  // Vista Grande, 1901 Marketplace, and the major fast-food counters.
  if (/vista grande|\bvg\b|1901|panda express|chick[- ]?fil[- ]?a|subway|taco bell|einstein|kai poke|pom\s*&\s*honey|red radish|poly choice/.test(venue)) {
    return 24;
  }

  // Vista Grande station names can arrive as the location label in Dine On
  // Campus, so give its recognizable solid-food concepts a smaller bump too.
  if (/mingle\s*\+\s*nosh|noodles|hearth|streats|brunch|balance/.test(venue)) {
    return 12;
  }

  return 0;
}

function dedupeByNameAndLocation(items: DineOnCampusMenuItem[]): DineOnCampusMenuItem[] {
  const byKey = new Map<string, DineOnCampusMenuItem>();
  for (const item of items) {
    const key = `${item.name.toLowerCase()}|${item.location.toLowerCase()}|${item.period}`;
    const existing = byKey.get(key);
    if (!existing || (existing.price === null && item.price !== null)) byKey.set(key, item);
  }
  return [...byKey.values()];
}

function sentenceCase(value: string): string {
  if (!value) return value;
  return `${value[0]!.toUpperCase()}${value.slice(1)}.`;
}
