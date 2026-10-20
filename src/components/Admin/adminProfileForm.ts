import type {
  AdminMemberApi,
  AdminMembershipFieldsPayload,
  AdminVisibilityFieldsPayload,
} from '../../api/types';

export type MemberRole = 'Super Admin' | 'Admin' | 'Mentor' | 'MLA' | 'Counselor';

export type CreateRole = MemberRole;

export type AdminAccountFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: '' | CreateRole;
};

export type AdminMembershipFormState = {
  mentoredById: string;
  mlaType: string;
  masType: SubscriptionTier;
  billing: string;
  doj: string;
  expiryDate: string;
  opBal: string;
};

export type AdminVisibilityFormState = {
  mrp: 'Show' | 'Hide';
  branding: string;
  misTraining: string;
  adminById: string;
  remarks: string;
  certified: boolean;
  competencyExpiry: string;
};

export type AdminEditFormState = AdminMembershipFormState &
  AdminVisibilityFormState & {
    status: 'Active' | 'Invited' | 'Disabled' | 'Suspended';
    role: MemberRole;
  };

export type MentorOption = {
  id: string;
  name: string;
  role: string;
};

export type SubscriptionTier = 'Gold' | 'Diamond' | 'Platinum' | 'Ultima';

export const tierBilling: Record<SubscriptionTier, string> = {
  Gold: '30',
  Diamond: '25',
  Platinum: '20',
  Ultima: '16',
};

/** Strip non-digits for admin billing input (stores/shows number only, no %). */
export function parseBillingDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

/** Billing slabs are exactly 40%, exactly 30%, or a typed value below 30%. */
export function billingSlabError(value: string): string | null {
  const digits = parseBillingDigits(value);
  if (!digits) return 'Enter the billing % (40%, 30%, or a value below 30%).';
  const percent = Number(digits);
  if (percent === 40 || percent === 30 || percent < 30) return null;
  return 'Billing % must be 40%, 30%, or below 30%.';
}

export function billingDigitsForForm(value: string | null | undefined, fallback: string): string {
  const digits = parseBillingDigits(value ?? '');
  return digits || fallback;
}

export const subscriptionTierOptions: SubscriptionTier[] = ['Gold', 'Diamond', 'Platinum', 'Ultima'];
export const brandingOptions = ['MBA', 'CBA', 'OBA'] as const;
const baseRoleOptions: MemberRole[] = ['Admin', 'Mentor', 'MLA', 'Counselor'];

/** Only a Super Admin can grant the Super Admin role; keep it listed when the member already has it. */
export function roleOptionsFor(viewerIsSuperAdmin: boolean, current?: string): MemberRole[] {
  return viewerIsSuperAdmin || current === 'Super Admin' ? ['Super Admin', ...baseRoleOptions] : baseRoleOptions;
}
export const mlaTypeOptions = ['Consultant', 'Life Coach', 'Expert'] as const;

/** MLAs and counselors always work under a mentor. */
export function roleNeedsMentor(role: string): boolean {
  return role === 'MLA' || role === 'Counselor';
}

export const emptyAccountForm: AdminAccountFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: '',
};

/** Required fields for the create form are filled (format checks still run on submit). */
export function createFormFilled(account: AdminAccountFormState, membership: AdminMembershipFormState): boolean {
  const name = account.name.trim();
  const phone = account.phone.trim();
  const billing = parseBillingDigits(membership.billing);
  if (!account.role || !name || !phone || !billing) return false;
  if (!account.email.trim() || !account.password) return false;
  if (account.role === 'MLA' && !membership.mlaType) return false;
  return !roleNeedsMentor(account.role) || Boolean(membership.mentoredById);
}

export const emptyMembershipForm: AdminMembershipFormState = {
  mentoredById: '',
  mlaType: '',
  masType: 'Gold',
  billing: tierBilling.Gold,
  doj: '',
  expiryDate: '',
  opBal: '',
};

export const emptyVisibilityForm: AdminVisibilityFormState = {
  mrp: 'Show',
  branding: '',
  misTraining: '',
  adminById: '',
  remarks: '',
  certified: false,
  competencyExpiry: '',
};

function asTier(value: string): SubscriptionTier {
  if (value === 'Gold' || value === 'Diamond' || value === 'Platinum' || value === 'Ultima') return value;
  return 'Gold';
}

export function memberToMembershipForm(member: AdminMemberApi): AdminMembershipFormState {
  return {
    mentoredById: member.mentored_by_id ? String(member.mentored_by_id) : '',
    mlaType: member.mla_type ?? '',
    masType: asTier(member.mas_type || 'Gold'),
    billing: billingDigitsForForm(member.billing, tierBilling.Gold),
    doj: member.doj ?? '',
    expiryDate: member.expiry_date ?? '',
    opBal: member.op_bal != null ? String(member.op_bal) : '',
  };
}

export function memberToVisibilityForm(member: AdminMemberApi): AdminVisibilityFormState {
  return {
    mrp: member.mrp === 'Hide' ? 'Hide' : 'Show',
    branding: member.branding ?? '',
    misTraining: member.mis_training ?? '',
    adminById: member.admin_by_id ? String(member.admin_by_id) : '',
    remarks: member.remarks ?? '',
    certified: member.certified ?? false,
    competencyExpiry: member.competency_expiry ?? '',
  };
}

export function memberDisplayRole(member: Pick<AdminMemberApi, 'role' | 'mentee_type'>): MemberRole {
  if (member.role === 'MLA' || (member.mentee_type || '').toLowerCase() === 'mla') return 'MLA';
  if (member.role === 'Super Admin' || member.role === 'Admin' || member.role === 'Mentor') return member.role;
  return 'Counselor';
}

export function memberToEditForm(member: AdminMemberApi): AdminEditFormState {
  return {
    ...memberToMembershipForm(member),
    ...memberToVisibilityForm(member),
    role: memberDisplayRole(member),
    status:
      member.status === 'Disabled'
        ? 'Disabled'
        : member.status === 'Suspended'
          ? 'Suspended'
          : member.status === 'Invited'
            ? 'Invited'
            : 'Active',
  };
}

export function membershipFormToPayload(form: AdminMembershipFormState): AdminMembershipFieldsPayload {
  const payload: AdminMembershipFieldsPayload = {
    mas_type: form.masType,
    billing: parseBillingDigits(form.billing) || undefined,
  };
  if (form.mentoredById) payload.mentored_by_id = Number(form.mentoredById);
  if (form.doj) payload.doj = form.doj;
  if (form.expiryDate) payload.expiry_date = form.expiryDate;
  if (form.opBal.trim()) payload.op_bal = Number(form.opBal);
  if (form.mlaType) payload.mla_type = form.mlaType;
  return payload;
}

export function editMembershipFormToPayload(form: AdminEditFormState): AdminMembershipFieldsPayload {
  return {
    ...membershipFormToPayload(form),
    role: form.role,
    mla_type: form.role === 'MLA' ? form.mlaType : '',
  };
}

export function visibilityFormToPayload(form: AdminVisibilityFormState): AdminVisibilityFieldsPayload {
  return {
    mrp: form.mrp,
    branding: form.branding.trim() || undefined,
    mis_training: form.misTraining.trim() || undefined,
    admin_by_id: form.adminById ? Number(form.adminById) : undefined,
    remarks: form.remarks.trim() || undefined,
    certified: form.certified,
    competency_expiry: form.competencyExpiry || null,
  };
}
