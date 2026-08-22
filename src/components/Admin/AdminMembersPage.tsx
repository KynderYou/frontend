import { useCallback, useEffect, useState } from 'react';
import {
  createAdminMember,
  deleteAdminMember,
  getAdminMembers,
  resetAdminMemberPassword,
  updateAdminMemberStatus,
} from '../../api';
import type { AdminMemberApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';

const theme = colors.light;

const roleOptions = ['MLA Member', 'H.O Staff', 'Counsellor', 'Admin'] as const;
type MemberRole = (typeof roleOptions)[number];

type MemberStatus = 'Active' | 'Invited' | 'Disabled';

type MemberAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: MemberRole;
  createdAt: string;
  status: MemberStatus;
};

type MemberForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: MemberRole | '';
};

const emptyForm: MemberForm = { name: '', email: '', phone: '', password: '', role: '' };

function mapAccount(member: AdminMemberApi): MemberAccount {
  return {
    id: String(member.id),
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role as MemberRole,
    createdAt: member.created_at,
    status: member.status as MemberStatus,
  };
}

function mapAccounts(members: AdminMemberApi[]): MemberAccount[] {
  return members.map(mapAccount);
}

function statusStyles(status: MemberStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Invited') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.error, background: theme['error-bg'] };
}

type AdminMembersPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function AdminMembersPage({ onOpenMobileMenu, onOpenProfile }: AdminMembersPageProps) {
  const [accounts, setAccounts] = useState<MemberAccount[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 5000);
  };

  const loadAccounts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getAdminMembers(signal);
      setAccounts(mapAccounts(state.members));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load member accounts.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAccounts(controller.signal);
    return () => controller.abort();
  }, [loadAccounts]);

  const update = (key: keyof MemberForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;

    if (!name || !email || !phone || !password || !form.role) {
      setError('Fill all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAdminMember({
        name,
        email,
        phone,
        password,
        role: form.role,
      });
      setAccounts((current) => [mapAccount(result.member), ...current]);
      setError(null);
      setForm(emptyForm);
      showNotice(result.message);
    } catch {
      setError('Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (account: MemberAccount) => {
    try {
      const result = await resetAdminMemberPassword(Number(account.id));
      showNotice(`${result.message} ${result.temp_password}`);
    } catch {
      showNotice(`Unable to reset password for ${account.email}.`);
    }
  };

  const handleToggle = async (account: MemberAccount) => {
    const nextStatus = account.status === 'Disabled' ? 'Active' : 'Disabled';
    try {
      const result = await updateAdminMemberStatus(Number(account.id), nextStatus);
      const updated = mapAccount(result.member);
      setAccounts((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      showNotice(result.message);
    } catch {
      showNotice(`Unable to update ${account.name}.`);
    }
  };

  const handleDelete = async (account: MemberAccount) => {
    try {
      const result = await deleteAdminMember(Number(account.id));
      setAccounts((current) => current.filter((row) => row.id !== String(result.id)));
      showNotice(result.message);
    } catch {
      showNotice(`Unable to delete ${account.name}.`);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading member accounts…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section">
        <div className="dash-card" style={{ padding: spacing[5] }}>
          <p style={{ margin: 0, color: theme.error }}>{loadError}</p>
          <button type="button" className="btn-pill-secondary" style={{ marginTop: spacing[3] }} onClick={() => loadAccounts()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: typography.roles.pageTitle.fontSize,
              lineHeight: typography.roles.pageTitle.lineHeight,
              fontWeight: typography.roles.pageTitle.fontWeight,
              letterSpacing: typography.roles.pageTitle.letterSpacing,
              color: theme['text-primary'],
            }}
          >
            Member Accounts
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Admin only · Create & manage member accounts
          </p>
        </div>

        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: spacing[4],
            padding: '12px 16px',
            borderRadius: radius.md,
            background: theme['success-bg'],
            color: theme.success,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {notice}
        </div>
      )}

      <div className="dash-card" style={{ marginBottom: spacing[4] }}>
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">Create account</h2>
            <p className="scans-card-sub">Set email and password so the member can sign in</p>
          </div>
          <span className="scans-card-meta">Admin only</span>
        </div>

        <form onSubmit={handleCreate}>
          <div className="admin-create-grid">
            <label className="form-field">
              <span className="form-label">Full name</span>
              <input
                className="form-input"
                type="text"
                placeholder="Member name"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                placeholder="name@midna.com"
                value={form.email}
                onChange={update('email')}
                autoComplete="off"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Phone</span>
              <input
                className="form-input"
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={update('phone')}
                autoComplete="tel"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Password</span>
              <input
                className="form-input"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Role</span>
              <div className="form-select-wrap">
                <select className="form-input form-select" value={form.role} onChange={update('role')}>
                  <option value="" disabled>
                    Select role
                  </option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
          </div>

          <div className="admin-create-footer">
            {error ? <p className="scans-upload-error" style={{ margin: 0 }}>{error}</p> : <span />}
            <button type="submit" className="btn-pill-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>

      <div className="dash-card scans-table-card" style={{ width: '100%' }}>
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">All accounts</h2>
            <p className="scans-card-sub">Active once created · use Reset to send a new password</p>
          </div>
          <span className="scans-card-meta">{accounts.length}</span>
        </div>

        <div className="scans-table-wrap">
          <table className="scans-table admin-members-table">
            <thead>
              <tr>
                <th>Sno</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th className="col-center">Status</th>
                <th className="col-center">Reset</th>
                <th className="col-center">Disable</th>
                <th className="col-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, index) => {
                const chip = statusStyles(account.status);
                const disabled = account.status === 'Disabled';
                return (
                  <tr key={account.id}>
                    <td data-label="Sno">{index + 1}</td>
                    <td data-label="Name">
                      <span className="scans-table-file-static">{account.name}</span>
                      <span className="scans-table-meta">{account.phone}</span>
                    </td>
                    <td data-label="Email">{account.email}</td>
                    <td data-label="Role">{account.role}</td>
                    <td data-label="Created">{account.createdAt}</td>
                    <td data-label="Status">
                      <span className="scans-status-chip" style={chip}>
                        {account.status}
                      </span>
                    </td>
                    <td data-label="Reset">
                      <button
                        type="button"
                        className="scans-action-btn"
                        title="Send password reset link"
                        onClick={() => handleReset(account)}
                      >
                        Reset
                      </button>
                    </td>
                    <td data-label="Disable">
                      <button
                        type="button"
                        className={`scans-action-btn ${disabled ? 'scans-action-export' : 'reports-action-upgrade'}`}
                        title={disabled ? 'Allow sign-in again' : 'Block sign-in'}
                        onClick={() => handleToggle(account)}
                      >
                        {disabled ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                    <td data-label="Delete">
                      <button
                        type="button"
                        className="scans-action-btn scans-action-danger"
                        onClick={() => handleDelete(account)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {accounts.length === 0 && (
            <div className="reports-empty">
              <p className="reports-empty-title">No accounts yet</p>
              <p className="reports-empty-sub">Create the first member account above.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
