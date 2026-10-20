import type { LoginGate } from '../api/types';
import type { AppView } from '../components/Layout/navItems';
import { resolveView } from '../components/Layout/navItems';

export type LoginGateDetail = {
  code: string;
  message: string;
  action?: string | null;
  amount?: number | null;
  count?: number | null;
  blocking?: boolean;
};

/** Parse FastAPI 403 detail — string (legacy) or structured login gate object. */
export function parseLoginGateDetail(body: unknown): LoginGateDetail | null {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === 'string') {
    return { code: 'message', message: detail };
  }
  if (detail && typeof detail === 'object' && 'message' in detail && 'code' in detail) {
    const gate = detail as LoginGateDetail;
    return {
      code: String(gate.code),
      message: String(gate.message),
      action: gate.action ?? null,
      amount: typeof gate.amount === 'number' ? gate.amount : null,
      count: typeof gate.count === 'number' ? gate.count : null,
      blocking: gate.blocking,
    };
  }
  return null;
}

/** Soft gates after a successful login — unread first, then ledger dues. */
export function primarySoftGate(gates: LoginGate[] | undefined | null): LoginGate | null {
  if (!gates?.length) return null;
  return gates.find((g) => g.code === 'unread_messages') ?? gates.find((g) => g.code === 'ledger_due') ?? gates[0];
}

export function viewForGate(gate: LoginGate | null): AppView | null {
  if (!gate?.redirect_view) return null;
  return resolveView(gate.redirect_view);
}
