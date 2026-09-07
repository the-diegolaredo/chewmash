import { useState } from 'react';
import { SectionCard } from '../../../../src/ui/components';
import type { MobileGetSyncModel } from '../useMobileGetSync';

export function MobileUploadPage({ sync, onChoosePdf, onFiles, pdfBusy, pdfMessage }: {
  sync: MobileGetSyncModel;
  onChoosePdf: () => void;
  onFiles: (files: File[]) => Promise<void>;
  pdfBusy: boolean;
  pdfMessage: string | null;
}) {
  const [dragging, setDragging] = useState(false);

  const syncLabel = sync.busy ? 'GET open…' : sync.syncStatus?.error ? 'Try GET again' : sync.syncStatus ? 'Sync GET again' : 'Connect GET';
  const syncMeta = sync.busy ? 'Signing in…' : sync.syncStatus?.error ? 'Needs attention' : sync.syncStatus ? 'Ready to refresh' : 'No extension needed';

  return (
    <div className="page-stack mobile-page-stack">
      <div className="page-title-row mobile-page-heading">
        <div><p className="eyebrow">Bring in dining data</p><h1>Upload</h1></div>
      </div>

      <SectionCard title="Connect GET" action={<span className="section-meta">{syncMeta}</span>}>
        <p className="section-copy">
          Open GET securely inside chewmash, sign in with Cal Poly and Duo normally, and let the app read only the dining fields on Transaction History. No Chrome extension or ZIP file is required.
        </p>
        <button className="primary-button mobile-sync-button" type="button" onClick={() => void sync.connect()} disabled={sync.busy || !sync.available}>
          {syncLabel}
        </button>
        {sync.message ? <div className={sync.syncStatus?.error ? 'setup-message error' : 'setup-message'}>{sync.message}</div> : null}
        <div className="mobile-privacy-inline">
          <strong>Your sign-in stays private.</strong>
          <span>chewmash does not read password fields, Duo prompts, cookies, session tokens, student IDs, or raw page HTML.</span>
        </div>
      </SectionCard>

      <SectionCard title="Import statement PDF" action={<span className="section-meta">Fallback</span>}>
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
          <strong>{pdfBusy ? 'Reading statement…' : 'Choose a statement PDF'}</strong>
          <span>The PDF is parsed locally inside chewmash and is not uploaded to a server.</span>
        </div>
        {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
      </SectionCard>
    </div>
  );
}
