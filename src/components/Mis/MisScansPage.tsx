import { useCallback, useEffect, useState } from 'react';
import { getMisScans } from '../../api';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapMisScans } from './misApiMapper';
import { MisCabUploadModal } from './MisCabUploadModal';
import { MONTH_LABELS, NETWORK_YEAR, type MlaMember, type NetworkScan } from './misData';

const theme = colors.light;
const PAGE_SIZE = 12;

type MisScansPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  initialMonth?: number;
  initialScanCode?: string | null;
  initialOpenCabUpload?: boolean;
  onNavigate?: (view: import('../Layout/navItems').AppView, target?: string) => void;
};

export function MisScansPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialMonth,
  initialScanCode = null,
  initialOpenCabUpload = false,
  onNavigate,
}: MisScansPageProps) {
  const [query, setQuery] = useState(initialScanCode ?? '');
  const [mlaFilter, setMlaFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState<string>(initialMonth === undefined ? 'All' : String(initialMonth));
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<NetworkScan[]>([]);
  const [mlaMembers, setMlaMembers] = useState<MlaMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cabScan, setCabScan] = useState<NetworkScan | null>(null);

  const loadScans = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const result = await getMisScans(
        {
          year: NETWORK_YEAR,
          page,
          pageSize: PAGE_SIZE,
          mlaId: mlaFilter === 'All' ? undefined : Number(mlaFilter),
          month: monthFilter === 'All' ? undefined : Number(monthFilter),
          q: query.trim() || undefined,
        },
        signal,
      );
      const mapped = mapMisScans(result);
      setRows(mapped.rows);
      setMlaMembers(mapped.mlaMembers);
      setTotal(mapped.total);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load scans.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, mlaFilter, monthFilter, query]);

  useEffect(() => {
    const controller = new AbortController();
    loadScans(controller.signal);
    return () => controller.abort();
  }, [loadScans]);

  useEffect(() => {
    if (!initialScanCode) return;
    setQuery(initialScanCode);
    setPage(1);
  }, [initialScanCode]);

  useEffect(() => {
    if (!initialOpenCabUpload || !initialScanCode || rows.length === 0) return;
    const match = rows.find((row) => row.scanId.toUpperCase() === initialScanCode.toUpperCase());
    if (match) setCabScan(match);
  }, [initialOpenCabUpload, initialScanCode, rows]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows;

  const resetFilters = () => {
    setQuery('');
    setMlaFilter('All');
    setMonthFilter('All');
    setPage(1);
  };

  const hasFilters = query.trim() !== '' || mlaFilter !== 'All' || monthFilter !== 'All';

  if (loadError) {
    return (
      <section className="page-section mis-page">
        <EmptyState title="Could not load scans" description={loadError} />
        <button type="button" className="btn-pill-secondary" style={{ marginTop: spacing[3] }} onClick={() => loadScans()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="page-section mis-page">
      <MisCabUploadModal
        open={cabScan != null}
        scanCode={cabScan?.scanId ?? ''}
        clientName={cabScan?.clientName}
        onClose={() => setCabScan(null)}
      />

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
            MIS · Scans
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Scan database for the entire network · {NETWORK_YEAR}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton onNavigate={onNavigate} />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="dash-card mis-table-panel" style={{ padding: 0, minWidth: 0 }}>
        <div
          className="mis-table-toolbar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[4],
            padding: `${spacing[5]} ${spacing[6]}`,
            borderBottom: `1px solid ${theme.divider}`,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>All scans</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
              {loading ? 'Loading…' : `${total} record${total === 1 ? '' : 's'}`}
              {hasFilters && !loading ? ` (filtered)` : ''}
            </p>
          </div>

          <div className="mis-toolbar-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme['bg-muted'],
                borderRadius: radius.md,
                padding: '8px 12px',
                minWidth: 200,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Scan ID, name or MLA"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  color: theme['text-primary'],
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <select
              value={mlaFilter}
              onChange={(e) => {
                setMlaFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by MLA"
              className="mis-select"
            >
              <option value="All">All MLAs</option>
              {mlaMembers.map((mla) => (
                <option key={mla.id} value={mla.id}>
                  {mla.name}
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by month"
              className="mis-select"
            >
              <option value="All">All months</option>
              {MONTH_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label} {NETWORK_YEAR}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 36, fontSize: 13, padding: '8px 14px' }}
                onClick={resetFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mis-table-body">
          <table className="mis-data-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Name</th>
                <th>MLA</th>
                <th>Scan upload date</th>
                <th>CAB</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr className="mis-data-empty">
                  <td colSpan={5}>No scans match these filters.</td>
                </tr>
              ) : (
                pageRows.map((scan) => (
                  <tr key={scan.scanId}>
                    <td data-label="Scan ID">
                      <span className="mis-scan-id">{scan.scanId}</span>
                    </td>
                    <td data-label="Name">
                      <span className="mis-scan-name">{scan.clientName}</span>
                    </td>
                    <td data-label="MLA">{scan.mlaName}</td>
                    <td data-label="Upload date">{scan.uploadedAt}</td>
                    <td data-label="CAB">
                      <button type="button" className="scans-action-btn reports-action-cab" onClick={() => setCabScan(scan)}>
                        Upload CAB
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mis-table-footer">
          <span>
            {loading
              ? 'Loading scans'
              : total === 0
                ? '0 scans'
                : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, total)} of ${total}`}
          </span>
          <div className="mis-pager">
            <button
              type="button"
              className="btn-pill-secondary"
              style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-pill-secondary"
              style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
