import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DINING_PLAN,
  DINING_PLANS,
  diningPlanForBudget,
  isSupportedDiningPlanBudget,
} from './diningPlans';

describe('dining plans', () => {
  it('keeps the three supported first-year plans in one shared catalog', () => {
    expect(DINING_PLANS.map(plan => [plan.name, plan.startingBudget])).toEqual([
      ['First-Year Max', 3709],
      ['First-Year Plus', 3295],
      ['First-Year Limited', 2908],
    ]);
  });

  it('uses First-Year Plus as the current default', () => {
    expect(DEFAULT_DINING_PLAN.id).toBe('first-year-plus');
    expect(DEFAULT_DINING_PLAN.startingBudget).toBe(3295);
  });

  it('resolves and validates supported budgets', () => {
    expect(diningPlanForBudget(3709)?.id).toBe('first-year-max');
    expect(isSupportedDiningPlanBudget(2908)).toBe(true);
    expect(isSupportedDiningPlanBudget(3000)).toBe(false);
  });
});
