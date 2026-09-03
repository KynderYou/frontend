import { createContext, useContext, type ReactNode } from 'react';
import type { NotificationItem } from '../../api/notificationTypes';
import type { AppView } from '../Layout/navItems';
import { useNotificationFeed } from './useNotificationFeed';

type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  loadError: string;
  load: (signal?: AbortSignal) => Promise<void>;
  handleAction: (item: NotificationItem) => Promise<void>;
};

const NotificationContext = createContext<NotificationFeed | null>(null);

type NotificationProviderProps = {
  children: ReactNode;
  onNavigate?: (view: AppView, target?: string) => void;
};

/** Fetch notifications once for the session — avoids cancel/refetch on every page change. */
export function NotificationProvider({ children, onNavigate }: NotificationProviderProps) {
  const feed = useNotificationFeed({ pollMs: 60_000, onNavigate });
  return <NotificationContext.Provider value={feed}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationFeed {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return value;
}
