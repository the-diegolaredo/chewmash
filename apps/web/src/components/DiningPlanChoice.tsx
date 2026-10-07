import { DINING_PLANS } from '../../../../src/lib/diningPlans';

export function DiningPlanChoice({
  value,
  onChange,
  compact = false,
  showIntro = true,
}: {
  value: number | null;
  onChange: (startingBudget: number) => void;
  compact?: boolean;
  showIntro?: boolean;
}) {
  return (
    <fieldset
      className={compact ? 'dining-plan-choice dining-plan-choice-compact' : 'dining-plan-choice'}
      aria-label={showIntro ? undefined : 'Choose your dining plan'}
    >
      {showIntro ? <legend>Choose your dining plan</legend> : null}
      {showIntro ? <p>ChewMash uses your plan balance to calculate your daily target and budget pace. Pick the plan you actually have before syncing dining data.</p> : null}
      <div className="dining-plan-options">
        {DINING_PLANS.map(plan => {
          const selected = value === plan.startingBudget;
          return (
            <label className={selected ? 'dining-plan-option selected' : 'dining-plan-option'} key={plan.id}>
              <input
                type="radio"
                name="chewmash-dining-plan"
                value={plan.startingBudget}
                checked={selected}
                onChange={() => onChange(plan.startingBudget)}
              />
              <span>
                <strong>{plan.name}</strong>
                <small>{'$'}{plan.startingBudget.toLocaleString('en-US')} Dining Dollars</small>
              </span>
              <b aria-hidden="true">{selected ? '✓' : ''}</b>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
