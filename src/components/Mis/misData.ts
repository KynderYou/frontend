/**
 * Mock MIS data — scan database, monthly network aggregates, and member performance.
 * Replace with API/Postgres reads once the MIS endpoints exist.
 */

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const NETWORK_YEARS = [2026, 2025, 2024] as const;
export type NetworkYear = (typeof NETWORK_YEARS)[number];

/** Latest working year in the mock dataset */
export const NETWORK_YEAR: NetworkYear = NETWORK_YEARS[0];

export type MlaMember = {
  id: string;
  name: string;
  region: string;
};

export const mlaMembers: MlaMember[] = [
  { id: 'mla-madhu', name: 'Madhu Sharma', region: 'Chennai HO' },
  { id: 'mla-priya', name: 'Priya Nair', region: 'Kerala' },
  { id: 'mla-arjun', name: 'Arjun Dev', region: 'Coimbatore' },
  { id: 'mla-rathina', name: 'Rathinaswamy A', region: 'Tamil Nadu' },
  { id: 'mla-riya', name: 'Riya Saravanan', region: 'Chennai' },
  { id: 'mla-suresh', name: 'Suresh Kumar', region: 'Bangalore' },
  { id: 'mla-lakshmi', name: 'Lakshmi Venkat', region: 'Hyderabad' },
  { id: 'mla-gopal', name: 'Gopal Menon', region: 'Kerala' },
  { id: 'mla-neha', name: 'Neha Gupta', region: 'Mumbai' },
  { id: 'mla-karthik', name: 'Karthik Reddy', region: 'Andhra Pradesh' },
];

export type NetworkScan = {
  scanId: string;
  clientName: string;
  mlaId: string;
  mlaName: string;
  year: number;
  /** Month index 0-11 within year */
  month: number;
  day: number;
  uploadedAt: string;
};

const clientNames = [
  'Rudra Vij',
  'Aarav Menon',
  'Diya Krishnan',
  'Ishaan Reddy',
  'Meera Iyer',
  'Kabir Nair',
  'Ananya Pillai',
  'Vivaan Sharma',
  'Sara Thomas',
  'Advik Rao',
  'Nithya Balan',
  'Rohan Desai',
  'Tara Menon',
  'Aditya Varma',
  'Kavya Subramanian',
  'Dhruv Joshi',
  'Sneha Ravi',
  'Arnav Kulkarni',
  'Lakshmi Priya',
  'Vikram Bhat',
  'Riya Saravanan',
  'Harish Kumar',
  'Divya Menon',
  'Siddharth Naik',
  'Pooja Shetty',
];

/** Deterministic pseudo-random so the mock table is stable across renders */
function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

/** Relative scan volume per MLA — creates clear top and low performers */
const mlaWeights: Record<string, number> = {
  'mla-madhu': 5,
  'mla-priya': 4,
  'mla-arjun': 3,
  'mla-rathina': 4,
  'mla-riya': 2,
  'mla-suresh': 3,
  'mla-lakshmi': 2,
  'mla-gopal': 1,
  'mla-neha': 1,
  'mla-karthik': 1,
};

function monthsForYear(year: number): number {
  if (year === NETWORK_YEARS[0]) return 7;
  return 12;
}

function buildScansForYear(year: number): NetworkScan[] {
  const monthsSoFar = monthsForYear(year);
  const random = makeRandom(year * 997 + 20260725);
  const weighted: MlaMember[] = mlaMembers.flatMap((mla) =>
    Array.from({ length: mlaWeights[mla.id] ?? 1 }, () => mla)
  );

  const scans: NetworkScan[] = [];
  let counter = 40000 + year * 100;

  for (let month = 0; month < monthsSoFar; month += 1) {
    const yearScale = year === NETWORK_YEARS[0] ? 1 : year === NETWORK_YEARS[1] ? 0.88 : 0.72;
    const monthlyCount = Math.max(8, Math.floor((18 + month * 3 + Math.floor(random() * 9)) * yearScale));

    for (let i = 0; i < monthlyCount; i += 1) {
      const mla = weighted[Math.floor(random() * weighted.length)];
      const clientName = clientNames[Math.floor(random() * clientNames.length)];
      const day = 1 + Math.floor(random() * 28);
      counter += 1;

      scans.push({
        scanId: `S${counter}`,
        clientName,
        mlaId: mla.id,
        mlaName: mla.name,
        year,
        month,
        day,
        uploadedAt: `${String(day).padStart(2, '0')} ${MONTH_LABELS[month]} ${year}`,
      });
    }
  }

  return scans.sort((a, b) => (b.month - a.month) || (b.day - a.day));
}

export const allNetworkScans: NetworkScan[] = NETWORK_YEARS.flatMap((year) => buildScansForYear(year));

/** Default scan list for the MIS scans page (current year) */
export const networkScans: NetworkScan[] = allNetworkScans.filter((scan) => scan.year === NETWORK_YEAR);

export type Contributor = {
  id: string;
  name: string;
  value: number;
};

export type MonthPoint = {
  month: number;
  label: string;
  value: number;
  contributors: Contributor[];
};

function toContributors(counts: Map<string, number>): Contributor[] {
  return [...counts.entries()]
    .map(([id, value]) => ({
      id,
      name: mlaMembers.find((m) => m.id === id)?.name ?? id,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildScansByMonth(scans: NetworkScan[], monthsSoFar: number): MonthPoint[] {
  return MONTH_LABELS.map((label, month) => {
    if (month >= monthsSoFar) {
      return { month, label, value: 0, contributors: [] };
    }

    const monthScans = scans.filter((scan) => scan.month === month);
    const counts = new Map<string, number>();
    monthScans.forEach((scan) => counts.set(scan.mlaId, (counts.get(scan.mlaId) ?? 0) + 1));

    return {
      month,
      label,
      value: monthScans.length,
      contributors: toContributors(counts),
    };
  });
}

function buildReviewsByMonth(year: number, monthsSoFar: number): MonthPoint[] {
  const random = makeRandom(year * 778899);
  return MONTH_LABELS.map((label, month) => {
    if (month >= monthsSoFar) {
      return { month, label, value: 0, contributors: [] };
    }

    const counts = new Map<string, number>();
    const total = 5 + Math.floor(random() * 14);
    for (let i = 0; i < total; i += 1) {
      const mla = mlaMembers[Math.floor(random() * mlaMembers.length)];
      counts.set(mla.id, (counts.get(mla.id) ?? 0) + 1);
    }

    return { month, label, value: total, contributors: toContributors(counts) };
  });
}

function buildBillingByMonth(scansByMonth: MonthPoint[]): MonthPoint[] {
  const perScan = 1800;
  return scansByMonth.map((point) => {
    const counts = new Map<string, number>();
    point.contributors.forEach((c) => counts.set(c.id, c.value * perScan));

    return {
      month: point.month,
      label: point.label,
      value: point.value * perScan,
      contributors: toContributors(counts),
    };
  });
}

export type PerformanceRow = {
  id: string;
  name: string;
  region: string;
  scansQuarter: number;
  scansYear: number;
  reviews: number;
  billing: number;
};

export const LOW_PERFORMER_THRESHOLD = 10;

function lastQuarterMonthsForYear(year: number): number[] {
  const monthsSoFar = monthsForYear(year);
  return [monthsSoFar - 3, monthsSoFar - 2, monthsSoFar - 1];
}

function buildPerformanceRows(
  yearScans: NetworkScan[],
  reviewsByMonth: MonthPoint[],
  lastQuarterMonths: number[]
): PerformanceRow[] {
  return mlaMembers
    .map((mla) => {
      const scansYear = yearScans.filter((scan) => scan.mlaId === mla.id).length;
      const scansQuarter = yearScans.filter(
        (scan) => scan.mlaId === mla.id && lastQuarterMonths.includes(scan.month)
      ).length;
      const reviews = reviewsByMonth.reduce(
        (sum, point) => sum + (point.contributors.find((c) => c.id === mla.id)?.value ?? 0),
        0
      );

      return {
        id: mla.id,
        name: mla.name,
        region: mla.region,
        scansQuarter,
        scansYear,
        reviews,
        billing: scansYear * 1800,
      };
    })
    .sort((a, b) => b.scansYear - a.scansYear);
}

export type NetworkYearSnapshot = {
  year: NetworkYear;
  monthsSoFar: number;
  networkScans: NetworkScan[];
  scansByMonth: MonthPoint[];
  reviewsByMonth: MonthPoint[];
  billingByMonth: MonthPoint[];
  yearTotals: { scans: number; reviews: number; billing: number };
  performanceRows: PerformanceRow[];
  lowPerformers: PerformanceRow[];
  lastQuarterMonths: number[];
  lastQuarterLabel: string;
  defaultMonth: number;
};

export function getNetworkYearSnapshot(year: NetworkYear): NetworkYearSnapshot {
  const monthsSoFar = monthsForYear(year);
  const yearScans = allNetworkScans.filter((scan) => scan.year === year);
  const scansByMonth = buildScansByMonth(yearScans, monthsSoFar);
  const reviewsByMonth = buildReviewsByMonth(year, monthsSoFar);
  const billingByMonth = buildBillingByMonth(scansByMonth);
  const lastQuarterMonths = lastQuarterMonthsForYear(year);
  const lastQuarterLabel = lastQuarterMonths.map((m) => MONTH_LABELS[m]).join(' – ');
  const performanceRows = buildPerformanceRows(yearScans, reviewsByMonth, lastQuarterMonths);
  const lowPerformers = performanceRows
    .filter((row) => row.scansQuarter < LOW_PERFORMER_THRESHOLD)
    .sort((a, b) => a.scansQuarter - b.scansQuarter);

  const defaultMonth = Math.max(0, scansByMonth.filter((p) => p.value > 0).length - 1);

  return {
    year,
    monthsSoFar,
    networkScans: yearScans,
    scansByMonth,
    reviewsByMonth,
    billingByMonth,
    yearTotals: {
      scans: scansByMonth.reduce((sum, p) => sum + p.value, 0),
      reviews: reviewsByMonth.reduce((sum, p) => sum + p.value, 0),
      billing: billingByMonth.reduce((sum, p) => sum + p.value, 0),
    },
    performanceRows,
    lowPerformers,
    lastQuarterMonths,
    lastQuarterLabel,
    defaultMonth,
  };
}

/** Backward-compatible exports for the current year */
const currentYearSnapshot = getNetworkYearSnapshot(NETWORK_YEAR);

export const scansByMonth = currentYearSnapshot.scansByMonth;
export const reviewsByMonth = currentYearSnapshot.reviewsByMonth;
export const billingByMonth = currentYearSnapshot.billingByMonth;
export const yearTotals = currentYearSnapshot.yearTotals;
export const performanceRows = currentYearSnapshot.performanceRows;
export const lowPerformers = currentYearSnapshot.lowPerformers;
export const LAST_QUARTER_MONTHS = currentYearSnapshot.lastQuarterMonths;
export const LAST_QUARTER_LABEL = currentYearSnapshot.lastQuarterLabel;

export function formatMoney(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatCompactMoney(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}
