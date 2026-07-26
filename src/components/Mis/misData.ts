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

export const NETWORK_YEAR = 2026;

/** Scans only exist up to the current working month in the mock year */
const MONTHS_SO_FAR = 7;

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
  /** Month index 0-11 within NETWORK_YEAR */
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

function buildScans(): NetworkScan[] {
  const random = makeRandom(20260725);
  const weighted: MlaMember[] = mlaMembers.flatMap((mla) =>
    Array.from({ length: mlaWeights[mla.id] ?? 1 }, () => mla)
  );

  const scans: NetworkScan[] = [];
  let counter = 42100;

  for (let month = 0; month < MONTHS_SO_FAR; month += 1) {
    // Volume ramps up over the year with some month-to-month noise
    const monthlyCount = 18 + month * 3 + Math.floor(random() * 9);

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
        month,
        day,
        uploadedAt: `${String(day).padStart(2, '0')} ${MONTH_LABELS[month]} ${NETWORK_YEAR}`,
      });
    }
  }

  return scans.sort((a, b) => (b.month - a.month) || (b.day - a.day));
}

export const networkScans: NetworkScan[] = buildScans();

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

/** Scans per month across the whole network, with per-MLA contributions */
export const scansByMonth: MonthPoint[] = MONTH_LABELS.map((label, month) => {
  const monthScans = networkScans.filter((scan) => scan.month === month);
  const counts = new Map<string, number>();
  monthScans.forEach((scan) => counts.set(scan.mlaId, (counts.get(scan.mlaId) ?? 0) + 1));

  return {
    month,
    label,
    value: monthScans.length,
    contributors: toContributors(counts),
  };
});

/** Reviews + testimonials received per month (was "team efficiency" in the reference) */
export const reviewsByMonth: MonthPoint[] = (() => {
  const random = makeRandom(778899);
  return MONTH_LABELS.map((label, month) => {
    if (month >= MONTHS_SO_FAR) {
      return { month, label, value: 0, contributors: [] };
    }

    const counts = new Map<string, number>();
    const total = 6 + Math.floor(random() * 12);
    for (let i = 0; i < total; i += 1) {
      const mla = mlaMembers[Math.floor(random() * mlaMembers.length)];
      counts.set(mla.id, (counts.get(mla.id) ?? 0) + 1);
    }

    return { month, label, value: total, contributors: toContributors(counts) };
  });
})();

/** Network billing per month in rupees, split by contributing MLA */
export const billingByMonth: MonthPoint[] = scansByMonth.map((point) => {
  const perScan = 1800;
  const counts = new Map<string, number>();
  point.contributors.forEach((c) => counts.set(c.id, c.value * perScan));

  return {
    month: point.month,
    label: point.label,
    value: point.value * perScan,
    contributors: toContributors(counts),
  };
});

export type PerformanceRow = {
  id: string;
  name: string;
  region: string;
  scansQuarter: number;
  scansYear: number;
  reviews: number;
  billing: number;
};

/** Last quarter = the 3 most recent months with data */
export const LAST_QUARTER_MONTHS = [MONTHS_SO_FAR - 3, MONTHS_SO_FAR - 2, MONTHS_SO_FAR - 1];

export const LAST_QUARTER_LABEL = LAST_QUARTER_MONTHS.map((m) => MONTH_LABELS[m]).join(' – ');

export const LOW_PERFORMER_THRESHOLD = 10;

export const performanceRows: PerformanceRow[] = mlaMembers
  .map((mla) => {
    const scansYear = networkScans.filter((scan) => scan.mlaId === mla.id).length;
    const scansQuarter = networkScans.filter(
      (scan) => scan.mlaId === mla.id && LAST_QUARTER_MONTHS.includes(scan.month)
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

export const lowPerformers: PerformanceRow[] = performanceRows
  .filter((row) => row.scansQuarter < LOW_PERFORMER_THRESHOLD)
  .sort((a, b) => a.scansQuarter - b.scansQuarter);

export function formatMoney(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatCompactMoney(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}

export const yearTotals = {
  scans: scansByMonth.reduce((sum, p) => sum + p.value, 0),
  reviews: reviewsByMonth.reduce((sum, p) => sum + p.value, 0),
  billing: billingByMonth.reduce((sum, p) => sum + p.value, 0),
};
