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

export type ScanRecordStatus = 'Draft' | 'Saved' | 'Exported' | 'Processing';

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
