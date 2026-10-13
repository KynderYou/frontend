export type ScanImage = {
  name: string;
  url: string;
  label: string;
};

export type ScanDetails = {
  clientType: string;
  referredBy: string;
  name: string;
  age: string;
  phone: string;
  gender: string;
  mrp: string;
};

export const STATUS_REJECTED_BY_HO = 'Rejected by H.O';

export type ScanRecordStatus =
  | typeof STATUS_REJECTED_BY_HO
  | 'Imported'
  | 'Consent form verified'
  | 'QC checked'
  | 'Exported'
  | 'Saved'
  | 'Draft'
  | 'Processing';

export type ScanRecord = {
  id: string;
  scanId: string;
  fileName: string;
  fileUrl?: string;
  size: string;
  uploadedAt: string;
  exportedAt?: string;
  status: ScanRecordStatus;
  details: ScanDetails;
  detailsSaved: boolean;
  exported: boolean;
  images?: ScanImage[];
  /** Trainee who uploaded on the mentor's behalf */
  uploadedBy?: string;
};

export const defaultScanDetails = (): ScanDetails => ({
  clientType: '',
  referredBy: '',
  name: '',
  age: '',
  phone: '',
  gender: '',
  mrp: '',
});

let seedScanSerialByDate: Record<string, number> = {};

export function nextScanId() {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).replace(/-/g, '');
  const serial = (seedScanSerialByDate[datePart] ?? 0) + 1;
  seedScanSerialByDate[datePart] = serial;
  return `T${datePart}${String(serial).padStart(3, '0')}`;
}
