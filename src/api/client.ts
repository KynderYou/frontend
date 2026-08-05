import { env } from '../config/env';
import { ApiError } from './errors';
import { getToken } from './token';
import type { RequestOptions } from './types';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalized}`;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

/**
 * Shared HTTP client — only place that talks to `fetch`.
 * Endpoint modules should call this; UI should not.
 */
export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', headers, body, signal, timeoutMs = env.apiTimeoutMs } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const token = getToken();

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const parsed = await parseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, parsed);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'Aborted', null, 'Request timed out or was cancelled');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Multipart upload helper — do not set Content-Type (browser adds boundary). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: 'POST' | 'PUT' | 'PATCH'; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const { method = 'POST', signal, timeoutMs = env.apiTimeoutMs } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const token = getToken();

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    });

    const parsed = await parseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, parsed);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'Aborted', null, 'Request timed out or was cancelled');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}
