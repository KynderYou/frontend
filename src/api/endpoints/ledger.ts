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
  expenses_by_month: [
    { month: 1, label: 'Jan', value: 0 },
    { month: 2, label: 'Feb', value: 0 },
    { month: 3, label: 'Mar', value: 0 },
    { month: 4, label: 'Apr', value: 0 },
    { month: 5, label: 'May', value: 0 },
    { month: 6, label: 'Jun', value: 0 },
    { month: 7, label: 'Jul', value: 0 },
    { month: 8, label: 'Aug', value: 0 },
    { month: 9, label: 'Sep', value: 0 },
    { month: 10, label: 'Oct', value: 0 },
    { month: 11, label: 'Nov', value: 0 },
    { month: 12, label: 'Dec', value: 0 },
  ],
  billing_window_days: 30,
  expenses_year: new Date().getFullYear(),
  available_balance: 0,
  available_balance_display: '₹0',
};

/** GET /api/ledger/me */
export async function getMyLedger(
  signal?: AbortSignal,
  range: { start?: string; end?: string } = {},
): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    return emptyLedger;
  }
  const params = new URLSearchParams();
  if (range.start) params.set('start', range.start);
  if (range.end) params.set('end', range.end);
  const query = params.toString();
  return apiClient<LedgerData>(`/api/ledger/me${query ? `?${query}` : ''}`, { signal });
}

/** POST /api/ledger/company/funds — Admin adds money to the shared company ledger */
export async function addCompanyFunds(amount: string): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    throw new Error('Adding funds is not available in demo mode');
  }
  return apiClient<LedgerData>('/api/ledger/company/funds', { method: 'POST', body: { amount } });
}

export type CompanyEntryKind = 'receipt' | 'expense';

/** POST /api/ledger/company/entries — Admin records a receipt or expense on the company ledger */
export async function addCompanyEntry(kind: CompanyEntryKind, title: string, amount: string): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    throw new Error('Adding entries is not available in demo mode');
  }
  return apiClient<LedgerData>('/api/ledger/company/entries', { method: 'POST', body: { kind, title, amount } });
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
