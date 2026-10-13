import { useEffect, useRef, useState } from 'react';
import {
  createMlaScan,
  deleteMlaScan,
  exportMlaScan,
  getMyMlaScans,
  getTraineeReferralOptions,
  markMlaQcChecked,
  resolveMlaScanListImages,
  updateMlaScan,
} from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { TrashButton } from '../common/TrashButton';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { DeclarationModal } from './DeclarationModal';
import { EditScanModal } from './EditScanModal';
import { ScanDetailsFields } from './ScanDetailsFields';
import {
  brandingRequiresPhone,
  CLIENT_TYPE_INDIVIDUAL,
  normalizeClientType,
  phoneRequiredFor,
  scanDetailsComplete,
} from './scanDetails';
import { isTraineeLogin, useCurrentMember } from '../Auth/MemberContext';
import { extractClientFromZip, revokeScanZipImages, categoryToClientType, findConsentFormImage, type ScanZipImage } from './extractClientFromZip';
import { ScanImagesModal } from './ScanImagesModal';
import { collectBlobUrls, detailsToUpdatePayload, mlaScanToRecord, revokeBlobUrls } from './scanApiMapper';
import {
  STATUS_REJECTED_BY_HO,
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

function statusStyles(status: ScanRecordStatus | string) {
  if (status === 'Exported' || status === 'QC checked') {
    return { color: theme.success, background: theme['success-bg'] };
  }
  if (status === 'Consent form verified') {
    return { color: theme.primary, background: theme['primary-soft'] };
  }
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  if (status === STATUS_REJECTED_BY_HO) return { color: theme.error, background: theme['error-bg'] };
  return { color: theme['text-secondary'], background: theme['bg-muted'] };
}

function canExport(record: ScanRecord) {
  return record.detailsSaved && !record.exported && record.status === 'QC checked';
}

function canMarkQc(record: ScanRecord) {
  return (
    !record.exported &&
    (record.status === 'Consent form verified' ||
      record.status === 'Imported' ||
      record.status === 'Saved' ||
      record.status === STATUS_REJECTED_BY_HO)
  );
}

function exportBlockedReason(record: ScanRecord) {
  if (record.status === 'QC checked') {
    if (!record.detailsSaved) return 'Complete scan details before exporting';
    return 'Send to HO process scan';
  }
  if (!record.detailsSaved) return 'Complete scan details, then mark QC checked before exporting';
  return 'Mark QC checked before exporting';
}

type ScansMlaPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function ScansMlaPage({ onOpenMobileMenu, onOpenProfile }: ScansMlaPageProps) {
  const { showSuccess, showError } = useToast();
  const currentMember = useCurrentMember();
  const memberRequiresPhone = brandingRequiresPhone(currentMember?.branding);
  const isTrainee = isTraineeLogin(currentMember);
  const isMentor = currentMember?.role === 'Mentor';
  const [file, setFile] = useState<File | null>(null);
  const [clientForm, setClientForm] = useState<UploadClientForm>(emptyClientForm);
  const [extractedImages, setExtractedImages] = useState<ScanZipImage[]>([]);
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [extractOk, setExtractOk] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'reading' | 'uploading'>('idle');
  const [declarationOpen, setDeclarationOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScanRecord | null>(null);
  const [viewingImages, setViewingImages] = useState<ScanRecord | null>(null);
  const [traineeNames, setTraineeNames] = useState<string[]>([]);
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

    getTraineeReferralOptions()
      .then((names) => {
        if (!cancelled) setTraineeNames(names);
      })
      .catch(() => {
        if (!cancelled) setTraineeNames([]);
      });

    return () => {
      cancelled = true;
      revokeBlobUrls(blobUrlsRef.current);
      blobUrlsRef.current = [];
    };
  }, []);

  const clientComplete = scanDetailsComplete(clientForm, memberRequiresPhone);

  const canSubmit = Boolean(file) && extractOk && clientComplete && !extracting;
  const zipMessage = extracting ? null : (error ?? extractNotice);
  const zipVerdict: 'ok' | 'fail' | null = zipMessage ? (extractOk && !error ? 'ok' : 'fail') : null;
  const canPreviewUploadImages = extractedImages.length > 0 && !extracting;

  const openUploadImagePreview = () => {
    if (!canPreviewUploadImages) return;
    setViewingImages({
      id: 'upload-preview',
      scanId: clientForm.scanId || file?.name.replace(/\.zip$/i, '') || 'Upload preview',
      fileName: file?.name ?? 'package.zip',
      size: file ? formatBytes(file.size) : '—',
      uploadedAt: new Date().toISOString(),
      status: 'Draft',
      details: {
        clientType: clientForm.clientType,
        referredBy: clientForm.referredBy,
        name: clientForm.name,
        age: clientForm.age,
        phone: clientForm.phone,
        gender: clientForm.gender,
        mrp: clientForm.mrp,
      },
      detailsSaved: false,
      exported: false,
      images: extractedImages.map(({ name, url, label }) => ({ name, url, label })),
    });
  };

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
    setUploadPhase('reading');
    setUploadProgress(8);
    const requestId = ++extractRequestId.current;

    try {
      setUploadProgress(28);
      const { data, images, sourceFile, foundAny, fileCount } = await extractClientFromZip(next);
      if (requestId !== extractRequestId.current) return;
      setUploadProgress(72);

      const consentCheck = await findConsentFormImage(images);
      if (requestId !== extractRequestId.current) return;
      const labelledImages = consentCheck.image
        ? images.map((image) => (image === consentCheck.image ? { ...image, label: 'Consent form' } : image))
        : images;
      setExtractedImages((prev) => {
        revokeScanZipImages(prev);
        return labelledImages;
      });

      setClientForm({
        ...emptyClientForm,
        scanId: data.scanId,
        phone: data.phone,
        clientType: normalizeClientType(data.clientType || categoryToClientType(data.category) || CLIENT_TYPE_INDIVIDUAL),
        referredBy: 'SELF',
      });

      if (!consentCheck.image) {
        const consentError = consentCheck.rejection
          ? `Consent form not accepted — ${consentCheck.rejection}. Include a clear full-page scan of the Midna Family Consent Form.`
          : 'Consent form missing — the zip must include a full-page scan of the Midna Family Consent Form.';
        setExtractOk(false);
        setExtractNotice(consentError);
        setError(consentError);
        return;
      }

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
      if (requestId === extractRequestId.current) {
        setExtracting(false);
        setUploadProgress(100);
        window.setTimeout(() => {
          if (extractRequestId.current === requestId) {
            setUploadPhase('idle');
            setUploadProgress(0);
          }
        }, 400);
      }
    }
  };

  const clearFile = () => {
    extractRequestId.current += 1;
    setFile(null);
    setError(null);
    setExtractNotice(null);
    setExtractOk(false);
    setExtracting(false);
    setUploadPhase('idle');
    setUploadProgress(0);
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
    setUploadPhase('uploading');
    setUploadProgress(12);
    try {
      setUploadProgress(45);
      const created = await createMlaScan(file, {
        client_name: clientForm.name.trim(),
        age: clientForm.age.trim(),
        phone: phoneRequiredFor(clientForm.clientType, memberRequiresPhone) ? clientForm.phone.trim() : '',
        gender: clientForm.gender,
        client_type: clientForm.clientType.trim() || CLIENT_TYPE_INDIVIDUAL,
        referred_by: clientForm.referredBy,
        mrp: clientForm.mrp.trim() || '₹2,000',
      });
      setUploadProgress(82);
      const resolved = await resolveMlaScanListImages([created]);
      setUploadProgress(100);
      replaceRecords([mlaScanToRecord(resolved[0]), ...records]);
      setExtractedImages([]);
      resetForm();
      setDeclarationOpen(false);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setError('Could not upload scan. Check your connection and try again.');
    } finally {
      setSubmitting(false);
      setUploadPhase('idle');
      setUploadProgress(0);
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
      await exportMlaScan(scanId);
      replaceRecords(records.filter((row) => row.id !== record.id));
      showSuccess(`Scan ${record.scanId} exported to HO.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      showError(message);
    }
  };

  const applyUpdatedScan = async (updated: Awaited<ReturnType<typeof markMlaQcChecked>>) => {
    const resolved = await resolveMlaScanListImages([updated]);
    const nextRecord = mlaScanToRecord(resolved[0]);
    replaceRecords(records.map((row) => (row.id === nextRecord.id ? nextRecord : row)));
    setViewingImages((current) => (current?.id === nextRecord.id ? nextRecord : current));
    return nextRecord;
  };

  const handleMarkQc = async (record: ScanRecord) => {
    const scanId = Number(record.id);
    if (Number.isNaN(scanId)) return;
    try {
      const updated = await markMlaQcChecked(scanId);
      await applyUpdatedScan(updated);
      showSuccess(`QC checked for ${record.scanId}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not mark QC checked.';
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
            {isTrainee
              ? 'Upload a scan zip and enter client details. Your mentor does the QC check and exports it to head office.'
              : 'Upload a scan zip, enter client details, and export when ready for head office processing.'}
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
              Choose a zip package, then enter the client details before submitting.
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
              className={`scans-dropzone${file ? ' has-file' : ''}${zipVerdict ? ` is-${zipVerdict}` : ''}`}
              onClick={() => inputRef.current?.click()}
            >
              {zipVerdict ? (
                <span className="scans-dropzone-verdict" role="img" aria-label={zipVerdict === 'ok' ? 'Valid package' : 'Invalid package'}>
                  {zipVerdict === 'ok' ? '👍' : '👎'}
                </span>
              ) : (
                <span className="scans-dropzone-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4" />
                    <path d="m6 10 6-6 6 6" />
                    <path d="M4 20h16" />
                  </svg>
                </span>
              )}
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
              {zipMessage ? (
                <span className={`scans-dropzone-message is-${zipVerdict}`} role="status" aria-live="polite">
                  {zipMessage}
                </span>
              ) : null}
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
            {canPreviewUploadImages ? (
              <button
                type="button"
                className="btn-pill-secondary scans-upload-preview-btn"
                onClick={openUploadImagePreview}
              >
                View images · {extractedImages.length}
              </button>
            ) : null}
            {uploadPhase !== 'idle' ? (
              <div className="scans-upload-progress" role="status" aria-live="polite">
                <div className="scans-upload-progress-meta">
                  <span>
                    {uploadPhase === 'reading' ? 'Reading package…' : 'Uploading scan…'}
                  </span>
                  <span>{Math.min(100, Math.round(uploadProgress))}%</span>
                </div>
                <div className="scans-upload-progress-track" aria-hidden="true">
                  <span
                    className={`scans-upload-progress-fill${uploadPhase === 'reading' ? ' is-indeterminate' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(uploadProgress, 6))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section className="scans-upload-panel">
            <div className="scans-step-head">
              <div>
                <h3 className="scans-step-title">Client data</h3>
                <p className="scans-step-hint">
                  {extracting
                    ? 'Reading zip…'
                    : memberRequiresPhone
                      ? 'Enter name, age, gender, client phone and report package'
                      : 'Enter name, age, gender and report package'}
                </p>
              </div>
            </div>
            <ScanDetailsFields
              className="scans-client-fields"
              scanId={clientForm.scanId}
              scanIdPlaceholder="Assigned on upload · TYYYYMMDD001"
              value={clientForm}
              onChange={(details) => setClientForm((prev) => ({ ...prev, ...details }))}
              traineeNames={traineeNames}
              disabled={!file || extracting}
              memberRequiresPhone={memberRequiresPhone}
              hideReferredBy={isTrainee}
            />
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
      </div>

      <div ref={tableRef} className="dash-card scans-table-card" style={{ width: '100%' }}>
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">Uploaded scans</h2>
            <p className="scans-card-sub">
              {isTrainee
                ? 'Your mentor QC-checks and exports these · Edit or delete until QC is done'
                : 'Export sends to scans DB and notifies HO · Edit to update billing details'}
            </p>
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
                {isMentor ? <th>Uploaded by</th> : null}
                <th className="col-center">Status</th>
                {isTrainee ? null : <th className="col-center">QC</th>}
                {isTrainee ? null : <th className="col-center">Export</th>}
                <th className="col-center">Edit</th>
                <th className="col-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {listPagination.pageItems.map((row, index) => {
                const chip = statusStyles(row.status);
                const exportReady = canExport(row);
                const lockedForTrainee = isTrainee && row.status === 'QC checked';
                const lockedTitle = 'Your mentor has already QC-checked this scan';
                return (
                  <tr key={row.id}>
                    <td data-label="Sno">{rowOffset + index + 1}</td>
                    <td data-label="Scan Id">
                      <button
                        type="button"
                        className="scans-table-link"
                        title="View scan images"
                        onClick={() => setViewingImages(row)}
                      >
                        {row.scanId}
                      </button>
                    </td>
                    <td data-label="Name">{row.details.name || '—'}</td>
                    <td data-label="Gender">{row.details.gender || '—'}</td>
                    {isMentor ? (
                      <td data-label="Uploaded by">
                        {row.uploadedBy ? (
                          <span title="Uploaded by your consultant">{row.uploadedBy} · Consultant</span>
                        ) : (
                          <span className="scans-table-meta">You</span>
                        )}
                      </td>
                    ) : null}
                    <td data-label="Status">
                      <span className="scans-status-chip" style={chip}>
                        {row.status}
                      </span>
                    </td>
                    {isTrainee ? null : (
                    <>
                    <td data-label="QC">
                      {canMarkQc(row) ? (
                        <button
                          type="button"
                          className="scans-action-btn scans-action-qc"
                          onClick={() => void handleMarkQc(row)}
                        >
                          Mark QC
                        </button>
                      ) : row.status === 'QC checked' ? (
                        <span className="scans-qc-done">✓ QC done</span>
                      ) : (
                        <span className="scans-table-meta">—</span>
                      )}
                    </td>
                    <td data-label="Export">
                      <button
                        type="button"
                        className={`scans-action-btn scans-action-export${exportReady ? '' : ' is-disabled'}`}
                        disabled={!exportReady}
                        aria-disabled={!exportReady}
                        title={exportReady ? 'Send to HO process scan' : exportBlockedReason(row)}
                        onClick={() => {
                          if (!exportReady) return;
                          void handleExport(row);
                        }}
                      >
                        Export
                      </button>
                    </td>
                    </>
                    )}
                    <td data-label="Edit">
                      <button
                        type="button"
                        className={`scans-action-btn${lockedForTrainee ? ' is-disabled' : ''}`}
                        disabled={lockedForTrainee}
                        title={lockedForTrainee ? lockedTitle : undefined}
                        onClick={() => setEditingRecord(row)}
                      >
                        Edit
                      </button>
                    </td>
                    <td data-label="Delete">
                      <TrashButton
                        label={lockedForTrainee ? lockedTitle : 'Delete scan'}
                        disabled={lockedForTrainee}
                        onClick={() => handleDelete(row.id)}
                      />
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
          traineeNames={traineeNames}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveDetails}
          hideReferredBy={isTrainee}
        />
      )}
      <ScanImagesModal
        open={Boolean(viewingImages)}
        record={viewingImages}
        onClose={() => setViewingImages(null)}
      />
    </section>
  );
}
