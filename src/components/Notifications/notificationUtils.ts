import type { NotificationItem } from '../../api/notificationTypes';
import type { AppView } from '../Layout/navItems';

const DAY_MS = 24 * 60 * 60 * 1000;

export type NotificationSection = {
  label: string;
  items: NotificationItem[];
};

function dateLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTimestamp(item: NotificationItem): number {
  if (item.created_at_ms) return item.created_at_ms;
  const parsed = Date.parse(item.created_at.replace(' · ', ' '));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

/** Group notifications: last 24h under "Recent", older items under their calendar date. */
export function groupNotificationsByDate(items: NotificationItem[], now = Date.now()): NotificationSection[] {
  const recent: NotificationItem[] = [];
  const olderByDay = new Map<string, { sortKey: number; items: NotificationItem[] }>();

  for (const item of items) {
    const ts = getTimestamp(item);
    if (now - ts < DAY_MS) {
      recent.push(item);
      continue;
    }

    const date = new Date(ts);
    const label = dateLabel(date);
    const bucket = olderByDay.get(label);
    if (bucket) {
      bucket.items.push(item);
    } else {
      olderByDay.set(label, { sortKey: ts, items: [item] });
    }
  }

  const sections: NotificationSection[] = [];
  if (recent.length > 0) {
    sections.push({ label: 'Recent', items: recent });
  }

  [...olderByDay.entries()]
    .sort((a, b) => b[1].sortKey - a[1].sortKey)
    .forEach(([label, bucket]) => {
      sections.push({ label, items: bucket.items });
    });

  return sections;
}

export function navigateFromNotification(
  view: string | null,
  target: string | null,
  onNavigate?: (view: AppView, target?: string) => void,
) {
  if (!view) return;
  const appView = view as AppView;
  if (onNavigate) {
    onNavigate(appView, target ?? undefined);
    return;
  }
  if (target && view === 'mis-scans') {
    window.location.hash = `#/${view}?scan=${encodeURIComponent(target)}`;
  } else if (target && view === 'admin-topups') {
    window.location.hash = `#/${view}?id=${encodeURIComponent(target)}`;
  } else {
    window.location.hash = `#/${view}`;
  }
}
