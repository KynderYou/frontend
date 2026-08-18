import type { DashboardData, TopPerformer } from './types';

export const emptyDashboard: DashboardData = {
  kpis: {
    scans_this_year: 0,
    scans_total: 0,
    billing_this_year: null,
    billing_total: null,
  },
};

export function demoDashboard(): DashboardData {
  return emptyDashboard;
}

export function demoTopPerformers(): TopPerformer[] {
  return [];
}
