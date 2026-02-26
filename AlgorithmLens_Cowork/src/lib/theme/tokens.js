/**
 * AlgorithmLens Dashboard Theme Tokens
 *
 * Single source of truth for brand colors and theme values.
 * Reuses existing brand colors from tailwind.config.js:
 * - primary-blue: #2563EB (70% dominance)
 * - accent-green: #10B981 (30% dominance)
 */

export const themeTokens = {
  // Brand colors (from tailwind.config.js)
  brandPrimary: '#2563EB', // primary-blue
  brandSecondary: '#10B981', // accent-green

  // Tints and backgrounds
  brandTintBg: 'rgba(37, 99, 235, 0.02)', // Very light blue tint
  brandTintBorder: 'rgba(37, 99, 235, 0.12)', // Light blue border
  accentTintBg: 'rgba(16, 185, 129, 0.02)', // Very light green tint

  // Text colors
  textMain: '#1E293B',
  textMuted: '#4B5563', // Darkened from #64748B for WCAG AA contrast (4.5:1 on white)

  // Borders
  borderSoft: 'rgba(30, 41, 59, 0.06)',
  borderMedium: 'rgba(30, 41, 59, 0.12)',

  // Semantic (for reference, but use existing chart colors)
  accentInfo: '#2563EB', // Same as brandPrimary

  // Emotional tone colors — calm, informational palette
  // Used by StackedBar100, ToneTab, AdsTab tone splits, etc.
  tonePositive: '#93C5B8',  // Muted sage green — calm, not celebratory
  toneNeutral: '#CBD5E1',   // Soft slate — blends into background
  toneNegative: '#A3B1C6',  // Muted steel blue — informational, not alarming
};

/**
 * Tailwind class mappings for theme colors
 * Use these when applying theme in components
 */
export const tailwindClasses = {
  brandPrimary: 'primary-blue',
  brandSecondary: 'accent-green',
  textMain: 'text-main',
  textMuted: 'text-muted',
};
