import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [slotPreview, setSlotPreview] = useState<RecordedPick | null>(null);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const slotIntervalRef = useRef<number | null>(null);
  const slotTimeoutRef = useRef<number | null>(null);
  const mealPeriod = mealPeriodForHour(now.getHours());

  // The web GET connector is intentionally not used for Picks menu data.
  // Student Grubhub recordings are the source of item names/prices/details.
  void connector;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (slotIntervalRef.current !== null) window.clearInterval(slotIntervalRef.current);
    if (slotTimeoutRef.current !== null) window.clearTimeout(slotTimeoutRef.current);
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

  function clearSlotTimers() {
    if (slotIntervalRef.current !== null) {
      window.clearInterval(slotIntervalRef.current);
      slotIntervalRef.current = null;
    }
    if (slotTimeoutRef.current !== null) {
      window.clearTimeout(slotTimeoutRef.current);
      slotTimeoutRef.current = null;
    }
  }

  function resetSlotMachine() {
    clearSlotTimers();
    setSlotSpinning(false);
    setSlotPreview(null);
    setRandomPick(null);
  }

  function spinPickForMe() {
    if (slotSpinning) return;
    const pool = solidPickPool(selection.picks);
    if (!pool.length) return;

    const differentFromLast = randomPick
      ? pool.filter(pick => pick.item.id !== randomPick.item.id)
      : pool;
    const finalPool = differentFromLast.length ? differentFromLast : pool;
    const finalPick = finalPool[Math.floor(Math.random() * finalPool.length)] ?? pool[0];
    if (!finalPick) return;

    clearSlotTimers();

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSlotPreview(finalPick);
      setRandomPick(finalPick);
      setSlotSpinning(false);
      return;
    }

    setRandomPick(null);
    setSlotSpinning(true);
    let cursor = Math.floor(Math.random() * pool.length);
    setSlotPreview(pool[cursor] ?? finalPick);

    slotIntervalRef.current = window.setInterval(() => {
      cursor = (cursor + 1) % pool.length;
      setSlotPreview(pool[cursor] ?? finalPick);
    }, 85);

    slotTimeoutRef.current = window.setTimeout(() => {
      if (slotIntervalRef.current !== null) {
        window.clearInterval(slotIntervalRef.current);
        slotIntervalRef.current = null;
      }
      slotTimeoutRef.current = null;
      setSlotPreview(finalPick);
      setRandomPick(finalPick);
      setSlotSpinning(false);
    }, 1150);
  }

  if (!hasDiningData) {
    return (
      <div className="page-stack picks-page picks-v2-page">
        <div className="page-title-row">
          <div>
            <p className="eyebrow">good food, right now</p>
            <h1>Picks</h1>
          </div>
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
      <div className="page-title-row">
        <div>
          <p className="eyebrow">good food, right now</p>
          <h1>Picks</h1>
        </div>
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
              resetSlotMachine();
              setRefreshVersion(version => version + 1);
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
        <div className="pick-for-me-copy">
          <p className="eyebrow">Can’t decide?</p>
          <h2>Pick for me!</h2>
          <p>Spin the reel and let ChewMash land on one of your current affordable food Picks.</p>
        </div>

        <div className="pick-slot-machine" aria-busy={slotSpinning}>
          <div className="pick-slot-window">
            {slotPreview ? (
              <PickSlotCard pick={slotPreview} spinning={slotSpinning} />
            ) : (
              <div className="pick-v2-card pick-v2-placeholder pick-slot-card pick-slot-card-empty">
                <div className="pick-v2-center">
                  <SlotIcon />
                  <strong className="pick-v2-name">Ready to spin</strong>
                  <span className="pick-v2-restaurant">One of today’s food Picks will land here.</span>
                </div>
              </div>
            )}
          </div>
          <div className="pick-slot-status" aria-live="polite">
            {slotSpinning
              ? 'Spinning through today’s Picks…'
              : randomPick
                ? `${randomPick.item.name} is your pick.`
                : 'Tap the button to spin.'}
          </div>
        </div>

        <div className="pick-for-me-actions">
          <button
            className="primary-button pick-for-me-button"
            type="button"
            disabled={!selection.picks.length || slotSpinning}
            onClick={spinPickForMe}
          >
            {slotSpinning ? 'Spinning…' : randomPick ? 'Spin again' : 'Spin for a pick'}
          </button>
          {randomPick ? (
            <button className="secondary-button" type="button" onClick={() => setSelected(randomPick)}>
              View this pick
            </button>
          ) : null}
        </div>
      </section>

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

function PickSlotCard({ pick, spinning }: { pick: RecordedPick; spinning: boolean }) {
  const location = locationForItem(pick.item);
  return (
    <div
      key={`${pick.item.id}-${spinning ? 'spinning' : 'landed'}`}
      className={`pick-v2-card pick-slot-card pick-v2-card-${pick.item.type}${spinning ? ' is-spinning' : ' is-landed'}`}
    >
      <span className={`pick-pennon pick-pennon-${pick.item.type}`} aria-hidden="true">
        <PickTypeIcon type={pick.item.type} />
      </span>
      <div className="pick-v2-center">
        <strong className="pick-v2-name">{pick.item.name}</strong>
        <span className="pick-v2-price">{money(pick.item.price)}</span>
        <span className="pick-v2-restaurant">{location.name}</span>
      </div>
      <small className={pick.fitsBudget ? 'pick-v2-fit' : 'pick-v2-over'}>
        {spinning
          ? 'spinning…'
          : pick.fitsBudget
            ? `${money(pick.remainingAfter)} left after`
            : `${money(Math.abs(pick.remainingAfter))} over today`}
      </small>
    </div>
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
          <a className="primary-button pick-directions-primary" href={googleMapsUrl(location.mapQuery)} target="_blank" rel="noreferrer">Google Maps</a>
          <a className="secondary-button" href={appleMapsUrl(location.mapQuery)} target="_blank" rel="noreferrer">Apple Maps</a>
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

function SlotIcon() {
  return (
    <svg className="pick-slot-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="14" height="15" rx="3" />
      <path d="M8 9h2m2 0h2m-6 4h2m2 0h2M18 10h2v6h-2" />
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
