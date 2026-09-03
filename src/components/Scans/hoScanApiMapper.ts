import type { HoScan } from '../../api/types';

export type HoSectionId = 'preprocess' | 'process' | 'verify' | 'download' | 'report';

export type HoScanRecord = {
  id: string;
  numericId: number;
  section: HoSectionId;
  scanId: string;
  name: string;
  gender?: string;
  age?: string;
  scanBy: string;
  reportType: string;
  cost: string;
  images: number;
  processedBy: string;
  preprocessedBy?: string;
  mainPattern?: string;
  subPattern?: string;
  urc?: number;
  rrc?: number;
  lfo?: number;
  finger?: string;
  status: string;
  flaggedX?: boolean;
};

export function hoScanToRecord(scan: HoScan): HoScanRecord {
  return {
    id: String(scan.id),
    numericId: scan.id,
    section: scan.section as HoSectionId,
    scanId: scan.scan_code,
    name: scan.name,
    gender: scan.gender || undefined,
    age: scan.age || undefined,
    scanBy: scan.scan_by,
    reportType: scan.report_type,
    cost: scan.cost,
    images: scan.images,
    processedBy: scan.processed_by,
    preprocessedBy: scan.preprocessed_by ?? undefined,
    mainPattern: scan.main_pattern ?? undefined,
    subPattern: scan.sub_pattern ?? undefined,
    urc: scan.urc ?? undefined,
    rrc: scan.rrc ?? undefined,
    lfo: scan.lfo ?? undefined,
    finger: scan.finger ?? undefined,
    status: scan.status,
    flaggedX: scan.flagged_x,
  };
}

export function hoScanListToRecords(scans: HoScan[]): HoScanRecord[] {
  return scans.map(hoScanToRecord);
}
