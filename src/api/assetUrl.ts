import { env } from '../config/env';
import { getToken } from './token';

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${env.apiBaseUrl}${normalized}`;
}

/** Fetch a protected file and return a temporary object URL for display. */
export async function fetchAuthenticatedAsset(pathOrUrl: string, signal?: AbortSignal): Promise<string> {
  const token = getToken();
  const response = await fetch(resolveUrl(pathOrUrl), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to load file');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** Open a protected file in a new browser tab. */
export async function openAuthenticatedAsset(pathOrUrl: string): Promise<void> {
  const objectUrl = await fetchAuthenticatedAsset(pathOrUrl);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
