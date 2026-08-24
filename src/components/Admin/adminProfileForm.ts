import type {
  AdminMemberApi,
  AdminMembershipFieldsPayload,
  AdminVisibilityFieldsPayload,
} from '../../api/types';

export type SubscriptionTier = 'Gold' | 'Diamond' | 'Platinum' | 'Ultima';

export type AdminAccountFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: '' | 'MLA Member' | 'H.O Staff' | 'Counsellor' | 'Admin';
};

export type AdminMembershipFormState = {
  mentoredById: string;
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
  adminBy: string;
  remarks: string;
  certified: boolean;
};

export type MentorOption = {
  id: string;
  name: string;
  role: string;
};

export const tierBilling: Record<SubscriptionTier, string> = {
  Gold: '30%',
  Diamond: '25%',
  Platinum: '20%',
  Ultima: '16%',
};

export const subscriptionTierOptions: SubscriptionTier[] = ['Gold', 'Diamond', 'Platinum', 'Ultima'];
export const brandingOptions = ['MBA', 'CBA', 'OBA'] as const;
export const roleOptions = ['MLA Member', 'H.O Staff', 'Counsellor', 'Admin'] as const;

export const emptyAccountForm: AdminAccountFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: '',
};

export const emptyMembershipForm: AdminMembershipFormState = {
  mentoredById: '',
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
  adminBy: '',
  remarks: '',
  certified: false,
};

function asTier(value: string): SubscriptionTier {
  if (value === 'Gold' || value === 'Diamond' || value === 'Platinum' || value === 'Ultima') return value;
  return 'Gold';
}

export function memberToMembershipForm(member: AdminMemberApi): AdminMembershipFormState {
  return {
    mentoredById: member.mentored_by_id ? String(member.mentored_by_id) : '',
    masType: asTier(member.mas_type || 'Gold'),
    billing: member.billing || tierBilling.Gold,
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
    adminBy: member.admin_by ?? '',
    remarks: member.remarks ?? '',
    certified: member.certified ?? false,
  };
}

export function membershipFormToPayload(form: AdminMembershipFormState): AdminMembershipFieldsPayload {
  const payload: AdminMembershipFieldsPayload = {
    mas_type: form.masType,
    billing: form.billing.trim() || undefined,
  };
  if (form.mentoredById) payload.mentored_by_id = Number(form.mentoredById);
  if (form.doj) payload.doj = form.doj;
  if (form.expiryDate) payload.expiry_date = form.expiryDate;
  if (form.opBal.trim()) payload.op_bal = Number(form.opBal);
  return payload;
}

export function visibilityFormToPayload(form: AdminVisibilityFormState): AdminVisibilityFieldsPayload {
  return {
    mrp: form.mrp,
    branding: form.branding.trim() || undefined,
    mis_training: form.misTraining.trim() || undefined,
    admin_by: form.adminBy.trim() || undefined,
    remarks: form.remarks.trim() || undefined,
    certified: form.certified,
  };
}
