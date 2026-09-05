export type WebPrimaryView = 'picks' | 'home' | 'upload';

export function WebFloatingNav({
  page,
  onChange,
}: {
  page: WebPrimaryView | null;
  onChange: (page: WebPrimaryView) => void;
}) {
  return (
    <nav className="floating-nav web-floating-nav" aria-label="Primary">
      <button
        className="nav-item nav-item-disabled"
        type="button"
        disabled
        aria-label="Picks — under development"
        title="Picks is under development"
      >
        <span aria-hidden="true" className="nav-lightbulb">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M8.2 14.6A6 6 0 1 1 15.8 14.6C14.9 15.4 14.3 16.5 14.2 18h-4.4c-.1-1.5-.7-2.6-1.6-3.4Z" />
          </svg>
        </span>
        <span>Picks</span>
      </button>
      <button className={page === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('home')} type="button">
        <span aria-hidden="true">⌂</span>
        Home
      </button>
      <button className={page === 'upload' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('upload')} type="button">
        <span aria-hidden="true">↑</span>
        Upload
      </button>
    </nav>
  );
}
