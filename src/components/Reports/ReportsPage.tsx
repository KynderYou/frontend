import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteReport, getMyReports, requestReportCab, upgradeReport } from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonReportsStats, SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { CabModal } from './CabModal';
import { DeleteScanModal } from './DeleteScanModal';
import { downloadReportPdf } from './downloadReportPdf';
import { applyReportUpdate, reportListToRecords } from './reportApiMapper';
import { type ReportRecord } from './reportTypes';
import { isReportReady, REPORT_STATUS_FILTERS, scanStatusStyles, type ReportStatusFilter } from '../Scans/scanStatusStyles';
import { UpgradeReportModal } from './UpgradeReportModal';

const theme = colors.light;
const REPORTS_PAGE_SIZE = 12;

const avatarPalette = [
  { color: '#4C5AD4', background: '#EEF0FF' },
  { color: '#9C36B5', background: '#F8F0FC' },
  { color: '#D9480F', background: '#FFF4E6' },
  { color: '#2B8A3E', background: '#EBFBEE' },
  { color: '#C2255C', background: '#FFF0F6' },
] as const;

const statusFilters = REPORT_STATUS_FILTERS;
type StatusFilter = ReportStatusFilter;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ReportsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function ReportsPage({ onOpenMobileMenu, onOpenProfile }: ReportsPageProps) {
  const { showSuccess, showError } = useToast();
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [layout, setLayout] = useState<'cards' | 'table'>('table');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [upgradingRecord, setUpgradingRecord] = useState<ReportRecord | null>(null);
  const [cabRecord, setCabRecord] = useState<ReportRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ReportRecord | null>(null);

  const loadReports = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const reports = await getMyReports(signal);
      setRecords(reportListToRecords(reports));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load reports.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((row) => {
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.details.name.toLowerCase().includes(q) ||
        row.scanId.toLowerCase().includes(q) ||
        row.reportName.toLowerCase().includes(q)
      );
    });
  }, [records, query, statusFilter]);

  const listPagination = useClientPagination(filtered, REPORTS_PAGE_SIZE, `${query}-${statusFilter}`);
  const rowOffset = (listPagination.page - 1) * listPagination.pageSize;

  const stats = useMemo(
    () => ({
      total: records.length,
      ready: records.filter((r) => isReportReady(r.status)).length,
      premium: records.filter((r) => r.plan === 'Premium').length,
      cab: records.reduce((sum, r) => sum + r.cabAudios.length, 0),
    }),
    [records]
  );

  const handleDownload = async (record: ReportRecord) => {
    try {
      await downloadReportPdf(record);
      showSuccess(`Report for scan ${record.scanId} downloaded.`);
    } catch {
      showError('Download failed. Please try again.');
    }
  };

  const handleUpgrade = async (record: ReportRecord) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await upgradeReport(record.numericId);
      setRecords((prev) => applyReportUpdate(prev, updated));
      showSuccess(`Scan ${record.scanId} upgraded to Premium. The upgraded report will be available shortly.`);
    } catch {
      showError('Upgrade failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCabRequest = async (record: ReportRecord) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await requestReportCab(record.numericId);
      setRecords((prev) => applyReportUpdate(prev, updated));
      setCabRecord((current) => {
        if (!current || current.id !== record.id) return current;
        return applyReportUpdate([current], updated)[0] ?? current;
      });
      showSuccess(`CAB requested for scan ${record.scanId}. The counselling team has been notified.`);
    } catch {
      showError('CAB request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record: ReportRecord) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteReport(record.numericId);
      setRecords((prev) => prev.filter((row) => row.id !== record.id));
      showSuccess(`Scan ${record.scanId} and its report were deleted.`);
    } catch {
      showError('Delete failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCard = (row: ReportRecord, index: number) => {
    const chip = scanStatusStyles(row.status);
    const ready = isReportReady(row.status);
    const isPremium = row.plan === 'Premium';
    const avatar = avatarPalette[index % avatarPalette.length];

    return (
      <article key={row.id} className="reports-card">
        <header className="reports-card-top">
          <span className="reports-card-avatar" style={avatar} aria-hidden="true">
            {initials(row.details.name)}
          </span>
          <div className="reports-card-idblock">
            <span className="reports-card-name">{row.details.name || 'Unnamed client'}</span>
            <span className="reports-card-meta">
              {row.scanId}
              {row.details.gender ? ` · ${row.details.gender}` : ''}
              {row.details.age ? ` · ${row.details.age} yrs` : ''}
            </span>
          </div>
          <span className="scans-status-chip" style={chip}>
            {row.status}
          </span>
        </header>

        <div className="reports-card-file">
          <span className="reports-card-file-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <div className="reports-card-file-body">
            <span className="reports-card-file-name" title={row.reportName}>
              {row.reportName}
            </span>
            <span className="reports-card-file-meta">
              {ready ? `${row.size} · ${row.generatedAt}` : `Processing since ${row.generatedAt}`}
            </span>
          </div>
          <span className={`reports-plan-badge${isPremium ? ' is-premium' : ''}`}>{row.plan}</span>
        </div>

        <footer className="reports-card-actions">
          <button
            type="button"
            className="reports-card-download"
            disabled={!ready}
            title={ready ? 'Download report PDF' : 'Report is still processing'}
            onClick={() => handleDownload(row)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Download
          </button>

          <div className="reports-card-tools">
            <button
              type="button"
              className="reports-tool-btn reports-tool-ai"
              disabled
              title="AI-generated reports are coming soon"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span className="reports-tool-label">AI Report</span>
              <span className="reports-soon-badge">Soon</span>
            </button>
            <button
              type="button"
              className="reports-tool-btn reports-tool-upgrade"
              disabled={isPremium || !ready}
              title={
                isPremium
                  ? 'Already on the Premium plan'
                  : ready
                    ? 'Upgrade this report to Premium'
                    : 'Report is still processing'
              }
              onClick={() => setUpgradingRecord(row)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 12-4-4-4 4" />
                <path d="M12 16V8" />
              </svg>
              <span className="reports-tool-label">Upgrade</span>
            </button>
            <button
              type="button"
              className="reports-tool-btn reports-tool-cab"
              disabled={!ready}
              title={ready ? 'Counselling Audio Bytes' : 'Report is still processing'}
              onClick={() => setCabRecord(row)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span className="reports-tool-label">CAB</span>
              {row.cabAudios.length > 0 && (
                <span className="reports-tool-badge">{row.cabAudios.length}</span>
              )}
            </button>
            <button
              type="button"
              className="reports-tool-btn reports-tool-delete"
              title="Delete scan"
              onClick={() => setDeletingRecord(row)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="reports-tool-label">Delete</span>
            </button>
          </div>
        </footer>
      </article>
    );
  };

  const renderTable = () => (
    <div className="scans-table-wrap">
      <table className="scans-table reports-table">
        <thead>
          <tr>
            <th>Sno</th>
            <th>Scan Id</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Report</th>
            <th className="col-center">Status</th>
            <th className="col-center">Download</th>
            <th className="col-center">AI Report</th>
            <th className="col-center">Upgrade</th>
            <th className="col-center">CAB</th>
            <th className="col-center">Delete Scan</th>
          </tr>
        </thead>
        <tbody>
          {listPagination.pageItems.map((row, index) => {
            const chip = scanStatusStyles(row.status);
            const ready = isReportReady(row.status);
            const isPremium = row.plan === 'Premium';
            return (
              <tr key={row.id}>
                <td data-label="Sno">{rowOffset + index + 1}</td>
                <td data-label="Scan Id">
                  <span className="scans-table-file-static">{row.scanId}</span>
                </td>
                <td data-label="Name">{row.details.name || '—'}</td>
                <td data-label="Gender">{row.details.gender || '—'}</td>
                <td data-label="Report">
                  <span className="scans-table-file-static">{row.reportName}</span>
                  <span className="scans-table-meta">
                    {row.size} · {row.generatedAt} · {row.plan}
                  </span>
                </td>
                <td data-label="Status">
                  <span className="scans-status-chip" style={chip}>
                    {row.status}
                  </span>
                </td>
                <td data-label="Download">
                  <button
                    type="button"
                    className="scans-action-btn scans-action-export"
                    disabled={!ready}
                    title={ready ? 'Download report PDF' : 'Report is still processing'}
                    onClick={() => handleDownload(row)}
                  >
                    Download
                  </button>
                </td>
                <td data-label="AI Report">
                  <button
                    type="button"
                    className="scans-action-btn reports-action-ai"
                    disabled
                    title="AI-generated reports are coming soon"
                  >
                    AI Report · Soon
                  </button>
                </td>
                <td data-label="Upgrade">
                  <button
                    type="button"
                    className="scans-action-btn reports-action-upgrade"
                    disabled={isPremium || !ready}
                    title={
                      isPremium
                        ? 'Already on the Premium plan'
                        : ready
                          ? 'Upgrade this report to Premium'
                          : 'Report is still processing'
                    }
                    onClick={() => setUpgradingRecord(row)}
                  >
                    {isPremium ? 'Premium' : 'Upgrade'}
                  </button>
                </td>
                <td data-label="CAB">
                  <button
                    type="button"
                    className="scans-action-btn reports-action-cab"
                    disabled={!ready}
                    title={ready ? 'Counselling Audio Bytes' : 'Report is still processing'}
                    onClick={() => setCabRecord(row)}
                  >
                    CAB{row.cabAudios.length > 0 ? ` (${row.cabAudios.length})` : ''}
                  </button>
                </td>
                <td data-label="Delete Scan">
                  <button
                    type="button"
                    className="scans-action-btn scans-action-danger"
                    onClick={() => setDeletingRecord(row)}
                  >
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
    </div>
  );

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
            My Reports
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            All your scans and their reports — download, upgrade, listen to CAB, or delete a scan. AI reports are coming soon.
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

      {loading ? (
        <SkeletonReportsStats />
      ) : (
      <div className="reports-stats">
        <div className="reports-stat">
          <span className="reports-stat-icon reports-stat-icon-blue" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <path d="M7 12h10" />
            </svg>
          </span>
          <div>
            <span className="reports-stat-value">{stats.total}</span>
            <span className="reports-stat-label">Total scans</span>
          </div>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-icon reports-stat-icon-green" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
          <div>
            <span className="reports-stat-value">{stats.ready}</span>
            <span className="reports-stat-label">Reports ready</span>
          </div>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-icon reports-stat-icon-amber" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
          </span>
          <div>
            <span className="reports-stat-value">{stats.premium}</span>
            <span className="reports-stat-label">Premium</span>
          </div>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-icon reports-stat-icon-purple" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </span>
          <div>
            <span className="reports-stat-value">{stats.cab}</span>
            <span className="reports-stat-label">CAB audios</span>
          </div>
        </div>
      </div>
      )}

      <div className="dash-card reports-list-card" style={{ width: '100%' }}>
        <div className="reports-toolbar">
          <div>
            <h2 className="scans-card-title">My scans</h2>
            <p className="scans-card-sub">CAB = Counselling Audio Byte · reports unlock once processing completes</p>
          </div>

          <div className="reports-toolbar-controls">
            <div className="reports-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search name or scan id"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="reports-filter-group" role="group" aria-label="Filter by status">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`reports-filter-chip${statusFilter === status ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="reports-layout-toggle" role="group" aria-label="Switch layout">
              <button
                type="button"
                className={layout === 'cards' ? 'is-active' : ''}
                aria-label="Card view"
                title="Card view"
                onClick={() => setLayout('cards')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                type="button"
                className={layout === 'table' ? 'is-active' : ''}
                aria-label="Table view"
                title="Table view"
                onClick={() => setLayout('table')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {loadError && (
          <p role="alert" style={{ margin: `0 0 ${spacing[4]}`, color: theme.error, fontSize: 14 }}>
            {loadError}
          </p>
        )}

        {loading ? (
          <SkeletonTableCard rows={8} columns={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? 'No reports yet' : 'No reports match your search'}
            description={
              records.length === 0
                ? 'Scans you upload will appear here once processing completes.'
                : 'Try a different name, scan id, or status filter.'
            }
            compact
          />
        ) : layout === 'cards' ? (
          <>
            <div className="reports-card-grid">{listPagination.pageItems.map(renderCard)}</div>
            <TablePager
              page={listPagination.page}
              pageSize={listPagination.pageSize}
              total={listPagination.total}
              onPageChange={listPagination.setPage}
              className="mis-table-footer"
            />
          </>
        ) : (
          renderTable()
        )}
      </div>

      <UpgradeReportModal
        open={Boolean(upgradingRecord)}
        record={upgradingRecord}
        onClose={() => setUpgradingRecord(null)}
        onConfirm={handleUpgrade}
      />
      <CabModal
        open={Boolean(cabRecord)}
        record={cabRecord}
        onClose={() => setCabRecord(null)}
        onRequest={handleCabRequest}
      />
      <DeleteScanModal
        open={Boolean(deletingRecord)}
        record={deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
