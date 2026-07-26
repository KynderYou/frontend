import { colors, radius, spacing } from '../../styles/theme';
import type { MonthPoint } from './misData';

const theme = colors.light;
const CHART_H = 168;

type MonthlyBarChartProps = {
  title: string;
  subtitle: string;
  data: MonthPoint[];
  activeMonth: number;
  onSelectMonth: (month: number) => void;
  formatValue: (value: number) => string;
  /** Label used in the contributor list header, e.g. "scans" */
  unit: string;
};

export function MonthlyBarChart({
  title,
  subtitle,
  data,
  activeMonth,
  onSelectMonth,
  formatValue,
  unit,
}: MonthlyBarChartProps) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const active = data[activeMonth];

  return (
    <div className="dash-card mis-chart-card">
      <div className="mis-chart-head">
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
            {title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-secondary'] }}>{subtitle}</p>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: theme.primary,
            background: theme['primary-soft'],
            borderRadius: radius.pill,
            padding: '5px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          {formatValue(data.reduce((sum, d) => sum + d.value, 0))} total
        </span>
      </div>

      <div style={{ position: 'relative', marginTop: spacing[5] }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: CHART_H,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 1, background: theme.divider, opacity: 0.85 }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: CHART_H, position: 'relative', zIndex: 1 }}>
          {data.map((point) => {
            const isActive = point.month === activeMonth;
            const barH = point.value === 0 ? 4 : Math.max(10, Math.round((point.value / maxValue) * (CHART_H - 12)));

            return (
              <button
                key={point.label}
                type="button"
                onClick={() => onSelectMonth(point.month)}
                aria-pressed={isActive}
                aria-label={`${point.label}: ${formatValue(point.value)}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: '100%',
                    maxWidth: 26,
                    height: barH,
                    borderRadius: 8,
                    background: isActive
                      ? 'var(--btn-primary-gradient, linear-gradient(180deg, #8E9AFE 0%, #6D7AF2 100%))'
                      : point.value === 0
                        ? theme.divider
                        : theme['primary-soft'],
                    boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                    transition: 'height 0.2s ease, background 0.2s ease',
                  }}
                />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {data.map((point) => (
            <span
              key={point.label}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: point.month === activeMonth ? 700 : 500,
                color: point.month === activeMonth ? theme['text-primary'] : theme['text-muted'],
              }}
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: spacing[5],
          paddingTop: spacing[4],
          borderTop: `1px solid ${theme.divider}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme['text-primary'] }}>
            {active.label} contributors
          </span>
          <span style={{ fontSize: 12, color: theme['text-muted'] }}>
            {formatValue(active.value)} {unit}
          </span>
        </div>

        {active.contributors.length === 0 ? (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: theme['text-muted'] }}>
            No activity recorded for {active.label}.
          </p>
        ) : (
          <ul className="mis-contributor-list">
            {active.contributors.slice(0, 5).map((contributor) => {
              const share = Math.round((contributor.value / Math.max(1, active.value)) * 100);
              return (
                <li key={contributor.id}>
                  <span className="mis-contributor-name">{contributor.name}</span>
                  <span className="mis-contributor-bar" aria-hidden="true">
                    <span style={{ width: `${share}%` }} />
                  </span>
                  <span className="mis-contributor-value">{formatValue(contributor.value)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
