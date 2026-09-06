import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateBudgetStats, dailyTargetRemaining } from '../../../src/lib/budget';
import { isSupportedDiningPlanBudget } from '../../../src/lib/diningPlans';
import type { PlanSettings } from '../../../src/lib/types';
import { parseCbordPdfFile } from '../../../src/pdf/cbord';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { migrateLegacyWebState, webStateRepository } from '../../../src/storage/web';
import { latestBalanceSnapshot, localDate, money, spendOnDate } from '../../../src/ui/utils';
import { ConnectorSummary } from './components/ConnectorSummary';
import { AccountPage } from './pages/AccountPage';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import {
  clearLegacyBrowserState,
  confirmClearDiningData,
  confirmLogOut,
  downloadBackup,
  reloadWebApp,
  requestPersistentBrowserStorage,
} from './platform/browser';
import { PicksPage } from './PicksPage';
import { useGetConnector, type GetConnectorModel } from './useGetConnector';
import { WebFloatingNav, type WebPrimaryView } from './WebFloatingNav';

type View = WebPrimaryView | 'account';

export function App() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [view, setView] = useState<View>('home');
  const [error, setError] = useState<string | null>(null);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [planDraft, setPlanDraft] = useState<PlanSettings | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const connector = useGetConnector(setState);

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
    if (state) downloadBackup(state);
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
    if (!confirmClearDiningData()) return;
    setState(await webStateRepository.clearDiningData());
    setPdfMessage(null);
  }

  async function logOut() {
    if (!confirmLogOut()) return;
    clearLegacyBrowserState();
    await webStateRepository.reset();
    reloadWebApp();
  }

  const primaryTab: WebPrimaryView | null = view === 'picks' || view === 'home' || view === 'upload' ? view : null;
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
          connector={connector}
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
          connector={connector}
          onGoHome={() => setView('home')}
        />
      ) : view === 'home' ? (
        <HomePage state={state} stats={stats} today={today} />
      ) : view === 'upload' ? (
        <UploadPage
          connector={connector}
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

      <WebFloatingNav page={primaryTab} onChange={setView} />
    </main>
  );
}

function WelcomePage({ connector, onChoosePdf, onImportBackup, pdfBusy, pdfMessage }: {
  connector: GetConnectorModel;
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
        <p>Connect the optional chewmash browser connector to read your authenticated GET Transaction History locally, or import a statement PDF without installing anything.</p>
        <div className="button-row web-welcome-actions">
          <button className="primary-button" type="button" onClick={() => void connector.connect()} disabled={connector.checking || connector.busy}>
            {connector.checking ? 'Checking connector…' : connector.busy ? 'Opening GET…' : connector.installed ? 'Sync GET' : 'Connect GET'}
          </button>
          <button className="secondary-button" type="button" onClick={onChoosePdf} disabled={pdfBusy}>
            {pdfBusy ? 'Reading statement…' : 'Import statement PDF'}
          </button>
          <button className="secondary-button" type="button" onClick={onImportBackup}>Import backup</button>
        </div>
        <ConnectorSummary connector={connector} />
        {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
      </div>
      <div className="web-privacy-card">
        <strong>Private by default</strong>
        <p>The connector sends only parsed dining fields from extension-local storage into this website on your device. chewmash never asks for your Cal Poly password, cookies, session tokens, student ID, or raw GET page HTML.</p>
      </div>
    </div>
  );
}
