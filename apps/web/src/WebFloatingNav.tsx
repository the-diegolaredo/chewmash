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
      <button className={page === 'picks' ? 'nav-item active' : 'nav-item'} onClick={() => onChange('picks')} type="button">
        <span aria-hidden="true">✦</span>
        Picks
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
