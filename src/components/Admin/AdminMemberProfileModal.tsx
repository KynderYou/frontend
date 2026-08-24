import { useEffect, useState } from 'react';
import { updateAdminMemberMembership, updateAdminMemberVisibility } from '../../api';
import type { AdminMemberApi } from '../../api/types';
import { colors, spacing } from '../../styles/theme';
import { AdminMembershipBillingFields } from './AdminMembershipBillingFields';
import { AdminVisibilityAdminFields } from './AdminVisibilityAdminFields';
import {
  memberToMembershipForm,
  memberToVisibilityForm,
  membershipFormToPayload,
  visibilityFormToPayload,
  type AdminMembershipFormState,
  type AdminVisibilityFormState,
  type MentorOption,
} from './adminProfileForm';

const theme = colors.light;

type AdminMemberProfileModalProps = {
  open: boolean;
  member: AdminMemberApi | null;
  mentors: MentorOption[];
  onClose: () => void;
  onSaved: (member: AdminMemberApi) => void;
};

export function AdminMemberProfileModal({
  open,
  member,
  mentors,
  onClose,
  onSaved,
}: AdminMemberProfileModalProps) {
  const [membershipForm, setMembershipForm] = useState<AdminMembershipFormState>(() =>
    member ? memberToMembershipForm(member) : memberToMembershipForm({} as AdminMemberApi),
  );
  const [visibilityForm, setVisibilityForm] = useState<AdminVisibilityFormState>(() =>
    member ? memberToVisibilityForm(member) : memberToVisibilityForm({} as AdminMemberApi),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && member) {
      setMembershipForm(memberToMembershipForm(member));
      setVisibilityForm(memberToVisibilityForm(member));
      setError('');
    }
  }, [open, member]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateAdminMemberMembership(member.id, membershipFormToPayload(membershipForm));
      const visibilityResult = await updateAdminMemberVisibility(member.id, visibilityFormToPayload(visibilityForm));
      onSaved(visibilityResult.member);
      onClose();
    } catch {
      setError('Unable to save admin profile fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel admin-profile-modal" role="dialog" aria-modal="true" aria-label="Edit admin profile fields">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Admin profile fields</h2>
            <p className="modal-subtitle">{member.name} · membership, mentorship, visibility</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error ? (
              <p role="alert" style={{ color: theme.error, fontSize: 13, marginBottom: spacing[3] }}>
                {error}
              </p>
            ) : null}
            <AdminMembershipBillingFields form={membershipForm} mentors={mentors} onChange={setMembershipForm} />
            <AdminVisibilityAdminFields form={visibilityForm} onChange={setVisibilityForm} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save admin fields'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
