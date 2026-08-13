import type { MlaScan } from '../../api';
import type { ScanDetails, ScanRecord, ScanRecordStatus } from './scanTypes';

export function mlaScanToRecord(scan: MlaScan): ScanRecord {
  return {
    id: String(scan.id),
    scanId: scan.scan_code,
    fileName: scan.file_name || '—',
    fileUrl: scan.file_url ?? undefined,
    size: scan.size,
    uploadedAt: scan.uploaded_at,
    exportedAt: scan.exported_at ?? undefined,
    status: scan.status as ScanRecordStatus,
    details: {
      clientType: scan.details.client_type,
      referredBy: scan.details.referred_by,
      name: scan.details.name,
      age: scan.details.age,
      phone: scan.details.phone,
      gender: scan.details.gender,
      mrp: scan.details.mrp,
    },
    detailsSaved: scan.details_saved,
    exported: scan.exported,
    images: scan.images.map((image) => ({
      name: image.name,
      url: image.url,
      label: image.label,
    })),
  };
}

export function detailsToUpdatePayload(details: ScanDetails) {
  return {
    name: details.name,
    age: details.age,
    phone: details.phone,
    gender: details.gender,
    client_type: details.clientType,
    referred_by: details.referredBy,
    mrp: details.mrp,
  };
}

export function collectBlobUrls(records: ScanRecord[]): string[] {
  const urls: string[] = [];
  for (const record of records) {
    if (record.fileUrl?.startsWith('blob:')) urls.push(record.fileUrl);
    for (const image of record.images ?? []) {
      if (image.url.startsWith('blob:')) urls.push(image.url);
    }
  }
  return urls;
}

export function revokeBlobUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}
