/**
 * String utilities — shared presentation-layer helpers.
 *
 * Promoted out of OverviewTab.tsx during build #50 prep so upcoming tab
 * redesigns (Sources, Ads, Politics, Tone, Suggested vs Followed) can reuse
 * the same normalizations at every Gemini-derived string boundary.
 *
 * Per the project's data-layer rules, we DO NOT modify computeDashboardData
 * or any hooks. These helpers normalize strings at the presentation
 * boundary instead.
 */

/**
 * Normalize a string to sentence case: first character upper, rest lower.
 * Returns the input unchanged when falsy/empty.
 *
 * Use this for labels coming from the data layer where upstream casing is
 * inconsistent — e.g. content_type values from countContentTypes() that
 * arrive as "PHOTO", topic strings extracted by Gemini, raw enum codes.
 *
 * Per the brand voice rules, all UI strings are sentence case.
 */
export function toSentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
