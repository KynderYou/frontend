import { Fragment } from 'react';
import { colors, sidebarTokens, spacing } from '../../styles/theme';
import { getVisibleNavItems, type AppView } from './navItems';
import type { MemberNav } from '../../api/types';
import logo from '../../assets/high-resolution-color-logo.png';

const theme = colors.light;

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout?: () => void;
  nav: MemberNav;
};

export function MobileNavDrawer({ open, onClose, activeView, onNavigate, onLogout, nav }: MobileNavDrawerProps) {
  const visibleNavItems = getVisibleNavItems(nav);
  const go = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className={`mobile-nav ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="mobile-nav-backdrop" aria-label="Close menu" onClick={onClose} />
      <aside className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="mobile-nav-header">
          <div style={{ height: 36, width: 88, overflow: 'hidden', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src={logo}
              alt="Midna"
              style={{ height: 36, width: 88, maxWidth: 88, objectFit: 'cover', objectPosition: 'center', flexShrink: 0 }}
            />
          </div>
          <button type="button" className="btn-icon" aria-label="Close menu" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {visibleNavItems.map((item, index) => {
            const active = item.id === activeView;
            const { Icon } = item;
            const isNewSection = index === 0 || visibleNavItems[index - 1].section !== item.section;
            return (
              <Fragment key={item.id}>
                {isNewSection && (
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme['text-muted'],
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: `0 ${spacing[1]}`,
                      margin: index === 0 ? `0 0 ${spacing[3]}` : `${spacing[4]} 0 ${spacing[3]}`,
                    }}
                  >
                    {item.section}
                  </p>
                )}
                <button
                  type="button"
                  className={`sidebar-nav-item${active ? ' is-active' : ''}`}
                  onClick={() => go(item.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    minHeight: 48,
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: sidebarTokens.itemRadius,
                    background: 'transparent',
                    color: active ? theme['text-primary'] : theme['text-secondary'],
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    letterSpacing: '-0.01em',
                    textAlign: 'left',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <span className="sidebar-nav-icon-bubble">
                    <span className="sidebar-nav-icon" style={{ display: 'grid', placeItems: 'center' }}>
                      <Icon size={18} fill="none" stroke="currentColor" strokeWidth={1.7} />
                    </span>
                  </span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </button>
              </Fragment>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            borderTop: `1px solid ${theme.divider}`,
            paddingTop: spacing[3],
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onLogout?.();
              onClose();
            }}
            className="sidebar-nav-item sidebar-logout-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '6px 10px',
              border: 'none',
              borderRadius: sidebarTokens.itemRadius,
              background: 'transparent',
              color: theme.error,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span className="sidebar-nav-icon-bubble">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </span>
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
