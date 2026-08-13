/**
 * Midna Global Design System
 * Visual reference: soft-UI fintech dashboard (cool grey canvas, vivid blue CTAs)
 * Brand primary: #6D7AF2 (soft periwinkle fintech)
 *
 * Three-layer backgrounds:
 *   1. bg-frame   — full outer cool grey page
 *   2. bg-canvas  — same cool grey fill behind the content panel
 *   3. bg-surface — white component cards inside main
 *
 * Use these tokens when building pages — colors, radius, shadow,
 * spacing, buttons, cards, sidebar, charts, and status chips.
 */

export type ThemeMode = 'light';

/**
 * Desktop UI density — tuned to match ~90% browser zoom at 100% zoom.
 * Applied via `--ui-zoom` on `.app-frame` / `.auth-page` (see index.css).
 * Mobile keeps full size for touch targets and readability.
 */
export const UI_DENSITY = 0.9;

// ─── Brand scale (vivid blue → #5C7CFA) ───────────────────────────────────────

/** Monochrome brand ladder for fills, charts, gradients, patterns */
export const brandScale = {
  /** Deep accent — hero gradients, dark pattern cards */
  dark: '#5B6BF0',
  /** Primary brand — active nav fill, solid accents */
  base: '#6D7AF2',
  /** Hover / pressed */
  hover: '#5C6AE8',
  /** Mid tint — secondary chart bars, avatars */
  mid: '#8E9AFE',
  /** Light tint — soft chart bars, highlights */
  light: '#B4BCFF',
  /** Soft wash — active nav bg, icon chips, completed badges */
  soft: '#EEF0FF',
  /** Muted tint — striped chart segments, muted fills */
  muted: '#E0E4FF',
} as const;

/** Secondary accents used in charts, stacked wallets, and KPI chips */
export const accentScale = {
  orange: '#FF922B',
  'orange-soft': '#FFF4E6',
  purple: '#BE4BDB',
  'purple-soft': '#F8F0FC',
  green: '#51CF66',
  'green-soft': '#EBFBEE',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  sizes: {
    '2xs': { fontSize: '11px', lineHeight: '16px', fontWeight: 400 },
    xs: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
    sm: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    base: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    lg: { fontSize: '18px', lineHeight: '26px', fontWeight: 600 },
    xl: { fontSize: '20px', lineHeight: '28px', fontWeight: 600 },
    '2xl': { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
    '3xl': { fontSize: '32px', lineHeight: '40px', fontWeight: 700 },
    '4xl': { fontSize: '36px', lineHeight: '44px', fontWeight: 700 },
  } as const,

  fonts: {
    /**
     * Inter, self-hosted via @fontsource-variable/inter (imported in
     * main.tsx) — bundled with the app instead of pulled from a CDN link,
     * so it always loads regardless of network/ad-block conditions. The
     * package registers the family as "Inter Variable", not "Inter".
     * Matches the soft-UI fintech reference's rounded geometric look.
     */
    sans: {
      family: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      letterSpacing: '0',
      fontWeight: 400,
    },
    heading: {
      family: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      letterSpacing: '-0.025em',
      fontWeight: 700,
    },
    mono: { family: 'Menlo, Consolas, monospace', letterSpacing: '0', fontWeight: 500 },
    emphasis: {
      family: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      letterSpacing: '0',
      fontWeight: 500,
    },
  } as const,

  /**
   * Semantic text roles for dashboard hierarchy.
   * Prefer these over raw `sizes` in components so copy stays visually
   * consistent (e.g. `typography.roles.pageTitle`).
   */
  roles: {
    /** Sidebar wordmark */
    logo: { fontSize: '20px', lineHeight: '28px', fontWeight: 700, letterSpacing: '-0.02em' },
    /** Page heading — soft-UI dashboard titles */
    pageTitle: { fontSize: '32px', lineHeight: '40px', fontWeight: 600, letterSpacing: '-0.025em' },
    /** Page description under the heading */
    pageSubtitle: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    /** Panel/card headers — "Overview", "Transaction" */
    sectionTitle: { fontSize: '22px', lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' },
    /** Nested card/row titles — merchant names, contact names */
    cardTitle: { fontSize: '16px', lineHeight: '24px', fontWeight: 600, letterSpacing: '0' },
    /** Body copy — descriptions */
    description: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    /** KPI card labels — "Amount Spent", "Budget Total" */
    cardLabel: { fontSize: '13px', lineHeight: '18px', fontWeight: 500 },
    /** Big KPI numerals — "$14,765.00" */
    kpiValue: { fontSize: '32px', lineHeight: '38px', fontWeight: 700, letterSpacing: '-0.02em' },
    /** KPI footnote — "+32.8%" trend hints */
    kpiHint: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
    /** Generic helper/meta text — dates, account numbers, fine print */
    helperText: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
    /** Sidebar nav group label */
    navGroupLabel: { fontSize: '11px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.06em' },
    /** Sidebar nav link */
    navItem: { fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
    /** Primary row text — names, list items */
    body: { fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
    /** Secondary row text — muted metadata */
    bodyMuted: { fontSize: '13px', lineHeight: '18px', fontWeight: 400 },
    /** Top bar user name */
    userName: { fontSize: '14px', lineHeight: '20px', fontWeight: 600 },
    /** Top bar user email */
    userMeta: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
    /** Button label */
    button: { fontSize: '14px', lineHeight: '20px', fontWeight: 600 },
    /** Large ring/gauge stat */
    statValue: { fontSize: '30px', lineHeight: '38px', fontWeight: 700, letterSpacing: '-0.02em' },
  } as const,
};

// ─── Spacing & Sizing ─────────────────────────────────────────────────────────

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

/** Soft-UI rounding — lg is the standard card radius (24px) */
export const radius = {
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  pill: '9999px',
} as const;

export const buttonTokens = {
  height: {
    sm: '36px',
    md: '40px',
    lg: '48px',
  } as const,
  padding: {
    sm: '8px 14px',
    md: '10px 16px',
    lg: '14px 22px',
  } as const,
  /** Primary = soft periwinkle gradient pill; secondary = white soft-shadow pill */
  shape: 'pill' as const,
  /** Primary CTA — matches reference Send button (periwinkle → cornflower) */
  primaryGradient: 'linear-gradient(135deg, #8E9AFE 0%, #6D7AF2 100%)',
  primaryGradientHover: 'linear-gradient(135deg, #9AA5FF 0%, #7A86F5 100%)',
} as const;

export const inputTokens = {
  height: {
    sm: '36px',
    md: '44px',
    lg: '52px',
  } as const,
  padding: '12px 16px',
};

export const tableTokens = {
  rowHeight: '56px',
} as const;

export const shadow = {
  /** Default white card elevation — soft, cool-tinted, large blur */
  card: '0 10px 30px rgba(80, 90, 140, 0.07)',
  /** Slightly raised — hover states on cards */
  cardHover: '0 16px 40px rgba(80, 90, 140, 0.12)',
  /** Soft brand glow (active sidebar icons, primary accents) */
  soft: '0 8px 20px rgba(109, 122, 242, 0.28)',
  /** Primary CTA glow — Send / Edit buttons */
  primary: '0 10px 24px rgba(109, 122, 242, 0.35)',
  /** Floating icon bubbles (bell, nav icons) — visible lift on cool-grey canvas */
  float: '0 4px 14px rgba(80, 90, 140, 0.14)',
  /**
   * Profile / accent avatar: thick white ring + soft grey elevation
   * (matches reference “U” bubble — ring first, then diffuse shadow).
   */
  avatarRing: '0 0 0 3px #ffffff, 0 6px 16px rgba(80, 90, 140, 0.18)',
} as const;

/**
 * Decorative ambient “bubble” washes behind the shell — soft lilac/blue
 * radial blobs matching the reference hero atmosphere.
 */
export const bubbleTokens = {
  primary: 'radial-gradient(circle, rgba(142, 154, 254, 0.22) 0%, rgba(142, 154, 254, 0) 70%)',
  secondary: 'radial-gradient(circle, rgba(190, 75, 219, 0.10) 0%, rgba(190, 75, 219, 0) 70%)',
  tertiary: 'radial-gradient(circle, rgba(255, 146, 43, 0.08) 0%, rgba(255, 146, 43, 0) 70%)',
} as const;

// ─── Layout reference ───────────────────────────────────────────────────────

/**
 * Page shell:
 * 1. Outer page — cool light grey (`bg-frame`)
 * 2. Slim icon nav rail flush against the left edge (`sidebarTokens`)
 * 3. White component cards inside main content (`bg-surface`)
 */
export const layoutTokens = {
  /** App bleeds to the viewport edge — no outer inset */
  framePadding: '0px',
  /** Gap between the sidebar and the content panel, and the content panel's outer right/bottom inset */
  shellGap: '20px',
  /** Outer top inset — keep chrome close to the viewport edge */
  shellGapTop: '12px',
  /** Shared rounding for the content panel */
  panelRadius: '24px',
  /** Soft border around each panel — invisible; cards provide elevation */
  panelBorder: 'none',
  /** Expanded width — icons + labels */
  sidebarWidth: '220px',
  /** Collapsed width — icons only (matches slim icon rail in reference) */
  sidebarCollapsedWidth: '80px',
  /** Page title sits near the top — avoid stacked large top gaps */
  contentPaddingTop: spacing[4],
  contentPadding: spacing[6],
  contentPaddingX: spacing[6],
  /** Gap between dashboard cards — generous, premium whitespace */
  gridGap: spacing[6],
  /** Shared fixed height for paired lower cards so both line up */
  homeLowerCardHeight: '480px',
} as const;

/** White surface cards used across the dashboard grid */
export const cardTokens = {
  padding: spacing[6],
  radius: radius.lg,
  border: '1px solid',
  background: 'bg-surface' as const,
  shadow: 'card' as const,
} as const;

/**
 * Sidebar = light, slim icon nav rail. Slightly lifted off the cool-grey
 * canvas without full white contrast.
 */
export const sidebarTokens = {
  background: 'transparent',
  itemRadius: radius.pill,
  /** Active icon bubble size (circular soft-UI rail) */
  iconBubble: '44px',
} as const;

/**
 * Chart / gauge palette — dual-line (blue + orange) and soft bar fills.
 * Use dark/base/mid/light/muted for blue series; orange/purple for secondary.
 */
export const chartTokens = {
  dark: brandScale.dark,
  base: brandScale.base,
  mid: brandScale.mid,
  light: brandScale.light,
  muted: brandScale.muted,
  soft: brandScale.soft,
  /** Secondary series — Overview "Last Year" line */
  secondary: accentScale.orange,
  /** Tertiary series — stacked wallet / accent bars */
  tertiary: accentScale.purple,
  /** Inactive / empty progress capsules */
  track: '#E9ECEF',
} as const;

/**
 * Notice/severity accents — red / orange / yellow, desaturated enough to
 * sit quietly on white surfaces rather than read as an alarm.
 */
export const severityTokens = {
  /** Red — urgent */
  high: {
    icon: '#FA5252',
    text: '#C92A2A',
    bg: '#FFF5F5',
    border: '#FFC9C9',
  },
  /** Orange — caution */
  medium: {
    icon: '#FF922B',
    text: '#D9480F',
    bg: '#FFF4E6',
    border: '#FFD8A8',
  },
  /** Green — informational */
  low: {
    icon: '#51CF66',
    text: '#2B8A3E',
    bg: '#EBFBEE',
    border: '#B2F2BB',
  },
} as const;

export type SeverityLevel = keyof typeof severityTokens;

/**
 * Patterned dark panels (promo card, time tracker):
 * dark → black gradient + brand mid/base radial washes + subtle stripes.
 */
export const patternTokens = {
  gradient: `linear-gradient(155deg, ${brandScale.dark} 0%, #1a1f3a 55%, #0d1117 100%)`,
  glowMid: brandScale.mid,
  glowBase: brandScale.base,
  stripe: `${brandScale.base}33`,
} as const;

// ─── Colors (Light) ───────────────────────────────────────────────────────────

export const colors = {
  light: {
    /**
     * Cool light-grey page (soft-UI fintech style):
     * bg-frame / bg-canvas → same cool grey #F4F7FA, so the content
     *                        panel reads as one continuous surface
     * bg-surface           → white component cards (KPIs, charts, lists, etc.)
     * Structure/hierarchy comes from the white cards + soft shadow, not panel fills.
     */
    'bg-frame': '#F4F7FA',
    'bg-canvas': '#F4F7FA',
    'bg-surface': '#FFFFFF',
    'bg-muted': '#F1F3F5',
    'bg-hover': '#F1F3F5',

    // Text
    'text-primary': '#212529',
    'text-secondary': '#868E96',
    'text-muted': '#ADB5BD',
    'text-inverse': '#FFFFFF',

    // Brand
    primary: brandScale.base,
    'primary-hover': brandScale.hover,
    'primary-soft': brandScale.soft,
    'primary-muted': brandScale.muted,
    'primary-mid': brandScale.mid,
    'primary-dark': brandScale.dark,
    'primary-light': brandScale.light,

    accent: brandScale.base,
    'accent-soft': brandScale.soft,
    'accent-orange': accentScale.orange,
    'accent-purple': accentScale.purple,
    'accent-green': accentScale.green,

    // Buttons
    'btn-primary-bg': brandScale.base,
    'btn-primary-text': '#FFFFFF',
    'btn-primary-hover': brandScale.hover,
    'btn-secondary-bg': '#FFFFFF',
    'btn-secondary-text': '#212529',
    'btn-secondary-border': '#E9ECEF',
    'btn-disabled-bg': '#E9ECEF',
    'btn-disabled-text': '#ADB5BD',

    // Tables
    'table-header-bg': '#F8F9FA',
    'table-row-hover': '#F8F9FA',
    'table-border': '#E9ECEF',

    // Semantic
    success: '#51CF66',
    'success-bg': '#EBFBEE',
    error: '#FA5252',
    'error-bg': '#FFF5F5',
    warning: '#FF922B',
    'warning-bg': '#FFF4E6',
    info: '#339AF0',
    'info-bg': '#E7F5FF',

    // Status chips
    'status-completed-bg': brandScale.soft,
    'status-completed-text': brandScale.dark,
    'status-progress-bg': '#FFF4E6',
    'status-progress-text': '#D9480F',
    'status-pending-bg': '#FFF5F5',
    'status-pending-text': '#C92A2A',

    'secure-badge-bg': brandScale.soft,
    'secure-badge-text': brandScale.dark,
    'focus-ring': brandScale.base,

    border: '#E9ECEF',
    divider: '#E9ECEF',
  } as const,
};

/**
 * Supporting metric colors — used sparingly on KPI icon chips / trend
 * badges, never as a full card fill. One hue per metric, not a rainbow.
 */
export const metricColors = {
  blue: { icon: '#6D7AF2', text: '#4C5AD4', bg: '#EEF0FF' },
  green: { icon: '#51CF66', text: '#2B8A3E', bg: '#EBFBEE' },
  amber: { icon: '#FF922B', text: '#D9480F', bg: '#FFF4E6' },
  purple: { icon: '#BE4BDB', text: '#9C36B5', bg: '#F8F0FC' },
  indigo: { icon: brandScale.base, text: brandScale.dark, bg: brandScale.soft },
  pink: { icon: '#F06595', text: '#C2255C', bg: '#FFF0F6' },
} as const;

export type MetricColor = keyof typeof metricColors;

export const getTheme = (mode: ThemeMode = 'light') => colors[mode];

/**
 * Generate CSS custom properties for the given theme mode.
 * Apply on app mount: Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k,v))
 */
export const getThemeCssVars = (mode: ThemeMode = 'light'): Record<string, string> => {
  const theme = colors[mode];
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(theme)) {
    vars[`--color-${key}`] = value;
  }
  for (const [key, value] of Object.entries(spacing)) {
    vars[`--space-${key}`] = value;
  }
  for (const [key, value] of Object.entries(radius)) {
    vars[`--radius-${key}`] = value;
  }
  for (const [key, value] of Object.entries(shadow)) {
    vars[`--shadow-${key}`] = value;
  }
  for (const [key, value] of Object.entries(brandScale)) {
    vars[`--brand-${key}`] = value;
  }
  for (const [key, value] of Object.entries(accentScale)) {
    vars[`--accent-${key}`] = value;
  }
  for (const [key, value] of Object.entries(layoutTokens)) {
    vars[`--layout-${key}`] = value;
  }
  for (const [key, value] of Object.entries(chartTokens)) {
    vars[`--chart-${key}`] = value;
  }
  for (const [name, tones] of Object.entries(metricColors)) {
    for (const [key, value] of Object.entries(tones)) {
      vars[`--metric-${name}-${key}`] = value;
    }
  }
  for (const [level, tokens] of Object.entries(severityTokens)) {
    for (const [key, value] of Object.entries(tokens)) {
      vars[`--severity-${level}-${key}`] = value;
    }
  }
  for (const [key, value] of Object.entries(sidebarTokens)) {
    vars[`--sidebar-${key}`] = value;
  }
  for (const [key, value] of Object.entries(buttonTokens.height)) {
    vars[`--btn-height-${key}`] = value;
  }
  for (const [key, value] of Object.entries(buttonTokens.padding)) {
    vars[`--btn-padding-${key}`] = value;
  }
  vars['--btn-primary-gradient'] = buttonTokens.primaryGradient;
  vars['--btn-primary-gradient-hover'] = buttonTokens.primaryGradientHover;
  for (const [key, value] of Object.entries(bubbleTokens)) {
    vars[`--bubble-${key}`] = value;
  }
  for (const [key, value] of Object.entries(inputTokens.height)) {
    vars[`--input-height-${key}`] = value;
  }
  vars['--input-padding'] = inputTokens.padding;
  vars['--table-row-height'] = tableTokens.rowHeight;
  vars['--pattern-gradient'] = patternTokens.gradient;
  vars['--ui-density'] = String(UI_DENSITY);
  vars['--ui-zoom'] = String(UI_DENSITY);

  for (const [key, val] of Object.entries(typography.sizes)) {
    vars[`--text-${key}-font-size`] = val.fontSize;
    vars[`--text-${key}-line-height`] = val.lineHeight;
    vars[`--text-${key}-font-weight`] = String(val.fontWeight);
  }
  for (const [key, val] of Object.entries(typography.fonts)) {
    vars[`--font-${key}-family`] = val.family;
    vars[`--font-${key}-letter-spacing`] = val.letterSpacing;
    vars[`--font-${key}-weight`] = String(val.fontWeight);
  }
  for (const [key, val] of Object.entries(typography.roles)) {
    vars[`--role-${key}-font-size`] = val.fontSize;
    vars[`--role-${key}-line-height`] = val.lineHeight;
    vars[`--role-${key}-font-weight`] = String(val.fontWeight);
    vars[`--role-${key}-letter-spacing`] = 'letterSpacing' in val ? val.letterSpacing : '0';
  }

  return vars;
};
