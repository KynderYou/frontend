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
};

/** GET /api/ledger/me */
export async function getMyLedger(signal?: AbortSignal): Promise<LedgerData> {
  if (isDemoToken(getToken())) {
    return emptyLedger;
  }
  return apiClient<LedgerData>('/api/ledger/me', { signal });
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
