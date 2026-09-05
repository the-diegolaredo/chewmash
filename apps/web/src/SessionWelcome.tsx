import { type ReactNode, useEffect, useMemo, useState } from 'react';

export function SessionWelcome({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  return (
    <>
      {children}
      {visible ? (
        <button
          className="session-welcome-overlay"
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close welcome message"
        >
          <span className="session-welcome-card">
            <span className="session-welcome-brand">chewmash</span>
            <strong className="session-welcome-greeting">{greeting}</strong>
          </span>
        </button>
      ) : null}
    </>
  );
}

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}
