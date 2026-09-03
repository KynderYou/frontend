import { ACTIVE_BACKEND, API_BASE_URL, type BackendEnv } from '../api/backendEnv';
import {
  environments,
  type AppEnvironment,
  type EnvironmentConfig,
} from './environments';

const DEFAULT_TIMEOUT_MS = 15_000;

function resolveConfig(): EnvironmentConfig {
  const name = ACTIVE_BACKEND as AppEnvironment;
  const defaults = environments[name] ?? environments.development;

  const viteApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
  const apiBaseUrl = (viteApiBase || API_BASE_URL).replace(/\/$/, '');

  const viteTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
  const apiTimeoutMs = Number.isFinite(viteTimeout) && viteTimeout > 0
    ? viteTimeout
    : defaults.apiTimeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    name,
    apiBaseUrl,
    apiTimeoutMs,
  };
}

/** Active environment config — driven by `ACTIVE_BACKEND` in api/backendEnv.ts */
export const env: EnvironmentConfig = resolveConfig();

export function isDevelopment(): boolean {
  return ACTIVE_BACKEND === 'development';
}

export function isProduction(): boolean {
  return ACTIVE_BACKEND === 'production';
}

export type { AppEnvironment, BackendEnv, EnvironmentConfig };
