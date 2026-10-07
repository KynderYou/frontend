import { colors, radius } from '../../styles/theme';
import { ledgerPeriodOptions, todayIso, type LedgerPeriod, type LedgerRange } from './ledgerPeriod';

const theme = colors.light;

const controlStyle = {
  height: 36,
  borderRadius: radius.md,
  border: `1px solid ${theme.divider}`,
  background: theme['bg-surface'],
  color: theme['text-primary'],
  fontSize: 13,
  padding: '0 12px',
  fontFamily: 'inherit',
} as const;

type LedgerPeriodFilterProps = {
  period: LedgerPeriod;
  custom: LedgerRange;
  onPeriodChange: (period: LedgerPeriod) => void;
  onCustomChange: (range: LedgerRange) => void;
};

export function LedgerPeriodFilter({ period, custom, onPeriodChange, onCustomChange }: LedgerPeriodFilterProps) {
  const today = todayIso();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value as LedgerPeriod)}
        aria-label="Ledger period"
        style={controlStyle}
      >
        {ledgerPeriodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {period === 'custom' ? (
        <>
          <input
            type="date"
            aria-label="From date"
            value={custom.start ?? ''}
            max={custom.end || today}
            onChange={(e) => onCustomChange({ ...custom, start: e.target.value })}
            style={controlStyle}
          />
          <span style={{ fontSize: 13, color: theme['text-muted'] }}>to</span>
          <input
            type="date"
            aria-label="To date"
            value={custom.end ?? ''}
            min={custom.start || undefined}
            max={today}
            onChange={(e) => onCustomChange({ ...custom, end: e.target.value })}
            style={controlStyle}
          />
        </>
      ) : null}
    </div>
  );
}
