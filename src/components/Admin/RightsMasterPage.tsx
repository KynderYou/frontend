import { useCallback, useEffect, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import {
  ApiError,
  createRightsMaster,
  deleteRightsMaster,
  getRightsMaster,
  updateRightsMaster,
} from '../../api';
import type { RightsMaster, RightsMasterInput } from '../../api/types';
import { colors, spacing, typography } from '../../styles/theme';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/ToastProvider';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { RightsMasterModal } from './RightsMasterModal';

const theme = colors.light;

type RightsMasterPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function labelCws(v: string) {
  return v === 'yes' ? 'Yes' : 'N.A';
}
function labelMrp(v: string) {
  return v === 'optional' ? 'Optional' : 'Must';
}
function labelLys(v: string) {
  return v === 'yes' ? 'Yes' : 'N.A';
}
function labelPlus(v: string) {
  return v === 'direct' ? 'Direct' : 'Upgrade';
}
function labelDnai(v: string) {
  if (v === 'yes') return 'Yes';
  if (v === 'conditional') return 'Conditional';
  return 'N.A';
}
function labelNat(v: number | null) {
  return v == null ? 'N.A' : `${v}%`;
}
function formatFee(amount: number) {
  if (amount >= 1000 && amount % 500 === 0) {
    const k = amount / 1000;
    return `${k % 1 === 0 ? k.toFixed(1) : k} K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function apiErrorDetail(err: unknown, fallback: string) {
  const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
  return typeof detail === 'string' ? detail : fallback;
}

export function RightsMasterPage({ onOpenMobileMenu, onOpenProfile }: RightsMasterPageProps) {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<RightsMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<RightsMaster | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RightsMaster | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getRightsMaster(signal);
      setItems(result.items);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load Rights Master.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleSave = async (body: RightsMasterInput) => {
    setSaving(true);
    try {
      if (editing && editing !== 'new') {
        const updated = await updateRightsMaster(editing.id, body);
        setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)).sort((a, b) => a.sort_order - b.sort_order));
        showSuccess(`${updated.name} updated.`);
      } else {
        const created = await createRightsMaster(body);
        setItems((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        showSuccess(`${created.name} added.`);
      }
      setEditing(null);
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not save the rights tier.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: RightsMaster) => {
    setBusyDelete(true);
    try {
      await deleteRightsMaster(row.id);
      setItems((prev) => prev.filter((item) => item.id !== row.id));
      setDeleting(null);
      showSuccess(`${row.name} removed.`);
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not remove the tier.'));
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <section className="page-section trainees-page">
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
            Rights Master
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Subscription tiers and privileges. Add or edit the chart used across MiDNA.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button type="button" className="btn-pill-primary" onClick={() => setEditing('new')}>
            <LuPlus size={16} />
            Add tier
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      {loading ? (
        <div className="dash-card reviews-table-skeleton" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="reviews-row-skeleton" />
          ))}
        </div>
      ) : loadError ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState title="Could not load Rights Master" description={loadError} />
        </div>
      ) : items.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState title="No tiers yet" description="Press Add tier to create the first subscription rights row." />
        </div>
      ) : (
        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0, overflowX: 'auto' }}>
          <table className="mis-data-table trainees-data-table rights-master-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Subscription</th>
                <th>Billing %</th>
                <th>CWS Reports</th>
                <th>MRP Display</th>
                <th>LYS Billing</th>
                <th>Plus Reports</th>
                <th>DNAi Reports</th>
                <th>NAT Discount</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className={row.active ? undefined : 'is-inactive'}>
                  <td data-label="Tier">
                    <strong>{row.name}</strong>
                  </td>
                  <td data-label="Subscription">{formatFee(row.subscription_amount)}</td>
                  <td data-label="Billing %">{row.billing_percent}%</td>
                  <td data-label="CWS Reports">{labelCws(row.cws_reports)}</td>
                  <td data-label="MRP Display">{labelMrp(row.mrp_display)}</td>
                  <td data-label="LYS Billing">{labelLys(row.lys_billing)}</td>
                  <td data-label="Plus Reports">{labelPlus(row.plus_reports)}</td>
                  <td data-label="DNAi Reports">{labelDnai(row.dnai_reports)}</td>
                  <td data-label="NAT Discount">{labelNat(row.nat_discount)}</td>
                  <td data-label="Status">{row.active ? 'Active' : 'Inactive'}</td>
                  <td className="col-right">
                    <div className="rights-master-actions">
                      <button type="button" className="scans-action-btn scans-action-export" onClick={() => setEditing(row)}>
                        Edit
                      </button>
                      <button type="button" className="scans-action-btn scans-action-danger" onClick={() => setDeleting(row)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RightsMasterModal
        open={editing != null}
        initial={editing === 'new' ? null : editing}
        busy={saving}
        onClose={() => setEditing(null)}
        onSave={(body) => void handleSave(body)}
      />
      <ConfirmModal
        open={deleting != null}
        title={`Delete ${deleting?.name ?? 'this tier'}?`}
        confirmLabel="Delete"
        danger
        busy={busyDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void handleDelete(deleting)}
      >
        Members already on this tier keep their current subscription name. This only removes the rights row.
      </ConfirmModal>
    </section>
  );
}
