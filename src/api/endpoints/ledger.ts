import { apiClient, apiUpload } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { LedgerData } from '../types';

const emptyLedger: LedgerData = {
  kpis: {
    total_receipts: 0,
    billing_last_30_days: 0,
    receipts_display: '₹0',
    billing_display: '₹0',
  },
  receipts: [],
  billing: [],
  billing_window_days: 30,
  available_balance: 0,
  available_balance_display: '₹0',
};

/** GET /api/ledger/me */
export async function getMyLedger(
  signal?: AbortSignal,
  range: { start?: string; end?: string; adminId?: number; memberId?: number } = {},
): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    return emptyLedger;
  }
  const params = new URLSearchParams();
  if (range.start) params.set('start', range.start);
  if (range.adminId) params.set('admin_id', String(range.adminId));
  if (range.memberId) params.set('member_id', String(range.memberId));
  if (range.end) params.set('end', range.end);
  const query = params.toString();
  return apiClient<LedgerData>(`/api/ledger/me${query ? `?${query}` : ''}`, { signal });
}

/** POST /api/ledger/company/funds — Admin adds money to the shared company ledger */
export async function addCompanyFunds(amount: string, adminId?: number): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    throw new Error('Adding funds is not available in demo mode');
  }
  return apiClient<LedgerData>('/api/ledger/company/funds', { method: 'POST', body: { amount, admin_id: adminId } });
}

export type CompanyEntryKind = 'receipt' | 'expense';

/** POST /api/ledger/company/entries — Admin records a receipt or expense on the company ledger */
export async function addCompanyEntry(
  kind: CompanyEntryKind,
  title: string,
  amount: string,
  adminId?: number,
): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    throw new Error('Adding entries is not available in demo mode');
  }
  return apiClient<LedgerData>('/api/ledger/company/entries', { method: 'POST', body: { kind, title, amount, admin_id: adminId } });
}

/** POST /api/ledger/topup */
export async function submitLedgerTopUp(amount: string, proof: File): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    throw new Error('Top up not available in demo mode');
  }
  const formData = new FormData();
  formData.append('amount', amount);
  formData.append('proof', proof);
  return apiUpload<LedgerData>('/api/ledger/topup', formData);
}
