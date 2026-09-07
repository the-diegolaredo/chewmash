import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { calculateBudgetStats, dailyTargetRemaining } from '../../../src/lib/budget';
import { isSupportedDiningPlanBudget } from '../../../src/lib/diningPlans';
import type { PlanSettings } from '../../../src/lib/types';
import { parseCbordPdfFile } from '../../../src/pdf/cbord';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { latestBalanceSnapshot, localDate, money, spendOnDate } from '../../../src/ui/utils';
import { AccountPage } from './pages/AccountPage';
import { HomePage } from './pages/HomePage';
import { MobileUploadPage } from './pages/MobileUploadPage';
import { downloadBackup, requestPersistentBrowserStorage } from './platform/browser';
import { loadInitialState, stateRepository } from './platform/state';
import { PicksPage } from './PicksPage';
import { useMobileGetSync, type MobileGetSyncModel } from './useMobileGetSync';
import { WebFloatingNav, type WebPrimaryView } from './WebFloatingNav';

type View = WebPrimaryView | 'account';

export function MobileApp() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [view, setView] = useState<View>('home');
  const [error, setError] = useState<string | null>(null);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [planDraft, setPlanDraft] = useState<PlanSettings | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const mobileSync = useMobileGetSync(setState);

  const refresh = useCallback(async () => {
    try {
      const next = await loadInitialState();
      setState(next);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read local app storage.');
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
          const before = await stateRepository.load();
          let after = await stateRepository.mergeTransactions(parsed.transactions);
          const added = Math.max(0, after.transactions.length - before.transactions.length);
          if (parsed.balanceSnapshot) after = await stateRepository.addBalanceSnapshot(parsed.balanceSnapshot);
          messages.push(`${file.name}: ${added} new purchase${added === 1 ? '' : 's'}${parsed.balanceSnapshot ? ` · balance ${money(parsed.balanceSnapshot.balance)}` : ''}`);
          setState(after);
        } catch (reason) {
          messages.push(`${file.name}: ${reason instanceof Error ? reason.message : String(reason)}`);
        }
      }
      setPdfMessage(messages.join('\n'));
      requestPersistentBrowserStorage();
      await refresh();
    } finally {
      setPdfBusy(false);
    }
  }

  async function savePlan() {
    if (!planDraft) return;
    if (!isSupportedDiningPlanBudget(planDraft.startingBudget)) {
      setError('Choose one of the available first-year dining plans.');
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
    const next = await stateRepository.updatePlan(clean);
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
    if (state) downloadBackup(state);
  }

  async function importBackup(file: File) {
    try {
      const next = sanitizeState(JSON.parse(await file.text()));
      const saved = await stateRepository.save(next);
      setState(saved);
      setPlanDraft({ ...saved.plan, awayPeriods: saved.plan.awayPeriods.map(period => ({ ...period })) });
      setError(null);
    } catch {
      setError('That backup could not be read.');
    }
  }

  async function clearDiningData() {
    if (!window.confirm('Clear imported transactions and balance snapshots? Your plan settings will remain.')) return;
    setState(await stateRepository.clearDiningData());
    setPdfMessage(null);
    setView('home');
  }

  async function logOut() {
    if (!window.confirm('Reset chewmash on this iPhone? This removes the local plan and dining data stored by the app. Export a backup first if you want to keep a copy.')) return;
    const reset = await stateRepository.reset();
    setState(reset);
    setPlanDraft({ ...reset.plan, awayPeriods: reset.plan.awayPeriods.map(period => ({ ...period })) });
    setPdfMessage(null);
    setView('home');
  }

  const primaryTab: WebPrimaryView | null = view === 'picks' || view === 'home' || view === 'upload' ? view : null;
  const hasDiningData = Boolean(state && (state.transactions.length || state.balanceSnapshots.length));

  return (
    <main className="app-shell web-app-shell mobile-app-shell">
      <header className="app-header mobile-app-header">
        <button className="brand" type="button" onClick={() => setView('home')}>chewmash</button>
        <div className="web-header-actions">
          <span className="web-beta-badge mobile-beta-badge">ios beta</span>
          {hasDiningData ? (
            <button className="account-link" type="button" onClick={() => setView(view === 'account' ? 'home' : 'account')}>
              {view === 'account' ? 'Done' : 'Account'}
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

      {!state || !stats ? (
        <div className="loading">Opening your private dining data…</div>
      ) : !hasDiningData ? (
        <MobileWelcome
          sync={mobileSync}
          onChoosePdf={() => pdfInput.current?.click()}
          onImportBackup={() => backupInput.current?.click()}
          pdfBusy={pdfBusy}
          pdfMessage={pdfMessage}
        />
      ) : view === 'picks' ? (
        <PicksPage
          today={today}
          remainingToday={dailyTargetRemaining(stats.targetPerCampusDay, spendOnDate(state.transactions, today))}
          hasDiningData={hasDiningData}
          onGoHome={() => setView('home')}
        />
      ) : view === 'home' ? (
        <HomePage state={state} stats={stats} today={today} />
      ) : view === 'upload' ? (
        <MobileUploadPage
          sync={mobileSync}
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
          logOut={logOut}
          native
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

      {hasDiningData ? <WebFloatingNav page={primaryTab} onChange={setView} /> : null}
    </main>
  );
}

function MobileWelcome({ sync, onChoosePdf, onImportBackup, pdfBusy, pdfMessage }: {
  sync: MobileGetSyncModel;
  onChoosePdf: () => void;
  onImportBackup: () => void;
  pdfBusy: boolean;
  pdfMessage: string | null;
}) {
  const synced = Boolean(sync.syncStatus && !sync.syncStatus.error);

  return (
    <section className="mobile-welcome" aria-labelledby="mobile-welcome-title">
      <div className="mobile-welcome-hero">
        <p className="eyebrow">Dining Dollars, made simple</p>
        <h1 id="mobile-welcome-title">Welcome to chewmash</h1>
        <p className="mobile-welcome-tagline">Your everything dining app.</p>
        <p>Connect GET directly inside chewmash. No Chrome extension, ZIP file, or desktop computer is required.</p>
      </div>

      <div className="mobile-setup-progress" aria-label="Connect your Dining Dollars">
        <MobileSetupStep number={1} done={synced} title="Connect to GET">
          <p>Open a secure in-app GET session from chewmash.</p>
          <button className="primary-button mobile-sync-button" type="button" onClick={() => void sync.connect()} disabled={sync.busy || !sync.available}>
            {sync.busy ? 'Opening GET…' : synced ? 'Sync GET again' : 'Connect GET'}
          </button>
          {sync.message ? <div className={sync.syncStatus?.error ? 'setup-message error' : 'setup-message'}>{sync.message}</div> : null}
        </MobileSetupStep>

        <MobileSetupStep number={2} done={synced} title="Sign in with Cal Poly">
          <p>Complete Cal Poly and Duo authentication normally inside the temporary GET browser.</p>
        </MobileSetupStep>

        <MobileSetupStep number={3} done={synced} title="Sync Transaction History">
          <p>Once GET Transaction History loads, chewmash reads only sanitized dining transaction fields and an optional visible balance.</p>
        </MobileSetupStep>

        <MobileSetupStep number={4} done={synced} title="Open your dashboard">
          <p>{synced ? 'Your dining data is ready.' : 'Your dashboard opens automatically after the first successful sync or import.'}</p>
        </MobileSetupStep>
      </div>

      <details className="first-run-other-options mobile-other-options">
        <summary>Other ways to get started</summary>
        <div className="other-options-body">
          <p>You can also import a supported GET/CBORD statement PDF or restore a chewmash backup.</p>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={onChoosePdf} disabled={pdfBusy}>
              {pdfBusy ? 'Reading statement…' : 'Import statement PDF'}
            </button>
            <button className="secondary-button" type="button" onClick={onImportBackup}>Restore backup</button>
          </div>
          {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
        </div>
      </details>

      <div className="mobile-welcome-privacy">
        <strong>Private by default.</strong>
        <span>chewmash never asks for or reads your Cal Poly password, Duo prompt, cookies, session tokens, student ID, card number, or raw GET page HTML.</span>
      </div>
    </section>
  );
}

function MobileSetupStep({ number, done, title, children }: {
  number: number;
  done: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className={done ? 'setup-step mobile-setup-step done' : 'setup-step mobile-setup-step'}>
      <div className="setup-step-marker" aria-hidden="true">{done ? '✓' : number}</div>
      <div className="setup-step-copy">
        <h2>{title}</h2>
        {children}
      </div>
    </article>
  );
}
