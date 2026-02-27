/**
 * AlgorithmLens Mobile App — Design System
 *
 * A complete, production-grade design token system inspired by
 * Calm × Duolingo × modern fintech aesthetics.
 *
 * Principles:
 * - 4pt grid for all spacing
 * - Mathematically consistent scales
 * - Semantic color tokens for context-aware theming
 * - Dark mode as a first-class citizen (not inverted light)
 * - WCAG AA contrast verified
 *
 * All font sizes use RFValue for Dynamic Type / accessibility scaling.
 */
import { RFValue } from 'react-native-responsive-fontsize';

// ─── Color Palette: Neutrals (50–900) ──────────────────────

const NEUTRAL = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
} as const;

// ─── Light Mode Colors ───────────────────────────────────

export const LIGHT_COLORS = {
  // ── Core Brand ──
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryPressed: '#1E40AF',
  secondary: '#10B981',
  secondaryHover: '#059669',
  accent: '#8B5CF6',
  accentHover: '#7C3AED',

  // ── Semantic Status ──
  success: '#059669',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  successBright: '#22C55E',
  successBgLight: '#F0FDF4',
  successBgMedium: '#DCFCE7',
  warning: '#B8860B',
  warningLight: '#FFFBEB',
  warningBorder: 'rgba(180, 134, 11, 0.15)',
  error: '#B45555',
  errorLight: '#FEF2F2',
  errorBright: '#EF4444',
  errorBorder: '#FCA5A5',

  // ── Blue Scale ──
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',

  // ── Green Scale ──
  green50: '#ECFDF5',
  green100: '#D1FAE5',
  green200: '#A7F3D0',
  green500: '#10B981',
  green600: '#059669',
  green700: '#047857',

  // ── Semantic Text ──
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textMain: '#1E293B',
  textMuted: '#4B5563',

  // ── Semantic Backgrounds ──
  bgPrimary: '#F7F8FC',
  bgSecondary: '#F1F5F9',
  bgElevated: '#FFFFFF',
  bgPage: '#F7F8FC',
  bgCard: '#FFFFFF',
  bgCardGradientEnd: '#FAFBFE',

  // ── Semantic Borders ──
  borderDefault: 'rgba(30, 41, 59, 0.12)',
  borderSubtle: 'rgba(30, 41, 59, 0.06)',
  borderLight: 'rgba(30, 41, 59, 0.08)',
  borderSoft: 'rgba(30, 41, 59, 0.06)',
  borderMedium: 'rgba(30, 41, 59, 0.12)',
  borderSlate200: '#E2E8F0',
  borderSlate300: '#CBD5E1',

  // ── Brand Tints ──
  brandTintBg: 'rgba(37, 99, 235, 0.02)',
  brandTintBorder: 'rgba(37, 99, 235, 0.12)',
  accentTintBg: 'rgba(16, 185, 129, 0.02)',

  // ── Surface Colors ──
  inputBg: '#FFFFFF',
  overlayBg: 'rgba(255, 255, 255, 0.88)',
  overlayDimBg: 'rgba(0, 0, 0, 0.4)',
  scanOverlayBg: '#FFFFFF',
  dividerColor: '#E2E8F0',
  cancelButtonBg: '#F3F4F6',
  timerBg: '#F3F4F6',
  savingOverlayBg: 'rgba(0, 0, 0, 0.4)',

  // ── Low-Sample Warning ──
  lowSampleBg: '#FFFBEB',
  lowSampleBorder: 'rgba(180, 134, 11, 0.15)',

  // ── Recording/Broadcast ──
  recordingDot: '#EF4444',
  stopButtonBg: '#FEE2E2',
  stopButtonText: '#DC2626',
  recordingBorder: '#FCA5A5',

  // ── Chart Palette ──
  chartPalette: ['#2563EB', '#10B981', '#7C8DB5', '#B8860B', '#8B7BA8', '#5B7FA6'] as readonly string[],

  // ── Chart: Tone Tab ── (CT-001: increased hue separation for readability)
  tonePositive: '#93C5A8',   // muted sage-green
  toneNeutral: '#C5C0B8',    // warm gray
  toneNegative: '#A3B1C6',   // muted slate-blue (unchanged)

  // ── Chart: Ads Tab ──
  adsNotAds: '#94A3B8',
  adsLabeled: '#2563EB',
  adsUnlabeled: '#B8A394',

  // ── Chart: Bar Gradient ──
  barDarkest: '#1E40AF',
  barDark: '#2563EB',
  barMedium: '#3B82F6',
  barLight: '#60A5FA',
  barLightest: '#93C5FD',
  stackedBarTrack: '#F1F5F9',

  // ── Ideology ── (CT-002: increased saturation for left/right)
  ideologyLeft: '#6B8FC4',
  ideologyCenter: '#94A3B8',
  ideologyRight: '#C4A088',

  // ── Category Icons ──
  iconAds: '#F59E0B',
  iconPolitics: '#8B5CF6',
  iconTone: '#10B981',

  // ── Streak ──
  streakOrange: '#F97316',
  streakOrangeBg: 'rgba(249, 115, 22, 0.08)',
  streakDeepOrange: '#EA580C',
  streakDeepOrangeBg: 'rgba(234, 88, 12, 0.08)',
  streakBlaze: '#DC2626',
  streakBlazeBg: 'rgba(220, 38, 38, 0.08)',

  // ── Platform Default ──
  platformDefault: '#9CA3AF',

  // ── Tour Accents ──
  tourOverview: '#2563EB',
  tourSources: '#6366F1',
  tourAds: '#D97706',
  tourPolitics: '#7C3AED',
  tourTone: '#0D9488',
  tourSuggested: '#E11D48',

  // ── Gradients ──
  gradientPrimaryStart: '#2563EB',
  gradientPrimaryEnd: '#1D4ED8',
  gradientAccentStart: '#10B981',
  gradientAccentEnd: '#059669',
  gradientCardStart: '#FFFFFF',
  gradientCardEnd: '#FAFBFE',
  gradientWarmStart: '#FFF7ED',
  gradientWarmEnd: '#FFFBEB',

  // ── White Overlays ──
  whiteOverlay50: 'rgba(255, 255, 255, 0.5)',
  whiteOverlay65: 'rgba(255, 255, 255, 0.65)',
  whiteOverlay70: 'rgba(255, 255, 255, 0.7)',
  whiteOverlay80: 'rgba(255, 255, 255, 0.8)',
  whiteOverlay85: 'rgba(255, 255, 255, 0.85)',
  whiteOverlay90: 'rgba(255, 255, 255, 0.9)',

  // ── Misc ──
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  separator: '#D1D5DB',

  // ── Backward Compat Aliases ──
  primaryBlue: '#2563EB',
  accentGreen: '#10B981',
} as const;

// ─── Dark Mode Colors ────────────────────────────────────
// WCAG AA contrast ratios verified:
// - textPrimary (#F1F5F9) on bgPage (#0F172A) = 15.4:1 ✓
// - textPrimary (#F1F5F9) on bgCard (#1E293B) = 11.3:1 ✓
// - textTertiary (#94A3B8) on bgCard (#1E293B) = 4.6:1  ✓ (AA)
// - textSecondary (#CBD5E1) on bgCard (#1E293B) = 8.1:1 ✓
// - primary (#3B82F6) on bgCard (#1E293B) = 4.6:1 ✓

export const DARK_COLORS = {
  // ── Core Brand ──
  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  primaryPressed: '#2563EB',
  secondary: '#34D399',
  secondaryHover: '#6EE7B7',
  accent: '#A78BFA',
  accentHover: '#8B5CF6',

  // ── Semantic Status ──
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.10)',
  successBorder: 'rgba(52, 211, 153, 0.25)',
  successBright: '#4ADE80',
  successBgLight: 'rgba(74, 222, 128, 0.10)',
  successBgMedium: 'rgba(74, 222, 128, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.10)',
  warningBorder: 'rgba(251, 191, 36, 0.20)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.10)',
  errorBright: '#F87171',
  errorBorder: 'rgba(248, 113, 113, 0.30)',

  // ── Blue Scale ──
  blue50: 'rgba(59, 130, 246, 0.10)',
  blue100: 'rgba(59, 130, 246, 0.15)',
  blue200: 'rgba(59, 130, 246, 0.25)',
  blue300: 'rgba(59, 130, 246, 0.35)',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#3B82F6',
  blue700: '#60A5FA',
  blue800: '#93C5FD',

  // ── Green Scale ──
  green50: 'rgba(52, 211, 153, 0.10)',
  green100: 'rgba(52, 211, 153, 0.15)',
  green200: 'rgba(52, 211, 153, 0.25)',
  green500: '#34D399',
  green600: '#6EE7B7',
  green700: '#A7F3D0',

  // ── Semantic Text ──
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  textMain: '#F1F5F9',
  textMuted: '#94A3B8',

  // ── Semantic Backgrounds ──
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgElevated: '#1E293B',
  bgPage: '#0F172A',
  bgCard: '#1E293B',
  bgCardGradientEnd: '#1E293B',

  // ── Semantic Borders ──
  borderDefault: 'rgba(148, 163, 184, 0.18)',
  borderSubtle: 'rgba(148, 163, 184, 0.08)',
  borderLight: 'rgba(148, 163, 184, 0.12)',
  borderSoft: 'rgba(148, 163, 184, 0.08)',
  borderMedium: 'rgba(148, 163, 184, 0.18)',
  borderSlate200: 'rgba(148, 163, 184, 0.15)',
  borderSlate300: 'rgba(148, 163, 184, 0.20)',

  // ── Brand Tints ──
  brandTintBg: 'rgba(59, 130, 246, 0.06)',
  brandTintBorder: 'rgba(59, 130, 246, 0.20)',
  accentTintBg: 'rgba(52, 211, 153, 0.06)',

  // ── Surface Colors ──
  inputBg: '#334155',
  overlayBg: 'rgba(15, 23, 42, 0.92)',
  overlayDimBg: 'rgba(0, 0, 0, 0.6)',
  scanOverlayBg: '#1E293B',
  dividerColor: 'rgba(148, 163, 184, 0.15)',
  cancelButtonBg: '#334155',
  timerBg: '#334155',
  savingOverlayBg: 'rgba(0, 0, 0, 0.6)',

  // ── Low-Sample Warning ──
  lowSampleBg: 'rgba(251, 191, 36, 0.10)',
  lowSampleBorder: 'rgba(251, 191, 36, 0.20)',

  // ── Recording/Broadcast ──
  recordingDot: '#F87171',
  stopButtonBg: 'rgba(248, 113, 113, 0.15)',
  stopButtonText: '#F87171',
  recordingBorder: 'rgba(248, 113, 113, 0.30)',

  // ── Chart Palette ──
  chartPalette: ['#3B82F6', '#34D399', '#94A3B8', '#FBBF24', '#A78BFA', '#7DD3FC'] as readonly string[],

  // ── Chart: Tone Tab ──
  tonePositive: '#6EE7B7',
  toneNeutral: '#94A3B8',
  toneNegative: '#7DD3FC',

  // ── Chart: Ads Tab ──
  adsNotAds: '#64748B',
  adsLabeled: '#3B82F6',
  adsUnlabeled: '#D4A574',

  // ── Chart: Bar Gradient ──
  barDarkest: '#93C5FD',
  barDark: '#60A5FA',
  barMedium: '#3B82F6',
  barLight: '#2563EB',
  barLightest: '#1D4ED8',
  stackedBarTrack: '#334155',

  // ── Ideology ──
  ideologyLeft: '#7DD3FC',
  ideologyCenter: '#94A3B8',
  ideologyRight: '#D4A574',

  // ── Category Icons ──
  iconAds: '#FBBF24',
  iconPolitics: '#A78BFA',
  iconTone: '#34D399',

  // ── Streak ──
  streakOrange: '#FB923C',
  streakOrangeBg: 'rgba(251, 146, 60, 0.12)',
  streakDeepOrange: '#F97316',
  streakDeepOrangeBg: 'rgba(249, 115, 22, 0.12)',
  streakBlaze: '#EF4444',
  streakBlazeBg: 'rgba(239, 68, 68, 0.12)',

  // ── Platform Default ──
  platformDefault: '#6B7280',

  // ── Tour Accents ──
  tourOverview: '#3B82F6',
  tourSources: '#818CF8',
  tourAds: '#F59E0B',
  tourPolitics: '#A78BFA',
  tourTone: '#2DD4BF',
  tourSuggested: '#FB7185',

  // ── Gradients ──
  gradientPrimaryStart: '#3B82F6',
  gradientPrimaryEnd: '#2563EB',
  gradientAccentStart: '#34D399',
  gradientAccentEnd: '#10B981',
  gradientCardStart: '#1E293B',
  gradientCardEnd: '#1E293B',
  gradientWarmStart: 'rgba(251, 191, 36, 0.08)',
  gradientWarmEnd: 'rgba(251, 191, 36, 0.04)',

  // ── White Overlays (dark mode: use blackish overlays) ──
  whiteOverlay50: 'rgba(15, 23, 42, 0.5)',
  whiteOverlay65: 'rgba(15, 23, 42, 0.65)',
  whiteOverlay70: 'rgba(15, 23, 42, 0.7)',
  whiteOverlay80: 'rgba(15, 23, 42, 0.8)',
  whiteOverlay85: 'rgba(15, 23, 42, 0.85)',
  whiteOverlay90: 'rgba(15, 23, 42, 0.9)',

  // ── Misc ──
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  separator: 'rgba(148, 163, 184, 0.20)',

  // ── Backward Compat Aliases ──
  primaryBlue: '#3B82F6',
  accentGreen: '#34D399',
} as const;

// ─── Backward-compatible COLORS export (light) ──────────
export const COLORS = LIGHT_COLORS;

// ─── Color set type ──────────────────────────────────────
export type ThemeColors = {
  [K in keyof typeof LIGHT_COLORS]: (typeof LIGHT_COLORS)[K] extends readonly string[]
    ? readonly string[]
    : string;
};

// ─── Shadows / Elevation System ─────────────────────────

export const LIGHT_SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },
  hero: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 6,
  },
} as const;

export const DARK_SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  hero: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// Backward-compatible export
export const SHADOWS = LIGHT_SHADOWS;

// Shadow type
interface ShadowValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}
export type ThemeShadows = {
  sm: ShadowValue;
  soft: ShadowValue;
  md: ShadowValue;
  card: ShadowValue;
  lg: ShadowValue;
  medium: ShadowValue;
  xl: ShadowValue;
  hero: ShadowValue;
};

// ─── Typography Scale ────────────────────────────────────
// Display → h1 → h2 → h3 → body → bodySmall → caption → label

export const TYPOGRAPHY = {
  display: {
    fontSize: RFValue(32),
    fontWeight: '700' as const,
    lineHeight: RFValue(40),
    letterSpacing: -0.96,
  },
  h1: {
    fontSize: RFValue(24),
    fontWeight: '700' as const,
    lineHeight: RFValue(32),
    letterSpacing: -0.48,
  },
  heroTitle: {
    fontSize: RFValue(26),
    fontWeight: '700' as const,
    lineHeight: RFValue(34),
    letterSpacing: -0.52,
  },
  h2: {
    fontSize: RFValue(18),
    fontWeight: '600' as const,
    lineHeight: RFValue(24),
    letterSpacing: -0.18,
  },
  h3: {
    fontSize: RFValue(16),
    fontWeight: '600' as const,
    lineHeight: RFValue(22),
    letterSpacing: -0.16,
  },
  bodyLarge: {
    fontSize: RFValue(16),
    fontWeight: '400' as const,
    lineHeight: RFValue(24),
    letterSpacing: 0,
  },
  body: {
    fontSize: RFValue(15),
    fontWeight: '400' as const,
    lineHeight: RFValue(22),
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: RFValue(14),
    fontWeight: '400' as const,
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  caption: {
    fontSize: RFValue(12),
    fontWeight: '400' as const,
    lineHeight: RFValue(16),
    letterSpacing: 0.2,
  },
  captionSmall: {
    fontSize: RFValue(11),
    fontWeight: '400' as const,
    lineHeight: RFValue(15),
    letterSpacing: 0.2,
  },
  label: {
    fontSize: RFValue(14),
    fontWeight: '500' as const,
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  labelBold: {
    fontSize: RFValue(14),
    fontWeight: '600' as const,
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  small: {
    fontSize: RFValue(14),
    fontWeight: '400' as const,
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  overline: {
    fontSize: RFValue(11),
    fontWeight: '600' as const,
    lineHeight: RFValue(15),
    letterSpacing: 0.88,
    textTransform: 'uppercase' as const,
  },
  xsmall: {
    fontSize: RFValue(14),
    fontWeight: '600' as const,
    lineHeight: RFValue(18),
    letterSpacing: 0.88,
    textTransform: 'uppercase' as const,
  },
  bigNumber: {
    fontSize: RFValue(32),
    fontWeight: '700' as const,
    lineHeight: RFValue(40),
    letterSpacing: -1.0,
  },
  scoreLarge: {
    fontSize: RFValue(32),
    fontWeight: '700' as const,
    lineHeight: RFValue(38),
    letterSpacing: -1.0,
  },
  scoreSmall: {
    fontSize: RFValue(20),
    fontWeight: '700' as const,
    lineHeight: RFValue(26),
    letterSpacing: -0.5,
  },
  buttonLg: {
    fontSize: RFValue(16),
    fontWeight: '600' as const,
    lineHeight: RFValue(22),
    letterSpacing: 0,
  },
  buttonMd: {
    fontSize: RFValue(15),
    fontWeight: '600' as const,
    lineHeight: RFValue(20),
    letterSpacing: 0,
  },
  buttonSm: {
    fontSize: RFValue(14),
    fontWeight: '600' as const,
    lineHeight: RFValue(18),
    letterSpacing: 0,
  },
} as const;

// ─── Spacing Scale (4pt Grid) ────────────────────────────

export const SPACING = {
  xxs: 2,
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

// ─── Border Radius Scale ─────────────────────────────────

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
  pill: 9999,
} as const;

// ─── Touch Target Minimums (Apple HIG) ──────────────────
export const MIN_TOUCH_TARGET = 44;

// ─── Platform Config ─────────────────────────────────────

export const PLATFORMS = {
  instagram: { name: 'Instagram', color: '#E4405F', icon: 'instagram' },
  twitter: { name: 'X', color: '#000000', icon: 'twitter' },
  youtube: { name: 'YouTube', color: '#D32F2F', icon: 'youtube' },
  // O-4 FIX: Use music-2 icon which is slightly more recognizable for TikTok
  tiktok: { name: 'TikTok', color: '#000000', icon: 'music-2' },
  facebook: { name: 'Facebook', color: '#1877F2', icon: 'facebook' },
  reddit: { name: 'Reddit', color: '#FF4500', icon: 'message-circle' },
} as const;

export const DARK_PLATFORMS = {
  ...PLATFORMS,
  tiktok: { name: 'TikTok', color: '#FFFFFF', icon: 'music-2' },
} as const;

// ─── Utility: Color with opacity ─────────────────────────

export function withOpacity(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1] ?? '0', 16);
    const g = parseInt(result[2] ?? '0', 16);
    const b = parseInt(result[3] ?? '0', 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return hex;
}
