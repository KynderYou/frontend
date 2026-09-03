import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import type { AppView } from '../Layout/navItems';
import { NotificationList } from './NotificationList';
import { useNotifications } from './NotificationContext';

const theme = colors.light;

type NotificationsPageProps = {
  onBack: () => void;
  onNavigate?: (view: AppView, target?: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function NotificationsPage({ onBack, onNavigate, onOpenMobileMenu, onOpenProfile }: NotificationsPageProps) {
  const { items, unreadCount, loading, loadError, handleAction } = useNotifications();

  return (
    <section className="page-section notifications-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], minWidth: 0, flex: 1 }}>
          <button type="button" className="btn-icon" aria-label="Back to dashboard" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <div className="page-title-block" style={{ minWidth: 0 }}>
            <h1
              className="page-title"
              style={{
                margin: 0,
                fontSize: typography.roles.pageTitle.fontSize,
                lineHeight: typography.roles.pageTitle.lineHeight,
                fontWeight: typography.roles.pageTitle.fontWeight,
                letterSpacing: typography.roles.pageTitle.letterSpacing,
                color: theme['text-primary'],
              }}
            >
              Notifications
            </h1>
            <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton onNavigate={onNavigate} />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      {loadError ? (
        <EmptyState title={loadError} description="Check your connection and try again." />
      ) : (
        <NotificationList items={items} onAction={handleAction} variant="page" loading={loading} />
      )}
    </section>
  );
}
