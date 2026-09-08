/** GBP report packages for the processing pipeline. */

export type ReportPlan = 'GBPAdult' | 'GBPBasic' | 'GBPB Plus';

export type ReportPackage = {
  id: ReportPlan;
  price: number;
  pages: number;
  mrp: string;
};

export const REPORT_PACKAGES: readonly ReportPackage[] = [
  { id: 'GBPAdult', price: 2000, pages: 4, mrp: '₹2,000' },
  { id: 'GBPBasic', price: 3000, pages: 6, mrp: '₹3,000' },
  { id: 'GBPB Plus', price: 4000, pages: 8, mrp: '₹4,000' },
] as const;

export const DEFAULT_REPORT_PLAN: ReportPlan = 'GBPAdult';

const LEGACY_PLAN_MAP: Record<string, ReportPlan> = {
  Standard: 'GBPAdult',
  Premium: 'GBPB Plus',
};

export function normalizeReportPlan(raw: string | null | undefined): ReportPlan {
  const value = (raw || '').trim();
  const match = REPORT_PACKAGES.find((pkg) => pkg.id === value);
  if (match) return match.id;
  return LEGACY_PLAN_MAP[value] ?? DEFAULT_REPORT_PLAN;
}

export function packageForPlan(raw: string | null | undefined): ReportPackage {
  const id = normalizeReportPlan(raw);
  return REPORT_PACKAGES.find((pkg) => pkg.id === id) ?? REPORT_PACKAGES[0];
}

export function packageForMrp(mrp: string | null | undefined): ReportPackage {
  const digits = (mrp || '').replace(/[^\d.]/g, '');
  const amount = digits ? Number(digits) : NaN;
  if (!Number.isFinite(amount)) return REPORT_PACKAGES[0];
  return REPORT_PACKAGES.find((pkg) => pkg.price === amount) ?? REPORT_PACKAGES[0];
}

export function higherPackages(currentPlan: string | null | undefined): ReportPackage[] {
  const current = packageForPlan(currentPlan);
  return REPORT_PACKAGES.filter((pkg) => pkg.price > current.price);
}

export function isTopPackage(plan: string | null | undefined): boolean {
  return packageForPlan(plan).id === REPORT_PACKAGES[REPORT_PACKAGES.length - 1].id;
}

export function upgradeDelta(currentPlan: string | null | undefined, targetPlan: ReportPlan): number {
  const current = packageForPlan(currentPlan);
  const target = packageForPlan(targetPlan);
  return Math.max(0, target.price - current.price);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
