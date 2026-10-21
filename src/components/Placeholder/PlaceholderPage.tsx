import { colors, radius, shadow, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';

const theme = colors.light;

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
  actions?: string[];
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function PlaceholderPage({ title, subtitle, actions = [], onOpenMobileMenu, onOpenProfile }: PlaceholderPageProps) {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing[4],
          marginBottom: spacing[6],
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: typography.roles.pageTitle.fontSize,
              lineHeight: typography.roles.pageTitle.lineHeight,
              fontWeight: typography.roles.pageTitle.fontWeight,
              letterSpacing: typography.roles.pageTitle.letterSpacing,
              color: theme['text-primary'],
            }}
          >
            {title}
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 16, color: theme['text-secondary'] }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn-icon mobile-menu-btn"
            aria-label="Open menu"
            onClick={onOpenMobileMenu}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="dash-card">
        {actions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: spacing[5] }}>
            {actions.map((action) => (
              <button key={action} type="button" className="btn-pill-secondary" style={{ height: 36, fontSize: 13, padding: '8px 14px' }}>
                {action}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            border: 'none',
            borderRadius: radius.lg,
            padding: spacing[8],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: theme['text-muted'],
            background: theme['bg-muted'],
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: theme['bg-surface'],
              display: 'grid',
              placeItems: 'center',
              color: theme.primary,
              boxShadow: shadow.float,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme['text-secondary'] }}>This section is coming soon</span>
          <span style={{ fontSize: 13, textAlign: 'center', maxWidth: 360 }}>
            We&apos;ll build out {title} here next — layout and data wiring are still in progress.
          </span>
        </div>
      </div>
    </section>
  );
}
