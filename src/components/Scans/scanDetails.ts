import type { ScanDetails } from './scanTypes';

export const CLIENT_TYPE_INDIVIDUAL = 'Individual';
export const CLIENT_TYPE_FAMILY = 'Family (phone required)';

export const clientTypeOptions = [CLIENT_TYPE_INDIVIDUAL, CLIENT_TYPE_FAMILY] as const;
export const BASE_REFERRED_BY = ['SELF', 'MLA', 'HO', 'Referral'] as const;
export const genderOptions = ['Male', 'Female', 'Other'] as const;

export function normalizeClientType(value: string): string {
  const raw = value.trim();
  if (!raw) return CLIENT_TYPE_INDIVIDUAL;
  const lower = raw.toLowerCase();
  if (lower === 'individual' || lower === 'personal' || lower === 'private') {
    return CLIENT_TYPE_INDIVIDUAL;
  }
  if (
    lower.startsWith('family') ||
    lower === 'institution' ||
    lower === 'bulk' ||
    lower === 'business' ||
    lower === 'corporate' ||
    lower === 'company'
  ) {
    return CLIENT_TYPE_FAMILY;
  }
  if (clientTypeOptions.includes(raw as (typeof clientTypeOptions)[number])) return raw;
  return CLIENT_TYPE_INDIVIDUAL;
}

export function phoneRequiredFor(clientType: string): boolean {
  return normalizeClientType(clientType) === CLIENT_TYPE_FAMILY;
}

export const MIN_AGE = 1;
export const MAX_AGE = 100;

export function isValidAge(age: string): boolean {
  const value = age.trim();
  if (!/^\d{1,3}$/.test(value)) return false;
  const n = Number(value);
  return n >= MIN_AGE && n <= MAX_AGE;
}

export function scanDetailsComplete(details: ScanDetails): boolean {
  return (
    details.name.trim().length > 0 &&
    isValidAge(details.age) &&
    details.gender.trim().length > 0 &&
    details.mrp.trim().length > 0 &&
    (!phoneRequiredFor(details.clientType) || details.phone.trim().length > 0)
  );
}
