import type { TopPerformer } from '../../api';
import { colors, radius, shadow, spacing } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';

const theme = colors.light;

const AVATAR_PASTELS = ['#F8D7E8', '#D8F0E2', '#DDE4F8', '#F3EBDD', '#E8D9F0'];

type TopPerformersProps = {
  performers: TopPerformer[];
  loading?: boolean;
};

export function TopPerformers({ performers, loading }: TopPerformersProps) {
  return (
    <section className="dash-card top-performers-card">
      <div
        className="top-performers-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[5],
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
            Top 5 performers
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>Leading scanners this period</p>
        </div>
        {performers.length > 0 ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.primary,
              background: theme['primary-soft'],
              borderRadius: radius.pill,
              padding: '6px 12px',
              boxShadow: shadow.float,
            }}
          >
            Top {Math.min(performers.length, 5)}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p style={{ color: theme['text-secondary'], fontSize: 13 }}>Loading performers…</p>
      ) : performers.length === 0 ? (
        <EmptyState
          title="No performers yet"
          description="Scanner rankings will appear once members start uploading scans."
        />
      ) : (
        <div className="top-performers-scroll">
          {performers.map((person) => {
            const pastel = AVATAR_PASTELS[(person.rank - 1) % AVATAR_PASTELS.length];
            const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(person.name)}&backgroundColor=transparent`;
            const detail = person.region ? `Nest · ${person.region}` : 'Nest · —';

            return (
              <div key={person.member_id} className="performer-row">
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: person.rank === 1 ? 'var(--btn-primary-gradient)' : theme['bg-muted'],
                    color: person.rank === 1 ? '#fff' : theme['text-secondary'],
                    boxShadow: person.rank === 1 ? shadow.soft : 'none',
                  }}
                >
                  {person.rank}
                </span>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: pastel,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: shadow.float,
                  }}
                >
                  <img
                    src={avatar}
                    alt={person.name}
                    width={40}
                    height={40}
                    style={{ width: 40, height: 40, objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>{person.name}</div>
                  <div style={{ fontSize: 12, color: theme['text-muted'], marginTop: 1 }}>{detail}</div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: person.rank === 1 ? theme.primary : theme['text-secondary'],
                    background: person.rank === 1 ? theme['primary-soft'] : theme['bg-muted'],
                    borderRadius: radius.pill,
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {person.scan_count} scans
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
