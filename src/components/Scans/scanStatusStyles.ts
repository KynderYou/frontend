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

/** HO statuses that mean the MLA report is ready to download / upgrade. */
export const REPORT_READY_STATUSES = [
  'Uploaded',
  'DDS Done',
  'Ready to Download',
  'Downloaded',
] as const;

export function isReportReady(status: string): boolean {
  return (REPORT_READY_STATUSES as readonly string[]).includes(status);
}

/** Hide internal HO label "DDS Done" from My Reports UI. */
export function displayReportStatus(status: string): string {
  if (status === 'DDS Done') return 'Uploaded';
  return status;
}

/** Filter chips for the Reports page — HO labels used at report stage. */
export const REPORT_STATUS_FILTERS = [
  'All',
  'Processing',
  'Uploaded',
  'Ready to Download',
  'Downloaded',
] as const;

export type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];

/** Match filter chips to stored statuses (DDS Done rolls into Uploaded). */
export function matchesReportStatusFilter(status: string, filter: ReportStatusFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Uploaded') return status === 'Uploaded' || status === 'DDS Done';
  return status === filter;
}
