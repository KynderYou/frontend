import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getMisNetwork } from '../../api';
import type { NetworkScope } from '../../api/types';
import { colors, metricColors, spacing, typography, type MetricColor } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonKpiGrid, SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { DailyScansLineChart } from './DailyScansLineChart';
import { MonthlyBarChart } from './MonthlyBarChart';
import { mapMisNetwork } from './misApiMapper';
import { useClientPagination } from '../../hooks/useClientPagination';
import {
  formatCompactMoney,
  formatMoney,
  LOW_PERFORMER_THRESHOLD,
  NETWORK_YEARS,
  type NetworkYear,
} from './misData';
import { initials } from '../../utils/initials';

const theme = colors.light;
const TEAM_DB_PAGE_SIZE = 15;

const SCOPE_COPY: Record<NetworkScope, { subtitle: string; scansHint: string; billingLabel: string }> = {
  network: { subtitle: 'How the entire network is performing', scansHint: 'network total', billingLabel: 'Network billing' },
  team: { subtitle: 'How you and your MLAs & counselors are performing', scansHint: 'team total', billingLabel: 'Team billing' },
  self: { subtitle: 'How you are performing', scansHint: 'your scans', billingLabel: 'Your billing' },
};

type NetworkPerformancePageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function NetworkPerformancePage({ onOpenMobileMenu, onOpenProfile }: NetworkPerformancePageProps) {
  const [selectedYear, setSelectedYear] = useState<NetworkYear>(NETWORK_YEARS[0]);
  const [yearData, setYearData] = useState(() => mapMisNetwork({
    year: NETWORK_YEARS[0],
    scope: 'self',
    months_so_far: 0,
    default_month: 0,
    last_quarter_label: '',
    low_performer_threshold: LOW_PERFORMER_THRESHOLD,
    year_totals: { scans: 0, reviews: 0, billing: 0 },
    reviews_by_month: [],
    billing_by_month: [],
    performance_rows: [],
    low_performers: [],
  }));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dailyMonth, setDailyMonth] = useState(() => new Date().getMonth());
  const [billingMonth, setBillingMonth] = useState(0);
  const [teamDbOpen, setTeamDbOpen] = useState(false);

  const teamPagination = useClientPagination(
    yearData.performanceRows,
    TEAM_DB_PAGE_SIZE,
    teamDbOpen ? `team-${selectedYear}` : 'team-closed',
  );

  const loadNetwork = useCallback(async (year: NetworkYear, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getMisNetwork(year, signal);
      const mapped = mapMisNetwork(state);
      setYearData(mapped);
      setDailyMonth(year === new Date().getFullYear() ? new Date().getMonth() : mapped.defaultMonth);
      setBillingMonth(mapped.defaultMonth);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load network performance.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadNetwork(selectedYear, controller.signal);
    return () => controller.abort();
  }, [selectedYear, loadNetwork]);

  if (loading) {
    return (
      <section className="page-section mis-page">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>Network Performance</h1>
          </div>
        </div>
        <SkeletonKpiGrid count={4} />
        <SkeletonTableCard rows={8} columns={6} />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section mis-page">
        <EmptyState title="Could not load network data" description={loadError} />
        <button type="button" className="btn-pill-secondary" style={{ marginTop: spacing[3] }} onClick={() => loadNetwork(selectedYear)}>
          Retry
        </button>
      </section>
    );
  }

  const copy = SCOPE_COPY[yearData.scope];
  const isSelf = yearData.scope === 'self';
  const ownQuarterScans = yearData.performanceRows[0]?.scansQuarter ?? 0;

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
            Network Performance
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
            {copy.subtitle} across {selectedYear}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="mis-year-filter" aria-label="Timeline year">
            <span className="mis-year-filter-label">Timeline</span>
            <select
              className="mis-year-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value) as NetworkYear)}
            >
              {NETWORK_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          {!isSelf ? (
            <button
              type="button"
              className="btn-pill-primary"
              style={{ height: 36, fontSize: 13, padding: '8px 16px' }}
              onClick={() => setTeamDbOpen(true)}
            >
              Team DB
            </button>
          ) : null}
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="mis-kpi-row">
        <KpiCard label="Scans this year" value={yearData.yearTotals.scans.toLocaleString('en-IN')} hint={`${selectedYear} ${copy.scansHint}`} tone="blue" />
        <KpiCard label="Reviews & testimonials" value={yearData.yearTotals.reviews.toLocaleString('en-IN')} hint={`Posted in ${selectedYear}`} tone="green" />
        <KpiCard label={copy.billingLabel} value={formatCompactMoney(yearData.yearTotals.billing)} hint={`${selectedYear} · scan report debits`} tone="purple" />
        {isSelf ? (
          <KpiCard
            label="Scans last quarter"
            value={String(ownQuarterScans)}
            hint={`Target ${LOW_PERFORMER_THRESHOLD} per quarter`}
            tone="amber"
          />
        ) : (
          <KpiCard
            label="Low performers"
            value={String(yearData.lowPerformers.length)}
            hint={`Under ${LOW_PERFORMER_THRESHOLD} scans last quarter`}
            tone="amber"
          />
        )}
      </div>

      <DailyScansLineChart
        year={selectedYear}
        scansByDay={yearData.scansByDay ?? []}
        month={dailyMonth}
        onMonthChange={setDailyMonth}
      />

      <div className="mis-summary-grid">
        <MonthlyBarChart
          title="Monthly billing"
          subtitle={`Scan report billing debited each month in ${selectedYear}`}
          data={yearData.billingByMonth}
          activeMonth={billingMonth}
          onSelectMonth={setBillingMonth}
          formatValue={formatCompactMoney}
          unit="billed"
        />

        <div className="dash-card mis-insights-card">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Quick insights</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
              {isSelf ? 'Your scans' : `Members under ${LOW_PERFORMER_THRESHOLD} scans`} in the last quarter (
              {yearData.lastQuarterLabel})
            </p>
          </div>

          {yearData.lowPerformers.length === 0 ? (
            <p style={{ margin: `${spacing[5]} 0 0`, fontSize: 14, color: theme['text-muted'] }}>
              {isSelf ? 'You' : 'Every member'} cleared {LOW_PERFORMER_THRESHOLD} scans last quarter.
            </p>
          ) : (
            <ul className="mis-insight-list">
              {yearData.lowPerformers.map((row) => {
                const idle = row.scansQuarter === 0;
                const detail = [row.name, row.region, `${row.scansYear} ${row.scansYear === 1 ? 'scan' : 'scans'} in ${selectedYear}`]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={row.id} className={`ledger-company-row ${idle ? 'tone-red' : 'tone-amber'}`}>
                    <span className="ledger-company-icon mis-insight-initials" aria-hidden="true">
                      {initials(row.name)}
                    </span>
                    <div className="ledger-company-text">
                      <span className="ledger-company-sector">{idle ? 'No scans last quarter' : 'Low activity'}</span>
                      <span className="ledger-company-desc" title={detail}>
                        {detail}
                      </span>
                    </div>
                    <span className="ledger-company-amount mis-insight-count">
                      {row.scansQuarter} {row.scansQuarter === 1 ? 'scan' : 'scans'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {!isSelf ? (
            <button
              type="button"
              className="btn-pill-secondary"
              style={{ marginTop: spacing[5], height: 36, fontSize: 13, padding: '8px 16px', alignSelf: 'flex-start' }}
              onClick={() => setTeamDbOpen(true)}
            >
              Open Team DB
            </button>
          ) : null}
        </div>
      </div>

      {teamDbOpen && (
        <MisOverlay
          title="Team DB"
          subtitle={`${teamPagination.total} members · ${selectedYear} performance`}
          onClose={() => setTeamDbOpen(false)}
        >
          <div className="mis-overlay-table mis-overlay-table--tall">
            <table className="mis-data-table mis-data-table--compact">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Region</th>
                  <th className="col-center">Scans (last quarter)</th>
                  <th className="col-center">Scans (year)</th>
                  <th className="col-center">Reviews</th>
                  <th className="col-right">Billing</th>
                </tr>
              </thead>
              <tbody>
                {teamPagination.pageItems.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Member">
                      <span className="mis-scan-name">{row.name}</span>
                    </td>
                    <td data-label="Region">{row.region}</td>
                    <td data-label="Last quarter" className="col-center">
                      <span
                        style={{
                          fontWeight: 700,
                          color: row.scansQuarter < LOW_PERFORMER_THRESHOLD ? metricColors.amber.text : theme['text-primary'],
                        }}
                      >
                        {row.scansQuarter}
                      </span>
                    </td>
                    <td data-label="Year scans" className="col-center">{row.scansYear}</td>
                    <td data-label="Reviews" className="col-center">{row.reviews}</td>
                    <td data-label="Billing" className="col-right">{formatMoney(row.billing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePager
              page={teamPagination.page}
              pageSize={teamPagination.pageSize}
              total={teamPagination.total}
              onPageChange={teamPagination.setPage}
              className="mis-table-footer mis-table-footer--overlay"
            />
          </div>
        </MisOverlay>
      )}
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: MetricColor;
}) {
  const palette = metricColors[tone];
  return (
    <div className="dash-card mis-kpi-card">
      <span className="mis-kpi-label">{label}</span>
      <span className="mis-kpi-value">{value}</span>
      <span
        className="mis-kpi-pill"
        style={{
          color: palette.text,
          background: palette.bg,
        }}
      >
        {hint}
      </span>
    </div>
  );
}

function MisOverlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mis-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="mis-overlay-backdrop" aria-label="Close" onClick={onClose} />
      <div className="mis-overlay-panel dash-card">
        <div className="mis-overlay-head">
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>{title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: theme['text-secondary'] }}>{subtitle}</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} style={{ width: 32, height: 32 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mis-overlay-body">{children}</div>
      </div>
    </div>
  );
}

