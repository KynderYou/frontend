import type { ScanDetails } from '../Scans/scanTypes';
import { normalizeReportPlan, type ReportPlan } from './reportPackages';

export type { ReportPlan };

export type CabFeedbackStatus = 'Pending' | 'Approved' | 'Rejected';

export type ReportCabFeedback = {
  rating: number;
  comments: string;
  status: CabFeedbackStatus;
  submittedAt: string;
};

export type ReportRecord = {
  id: string;
  numericId: number;
  scanId: string;
  reportName: string;
  size: string;
  generatedAt: string;
  /** Same status labels as Scans HO workflow (e.g. Processing, Uploaded, DDS Done). */
  status: string;
  plan: ReportPlan;
  details: ScanDetails;
  cabFeedback?: ReportCabFeedback;
  ownerId: number;
  /** Only MLA-owned scans get CAB feedback. */
  cabEligible: boolean;
  reportFileUrl?: string | null;
  flaggedX?: boolean;
};

export function formatDuration(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { normalizeReportPlan };
