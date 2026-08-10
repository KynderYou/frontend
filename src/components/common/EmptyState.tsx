import { colors, spacing } from '../../styles/theme';

const theme = colors.light;

type EmptyStateProps = {
  title: string;
  description?: string;
  compact?: boolean;
};

export function EmptyState({ title, description, compact = false }: EmptyStateProps) {
  return (
    <div
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: compact ? 6 : 10,
        padding: compact ? `${spacing[4]} ${spacing[3]}` : `${spacing[6]} ${spacing[4]}`,
        minHeight: compact ? 120 : 160,
        color: theme['text-muted'],
      }}
    >
      <div
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: '50%',
          background: theme['bg-surface'],
          display: 'grid',
          placeItems: 'center',
          color: theme.primary,
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <svg width={compact ? 18 : 20} height={compact ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: compact ? 13 : 14, fontWeight: 600, color: theme['text-secondary'] }}>{title}</p>
        {description ? (
          <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.5, color: theme['text-muted'], maxWidth: 280 }}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
