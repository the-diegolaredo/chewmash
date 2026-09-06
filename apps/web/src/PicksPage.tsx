import { useMemo, useState } from 'react';
import { GRUBHUB_PICK_ITEMS, type PickType } from '../../../src/menu/grubhubCatalog';
import { openRestaurantIdsAt } from '../../../src/menu/locationHours';
import { buildPicks, mealPeriodForMoment, randomSolidPick, type PickRecommendation } from '../../../src/menu/pickEngineV2';
import { MetricDetailModal, SectionCard } from '../../../src/ui/components';
import { money } from '../../../src/ui/utils';
import type { GetConnectorModel } from './useGetConnector';
import './picks-v2.css';

export function PicksPage({
  remainingToday,
  hasDiningData,
  connector,
  onGoHome,
}: {
  today: string;
  remainingToday: number;
  hasDiningData: boolean;
  connector: GetConnectorModel;
  onGoHome: () => void;
}) {
  const [selected, setSelected] = useState<PickRecommendation | null>(null);
  const [randomPick, setRandomPick] = useState<PickRecommendation | null>(null);
  const now = new Date();
  const mealPeriod = mealPeriodForMoment(now);
  const openRestaurantIds = openRestaurantIdsAt(now);

  const selection = useMemo(
    () => buildPicks(GRUBHUB_PICK_ITEMS, {
      now,
      remainingToday,
      openRestaurantIds: openRestaurantIds ?? undefined,
    }),
    [remainingToday, now.getHours(), openRestaurantIds?.size],
  );

  void connector;

  if (!hasDiningData) {
    return (
      <div className="page-stack picks-page picks-v2-page">
        <div className="picks-heading">
          <p className="eyebrow">Picks</p>
          <h1>Meals that fit your day.</h1>
          <p className="subtle">Connect dining data first so chewmash knows how much you have left to spend today.</p>
        </div>
        <SectionCard title="Finish setup first">
          <p className="section-copy">Picks uses your Dining Dollars target to choose options that fit the current meal period and your remaining budget.</p>
          <button className="primary-button" type="button" onClick={onGoHome}>Go to setup</button>
        </SectionCard>
      </div>
    );
  }

  const missingSlots = 9 - selection.picks.length;

  return (
    <div className="page-stack picks-page picks-v2-page">
      <div className="picks-heading picks-v2-heading">
        <p className="eyebrow">Picks</p>
        <h1>Nine ideas for right now.</h1>
        <p className="subtle">Built around {mealPeriodLabel(mealPeriod).toLowerCase()}, your remaining Dining Dollars, and the menus available on campus.</p>
      </div>

      <div className="picks-v2-context" aria-label="Pick context">
        <div><span>Left today</span><strong>{money(remainingToday)}</strong></div>
        <div><span>Meal time</span><strong>{mealPeriodLabel(mealPeriod)}</strong></div>
        <div><span>Mix</span><strong>3 fast · 2 drinks · 4 healthy</strong></div>
      </div>

      <section className="picks-v2-grid" aria-label="Today’s nine Picks">
        {selection.picks.map(pick => (
          <PickCard key={pick.item.id} pick={pick} onOpen={() => setSelected(pick)} />
        ))}
        {missingSlots > 0 ? Array.from({ length: missingSlots }, (_, index) => (
          <div className="pick-v2-card pick-v2-placeholder" key={`placeholder-${index}`}>
            <strong>More menu data coming</strong>
            <span>Chick-fil-A and Brunch can drop into the same catalog later.</span>
          </div>
        )) : null}
      </section>

      <section className="pick-for-me-panel" aria-label="Pick for me">
        <div>
          <p className="eyebrow">Can’t decide?</p>
          <h2>Pick for me!</h2>
          <p>ChewMash will favor a solid-food option that fits what you have left today.</p>
        </div>
        <button
          className="primary-button pick-for-me-button"
          type="button"
          disabled={!selection.picks.length}
          onClick={() => {
            const result = randomSolidPick(selection.picks);
            setRandomPick(result);
            if (result) setSelected(result);
          }}
        >
          Pick for me!
        </button>
        {randomPick ? <div className="pick-for-me-result"><strong>{randomPick.item.name}</strong><span>{randomPick.item.restaurant} · {money(randomPick.item.price)}</span></div> : null}
      </section>

      {selected ? (
        <MetricDetailModal
          title={selected.item.name}
          value={money(selected.item.price)}
          onClose={() => setSelected(null)}
        >
          <p className="pick-detail-restaurant">{selected.item.restaurant}</p>
          {selected.item.description ? <p>{selected.item.description}</p> : null}
          <div className="detail-grid picks-detail-grid">
            <div><span>Type</span><strong>{pickTypeLabel(selected.item.type)}</strong></div>
            <div><span>Price</span><strong>{money(selected.item.price)}</strong></div>
            <div><span>After this</span><strong>{money(selected.remainingAfter)}</strong></div>
          </div>
          <div className="picks-detail-list">
            {selected.item.portion ? <span><strong>Portion:</strong> {selected.item.portion}</span> : null}
            {selected.item.calories !== undefined ? <span><strong>Calories:</strong> {Math.round(selected.item.calories)}</span> : null}
            {selected.item.vegan !== undefined ? <span><strong>Vegan:</strong> {selected.item.vegan ? 'Yes' : 'No'}</span> : null}
            {selected.item.vegetarian !== undefined ? <span><strong>Vegetarian:</strong> {selected.item.vegetarian ? 'Yes' : 'No'}</span> : null}
          </div>
          <div className="pick-directions">
            <strong>Directions</strong>
            <div className="button-row">
              <a className="primary-button" href={googleMapsUrl(selected.item.directionsQuery)} target="_blank" rel="noreferrer">Google Maps</a>
              <a className="secondary-button" href={appleMapsUrl(selected.item.directionsQuery)} target="_blank" rel="noreferrer">Apple Maps</a>
              <a className="secondary-button" href={openStreetMapUrl(selected.item.directionsQuery)} target="_blank" rel="noreferrer">OpenStreetMap</a>
            </div>
          </div>
          <small className="detail-source">Menu names, prices, and descriptions in this catalog come from the supplied student Grubhub recordings. Generic bottled water, bottled drinks, and fountain beverages are excluded from Picks.</small>
        </MetricDetailModal>
      ) : null}
    </div>
  );
}

function PickCard({ pick, onOpen }: { pick: PickRecommendation; onOpen: () => void }) {
  return (
    <button className="pick-v2-card" type="button" onClick={onOpen}>
      <span className={`pick-pennon pick-pennon-${pick.item.type}`} aria-label={pickTypeLabel(pick.item.type)}>
        <PickTypeIcon type={pick.item.type} />
      </span>
      <div className="pick-v2-center">
        <strong className="pick-v2-name">{pick.item.name}</strong>
        <span className="pick-v2-price">{money(pick.item.price)}</span>
        <span className="pick-v2-restaurant">{pick.item.restaurant}</span>
      </div>
      <small className={pick.fitsBudget ? 'pick-v2-fit' : 'pick-v2-over'}>
        {pick.fitsBudget ? `${money(pick.remainingAfter)} left after` : `${money(Math.abs(pick.remainingAfter))} over today`}
      </small>
    </button>
  );
}

function PickTypeIcon({ type }: { type: PickType }) {
  if (type === 'drink') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10l-1 15H8L7 5Zm3-3 2 3m0 0 3-3" /></svg>;
  }
  if (type === 'healthy') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-6 0-11 3-11 9 0 3 2 5 5 5 6 0 7-8 6-14ZM5 20c2-5 6-8 11-11" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14M6 8c1-3 3-4 6-4s5 1 6 4M5 14h14v4H5v-4Z" /></svg>;
}

function pickTypeLabel(type: PickType): string {
  if (type === 'fast') return 'Fast food';
  if (type === 'drink') return 'Drink';
  return 'Healthy';
}

function mealPeriodLabel(period: ReturnType<typeof mealPeriodForMoment>): string {
  if (period === 'breakfast') return 'Breakfast';
  if (period === 'lunch') return 'Lunch';
  if (period === 'dinner') return 'Dinner';
  return 'Anytime';
}

function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function appleMapsUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function openStreetMapUrl(query: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}
