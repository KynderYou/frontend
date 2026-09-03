/**
 * Backend environment switch.
 *
 * Change `ACTIVE_BACKEND` below to point the frontend at the desired API.
 */

export type BackendEnv = 'development' | 'production';

/**
 * ⬇️ Flip this value to switch backends
 *
 * 'development' → local Flask midna_backend
 * 'production'  → live / deployed Midna API
 */
export const ACTIVE_BACKEND: BackendEnv = 'development';

/** Base URLs for each backend. Update URLs here when hosts change. */
export const BACKEND_URLS = {
  // development — local Flask (`python run.py` on midna_backend)
  development: 'http://localhost:5001',

  // production — deployed Midna API
  production: 'https://api.kynderyou.com',
} as const satisfies Record<BackendEnv, string>;

/** Resolved API base URL for the currently selected backend. */
export const API_BASE_URL = BACKEND_URLS[ACTIVE_BACKEND];
