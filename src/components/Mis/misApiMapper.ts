import type { MisNetworkStateApi, MisScansPageApi } from '../../api/types';
import type {
  Contributor,
  MlaMember,
  MonthPoint,
  NetworkScan,
  NetworkYear,
  NetworkYearSnapshot,
  PerformanceRow,
} from './misData';

export function mapMisNetwork(state: MisNetworkStateApi): NetworkYearSnapshot {
  const mapPoints = (points: MisNetworkStateApi['scans_by_month']): MonthPoint[] =>
    points.map((point) => ({
      month: point.month,
      label: point.label,
      value: point.value,
      contributors: point.contributors.map(
        (c): Contributor => ({
          id: String(c.id),
          name: c.name,
          value: c.value,
        }),
      ),
    }));

  const performanceRows: PerformanceRow[] = state.performance_rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    region: row.region,
    scansQuarter: row.scans_quarter,
    scansYear: row.scans_year,
    reviews: row.reviews,
    billing: row.billing,
  }));

  const lowPerformers: PerformanceRow[] = state.low_performers.map((row) => ({
    id: String(row.id),
    name: row.name,
    region: row.region,
    scansQuarter: row.scans_quarter,
    scansYear: row.scans_year,
    reviews: row.reviews,
    billing: row.billing,
  }));

  return {
    year: state.year as NetworkYear,
    monthsSoFar: state.months_so_far,
    networkScans: [],
    scansByMonth: mapPoints(state.scans_by_month),
    reviewsByMonth: mapPoints(state.reviews_by_month),
    billingByMonth: mapPoints(state.billing_by_month),
    yearTotals: state.year_totals,
    performanceRows,
    lowPerformers,
    lastQuarterMonths: [],
    lastQuarterLabel: state.last_quarter_label,
    defaultMonth: state.default_month,
  };
}

export function mapMisScans(page: MisScansPageApi): {
  rows: NetworkScan[];
  mlaMembers: MlaMember[];
  total: number;
  year: number;
} {
  return {
    year: page.year,
    total: page.total,
    rows: page.rows.map((row) => ({
      scanId: row.scan_id,
      clientName: row.client_name,
      mlaId: String(row.mla_id),
      mlaName: row.mla_name,
      year: row.year,
      month: row.month,
      day: 1,
      uploadedAt: row.uploaded_at,
    })),
    mlaMembers: page.mla_options.map((mla) => ({
      id: String(mla.id),
      name: mla.name,
      region: mla.region,
    })),
  };
}

export function mapMisScanRows(page: MisScansPageApi): NetworkScan[] {
  return mapMisScans(page).rows;
}
