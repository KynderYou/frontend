import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHoScanDetail, getHoScans, getMe, hoScanAction, resolveHoScanImages } from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { hoScanListToRecords, type HoScanRecord, type HoSectionId } from './hoScanApiMapper';
import { ProcessScanModal, type ProcessScanMode, type ProcessScanPayload, type ScanFingerPayload } from './ProcessScanModal';
import { scanStatusStyles } from './scanStatusStyles';
import type { ScanImage } from './scanTypes';

const theme = colors.light;
const HO_SCANS_PAGE_SIZE = 12;

function revokeResolvedImages(images: ScanImage[] | null) {
  if (!images) return;
  for (const image of images) {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  }
}

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
    subtitle: 'Upload reports, debit mentee, or delete scans with confirmation.',
  },
};

function actionPayloadFromProcess(record: ProcessScanPayload) {
  return {
    fingers: record.fingers.map((item) => ({
      finger: item.finger,
      main_pattern: item.mainPattern,
      sub_pattern: item.subPattern,
      urc: item.urc,
      rrc: item.rrc,
      lfo: item.lfo,
    })),
  };
}

function mapApiFingers(
  fingers: { finger: string; main_pattern: string; sub_pattern: string; urc: number; rrc: number; lfo: number }[] | undefined,
) {
  return (fingers ?? []).map((item) => ({
    finger: item.finger,
    mainPattern: item.main_pattern,
    subPattern: item.sub_pattern,
    urc: item.urc,
    rrc: item.rrc,
    lfo: item.lfo,
  }));
}

function toProcessRecord(row: HoScanRecord, initialFingers?: ReturnType<typeof mapApiFingers>) {
  return {
    scanId: row.scanId,
    name: row.name,
    gender: row.gender,
    age: row.age,
    phone: row.processedBy,
    defaultPattern: row.mainPattern,
    defaultSubPattern: row.subPattern,
    defaultFinger: row.finger,
    urc: row.urc,
    rrc: row.rrc,
    lfo: row.lfo,
    flaggedX: row.flaggedX,
    initialFingers,
  };
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
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState<HoSectionId>('preprocess');
  const [records, setRecords] = useState<HoScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [acting, setActing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HoScanRecord | null>(null);
  const [panelTarget, setPanelTarget] = useState<HoScanRecord | null>(null);
  const [panelImages, setPanelImages] = useState<ScanImage[] | null>(null);
  const [panelFingers, setPanelFingers] = useState<ScanFingerPayload[] | null>(null);
  const [panelImagesLoading, setPanelImagesLoading] = useState(false);
  const [panelMode, setPanelMode] = useState<ProcessScanMode>('process');
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getMe(controller.signal)
      .then((member) => setIsAdmin(member.role === 'Admin'))
      .catch(() => setIsAdmin(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isAdmin && activeSection !== 'preprocess') {
      setActiveSection('preprocess');
    }
  }, [isAdmin, activeSection]);

  const loadScans = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const scans = await getHoScans(signal);
      setRecords(hoScanListToRecords(scans));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load scans for processing.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadScans(controller.signal);
    return () => controller.abort();
  }, [loadScans]);

  const openFingerprintPanel = (row: HoScanRecord, mode: ProcessScanMode) => {
    setPanelMode(mode);
    setPanelTarget(row);
  };

  useEffect(() => {
    if (!panelTarget) {
      setPanelImages((prev) => {
        revokeResolvedImages(prev);
        return null;
      });
      setPanelFingers(null);
      setPanelImagesLoading(false);
      return;
    }

    const controller = new AbortController();
    setPanelImagesLoading(true);

    void (async () => {
      try {
        const detail = await getHoScanDetail(panelTarget.numericId, controller.signal);
        const resolved = await resolveHoScanImages(detail);
        if (controller.signal.aborted) {
          revokeResolvedImages(resolved.scan_images);
          return;
        }
        setPanelImages((prev) => {
          revokeResolvedImages(prev);
          return resolved.scan_images;
        });
        setPanelFingers(mapApiFingers(detail.fingers));
      } catch {
        if (!controller.signal.aborted) {
          setPanelImages((prev) => {
            revokeResolvedImages(prev);
            return [];
          });
          setPanelFingers([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPanelImagesLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [panelTarget]);

  const visibleSections = useMemo(
    () => (isAdmin ? (Object.keys(sectionLabels) as HoSectionId[]) : (['preprocess'] as HoSectionId[])),
    [isAdmin],
  );

  const canOpenFingerprint =
    activeSection === 'preprocess' || (isAdmin && (activeSection === 'process' || activeSection === 'verify'));

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

  const runAction = async (
    row: HoScanRecord,
    action: string,
    fields?: ReturnType<typeof actionPayloadFromProcess>,
    message?: string,
  ) => {
    if (acting) return;
    setActing(true);
    try {
      const result = await hoScanAction(row.numericId, { action, ...fields });
      const defaultMessage = `Scan ${row.scanId} updated.`;
      if (result === null) {
        setRecords((prev) => prev.filter((item) => item.numericId !== row.numericId));
        showSuccess(message ?? `Scan ${row.scanId} deleted from report upload.`);
      } else {
        const mapped = hoScanListToRecords([result]);
        setRecords((prev) => prev.map((item) => (item.numericId === row.numericId ? mapped[0] : item)));
        showSuccess(message ?? defaultMessage);
      }
    } catch {
      showError('Action failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const rows = grouped[activeSection];
  const listPagination = useClientPagination(rows, HO_SCANS_PAGE_SIZE, activeSection);
  const rowOffset = (listPagination.page - 1) * listPagination.pageSize;
  const meta = sectionMeta[activeSection];
  const showImages = activeSection !== 'process';
  const showProcessedBy = activeSection !== 'preprocess' && activeSection !== 'process';
  const showPreprocessedBy = activeSection === 'process';

  const showFlagColumn = isAdmin && activeSection === 'verify';

  const panelProcessRecord = useMemo(
    () => (panelTarget ? toProcessRecord(panelTarget, panelFingers ?? undefined) : null),
    [panelTarget, panelFingers],
  );

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
            Process Scan
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Review exported scans across preprocess, process, verify, download, and report upload queues.
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
        <div className="ho-scans-nav" role="tablist" aria-label="Process scan sections">
          {visibleSections.map((section) => (
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

      {loadError && (
        <p role="alert" style={{ margin: `0 0 ${spacing[4]}`, color: theme.error, fontSize: 14 }}>
          {loadError}
        </p>
      )}

      <div className="dash-card scans-table-card ho-scans-card">
        <div className="scans-card-head">
          <div>
            <h2 className="scans-card-title">{meta.title}</h2>
            <p className="scans-card-sub">{meta.subtitle}</p>
          </div>
          <span className="scans-card-meta">{rows.length}</span>
        </div>

        {loading ? (
          <EmptyState title="Loading scans…" compact />
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No scans in ${sectionLabels[activeSection]}`}
            description="Exported MLA scans will appear here when they reach this Head Office stage."
            compact
          />
        ) : (
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
                  {showImages ? <th className="col-center">Images</th> : null}
                  {showPreprocessedBy ? <th>Preprocessed By</th> : null}
                  {showProcessedBy ? <th>Processed By</th> : null}
                  {showFlagColumn ? <th className="col-center">Flag</th> : null}
                  <th className="col-center">Status</th>
                  {activeSection === 'download' ? <th className="col-center">Download</th> : null}
                  {activeSection === 'report' ? (
                    <>
                      <th className="col-center">Upload</th>
                      <th className="col-center">Debit</th>
                      <th className="col-center">Delete Scan</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {listPagination.pageItems.map((row, index) => {
                  const chip = scanStatusStyles(row.status);
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
                      <td data-label="Sno">{rowOffset + index + 1}</td>
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
                      {showImages ? (
                        <td data-label="Images">
                          <span className="ho-scans-image-count">{row.images}</span>
                        </td>
                      ) : null}
                      {showPreprocessedBy ? <td data-label="Preprocessed By">{row.preprocessedBy ?? '—'}</td> : null}
                      {showProcessedBy ? <td data-label="Processed By">{row.processedBy}</td> : null}
                      {showFlagColumn ? (
                        <td data-label="Flag" className="col-center">
                          {row.flaggedX ? (
                            <span className="process-scan-flag-chip" title="Complex scan — CAB required">
                              Flag X
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      ) : null}
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
                            disabled={acting}
                            onClick={() => runAction(row, 'download', undefined, `Excel download started for ${row.scanId}.`)}
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
                              disabled={acting}
                              onClick={() => runAction(row, 'upload', undefined, `Report uploaded for ${row.scanId}.`)}
                            >
                              Upload
                            </button>
                          </td>
                          <td data-label="Debit" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="scans-action-btn"
                              disabled={acting}
                              onClick={() => runAction(row, 'debit', undefined, `Debit recorded for ${row.scanId}.`)}
                            >
                              Debit
                            </button>
                          </td>
                          <td data-label="Delete Scan" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="scans-action-btn scans-action-danger" disabled={acting} onClick={() => setDeleteTarget(row)}>
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
            <TablePager
              page={listPagination.page}
              pageSize={listPagination.pageSize}
              total={listPagination.total}
              onPageChange={listPagination.setPage}
              className="mis-table-footer"
            />
          </div>
        )}
      </div>

      <ProcessScanModal
        open={Boolean(panelTarget)}
        mode={panelMode}
        record={panelProcessRecord}
        images={panelImages ?? undefined}
        imagesLoading={panelImagesLoading}
        onClose={() => setPanelTarget(null)}
        onAccept={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (row) {
            void runAction(
              row,
              'accept',
              actionPayloadFromProcess(record),
              `Scan ${record.scanId} accepted · ${record.mainPattern || 'pattern'} / ${record.subPattern || 'sub'}.`
            );
          }
        }}
        onReject={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (!row) return;
          void runAction(
            row,
            'reject',
            actionPayloadFromProcess(record),
            panelMode === 'verify'
              ? `Scan ${record.scanId} rejected in verify.`
              : `Scan ${record.scanId} rejected in preprocess.`
          );
        }}
        onComplete={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (!row) return;
          void runAction(
            row,
            'complete',
            actionPayloadFromProcess(record),
            panelMode === 'verify'
              ? `Scan ${record.scanId} verified.`
              : `Scan ${record.scanId} completed · moved to Verify.`
          );
        }}
        onReview={(record) => {
          const row = records.find((item) => item.scanId === record.scanId);
          if (row) void runAction(row, 'review', actionPayloadFromProcess(record), `Scan ${record.scanId} moved to review.`);
        }}
      />

      <HoDeleteScanModal
        open={Boolean(deleteTarget)}
        record={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(record) => {
          void runAction(record, 'delete');
        }}
      />
    </section>
  );
}
