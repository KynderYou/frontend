function lastScanAgo(days: number | null): string {
  if (days == null) return 'No scans yet';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/** Last scan date with how long ago it was; turns amber after 30 days of no scans. */
export function LastScanCell({ date, days }: { date: string; days: number | null }) {
  if (days == null) {
    return <span className="last-scan-cell is-none">—</span>;
  }
  return (
    <span className={`last-scan-cell${days > 30 ? ' is-stale' : ''}`}>
      <span className="last-scan-date">{date}</span>
      <span className="last-scan-ago">{lastScanAgo(days)}</span>
    </span>
  );
}
