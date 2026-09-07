import { SyncUpdatesFab } from './SyncUpdatesFab';

export type WebPrimaryView = 'picks' | 'home' | 'upload';

export function WebFloatingNav({
  page,
  onChange,
}: {
  page: WebPrimaryView | null;
  onChange: (page: WebPrimaryView) => void;
}) {
  return (
    <>
      <nav className="floating-nav web-floating-nav" aria-label="Primary">
        <button className={page === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('home')} type="button" aria-label="Home">
          <span aria-hidden="true" className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5.5 9.5V21h13V9.5" />
            </svg>
          </span>
          <span className="nav-label">Home</span>
        </button>
        <button className={page === 'picks' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('picks')} type="button" aria-label="Picks">
          <span aria-hidden="true" className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3v8" />
              <path d="M4.5 3v4.5A3.5 3.5 0 0 0 8 11h0" />
              <path d="M9.5 3v4.5A3.5 3.5 0 0 1 6 11h0v10" />
              <path d="M16 3v18" />
              <path d="M16 3c2.4 1.4 3.5 3.5 3.5 6.2S18.4 14 16 15" />
            </svg>
          </span>
          <span className="nav-label">Picks</span>
        </button>
        <button className={page === 'upload' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('upload')} type="button" aria-label="Upload">
          <span aria-hidden="true" className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 15v5h16v-5" />
            </svg>
          </span>
          <span className="nav-label">Upload</span>
        </button>
      </nav>
      {page === 'home' ? <SyncUpdatesFab /> : null}
    </>
  );
}
