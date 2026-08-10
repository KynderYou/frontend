import type { DashboardData } from './types';

export const emptyDashboard: DashboardData = {
  kpis: {
    scans_this_year: 0,
    scans_total: 0,
    billing_this_year: null,
    billing_total: null,
  },
  notices: [],
  top_performers: [],
};

export function demoDashboard(): DashboardData {
  return emptyDashboard;
}
