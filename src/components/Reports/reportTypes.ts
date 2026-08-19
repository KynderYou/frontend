import type { ScanDetails } from '../Scans/scanTypes';

export type ReportPlan = 'Standard' | 'Premium';

export type CabAudio = {
  id: string;
  title: string;
  counsellor: string;
  durationSec: number;
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
  cabAudios: CabAudio[];
  cabRequestedAt?: string;
  reportFileUrl?: string | null;
};

export function formatDuration(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
