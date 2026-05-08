/**
 * AlgorithmLens design system — JS tokens.
 *
 * Direct port of `design-handoff/colors_and_type.css` for the redesigned
 * Overview tab. Additive: this file is intentionally a separate namespace
 * from the legacy `src/lib/theme.ts` and `src/lib/gluestackTheme.ts`, which
 * still serve the other dashboard tabs (Sources, Ads, Politics, Tone) and
 * the rest of the app. Future tabs migrate to these tokens at their own
 * pace; nothing legacy is mutated.
 *
 * Brand colors are exact per the brand spec:
 *   --brand-primary  #1868D8
 *   --brand-accent   #20A888
 *
 * Hard rules carried in from SKILL.md:
 *   - No shadows. Anywhere.
 *   - No gradients. Anywhere.
 *   - Decorative color is forbidden. Blue, green, yellow, red are
 *     functional only. No orange / purple / pink / teal / brown.
 */

// ────────────────────────────────────────────────────────────
// Color
// ────────────────────────────────────────────────────────────

export const colors = {
  // Surfaces
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F7F7F8',
  border: '#E5E5EA',

  // Text
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B70',
  textTertiary: '#A0A0A5',
  textOnBrand: '#FFFFFF',

  // Brand & functional accents
  brandPrimary: '#1868D8',
  brandPrimary12: 'rgba(24,104,216,0.12)',
  brandAccent: '#20A888',
  brandAccent12: 'rgba(32,168,136,0.12)',
  success: '#20A888',
  success12: 'rgba(32,168,136,0.12)',
  caution: '#FFCC00',
  caution12: 'rgba(255,204,0,0.12)',
  destructive: '#FF3B30',
  destructive12: 'rgba(255,59,48,0.12)',
} as const;

export type ColorToken = keyof typeof colors;

// ────────────────────────────────────────────────────────────
// Type
// On iOS the system stack picks up SF Pro automatically. We do not bundle
// SF Pro fonts. fontFamily is omitted from these tokens so React Native
// uses the platform default — which is exactly what we want.
// ────────────────────────────────────────────────────────────

export const fontStack = {
  // RN reads fontFamily as a single string. 'System' resolves to SF Pro
  // on iOS and Roboto on Android. Most usages should omit fontFamily
  // entirely to fall back to the platform default; expose this for the
  // explicit cases.
  system: 'System',
} as const;

/**
 * Type tokens. Each token is { fontSize, lineHeight, fontWeight, letterSpacing? }.
 * The `letterSpacing` value is in pixels (RN convention), NOT em.
 *
 * The `tabular: true` flag is informational only — components apply
 * `fontVariant: ['tabular-nums']` themselves where needed.
 */
export const type = {
  hero: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '600' as const,
    letterSpacing: -1.28, // -0.02em at 64px
    tabular: true,
  },
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600' as const,
    letterSpacing: -0.32, // -0.01em at 32px
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    tabular: true,
  },
  subheading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  micro: {
    // Uppercase. Components apply textTransform: 'uppercase'.
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
} as const;

export type TypeToken = keyof typeof type;

// ────────────────────────────────────────────────────────────
// Spacing — 4-pt scale
// ────────────────────────────────────────────────────────────

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,
  s9: 48,
  s10: 64,
} as const;

// ────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────

export const layout = {
  screenPaddingX: 20,
  screenPaddingY: 24,
  cardPadding: 20,
  cardGap: 12,
  sectionGap: 32,
  // Design width — informational only; RN screens flex.
  mobileFrameWidth: 390,
} as const;

// ────────────────────────────────────────────────────────────
// Radii
// ────────────────────────────────────────────────────────────

export const radius = {
  card: 12,
  button: 12,
  pill: 9999,
  tap: 10,
} as const;

// ────────────────────────────────────────────────────────────
// Tap targets
// ────────────────────────────────────────────────────────────

export const tap = {
  min: 44,
} as const;

// ────────────────────────────────────────────────────────────
// Borders
// ────────────────────────────────────────────────────────────

export const border = {
  hairline: 1,
} as const;

// ────────────────────────────────────────────────────────────
// Motion
// ────────────────────────────────────────────────────────────

export const motion = {
  expandMs: 280,
  contentFadeMs: 120,
  // iOS spring approximation, used for non-physics easings via
  // Animated.timing. For Reanimated layout transitions we use
  // withSpring({ mass: 1, damping: 18, stiffness: 220 }).
  easingIosBezier: [0.32, 0.72, 0, 1] as const,
  // Reanimated spring config approximating iOS response 0.5 / damping 0.8.
  spring: {
    mass: 1,
    damping: 18,
    stiffness: 220,
  } as const,
} as const;

// ────────────────────────────────────────────────────────────
// Aggregate export — convenience for components that pull many tokens.
// ────────────────────────────────────────────────────────────

export const tokens = {
  colors,
  type,
  spacing,
  layout,
  radius,
  tap,
  border,
  motion,
  fontStack,
} as const;

export type Tokens = typeof tokens;
