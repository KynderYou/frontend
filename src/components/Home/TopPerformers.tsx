import { colors, layoutTokens, radius, shadow, spacing } from '../../styles/theme';

const theme = colors.light;

type Performer = {
  rank: number;
  name: string;
  metric: string;
  detail: string;
  avatar: string;
  pastel: string;
};

const performers: Performer[] = [
  {
    rank: 1,
    name: 'Ananya Rao',
    metric: '48 scans',
    detail: 'Nest · South',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ananya&backgroundColor=transparent',
    pastel: '#F8D7E8',
  },
  {
    rank: 2,
    name: 'Rahul Mehta',
    metric: '41 scans',
    detail: 'Nest · West',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul&backgroundColor=transparent',
    pastel: '#D8F0E2',
  },
  {
    rank: 3,
    name: 'Priya Shah',
    metric: '37 scans',
    detail: 'Nest · North',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya&backgroundColor=transparent',
    pastel: '#DDE4F8',
  },
  {
    rank: 4,
    name: 'Vikram Iyer',
    metric: '33 scans',
    detail: 'Nest · East',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Vikram&backgroundColor=transparent',
    pastel: '#F3EBDD',
  },
  {
    rank: 5,
    name: 'Sneha Patel',
    metric: '29 scans',
    detail: 'Nest · Central',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sneha&backgroundColor=transparent',
    pastel: '#E8D9F0',
  },
];

export function TopPerformers() {
  return (
    <section className="dash-card" style={{ display: 'flex', flexDirection: 'column', height: layoutTokens.homeLowerCardHeight }}>
      <div
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
          Top 5
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 auto', minHeight: 0 }}>
        {performers.map((person) => (
          <div key={person.rank} className="performer-row">
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
                background: person.pastel,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: shadow.float,
              }}
            >
              <img
                src={person.avatar}
                alt={person.name}
                width={40}
                height={40}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>{person.name}</div>
              <div style={{ fontSize: 12, color: theme['text-muted'], marginTop: 1 }}>{person.detail}</div>
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
              {person.metric}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
