import { apiClient } from '../client';
import {
  DEMO_TOKEN,
  demoLoginResponse,
  demoMember,
  isDemoToken,
  matchesDemoCredentials,
} from '../demoAuth';
import { clearToken, getToken, setToken } from '../token';
import type { LoginRequest, LoginResponse, Member, MessageResponse } from '../types';

/** POST /api/auth/login — falls back to local demo account when backend is unreachable */
export async function login(body: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  try {
    const result = await apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body,
      signal,
    });
    setToken(result.token);
    return result;
  } catch (error) {
    // Frontend-only / GitHub Pages: accept the default demo account when API is down
    if (matchesDemoCredentials(body.email, body.password)) {
      const demo = demoLoginResponse();
      setToken(demo.token);
      return demo;
    }
    throw error;
  }
}

/** GET /api/auth/me — returns demo member when using frontend-only session */
export async function getMe(signal?: AbortSignal): Promise<Member> {
  if (isDemoToken(getToken())) {
    return demoMember;
  }
  return apiClient<Member>('/api/auth/me', { signal });
}

/** POST /api/auth/logout — clears local token */
export async function logout(signal?: AbortSignal): Promise<MessageResponse> {
  if (isDemoToken(getToken())) {
    clearToken();
    return { message: 'Logged out' };
  }

  try {
    return await apiClient<MessageResponse>('/api/auth/logout', {
      method: 'POST',
      signal,
    });
  } finally {
    clearToken();
  }
}

export { DEMO_TOKEN };
