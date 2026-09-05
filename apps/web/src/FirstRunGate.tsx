import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { parseCbordPdfFile } from '../../../src/pdf/cbord';
import { sanitizeState, type ChewMashState } from '../../../src/storage/state';
import { migrateLegacyWebState, webStateRepository } from '../../../src/storage/web';
import { money } from '../../../src/ui/utils';
import { useGetConnector } from './useGetConnector';

type GateMode = 'loading' | 'onboarding' | 'complete' | 'app';

export function FirstRunGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<GateMode>('loading');
  const [state, setState] = useState<ChewMashState | null>(null);
  const [syncRequested, setSyncRequested] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  const finishSetup = useCallback((next: ChewMashState) => {
    setState(next);
    if (hasDiningData(next)) setMode('complete');
  }, []);

  const connector = useGetConnector(finishSetup);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await migrateLegacyWebState();
        if (cancelled) return;
        setState(next);
        setMode(hasDiningData(next) ? 'app' : 'onboarding');
      } catch {
        if (!cancelled) setMode('onboarding');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'complete') return;
    const timer = window.setTimeout(() => setMode('app'), 750);
    return () => window.clearTimeout(timer);
  }, [mode]);

  async function startGetSync() {
    setSyncRequested(true);
    await connector.connect();
  }

  async function importPdfs(files: File[]) {
    if (!files.length) return;
    setPdfBusy(true);
    setMessage('Reading your statement locally…');
    const messages: string[] = [];
    try {
      let latest = await webStateRepository.load();
      for (const file of files) {
        try {
          const parsed = await parseCbordPdfFile(file);
          const before = latest;
          latest = await webStateRepository.mergeTransactions(parsed.transactions);
          const added = Math.max(0, latest.transactions.length - before.transactions.length);
          if (parsed.balanceSnapshot) latest = await webStateRepository.addBalanceSnapshot(parsed.balanceSnapshot);
          messages.push(`${file.name}: ${added} new purchase${added === 1 ? '' : 's'}${parsed.balanceSnapshot ? ` · balance ${money(parsed.balanceSnapshot.balance)}` : ''}`);
        } catch (reason) {
          messages.push(`${file.name}: ${reason instanceof Error ? reason.message : String(reason)}`);
        }
      }
      setMessage(messages.join('\n'));
      if (navigator.storage?.persist) void navigator.storage.persist();
      finishSetup(latest);
    } finally {
      setPdfBusy(false);
    }
  }

  async function importBackup(file: File) {
    try {
      const clean = sanitizeState(JSON.parse(await file.text()));
      const saved = await webStateRepository.save(clean);
      setMessage('Backup restored.');
      finishSetup(saved);
    } catch {
      setMessage('That backup could not be read.');
    }
  }

  if (mode === 'app') return <>{children}</>;

  if (mode === 'loading') {
    return <div className="first-run-loading">Opening chewmash…</div>;
  }

  const captured = Boolean(connector.syncStatus);
  const done = Boolean(state && hasDiningData(state));

  return (
    <main className={mode === 'complete' ? 'first-run-shell first-run-complete' : 'first-run-shell'}>
      <section className="first-run-card" aria-labelledby="first-run-title">
        <div className="first-run-heading">
          <h1 id="first-run-title" className="first-run-wordmark">chewmash</h1>
          <p className="first-run-tagline">Your Cal Poly dining tracker!</p>
          <p className="first-run-intro">Connect your Dining Dollars history in a few minutes. Your Cal Poly login stays between you, your browser, and GET.</p>
          <div className="first-run-platform-note" role="note">
            <strong>Works best in Chrome on a computer.</strong>
            <span>The website is mobile-friendly, but automatic GET syncing is not available on mobile yet because mobile Chrome does not support extensions.</span>
          </div>
        </div>

        <div className="setup-progress" aria-label="Get started with chewmash">
          <SetupStep number={1} done={connector.installed} title="Download the chewmash connector">
            {connector.installed ? (
              <p>Connector{connector.version ? ` v${connector.version}` : ''} detected in this browser.</p>
            ) : (
              <>
                <p>The connector is the recommended way to keep your GET purchases in sync.</p>
                <a
                  className="primary-button setup-download"
                  href="./downloads/chewmash-connector-beta.zip"
                  download
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Download connector beta
                </a>
              </>
            )}
          </SetupStep>

          <SetupStep number={2} done={connector.installed} title="Add it to Chrome">
            {connector.installed ? (
              <p>You're installed and ready to connect.</p>
            ) : (
              <div className="setup-instructions">
                <p>Unzip the download, then:</p>
                <ol>
                  <li>Open <code>chrome://extensions</code>.</li>
                  <li>Turn on <strong>Developer mode</strong>.</li>
                  <li>Choose <strong>Load unpacked</strong> and select the unzipped connector folder.</li>
                  <li>Come back here and refresh chewmash.</li>
                </ol>
                <details>
                  <summary>Updating an older chewmash beta?</summary>
                  <p>Replace the files inside the same unpacked extension folder and click Reload in Chrome. Keeping the same folder helps preserve the extension ID and its local storage.</p>
                </details>
              </div>
            )}
          </SetupStep>

          <SetupStep number={3} done={captured || done} title="Sync your GET history">
            <p>{connector.installed ? 'Open GET from chewmash, sign in normally if needed, and let the connector read Transaction History.' : 'This becomes available as soon as the connector is detected.'}</p>
            {connector.installed && !done ? (
              <button className="primary-button" type="button" onClick={() => void startGetSync()} disabled={connector.busy}>
                {connector.busy ? 'Opening GET…' : captured ? 'Sync GET again' : 'Sync GET'}
              </button>
            ) : null}
            {syncRequested && !captured && connector.installed ? <small>GET will open in another tab. When Transaction History loads, chewmash will update automatically.</small> : null}
            {connector.message ? <div className="setup-message">{connector.message}</div> : null}
          </SetupStep>

          <SetupStep number={4} done={done} title="See your dashboard">
            <p>{done ? 'You’re connected. Opening your dashboard…' : 'Once chewmash receives dining data, your dashboard opens automatically.'}</p>
          </SetupStep>
        </div>

        <details className="first-run-other-options">
          <summary>Other ways to get started</summary>
          <div className="other-options-body">
            <p>Using Safari, a managed computer, or prefer not to install an extension? Import a supported GET/CBORD statement PDF instead.</p>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => pdfInput.current?.click()} disabled={pdfBusy}>
                {pdfBusy ? 'Reading statement…' : 'Import statement PDF'}
              </button>
              <button className="secondary-button" type="button" onClick={() => backupInput.current?.click()}>
                Restore backup
              </button>
            </div>
            {message ? <pre className="import-message">{message}</pre> : null}
          </div>
        </details>

        <div className="first-run-privacy">
          <strong>Private by default.</strong> chewmash never asks for your Cal Poly password, cookies, session tokens, student ID, or raw GET page HTML.
        </div>
      </section>

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
    </main>
  );
}

function SetupStep({ number, done, title, children }: {
  number: number;
  done: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className={done ? 'setup-step done' : 'setup-step'}>
      <div className="setup-step-marker" aria-hidden="true">{done ? '✓' : number}</div>
      <div className="setup-step-copy">
        <h2>{title}</h2>
        {children}
      </div>
    </article>
  );
}

function hasDiningData(state: ChewMashState): boolean {
  return state.transactions.length > 0 || state.balanceSnapshots.length > 0;
}
