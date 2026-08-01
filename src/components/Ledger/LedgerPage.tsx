import { useMemo, useState } from 'react';
import { colors, metricColors, radius, shadow, spacing, typography, type MetricColor } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { ExpensesChart } from './ExpensesChart';
import { TopUpModal } from './TopUpModal';

const theme = colors.light;
const BILLING_WINDOW_DAYS = 30;

type LedgerTab = 'receipts' | 'billing';

type Transaction = {
  id: string;
  title: string;
  date: string;
  amount: string;
  initials: string;
  pastel: string;
};

function parseLedgerDate(dateStr: string): Date {
  return new Date(dateStr.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3'));
}

function isWithinLastDays(dateStr: string, days: number, now = new Date()): boolean {
  const date = parseLedgerDate(dateStr);
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff && date <= now;
}

function parseAmount(amount: string): number {
  return Number(amount.replace(/[^\d]/g, '')) || 0;
}

function formatAmount(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

const receiptTransactions: Transaction[] = [
  { id: 'r1', title: 'Nest · South remittance', date: '28 Jul 2025', amount: '₹12,490', initials: 'NS', pastel: '#DDE4F8' },
  { id: 'r2', title: 'MLA scan payment', date: '26 Jul 2025', amount: '₹8,200', initials: 'ML', pastel: '#D8F0E2' },
  { id: 'r3', title: 'HO credit · Auto', date: '24 Jul 2025', amount: '₹15,750', initials: 'HO', pastel: '#F8D7E8' },
  { id: 'r4', title: 'Network transfer in', date: '22 Jul 2025', amount: '₹6,340', initials: 'NT', pastel: '#F3EBDD' },
  { id: 'r5', title: 'Member top-up', date: '20 Jul 2025', amount: '₹4,100', initials: 'MT', pastel: '#E8D9F0' },
];

const billingTransactions: Transaction[] = [
  { id: 'b1', title: 'Commission · Diamond', date: '30 Jul 2026', amount: '₹18,600', initials: 'CD', pastel: '#EEF0FF' },
  { id: 'b2', title: 'Report processing fee', date: '28 Jul 2026', amount: '₹3,250', initials: 'RP', pastel: '#FFF0F6' },
  { id: 'b3', title: 'CAB adjustment', date: '24 Jul 2026', amount: '₹9,870', initials: 'CA', pastel: '#EBFBEE' },
  { id: 'b4', title: 'Scan billing · MLA', date: '20 Jul 2026', amount: '₹22,140', initials: 'SB', pastel: '#FFF4E6' },
  { id: 'b5', title: 'Subscription renewal', date: '15 Jul 2026', amount: '₹11,000', initials: 'SR', pastel: '#F8F0FC' },
  { id: 'b6', title: 'Network commission', date: '10 Jun 2026', amount: '₹14,500', initials: 'NC', pastel: '#E7F5FF' },
  { id: 'b7', title: 'Legacy billing adjustment', date: '12 May 2026', amount: '₹8,900', initials: 'LB', pastel: '#FFF9DB' },
];

type KpiDef = {
  id: LedgerTab;
  label: string;
  getValue: (billingTotal: number) => string;
  getHint: () => string;
  color: MetricColor;
  icon: React.ReactNode;
};

const kpis: KpiDef[] = [
  {
    id: 'receipts',
    label: 'Total Receipts',
    getValue: () => '₹46,880',
    getHint: () => 'Credits received this period',
    color: 'green',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  {
    id: 'billing',
    label: 'Total Billing',
    getValue: (billingTotal) => formatAmount(billingTotal),
    getHint: () => `Last ${BILLING_WINDOW_DAYS} days`,
    color: 'purple',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="16" cy="14.5" r="1.6" />
      </svg>
    ),
  },
];

type LedgerPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

export function LedgerPage({ onOpenMobileMenu, onOpenProfile }: LedgerPageProps) {
  const [activeTab, setActiveTab] = useState<LedgerTab>('receipts');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const billingLast30Days = useMemo(
    () => billingTransactions.filter((tx) => isWithinLastDays(tx.date, BILLING_WINDOW_DAYS)),
    []
  );
  const billingTotal = useMemo(
    () => billingLast30Days.reduce((sum, tx) => sum + parseAmount(tx.amount), 0),
    [billingLast30Days]
  );

  const transactions = activeTab === 'receipts' ? receiptTransactions : billingLast30Days;
  const tableTitle = activeTab === 'receipts' ? 'Receipts' : 'Billing';
  const periodLabel = activeTab === 'billing' ? `Last ${BILLING_WINDOW_DAYS} days` : 'This Week';

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
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
            My Ledger
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Track receipts and billing across your network.
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

      <div
        className="dash-card ledger-topup-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[4],
          flexWrap: 'wrap',
          marginBottom: spacing[5],
          padding: `${spacing[4]} ${spacing[5]}`,
          background: 'linear-gradient(135deg, #EEF0FF 0%, #F8F0FC 55%, #FFFFFF 100%)',
          boxShadow: shadow.card,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'var(--btn-primary-gradient)',
              boxShadow: shadow.soft,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: theme['text-primary'], letterSpacing: '-0.01em' }}>
              Top up your ledger
            </div>
            <div style={{ fontSize: 13, color: theme['text-secondary'], marginTop: 2 }}>
              Send funds and upload payment proof to credit your balance.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-pill-primary"
          onClick={() => setTopUpOpen(true)}
          style={{ height: 44, padding: '0 20px', flexShrink: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Top up now
        </button>
      </div>

      <div
        className="ledger-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 20,
          marginBottom: spacing[6],
        }}
      >
        {kpis.map((kpi) => {
          const tone = metricColors[kpi.color];
          const selected = activeTab === kpi.id;
          const hovered = hoveredId === kpi.id;
          const focused = focusedId === kpi.id;
          const showColor = selected || hovered || focused;
          const gradient = `linear-gradient(135deg, ${tone.icon} 0%, ${tone.text} 100%)`;

          return (
            <article
              key={kpi.id}
              className={`kpi-card kpi-card--link${showColor ? ' is-featured' : ''}`}
              onMouseEnter={() => setHoveredId(kpi.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setFocusedId(kpi.id)}
              onBlur={() => setFocusedId(null)}
              onClick={() => setActiveTab(kpi.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(kpi.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              style={{
                cursor: 'pointer',
                outline: 'none',
                background: showColor ? gradient : theme['bg-surface'],
                boxShadow: showColor
                  ? `0 20px 40px ${tone.icon}55`
                  : hovered
                    ? 'var(--shadow-cardHover)'
                    : undefined,
                transform: hovered || selected ? 'translateY(-3px)' : undefined,
                transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <span
                  style={{
                    fontSize: typography.roles.cardLabel.fontSize,
                    fontWeight: typography.roles.cardLabel.fontWeight,
                    color: showColor ? 'rgba(255, 255, 255, 0.9)' : theme['text-secondary'],
                    transition: 'color 0.2s ease',
                  }}
                >
                  {kpi.label}
                </span>
                <span
                  className="kpi-icon-bubble"
                  style={{
                    background: showColor ? 'rgba(255, 255, 255, 0.22)' : tone.bg,
                    color: showColor ? '#ffffff' : tone.icon,
                    borderRadius: radius.pill,
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  {kpi.icon}
                </span>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    fontSize: typography.roles.kpiValue.fontSize,
                    fontWeight: typography.roles.kpiValue.fontWeight,
                    letterSpacing: typography.roles.kpiValue.letterSpacing,
                    lineHeight: typography.roles.kpiValue.lineHeight,
                    color: showColor ? '#ffffff' : theme['text-primary'],
                    transition: 'color 0.2s ease',
                  }}
                >
                  {kpi.getValue(billingTotal)}
                </div>
                <div
                  style={{
                    fontSize: typography.roles.helperText.fontSize,
                    marginTop: 6,
                    color: showColor ? 'rgba(255, 255, 255, 0.78)' : theme['text-muted'],
                    transition: 'color 0.2s ease',
                  }}
                >
                  {kpi.getHint()}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="ledger-lower">
        <div className="dash-card" style={{ padding: spacing[5] }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[4],
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
              {tableTitle}
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: theme['text-secondary'],
                fontSize: 13,
                fontWeight: 500,
                padding: '4px 2px',
              }}
            >
              {periodLabel}
            </span>
          </div>

          <div
            key={activeTab}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'ledger-swap-in 0.22s ease',
            }}
          >
            {transactions.length === 0 ? (
              <p style={{ margin: 0, padding: '24px 8px', textAlign: 'center', color: theme['text-muted'], fontSize: 13 }}>
                No billing entries in the last {BILLING_WINDOW_DAYS} days.
              </p>
            ) : (
              transactions.map((tx) => (
              <div
                key={tx.id}
                className="ledger-tx-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: radius.md,
                  background: theme['bg-muted'],
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: tx.pastel,
                    color: theme['text-primary'],
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: shadow.float,
                  }}
                >
                  {tx.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>{tx.title}</div>
                  <div style={{ fontSize: 12, color: theme['text-muted'], marginTop: 2 }}>{tx.date}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme['text-primary'], whiteSpace: 'nowrap' }}>
                  {tx.amount}
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        <ExpensesChart />
      </div>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </section>
  );
}
