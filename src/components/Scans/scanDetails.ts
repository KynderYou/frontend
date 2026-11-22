import type { ScanDetails } from './scanTypes';

export const CLIENT_TYPE_INDIVIDUAL = 'Individual';
export const CLIENT_TYPE_FAMILY = 'Family';

export const clientTypeOptions = [CLIENT_TYPE_INDIVIDUAL, CLIENT_TYPE_FAMILY] as const;
export const BASE_REFERRED_BY = ['SELF', 'MLA', 'HO', 'Referral'] as const;
export const genderOptions = ['Male', 'Female', 'Other'] as const;

export type HasClientMobile = 'yes' | 'no' | '';

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

/** @deprecated Phone is optional via Yes/No; kept for call-site compatibility. */
export function brandingRequiresPhone(_branding: string | null | undefined): boolean {
  return false;
}

/** Phone is required only when the user said they have the client's mobile. */
export function phoneRequiredFor(hasClientMobile: HasClientMobile | boolean): boolean {
  return hasClientMobile === true || hasClientMobile === 'yes';
}

export function hasClientMobileFromPhone(phone: string): HasClientMobile {
  return phone.trim().length > 0 ? 'yes' : '';
}

export const MIN_AGE = 1;
export const MAX_AGE = 100;

export function isValidAge(age: string): boolean {
  const value = age.trim();
  if (!/^\d{1,3}$/.test(value)) return false;
  const n = Number(value);
  return n >= MIN_AGE && n <= MAX_AGE;
}

/** Labels (as shown on the form) of the client details still missing; empty when complete. */
export function missingScanDetails(details: ScanDetails, hasClientMobile: HasClientMobile = ''): string[] {
  const missing: string[] = [];
  if (!details.name.trim()) missing.push('Name');
  if (!isValidAge(details.age)) missing.push('Age');
  if (!details.gender.trim()) missing.push('Gender');
  if (hasClientMobile !== 'yes' && hasClientMobile !== 'no') missing.push('Client mobile number?');
  else if (hasClientMobile === 'yes' && !details.phone.trim()) missing.push('Mobile number');
  if (!details.mrp.trim()) missing.push('Report package');
  return missing;
}

export function scanDetailsComplete(details: ScanDetails, hasClientMobile: HasClientMobile = ''): boolean {
  return missingScanDetails(details, hasClientMobile).length === 0;
}
