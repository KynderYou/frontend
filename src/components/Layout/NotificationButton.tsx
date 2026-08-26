import { useEffect, useRef, useState } from 'react';
import { colors, radius, shadow } from '../../styles/theme';
import { NotificationList } from '../Notifications/NotificationList';
import { useNotificationFeed } from '../Notifications/useNotificationFeed';
import type { AppView } from './navItems';

const theme = colors.light;

type NotificationButtonProps = {
  onNavigate?: (view: AppView, target?: string) => void;
};

export function NotificationButton({ onNavigate }: NotificationButtonProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, loading, load, handleAction } = useNotificationFeed({
    pollMs: 60_000,
    onNavigate,
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleOpen = () => {
    setOpen((value) => !value);
    if (!open) load();
  };

  const handleViewMore = () => {
    setOpen(false);
    if (onNavigate) {
      onNavigate('notifications');
      return;
    }
    window.location.hash = '#/notifications';
  };

  const onRowAction = async (item: Parameters<typeof handleAction>[0]) => {
    setOpen(false);
    await handleAction(item);
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn-icon"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={handleOpen}
        style={{ position: 'relative', flexShrink: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              right: 2,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: radius.pill,
              background: '#FA5252',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${theme['bg-surface']}`,
              boxShadow: shadow.float,
            }}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="dash-card notification-panel">
          <div className="notification-panel-header">
            <strong className="notification-panel-title">Notifications</strong>
            {items.length > 0 && (
              <button type="button" className="scans-action-btn" onClick={handleViewMore}>
                View more
              </button>
            )}
          </div>

          <div className="notification-panel-body">
            <NotificationList items={items} onAction={onRowAction} variant="panel" loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}
