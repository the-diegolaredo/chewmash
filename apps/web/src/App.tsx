import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateBudgetStats, dailyTargetRemaining } from '../../../src/lib/budget';
import type { PlanSettings } from '../../../src/lib/types';
import { parseCbordPdfFile } from '../../../src/pdf/cbord';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { migrateLegacyWebState, webStateRepository } from '../../../src/storage/web';
import { DailySpendChart, PlaceSpendChart } from '../../../src/ui/charts';
import { FloatingNav, MetricCard, MetricDetailModal, SectionCard } from '../../../src/ui/components';
import { humanDate, latestBalanceSnapshot, localDate, money, mostRecentDataDate, spendOnDate } from '../../../src/ui/utils';

type View = 'home' | 'upload' | 'account';
type MetricDetail = 'average' | 'today' | 'status' | null;

export function App() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [view, setView] = useState<View>('home');
  const [error, setError] = useState<string | null>(null);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [planDraft, setPlanDraft] = useState<PlanSettings | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await migrateLegacyWebState();
      setState(next);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read local browser storage.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (state && !planDraft) {
      setPlanDraft({ ...state.plan, awayPeriods: state.plan.awayPeriods.map(period => ({ ...period })) });
    }
  }, [state, planDraft]);

  const today = localDate();
  const snapshot = useMemo(
    () => state ? latestBalanceSnapshot(state.balanceSnapshots, today) : null,
    [state, today],
  );
  const stats = useMemo(
    () => state ? calculateBudgetStats({ settings: state.plan, transactions: state.transactions, asOf: today, balanceSnapshot: snapshot }) : null,
    [state, today, snapshot],
  );

  async function importPdfs(files: File[]) {
    if (!files.length) return;
    setPdfBusy(true);
    setPdfMessage('Reading statement locally…');
    const messages: string[] = [];
    try {
      for (const file of files) {
        try {
          const parsed = await parseCbordPdfFile(file);
          const before = await webStateRepository.load();
          let after = await webStateRepository.mergeTransactions(parsed.transactions);
          const added = Math.max(0, after.transactions.length - before.transactions.length);
          if (parsed.balanceSnapshot) after = await webStateRepository.addBalanceSnapshot(parsed.balanceSnapshot);
          messages.push(`${file.name}: ${added} new purchase${added === 1 ? '' : 's'}${parsed.balanceSnapshot ? ` · balance ${money(parsed.balanceSnapshot.balance)}` : ''}`);
          setState(after);
        } catch (reason) {
          messages.push(`${file.name}: ${reason instanceof Error ? reason.message : String(reason)}`);
        }
      }
      setPdfMessage(messages.join('\n'));
      if (navigator.storage?.persist) void navigator.storage.persist();
      await refresh();
    } finally {
      setPdfBusy(false);
    }
  }

  async function savePlan() {
    if (!planDraft) return;
    if (!Number.isFinite(planDraft.startingBudget) || planDraft.startingBudget <= 0) {
      setError('Starting budget must be greater than $0.');
      return;
    }
    if (!planDraft.startDate || !planDraft.endDate || planDraft.startDate > planDraft.endDate) {
      setError('Check the plan start and end dates.');
      return;
    }
    const clean: PlanSettings = {
      ...planDraft,
      awayPeriods: planDraft.awayPeriods.filter(period => period.start && period.end && period.start <= period.end),
    };
    const next = await webStateRepository.updatePlan(clean);
    setState(next);
    setPlanDraft({ ...next.plan, awayPeriods: next.plan.awayPeriods.map(period => ({ ...period })) });
    setError(null);
  }

  function updateAway(index: number, key: 'start' | 'end', value: string) {
    if (!planDraft) return;
    const periods = Array.from({ length: Math.max(3, planDraft.awayPeriods.length) }, (_, i) => planDraft.awayPeriods[i] ?? { start: '', end: '' });
    periods[index] = { ...periods[index]!, [key]: value };
    setPlanDraft({ ...planDraft, awayPeriods: periods });
  }

  function exportBackup() {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'chewmash-backup.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
  }

  async function importBackup(file: File) {
    try {
      const next = sanitizeState(JSON.parse(await file.text()));
      const saved = await webStateRepository.save(next);
      setState(saved);
      setPlanDraft({ ...saved.plan, awayPeriods: saved.plan.awayPeriods.map(period => ({ ...period })) });
      setError(null);
    } catch {
      setError('That backup could not be read.');
    }
  }

  async function clearDiningData() {
    if (!window.confirm('Clear imported transactions and balance snapshots? Your plan settings will remain.')) return;
    setState(await webStateRepository.clearDiningData());
    setPdfMessage(null);
  }

  const primaryTab = view === 'home' || view === 'upload' ? view : null;
  const hasDiningData = Boolean(state && (state.transactions.length || state.balanceSnapshots.length));

  return (
    <main className="app-shell web-app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setView('home')}>chewmash</button>
        <div className="web-header-actions">
          <span className="web-beta-badge">web beta</span>
          <button className="account-link" type="button" onClick={() => setView(view === 'account' ? 'home' : 'account')}>
            {view === 'account' ? 'Done' : 'Account'}
          </button>
        </div>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

      {!state || !stats ? (
        <div className="loading">Loading your private dining data…</div>
      ) : view === 'home' && !hasDiningData ? (
        <WelcomePage
          onChoosePdf={() => pdfInput.current?.click()}
          onImportBackup={() => backupInput.current?.click()}
          pdfBusy={pdfBusy}
          pdfMessage={pdfMessage}
        />
      ) : view === 'home' ? (
        <HomePage state={state} stats={stats} today={today} />
      ) : view === 'upload' ? (
        <UploadPage
          onChoosePdf={() => pdfInput.current?.click()}
          onFiles={importPdfs}
          pdfBusy={pdfBusy}
          pdfMessage={pdfMessage}
        />
      ) : (
        <AccountPage
          state={state}
          planDraft={planDraft}
          setPlanDraft={setPlanDraft}
          updateAway={updateAway}
          savePlan={savePlan}
          exportBackup={exportBackup}
          importBackup={() => backupInput.current?.click()}
          clearDiningData={clearDiningData}
        />
      )}

      <input
        ref={pdfInput}
        className="hidden-input"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={event => {
          const files = [...(event.target.files ?? [])];
          if (files.length) void importPdfs(files);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={backupInput}
        className="hidden-input"
        type="file"
        accept="application/json,.json"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void importBackup(file);
          event.currentTarget.value = '';
        }}
      />

      <FloatingNav page={primaryTab} onChange={setView} />
    </main>
  );
}

function WelcomePage({ onChoosePdf, onImportBackup, pdfBusy, pdfMessage }: {
  onChoosePdf: () => void;
  onImportBackup: () => void;
  pdfBusy: boolean;
  pdfMessage: string | null;
}) {
  return (
    <div className="web-welcome">
      <div className="web-welcome-copy">
        <p className="eyebrow">Dining Dollars, without giving up your login</p>
        <h1>Understand your Dining Dollars.</h1>
        <p>Import a Cal Poly GET statement and chewmash builds your spending dashboard locally in this browser.</p>
        <div className="button-row web-welcome-actions">
          <button className="primary-button" type="button" onClick={onChoosePdf} disabled={pdfBusy}>
            {pdfBusy ? 'Reading statement…' : 'Import GET statement'}
          </button>
          <button className="secondary-button" type="button" onClick={onImportBackup}>Import backup</button>
        </div>
        {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
      </div>
      <div className="web-privacy-card">
        <strong>Private by default</strong>
        <p>Your PDF is parsed on your device. chewmash does not ask for your Cal Poly password and this web beta has no dining-data backend.</p>
      </div>
    </div>
  );
}

function HomePage({ state, stats, today }: {
  state: ChewMashState;
  stats: ReturnType<typeof calculateBudgetStats>;
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
          <small className="detail-source">{stats.officialSpent !== null ? 'Budget pace uses your latest official balance snapshot.' : 'Budget pace currently uses itemized purchases.'}</small>
        </MetricDetailModal>
      ) : null}
    </div>
  );
}

function UploadPage({ onChoosePdf, onFiles, pdfBusy, pdfMessage }: {
  onChoosePdf: () => void;
  onFiles: (files: File[]) => Promise<void>;
  pdfBusy: boolean;
  pdfMessage: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="page-stack">
      <div className="page-title-row"><div><p className="eyebrow">Bring in dining data</p><h1>Upload</h1></div></div>
      <SectionCard title="Import statement PDF">
        <div
          className={dragging ? 'drop-zone dragging' : 'drop-zone'}
          role="button"
          tabIndex={0}
          onClick={onChoosePdf}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onChoosePdf(); }}
          onDragEnter={event => { event.preventDefault(); setDragging(true); }}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={event => { event.preventDefault(); setDragging(false); }}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            const files = [...event.dataTransfer.files].filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
            if (files.length) void onFiles(files);
          }}
        >
          <strong>{pdfBusy ? 'Reading statement…' : 'Choose PDF or drop it here'}</strong>
          <span>The PDF is parsed locally in your browser and is not uploaded to chewmash.</span>
        </div>
        {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
      </SectionCard>
      <SectionCard title="Automatic GET sync">
        <p className="section-copy">A normal website cannot inspect another signed-in website such as Cal Poly GET. The web beta therefore uses statement import; automatic GET syncing remains an optional browser-connector feature and never requires chewmash to collect your password.</p>
        <div className="sync-summary">Website path: GET statement → local PDF parser → IndexedDB → dashboard.</div>
      </SectionCard>
    </div>
  );
}

function AccountPage({ state, planDraft, setPlanDraft, updateAway, savePlan, exportBackup, importBackup, clearDiningData }: {
  state: ChewMashState;
  planDraft: PlanSettings | null;
  setPlanDraft: (plan: PlanSettings) => void;
  updateAway: (index: number, key: 'start' | 'end', value: string) => void;
  savePlan: () => Promise<void>;
  exportBackup: () => void;
  importBackup: () => void;
  clearDiningData: () => Promise<void>;
}) {
  if (!planDraft) return null;
  const awaySlots = Array.from({ length: 3 }, (_, index) => planDraft.awayPeriods[index] ?? { start: '', end: '' });
  const transactions = [...state.transactions].sort((left, right) => `${right.date} ${right.time ?? ''}`.localeCompare(`${left.date} ${left.time ?? ''}`));

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><p className="eyebrow">Plan details and privacy controls</p><h1>Account</h1></div></div>
      <SectionCard title="Plan settings">
        <div className="form-grid">
          <label>Starting Dining Dollars<input type="number" min="0" step="0.01" value={planDraft.startingBudget} onChange={event => setPlanDraft({ ...planDraft, startingBudget: Number(event.target.value) })} /></label>
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
