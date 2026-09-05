import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DineOnCampusMenuItem } from '../../../src/menu/dineoncampus';
import { mealPeriodForHour, mealPeriodLabel, rankMenuPicks, surprisePool, type RankedPick } from '../../../src/menu/picks';
import { MetricDetailModal, SectionCard } from '../../../src/ui/components';
import { money } from '../../../src/ui/utils';
import { loadWebMenu, type WebMenuResult } from './menu';
import type { GetConnectorModel } from './useGetConnector';

export function PicksPage({
  today,
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
  const [menu, setMenu] = useState<WebMenuResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RankedPick | null>(null);
  const [surpriseResult, setSurpriseResult] = useState<RankedPick | null>(null);
  const [surprisePreview, setSurprisePreview] = useState<RankedPick | null>(null);
  const [spinning, setSpinning] = useState(false);

  const mealPeriod = mealPeriodForHour(new Date().getHours());
  const mealLabel = mealPeriodLabel(mealPeriod);

  const load = useCallback(async (force = false) => {
    if (!hasDiningData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadWebMenu(
        today,
        connector.installed ? connector.fetchMenu : undefined,
        force,
      );
      setMenu(result);
    } catch (reason) {
      setMenu(null);
      setError(reason instanceof Error ? reason.message : 'Could not load today’s Dine On Campus menu.');
    } finally {
      setLoading(false);
    }
  }, [connector.fetchMenu, connector.installed, hasDiningData, today]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const ranked = useMemo(
    () => rankMenuPicks(menu?.items ?? [], { remainingToday, mealPeriod, limit: 12 }),
    [mealPeriod, menu?.items, remainingToday],
  );
  const allRanked = useMemo(
    () => rankMenuPicks(menu?.items ?? [], { remainingToday, mealPeriod, limit: 24 }),
    [mealPeriod, menu?.items, remainingToday],
  );
  const pricedCount = useMemo(
    () => (menu?.items ?? []).filter(item => item.price !== null).length,
    [menu?.items],
  );

  const surprise = useCallback(async () => {
    const pool = surprisePool(allRanked, mealPeriod);
    if (!pool.length || spinning) return;
    setSpinning(true);
    setSurpriseResult(null);
    for (let index = 0; index < 11; index += 1) {
      setSurprisePreview(pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? null);
      await new Promise(resolve => window.setTimeout(resolve, 65 + index * 10));
    }
    const result = pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? null;
    setSurprisePreview(result);
    setSurpriseResult(result);
    setSpinning(false);
  }, [allRanked, mealPeriod, spinning]);

  if (!hasDiningData) {
    return (
      <div className="page-stack picks-page">
        <div className="picks-heading">
          <p className="eyebrow">Picks</p>
          <h1>Meals that fit your day.</h1>
          <p className="subtle">Connect dining data first so chewmash knows how much you have left to spend today.</p>
        </div>
        <SectionCard title="Finish setup first">
          <p className="section-copy">Picks uses your live daily Dining Dollars target to rank menu ideas. Connect GET or import a statement, then come back here.</p>
          <button className="primary-button" type="button" onClick={onGoHome}>Go to setup</button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack picks-page">
      <div className="picks-heading">
        <p className="eyebrow">Picks</p>
        <h1>What sounds good?</h1>
      </div>

      <div className="picks-summary-row">
        <div className="picks-summary-card">
          <span>Left today</span>
          <strong>{money(remainingToday)}</strong>
        </div>
        <div className="picks-summary-card picks-now-card">
          <span>Right now</span>
          <strong>{mealLabel}</strong>
        </div>
      </div>

      <section className="surprise-panel" aria-label="Surprise me">
        <div>
          <p className="eyebrow">Can’t decide?</p>
          <h2>Let chewmash pick.</h2>
          <p>{surprisePreview ? `${surprisePreview.item.name} · ${surprisePreview.item.location}` : 'Shuffle the best-fitting menu options and land on one.'}</p>
        </div>
        <button className="surprise-button" type="button" disabled={loading || spinning || !allRanked.length} onClick={() => void surprise()}>
          {!surpriseResult && !spinning ? <span aria-hidden="true">🎲</span> : null}
          {spinning ? 'Shuffling…' : surpriseResult ? 'Spin again' : 'Surprise me'}
        </button>
        <div className={spinning ? 'surprise-slot spinning' : 'surprise-slot'} aria-live="polite">
          <span>{surprisePreview?.item.location ?? 'Picks'}</span>
          <strong>{surprisePreview?.item.name ?? 'Your random pick appears here'}</strong>
          {surprisePreview ? <small>{priceLabel(surprisePreview.item)} · {nutritionLabel(surprisePreview.item)}</small> : null}
        </div>
        {surpriseResult ? (
          <button className="secondary-button surprise-details" type="button" onClick={() => setSelected(surpriseResult)}>View this pick</button>
        ) : null}
      </section>

      {pricedCount === 0 && menu?.items.length ? (
        <div className="picks-note">
          Dine On Campus is not publishing item prices in the menu data chewmash received, so these picks are ranked by meal timing and menu relevance. Price-aware ranking turns on automatically whenever a published price is available.
        </div>
      ) : null}

      <SectionCard
        title="Today’s picks"
        action={menu ? <span className="section-meta">{menu.items.length} menu items checked</span> : undefined}
      >
        {loading ? (
          <div className="picks-loading">Checking today’s Cal Poly menus…</div>
        ) : error ? (
          <div className="picks-error">
            <p>{error}</p>
            <button className="secondary-button" type="button" onClick={() => void load(true)}>Try again</button>
          </div>
        ) : ranked.length ? (
          <div className="picks-grid">
            {ranked.map(pick => (
              <PickCard key={`${pick.item.id}-${pick.item.periodName}-${pick.item.location}`} pick={pick} onOpen={() => setSelected(pick)} />
            ))}
          </div>
        ) : (
          <div className="picks-empty">No menu picks are available for today yet. Try refreshing a little later.</div>
        )}
        {menu ? (
          <div className="picks-source-row">
            <span>Menus: Dine On Campus · {sourceLabel(menu.source)} · {new Date(menu.fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            <button type="button" onClick={() => void load(true)}>Refresh menus</button>
          </div>
        ) : null}
      </SectionCard>

      {selected ? (
        <MetricDetailModal
          title={selected.item.name}
          value={selected.item.price !== null ? money(selected.item.price) : selected.item.location}
          onClose={() => setSelected(null)}
        >
          <p>{selected.item.description || selected.why}</p>
          <div className="detail-grid picks-detail-grid">
            <div><span>Location</span><strong>{selected.item.location}</strong></div>
            <div><span>Meal period</span><strong>{mealPeriodLabel(selected.item.period)}</strong></div>
            <div><span>Price</span><strong>{selected.item.price !== null ? money(selected.item.price) : 'Not listed'}</strong></div>
          </div>
          <div className="picks-detail-list">
            {selected.item.station ? <span><strong>Station:</strong> {selected.item.station}</span> : null}
            {selected.item.portion ? <span><strong>Portion:</strong> {selected.item.portion}</span> : null}
            {selected.item.calories !== null ? <span><strong>Calories:</strong> {Math.round(selected.item.calories)}</span> : null}
            {selected.remainingAfter !== null ? <span><strong>After this:</strong> {money(selected.remainingAfter)} left today</span> : null}
            {selected.item.filters.length ? <span><strong>Menu tags:</strong> {selected.item.filters.slice(0, 5).join(', ')}</span> : null}
          </div>
          <small className="detail-source">Menu information comes from Dine On Campus. chewmash only displays prices, nutrition, and portions when the source publishes them.</small>
        </MetricDetailModal>
      ) : null}
    </div>
  );
}

function PickCard({ pick, onOpen }: { pick: RankedPick; onOpen: () => void }) {
  return (
    <button className="pick-card" type="button" onClick={onOpen}>
      <div className="pick-card-topline">
        <span className="pick-location">{pick.item.location}</span>
        {pick.fitsBudget === true ? <span className="pick-fit-badge">Fits today</span> : pick.fitsBudget === false ? <span className="pick-over-badge">Over target</span> : null}
      </div>
      <strong className="pick-name">{pick.item.name}</strong>
      <div className="pick-price-row">
        <span className="pick-price">{pick.item.price !== null ? money(pick.item.price) : 'Price not listed'}</span>
        <span>{nutritionLabel(pick.item)}</span>
      </div>
      <p>{pick.why}</p>
      {pick.item.station ? <small>{pick.item.station} · {mealPeriodLabel(pick.item.period)}</small> : <small>{mealPeriodLabel(pick.item.period)}</small>}
    </button>
  );
}

function priceLabel(item: DineOnCampusMenuItem): string {
  return item.price !== null ? money(item.price) : 'Price not listed';
}

function nutritionLabel(item: DineOnCampusMenuItem): string {
  const values: string[] = [];
  if (item.calories !== null) values.push(`${Math.round(item.calories)} cal`);
  if (item.portion) values.push(item.portion);
  return values.join(' · ') || 'Menu details';
}

function sourceLabel(source: WebMenuResult['source']): string {
  if (source === 'connector') return 'via connector';
  if (source === 'cache') return 'cached on this device';
  return 'live';
}
