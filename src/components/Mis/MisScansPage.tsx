import { useMemo, useState } from 'react';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { MONTH_LABELS, mlaMembers, networkScans, NETWORK_YEAR } from './misData';

const theme = colors.light;
const PAGE_SIZE = 12;

type MisScansPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  /** Pre-filter to a single month, used when drilling in from Network Performance */
  initialMonth?: number;
};

export function MisScansPage({ onOpenMobileMenu, onOpenProfile, initialMonth }: MisScansPageProps) {
  const [query, setQuery] = useState('');
  const [mlaFilter, setMlaFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState<string>(initialMonth === undefined ? 'All' : String(initialMonth));
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return networkScans.filter((scan) => {
      if (mlaFilter !== 'All' && scan.mlaId !== mlaFilter) return false;
      if (monthFilter !== 'All' && scan.month !== Number(monthFilter)) return false;
      if (!q) return true;
      return (
        scan.scanId.toLowerCase().includes(q) ||
        scan.clientName.toLowerCase().includes(q) ||
        scan.mlaName.toLowerCase().includes(q)
      );
    });
  }, [query, mlaFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setQuery('');
    setMlaFilter('All');
    setMonthFilter('All');
    setPage(1);
  };

  const hasFilters = query.trim() !== '' || mlaFilter !== 'All' || monthFilter !== 'All';

  return (
    <section className="page-section mis-page">
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
          <NotificationButton />
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
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
              {hasFilters ? ` of ${networkScans.length}` : ''}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, color: theme['text-muted'] }}>
                <th style={{ padding: '14px 24px', fontWeight: 600 }}>Scan ID</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>MLA</th>
                <th style={{ padding: '14px 24px', fontWeight: 600 }}>Scan upload date</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center', color: theme['text-muted'], fontSize: 14 }}>
                    No scans match these filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((scan) => (
                  <tr key={scan.scanId} style={{ borderTop: `1px dashed ${theme.divider}` }}>
                    <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700, color: theme.primary }}>
                      {scan.scanId}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>
                      {scan.clientName}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: theme['text-secondary'] }}>{scan.mlaName}</td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: theme['text-secondary'] }}>{scan.uploadedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: `${spacing[4]} ${spacing[6]}`,
            borderTop: `1px solid ${theme.divider}`,
            fontSize: 13,
            color: theme['text-secondary'],
          }}
        >
          <span>
            {filtered.length === 0
              ? '0 scans'
              : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
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
