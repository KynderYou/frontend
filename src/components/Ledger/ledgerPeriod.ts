export type LedgerPeriod = 'all' | '30d' | 'month' | 'year' | 'custom';

export type LedgerRange = { start?: string; end?: string };

export const ledgerPeriodOptions: { value: LedgerPeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function displayDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function ledgerRange(period: LedgerPeriod, custom: LedgerRange, today = new Date()): LedgerRange {
  switch (period) {
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: isoDate(start), end: isoDate(today) };
    }
    case 'month':
      return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: isoDate(today) };
    case 'year':
      return { start: isoDate(new Date(today.getFullYear(), 0, 1)), end: isoDate(today) };
    case 'custom':
      return { start: custom.start || undefined, end: custom.end || undefined };
    default:
      return {};
  }
}

export function ledgerRangeLabel(period: LedgerPeriod, range: LedgerRange): string {
  if (period !== 'custom') {
    return ledgerPeriodOptions.find((option) => option.value === period)?.label ?? 'All time';
  }
  if (range.start && range.end) return `${displayDate(range.start)} – ${displayDate(range.end)}`;
  if (range.start) return `From ${displayDate(range.start)}`;
  if (range.end) return `Until ${displayDate(range.end)}`;
  return 'All time';
}

export function todayIso(): string {
  return isoDate(new Date());
}
