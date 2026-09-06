import { useEffect, useMemo, useState } from 'react';
import { locationForItem, PICK_LOCATIONS, type PickType } from '../../../src/menu/grubhub';
import { formatClosingTime, openStatusesForLocations } from '../../../src/menu/hours';
import {
  buildRecordedCalPolyHours,
  RECORDED_HOURS_SOURCE_LABEL,
} from '../../../src/menu/recordedHours';
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
  const [selected, setSelected] = useState<RecordedPick | null>(null);
  const [randomPick, setRandomPick] = useState<RecordedPick | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const mealPeriod = mealPeriodForHour(now.getHours());

  // The web GET connector is intentionally not used for Picks menu data.
  // Student Grubhub recordings are the source of item names/prices/details.
  void connector;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const schedule = useMemo(() => buildRecordedCalPolyHours(now), [now]);
  const statuses = useMemo(
    () => openStatusesForLocations(schedule, PICK_LOCATIONS, now),
    [schedule, now],
  );

  const openLocationIds = useMemo(() => new Set(
    [...statuses.values()]
      .filter(status => status.open)
      .map(status => status.locationId),
  ), [statuses]);

  const selection = useMemo(
    () => selectRecordedPicks({
      remainingToday,
      mealPeriod,
      openLocationIds,
      variant: refreshVersion,
    }),
    [mealPeriod, openLocationIds, refreshVersion, remainingToday],
  );

  if (!hasDiningData) {
    return (
      <div className="page-stack picks-page picks-v2-page">
        <div className="picks-heading picks-v2-heading">
          <h1>Picks</h1>
          <p className="subtle">Good food, right now — matched to your budget, the time, and what’s open.</p>
        </div>
        <SectionCard title="Finish setup first">
          <p className="section-copy">Picks uses your Dining Dollars target to choose options that fit the current meal period and your remaining budget.</p>
          <button className="primary-button" type="button" onClick={onGoHome}>Go to setup</button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack picks-page picks-v2-page">
      <div className="picks-heading picks-v2-heading">
        <h1>Picks</h1>
        <p className="subtle">Good food, right now — matched to your budget, the time, and what’s open.</p>
      </div>

      <div className="picks-v2-context" aria-label="Pick context">
        <div><span>Left today</span><strong>{money(remainingToday)}</strong></div>
        <div><span>Meal time</span><strong>{mealPeriodLabel(mealPeriod)}</strong></div>
        <div><span>Open places</span><strong>{openLocationIds.size}</strong></div>
      </div>

      <section className="picks-v2-board" aria-labelledby="picks-grid-title">
        <div className="picks-v2-board-heading">
          <div>
            <p className="eyebrow">Recommended</p>
            <h2 id="picks-grid-title">For right now</h2>
          </div>
        </div>

        <div className="picks-v2-grid" key={`picks-grid-${refreshVersion}`} aria-label="Today’s Picks">
          {selection.picks.map(pick => {
            const status = statuses.get(pick.item.locationId);
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
        </div>

        {selection.picks.length < 9 ? (
          <p className="picks-v2-availability-note">
            Some slots are unavailable at this hour. ChewMash leaves them empty rather than recommending a closed location.
          </p>
        ) : null}

        <div className="picks-refresh-row">
          <button
            className="secondary-button picks-refresh-button"
            type="button"
            disabled={!selection.picks.length}
            onClick={() => {
              setRefreshVersion(version => version + 1);
              setRandomPick(null);
              setSelected(null);
            }}
          >
            <RefreshIcon />
            Refresh picks
          </button>
        </div>

        <div className="picks-v2-source">
          <span>Menus: student Grubhub recordings</span>
          <span>Hours: {RECORDED_HOURS_SOURCE_LABEL}</span>
        </div>
      </section>

      <section className="pick-for-me-panel" aria-label="Pick for me">
        <div>
          <p className="eyebrow">Can’t decide?</p>
          <h2>Pick for me!</h2>
          <p>ChewMash chooses from the current Picks and prefers an affordable solid-food option over a drink.</p>
        </div>
        <button
          className="primary-button pick-for-me-button"
          type="button"
          disabled={!selection.picks.length}
          onClick={() => {
            const pool = solidPickPool(selection.picks);
            const result = pool[Math.floor(Math.random() * pool.length)] ?? null;
            setRandomPick(result);
          }}
        >
          {randomPick ? 'Pick again' : 'Pick for me!'}
        </button>
        {randomPick ? (
          <div className="pick-for-me-result" aria-live="polite">
            <strong>{randomPick.item.name}</strong>
            <span>{locationForItem(randomPick.item).name} · {money(randomPick.item.price)}</span>
            <button className="secondary-button" type="button" onClick={() => setSelected(randomPick)}>View this pick</button>
          </div>
        ) : null}
      </section>

      <div className="picks-pending-note">
        Chick-fil-A and Brunch are intentionally left out until their student Grubhub menus are available. Adding them later only requires menu data; the Picks engine and layout do not need to change.
      </div>

      {selected ? <PickDetails pick={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function PickCard({ pick, closesAt, onOpen }: { pick: RecordedPick; closesAt: string | null; onOpen: () => void }) {
  const location = locationForItem(pick.item);
  const closingLabel = formatClosingTime(closesAt);
  return (
    <button className={`pick-v2-card pick-v2-card-${pick.item.type}`} type="button" onClick={onOpen}>
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
  const afterLabel = pick.remainingAfter >= 0
    ? `${money(pick.remainingAfter)} left`
    : `${money(Math.abs(pick.remainingAfter))} over target`;

  return (
    <MetricDetailModal title={pick.item.name} value={money(pick.item.price)} onClose={onClose}>
      <p className="pick-detail-restaurant">{location.name}</p>
      {pick.item.description ? <p>{pick.item.description}</p> : null}
      <div className="detail-grid picks-detail-grid">
        <div><span>Type</span><strong>{pickTypeLabel(pick.item.type)}</strong></div>
        <div><span>Price</span><strong>{money(pick.item.price)}</strong></div>
        <div><span>After this</span><strong>{afterLabel}</strong></div>
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
      <small className="detail-source">Menu details come from the supplied student Grubhub recordings. Dietary, portion, and calorie information is shown only when it was visible in those recordings. Availability is checked against the recorded official Cal Poly hours for this week.</small>
    </MetricDetailModal>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.7 6.8L4 9m16 6-2.7 2.2A7 7 0 0 1 5.8 15" />
    </svg>
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

function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

function appleMapsUrl(query: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`;
}

function openStreetMapUrl(query: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}
