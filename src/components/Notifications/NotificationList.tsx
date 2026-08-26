import { useMemo } from 'react';
import type { NotificationItem } from '../../api/notificationTypes';
import { EmptyState } from '../common/EmptyState';
import { NotificationDateGroup } from './NotificationDateGroup';
import { groupNotificationsByDate } from './notificationUtils';

type NotificationListProps = {
  items: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  variant?: 'panel' | 'page';
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function NotificationList({
  items,
  onAction,
  variant = 'panel',
  loading = false,
  emptyTitle = 'No notifications yet',
  emptyDescription,
}: NotificationListProps) {
  const sections = useMemo(() => groupNotificationsByDate(items), [items]);

  if (loading && items.length === 0) {
    return <p className="notification-list-empty">Loading notifications…</p>;
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        compact={variant === 'panel'}
      />
    );
  }

  return (
    <div className={`notification-list notification-list--${variant}`}>
      {sections.map((section) => (
        <NotificationDateGroup
          key={section.label}
          label={section.label}
          items={section.items}
          onAction={onAction}
          variant={variant}
        />
      ))}
    </div>
  );
}
