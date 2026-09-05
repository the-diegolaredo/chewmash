import type { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  note,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  note: ReactNode;
  tone?: 'neutral' | 'under' | 'on' | 'over';
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <div className="metric-note">{note}</div>
    </article>
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
