import type { LoginResponse, Member, MemberProfile } from './types';

/** Local-only credentials for GitHub Pages / frontend-without-backend demos */
export const DEMO_EMAIL = 'admin@midna.com';
export const DEMO_PASSWORD = 'password123';

/** Marker stored in localStorage instead of a real JWT */
export const DEMO_TOKEN = 'demo:frontend-only';

export const demoMember: Member = {
  mid: 1,
  mail_id: DEMO_EMAIL,
  role: 'Admin',
  status: 'Active',
  name: 'Admin User',
};

export const demoProfile: MemberProfile = {
  mid: 1,
  mail_id: DEMO_EMAIL,
  role: 'Admin',
  status: 'Active',
  name: 'Admin User',
  mobile_1: '9000000000',
  mobile_2: '',
  dob: '1990-01-01',
  country: 'India',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  address: 'Midna Global Head Office',
  doj: '2024-01-01',
  mas_type: 'Gold',
  expiry_date: '2027-12-31',
  billing: 'Monthly',
  op_bal: 0,
  uid: 'DEMO-ADMIN',
  services: 'Scans, Reports, CAB',
  availability: 'Available',
  certified: true,
  cr_date: '2024-06-01',
  mrp: 'Show',
  branding: 'MBA',
  mis_training: 'Completed',
  mentored_by: '—',
  admin_by: 'System',
  remarks: 'Frontend-only demo account (no backend).',
  avatar_url: null,
};

export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_TOKEN;
}

export function matchesDemoCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function demoLoginResponse(): LoginResponse {
  return { token: DEMO_TOKEN, member: demoMember };
}
