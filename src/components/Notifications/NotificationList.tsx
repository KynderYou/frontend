import { useMemo } from 'react';
import type { NotificationItem } from '../../api/notificationTypes';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
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
    return (
      <div className={`notification-list notification-list--${variant} notification-list--loading`}>
        {Array.from({ length: variant === 'panel' ? 4 : 6 }, (_, index) => (
          <div key={index} className="skeleton-notice-row" style={{ marginBottom: 14 }}>
            <Skeleton circle width={36} height={36} />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${78 - (index % 3) * 8}%`} height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={11} style={{ marginBottom: 6 }} />
              <Skeleton width="62%" height={11} />
            </div>
          </div>
        ))}
      </div>
    );
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
