import { useCallback, useEffect, useRef, useState } from 'react';
import { LuTrash2 } from 'react-icons/lu';
import {
  emptyRecycleBin,
  getRecycleBin,
  getRecycleBinScan,
  isApiError,
  purgeRecycleBinImages,
  resolveHoScanImages,
} from '../../api';
import type { RecycleBinScan } from '../../api/types';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useCurrentMember } from '../Auth/MemberContext';
import { isSuperAdminRole } from '../../utils/roles';
import { SkeletonTableCard } from '../common/Skeleton';
import { useToast } from '../common/ToastProvider';
import { TrashButton } from '../common/TrashButton';
import { FingerprintSheetModal } from './FingerprintSheetModal';
import type { ScanImage } from './scanTypes';

type HoRecycleBinModalProps = {
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
};

type SheetState = { item: RecycleBinScan; images: ScanImage[]; loading: boolean };

function formatDebitedOn(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function revokeImages(images: ScanImage[]) {
  for (const image of images) {
    if (image.url.startsWith('blob:')) URL.revokeObjectURL(image.url);
  }
}

export function HoRecycleBinModal({ open, onClose, onCountChange }: HoRecycleBinModalProps) {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<RecycleBinScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<RecycleBinScan | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  /** Admins view the bin; only Super Admin deletes from it. */
  const canDelete = isSuperAdminRole(useCurrentMember()?.role);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const sheetRequest = useRef(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const data = await getRecycleBin(signal);
        setItems(data);
        onCountChange(data.length);
      } catch {
        if (!signal?.aborted) showError('Unable to load the recycle bin.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [onCountChange, showError],
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [open, load]);

  useEffect(() => {
    if (!open || sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirmEmpty) return;
      if (confirmTarget) setConfirmTarget(null);
      else onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, confirmTarget, confirmEmpty, sheet]);

  const closeSheet = useCallback(() => {
    sheetRequest.current += 1;
    setSheet((prev) => {
      if (prev) revokeImages(prev.images);
      return null;
    });
  }, []);

  const openSheet = async (item: RecycleBinScan) => {
    const request = ++sheetRequest.current;
    setSheet({ item, images: [], loading: true });
    try {
      const detail = await resolveHoScanImages(await getRecycleBinScan(item.id));
      if (request !== sheetRequest.current) {
        revokeImages(detail.scan_images);
        return;
      }
      setSheet({ item, images: detail.scan_images, loading: false });
    } catch {
      if (request !== sheetRequest.current) return;
      setSheet(null);
      showError(`Could not load the images for ${item.scan_code}.`);
    }
  };

  const purge = async (item: RecycleBinScan) => {
    setBusy(true);
    try {
      await purgeRecycleBinImages(item.id);
      const next = items.filter((row) => row.id !== item.id);
      setItems(next);
      onCountChange(next.length);
      showSuccess(`Fingerprint images for ${item.scan_code} (${item.name}) deleted permanently.`);
    } catch (err) {
      const detail = isApiError(err) ? (err.body as { detail?: unknown } | null)?.detail : null;
      showError(typeof detail === 'string' && detail ? detail : 'Could not delete the images. Please try again.');
    } finally {
      setBusy(false);
      setConfirmTarget(null);
    }
  };

  const emptyBin = async () => {
    setBusy(true);
    try {
      const { purged } = await emptyRecycleBin();
      setItems([]);
      onCountChange(0);
      setConfirmEmpty(false);
      showSuccess(`Recycle bin emptied · fingerprint images for ${purged} scan${purged === 1 ? '' : 's'} deleted permanently.`);
    } catch (err) {
      const detail = isApiError(err) ? (err.body as { detail?: unknown } | null)?.detail : null;
      showError(typeof detail === 'string' && detail ? detail : 'Could not empty the recycle bin. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="modal-overlay"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {confirmTarget ? (
          <div
            className="modal-panel reports-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ho-bin-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="ho-bin-confirm-title" className="modal-title">
                  Delete fingerprint images?
                </h2>
                <p className="modal-subtitle">
                  {confirmTarget.scan_code} · {confirmTarget.name}
                </p>
              </div>
            </div>
            <div className="modal-body">
              <p className="reports-delete-warning">
                The uploaded ZIP and all {confirmTarget.images} fingerprint images will be removed permanently. The report
                PDF, client details and billing stay in My Reports. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-pill-secondary" disabled={busy} onClick={() => setConfirmTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-pill-primary reports-delete-confirm"
                disabled={busy}
                onClick={() => void purge(confirmTarget)}
              >
                Delete images
              </button>
            </div>
          </div>
        ) : (
          <div
            className="modal-panel ho-recycle-bin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ho-bin-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="ho-bin-title" className="modal-title">
                  Recycle bin
                </h2>
                <p className="modal-subtitle">
                  {canDelete
                    ? 'Finished scans keep their fingerprint images here until you delete them.'
                    : 'Finished scans keep their fingerprint images here · only Super Admin can delete them.'}
                </p>
              </div>
              <div className="ho-recycle-bin-head-actions">
                {canDelete && items.length > 0 ? (
                  <button
                    type="button"
                    className="ho-recycle-bin-empty-btn"
                    disabled={busy || loading}
                    onClick={() => setConfirmEmpty(true)}
                  >
                    <LuTrash2 size={14} aria-hidden="true" />
                    Empty bin
                  </button>
                ) : null}
              <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              </div>
            </div>

            <div className="modal-body">
              {loading ? (
                <SkeletonTableCard rows={5} columns={8} />
              ) : items.length === 0 ? (
                <EmptyState
                  title="Recycle bin is empty"
                  description="Scans land here after their report billing is debited."
                  compact
                />
              ) : (
                <div className="scans-table-wrap">
                  <table className="scans-table ho-scans-table">
                    <thead>
                      <tr>
                        <th>Scan Id</th>
                        <th>Name</th>
                        <th>Age / Gender</th>
                        <th>Phone</th>
                        <th>Client Type</th>
                        <th>Scan By</th>
                        <th>Debited On</th>
                        <th className="col-center">Images</th>
                        {canDelete ? <th className="col-center">Delete</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="ho-scans-row-clickable"
                          tabIndex={0}
                          role="button"
                          aria-label={`View fingerprints for ${item.scan_code}`}
                          onClick={() => void openSheet(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              void openSheet(item);
                            }
                          }}
                        >
                          <td data-label="Scan Id">{item.scan_code}</td>
                          <td data-label="Name">{item.name}</td>
                          <td data-label="Age / Gender">
                            {[item.age, item.gender].filter(Boolean).join(' / ') || '—'}
                          </td>
                          <td data-label="Phone">{item.phone || '—'}</td>
                          <td data-label="Client Type">{item.client_type || '—'}</td>
                          <td data-label="Scan By">{item.scan_by}</td>
                          <td data-label="Debited On">{formatDebitedOn(item.billed_at)}</td>
                          <td data-label="Images" className="col-center">
                            <span className="ho-scans-image-count">{item.images}</span>
                          </td>
                          {canDelete ? (
                            <td data-label="Delete" className="col-center" onClick={(e) => e.stopPropagation()}>
                              <TrashButton label="Delete fingerprint images" disabled={busy} onClick={() => setConfirmTarget(item)} />
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmEmpty}
        title="Empty recycle bin?"
        subtitle={`${items.length} scan${items.length === 1 ? '' : 's'} · ${items.reduce((sum, item) => sum + item.images, 0)} fingerprint images`}
        confirmLabel="Empty bin"
        danger
        busy={busy}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={() => void emptyBin()}
      >
        The uploaded ZIPs and fingerprint images for every scan in the bin will be removed permanently. Report PDFs,
        client details and billing stay in My Reports. This cannot be undone.
      </ConfirmModal>

      <FingerprintSheetModal
        open={Boolean(sheet)}
        scanId={sheet?.item.scan_code ?? ''}
        name={sheet?.item.name ?? ''}
        images={sheet?.images ?? []}
        loading={sheet?.loading}
        onClose={closeSheet}
      />
    </>
  );
}
