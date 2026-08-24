import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api';
import type { NotificationItem } from '../../api/notificationTypes';
import { colors, radius, shadow, spacing } from '../../styles/theme';
import type { AppView } from './navItems';

const theme = colors.light;

type NotificationButtonProps = {
  onNavigate?: (view: AppView, target?: string) => void;
};

function navigateFromNotification(view: string | null, target: string | null, onNavigate?: NotificationButtonProps['onNavigate']) {
  if (!view) return;
  const appView = view as AppView;
  if (onNavigate) {
    onNavigate(appView, target ?? undefined);
    return;
  }
  if (target && view === 'mis-scans') {
    window.location.hash = `#/${view}?scan=${encodeURIComponent(target)}&cab=1`;
  } else if (target && view === 'admin-topups') {
    window.location.hash = `#/${view}?id=${encodeURIComponent(target)}`;
  } else {
    window.location.hash = `#/${view}`;
  }
}

export function NotificationButton({ onNavigate }: NotificationButtonProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getNotifications(signal);
      setItems(state.items);
      setUnreadCount(state.unread_count);
    } catch {
      if (!signal?.aborted) {
        setItems([]);
        setUnreadCount(0);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const timer = window.setInterval(() => load(), 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [load]);

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
    setOpen((v) => !v);
    if (!open) load();
  };

  const handleSelect = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
        setItems((current) => current.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    navigateFromNotification(item.action_view, item.action_target, onNavigate);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((row) => ({ ...row, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn-icon"
        aria-label="Notifications"
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
            style={{
              position: 'absolute',
              top: 10,
              right: 11,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FA5252',
              border: `2px solid ${theme['bg-surface']}`,
              boxShadow: shadow.float,
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="dash-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 420,
            overflow: 'hidden',
            zIndex: 50,
            padding: 0,
            boxShadow: shadow.float,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[3]} ${spacing[4]}`,
              borderBottom: `1px solid ${theme.divider}`,
            }}
          >
            <strong style={{ fontSize: 14, color: theme['text-primary'] }}>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="scans-action-btn" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <p style={{ padding: spacing[4], margin: 0, fontSize: 13, color: theme['text-muted'] }}>Loading…</p>
            ) : items.length === 0 ? (
              <p style={{ padding: spacing[4], margin: 0, fontSize: 13, color: theme['text-muted'] }}>No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: `1px solid ${theme.divider}`,
                    background: item.read ? theme['bg-surface'] : theme['bg-muted'],
                    padding: `${spacing[3]} ${spacing[4]}`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme['text-primary'] }}>{item.title}</span>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: theme['text-secondary'], lineHeight: 1.4 }}>{item.body}</span>
                  <span style={{ display: 'block', marginTop: 6, fontSize: 11, color: theme['text-muted'] }}>{item.created_at}</span>
                  {item.action_view && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.primary,
                        background: theme['primary-soft'],
                        borderRadius: radius.sm,
                        padding: '2px 8px',
                      }}
                    >
                      Take action
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
