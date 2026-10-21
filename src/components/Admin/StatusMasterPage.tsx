import { useCallback, useEffect, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import {
  ApiError,
  createStatusMaster,
  deleteStatusMaster,
  getStatusMaster,
  updateStatusMaster,
} from '../../api';
import type { StatusMaster, StatusMasterInput } from '../../api/types';
import { colors, spacing, typography } from '../../styles/theme';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/ToastProvider';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { StatusMasterModal } from './StatusMasterModal';

const theme = colors.light;

type StatusMasterPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function labelDds(v: string) {
  if (v === 'must') return 'Must';
  if (v === 'optional') return 'Optional';
  return 'N.A';
}
function labelLys(v: string) {
  if (v === 'upto_25') return 'Upto 25';
  if (v === '25_49') return '25-49';
  if (v === '50_99') return '50-99';
  if (v === '100_plus') return '100+';
  return 'N.A';
}
function labelRenewal(v: string) {
  if (v === 'must') return 'Must';
  if (v === 'optional') return 'Optional';
  return 'N.A';
}
function labelPct(v: number | null) {
  return v == null ? 'N.A' : `${v}%`;
}

function apiErrorDetail(err: unknown, fallback: string) {
  const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
  return typeof detail === 'string' ? detail : fallback;
}

export function StatusMasterPage({ onOpenMobileMenu, onOpenProfile }: StatusMasterPageProps) {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<StatusMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<StatusMaster | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StatusMaster | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getStatusMaster(signal);
      setItems(result.items);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load Status Master.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleSave = async (body: StatusMasterInput) => {
    setSaving(true);
    try {
      if (editing && editing !== 'new') {
        const updated = await updateStatusMaster(editing.id, body);
        setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)).sort((a, b) => a.rank - b.rank));
        showSuccess(`${updated.name} updated.`);
      } else {
        const created = await createStatusMaster(body);
        setItems((prev) => [...prev, created].sort((a, b) => a.rank - b.rank));
        showSuccess(`${created.name} added.`);
      }
      setEditing(null);
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not save the status.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: StatusMaster) => {
    setBusyDelete(true);
    try {
      await deleteStatusMaster(row.id);
      setItems((prev) => prev.filter((item) => item.id !== row.id));
      setDeleting(null);
      showSuccess(`${row.name} removed.`);
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not remove the status.'));
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
            Status Master
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
            Ranks and competencies.
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
            Add status
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
          <EmptyState title="Could not load Status Master" description={loadError} />
        </div>
      ) : items.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState title="No statuses yet" description="Press Add status to create the first rank row." />
        </div>
      ) : (
        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0, overflowX: 'auto' }}>
          <table className="mis-data-table trainees-data-table status-master-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Status</th>
                <th>DDS-Adult</th>
                <th>DDS-Basic</th>
                <th>DDS-Plus</th>
                <th>Min LYS</th>
                <th>Max Billing</th>
                <th>Renewal</th>
                <th>NAT Billing</th>
                <th>Active</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className={row.active ? undefined : 'is-inactive'}>
                  <td data-label="Rank">
                    <strong>{row.rank}</strong>
                  </td>
                  <td data-label="Status">
                    <strong>{row.name}</strong>
                  </td>
                  <td data-label="DDS-Adult">{labelDds(row.dds_adult)}</td>
                  <td data-label="DDS-Basic">{labelDds(row.dds_basic)}</td>
                  <td data-label="DDS-Plus">{labelDds(row.dds_plus)}</td>
                  <td data-label="Min LYS">{labelLys(row.min_lys)}</td>
                  <td data-label="Max Billing">{labelPct(row.max_billing)}</td>
                  <td data-label="Renewal">{labelRenewal(row.renewal)}</td>
                  <td data-label="NAT Billing">{labelPct(row.nat_billing)}</td>
                  <td data-label="Active">{row.active ? 'Active' : 'Inactive'}</td>
                  <td className="col-right">
                    <div className="status-master-actions">
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

      <StatusMasterModal
        open={editing != null}
        initial={editing === 'new' ? null : editing}
        busy={saving}
        onClose={() => setEditing(null)}
        onSave={(body) => void handleSave(body)}
      />
      <ConfirmModal
        open={deleting != null}
        title={`Delete ${deleting?.name ?? 'this status'}?`}
        confirmLabel="Delete"
        danger
        busy={busyDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void handleDelete(deleting)}
      >
        Members already on this status keep their current role. This only removes the Status Master row.
      </ConfirmModal>
    </section>
  );
}
