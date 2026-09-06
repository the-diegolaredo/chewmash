export const DINING_PLANS = [
  {
    id: 'first-year-max',
    name: 'First-Year Max',
    startingBudget: 3709,
  },
  {
    id: 'first-year-plus',
    name: 'First-Year Plus',
    startingBudget: 3295,
  },
  {
    id: 'first-year-limited',
    name: 'First-Year Limited',
    startingBudget: 2908,
  },
] as const;

export type DiningPlan = (typeof DINING_PLANS)[number];
export type DiningPlanId = DiningPlan['id'];

export const DEFAULT_DINING_PLAN: DiningPlan = DINING_PLANS[1];

export function diningPlanForBudget(startingBudget: number): DiningPlan | null {
  return DINING_PLANS.find(plan => plan.startingBudget === startingBudget) ?? null;
}

export function isSupportedDiningPlanBudget(startingBudget: number): boolean {
  return diningPlanForBudget(startingBudget) !== null;
}
