import { useRef, useState } from 'react';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { DeclarationModal } from './DeclarationModal';
import { EditScanModal } from './EditScanModal';
import { extractClientFromZip } from './extractClientFromZip';
import { ScanImagesModal } from './ScanImagesModal';
import {
  defaultScanDetails,
  nextScanId,
  type ScanDetails,
  type ScanRecord,
  type ScanRecordStatus,
} from './scanTypes';

const theme = colors.light;

const genderOptions = ['Male', 'Female', 'Other'] as const;

type UploadClientForm = {
  name: string;
  age: string;
  phone: string;
  gender: string;
};

const emptyClientForm: UploadClientForm = {
  name: '',
  age: '',
  phone: '',
  gender: '',
};

const seedRecords: ScanRecord[] = [
  {
    id: 'u1',
    scanId: 'S42487',
    fileName: 'nest-south-batch-14.zip',
    size: '12.4 MB',
    uploadedAt: '14 Jul 2026 · 10:22 AM',
    status: 'Saved',
    details: {
      clientType: 'Individual',
      referredBy: 'SELF',
      ledgerName: '9597770205',
      name: 'RUDRA VIJ',
      age: '12',
      phone: '9876543210',
      gender: 'Male',
      mrp: '₹2,000',
    },
    detailsSaved: true,
    exported: false,
  },
  {
    id: 'u2',
    scanId: 'S42486',
    fileName: 'mla-scans-jul-week2.zip',
    size: '8.1 MB',
    uploadedAt: '12 Jul 2026 · 04:05 PM',
    exportedAt: '12 Jul 2026 · 05:10 PM',
    status: 'Exported',
    details: {
      clientType: 'Individual',
      referredBy: 'SELF',
      ledgerName: '9597770205',
      name: 'Riya Saravanan',
      age: '10',
      phone: '9123456780',
      gender: 'Female',
      mrp: '₹1,500',
    },
    detailsSaved: true,
    exported: true,
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStamp(date = new Date()) {
  return date
    .toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' ·');
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

type ScansMlaPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function ScansMlaPage({ onOpenMobileMenu, onOpenProfile }: ScansMlaPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [clientForm, setClientForm] = useState<UploadClientForm>(emptyClientForm);
  const [declared, setDeclared] = useState(false);
  const [records, setRecords] = useState<ScanRecord[]>(seedRecords);
  const [error, setError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [extractOk, setExtractOk] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [declarationOpen, setDeclarationOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScanRecord | null>(null);
  const [viewingImages, setViewingImages] = useState<ScanRecord | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const extractRequestId = useRef(0);

  const clientComplete =
    clientForm.name.trim().length > 0 &&
    clientForm.age.trim().length > 0 &&
    clientForm.phone.trim().length > 0 &&
    clientForm.gender.trim().length > 0;

  const canSubmit = Boolean(file) && declared && clientComplete && !extracting;

  const updateClient = (key: keyof UploadClientForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setClientForm((f) => ({ ...f, [key]: e.target.value }));
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
    const requestId = ++extractRequestId.current;

    try {
      const { data, sourceFile, foundAny, fileCount } = await extractClientFromZip(next);
      if (requestId !== extractRequestId.current) return;

      setClientForm({
        name: data.name,
        age: data.age,
        phone: data.phone,
        gender: data.gender,
      });

      if (foundAny) {
        setExtractOk(true);
        setExtractNotice(
          sourceFile
            ? `Client data filled from ${sourceFile}. Review and edit if needed.`
            : 'Client data filled from the zip package. Review and edit if needed.'
        );
      } else {
        setExtractOk(false);
        setExtractNotice(
          fileCount > 0
            ? `Found ${fileCount} file(s) in the zip, but could not parse Data.xml. Enter details manually.`
            : 'No files found in the zip. Enter details manually.'
        );
      }
    } catch {
      if (requestId !== extractRequestId.current) return;
      setClientForm(emptyClientForm);
      setError('Could not read client data from this zip. Enter details manually.');
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
    if (inputRef.current) inputRef.current.value = '';
  };

  const resetForm = () => {
    clearFile();
    setDeclared(false);
  };

  const handleSubmit = () => {
    if (!canSubmit || !file) return;
    const fileUrl = URL.createObjectURL(file);
    setRecords((prev) => [
      {
        id: `u-${Date.now()}`,
        scanId: nextScanId(),
        fileName: file.name,
        fileUrl,
        size: formatBytes(file.size),
        uploadedAt: formatStamp(),
        status: 'Saved',
        details: {
          ...defaultScanDetails(),
          name: clientForm.name.trim(),
          age: clientForm.age.trim(),
          phone: clientForm.phone.trim(),
          gender: clientForm.gender,
        },
        detailsSaved: true,
        exported: false,
      },
      ...prev,
    ]);
    resetForm();
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveDetails = (details: ScanDetails) => {
    if (!editingRecord) return;
    setRecords((prev) =>
      prev.map((row) =>
        row.id === editingRecord.id
          ? {
              ...row,
              details,
              detailsSaved: true,
              status: row.exported ? row.status : 'Saved',
            }
          : row
      )
    );
    setEditingRecord(null);
  };

  const handleExport = (record: ScanRecord) => {
    if (!canExport(record)) return;
    const stamp = formatStamp();
    setRecords((prev) =>
      prev.map((row) =>
        row.id === record.id
          ? {
              ...row,
              exported: true,
              exportedAt: stamp,
              status: 'Exported',
            }
          : row
      )
    );
    setExportNotice(`Scan ${record.scanId} exported to scans DB. Head Office has been notified.`);
    window.setTimeout(() => setExportNotice(null), 5000);
  };

  const handleDelete = (id: string) => {
    const row = records.find((r) => r.id === id);
    if (row?.fileUrl) URL.revokeObjectURL(row.fileUrl);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (editingRecord?.id === id) setEditingRecord(null);
  };

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
            My Scans (MLA)
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Upload a scan zip — client details are filled from the package document. Export to Head Office when ready.
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

      {exportNotice && (
        <div
          className="scans-export-notice"
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
          {exportNotice}
        </div>
      )}

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
              Choose a zip package — name, age, phone, and gender are extracted automatically.
            </p>
          </div>
          <span className="scans-card-meta">.zip only</span>
        </div>

        <div className="scans-upload-grid">
          <section className="scans-upload-panel">
            <div className="scans-step-head">
              <span className="scans-step-num">1</span>
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
              <span className="scans-step-num">2</span>
              <div>
                <h3 className="scans-step-title">Client data</h3>
                <p className="scans-step-hint">
                  {extracting ? 'Extracting from zip…' : 'Auto-filled from zip · edit if needed'}
                </p>
              </div>
            </div>
            <div className="scans-client-fields">
              <label className="form-field">
                <span className="form-label">Name</span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Client full name"
                  value={clientForm.name}
                  onChange={updateClient('name')}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Age</span>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={120}
                  placeholder="e.g. 12"
                  value={clientForm.age}
                  onChange={updateClient('age')}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Phno</span>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="Phone number"
                  value={clientForm.phone}
                  onChange={updateClient('phone')}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Gender</span>
                <div className="form-select-wrap">
                  <select className="form-input form-select" value={clientForm.gender} onChange={updateClient('gender')}>
                    <option value="" disabled>
                      Select gender
                    </option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="scans-upload-footer">
          <div className="scans-step-head scans-step-head-inline">
            <span className="scans-step-num">3</span>
            <label className="scans-declaration-inline" htmlFor="scan-declaration">
              <input
                id="scan-declaration"
                type="checkbox"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeclarationOpen(true);
                  }}
                >
                  Declaration
                </button>
              </span>
            </label>
          </div>
          <button
            type="button"
            className="btn-pill-primary scans-submit-btn"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Submit scan
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
              {records.map((row, index) => {
                const chip = statusStyles(row.status);
                const exportReady = canExport(row);
                return (
                  <tr key={row.id}>
                    <td data-label="Sno">{index + 1}</td>
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
        </div>
      </div>

      <DeclarationModal open={declarationOpen} onClose={() => setDeclarationOpen(false)} onAccept={() => setDeclared(true)} />
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
