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

/** Filter chips for the Reports page — HO labels used at report stage. */
export const REPORT_STATUS_FILTERS = [
  'All',
  'Processing',
  'Uploaded',
  'DDS Done',
  'Ready to Download',
  'Downloaded',
] as const;

export type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];
