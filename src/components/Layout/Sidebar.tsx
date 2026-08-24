import { Fragment } from 'react';
import { colors, layoutTokens, sidebarTokens, spacing } from '../../styles/theme';
import { getVisibleNavItems, type AppView } from './navItems';
import type { MemberNav } from '../../api/types';
import logo from '../../assets/high-resolution-color-logo.png';

const theme = colors.light;

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout?: () => void;
  nav: MemberNav;
};

export function Sidebar({ collapsed, onToggle, activeView, onNavigate, onLogout, nav }: SidebarProps) {
  const width = collapsed ? layoutTokens.sidebarCollapsedWidth : layoutTokens.sidebarWidth;
  const visibleNavItems = getVisibleNavItems(nav);

  return (
    <aside
      className="sidebar sidebar-desktop"
      style={{
        width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed
          ? `${spacing[3]} ${spacing[2]} ${spacing[5]}`
          : `${spacing[6]} ${spacing[3]} ${spacing[4]}`,
        alignSelf: 'stretch',
        background: sidebarTokens.background,
        transition: 'width 0.2s ease, padding 0.2s ease',
        overflow: collapsed ? 'visible' : 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: spacing[2],
          padding: collapsed ? 0 : `0 ${spacing[2]}`,
          marginBottom: collapsed ? spacing[2] : spacing[8],
          minHeight: collapsed ? 44 : 42,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: 42,
            width: collapsed ? 42 : 102,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <img
            src={logo}
            alt="Midna"
            style={{
              height: 42,
              width: 102,
              maxWidth: 102,
              objectFit: 'cover',
              objectPosition: 'center',
              flexShrink: 0,
              userSelect: 'none',
            }}
          />
        </div>
        {!collapsed && (
          <button
            type="button"
            className="btn-icon"
            aria-label="Collapse sidebar"
            onClick={onToggle}
            style={{ flexShrink: 0, width: 36, height: 36 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          className="btn-icon"
          aria-label="Expand sidebar"
          onClick={onToggle}
          style={{ width: 44, height: 44, margin: `0 auto ${spacing[8]}` }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 3v18" />
          </svg>
        </button>
      )}

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          /* Collapsed: breathing room. Expanded: only a light gap between items. */
          gap: collapsed ? 16 : 6,
          flex: 1,
          minHeight: 0,
          marginTop: collapsed ? 0 : 0,
          overflowY: 'auto',
          overflowX: 'visible',
          alignItems: collapsed ? 'center' : 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        {visibleNavItems.map((item, index) => {
          const active = item.id === activeView;
          const { Icon } = item;
          const isNewSection = index > 0 && visibleNavItems[index - 1].section !== item.section;
          return (
            <Fragment key={item.id}>
              {isNewSection && !collapsed && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: theme['text-muted'],
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: `0 ${spacing[3]}`,
                    margin: '12px 0 4px',
                    flexShrink: 0,
                  }}
                >
                  {item.section}
                </p>
              )}
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`sidebar-nav-item${active ? ' is-active' : ''}${collapsed ? '' : ' is-expanded'}`}
                aria-label={item.label}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 12 : 10,
                  width: collapsed ? 'auto' : '100%',
                  minHeight: collapsed ? 44 : 38,
                  padding: collapsed ? 0 : '3px 8px',
                  border: 'none',
                  borderRadius: sidebarTokens.itemRadius,
                  background: 'transparent',
                  color: active ? theme['text-primary'] : theme['text-secondary'],
                  fontSize: collapsed ? 14 : 13,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.01em',
                  textAlign: 'left',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <span
                  className="sidebar-nav-icon-bubble"
                  style={collapsed ? undefined : { width: 36, height: 36 }}
                >
                  <span className="sidebar-nav-icon" style={{ display: 'grid', placeItems: 'center' }}>
                    <Icon size={collapsed ? 18 : 16} fill="none" stroke="currentColor" strokeWidth={1.7} />
                  </span>
                </span>
                {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
                {collapsed && <span className="sidebar-tooltip">{item.label}</span>}
              </button>
            </Fragment>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: collapsed ? 'none' : `1px solid ${theme.divider}`,
          paddingTop: collapsed ? 0 : spacing[2],
          marginTop: collapsed ? 16 : 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: collapsed ? 16 : 4,
          alignItems: collapsed ? 'center' : 'stretch',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onLogout}
          className={`sidebar-nav-item sidebar-logout-item${collapsed ? '' : ' is-expanded'}`}
          aria-label="Log out"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 12 : 10,
            width: collapsed ? 'auto' : '100%',
            minHeight: collapsed ? undefined : 38,
            padding: collapsed ? 0 : '3px 8px',
            border: 'none',
            borderRadius: sidebarTokens.itemRadius,
            background: 'transparent',
            color: theme.error,
            fontSize: collapsed ? 14 : 13,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span
            className="sidebar-nav-icon-bubble"
            style={collapsed ? undefined : { width: 36, height: 36 }}
          >
            <svg width={collapsed ? 18 : 16} height={collapsed ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </span>
          {!collapsed && <span>Log out</span>}
          {collapsed && <span className="sidebar-tooltip">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
