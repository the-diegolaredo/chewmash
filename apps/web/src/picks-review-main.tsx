import { createRoot } from 'react-dom/client';
import '../../../entrypoints/dashboard/style.css';
import './web.css';
import './polish.css';
import '../../../src/ui/nimbus.css';
import './theme.css';
import './original-layout.css';
import './picks-v2.css';
import { PICK_LOCATIONS, locationForItem, type PickType } from '../../../src/menu/grubhub';
import { selectRecordedPicks } from '../../../src/menu/recordedPicks';
import { money } from '../../../src/ui/utils';

const openLocationIds = new Set(
  PICK_LOCATIONS.filter(location => location.menuStatus === 'ready').map(location => location.id),
);
const selection = selectRecordedPicks({
  remainingToday: 24.50,
  mealPeriod: 'lunch',
  openLocationIds,
});

function Review() {
  return (
    <main className="web-app-shell" style={{ margin: '0 auto', padding: '38px 24px 80px' }}>
      <div className="page-stack picks-page picks-v2-page">
        <div className="picks-heading picks-v2-heading">
          <p className="eyebrow">Picks</p>
          <h1>Nine ideas for right now.</h1>
          <p className="subtle">Built around lunch, your remaining Dining Dollars, and restaurants that are open now.</p>
        </div>

        <div className="picks-v2-context" aria-label="Pick context">
          <div><span>Left today</span><strong>{money(24.50)}</strong></div>
          <div><span>Meal time</span><strong>Lunch</strong></div>
          <div><span>Open places matched</span><strong>{openLocationIds.size}</strong></div>
        </div>

        <section className="picks-v2-board" aria-labelledby="review-picks-title">
          <div className="picks-v2-board-heading">
            <div>
              <p className="eyebrow">Your 9</p>
              <h2 id="review-picks-title">Picks for right now</h2>
            </div>
            <div className="picks-v2-mix">
              <span><b>3</b> fast</span>
              <span><b>2</b> drinks</span>
              <span><b>4</b> healthy</span>
            </div>
          </div>
          <div className="picks-v2-grid">
            {selection.picks.map(pick => {
              const location = locationForItem(pick.item);
              return (
                <button className={`pick-v2-card pick-v2-card-${pick.item.type}`} type="button" key={pick.item.id}>
                  <span className={`pick-pennon pick-pennon-${pick.item.type}`} aria-label={pick.item.type}>
                    <TypeIcon type={pick.item.type} />
                  </span>
                  <div className="pick-v2-center">
                    <strong className="pick-v2-name">{pick.item.name}</strong>
                    <span className="pick-v2-price">{money(pick.item.price)}</span>
                    <span className="pick-v2-restaurant">{location.name}</span>
                  </div>
                  <small className={pick.fitsBudget ? 'pick-v2-fit' : 'pick-v2-over'}>
                    {pick.fitsBudget ? `${money(pick.remainingAfter)} left after` : `${money(Math.abs(pick.remainingAfter))} over today`}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="picks-v2-source">
            <span>Menus: student Grubhub recordings</span>
            <span>Hours: visual-review fixture only</span>
          </div>
        </section>

        <section className="pick-for-me-panel">
          <div>
            <p className="eyebrow">Can’t decide?</p>
            <h2>Pick for me!</h2>
            <p>ChewMash chooses from the current Picks and prefers an affordable solid-food option over a drink.</p>
          </div>
          <button className="primary-button pick-for-me-button" type="button">Pick for me!</button>
        </section>
      </div>
    </main>
  );
}

function TypeIcon({ type }: { type: PickType }) {
  if (type === 'drink') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10l-1 15H8L7 5Zm3-3 2 3m0 0 3-3" /></svg>;
  if (type === 'healthy') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-6 0-11 3-11 9 0 3 2 5 5 5 6 0 7-8 6-14ZM5 20c2-5 6-8 11-11" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14M6 8c1-3 3-4 6-4s5 1 6 4M5 14h14v4H5v-4Z" /></svg>;
}

createRoot(document.getElementById('root')!).render(<Review />);
