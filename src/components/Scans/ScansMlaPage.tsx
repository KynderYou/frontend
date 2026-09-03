import { useEffect, useRef, useState } from 'react';
import {
  createMlaScan,
  deleteMlaScan,
  exportMlaScan,
  getMyMlaScans,
  resolveMlaScanListImages,
  updateMlaScan,
} from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { DeclarationModal } from './DeclarationModal';
import { EditScanModal } from './EditScanModal';
import { extractClientFromZip, revokeScanZipImages, categoryToClientType, type ScanZipImage } from './extractClientFromZip';
import { ScanImagesModal } from './ScanImagesModal';
import { collectBlobUrls, detailsToUpdatePayload, mlaScanToRecord, revokeBlobUrls } from './scanApiMapper';
import {
  type ScanDetails,
  type ScanRecord,
  type ScanRecordStatus,
} from './scanTypes';

const theme = colors.light;
const MLA_SCANS_PAGE_SIZE = 12;

type UploadClientForm = {
  scanId: string;
  clientType: string;
  referredBy: string;
  name: string;
  age: string;
  phone: string;
  gender: string;
  mrp: string;
};

const emptyClientForm: UploadClientForm = {
  scanId: '',
  clientType: '',
  referredBy: '',
  name: '',
  age: '',
  phone: '',
  gender: '',
  mrp: '',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusStyles(status: ScanRecordStatus) {
  if (status === 'Exported') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Saved') return { color: theme.primary, background: theme['primary-soft'] };
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme['text-secondary'], background: theme['bg-muted'] };
}

function canExport(record: ScanRecord) {
  return record.detailsSaved && !record.exported;
}

function displayValue(value: string, fallback = '—') {
  return value.trim() ? value : fallback;
}

type ScansMlaPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function ScansMlaPage({ onOpenMobileMenu, onOpenProfile }: ScansMlaPageProps) {
  const { showSuccess, showError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [clientForm, setClientForm] = useState<UploadClientForm>(emptyClientForm);
  const [_extractedImages, setExtractedImages] = useState<ScanZipImage[]>([]);
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [extractOk, setExtractOk] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [declarationOpen, setDeclarationOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScanRecord | null>(null);
  const [viewingImages, setViewingImages] = useState<ScanRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const extractRequestId = useRef(0);
  const blobUrlsRef = useRef<string[]>([]);

  const replaceRecords = (next: ScanRecord[]) => {
    revokeBlobUrls(blobUrlsRef.current);
    blobUrlsRef.current = collectBlobUrls(next);
    setRecords(next);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyMlaScans()
      .then(async (scans) => {
        if (cancelled) return;
        const resolved = await resolveMlaScanListImages(scans);
        if (cancelled) return;
        replaceRecords(resolved.map(mlaScanToRecord));
        setLoadError('');
      })
      .catch(() => {
        if (!cancelled) setLoadError('Unable to load scans.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      revokeBlobUrls(blobUrlsRef.current);
      blobUrlsRef.current = [];
    };
  }, []);

  const clientComplete =
    clientForm.name.trim().length > 0 &&
    clientForm.age.trim().length > 0 &&
    clientForm.gender.trim().length > 0;

  const canSubmit = Boolean(file) && extractOk && clientComplete && !extracting;

  const pickFile = async (next: File | null) => {
    setError(null);
    setExtractNotice(null);
    setExtractOk(false);
    if (!next) {
      setFile(null);
      return;
    }
    const isZip =
      next.name.toLowerCase().endsWith('.zip') ||
      next.type === 'application/zip' ||
      next.type === 'application/x-zip-compressed';
    if (!isZip) {
      setFile(null);
      setClientForm(emptyClientForm);
      setError('Only .zip files are allowed.');
      return;
    }

    setFile(next);
    setClientForm(emptyClientForm);
    setExtracting(true);
    const requestId = ++extractRequestId.current;

    try {
      const { data, images, sourceFile, foundAny, fileCount } = await extractClientFromZip(next);
      if (requestId !== extractRequestId.current) return;

      setExtractedImages((prev) => {
        revokeScanZipImages(prev);
        return images;
      });

      setClientForm({
        scanId: data.scanId,
        name: data.name,
        age: data.age,
        phone: data.phone,
        gender: data.gender,
        clientType: data.clientType || categoryToClientType(data.category) || 'Individual',
        referredBy: 'SELF',
        mrp: '₹2,000',
      });

      if (foundAny) {
        setExtractOk(true);
        const imageNote =
          images.length > 0 ? ` ${images.length} fingerprint image${images.length === 1 ? '' : 's'} found.` : '';
        setExtractNotice(
          sourceFile
            ? `Client data extracted from ${sourceFile}.${imageNote}`
            : `Client data extracted from the zip package.${imageNote}`
        );
      } else {
        setExtractOk(false);
        const imageNote =
          images.length > 0 ? ` Found ${images.length} image(s), but Data.xml could not be parsed.` : '';
        setExtractNotice(
          fileCount > 0
            ? `Found ${fileCount} file(s) in the zip, but could not parse Data.xml.${imageNote}`
            : 'No files found in the zip.'
        );
      }
    } catch {
      if (requestId !== extractRequestId.current) return;
      setClientForm(emptyClientForm);
      setExtractedImages((prev) => {
        revokeScanZipImages(prev);
        return [];
      });
      setError('Could not read client data from this zip.');
    } finally {
      if (requestId === extractRequestId.current) setExtracting(false);
    }
  };

  const clearFile = () => {
    extractRequestId.current += 1;
    setFile(null);
    setError(null);
    setExtractNotice(null);
    setExtractOk(false);
    setExtracting(false);
    setClientForm(emptyClientForm);
    setExtractedImages((prev) => {
      revokeScanZipImages(prev);
      return [];
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const resetForm = () => {
    clearFile();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createMlaScan(file, {
        client_name: clientForm.name.trim(),
        age: clientForm.age.trim(),
        phone: clientForm.phone.trim(),
        gender: clientForm.gender,
        client_type: clientForm.clientType.trim() || 'Individual',
        referred_by: clientForm.referredBy,
        mrp: clientForm.mrp.trim() || '₹2,000',
      });
      const resolved = await resolveMlaScanListImages([created]);
      replaceRecords([mlaScanToRecord(resolved[0]), ...records]);
      setExtractedImages([]);
      resetForm();
      setDeclarationOpen(false);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setError('Could not upload scan. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDetails = async (details: ScanDetails) => {
    if (!editingRecord) return;
    const scanId = Number(editingRecord.id);
    if (Number.isNaN(scanId)) return;
    try {
      const updated = await updateMlaScan(scanId, detailsToUpdatePayload(details));
      const resolved = await resolveMlaScanListImages([updated]);
      const nextRecord = mlaScanToRecord(resolved[0]);
      replaceRecords(records.map((row) => (row.id === editingRecord.id ? nextRecord : row)));
      setEditingRecord(null);
    } catch {
      setError('Could not save scan details.');
    }
  };

  const handleExport = async (record: ScanRecord) => {
    if (!canExport(record)) return;
    const scanId = Number(record.id);
    if (Number.isNaN(scanId)) return;
    try {
      const exported = await exportMlaScan(scanId);
      replaceRecords(records.filter((row) => row.id !== record.id));
      showSuccess(`Scan ${exported.scan_code} exported to scans DB. Head Office has been notified.`);
    } catch {
      const message = 'Could not export scan.';
      setError(message);
      showError(message);
    }
  };

  const handleDelete = async (id: string) => {
    const scanId = Number(id);
    if (Number.isNaN(scanId)) return;
    try {
      await deleteMlaScan(scanId);
      const row = records.find((r) => r.id === id);
      if (row?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(row.fileUrl);
      revokeScanZipImages(row?.images);
      replaceRecords(records.filter((r) => r.id !== id));
      if (editingRecord?.id === id) setEditingRecord(null);
    } catch {
      setError('Could not delete scan.');
    }
  };

  const listPagination = useClientPagination(records, MLA_SCANS_PAGE_SIZE, records.length);
  const rowOffset = (listPagination.page - 1) * listPagination.pageSize;

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
            Upload Scan
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Upload a scan zip, enter client details, and export when ready for head office processing.
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

      {loadError ? (
        <p role="alert" style={{ marginBottom: spacing[4], color: theme.error, fontSize: 14 }}>
          {loadError}
        </p>
      ) : null}

      <div className="dash-card scans-upload-card" style={{ marginBottom: spacing[4] }}>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          style={{ display: 'none' }}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">Upload scans</h2>
            <p className="scans-card-sub">
              Choose a zip package — client details are extracted automatically and shown as read-only.
            </p>
          </div>
          <span className="scans-card-meta">.zip only</span>
        </div>

        <div className="scans-upload-grid">
          <section className="scans-upload-panel">
            <div className="scans-step-head">
              <div>
                <h3 className="scans-step-title">Scan package</h3>
                <p className="scans-step-hint">Fingerprint scan zip file</p>
              </div>
            </div>
            <button
              type="button"
              className={`scans-dropzone${file ? ' has-file' : ''}`}
              onClick={() => inputRef.current?.click()}
            >
              <span className="scans-dropzone-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4" />
                  <path d="m6 10 6-6 6 6" />
                  <path d="M4 20h16" />
                </svg>
              </span>
              <span className="scans-dropzone-label">
                {extracting ? 'Reading zip…' : file ? file.name : 'Choose zip file'}
              </span>
              <span className="scans-dropzone-meta">
                {extracting
                  ? 'Extracting client data from package document'
                  : file
                    ? formatBytes(file.size)
                    : 'Click to browse · .zip only'}
              </span>
              {file && (
                <span
                  role="button"
                  tabIndex={0}
                  className="scans-file-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      clearFile();
                    }
                  }}
                >
                  Remove file
                </span>
              )}
            </button>
          </section>

          <section className="scans-upload-panel">
            <div className="scans-step-head">
              <div>
                <h3 className="scans-step-title">Client data</h3>
                <p className="scans-step-hint">
                  {extracting ? 'Extracting from zip…' : 'Auto-filled from zip · not editable'}
                </p>
              </div>
            </div>
            <div className="scans-client-fields">
              <label className="form-field">
                <span className="form-label">Scan Id</span>
                <input
                  className="form-input"
                  type="text"
                  value={displayValue(clientForm.scanId, '')}
                  placeholder="Assigned on upload · TYYYYMMDD001"
                  readOnly
                  disabled
                />
              </label>
              <label className="form-field">
                <span className="form-label">Name</span>
                <input className="form-input" type="text" value={displayValue(clientForm.name, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">Age</span>
                <input className="form-input" type="text" value={displayValue(clientForm.age, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">Phno</span>
                <input className="form-input" type="text" value={displayValue(clientForm.phone, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">Gender</span>
                <input className="form-input" type="text" value={displayValue(clientForm.gender, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">Client Type</span>
                <input className="form-input" type="text" value={displayValue(clientForm.clientType, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">Referred By</span>
                <input className="form-input" type="text" value={displayValue(clientForm.referredBy, '')} placeholder="—" readOnly disabled />
              </label>
              <label className="form-field">
                <span className="form-label">MRP</span>
                <input className="form-input" type="text" value={displayValue(clientForm.mrp, '')} placeholder="—" readOnly disabled />
              </label>
            </div>
          </section>
        </div>

        <div className="scans-upload-footer scans-upload-footer-end">
          <button
            type="button"
            className="btn-pill-primary scans-submit-btn"
            disabled={!canSubmit || submitting}
            onClick={() => {
              if (!canSubmit || submitting) return;
              setDeclarationOpen(true);
            }}
          >
            {submitting ? 'Uploading…' : 'Submit scan'}
          </button>
        </div>

        {extractNotice && !error && (
          <p className={extractOk ? 'scans-upload-notice' : 'scans-upload-error'}>{extractNotice}</p>
        )}
        {error && <p className="scans-upload-error">{error}</p>}
      </div>

      <div ref={tableRef} className="dash-card scans-table-card" style={{ width: '100%' }}>
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">Uploaded scans</h2>
            <p className="scans-card-sub">Export sends to scans DB and notifies HO · Edit to update billing details</p>
          </div>
          <span className="scans-card-meta">{records.length}</span>
        </div>

        <div className="scans-table-wrap">
          {loading ? (
            <SkeletonTableCard rows={8} columns={7} />
          ) : records.length === 0 ? (
            <EmptyState
              title="No scans uploaded yet"
              description="Upload a zip package above to add your first scan."
            />
          ) : (
          <>
          <table className="scans-table">
            <thead>
              <tr>
                <th>Sno</th>
                <th>Scan Id</th>
                <th>Name</th>
                <th>Gender</th>
                <th>File</th>
                <th className="col-center">Status</th>
                <th className="col-center">Export</th>
                <th className="col-center">Edit</th>
                <th className="col-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {listPagination.pageItems.map((row, index) => {
                const chip = statusStyles(row.status);
                const exportReady = canExport(row);
                return (
                  <tr key={row.id}>
                    <td data-label="Sno">{rowOffset + index + 1}</td>
                    <td data-label="Scan Id">
                      <button type="button" className="scans-table-link" onClick={() => setEditingRecord(row)}>
                        {row.scanId}
                      </button>
                    </td>
                    <td data-label="Name">{row.details.name || '—'}</td>
                    <td data-label="Gender">{row.details.gender || '—'}</td>
                    <td data-label="File">
                      <button
                        type="button"
                        className="scans-table-file-link"
                        title="View scan images"
                        onClick={() => setViewingImages(row)}
                      >
                        {row.fileName}
                      </button>
                      <span className="scans-table-meta">{row.size}</span>
                    </td>
                    <td data-label="Status">
                      <span className="scans-status-chip" style={chip}>
                        {row.status}
                      </span>
                    </td>
                    <td data-label="Export">
                      <button
                        type="button"
                        className="scans-action-btn scans-action-export"
                        disabled={!exportReady}
                        title={exportReady ? 'Send to scans DB and notify HO' : 'Complete scan details before exporting'}
                        onClick={() => handleExport(row)}
                      >
                        Export
                      </button>
                    </td>
                    <td data-label="Edit">
                      <button type="button" className="scans-action-btn" onClick={() => setEditingRecord(row)}>
                        Edit
                      </button>
                    </td>
                    <td data-label="Delete">
                      <button type="button" className="scans-action-btn scans-action-danger" onClick={() => handleDelete(row.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePager
            page={listPagination.page}
            pageSize={listPagination.pageSize}
            total={listPagination.total}
            onPageChange={listPagination.setPage}
            className="mis-table-footer"
          />
          </>
          )}
        </div>
      </div>

      <DeclarationModal
        open={declarationOpen}
        onClose={() => setDeclarationOpen(false)}
        onAccept={handleSubmit}
      />
      {editingRecord && (
        <EditScanModal
          open={Boolean(editingRecord)}
          scanId={editingRecord.scanId}
          initial={editingRecord.details}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveDetails}
        />
      )}
      <ScanImagesModal open={Boolean(viewingImages)} record={viewingImages} onClose={() => setViewingImages(null)} />
    </section>
  );
}
