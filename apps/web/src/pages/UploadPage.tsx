import { useState } from 'react';
import { SectionCard } from '../../../../src/ui/components';
import { ConnectorSummary } from '../components/ConnectorSummary';
import type { GetConnectorModel } from '../useGetConnector';

export function UploadPage({ connector, onChoosePdf, onFiles, pdfBusy, pdfMessage }: {
  connector: GetConnectorModel;
  onChoosePdf: () => void;
  onFiles: (files: File[]) => Promise<void>;
  pdfBusy: boolean;
  pdfMessage: string | null;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><p className="eyebrow">Bring in dining data</p><h1>Upload</h1></div></div>

      <SectionCard title="Connect GET" action={<span className="section-meta">{connector.checking ? 'Checking…' : connector.installed ? 'Connector ready' : 'Extension needed'}</span>}>
        <p className="section-copy">Recommended: install the chewmash connector once, then use this button whenever you want fresh GET transactions. You sign into Cal Poly normally; the connector only passes parsed dining fields to this website.</p>
        <button className="primary-button" type="button" onClick={() => void connector.connect()} disabled={connector.checking || connector.busy}>
          {connector.checking ? 'Checking connector…' : connector.busy ? 'Opening GET…' : connector.installed ? 'Sync GET' : 'Connect GET'}
        </button>
        <ConnectorSummary connector={connector} />
      </SectionCard>

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
          <span>Fallback path: the PDF is parsed locally in your browser and is not uploaded to chewmash.</span>
        </div>
        {pdfMessage ? <pre className="import-message">{pdfMessage}</pre> : null}
      </SectionCard>
    </div>
  );
}
