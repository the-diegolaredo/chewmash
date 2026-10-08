import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { calculateBudgetStats, dailyTargetRemaining } from '../../../src/lib/budget';
import { isSupportedDiningPlanBudget } from '../../../src/lib/diningPlans';
import type { PlanSettings } from '../../../src/lib/types';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { latestBalanceSnapshot, localDate, spendOnDate } from '../../../src/ui/utils';
import { DiningPlanChoice } from './components/DiningPlanChoice';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { HomePage } from './pages/HomePage';
import { MobileUploadPage } from './pages/MobileUploadPage';
import { downloadBackup } from './platform/browser';
import { setNativeMobileTheme } from './platform/native';
import { loadInitialState, stateRepository } from './platform/state';
import { PicksPage } from './PicksPage';
import { SessionWelcome } from './SessionWelcome';
import type { GetConnectorModel } from './useGetConnector';
import { useMobileGetSync, type MobileGetSyncModel } from './useMobileGetSync';
import { WebFloatingNav, type WebPrimaryView } from './WebFloatingNav';

type View = WebPrimaryView | 'account' | 'about';
type MobileTheme = 'light' | 'dark';

const MOBILE_THEME_KEY = 'chewmash:mobile-theme:v1';

function initialMobileTheme(): MobileTheme {
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem(MOBILE_THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function MobileApp() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [view, setView] = useState<View>('home');
  const [error, setError] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<PlanSettings | null>(null);
  const [theme, setTheme] = useState<MobileTheme>(initialMobileTheme);
  const backupInput = useRef<HTMLInputElement>(null);
  const mobileSync = useMobileGetSync(setState);

  const picksConnector = useMemo<GetConnectorModel>(() => ({
    installed: true,
    checking: false,
    busy: mobileSync.busy,
    version: 'ios',
    message: mobileSync.message,
    syncStatus: mobileSync.syncStatus,
    syncHistory: mobileSync.syncStatus ? [mobileSync.syncStatus] : [],
    connect: mobileSync.connect,
    fetchMenu: async () => null,
  }), [mobileSync.busy, mobileSync.connect, mobileSync.message, mobileSync.syncStatus]);

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

  useEffect(() => {
    localStorage.setItem(MOBILE_THEME_KEY, theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle('mobile-theme-dark', theme === 'dark');
    document.body.classList.toggle('mobile-theme-dark', theme === 'dark');
    void setNativeMobileTheme(theme).catch(() => undefined);

    return () => {
      document.documentElement.classList.remove('mobile-theme-dark');
      document.body.classList.remove('mobile-theme-dark');
    };
  }, [theme]);

  const today = localDate();
  const snapshot = useMemo(
    () => state ? latestBalanceSnapshot(state.balanceSnapshots, today) : null,
    [state, today],
  );
  const stats = useMemo(
    () => state ? calculateBudgetStats({ settings: state.plan, transactions: state.transactions, asOf: today, balanceSnapshot: snapshot }) : null,
    [state, today, snapshot],
  );

  async function chooseDiningPlan(startingBudget: number) {
    if (!state) return;
    const next = await stateRepository.updatePlan({ ...state.plan, startingBudget });
    setState(next);
    setPlanDraft({ ...next.plan, awayPeriods: next.plan.awayPeriods.map(period => ({ ...period })) });
    setError(null);
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
    setView('home');
  }

  async function logOut() {
    if (!window.confirm('Reset chewmash on this iPhone? This removes the local plan and dining data stored by the app. Export a backup first if you want to keep a copy.')) return;
    const reset = await stateRepository.reset();
    setState(reset);
    setPlanDraft({ ...reset.plan, awayPeriods: reset.plan.awayPeriods.map(period => ({ ...period })) });
    setView('home');
  }

  const primaryTab: WebPrimaryView | null = view === 'picks' || view === 'home' || view === 'upload' ? view : null;
  const hasDiningData = Boolean(state && (state.transactions.length || state.balanceSnapshots.length));
  const planChosen = Boolean(state && (state.updatedAt !== null || hasDiningData));

  return (
    <main className={theme === 'dark' ? 'app-shell web-app-shell mobile-app-shell mobile-theme-dark' : 'app-shell web-app-shell mobile-app-shell'}>
      <header className="app-header mobile-app-header">
        <button className="brand" type="button" aria-label={view === 'about' ? 'Back to Home' : 'About chewmash and its land acknowledgment'} onClick={() => setView(view === 'about' ? 'home' : 'about')}>chewmash</button>
        <div className="web-header-actions mobile-header-actions">
          <span className="web-beta-badge mobile-beta-badge">ios beta</span>
          <button
            className="mobile-header-icon-button mobile-theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>
          {hasDiningData ? (
            <button
              className={view === 'account' ? 'mobile-header-icon-button mobile-account-button active' : 'mobile-header-icon-button mobile-account-button'}
              type="button"
              aria-label={view === 'account' ? 'Close Account' : 'Open Account'}
              aria-pressed={view === 'account'}
              onClick={() => setView(view === 'account' ? 'home' : 'account')}
            >
              <ProfileIcon />
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="notice error">{error}</div> : null}

      {!state || !stats ? (
        <div className="loading">Opening your private dining data…</div>
      ) : view === 'about' ? (
        <AboutPage />
      ) : !hasDiningData ? (
        <MobileWelcome
          sync={mobileSync}
          planBudget={planChosen ? state.plan.startingBudget : null}
          onChoosePlan={startingBudget => void chooseDiningPlan(startingBudget)}
          onImportBackup={() => backupInput.current?.click()}
        />
      ) : view === 'picks' ? (
        <PicksPage
          today={today}
          remainingToday={dailyTargetRemaining(stats.targetPerCampusDay, spendOnDate(state.transactions, today))}
          hasDiningData={hasDiningData}
          connector={picksConnector}
          onGoHome={() => setView('home')}
        />
      ) : view === 'home' ? (
        <HomePage state={state} stats={stats} today={today} mobileMode />
      ) : view === 'upload' ? (
        <MobileUploadPage sync={mobileSync} />
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
      {hasDiningData ? <SessionWelcome><></></SessionWelcome> : null}
    </main>
  );
}

function MobileWelcome({ sync, planBudget, onChoosePlan, onImportBackup }: {
  sync: MobileGetSyncModel;
  planBudget: number | null;
  onChoosePlan: (startingBudget: number) => void;
  onImportBackup: () => void;
}) {
  const synced = Boolean(sync.syncStatus && !sync.syncStatus.error);
  const planChosen = planBudget !== null;

  return (
    <section className="mobile-welcome" aria-labelledby="mobile-welcome-title">
      <div className="mobile-welcome-hero">
        <p className="eyebrow">Dining Dollars, made simple</p>
        <h1 id="mobile-welcome-title">Welcome to chewmash</h1>
        <p className="mobile-welcome-tagline">Your everything dining app.</p>
      </div>

      <div className="mobile-setup-progress" aria-label="Connect your Dining Dollars">
        <MobileSetupStep number={1} done={planChosen} title="Choose your dining plan">
          <DiningPlanChoice value={planBudget} onChange={onChoosePlan} compact showIntro={false} />
        </MobileSetupStep>

        <MobileSetupStep number={2} done={synced} title="Connect to GET">
          <p>Open a secure in-app GET session from chewmash.</p>
          <button className="primary-button mobile-sync-button" type="button" onClick={() => void sync.connect()} disabled={sync.busy || !sync.available || !planChosen}>
            {sync.busy ? 'Opening GET…' : synced ? 'Sync GET again' : 'Connect GET'}
          </button>
          {sync.message ? <div className={sync.syncStatus?.error ? 'setup-message error' : 'setup-message'}>{sync.message}</div> : null}
        </MobileSetupStep>

        <MobileSetupStep number={3} done={synced} title="Sign in with Cal Poly">
          <p>Complete Cal Poly and Duo authentication normally inside the temporary GET browser.</p>
        </MobileSetupStep>

        <MobileSetupStep number={4} done={synced} title="Sync Transaction History">
          <p>Once GET Transaction History loads, chewmash reads only sanitized dining transaction fields and an optional visible balance.</p>
        </MobileSetupStep>

        <MobileSetupStep number={5} done={synced} title="Open your dashboard">
          <p>{synced ? 'Your dining data is ready.' : 'Your dashboard opens automatically after the first successful sync.'}</p>
        </MobileSetupStep>
      </div>

      <details className="first-run-other-options mobile-other-options">
        <summary>Restore an existing chewmash backup</summary>
        <div className="other-options-body">
          <p>If you already have a chewmash backup, you can restore it here. Your saved dining plan and dining data will come with it.</p>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={onImportBackup}>Restore backup</button>
          </div>
        </div>
      </details>

      <div className="mobile-welcome-privacy">
        <span><strong>chewmash</strong> never asks for or reads your Cal Poly password</span>
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


function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.7" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15.2A8.3 8.3 0 0 1 8.8 4a8.4 8.4 0 1 0 11.2 11.2Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
    </svg>
  );
}
