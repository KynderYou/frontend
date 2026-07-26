import { useMemo, useState, type ReactNode } from 'react';
import { colors, metricColors, radius, spacing, typography, type MetricColor } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { MonthlyBarChart } from './MonthlyBarChart';
import {
  billingByMonth,
  formatCompactMoney,
  formatMoney,
  LAST_QUARTER_LABEL,
  LOW_PERFORMER_THRESHOLD,
  lowPerformers,
  MONTH_LABELS,
  NETWORK_YEAR,
  networkScans,
  performanceRows,
  reviewsByMonth,
  scansByMonth,
  yearTotals,
} from './misData';

const theme = colors.light;

/** Latest month that has data — used as the default drill-down target */
const defaultMonth = Math.max(0, scansByMonth.filter((p) => p.value > 0).length - 1);

type NetworkPerformancePageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function NetworkPerformancePage({ onOpenMobileMenu, onOpenProfile }: NetworkPerformancePageProps) {
  const [scanMonth, setScanMonth] = useState(defaultMonth);
  const [reviewMonth, setReviewMonth] = useState(defaultMonth);
  const [billingMonth, setBillingMonth] = useState(defaultMonth);
  const [drilldownMonth, setDrilldownMonth] = useState<number | null>(null);
  const [teamDbOpen, setTeamDbOpen] = useState(false);

  const monthScans = useMemo(
    () => (drilldownMonth === null ? [] : networkScans.filter((scan) => scan.month === drilldownMonth)),
    [drilldownMonth]
  );

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
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            How the entire network is performing across {NETWORK_YEAR}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-pill-primary"
            style={{ height: 36, fontSize: 13, padding: '8px 16px' }}
            onClick={() => setTeamDbOpen(true)}
          >
            Team DB
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="mis-kpi-row">
        <KpiCard label="Scans this year" value={yearTotals.scans.toLocaleString('en-IN')} hint="Entire network" tone="blue" />
        <KpiCard label="Reviews & testimonials" value={yearTotals.reviews.toLocaleString('en-IN')} hint="Received YTD" tone="green" />
        <KpiCard label="Network billing" value={formatCompactMoney(yearTotals.billing)} hint="YTD" tone="purple" />
        <KpiCard
          label="Low performers"
          value={String(lowPerformers.length)}
          hint={`Under ${LOW_PERFORMER_THRESHOLD} scans last quarter`}
          tone="amber"
        />
      </div>

      <div className="mis-summary-grid">
        <MonthlyBarChart
          title="Monthly progress"
          subtitle="Scans uploaded each month by the entire network"
          data={scansByMonth}
          activeMonth={scanMonth}
          onSelectMonth={setScanMonth}
          formatValue={(v) => v.toLocaleString('en-IN')}
          unit="scans"
          action={{
            label: `View ${MONTH_LABELS[scanMonth]} scans`,
            onClick: () => setDrilldownMonth(scanMonth),
            disabled: scansByMonth[scanMonth].value === 0,
          }}
        />

        <MonthlyBarChart
          title="Reviews & testimonials"
          subtitle="Reviews and testimonials received each month"
          data={reviewsByMonth}
          activeMonth={reviewMonth}
          onSelectMonth={setReviewMonth}
          formatValue={(v) => v.toLocaleString('en-IN')}
          unit="received"
        />

        <MonthlyBarChart
          title="Monthly billing"
          subtitle="Billing raised each month across the network"
          data={billingByMonth}
          activeMonth={billingMonth}
          onSelectMonth={setBillingMonth}
          formatValue={formatCompactMoney}
          unit="billed"
        />

        <div className="dash-card mis-insights-card">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Quick insights</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-secondary'] }}>
              Members under {LOW_PERFORMER_THRESHOLD} scans in the last quarter ({LAST_QUARTER_LABEL})
            </p>
          </div>

          {lowPerformers.length === 0 ? (
            <p style={{ margin: `${spacing[5]} 0 0`, fontSize: 13, color: theme['text-muted'] }}>
              Every member cleared {LOW_PERFORMER_THRESHOLD} scans last quarter.
            </p>
          ) : (
            <ul className="mis-insight-list">
              {lowPerformers.map((row) => (
                <li key={row.id}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: metricColors.amber.bg,
                      color: metricColors.amber.text,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials(row.name)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>
                      {row.name}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: theme['text-muted'], marginTop: 2 }}>
                      {row.region} · {row.scansYear} scans this year
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: metricColors.amber.text,
                      background: metricColors.amber.bg,
                      borderRadius: radius.pill,
                      padding: '4px 10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.scansQuarter} scans
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="btn-pill-secondary"
            style={{ marginTop: spacing[5], height: 36, fontSize: 13, padding: '8px 16px', alignSelf: 'flex-start' }}
            onClick={() => setTeamDbOpen(true)}
          >
            Open Team DB
          </button>
        </div>
      </div>

      {drilldownMonth !== null && (
        <MisOverlay
          title={`${MONTH_LABELS[drilldownMonth]} ${NETWORK_YEAR} scans`}
          subtitle={`${monthScans.length} scans from ${scansByMonth[drilldownMonth].contributors.length} contributors`}
          onClose={() => setDrilldownMonth(null)}
        >
          <div className="mis-drill-grid">
            <div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme['text-primary'] }}>Contributors</h4>
              <ul className="mis-insight-list mis-insight-list--compact">
                {scansByMonth[drilldownMonth].contributors.map((c) => (
                  <li key={c.id}>
                    <span style={{ minWidth: 0, flex: 1, fontSize: 13, fontWeight: 600, color: theme['text-primary'] }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.primary }}>{c.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme['text-primary'] }}>Scans</h4>
              <div className="mis-overlay-table">
                <table className="mis-data-table mis-data-table--compact">
                  <thead>
                    <tr>
                      <th>Scan ID</th>
                      <th>Name</th>
                      <th>MLA</th>
                      <th>Upload date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthScans.map((scan) => (
                      <tr key={scan.scanId}>
                        <td data-label="Scan ID">
                          <span className="mis-scan-id">{scan.scanId}</span>
                        </td>
                        <td data-label="Name">{scan.clientName}</td>
                        <td data-label="MLA">{scan.mlaName}</td>
                        <td data-label="Upload date">{scan.uploadedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </MisOverlay>
      )}

      {teamDbOpen && (
        <MisOverlay
          title="Team DB"
          subtitle="Column list is provisional — will be finalised once confirmed"
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
                {performanceRows.map((row) => (
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
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-secondary'] }}>{subtitle}</p>
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
