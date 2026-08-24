import { API_BASE_URL } from '../backendEnv';
import { getToken } from '../token';

export type ScanCabAudio = {
  id: number;
  title: string;
  file_name: string;
  duration_sec: number;
  uploaded_at: string;
};

export type ScanCabUploadResult = {
  message: string;
  audio: ScanCabAudio;
  audios: ScanCabAudio[];
};

/** GET /api/cab/scans/{scanCode}/audios */
export async function getScanCabAudios(scanCode: string, signal?: AbortSignal): Promise<ScanCabAudio[]> {
  return fetch(`${API_BASE_URL}/api/cab/scans/${encodeURIComponent(scanCode)}/audios`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error('Unable to load CAB audios');
    return response.json() as Promise<ScanCabAudio[]>;
  });
}

/** POST /api/cab/scans/{scanCode}/upload */
export async function uploadScanCabAudio(
  scanCode: string,
  file: File,
  title: string,
): Promise<ScanCabUploadResult> {
  const form = new FormData();
  form.append('audio', file);
  form.append('title', title);

  const response = await fetch(`${API_BASE_URL}/api/cab/scans/${encodeURIComponent(scanCode)}/upload`, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    body: form,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(typeof detail?.detail === 'string' ? detail.detail : 'Upload failed');
  }

  return response.json() as Promise<ScanCabUploadResult>;
}
