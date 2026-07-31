import { useEffect, useMemo, useState } from 'react';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { ProcessScanModal, type ProcessScanMode } from './ProcessScanModal';

const theme = colors.light;

type HoSectionId = 'preprocess' | 'process' | 'verify' | 'download' | 'report';

type HoScanRecord = {
  id: string;
  section: HoSectionId;
  scanId: string;
  name: string;
  gender?: string;
  age?: string;
  scanBy: string;
  reportType: string;
  cost: string;
  images: number;
  processedBy: string;
  status: string;
};

type ScansHoPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

const sectionLabels: Record<HoSectionId, string> = {
  preprocess: 'Preprocess',
  process: 'Process',
  verify: 'Verify',
  download: 'Download',
  report: 'Upload',
};

const sectionMeta: Record<HoSectionId, { title: string; subtitle: string }> = {
  preprocess: {
    title: 'Preprocess',
    subtitle: 'Mentor access queue for first-level scan screening.',
  },
  process: {
    title: 'Process',
    subtitle: 'Mark scans as completed or move them for review.',
  },
  verify: {
    title: 'Verify',
    subtitle: 'Final verification before reports move ahead.',
  },
  download: {
    title: 'Download',
    subtitle: 'Export ready scans as Excel sheets.',
  },
  report: {
    title: 'Report Upload',
    subtitle: 'Upload reports, trigger DDS/debit, or delete scans with confirmation.',
  },
};

const seedRecords: HoScanRecord[] = [
  {
    id: 'ho-1',
    section: 'preprocess',
    scanId: 'S42667',
    name: 'TEST - FEMALE',
    gender: 'F',
    age: '27',
    scanBy: 'Rathinaswamy A',
    reportType: 'Dermatoglyphics',
    cost: '3000.00',
    images: 10,
    processedBy: '9597770205',
    status: 'Pending Preprocess',
  },
  {
    id: 'ho-2',
    section: 'process',
    scanId: 'S42668',
    name: 'ANMOL VIJ',
    gender: 'M',
    age: '39',
    scanBy: 'Rathinaswamy A',
    reportType: 'Business',
    cost: '2000.00',
    images: 31,
    processedBy: '9597770205',
    status: 'In Process',
  },
  {
    id: 'ho-3',
    section: 'verify',
    scanId: 'S42669',
    name: 'RIYA SARAVANAN /10',
    scanBy: 'Team Mentor',
    reportType: 'Student',
    cost: '1500.00',
    images: 12,
    processedBy: '9345678901',
    status: 'Awaiting Verification',
  },
  {
    id: 'ho-4',
    section: 'download',
    scanId: 'S42670',
    name: 'RUDRA VIJ /12',
    scanBy: 'SELF',
    reportType: 'Institution',
    cost: '2000.00',
    images: 15,
    processedBy: '9345678901',
    status: 'Ready to Download',
  },
  {
    id: 'ho-5',
    section: 'report',
    scanId: 'S42671',
    name: 'MEERA /18',
    scanBy: 'SELF',
    reportType: 'Career',
    cost: '2500.00',
    images: 14,
    processedBy: '9090909090',
    status: 'Awaiting Report Upload',
  },
];

function hoStatusStyles(status: string) {
  const value = status.toLowerCase();
  if (value.includes('completed') || value.includes('verified') || value.includes('uploaded') || value.includes('debited') || value.includes('downloaded')) {
    return { color: theme.success, background: theme['success-bg'] };
  }
  if (value.includes('review') || value.includes('process') || value.includes('pending') || value.includes('awaiting') || value.includes('ready')) {
    return { color: theme.warning, background: theme['warning-bg'] };
  }
  if (value.includes('reject') || value.includes('delete')) {
    return { color: theme.error, background: theme['error-bg'] };
  }
  return { color: theme.primary, background: theme['primary-soft'] };
}

function HoDeleteScanModal({
  open,
  record,
  onClose,
  onConfirm,
}: {
  open: boolean;
  record: HoScanRecord | null;
  onClose: () => void;
  onConfirm: (record: HoScanRecord) => void;
}) {
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

  if (!open || !record) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel reports-delete-modal" role="dialog" aria-modal="true" aria-labelledby="ho-delete-scan-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="ho-delete-scan-title" className="modal-title">
              Delete scan?
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.name}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p className="reports-delete-warning">
            This will permanently remove the scan from the report queue. This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-pill-primary reports-delete-confirm"
            onClick={() => {
              onConfirm(record);
              onClose();
            }}
          >
            Delete scan
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScansHoPage({ onOpenMobileMenu, onOpenProfile }: ScansHoPageProps) {
  const [activeSection, setActiveSection] = useState<HoSectionId>('preprocess');
  const [records, setRecords] = useState<HoScanRecord[]>(seedRecords);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HoScanRecord | null>(null);
  const [panelTarget, setPanelTarget] = useState<HoScanRecord | null>(null);
  const [panelMode, setPanelMode] = useState<ProcessScanMode>('process');

  const openFingerprintPanel = (row: HoScanRecord, mode: ProcessScanMode) => {
    setPanelMode(mode);
    setPanelTarget(row);
  };

  const canOpenFingerprint =
    activeSection === 'preprocess' || activeSection === 'process' || activeSection === 'verify';

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const grouped = useMemo(
    () => ({
      preprocess: records.filter((record) => record.section === 'preprocess'),
      process: records.filter((record) => record.section === 'process'),
      verify: records.filter((record) => record.section === 'verify'),
      download: records.filter((record) => record.section === 'download'),
      report: records.filter((record) => record.section === 'report'),
    }),
    [records]
  );

  const updateRecord = (id: string, patch: Partial<HoScanRecord>, message: string) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, ...patch } : record)));
    setNotice(message);
  };

  const removeRecord = (record: HoScanRecord) => {
    setRecords((prev) => prev.filter((item) => item.id !== record.id));
    setNotice(`Scan ${record.scanId} deleted from report upload.`);
  };

  const rows = grouped[activeSection];
  const meta = sectionMeta[activeSection];

  const toProcessRecord = (row: HoScanRecord) => ({
    scanId: row.scanId,
    name: row.name,
    gender: row.gender,
    age: row.age,
    phone: row.processedBy,
  });

  return (
    <section className="page-section ho-scans-page">
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
            My Scans (H.O)
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Review uploaded scans across preprocess, process, verify, download, and report upload queues.
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

      <div className="dash-card ho-scans-nav-card">
        <div className="ho-scans-nav" role="tablist" aria-label="Head Office scan sections">
          {(Object.keys(sectionLabels) as HoSectionId[]).map((section) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={activeSection === section}
              className={`ho-scans-nav-btn${activeSection === section ? ' is-active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {sectionLabels[section]}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className="ho-scans-notice"
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

      <div className="dash-card scans-table-card ho-scans-card">
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">{meta.title}</h2>
            <p className="scans-card-sub">{meta.subtitle}</p>
          </div>
          <span className="scans-card-meta">{rows.length}</span>
        </div>

        <div className="scans-table-wrap">
          <table className="scans-table ho-scans-table">
            <thead>
              <tr>
                <th>Sno</th>
                <th>Scan Id</th>
                <th>Name</th>
                <th>Scan By</th>
                <th>Report Type</th>
                <th>Cost</th>
                <th className="col-center">Images</th>
                <th>Processed By</th>
                <th className="col-center">Status</th>
                {activeSection === 'download' ? <th className="col-center">Download</th> : null}
                {activeSection === 'report' ? (
                  <>
                    <th className="col-center">Upload</th>
                    <th className="col-center">DDS</th>
                    <th className="col-center">Debit</th>
                    <th className="col-center">Delete Scan</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const chip = hoStatusStyles(row.status);
                return (
                  <tr
                    key={row.id}
                    className={canOpenFingerprint ? 'ho-scans-row-clickable' : undefined}
                    onClick={
                      canOpenFingerprint
                        ? () => openFingerprintPanel(row, activeSection as ProcessScanMode)
                        : undefined
                    }
                    onKeyDown={
                      canOpenFingerprint
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openFingerprintPanel(row, activeSection as ProcessScanMode);
                            }
                          }
                        : undefined
                    }
                    tabIndex={canOpenFingerprint ? 0 : undefined}
                    role={canOpenFingerprint ? 'button' : undefined}
                    aria-label={canOpenFingerprint ? `Open fingerprint panel for ${row.scanId}` : undefined}
                  >
                    <td data-label="Sno">{index + 1}</td>
                    <td data-label="Scan Id">
                      {canOpenFingerprint ? (
                        <button
                          type="button"
                          className="ho-scans-scan-id-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFingerprintPanel(row, activeSection as ProcessScanMode);
                          }}
                        >
                          {row.scanId}
                        </button>
                      ) : (
                        row.scanId
                      )}
                    </td>
                    <td data-label="Name">{row.name}</td>
                    <td data-label="Scan By">{row.scanBy}</td>
                    <td data-label="Report Type">{row.reportType}</td>
                    <td data-label="Cost">{row.cost}</td>
                    <td data-label="Images">
                      <span className="ho-scans-image-count">{row.images}</span>
                    </td>
                    <td data-label="Processed By">{row.processedBy}</td>
                    <td data-label="Status">
                      <span className="scans-status-chip" style={chip}>
                        {row.status}
                      </span>
                    </td>

                    {activeSection === 'download' ? (
                      <td data-label="Download" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="scans-action-btn"
                          onClick={() => updateRecord(row.id, { status: 'Downloaded' }, `Excel download started for ${row.scanId}.`)}
                        >
                          Download as XL
                        </button>
                      </td>
                    ) : null}

                    {activeSection === 'report' ? (
                      <>
                        <td data-label="Upload" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="scans-action-btn scans-action-export"
                            onClick={() => updateRecord(row.id, { status: 'Uploaded' }, `Report uploaded for ${row.scanId}.`)}
                          >
                            Upload
                          </button>
                        </td>
                        <td data-label="DDS" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="scans-action-btn"
                            onClick={() => updateRecord(row.id, { status: 'DDS Done' }, `DDS marked for ${row.scanId}.`)}
                          >
                            DDS
                          </button>
                        </td>
                        <td data-label="Debit" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="scans-action-btn"
                            onClick={() => updateRecord(row.id, { status: 'Debited' }, `Debit recorded for ${row.scanId}.`)}
                          >
                            Debit
                          </button>
                        </td>
                        <td data-label="Delete Scan" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="scans-action-btn scans-action-danger" onClick={() => setDeleteTarget(row)}>
                            Delete scan
                          </button>
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProcessScanModal
        open={Boolean(panelTarget)}
        mode={panelMode}
        record={panelTarget ? toProcessRecord(panelTarget) : null}
        onClose={() => setPanelTarget(null)}
        onAccept={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (row) {
            updateRecord(
              row.id,
              { section: 'process', status: 'In Process' },
              `Scan ${record.scanId} accepted · ${record.mainPattern || 'pattern'} / ${record.subPattern || 'sub'} · URC/RRC/LFO = 0.`
            );
          }
        }}
        onReject={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (!row) return;
          if (panelMode === 'verify') {
            updateRecord(row.id, { status: 'Rejected' }, `Scan ${record.scanId} rejected in verify.`);
          } else {
            updateRecord(row.id, { status: 'Rejected' }, `Scan ${record.scanId} rejected in preprocess.`);
          }
        }}
        onComplete={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (!row) return;
          if (panelMode === 'verify') {
            updateRecord(row.id, { section: 'download', status: 'Ready to Download' }, `Scan ${record.scanId} verified.`);
          } else {
            updateRecord(row.id, { status: 'Completed' }, `Scan ${record.scanId} marked completed.`);
          }
        }}
        onReview={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (row) updateRecord(row.id, { status: 'To be reviewed' }, `Scan ${record.scanId} moved to review.`);
        }}
      />

      <HoDeleteScanModal
        open={Boolean(deleteTarget)}
        record={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeRecord}
      />
    </section>
  );
}
