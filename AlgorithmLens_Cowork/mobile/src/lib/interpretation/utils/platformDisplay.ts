/**
 * platformDisplay: convert an internal platform key (lowercase, e.g.
 * 'youtube') into the user-facing display name (e.g. 'YouTube').
 *
 * Used by the interpretation engine when composing verdict and
 * sub-line strings. Centralized so the brand convention (e.g. twitter
 * displayed as 'X') lives in one place rather than scattered across
 * templates.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'X',
  facebook: 'Facebook',
  reddit: 'Reddit',
};

/**
 * Capitalize a platform key for display. Recognized platforms get
 * their brand-correct casing (YouTube, TikTok, etc.). Unknown
 * platforms fall back to title-case of the input.
 *
 * Empty input returns 'Unknown' rather than the empty string so
 * downstream string interpolation never produces phrases like
 * "your  feed".
 */
export function capitalizePlatform(platform: string): string {
  if (!platform || platform.length === 0) return 'Unknown';
  const lower = platform.toLowerCase();
  const known = PLATFORM_LABELS[lower];
  if (known) return known;
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}
