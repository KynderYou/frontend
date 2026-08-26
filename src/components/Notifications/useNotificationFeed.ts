import { useCallback, useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../../api';
import type { NotificationItem } from '../../api/notificationTypes';
import type { AppView } from '../Layout/navItems';
import { navigateFromNotification } from './notificationUtils';

type UseNotificationFeedOptions = {
  pollMs?: number;
  onNavigate?: (view: AppView, target?: string) => void;
};

export function useNotificationFeed({ pollMs, onNavigate }: UseNotificationFeedOptions = {}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getNotifications(signal);
      if (signal?.aborted) return;
      setItems(state.items);
      setUnreadCount(state.unread_count);
      setLoadError('');
    } catch {
      if (signal?.aborted) return;
      setItems([]);
      setUnreadCount(0);
      setLoadError('Unable to load notifications.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    if (!pollMs) return () => controller.abort();

    const timer = window.setInterval(() => load(), pollMs);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [load, pollMs]);

  const handleAction = useCallback(
    async (item: NotificationItem) => {
      if (!item.read) {
        try {
          await markNotificationRead(item.id);
          setItems((current) => current.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
          setUnreadCount((count) => Math.max(0, count - 1));
        } catch {
          /* ignore */
        }
      }
      navigateFromNotification(item.action_view, item.action_target, onNavigate);
    },
    [onNavigate],
  );

  return { items, unreadCount, loading, loadError, load, handleAction };
}
