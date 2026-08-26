import type { NotificationItem } from '../../api/notificationTypes';
import { NotificationRow } from './NotificationRow';

export type NotificationDateGroupProps = {
  label: string;
  items: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  variant?: 'panel' | 'page';
};

/** One date-labelled block of notifications (e.g. "Recent" or "24 Aug 2026"). */
export function NotificationDateGroup({ label, items, onAction, variant = 'panel' }: NotificationDateGroupProps) {
  if (items.length === 0) return null;

  const content = (
    <>
      <div className="notification-date-label">{label}</div>
      <div className="notification-date-items">
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} onAction={onAction} />
        ))}
      </div>
    </>
  );

  if (variant === 'page') {
    return <section className="dash-card notification-date-group notification-date-group--page">{content}</section>;
  }

  return <section className="notification-date-group notification-date-group--panel">{content}</section>;
}
