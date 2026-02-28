/**
 * Gluestack Theme Config — Bridge from existing theme.ts tokens
 *
 * This file imports ALL existing tokens from theme.ts and maps them into
 * a configuration format consumable by GL* components. The existing tokens
 * in theme.ts remain the single source of truth — this file is a BRIDGE.
 *
 * Supports both light and dark mode via the mode parameter.
 * Applies Geist font family and website letter spacing values.
 */

import {
  LIGHT_COLORS,
  DARK_COLORS,
  LIGHT_SHADOWS,
  DARK_SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  type ThemeColors,
  type ThemeShadows,
} from './theme';

// ─── Font Family Mapping ─────────────────────────────────
// Maps font weights to Geist font family names loaded via expo-font.
// These names must match the keys used in useFonts() in _layout.tsx.

export const GEIST_FONTS = {
  regular: 'Geist-Regular',     // 400
  medium: 'Geist-Medium',       // 500
  semibold: 'Geist-SemiBold',   // 600
  bold: 'Geist-Bold',           // 700
} as const;

/**
 * Maps a fontWeight string to the corresponding Geist font family name.
 * Falls back to Geist-Regular for unrecognized weights.
 */
export function geistFontForWeight(weight: string): string {
  switch (weight) {
    case '700':
      return GEIST_FONTS.bold;
    case '600':
      return GEIST_FONTS.semibold;
    case '500':
      return GEIST_FONTS.medium;
    case '400':
    default:
      return GEIST_FONTS.regular;
  }
}

// ─── Letter Spacing ──────────────────────────────────────
// Website-matching letter spacing values from DESIGN_UPGRADE_TARGET.md

export const LETTER_SPACING = {
  /** -0.03em — Hero / display text */
  hero: -0.03,
  /** -0.02em — Headings (h1, h2) */
  heading: -0.02,
  /** -0.01em — Card titles, labels */
  card: -0.01,
  /** 0 — Body text */
  body: 0,
  /** 0.02em — Captions, overlines */
  caption: 0.02,
} as const;

// ─── Typography with Geist ───────────────────────────────
// Extends the existing TYPOGRAPHY scale with Geist font family assignments.
// Each variant gets the correct fontFamily based on its fontWeight.

export const GL_TYPOGRAPHY = {
  display: {
    ...TYPOGRAPHY.display,
    fontFamily: geistFontForWeight(TYPOGRAPHY.display.fontWeight),
    letterSpacing: TYPOGRAPHY.display.fontSize * LETTER_SPACING.hero,
  },
  h1: {
    ...TYPOGRAPHY.h1,
    fontFamily: geistFontForWeight(TYPOGRAPHY.h1.fontWeight),
    letterSpacing: TYPOGRAPHY.h1.fontSize * LETTER_SPACING.heading,
  },
  heroTitle: {
    ...TYPOGRAPHY.heroTitle,
    fontFamily: geistFontForWeight(TYPOGRAPHY.heroTitle.fontWeight),
    letterSpacing: TYPOGRAPHY.heroTitle.fontSize * LETTER_SPACING.hero,
  },
  h2: {
    ...TYPOGRAPHY.h2,
    fontFamily: geistFontForWeight(TYPOGRAPHY.h2.fontWeight),
    letterSpacing: TYPOGRAPHY.h2.fontSize * LETTER_SPACING.heading,
  },
  h3: {
    ...TYPOGRAPHY.h3,
    fontFamily: geistFontForWeight(TYPOGRAPHY.h3.fontWeight),
    letterSpacing: TYPOGRAPHY.h3.fontSize * LETTER_SPACING.card,
  },
  bodyLarge: {
    ...TYPOGRAPHY.bodyLarge,
    fontFamily: geistFontForWeight(TYPOGRAPHY.bodyLarge.fontWeight),
    letterSpacing: TYPOGRAPHY.bodyLarge.letterSpacing,
  },
  body: {
    ...TYPOGRAPHY.body,
    fontFamily: geistFontForWeight(TYPOGRAPHY.body.fontWeight),
    letterSpacing: TYPOGRAPHY.body.letterSpacing,
  },
  bodySmall: {
    ...TYPOGRAPHY.bodySmall,
    fontFamily: geistFontForWeight(TYPOGRAPHY.bodySmall.fontWeight),
    letterSpacing: TYPOGRAPHY.bodySmall.letterSpacing,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    fontFamily: geistFontForWeight(TYPOGRAPHY.caption.fontWeight),
    letterSpacing: TYPOGRAPHY.caption.letterSpacing,
  },
  captionSmall: {
    ...TYPOGRAPHY.captionSmall,
    fontFamily: geistFontForWeight(TYPOGRAPHY.captionSmall.fontWeight),
    letterSpacing: TYPOGRAPHY.captionSmall.letterSpacing,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontFamily: geistFontForWeight(TYPOGRAPHY.label.fontWeight),
    letterSpacing: TYPOGRAPHY.label.letterSpacing,
  },
  labelBold: {
    ...TYPOGRAPHY.labelBold,
    fontFamily: geistFontForWeight(TYPOGRAPHY.labelBold.fontWeight),
    letterSpacing: TYPOGRAPHY.labelBold.letterSpacing,
  },
  small: {
    ...TYPOGRAPHY.small,
    fontFamily: geistFontForWeight(TYPOGRAPHY.small.fontWeight),
    letterSpacing: TYPOGRAPHY.small.letterSpacing,
  },
  overline: {
    ...TYPOGRAPHY.overline,
    fontFamily: geistFontForWeight(TYPOGRAPHY.overline.fontWeight),
    letterSpacing: TYPOGRAPHY.overline.letterSpacing,
  },
  xsmall: {
    ...TYPOGRAPHY.xsmall,
    fontFamily: geistFontForWeight(TYPOGRAPHY.xsmall.fontWeight),
    letterSpacing: TYPOGRAPHY.xsmall.letterSpacing,
  },
  bigNumber: {
    ...TYPOGRAPHY.bigNumber,
    fontFamily: geistFontForWeight(TYPOGRAPHY.bigNumber.fontWeight),
    letterSpacing: TYPOGRAPHY.bigNumber.letterSpacing,
  },
  scoreLarge: {
    ...TYPOGRAPHY.scoreLarge,
    fontFamily: geistFontForWeight(TYPOGRAPHY.scoreLarge.fontWeight),
    letterSpacing: TYPOGRAPHY.scoreLarge.letterSpacing,
  },
  scoreSmall: {
    ...TYPOGRAPHY.scoreSmall,
    fontFamily: geistFontForWeight(TYPOGRAPHY.scoreSmall.fontWeight),
    letterSpacing: TYPOGRAPHY.scoreSmall.letterSpacing,
  },
  buttonLg: {
    ...TYPOGRAPHY.buttonLg,
    fontFamily: geistFontForWeight(TYPOGRAPHY.buttonLg.fontWeight),
    letterSpacing: TYPOGRAPHY.buttonLg.letterSpacing,
  },
  buttonMd: {
    ...TYPOGRAPHY.buttonMd,
    fontFamily: geistFontForWeight(TYPOGRAPHY.buttonMd.fontWeight),
    letterSpacing: TYPOGRAPHY.buttonMd.letterSpacing,
  },
  buttonSm: {
    ...TYPOGRAPHY.buttonSm,
    fontFamily: geistFontForWeight(TYPOGRAPHY.buttonSm.fontWeight),
    letterSpacing: TYPOGRAPHY.buttonSm.letterSpacing,
  },
} as const;

// ─── Complete Theme Config ───────────────────────────────
// Unified theme object that GL* components consume.

export interface GluestackThemeConfig {
  colors: ThemeColors;
  shadows: ThemeShadows;
  typography: typeof GL_TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  fonts: typeof GEIST_FONTS;
  letterSpacing: typeof LETTER_SPACING;
  isDark: boolean;
}

/**
 * Returns the complete gluestack theme config for the given mode.
 * GL* components use this to access all design tokens.
 */
export function getGluestackTheme(isDark: boolean): GluestackThemeConfig {
  return {
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    shadows: isDark ? DARK_SHADOWS : LIGHT_SHADOWS,
    typography: GL_TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    fonts: GEIST_FONTS,
    letterSpacing: LETTER_SPACING,
    isDark,
  };
}

// ─── Re-exports for convenience ──────────────────────────
// GL* components can import everything they need from this single file.

export { SPACING, RADIUS } from './theme';
export type { ThemeColors, ThemeShadows } from './theme';
