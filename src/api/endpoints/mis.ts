import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { MisNetworkStateApi, MisScansPageApi } from '../types';

/** GET /api/mis/network */
export async function getMisNetwork(year: number, signal?: AbortSignal): Promise<MisNetworkStateApi> {
  if (isDemoToken(getToken())) {
    return {
      year,
      months_so_far: 0,
      default_month: 0,
      last_quarter_label: '',
      low_performer_threshold: 10,
      year_totals: { scans: 0, reviews: 0, billing: 0 },
      scans_by_month: [],
      reviews_by_month: [],
      billing_by_month: [],
      performance_rows: [],
      low_performers: [],
    };
  }
  return apiClient<MisNetworkStateApi>(`/api/mis/network?year=${year}`, { signal });
}

type MisScansQuery = {
  year?: number;
  page?: number;
  pageSize?: number;
  mlaId?: number;
  month?: number;
  q?: string;
};

/** GET /api/mis/scans */
export async function getMisScans(query: MisScansQuery = {}, signal?: AbortSignal): Promise<MisScansPageApi> {
  if (isDemoToken(getToken())) {
    return { year: query.year ?? 2026, total: 0, page: 1, page_size: 12, rows: [], mla_options: [] };
  }
  const params = new URLSearchParams();
  params.set('year', String(query.year ?? 2026));
  params.set('page', String(query.page ?? 1));
  params.set('page_size', String(query.pageSize ?? 12));
  if (query.mlaId !== undefined) params.set('mla_id', String(query.mlaId));
  if (query.month !== undefined) params.set('month', String(query.month));
  if (query.q?.trim()) params.set('q', query.q.trim());
  return apiClient<MisScansPageApi>(`/api/mis/scans?${params.toString()}`, { signal });
}
