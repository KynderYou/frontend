import type { ScanDetails } from '../Scans/scanTypes';
import { normalizeReportPlan, type ReportPlan } from './reportPackages';

export type { ReportPlan };

export type CabFeedbackStatus = 'Pending' | 'Approved' | 'Rejected';

export type ReportCabFeedback = {
  rating: number;
  comments: string;
  audioUrl: string | null;
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
  ownerName?: string;
  /** Only MLA-owned scans get CAB feedback. */
  cabEligible: boolean;
  /** Mentor uploaded it for a trainee (no account), so there is no CAB feedback. */
  uploadedForTrainee?: boolean;
  reportFileUrl?: string | null;
  flaggedX?: boolean;
  /** When the mentor last asked the MLA to rate the CAB. */
  cabRequestedAt?: string;
};

export function formatDuration(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { normalizeReportPlan };
