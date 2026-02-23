/**
 * Premium Feature Definitions for Mobile
 *
 * Maps to the main site's dashboardCatalog.js premiumOnly views.
 * These are the features gated behind Plus on the main site:
 *
 * - ads-trend (premiumOnly: true) — Changes in Advertising Over Time
 * - ads-promo-creators (premiumOnly: true) — Who is Doing the Promoting
 * - politics-trend (premiumOnly: true) — Change in Political Exposure Over Time
 * - patterns-discovery (premiumOnly: true) — Discovery Rate
 * - patterns-rare-content (premiumOnly: true) — Topics That Rarely Show Up
 *
 * On mobile, we gate these same categories:
 * 1. Trend analysis (longitudinal data across scans)
 * 2. Creator-specific breakdowns (deep analysis per creator)
 * 3. Rare content detection (uncommon topics and discovery rates)
 *
 * The dashboard index.tsx uses these IDs to decide which sections
 * should be wrapped in LockedOverlayCard for free users.
 */

/** Sections in the mobile dashboard that require Plus. */
export const PREMIUM_SECTIONS = {
  /** Trend tracking across scans — the core Plus value proposition. */
  TREND_ANALYSIS: 'trend_analysis',
  /** Per-creator breakdowns (who drives ads, politics, etc.). */
  CREATOR_BREAKDOWNS: 'creator_breakdowns',
  /** Rare/underrepresented content detection. */
  RARE_CONTENT: 'rare_content',
} as const;

export type PremiumSection = typeof PREMIUM_SECTIONS[keyof typeof PREMIUM_SECTIONS];

/** Returns true if a given section requires Plus. */
export function isPremiumSection(sectionId: string): boolean {
  return Object.values(PREMIUM_SECTIONS).includes(sectionId as PremiumSection);
}
