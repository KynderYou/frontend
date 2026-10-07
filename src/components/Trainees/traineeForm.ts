import { isApiError } from '../../api/errors';
import type { TraineeApi, TraineePayload } from '../../api/types';
import { billingSlabError, parseBillingDigits, tierBilling, type SubscriptionTier } from '../Admin/adminProfileForm';

export type TraineeFormState = {
  name: string;
  email: string;
  phone: string;
  mentorId: string;
  subscription: SubscriptionTier;
  billing: string;
  doj: string;
  expiryDate: string;
  status: 'Active' | 'Inactive';
  remarks: string;
};

export const emptyTraineeForm: TraineeFormState = {
  name: '',
  email: '',
  phone: '',
  mentorId: '',
  subscription: 'Gold',
  billing: tierBilling.Gold,
  doj: '',
  expiryDate: '',
  status: 'Active',
  remarks: '',
};

function asTier(value: string | undefined): SubscriptionTier {
  if (value === 'Diamond' || value === 'Platinum' || value === 'Ultima') return value;
  return 'Gold';
}

export function traineeToForm(trainee: TraineeApi): TraineeFormState {
  return {
    name: trainee.name,
    email: trainee.email === '—' ? '' : trainee.email,
    phone: trainee.phone ?? '',
    mentorId: String(trainee.mentor_id),
    subscription: asTier(trainee.subscription),
    billing: String(trainee.billing_percent ?? tierBilling.Gold),
    doj: trainee.doj_iso ?? '',
    expiryDate: trainee.expiry_iso ?? '',
    status: trainee.status === 'Inactive' ? 'Inactive' : 'Active',
    remarks: trainee.remarks ?? '',
  };
}

/** Returns an error message, or null when the form can be submitted. */
export function validateTraineeForm(form: TraineeFormState): string | null {
  if (!form.name.trim()) return 'Enter the trainee name.';
  if (!form.phone.trim()) return 'Enter a phone number.';
  if (!/^[0-9+\-\s]{7,16}$/.test(form.phone.trim())) return 'Enter a valid phone number.';
  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email or leave it blank.';
  if (!form.mentorId) return 'Select the mentor this trainee works under.';
  const billingError = billingSlabError(form.billing);
  if (billingError) return billingError;
  if (form.doj && form.expiryDate && form.expiryDate < form.doj) return 'Expiry date must be after date of joining.';
  return null;
}

export function traineeErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.body && typeof err.body === 'object' && 'detail' in err.body) {
    const detail = (err.body as { detail: unknown }).detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
}

export function traineeFormToPayload(form: TraineeFormState): TraineePayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase() || undefined,
    mentor_id: Number(form.mentorId),
    subscription: form.subscription,
    billing_percent: Number(parseBillingDigits(form.billing) || 0),
    doj: form.doj || undefined,
    expiry_date: form.expiryDate || undefined,
    status: form.status,
    remarks: form.remarks.trim() || undefined,
  };
}
