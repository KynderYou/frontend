import { fetchAuthenticatedAsset } from '../assetUrl';
import { apiClient, apiUpload } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { MlaScan, MlaScanUpdatePayload } from '../types';

/** GET /api/scans/me */
export async function getMyMlaScans(signal?: AbortSignal): Promise<MlaScan[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<MlaScan[]>('/api/scans/me', { signal });
}

/** POST /api/scans — multipart zip + client fields */
export async function createMlaScan(
  file: File,
  fields: {
    client_name: string;
    age: string;
    phone: string;
    gender: string;
    client_type: string;
    referred_by: string;
    mrp: string;
    scan_code?: string;
  },
): Promise<MlaScan> {
  if (isDemoToken(getToken())) {
    throw new Error('Upload not available in demo mode');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('client_name', fields.client_name);
  formData.append('age', fields.age);
  formData.append('phone', fields.phone);
  formData.append('gender', fields.gender);
  formData.append('client_type', fields.client_type);
  formData.append('referred_by', fields.referred_by);
  formData.append('mrp', fields.mrp);
  if (fields.scan_code) {
    formData.append('scan_code', fields.scan_code);
  }
  return apiUpload<MlaScan>('/api/scans', formData);
}

/** PATCH /api/scans/{id} */
export async function updateMlaScan(scanId: number, body: MlaScanUpdatePayload): Promise<MlaScan> {
  if (isDemoToken(getToken())) {
    throw new Error('Update not available in demo mode');
  }
  return apiClient<MlaScan>(`/api/scans/${scanId}`, { method: 'PATCH', body });
}

/** POST /api/scans/{id}/export */
export async function exportMlaScan(scanId: number): Promise<MlaScan> {
  if (isDemoToken(getToken())) {
    throw new Error('Export not available in demo mode');
  }
  return apiClient<MlaScan>(`/api/scans/${scanId}/export`, { method: 'POST' });
}

/** DELETE /api/scans/{id} */
export async function deleteMlaScan(scanId: number): Promise<void> {
  if (isDemoToken(getToken())) {
    return;
  }
  await apiClient<void>(`/api/scans/${scanId}`, { method: 'DELETE' });
}

/** Resolve protected image URLs to temporary blob URLs for display. */
export async function resolveMlaScanImages(scan: MlaScan): Promise<MlaScan> {
  const images = await Promise.all(
    scan.images.map(async (image) => ({
      ...image,
      url: await fetchAuthenticatedAsset(image.url),
    })),
  );
  return { ...scan, images };
}

export async function resolveMlaScanListImages(scans: MlaScan[]): Promise<MlaScan[]> {
  return Promise.all(scans.map((scan) => resolveMlaScanImages(scan)));
}
