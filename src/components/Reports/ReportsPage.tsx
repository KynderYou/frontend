import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  authorizeReportDownload,
  deleteReport,
  getMe,
  getMyLedger,
  getMyReports,
  requestCabFeedback,
  submitCabFeedback,
  upgradeReport,
} from '../../api';
import { colors, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonReportsStats, SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { TrashButton } from '../common/TrashButton';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { CabModal } from './CabModal';
import { DeleteScanModal } from './DeleteScanModal';
import { downloadReportPdf } from './downloadReportPdf';
import type { CabFeedbackInput } from '../../api/endpoints/cab';
import { applyReportUpdate, mapCabFeedback, reportListToRecords } from './reportApiMapper';
import { type ReportRecord } from './reportTypes';
import { isTopPackage, packageForPlan, type ReportPlan } from './reportPackages';
import { useCursorTooltip } from '../../hooks/useCursorTooltip';
import { displayReportStatus, isReportReady, matchesReportStatusFilter, REPORT_STATUS_FILTERS, reportStatusStyles, type ReportStatusFilter } from '../Scans/scanStatusStyles';
import { UpgradeReportModal } from './UpgradeReportModal';
import { InfoTip } from '../common/InfoTip';
import { initials } from '../../utils/initials';

const theme = colors.light;
const REPORTS_PAGE_SIZE = 12;

const avatarPalette = [
  { color: '#B80E66', background: '#FFF0F6' },
  { color: '#9C36B5', background: '#F8F0FC' },
  { color: '#D9480F', background: '#FFF4E6' },
  { color: '#2B8A3E', background: '#EBFBEE' },
  { color: '#0B7285', background: '#E3FAFC' },
] as const;

const statusFilters = REPORT_STATUS_FILTERS;
const FLAG_X_TIP = 'Flag X · complex scan';
type StatusFilter = ReportStatusFilter;


const MLA_VIEW_ONLY = "View only: this is your MLA's scan";

function reportMetaLine(row: ReportRecord, ready: boolean): string {
  const size = row.size && row.size !== '—' ? row.size : '';
  if (!ready) {
    return row.generatedAt ? `${row.status} since ${row.generatedAt}` : row.status;
  }
  return [size, row.generatedAt, row.plan].filter(Boolean).join(' · ');
}

function apiErrorDetail(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const detail =
      typeof err.body === 'object' && err.body !== null && 'detail' in err.body
        ? String((err.body as { detail: unknown }).detail)
        : err.message;
    return detail || fallback;
  }
  return fallback;
}

type ReportsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  /** Scan code from a CAB notification — opens that report's CAB feedback modal. */
  openCabForScan?: string | null;
  onCabOpened?: () => void;
};

export function ReportsPage({ onOpenMobileMenu, onOpenProfile, openCabForScan, onCabOpened }: ReportsPageProps) {
  const { showSuccess, showError } = useToast();
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [layout, setLayout] = useState<'cards' | 'table'>('table');
  const flagTip = useCursorTooltip();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [upgradingRecord, setUpgradingRecord] = useState<ReportRecord | null>(null);
  const [cabRecord, setCabRecord] = useState<ReportRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ReportRecord | null>(null);
  /** Ledger balance for field members; null for Admin/HO, who have no wallet. */
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletChecked, setWalletChecked] = useState(false);
  /** Mentors / trainees / MLAs need ledger balance for report actions; Admin/HO does not. */
  const [walletRequired, setWalletRequired] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [requestingCab, setRequestingCab] = useState<ReportRecord['id'] | null>(null);

  const loadReports = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [member, reports] = await Promise.all([getMe(signal), getMyReports(signal)]);
      setMemberId(member.mid);
      setIsMentor(member.role === 'Mentor');
      const needsWallet = member.role === 'Mentor' || member.role === 'Trainee' || member.role === 'MLA';
      setWalletRequired(needsWallet);
      if (needsWallet) {
        const ledger = await getMyLedger(signal);
        setWalletBalance(ledger.available_balance ?? 0);
      } else {
        setWalletBalance(null);
      }
      setWalletChecked(true);
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

  const loadedOnceRef = useRef(false);
  const [pendingCabScan, setPendingCabScan] = useState<string | null>(null);

  useEffect(() => {
    if (!openCabForScan) return;
    setPendingCabScan(openCabForScan);
    onCabOpened?.();
    if (loadedOnceRef.current) void loadReports();
  }, [openCabForScan, onCabOpened, loadReports]);

  useEffect(() => {
    if (loading) return;
    loadedOnceRef.current = true;
    if (!pendingCabScan) return;
    const target = records.find((row) => row.scanId.toLowerCase() === pendingCabScan.toLowerCase());
    setPendingCabScan(null);
    if (target) {
      setCabRecord(target);
    } else {
      showError(`Report ${pendingCabScan} was not found in My Reports.`);
    }
  }, [loading, records, pendingCabScan, showError]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((row) => {
      if (!matchesReportStatusFilter(row.status, statusFilter)) return false;
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
      plus: records.filter((r) => packageForPlan(r.plan).id === 'GBPB Plus').length,
      cab: records.filter((r) => r.cabFeedback).length,
    }),
    [records]
  );

  const walletBlocked = walletChecked && walletBalance !== null && walletBalance <= 0;
  const canUseActions = !walletBlocked;
  const walletBlockTitle = 'Top up your ledger to use report actions';
  /** Report billing can take the balance below zero; the final report unlocks once a top-up clears it. */
  const reportDues = walletBalance !== null && walletBalance < 0 ? -walletBalance : 0;
  const duesTitle = `Report billing of ₹${reportDues.toLocaleString('en-IN')} is due · top up to download`;

  const downloadTitle = (ready: boolean) => {
    if (reportDues > 0) return duesTitle;
    if (!ready) return 'The report can be downloaded once it is Ready to Download';
    return 'Download report PDF';
  };

  const upgradeTitle = (topPlan: boolean) => {
    if (topPlan) return 'Already on GBPB Plus';
    if (walletBlocked) return walletBlockTitle;
    return 'Upgrade to a higher GBP package';
  };

  /** Mentors also see their MLAs' scans, but only for CAB; the backend refuses other actions on them. */
  const isMlaRow = (row: ReportRecord) => isMentor && memberId != null && row.ownerId !== memberId;

  const uploaderLabel = (row: ReportRecord) => {
    const who = row.ownerId === memberId ? 'you' : row.ownerName || 'Unknown';
    const role = row.ownerId !== memberId && row.cabEligible ? ' (MLA)' : '';
    const forTrainee = row.uploadedForTrainee && row.details.referredBy ? ` for ${row.details.referredBy}` : '';
    return `Uploaded by ${who}${role}${forTrainee}`;
  };

  /** Mentor asking their MLA to rate the CAB: only while there is no feedback yet, or it was rejected. */
  const canRequestCab = (row: ReportRecord) =>
    isMentor &&
    row.ownerId !== memberId &&
    !row.uploadedForTrainee &&
    Boolean(row.cabEligible) &&
    (!row.cabFeedback || row.cabFeedback.status === 'Rejected');

  const cabDisabled = (row: ReportRecord) =>
    Boolean(row.uploadedForTrainee) || (row.ownerId === memberId && !row.cabEligible) || requestingCab === row.id;

  const handleRequestCab = async (record: ReportRecord) => {
    setRequestingCab(record.id);
    try {
      const res = await requestCabFeedback(record.scanId);
      setRecords((prev) => prev.map((row) => (row.id === record.id ? { ...row, cabRequestedAt: res.requested_at } : row)));
      showSuccess(`Asked the MLA to rate the CAB for scan ${record.scanId}.`);
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not request feedback. Please try again.'));
    } finally {
      setRequestingCab(null);
    }
  };

  const onCabClick = (row: ReportRecord) => {
    if (canRequestCab(row)) void handleRequestCab(row);
    else setCabRecord(row);
  };

  const cabTitle = (row: ReportRecord) => {
    if (isOwnNonMlaScan(row)) return 'Your own scan · CAB feedback is only for scans your MLAs upload';
    if (row.uploadedForTrainee) return 'Uploaded by the mentor for a trainee — no CAB feedback';
    if (canRequestCab(row)) {
      return row.cabRequestedAt
        ? `Requested ${row.cabRequestedAt} · click to remind the MLA again (once a day)`
        : 'Ask the MLA to rate the CAB you sent';
    }
    if (row.cabFeedback) return `CAB feedback · ${row.cabFeedback.status}`;
    if (row.ownerId !== memberId) return 'View CAB feedback from the mentee';
    return 'Rate the CAB your mentor sent';
  };

  const isOwnNonMlaScan = (row: ReportRecord) => row.ownerId === memberId && !row.cabEligible;

  const cabLabel = (row: ReportRecord) => {
    if (isOwnNonMlaScan(row)) return 'Own scan';
    if (row.uploadedForTrainee) return 'Uploaded by trainee';
    if (canRequestCab(row)) {
      if (requestingCab === row.id) return 'Requesting…';
      if (row.cabRequestedAt) return 'Requested ✓';
      return row.cabFeedback?.status === 'Rejected' ? 'Request again' : 'Request feedback';
    }
    const status = row.cabFeedback?.status;
    if (row.ownerId !== memberId) {
      if (status === 'Approved') return 'Approved ✓';
      if (status === 'Pending') return 'Awaiting approval';
      if (status === 'Rejected') return 'Rejected';
      return 'No feedback yet';
    }
    if (status === 'Approved') return 'Feedback ✓';
    if (status === 'Pending') return 'Feedback sent';
    if (status === 'Rejected') return 'Resubmit';
    return 'Feedback';
  };

  const handleDownload = async (record: ReportRecord) => {
    if (reportDues > 0) {
      showError(duesTitle);
      return;
    }
    try {
      await authorizeReportDownload(record.numericId);
      await downloadReportPdf(record);
      showSuccess(`Report for scan ${record.scanId} downloaded.`);
    } catch (err) {
      showError(apiErrorDetail(err, 'Download failed. Please try again.'));
    }
  };

  const handleUpgrade = async (record: ReportRecord, targetPlan: ReportPlan) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updated = await upgradeReport(record.numericId, targetPlan);
      setRecords((prev) => applyReportUpdate(prev, updated));
      showSuccess(`Scan ${record.scanId} upgraded to ${targetPlan}. The upgraded report will be available shortly.`);
    } catch (err) {
      showError(apiErrorDetail(err, 'Upgrade failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCabFeedback = async (record: ReportRecord, input: CabFeedbackInput) => {
    try {
      const cabFeedback = mapCabFeedback(await submitCabFeedback(record.scanId, input));
      setRecords((prev) => prev.map((row) => (row.id === record.id ? { ...row, cabFeedback } : row)));
      showSuccess(`Feedback for scan ${record.scanId} sent to H.O for approval.`);
      return true;
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not submit feedback. Please try again.'));
      return false;
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
    const chip = reportStatusStyles(row.status);
    const ready = isReportReady(row.status);
    const topPlan = isTopPackage(row.plan);
    const plan = packageForPlan(row.plan);
    const avatar = avatarPalette[index % avatarPalette.length];

    return (
      <article
        key={row.id}
        className={row.flaggedX ? 'reports-card row-flagged' : 'reports-card'}
        {...flagTip.bind(row.flaggedX ? FLAG_X_TIP : null)}
      >
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
            <span className="reports-card-meta reports-uploader">{uploaderLabel(row)}</span>
          </div>
          <span className="scans-status-chip" style={chip}>
            {displayReportStatus(row.status)}
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
              {reportMetaLine(row, ready)}
            </span>
          </div>
          <span
            className={`reports-plan-badge${
              plan.id === 'GBPB Plus' ? ' is-premium' : plan.id === 'GBPBasic' ? ' is-basic' : ''
            }`}
          >
            {plan.id}
          </span>
        </div>

        <footer className="reports-card-actions">
          <button
            type="button"
            className="reports-card-download"
            disabled={isMlaRow(row) || reportDues > 0 || !ready}
            title={isMlaRow(row) ? MLA_VIEW_ONLY : downloadTitle(ready)}
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
              disabled={isMlaRow(row) || topPlan || !canUseActions}
              title={isMlaRow(row) ? MLA_VIEW_ONLY : upgradeTitle(topPlan)}
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
              disabled={cabDisabled(row)}
              title={cabTitle(row)}
              onClick={() => onCabClick(row)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span className="reports-tool-label">{cabLabel(row)}</span>
            </button>
            <button
              type="button"
              className="reports-tool-btn reports-tool-delete"
              title={isMlaRow(row) ? MLA_VIEW_ONLY : 'Delete scan'}
              disabled={isMlaRow(row)}
              onClick={() => setDeletingRecord(row)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
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
            <th className="col-center">
              CAB
              <InfoTip label="About CAB feedback">
                <p>
                  <strong>CAB – Counselling Audio Byte.</strong> If you need help with a report, you can request a
                  counselling audio byte from your mentor. Every Flag X scan must be counselled with an audio byte.
                </p>
                <p>
                  Once you receive the audio byte on WhatsApp or another channel, rate it here. Your mentor is credited
                  after H.O approves your feedback.
                </p>
              </InfoTip>
            </th>
            <th className="col-center">Delete Scan</th>
          </tr>
        </thead>
        <tbody>
          {listPagination.pageItems.map((row, index) => {
            const chip = reportStatusStyles(row.status);
            const ready = isReportReady(row.status);
            const topPlan = isTopPackage(row.plan);
            return (
              <tr
                key={row.id}
                className={row.flaggedX ? 'row-flagged' : undefined}
                {...flagTip.bind(row.flaggedX ? FLAG_X_TIP : null)}
              >
                <td data-label="Sno">{rowOffset + index + 1}</td>
                <td data-label="Scan Id">
                  <span className="scans-table-file-static">{row.scanId}</span>
                  <span className="scans-table-meta reports-uploader">{uploaderLabel(row)}</span>
                </td>
                <td data-label="Name">{row.details.name || '—'}</td>
                <td data-label="Gender">{row.details.gender || '—'}</td>
                <td data-label="Report">
                  <span className="scans-table-file-static">{row.reportName}</span>
                  <span className="scans-table-meta">
                    {reportMetaLine(row, ready)}
                  </span>
                </td>
                <td data-label="Status">
                  <span className="scans-status-chip" style={chip}>
                    {displayReportStatus(row.status)}
                  </span>
                </td>
                <td data-label="Download">
                  <button
                    type="button"
                    className="scans-action-btn scans-action-export"
                    disabled={isMlaRow(row) || reportDues > 0 || !ready}
                    title={isMlaRow(row) ? MLA_VIEW_ONLY : downloadTitle(ready)}
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
                    disabled={isMlaRow(row) || topPlan || !canUseActions}
                    title={isMlaRow(row) ? MLA_VIEW_ONLY : upgradeTitle(topPlan)}
                    onClick={() => setUpgradingRecord(row)}
                  >
                    {topPlan ? 'GBPB Plus' : 'Upgrade'}
                  </button>
                </td>
                <td data-label="CAB">
                  <button
                    type="button"
                    className="scans-action-btn reports-action-cab"
                    disabled={cabDisabled(row)}
                    title={cabTitle(row)}
                    onClick={() => onCabClick(row)}
                  >
                    {cabLabel(row)}
                  </button>
                </td>
                <td data-label="Delete Scan">
                  <TrashButton
                    label={isMlaRow(row) ? MLA_VIEW_ONLY : 'Delete scan'}
                    disabled={isMlaRow(row)}
                    onClick={() => setDeletingRecord(row)}
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
            All your scans and their reports — download, upgrade, give CAB feedback, or delete a scan. AI reports are coming soon.
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
            <span className="reports-stat-value">{stats.plus}</span>
            <span className="reports-stat-label">GBPB Plus</span>
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
            <span className="reports-stat-label">CAB feedback</span>
          </div>
        </div>
      </div>
      )}

      <div className="dash-card reports-list-card" style={{ width: '100%' }}>
        <div className="reports-toolbar">
          <div>
            <h2 className="scans-card-title">My scans</h2>
            <p className="scans-card-sub">
              {walletRequired
                ? 'CAB = Counselling Audio Byte (sent on WhatsApp) · MLAs rate it under CAB · actions need a funded wallet (HO exempt)'
                : 'CAB = Counselling Audio Byte (sent on WhatsApp) · MLAs rate it under CAB'}
            </p>
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
                ? 'Exported scans appear here as soon as they enter preprocessing, and stay visible through reporting.'
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
        key={cabRecord?.id ?? 'none'}
        open={Boolean(cabRecord)}
        record={cabRecord}
        isOwner={cabRecord != null && cabRecord.ownerId === memberId}
        onClose={() => setCabRecord(null)}
        onSubmit={handleCabFeedback}
      />
      <DeleteScanModal
        open={Boolean(deletingRecord)}
        record={deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
      />
      {flagTip.tooltip}
    </section>
  );
}
