/**
 * AlgorithmLens Mobile App — Design System
 *
 * Exact parity with the web dashboard design tokens.
 * Source: tailwind.config.js + src/lib/theme/tokens.js
 */

export const COLORS = {
  // Brand (70/30 rule: blue dominant, green accent)
  primaryBlue: '#2563EB',
  accentGreen: '#10B981',

  // Blue palette
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',

  // Green palette
  green50: '#ECFDF5',
  green100: '#D1FAE5',
  green200: '#A7F3D0',
  green500: '#10B981',
  green600: '#059669',
  green700: '#047857',

  // Backgrounds
  bgPage: '#F7F8FC',
  bgCard: '#FFFFFF',
  bgCardGradientEnd: '#FAFBFE',

  // Tints
  brandTintBg: 'rgba(37, 99, 235, 0.02)',
  brandTintBorder: 'rgba(37, 99, 235, 0.12)',
  accentTintBg: 'rgba(16, 185, 129, 0.02)',

  // Text
  textMain: '#1E293B',
  textMuted: '#4B5563',
  textSecondary: '#64748B',

  // Borders
  borderLight: 'rgba(30, 41, 59, 0.08)',
  borderSoft: 'rgba(30, 41, 59, 0.06)',
  borderMedium: 'rgba(30, 41, 59, 0.12)',
  borderSlate200: '#E2E8F0',
  borderSlate300: '#CBD5E1',

  // Status
  success: '#059669',
  error: '#B45555',
  warning: '#B8860B',

  // Chart palette — muted, sophisticated tones for data viz
  chartPalette: ['#2563EB', '#10B981', '#7C8DB5', '#B8860B', '#8B7BA8', '#5B7FA6'],

  // Chart colors (Tone tab)
  tonePositive: '#93C5B8',
  toneNeutral: '#CBD5E1',
  toneNegative: '#A3B1C6',

  // Chart colors (Ads tab)
  adsNotAds: '#94A3B8',
  adsLabeled: '#2563EB',
  adsUnlabeled: '#B8A394',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const TYPOGRAPHY = {
  heroTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.52, // -0.02em
  },
  h2: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.18, // -0.01em
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  labelBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  xsmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.88, // 0.08em
    textTransform: 'uppercase' as const,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -1.2, // -0.03em
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12, // buttons, inputs
  lg: 16,
  xl: 20, // cards
  '2xl': 28, // large containers
  pill: 9999,
} as const;

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  hero: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 6,
  },
} as const;

// Platform icons and colors
export const PLATFORMS = {
  instagram: { name: 'Instagram', color: '#E4405F', icon: 'instagram' },
  twitter: { name: 'Twitter / X', color: '#1DA1F2', icon: 'twitter' },
  youtube: { name: 'YouTube', color: '#FF0000', icon: 'youtube' },
  tiktok: { name: 'TikTok', color: '#000000', icon: 'music' },
  facebook: { name: 'Facebook', color: '#1877F2', icon: 'facebook' },
  reddit: { name: 'Reddit', color: '#FF4500', icon: 'message-circle' },
} as const;
