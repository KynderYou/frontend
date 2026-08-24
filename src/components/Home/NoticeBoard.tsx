import { useState } from 'react';
import type { DashboardNotice } from '../../api';
import { colors, radius, severityTokens, shadow, spacing, type SeverityLevel } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';

const theme = colors.light;

const severityIcon: Record<SeverityLevel, React.ReactNode> = {
  high: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  medium: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  low: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

type NoticeBoardProps = {
  notices: DashboardNotice[];
  loading?: boolean;
  onReply?: (communicationId: string) => void;
};

export function NoticeBoard({ notices, loading, onReply }: NoticeBoardProps) {
  const [acknowledged, setAcknowledged] = useState<Record<number, boolean>>({});

  const toggleAcknowledged = (id: number) => {
    setAcknowledged((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      className="dash-card notice-board-card notice-board-pulse"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[5],
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: theme['text-primary'],
          }}
        >
          <span
            className="notice-board-blink"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: theme['primary-soft'],
              color: theme.primary,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: shadow.float,
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: 0,
            }}
          >
            !
          </span>
          Notice board
        </h2>
        <span style={{ fontSize: 12, color: theme['text-muted'] }}>
          {notices.length} notice{notices.length === 1 ? '' : 's'}
        </span>
      </div>

      <div
        className="notice-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: 4,
          marginRight: -4,
        }}
      >
        {loading ? (
          <p style={{ margin: 'auto 0', textAlign: 'center', fontSize: 13, color: theme['text-secondary'] }}>
            Loading notices…
          </p>
        ) : notices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Publish one from Communications to share updates with everyone."
          />
        ) : (
          notices.map((notice) => {
            const tone = severityTokens[notice.severity];
            return (
              <article
                key={notice.id}
                style={{
                  borderRadius: radius.lg,
                  border: 'none',
                  background: tone.bg,
                  padding: spacing[4],
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.55)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                      background: theme['bg-surface'],
                      color: tone.icon,
                      boxShadow: shadow.float,
                    }}
                  >
                    {severityIcon[notice.severity]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        color: tone.text,
                      }}
                    >
                      {notice.title}
                    </h3>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: theme['text-secondary'],
                      }}
                    >
                      {notice.body}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: theme['bg-surface'],
                          color: theme['text-secondary'],
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: shadow.float,
                        }}
                      >
                        {notice.author_initials}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: theme['text-primary'] }}>{notice.author_name}</span>
                      <span style={{ fontSize: 12, color: theme['text-muted'] }}>· {notice.created_at}</span>
                      {notice.reply_count > 0 && (
                        <span style={{ fontSize: 12, color: theme['text-muted'] }}>
                          · {notice.reply_count} repl{notice.reply_count === 1 ? 'y' : 'ies'}
                        </span>
                      )}
                      {notice.has_poll && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: theme.primary,
                            background: theme['primary-soft'],
                            borderRadius: radius.pill,
                            padding: '3px 8px',
                          }}
                        >
                          Poll
                        </span>
                      )}

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {onReply && (
                          <button
                            type="button"
                            className="notice-ack-btn"
                            onClick={() => onReply(String(notice.id))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              flexShrink: 0,
                              padding: '6px 12px',
                              borderRadius: radius.pill,
                              border: 'none',
                              background: theme['bg-surface'],
                              color: theme.primary,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: shadow.float,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                            </svg>
                            Reply
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleAcknowledged(notice.id)}
                          aria-pressed={!!acknowledged[notice.id]}
                          className="notice-ack-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            flexShrink: 0,
                            padding: '6px 12px',
                            borderRadius: radius.pill,
                            border: 'none',
                            background: acknowledged[notice.id] ? theme.success : theme['bg-surface'],
                            color: acknowledged[notice.id] ? '#fff' : tone.icon,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: acknowledged[notice.id] ? '0 6px 14px rgba(81, 207, 102, 0.3)' : shadow.float,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {acknowledged[notice.id]
                            ? `Read · ${notice.seen_count + 1}`
                            : `Mark as read · ${notice.seen_count}`}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
