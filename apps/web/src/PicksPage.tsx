import { useEffect, useMemo, useState } from 'react';
import { locationForItem, PICK_LOCATIONS } from '../../../src/menu/grubhub';
import {
  fetchCalPolyWeeklyHours,
  formatClosingTime,
  openStatusesForLocations,
  type WeeklyHoursSchedule,
} from '../../../src/menu/hours';
import {
  mealPeriodForHour,
  mealPeriodLabel,
  selectRecordedPicks,
  solidPickPool,
  type RecordedPick,
} from '../../../src/menu/recordedPicks';
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
  const [schedule, setSchedule] = useState<WeeklyHoursSchedule | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordedPick | null>(null);
  const [randomPick, setRandomPick] = useState<RecordedPick | null>(null);
  const now = new Date();
  const mealPeriod = mealPeriodForHour(now.getHours());

  useEffect(() => {
    const controller = new AbortController();
    setHoursError(null);
    void fetchCalPolyWeeklyHours({ signal: controller.signal })
      .then(setSchedule)
      .catch(reason => {
        if (controller.signal.aborted) return;
        setHoursError(reason instanceof Error ? reason.message : 'Could not load campus dining hours.');
      });
    return () => controller.abort();
  }, []);

  const statuses = useMemo(
    () => schedule ? openStatusesForLocations(schedule, PICK_LOCATIONS, now) : null,
    [schedule, now.getDate(), now.getHours(), now.getMinutes()],
  );

  const openLocationIds = useMemo(() => {
    if (!statuses) return new Set<string>();
    return new Set(
      [...statuses.values()]
        .filter(status => status.open)
        .map(status => status.locationId),
    );
  }, [statuses]);

  const selection = useMemo(
    () => selectRecordedPicks({
      remainingToday,
      mealPeriod,
      openLocationIds,
    }),
    [mealPeriod, openLocationIds, remainingToday],
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

  if (!schedule && !hoursError) {
    return (
      <div className="page-stack picks-page picks-v2-page">
        <div className="picks-heading picks-v2-heading">
          <p className="eyebrow">Picks</p>
          <h1>Checking what’s open…</h1>
          <p className="subtle">ChewMash is matching the recorded Grubhub menus against current Cal Poly dining hours.</p>
        </div>
      </div>
    );
  }

  if (hoursError) {
    return (
      <div className="page-stack picks-page picks-v2-page">
        <div className="picks-heading picks-v2-heading">
          <p className="eyebrow">Picks</p>
          <h1>Hours aren’t available right now.</h1>
          <p className="subtle">{hoursError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack picks-page picks-v2-page">
      <div className="picks-heading picks-v2-heading">
        <p className="eyebrow">Picks</p>
        <h1>Nine ideas for right now.</h1>
        <p className="subtle">Built around {mealPeriodLabel(mealPeriod).toLowerCase()}, your remaining Dining Dollars, and restaurants that are open now.</p>
      </div>

      <div className="picks-v2-context" aria-label="Pick context">
        <div><span>Left today</span><strong>{money(remainingToday)}</strong></div>
        <div><span>Meal time</span><strong>{mealPeriodLabel(mealPeriod)}</strong></div>
        <div><span>Mix</span><strong>3 fast · 2 drinks · 4 healthy</strong></div>
      </div>

      <section className="picks-v2-grid" aria-label="Today’s nine Picks">
        {selection.picks.map(pick => {
          const status = statuses?.get(pick.item.locationId);
          return (
            <PickCard
              key={pick.item.id}
              pick={pick}
              closesAt={status?.closesAt ?? null}
              onOpen={() => setSelected(pick)}
            />
          );
        })}
        {selection.picks.length < 9 ? Array.from({ length: 9 - selection.picks.length }, (_, index) => (
          <div className="pick-v2-card pick-v2-placeholder" key={`placeholder-${index}`}>
            <strong>No qualifying open option</strong>
            <span>ChewMash won’t fill a slot with a closed restaurant or a generic bottled/fountain drink.</span>
          </div>
        )) : null}
      </section>

      <section className="pick-for-me-panel" aria-label="Pick for me">
        <div>
          <p className="eyebrow">Can’t decide?</p>
          <h2>Pick for me!</h2>
          <p>ChewMash will choose from the current Picks and favor affordable solid food over a drink.</p>
        </div>
        <button
          className="primary-button pick-for-me-button"
          type="button"
          disabled={!selection.picks.length}
          onClick={() => {
            const pool = solidPickPool(selection.picks);
            const result = pool[Math.floor(Math.random() * pool.length)] ?? null;
            setRandomPick(result);
            if (result) setSelected(result);
          }}
        >
          Pick for me!
        </button>
        {randomPick ? (
          <div className="pick-for-me-result">
            <strong>{randomPick.item.name}</strong>
            <span>{locationForItem(randomPick.item).name} · {money(randomPick.item.price)}</span>
          </div>
        ) : null}
      </section>

      {selected ? (
        <PickDetails pick={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function PickCard({ pick, closesAt, onOpen }: { pick: RecordedPick; closesAt: string | null; onOpen: () => void }) {
  const location = locationForItem(pick.item);
  const closingLabel = formatClosingTime(closesAt);
  return (
    <button className="pick-v2-card" type="button" onClick={onOpen}>
      <span className={`pick-pennon pick-pennon-${pick.item.type}`} aria-label={pickTypeLabel(pick.item.type)}>
        <PickTypeIcon type={pick.item.type} />
      </span>
      <div className="pick-v2-center">
        <strong className="pick-v2-name">{pick.item.name}</strong>
        <span className="pick-v2-price">{money(pick.item.price)}</span>
        <span className="pick-v2-restaurant">{location.name}</span>
      </div>
      <small className={pick.fitsBudget ? 'pick-v2-fit' : 'pick-v2-over'}>
        {pick.fitsBudget ? `${money(pick.remainingAfter)} left after` : `${money(Math.abs(pick.remainingAfter))} over today`}
        {closingLabel ? ` · closes ${closingLabel}` : ''}
      </small>
    </button>
  );
}

function PickDetails({ pick, onClose }: { pick: RecordedPick; onClose: () => void }) {
  const location = locationForItem(pick.item);
  return (
    <MetricDetailModal title={pick.item.name} value={money(pick.item.price)} onClose={onClose}>
      <p className="pick-detail-restaurant">{location.name}</p>
      {pick.item.description ? <p>{pick.item.description}</p> : null}
      <div className="detail-grid picks-detail-grid">
        <div><span>Type</span><strong>{pickTypeLabel(pick.item.type)}</strong></div>
        <div><span>Price</span><strong>{money(pick.item.price)}</strong></div>
        <div><span>After this</span><strong>{money(pick.remainingAfter)}</strong></div>
      </div>
      <div className="picks-detail-list">
        {pick.item.portion ? <span><strong>Portion:</strong> {pick.item.portion}</span> : null}
        {pick.item.calories ? <span><strong>Calories:</strong> {pick.item.calories}</span> : null}
        {pick.item.vegan !== undefined ? <span><strong>Vegan:</strong> {pick.item.vegan ? 'Yes' : 'No'}</span> : null}
        {pick.item.vegetarian !== undefined ? <span><strong>Vegetarian:</strong> {pick.item.vegetarian ? 'Yes' : 'No'}</span> : null}
        {pick.item.glutenFree !== undefined ? <span><strong>Gluten-free:</strong> {pick.item.glutenFree ? 'Yes' : 'No'}</span> : null}
      </div>
      <div className="pick-directions">
        <strong>Directions</strong>
        <div className="button-row">
          <a className="primary-button" href={googleMapsUrl(location.mapQuery)} target="_blank" rel="noreferrer">Google Maps</a>
          <a className="secondary-button" href={appleMapsUrl(location.mapQuery)} target="_blank" rel="noreferrer">Apple Maps</a>
          <a className="secondary-button" href={openStreetMapUrl(location.mapQuery)} target="_blank" rel="noreferrer">OpenStreetMap</a>
        </div>
      </div>
      <small className="detail-source">Menu details come from the supplied student Grubhub recordings. Current availability is matched against Cal Poly’s Dine On Campus hours. Generic bottled water, bottled drinks, and fountain beverages are excluded.</small>
    </MetricDetailModal>
  );
}

function PickTypeIcon({ type }: { type: 'fast' | 'drink' | 'healthy' }) {
  if (type === 'drink') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10l-1 15H8L7 5Zm3-3 2 3m0 0 3-3" /></svg>;
  }
  if (type === 'healthy') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-6 0-11 3-11 9 0 3 2 5 5 5 6 0 7-8 6-14ZM5 20c2-5 6-8 11-11" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14M6 8c1-3 3-4 6-4s5 1 6 4M5 14h14v4H5v-4Z" /></svg>;
}

function pickTypeLabel(type: 'fast' | 'drink' | 'healthy'): string {
  if (type === 'fast') return 'Fast food';
  if (type === 'drink') return 'Drink';
  return 'Healthy';
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
