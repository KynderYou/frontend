import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteCertification,
  fetchAuthenticatedAsset,
  getCertifications,
  getMyProfile,
  uploadAvatar,
} from '../../api';
import type { Certification, MemberProfile } from '../../api';
import { buttonTokens, colors, metricColors, radius, severityTokens, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { AvatarCropModal } from './AvatarCropModal';
import { CertificationCard } from './CertificationCard';
import { ChangePasswordModal } from './ChangePasswordModal';
import { EditProfileModal } from './EditProfileModal';

const theme = colors.light;

type ProfilePageProps = {
  onBack: () => void;
  onOpenMobileMenu?: () => void;
};

/** Subscription tiers — billing % pulled from the plan reference table */
type SubscriptionTier = 'Gold' | 'Diamond' | 'Platinum' | 'Ultima';

const subscriptionTiers: Record<SubscriptionTier, { emoji: string; color: string; bg: string; billing: string }> = {
  Gold: { emoji: '🥇', color: severityTokens.medium.text, bg: severityTokens.medium.bg, billing: '30%' },
  Diamond: { emoji: '💎', color: metricColors.blue.text, bg: metricColors.blue.bg, billing: '25%' },
  Platinum: { emoji: '🏆', color: '#475467', bg: theme['bg-muted'], billing: '20%' },
  Ultima: { emoji: '👑', color: metricColors.purple.text, bg: metricColors.purple.bg, billing: '16%' },
};

type MemberStatus = 'Active' | 'On Hold' | 'Inactive';

const statusTones: Record<MemberStatus, { color: string; bg: string }> = {
  Active: { color: theme.success, bg: theme['success-bg'] },
  'On Hold': { color: theme.warning, bg: theme['warning-bg'] },
  Inactive: { color: theme.error, bg: theme['error-bg'] },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function formatMid(mid: number): string {
  return `M${String(mid).padStart(5, '0')}`;
}

function asStatus(value: string): MemberStatus {
  if (value === 'On Hold' || value === 'Inactive') return value;
  return 'Active';
}

function asTier(value: string): SubscriptionTier {
  if (value === 'Gold' || value === 'Diamond' || value === 'Platinum' || value === 'Ultima') return value;
  return 'Gold';
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

type PillProps = {
  label: string;
  color: string;
  bg: string;
  emoji?: string;
  dot?: boolean;
  pulse?: boolean;
};

function Pill({ label, color, bg, emoji, dot, pulse }: PillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg,
        borderRadius: radius.pill,
        padding: dot ? '6px 12px 6px 10px' : '5px 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={pulse ? 'status-dot-ping' : undefined}
          style={{
            position: 'relative',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            color,
            flexShrink: 0,
          }}
        />
      )}
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
    </span>
  );
}

type DetailFieldProps = {
  label: string;
  value: React.ReactNode;
};

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[5],
        padding: `${spacing[4]} 0`,
        borderBottom: `1px solid ${theme.divider}`,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme['text-secondary'],
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme['text-primary'],
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function isBlank(value: string | null | undefined): boolean {
  if (value == null) return true;
  const trimmed = String(value).trim();
  return trimmed === '' || trimmed === '—';
}

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
  onOpen?: () => void;
  empty?: boolean;
  emptyDescription?: string;
};

function DetailSection({ title, children, onOpen, empty, emptyDescription }: DetailSectionProps) {
  return (
    <button
      type="button"
      className="dash-card profile-tile"
      onClick={onOpen}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        fontFamily: 'inherit',
        width: '100%',
        color: 'inherit',
      }}
    >
      <div className="profile-tile-header">
        <h2 className="profile-tile-title">{title}</h2>
        <span
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: theme['primary-soft'],
            color: theme.primary,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </span>
      </div>
      <div className="detail-list profile-tile-body">
        {empty ? (
          <EmptyState
            title="No details yet"
            description={emptyDescription ?? 'Update your profile to add information here.'}
            compact
          />
        ) : (
          children
        )}
      </div>
    </button>
  );
}

type LitePopupProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function LitePopup({ open, title, children, onClose }: LitePopupProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay profile-lite-overlay" role="presentation" onClick={onClose}>
      <div
        className="profile-lite-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-lite-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: spacing[4] }}>
          <div>
            <h2 id="profile-lite-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'], letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>Quick view</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} style={{ width: 36, height: 36 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="detail-list" style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage({ onBack, onOpenMobileMenu }: ProfilePageProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [liteSection, setLiteSection] = useState<string | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    const data = await getMyProfile();
    setProfile(data);
    setError('');
    return data;
  }, []);

  const loadCertifications = useCallback(async () => {
    const certs = await getCertifications();
    setCertifications(certs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadProfile(), loadCertifications()])
      .catch(() => {
        if (!cancelled) setError('Unable to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadProfile, loadCertifications]);

  useEffect(() => {
    if (!profile?.avatar_url) {
      setAvatarUrl(null);
      return undefined;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetchAuthenticatedAsset(profile.avatar_url)
      .then((url) => {
        if (!cancelled) {
          objectUrl = url;
          setAvatarUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.avatar_url]);

  useEffect(() => {
    if (!liteSection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLiteSection(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [liteSection]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(URL.createObjectURL(file));
    e.target.value = '';
  };

  const closeCropModal = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage);
    setPendingImage(null);
  };

  const handleCropSave = async (dataUrl: string) => {
    closeCropModal();
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const updated = await uploadAvatar(blob, 'avatar.jpg');
      setProfile(updated);
    } catch {
      setAvatarUrl(dataUrl);
    }
  };

  const handleProfileSaved = async (updated: MemberProfile) => {
    setProfile(updated);
    await loadCertifications();
  };

  const handleDeleteCert = async (certId: number) => {
    try {
      await deleteCertification(certId);
      setCertifications((prev) => prev.filter((c) => c.id !== certId));
    } catch {
      /* keep list unchanged on failure */
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <p style={{ color: theme['text-secondary'] }}>Loading profile…</p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="page-section">
        <button type="button" className="btn-icon" aria-label="Back to dashboard" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <p style={{ marginTop: spacing[4], color: theme.error }} role="alert">
          {error || 'Profile not found.'}
        </p>
      </section>
    );
  }

  const currentTier = asTier(profile.mas_type);
  const tier = subscriptionTiers[currentTier];
  const currentStatus = asStatus(profile.status);
  const statusTone = statusTones[currentStatus];

  const personalFields = (
    <>
      <DetailField label="Name" value={profile.name || '—'} />
      <DetailField label="Mobile 1" value={profile.mobile_1 || '—'} />
      {profile.mobile_2 ? <DetailField label="Mobile 2" value={profile.mobile_2} /> : null}
      <DetailField label="Date of Birth" value={formatDate(profile.dob)} />
      <DetailField label="Country" value={profile.country || '—'} />
      <DetailField label="City" value={profile.city || '—'} />
      <DetailField label="State" value={profile.state || '—'} />
      <DetailField label="Pincode" value={profile.pincode || '—'} />
      <DetailField label="Address" value={profile.address || '—'} />
    </>
  );

  const membershipFields = (
    <>
      <DetailField label="MID" value={formatMid(profile.mid)} />
      <DetailField label="Date of Joining" value={formatDate(profile.doj)} />
      <DetailField
        label="Subscription"
        value={<Pill label={currentTier} color={tier.color} bg={tier.bg} emoji={tier.emoji} />}
      />
      <DetailField label="Expiry Date" value={formatDate(profile.expiry_date)} />
      <DetailField label="Billing" value={profile.billing || tier.billing} />
      <DetailField label="Opening Balance" value={formatMoney(profile.op_bal)} />
    </>
  );

  const professionalFields = (
    <>
      <DetailField label="UID" value={profile.uid || '—'} />
      <DetailField label="Services" value={profile.services || '—'} />
      <DetailField
        label="Availability"
        value={
          profile.availability ? (
            <Pill label={profile.availability} color={metricColors.blue.text} bg={metricColors.blue.bg} />
          ) : (
            '—'
          )
        }
      />
      <DetailField label="Certification Date" value={formatDate(profile.cr_date)} />
    </>
  );

  const visibilityFields = (
    <>
      <DetailField
        label="Certified"
        value={
          <Pill
            label={profile.certified ? 'Yes' : 'No'}
            color={profile.certified ? theme.success : theme['text-muted']}
            bg={profile.certified ? theme['success-bg'] : theme['bg-muted']}
          />
        }
      />
      <DetailField
        label="MRP Visibility"
        value={
          <Pill
            label={profile.mrp || 'Show'}
            color={profile.mrp === 'Hide' ? theme['text-muted'] : theme.success}
            bg={profile.mrp === 'Hide' ? theme['bg-muted'] : theme['success-bg']}
          />
        }
      />
      <DetailField
        label="Branding"
        value={
          profile.branding ? (
            <Pill label={profile.branding} color={metricColors.purple.text} bg={metricColors.purple.bg} />
          ) : (
            '—'
          )
        }
      />
      <DetailField
        label="MIS Training"
        value={
          profile.mis_training ? (
            <Pill label={profile.mis_training} color={theme.success} bg={theme['success-bg']} />
          ) : (
            '—'
          )
        }
      />
      <DetailField label="Mentored By" value={profile.mentored_by || '—'} />
      <DetailField label="Admin By" value={profile.admin_by || '—'} />
      <DetailField
        label="Remarks"
        value={
          profile.remarks ? (
            profile.remarks
          ) : (
            <span style={{ fontWeight: 400, color: theme['text-muted'], fontStyle: 'italic' }}>No remarks</span>
          )
        }
      />
    </>
  );

  const personalEmpty = [
    profile.name,
    profile.mobile_1,
    profile.mobile_2,
    profile.dob,
    profile.country,
    profile.city,
    profile.state,
    profile.pincode,
    profile.address,
  ].every(isBlank);

  const membershipEmpty =
    [profile.doj, profile.mas_type, profile.expiry_date, profile.billing].every(isBlank) && profile.op_bal == null;

  const professionalEmpty =
    isBlank(profile.uid) &&
    isBlank(profile.services) &&
    isBlank(profile.availability) &&
    isBlank(profile.cr_date);

  const visibilityEmpty =
    !profile.certified &&
    [profile.mrp, profile.branding, profile.mis_training, profile.mentored_by, profile.admin_by, profile.remarks].every(isBlank);

  const liteContent: Record<string, React.ReactNode> = {
    'Personal Details': personalFields,
    'Membership & Billing': membershipFields,
    'Professional Details': professionalFields,
    'Visibility & Admin': visibilityFields,
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], minWidth: 0, flex: 1 }}>
          <button type="button" className="btn-icon" aria-label="Back to dashboard" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <div className="page-title-block" style={{ minWidth: 0 }}>
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
              My Profile
            </h1>
            <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
              Manage your certification, mentorship, and billing details.
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="dash-card profile-hero-card" style={{ marginBottom: spacing[5], padding: spacing[8] }}>
        <div
          className="profile-hero-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[6],
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Upload profile picture"
              style={{
                width: 128,
                height: 128,
                borderRadius: '50%',
                background: avatarUrl ? 'transparent' : theme['primary-soft'],
                color: theme.primary,
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change profile picture"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--btn-primary-gradient)',
                color: '#fff',
                border: `3px solid ${theme['bg-surface']}`,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 600,
                color: theme['text-primary'],
                letterSpacing: '-0.025em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {profile.name}
              {profile.certified && (
                <span
                  title="Certified"
                  aria-label="Verified · Certified"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#3897F0',
                    color: '#fff',
                    display: 'inline-grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(56, 151, 240, 0.35)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
              {profile.mail_id} · {formatMid(profile.mid)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <Pill label={currentStatus} color={statusTone.color} bg={statusTone.bg} dot pulse />
              <Pill label={currentTier} color={tier.color} bg={tier.bg} emoji={tier.emoji} />
            </div>
          </div>

          <div className="profile-hero-actions" style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-pill-primary"
              onClick={() => setEditOpen(true)}
              style={{ height: buttonTokens.height.sm, padding: buttonTokens.padding.sm, fontSize: 13 }}
            >
              Edit profile
            </button>
            <button
              type="button"
              className="btn-pill-secondary"
              style={{ height: buttonTokens.height.sm, padding: buttonTokens.padding.sm, fontSize: 13 }}
              onClick={() => setPasswordOpen(true)}
            >
              Change password
            </button>
          </div>
        </div>
      </div>

      <div
        className="profile-detail-grid"
        style={{
          marginBottom: spacing[5],
          alignItems: 'stretch',
        }}
      >
        <DetailSection title="Personal Details" onOpen={() => setLiteSection('Personal Details')} empty={personalEmpty} emptyDescription="Add your contact and address details in Edit profile.">
          {personalFields}
        </DetailSection>

        <DetailSection title="Membership & Billing" onOpen={() => setLiteSection('Membership & Billing')} empty={membershipEmpty} emptyDescription="Membership details are assigned by admin.">
          {membershipFields}
        </DetailSection>

        <DetailSection title="Professional Details" onOpen={() => setLiteSection('Professional Details')} empty={professionalEmpty} emptyDescription="Add your UID and services in Edit profile.">
          {professionalFields}
        </DetailSection>

        <DetailSection title="Visibility & Admin" onOpen={() => setLiteSection('Visibility & Admin')} empty={visibilityEmpty} emptyDescription="Visibility settings are managed by admin.">
          {visibilityFields}
        </DetailSection>
      </div>

      <div className="dash-card">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
          Certifications
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: theme['text-secondary'], maxWidth: 560 }}>
          Your uploaded certificates appear here.
        </p>

        <div
          className={`profile-cert-grid${certifications.length === 1 ? ' profile-cert-grid--single' : ''}`}
          style={{
            marginTop: spacing[5],
            border: 'none',
            borderRadius: radius.lg,
            padding: certifications.length ? spacing[4] : spacing[8],
            display: certifications.length ? 'grid' : 'flex',
            flexDirection: certifications.length ? undefined : 'column',
            alignItems: certifications.length ? undefined : 'center',
            justifyContent: certifications.length ? undefined : 'center',
            gap: spacing[4],
            color: theme['text-muted'],
            background: theme['bg-muted'],
            minHeight: certifications.length ? 420 : 160,
          }}
        >
          {certifications.length === 0 ? (
            <EmptyState
              title="No certifications yet"
              description="Upload certificates from Edit profile."
            />
          ) : (
            certifications.map((cert) => (
              <CertificationCard key={cert.id} cert={cert} onDelete={handleDeleteCert} />
            ))
          )}
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSaved={handleProfileSaved}
      />

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />

      <LitePopup
        open={Boolean(liteSection)}
        title={liteSection ?? ''}
        onClose={() => setLiteSection(null)}
      >
        {liteSection ? liteContent[liteSection] : null}
      </LitePopup>

      {pendingImage && (
        <AvatarCropModal imageSrc={pendingImage} onCancel={closeCropModal} onSave={handleCropSave} />
      )}
    </section>
  );
}
