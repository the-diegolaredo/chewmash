import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBudgetStats } from '../../../src/lib/budget';
import type { DiningTransaction } from '../../../src/lib/types';
import type { ChewMashState } from '../../../src/storage/state';
import { webStateRepository } from '../../../src/storage/web';
import { humanDate, latestBalanceSnapshot, localDate, money, spendOnDate } from '../../../src/ui/utils';
import { GET_SYNC_HISTORY_EVENT, readGetSyncHistory } from './useGetConnector';

const READ_NOTIFICATIONS_KEY = 'chewmash:read-notifications:v1';
const DAY_MS = 24 * 60 * 60 * 1_000;
const MAX_READ_IDS = 200;

type NotificationKind = 'order' | 'budget' | 'sync';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
}

export function SyncUpdatesFab() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [state, setState] = useState<ChewMashState | null>(null);
  const [syncHistory, setSyncHistory] = useState(() => readGetSyncHistory());
  const [readIds, setReadIds] = useState<Set<string>>(() => readNotificationIds());

  const refreshDiningState = useCallback(async () => {
    try {
      setState(await webStateRepository.load());
    } catch {
      // The notification center is optional and should never block the dashboard.
    }
  }, []);

  useEffect(() => {
    void refreshDiningState();

    const refreshSyncHistory = () => {
      setSyncHistory(readGetSyncHistory());
      void refreshDiningState();
    };
    const refreshStoredState = () => {
      setSyncHistory(readGetSyncHistory());
      setReadIds(readNotificationIds());
      void refreshDiningState();
    };

    window.addEventListener(GET_SYNC_HISTORY_EVENT, refreshSyncHistory);
    window.addEventListener('storage', refreshStoredState);
    return () => {
      window.removeEventListener(GET_SYNC_HISTORY_EVENT, refreshSyncHistory);
      window.removeEventListener('storage', refreshStoredState);
    };
  }, [refreshDiningState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      void refreshDiningState();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshDiningState]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const today = localDate();
  const dailyTarget = useMemo(() => {
    if (!state) return 0;
    const snapshot = latestBalanceSnapshot(state.balanceSnapshots, today);
    return calculateBudgetStats({
      settings: state.plan,
      transactions: state.transactions,
      asOf: today,
      balanceSnapshot: snapshot,
    }).targetPerCampusDay;
  }, [state, today]);

  const notifications = useMemo(
    () => state ? buildNotifications({ state, today, dailyTarget, syncHistory, now }) : [],
    [state, today, dailyTarget, syncHistory, now],
  );
  const unread = notifications.filter(notification => !readIds.has(notification.id));
  const hasUnread = unread.length > 0;

  function markRead(id: string) {
    setReadIds(current => {
      const next = new Set(current);
      next.add(id);
      writeNotificationIds(next);
      return next;
    });
  }

  return (
    <aside className={open ? 'sync-updates-fab open' : 'sync-updates-fab'} aria-label="ChewMash notifications">
      <div id="sync-updates-panel" className="sync-updates-stack" aria-hidden={!open} aria-live="polite">
        {unread.length ? unread.map(notification => (
          <NotificationCard key={notification.id} notification={notification} onRead={() => markRead(notification.id)} />
        )) : (
          <div className="sync-update-card empty all-caught-up">
            <div className="sync-update-card-copy">
              <strong>You're all caught up</strong>
              <span>New orders, daily budget alerts, and GET sync reminders will appear here.</span>
            </div>
          </div>
        )}
      </div>

      <button
        className={hasUnread ? 'sync-updates-button has-unread' : 'sync-updates-button all-read'}
        type="button"
        aria-label={open ? 'Hide notifications' : `Show notifications${hasUnread ? `, ${unread.length} unread` : ''}`}
        aria-expanded={open}
        aria-controls="sync-updates-panel"
        onClick={() => {
          if (!open) void refreshDiningState();
          setOpen(current => !current);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      </button>
    </aside>
  );
}

function NotificationCard({
  notification,
  onRead,
}: {
  notification: NotificationItem;
  onRead: () => void;
}) {
  return (
    <div className={`sync-update-card notification-${notification.kind}`}>
      <button className="notification-read-button" type="button" onClick={onRead} aria-label={`Mark “${notification.title}” as read`} title="Mark as read">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
      <div className="sync-update-card-copy">
        <strong>{notification.title}</strong>
        <span>{notification.detail}</span>
      </div>
    </div>
  );
}

function buildNotifications({
  state,
  today,
  dailyTarget,
  syncHistory,
  now,
}: {
  state: ChewMashState;
  today: string;
  dailyTarget: number;
  syncHistory: ReturnType<typeof readGetSyncHistory>;
  now: number;
}): NotificationItem[] {
  const notifications: NotificationItem[] = [];
  const spentToday = spendOnDate(state.transactions, today);

  if (dailyTarget > 0 && spentToday > dailyTarget + 0.005) {
    notifications.push({
      id: `budget-over:${today}`,
      kind: 'budget',
      title: 'Over today’s budget',
      detail: `You’ve spent ${money(spentToday)} today — ${money(spentToday - dailyTarget)} over your ${money(dailyTarget)} target.`,
    });
  }

  const latestSync = syncHistory[0];
  if (latestSync) {
    const capturedAt = new Date(latestSync.capturedAt).getTime();
    if (Number.isFinite(capturedAt) && now - capturedAt >= DAY_MS) {
      notifications.push({
        id: `sync-stale:${latestSync.capturedAt}`,
        kind: 'sync',
        title: 'GET sync is getting stale',
        detail: `Your last GET sync was ${formatElapsed(now - capturedAt)} ago. Sync again to keep ChewMash current.`,
      });
    }
  }

  const recentOrders = [...state.transactions]
    .sort(compareTransactionsNewestFirst)
    .slice(0, 3);
  const duplicateCounts = new Map<string, number>();

  for (const transaction of recentOrders) {
    const baseId = [transaction.date, transaction.time ?? '', transaction.location, transaction.amount, transaction.source ?? ''].join('|');
    const occurrence = (duplicateCounts.get(baseId) ?? 0) + 1;
    duplicateCounts.set(baseId, occurrence);
    notifications.push({
      id: `order:${baseId}:${occurrence}`,
      kind: 'order',
      title: `Recent order · ${transaction.location || 'Dining purchase'}`,
      detail: `${money(transaction.amount)} · ${humanDate(String(transaction.date))}${transaction.time ? ` at ${transaction.time}` : ''}`,
    });
  }

  return notifications;
}

function compareTransactionsNewestFirst(left: DiningTransaction, right: DiningTransaction): number {
  const dateCompare = String(right.date).localeCompare(String(left.date));
  if (dateCompare !== 0) return dateCompare;
  return String(right.time ?? '').localeCompare(String(left.time ?? ''));
}

function formatElapsed(milliseconds: number): string {
  const hours = Math.max(1, Math.floor(milliseconds / (60 * 60 * 1_000)));
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function readNotificationIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function writeNotificationIds(ids: Set<string>) {
  if (typeof localStorage === 'undefined') return;
  try {
    const values = [...ids].slice(-MAX_READ_IDS);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(values));
  } catch {
    // Notification read state is optional UI metadata and should never block the app.
  }
}
