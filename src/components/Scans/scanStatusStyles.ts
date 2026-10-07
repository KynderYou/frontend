import { colors } from '../../styles/theme';

const theme = colors.light;

/** Status chip styling — shared by Scans HO and Reports (same vocabulary). */
export function scanStatusStyles(status: string) {
  const value = status.toLowerCase();
  if (
    value.includes('completed') ||
    value.includes('verified') ||
    value.includes('uploaded') ||
    value.includes('debited') ||
    value.includes('downloaded') ||
    value.includes('dds done')
  ) {
    return { color: theme.success, background: theme['success-bg'] };
  }
  if (
    value.includes('review') ||
    value.includes('process') ||
    value.includes('pending') ||
    value.includes('awaiting') ||
    value.includes('ready')
  ) {
    return { color: theme.warning, background: theme['warning-bg'] };
  }
  if (value.includes('reject') || value.includes('delete')) {
    return { color: theme.error, background: theme['error-bg'] };
  }
  return { color: theme.primary, background: theme['primary-soft'] };
}

/**
 * My Reports statuses, mapped from the Process Scan pipeline:
 * Preprocess/Process → Processing, Review/Download → Under Review, uploaded PDF → Ready to Download.
 */
export const REPORT_STATUS_READY = 'Ready to Download';

export function isReportReady(status: string): boolean {
  return status === REPORT_STATUS_READY;
}

export function displayReportStatus(status: string): string {
  return status;
}

export function reportStatusStyles(status: string) {
  if (status === REPORT_STATUS_READY) return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Under Review') return { color: theme.primary, background: theme['primary-soft'] };
  return { color: theme.warning, background: theme['warning-bg'] };
}

export const REPORT_STATUS_FILTERS = ['All', 'Processing', 'Under Review', REPORT_STATUS_READY] as const;

export type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];

export function matchesReportStatusFilter(status: string, filter: ReportStatusFilter): boolean {
  return filter === 'All' || status === filter;
}
