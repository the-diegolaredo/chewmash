import { useCallback, useEffect, useRef, useState } from 'react';
import { dailyTargetRemaining } from '../../../../src/lib/budget';
import type { BudgetStats } from '../../../../src/lib/types';
import type { ChewMashState } from '../../../../src/storage/state';
import { DailySpendChart, PlaceSpendChart } from '../../../../src/ui/charts';
import { MetricCard, MetricDetailModal, SectionCard } from '../../../../src/ui/components';
import { humanDate, money, mostRecentDataDate, spendOnDate } from '../../../../src/ui/utils';

type MetricDetail = 'average' | 'today' | 'status' | null;

export function HomePage({ state, stats, today }: {
  state: ChewMashState;
  stats: BudgetStats;
  today: string;
}) {
  const [detailMetric, setDetailMetric] = useState<MetricDetail>(null);
  const [activeMetricIndex, setActiveMetricIndex] = useState(1);
  const metricStripRef = useRef<HTMLDivElement>(null);
  const spentToday = spendOnDate(state.transactions, today);
  const dollarsLeftToday = dailyTargetRemaining(stats.targetPerCampusDay, spentToday);
  const dataThrough = mostRecentDataDate(state.transactions, state.balanceSnapshots);
  const statusTitle = stats.status === 'under' ? 'Under budget' : stats.status === 'over' ? 'Over budget' : 'On budget';
  const statusNote = stats.status === 'on'
    ? 'Your spending is close to the planned pace.'
    : `${money(Math.abs(stats.paceDelta))} ${stats.status === 'under' ? 'ahead of' : 'beyond'} your planned pace.`;
  const todayNote = dollarsLeftToday >= 0
    ? `${money(spentToday)} spent of ${money(stats.targetPerCampusDay)} target`
    : `${money(Math.abs(dollarsLeftToday))} over today's target`;

  const centerMetric = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const strip = metricStripRef.current;
    const card = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !card) return;
    card.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
    setActiveMetricIndex(index);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => centerMetric(1, 'auto'));
    return () => window.cancelAnimationFrame(frame);
  }, [centerMetric]);

  const onCarouselScroll = useCallback(() => {
    const strip = metricStripRef.current;
    if (!strip) return;
    const stripRect = strip.getBoundingClientRect();
    const viewportCenter = stripRect.left + stripRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(strip.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveMetricIndex(closestIndex);
  }, []);

  return (
    <div className="page-stack home-page">
      <div className="home-heading">
        <p className="eyebrow">Dining Dollars</p>
        <h1>Fall 2026 Dining</h1>
        <p className="subtle">{dataThrough ? `Updated through ${humanDate(String(dataThrough))}` : 'No dining data imported yet'}</p>
      </div>

      <section className="metrics-carousel" aria-label="Dining overview">
        <p className="carousel-hint">Swipe or scroll through your main stats. Tap a card for details.</p>
        <div className="metric-strip" ref={metricStripRef} onScroll={onCarouselScroll}>
          <MetricCard label="Daily average" value={money(stats.averageSpentPerCampusDay)} note={<>Target <strong>{money(stats.targetPerCampusDay)}</strong> per campus day</>} active={activeMetricIndex === 0} onOpen={() => setDetailMetric('average')} />
          <MetricCard label="Dining Dollars left today" value={money(dollarsLeftToday)} note={todayNote} active={activeMetricIndex === 1} onOpen={() => setDetailMetric('today')} />
          <MetricCard label="Budget status" value={statusTitle} note={statusNote} tone={stats.status} active={activeMetricIndex === 2} onOpen={() => setDetailMetric('status')} />
        </div>
        <div className="carousel-dots" aria-label="Carousel pages">
          {['Daily average', 'Dining Dollars left today', 'Budget status'].map((label, index) => (
            <button key={label} type="button" className={activeMetricIndex === index ? 'carousel-dot active' : 'carousel-dot'} aria-label={`Show ${label}`} aria-current={activeMetricIndex === index ? 'true' : undefined} onClick={() => centerMetric(index)} />
          ))}
        </div>
      </section>

      <SectionCard title="Spending by day" action={<span className="section-meta">Select a dot for daily details</span>}>
        <DailySpendChart transactions={state.transactions} settings={state.plan} asOf={today} target={stats.targetPerCampusDay} />
      </SectionCard>
      <SectionCard title="Dining locations"><PlaceSpendChart transactions={state.transactions} /></SectionCard>

      {detailMetric === 'average' ? (
        <MetricDetailModal title="Daily average" value={money(stats.averageSpentPerCampusDay)} onClose={() => setDetailMetric(null)}>
          <p>Your daily average is based on itemized Dining Dollars purchases across elapsed campus days.</p>
          <div className="detail-grid">
            <div><span>Planned daily target</span><strong>{money(stats.targetPerCampusDay)}</strong></div>
            <div><span>Itemized spent so far</span><strong>{money(stats.itemizedSpent)}</strong></div>
            <div><span>Campus days elapsed</span><strong>{stats.elapsedCampusDays}</strong></div>
          </div>
        </MetricDetailModal>
      ) : null}
      {detailMetric === 'today' ? (
        <MetricDetailModal title="Dining Dollars left today" value={money(dollarsLeftToday)} onClose={() => setDetailMetric(null)}>
          <p>This is today's planned Dining Dollars target minus the itemized purchases you've made today.</p>
          <div className="detail-grid">
            <div><span>Daily target</span><strong>{money(stats.targetPerCampusDay)}</strong></div>
            <div><span>Spent today</span><strong>{money(spentToday)}</strong></div>
            <div><span>{dollarsLeftToday >= 0 ? 'Left today' : 'Over target'}</span><strong>{money(dollarsLeftToday >= 0 ? dollarsLeftToday : Math.abs(dollarsLeftToday))}</strong></div>
          </div>
          <small className="detail-source">Only purchases dated {humanDate(today)} are subtracted from today's target.</small>
        </MetricDetailModal>
      ) : null}
      {detailMetric === 'status' ? (
        <MetricDetailModal title="Budget status" value={statusTitle} tone={stats.status} onClose={() => setDetailMetric(null)}>
          <p>{statusNote}</p>
          <div className="detail-grid">
            <div><span>Expected spend by now</span><strong>{money(stats.expectedSpend)}</strong></div>
            <div><span>Spend used for pace</span><strong>{money(stats.paceSpend)}</strong></div>
            <div><span>{stats.status === 'under' ? 'Ahead by' : stats.status === 'over' ? 'Over by' : 'Difference'}</span><strong>{money(Math.abs(stats.paceDelta))}</strong></div>
          </div>
          <small className="detail-source">Budget pace uses itemized purchases through the same date.</small>
        </MetricDetailModal>
      ) : null}
    </div>
  );
}
