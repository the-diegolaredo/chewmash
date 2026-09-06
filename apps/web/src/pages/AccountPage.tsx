import { DINING_PLANS, diningPlanForBudget } from '../../../../src/lib/diningPlans';
import type { PlanSettings } from '../../../../src/lib/types';
import type { ChewMashState } from '../../../../src/storage/state';
import { SectionCard } from '../../../../src/ui/components';
import { money } from '../../../../src/ui/utils';
import './account-page.css';

export function AccountPage({ state, planDraft, setPlanDraft, updateAway, savePlan, exportBackup, importBackup, clearDiningData, logOut }: {
  state: ChewMashState;
  planDraft: PlanSettings | null;
  setPlanDraft: (plan: PlanSettings) => void;
  updateAway: (index: number, key: 'start' | 'end', value: string) => void;
  savePlan: () => Promise<void>;
  exportBackup: () => void;
  importBackup: () => void;
  clearDiningData: () => Promise<void>;
  logOut: () => Promise<void>;
}) {
  if (!planDraft) return null;

  const awaySlots = Array.from({ length: 3 }, (_, index) => planDraft.awayPeriods[index] ?? { start: '', end: '' });
  const transactions = [...state.transactions].sort((left, right) => `${right.date} ${right.time ?? ''}`.localeCompare(`${left.date} ${left.time ?? ''}`));
  const selectedPlan = diningPlanForBudget(planDraft.startingBudget);

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><p className="eyebrow">Plan details and privacy controls</p><h1>Account</h1></div></div>
      <SectionCard title="Plan settings">
        <div className="form-grid">
          <label>
            Dining plan
            <select
              value={String(planDraft.startingBudget)}
              onChange={event => setPlanDraft({ ...planDraft, startingBudget: Number(event.target.value) })}
            >
              {!selectedPlan ? <option value={String(planDraft.startingBudget)} disabled>Choose your dining plan</option> : null}
              {DINING_PLANS.map(plan => (
                <option key={plan.id} value={String(plan.startingBudget)}>
                  {plan.name} — {money(plan.startingBudget)} Dining Dollars
                </option>
              ))}
            </select>
          </label>
          <label>Plan starts<input type="date" value={planDraft.startDate} onChange={event => setPlanDraft({ ...planDraft, startDate: event.target.value })} /></label>
          <label>Plan ends<input type="date" value={planDraft.endDate} onChange={event => setPlanDraft({ ...planDraft, endDate: event.target.value })} /></label>
        </div>
        <h3 className="form-subheading">Away periods</h3>
        <div className="away-list">
          {awaySlots.map((period, index) => (
            <div className="away-row" key={index}>
              <label>Start<input type="date" value={period.start} onChange={event => updateAway(index, 'start', event.target.value)} /></label>
              <label>End<input type="date" value={period.end} onChange={event => updateAway(index, 'end', event.target.value)} /></label>
            </div>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={() => void savePlan()}>Save settings</button>
      </SectionCard>
      <SectionCard title="Data controls">
        <p className="section-copy">Dining data is stored in IndexedDB in this browser on this device. chewmash does not send your imported dining history to a backend. Clearing this site's browser data will remove the local copy, so export a backup if you want a portable copy.</p>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={exportBackup}>Export backup</button>
          <button className="secondary-button" type="button" onClick={importBackup}>Import backup</button>
          <button className="danger-button" type="button" onClick={() => void clearDiningData()}>Clear dining data</button>
        </div>
      </SectionCard>
      <SectionCard title="Log out">
        <p className="section-copy">chewmash has no cloud account to sign out of. Logging out removes this browser's local chewmash plan and dining data, then returns to the setup screen.</p>
        <button className="danger-button" type="button" onClick={() => void logOut()}>Log out</button>
      </SectionCard>
      <SectionCard title="Imported transactions" action={<span className="section-meta">{transactions.length} stored</span>}>
        <div className="transaction-table-wrap">
          <table className="transaction-table">
            <thead><tr><th>Date</th><th>Time</th><th>Location</th><th>Source</th><th>Amount</th></tr></thead>
            <tbody>
              {transactions.length ? transactions.map((transaction, index) => (
                <tr key={`${transaction.date}-${transaction.time}-${transaction.location}-${transaction.amount}-${index}`}>
                  <td>{transaction.date}</td><td>{transaction.time ?? '—'}</td><td>{transaction.location}</td><td>{transaction.source ?? 'Imported'}</td><td>{money(transaction.amount)}</td>
                </tr>
              )) : <tr><td colSpan={5} className="empty-cell">No imported transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
