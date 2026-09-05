import { useEffect, type ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  note,
  tone = 'neutral',
  onOpen,
}: {
  label: string;
  value: string;
  note: ReactNode;
  tone?: 'neutral' | 'under' | 'on' | 'over';
  onOpen?: () => void;
}) {
  return (
    <button
      className={`metric-card metric-${tone}`}
      type="button"
      onClick={onOpen}
      aria-label={`${label}: ${value}. Open details.`}
    >
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
      <span className="metric-more">View details <span aria-hidden="true">→</span></span>
    </button>
  );
}

export function MetricDetailModal({
  title,
  value,
  tone = 'neutral',
  onClose,
  children,
}: {
  title: string;
  value: string;
  tone?: 'neutral' | 'under' | 'on' | 'over';
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="metric-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`metric-modal metric-modal-${tone}`} role="dialog" aria-modal="true" aria-labelledby="metric-modal-title">
        <button className="metric-modal-close" type="button" onClick={onClose} aria-label="Close details">×</button>
        <span className="metric-modal-kicker">Dining detail</span>
        <h2 id="metric-modal-title">{title}</h2>
        <strong className="metric-modal-value">{value}</strong>
        <div className="metric-modal-body">{children}</div>
      </section>
    </div>
  );
}

export function SectionCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FloatingNav({
  page,
  onChange,
}: {
  page: 'home' | 'upload' | null;
  onChange: (page: 'home' | 'upload') => void;
}) {
  return (
    <nav className="floating-nav" aria-label="Primary">
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
