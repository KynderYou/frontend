import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  createMlaScan,
  deleteMlaScan,
  getMyLedger,
  exportMlaScan,
  getMyMlaScans,
  getTraineeReferralOptions,
  markMlaQcChecked,
  resolveMlaScanListImages,
  updateMlaScan,
} from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TopUpRequiredModal } from '../common/TopUpRequiredModal';
import { negativeBalanceMessage } from '../../utils/negativeBalance';
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
  CLIENT_TYPE_INDIVIDUAL,
  hasClientMobileFromPhone,
  normalizeClientType,
  missingScanDetails,
  phoneRequiredFor,
  type HasClientMobile,
} from './scanDetails';
import { isTraineeLogin, useCurrentMember } from '../Auth/MemberContext';
import { isAdminRole } from '../../utils/roles';
import {
  extractClientFromZip,
  revokeScanZipImages,
  categoryToClientType,
  consentInZipForbiddenError,
  validateConsentFile,
  type ScanZipImage,
} from './extractClientFromZip';
import { QcConsentModal } from './QcConsentModal';
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
  /** Rendered as the Upload Scan tab of the Scans page, which owns the page header. */
  embedded?: boolean;
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onOpenLedger?: () => void;
};

export function ScansMlaPage({ embedded = false, onOpenMobileMenu, onOpenProfile, onOpenLedger }: ScansMlaPageProps) {
  const { showSuccess, showError } = useToast();
  const currentMember = useCurrentMember();
  const isTrainee = isTraineeLogin(currentMember);
  const isMentor = currentMember?.role === 'Mentor';
  const [file, setFile] = useState<File | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentPreviewUrl, setConsentPreviewUrl] = useState<string | null>(null);
  const [consentOk, setConsentOk] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentChecking, setConsentChecking] = useState(false);
  const [clientForm, setClientForm] = useState<UploadClientForm>(emptyClientForm);
  const [hasClientMobile, setHasClientMobile] = useState<HasClientMobile>('');
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
  const [qcRecord, setQcRecord] = useState<ScanRecord | null>(null);
  const [traineeNames, setTraineeNames] = useState<string[]>([]);
  const [topUpMessage, setTopUpMessage] = useState<string | null>(null);
  /** Ledger that pays for uploads (own for Mentor/MLA; mentor's for Counselor). */
  const [uploadGateBalance, setUploadGateBalance] = useState<number | null>(null);
  const [walletChecked, setWalletChecked] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const consentInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const extractRequestId = useRef(0);
  const consentRequestId = useRef(0);
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

  useEffect(
    () => () => {
      if (consentPreviewUrl) URL.revokeObjectURL(consentPreviewUrl);
    },
    [consentPreviewUrl],
  );

  /** Surface the same top-up dialog when the billed ledger is already negative; disable upload until topped up. */
  useEffect(() => {
    if (isAdminRole(currentMember?.role)) {
      setUploadGateBalance(0);
      setWalletChecked(true);
      return;
    }
    let cancelled = false;
    setWalletChecked(false);
    getMyLedger()
      .then((ledger) => {
        if (cancelled) return;
        const gate =
          ledger.upload_gate_balance != null ? ledger.upload_gate_balance : (ledger.available_balance ?? 0);
        setUploadGateBalance(gate);
        setWalletChecked(true);
        if (gate < 0) {
          setTopUpMessage(
            isTrainee
              ? `Your mentor's ledger balance is −₹${Math.abs(Math.round(gate)).toLocaleString('en-IN')}. Scan uploads are on hold until they top up.`
              : negativeBalanceMessage(gate),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setWalletChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentMember?.role, isTrainee]);

  const walletBlocked = walletChecked && uploadGateBalance !== null && uploadGateBalance < 0;
  const uploadBlockedTitle = walletBlocked
    ? isTrainee
      ? "Your mentor's ledger balance is negative · ask them to top up before uploading"
      : 'Your ledger balance is negative · top up to upload'
    : undefined;

  const missingDetails = missingScanDetails(clientForm, hasClientMobile);
  const clientComplete = missingDetails.length === 0;
  const missingForUpload = [
    !file ? 'Scan package (zip)' : !extractOk ? 'a valid scan package' : null,
    !consentFile ? 'Consent card' : !consentOk ? 'a valid consent card' : null,
    ...missingDetails,
  ].filter(Boolean);
  const submitHint = walletBlocked
    ? uploadBlockedTitle
    : extracting || consentChecking
      ? 'Checking your files…'
      : missingForUpload.length > 0
        ? `Fill in before uploading: ${missingForUpload.join(', ')}`
        : undefined;

  const canSubmit =
    Boolean(file) &&
    extractOk &&
    Boolean(consentFile) &&
    consentOk &&
    clientComplete &&
    !extracting &&
    !consentChecking &&
    !walletBlocked;
  const zipMessage = extracting ? null : (error ?? extractNotice);
  const zipVerdict: 'ok' | 'fail' | null = zipMessage ? (extractOk && !error ? 'ok' : 'fail') : null;
  const consentVerdict: 'ok' | 'fail' | null = consentChecking
    ? null
    : consentError
      ? 'fail'
      : consentOk
        ? 'ok'
        : null;
  const canPreviewUploadImages = (extractedImages.length > 0 || Boolean(consentPreviewUrl)) && !extracting;

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
      images: [
        ...extractedImages.map(({ name, url, label }) => ({ name, url, label })),
        ...(consentPreviewUrl && consentFile
          ? [{ name: consentFile.name, url: consentPreviewUrl, label: 'Consent form' }]
          : []),
      ],
    });
  };

  const clearConsent = () => {
    consentRequestId.current += 1;
    setConsentFile(null);
    setConsentOk(false);
    setConsentError(null);
    setConsentChecking(false);
    setConsentPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (consentInputRef.current) consentInputRef.current.value = '';
  };

  const pickConsent = async (next: File | null) => {
    setConsentError(null);
    setConsentOk(false);
    if (!next) {
      clearConsent();
      return;
    }
    const requestId = ++consentRequestId.current;
    setConsentChecking(true);
    setConsentFile(next);
    setConsentPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
    try {
      const rejection = await validateConsentFile(next);
      if (requestId !== consentRequestId.current) return;
      if (rejection) {
        setConsentOk(false);
        setConsentError(rejection);
        return;
      }
      setConsentOk(true);
      setConsentError(null);
    } catch {
      if (requestId !== consentRequestId.current) return;
      setConsentOk(false);
      setConsentError('Could not read this consent card image.');
    } finally {
      if (requestId === consentRequestId.current) setConsentChecking(false);
    }
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
      setHasClientMobile('');
      setError('Only .zip files are allowed.');
      return;
    }

    setFile(next);
    setClientForm(emptyClientForm);
    setHasClientMobile('');
    setExtracting(true);
    setUploadPhase('reading');
    setUploadProgress(8);
    const requestId = ++extractRequestId.current;

    try {
      setUploadProgress(28);
      const { data, images, sourceFile, foundAny, fileCount } = await extractClientFromZip(next);
      if (requestId !== extractRequestId.current) return;
      setUploadProgress(72);

      const consentInZip = await consentInZipForbiddenError(images);
      if (requestId !== extractRequestId.current) return;
      setExtractedImages((prev) => {
        revokeScanZipImages(prev);
        return images;
      });

      setClientForm({
        ...emptyClientForm,
        scanId: data.scanId,
        phone: data.phone,
        clientType: normalizeClientType(data.clientType || categoryToClientType(data.category) || CLIENT_TYPE_INDIVIDUAL),
        referredBy: 'SELF',
      });
      setHasClientMobile(hasClientMobileFromPhone(data.phone));

      if (consentInZip) {
        setExtractOk(false);
        setExtractNotice(consentInZip);
        setError(consentInZip);
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
      setHasClientMobile('');
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
    setHasClientMobile('');
    setExtractedImages((prev) => {
      revokeScanZipImages(prev);
      return [];
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const resetForm = () => {
    clearFile();
    clearConsent();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !file || !consentFile || submitting) return;
    setSubmitting(true);
    setError(null);
    setUploadPhase('uploading');
    setUploadProgress(12);
    try {
      setUploadProgress(45);
      const created = await createMlaScan(file, consentFile, {
        client_name: clientForm.name.trim(),
        age: clientForm.age.trim(),
        phone: phoneRequiredFor(hasClientMobile) ? clientForm.phone.trim() : '',
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
    } catch (err) {
      const detail =
        err instanceof ApiError && typeof err.body === 'object' && err.body !== null && 'detail' in err.body
          ? String((err.body as { detail: unknown }).detail)
          : '';
      if (err instanceof ApiError && err.status === 403 && /balance/i.test(detail)) {
        setDeclarationOpen(false);
        setTopUpMessage(detail);
        setUploadGateBalance(-1);
        setWalletChecked(true);
      } else if (err instanceof ApiError && detail) {
        setError(detail);
      } else {
        setError('Could not upload scan. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
      setUploadPhase('idle');
      setUploadProgress(0);
    }
  };

  /** Uploads are refused while the billed ledger is negative; ₹0 is fine. */
  const openDeclaration = async () => {
    if (!canSubmit || submitting || checkingBalance || walletBlocked) return;
    if (isAdminRole(currentMember?.role)) {
      setDeclarationOpen(true);
      return;
    }
    setCheckingBalance(true);
    try {
      const ledger = await getMyLedger();
      const gate =
        ledger.upload_gate_balance != null ? ledger.upload_gate_balance : (ledger.available_balance ?? 0);
      setUploadGateBalance(gate);
      if (gate < 0) {
        setTopUpMessage(
          isTrainee
            ? `Your mentor's ledger balance is −₹${Math.abs(Math.round(gate)).toLocaleString('en-IN')}. Scan uploads are on hold until they top up.`
            : negativeBalanceMessage(gate),
        );
        return;
      }
    } catch {
      // The server enforces the same rule on upload.
    } finally {
      setCheckingBalance(false);
    }
    setDeclarationOpen(true);
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
      setQcRecord(null);
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

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper className={embedded ? undefined : 'page-section'}>
      {embedded ? null : (
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
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
            {isTrainee
              ? 'Upload the fingerprint zip and consent card separately, then enter client details. Your mentor does the QC check and exports it to head office.'
              : 'Upload the fingerprint zip and consent card separately, enter client details, and export when ready for head office processing.'}
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
      )}

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
        <input
          ref={consentInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          style={{ display: 'none' }}
          onChange={(e) => void pickConsent(e.target.files?.[0] ?? null)}
        />

        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">Upload scans</h2>
            <p className="scans-card-sub">
              {walletBlocked
                ? uploadBlockedTitle
                : 'Upload the fingerprint zip and the consent card as separate files, then enter client details.'}
            </p>
          </div>
          <span className="scans-card-meta">.zip + consent</span>
        </div>

        <div className={`scans-upload-grid${walletBlocked ? ' is-upload-blocked' : ''}`}>
          <section className="scans-upload-panel scans-upload-files">
            <div className="scans-step-head">
              <div>
                <h3 className="scans-step-title">Scan package</h3>
                <p className="scans-step-hint">Fingerprint zip only — do not include the consent card</p>
              </div>
            </div>
            <button
              type="button"
              className={`scans-dropzone${file ? ' has-file' : ''}${zipVerdict ? ` is-${zipVerdict}` : ''}`}
              disabled={walletBlocked}
              title={uploadBlockedTitle}
              onClick={() => {
                if (walletBlocked) {
                  setTopUpMessage(
                    isTrainee
                      ? `Your mentor's ledger balance is −₹${Math.abs(Math.round(uploadGateBalance ?? 0)).toLocaleString('en-IN')}. Scan uploads are on hold until they top up.`
                      : negativeBalanceMessage(uploadGateBalance ?? 0),
                  );
                  return;
                }
                inputRef.current?.click();
              }}
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

            <div className="scans-step-head" style={{ marginTop: 4 }}>
              <div>
                <h3 className="scans-step-title">Consent card</h3>
                <p className="scans-step-hint">Full-page scan of the Midna Family Consent Form</p>
              </div>
            </div>
            <button
              type="button"
              className={`scans-dropzone scans-dropzone-consent${consentFile ? ' has-file' : ''}${consentVerdict ? ` is-${consentVerdict}` : ''}`}
              disabled={walletBlocked}
              title={uploadBlockedTitle}
              onClick={() => {
                if (walletBlocked) {
                  setTopUpMessage(
                    isTrainee
                      ? `Your mentor's ledger balance is −₹${Math.abs(Math.round(uploadGateBalance ?? 0)).toLocaleString('en-IN')}. Scan uploads are on hold until they top up.`
                      : negativeBalanceMessage(uploadGateBalance ?? 0),
                  );
                  return;
                }
                consentInputRef.current?.click();
              }}
            >
              {consentVerdict ? (
                <span
                  className="scans-dropzone-verdict"
                  role="img"
                  aria-label={consentVerdict === 'ok' ? 'Valid consent card' : 'Invalid consent card'}
                >
                  {consentVerdict === 'ok' ? '👍' : '👎'}
                </span>
              ) : consentPreviewUrl ? (
                <img className="scans-consent-thumb" src={consentPreviewUrl} alt="" />
              ) : (
                <span className="scans-dropzone-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                  </svg>
                </span>
              )}
              <span className="scans-dropzone-label">
                {consentChecking ? 'Checking consent…' : consentFile ? consentFile.name : 'Choose consent card'}
              </span>
              <span className="scans-dropzone-meta">
                {consentChecking
                  ? 'Checking that this is a clear full-page form'
                  : consentFile
                    ? formatBytes(consentFile.size)
                    : 'Click to browse · JPEG, PNG or WebP'}
              </span>
              {consentError ? (
                <span className="scans-dropzone-message is-fail" role="status" aria-live="polite">
                  {consentError}
                </span>
              ) : consentOk ? (
                <span className="scans-dropzone-message is-ok" role="status" aria-live="polite">
                  Consent card accepted.
                </span>
              ) : null}
              {consentFile && (
                <span
                  role="button"
                  tabIndex={0}
                  className="scans-file-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearConsent();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      clearConsent();
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
                View images · {extractedImages.length + (consentPreviewUrl ? 1 : 0)}
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
                    : 'Enter name, age, gender and report package. Add mobile only if you have it.'}
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
              disabled={walletBlocked || !file || extracting}
              hasClientMobile={hasClientMobile}
              onHasClientMobileChange={setHasClientMobile}
              hideReferredBy={isTrainee}
            />
          </section>
        </div>

        <div className="scans-upload-footer scans-upload-footer-end">
          {/* Hint sits on a wrapper: browsers don't reliably show a disabled button's own title. */}
          <span title={submitHint} style={{ display: 'inline-flex' }}>
          <button
            type="button"
            className="btn-pill-primary scans-submit-btn"
            disabled={walletBlocked ? false : !canSubmit || submitting || checkingBalance}
            onClick={() => {
              if (walletBlocked) {
                setTopUpMessage(
                  isTrainee
                    ? `Your mentor's ledger balance is −₹${Math.abs(Math.round(uploadGateBalance ?? 0)).toLocaleString('en-IN')}. Scan uploads are on hold until they top up.`
                    : negativeBalanceMessage(uploadGateBalance ?? 0),
                );
                return;
              }
              void openDeclaration();
            }}
          >
            {submitting ? 'Uploading…' : walletBlocked ? 'Top up to upload' : 'Submit scan'}
          </button>
          </span>
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
              description="Upload a fingerprint zip and consent card above to add your first scan."
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
                          <span title="Uploaded by your counselor">{row.uploadedBy} · Counselor</span>
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
                          onClick={() => setQcRecord(row)}
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
      <QcConsentModal
        key={qcRecord?.id ?? 'closed'}
        record={qcRecord}
        onClose={() => setQcRecord(null)}
        onConfirm={handleMarkQc}
      />
      <TopUpRequiredModal
        message={topUpMessage}
        onClose={() => setTopUpMessage(null)}
        onTopUp={isTrainee ? undefined : onOpenLedger}
      />
    </Wrapper>
  );
}
