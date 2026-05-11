/**
 * platformLabels: shared lookup for supported social platforms.
 *
 * Provides two-letter abbreviations used in compact monogram avatars
 * ("IG", "X", "YT", "TT", "FB", "Re") and full display names
 * ("Instagram", "X", "YouTube", "TikTok", "Facebook", "Reddit") used in
 * subtitles, alert copy, and accessibility labels. Lookups are
 * case-insensitive on the input key.
 *
 * Consumers: ConditionalLastScanRow (Home's last-scan row), Compare
 * picker, Compare result. The legacy History row still inlines its own
 * map; lifting that is a future cleanup.
 */

export interface PlatformLabel {
  abbrev: string;
  name: string;
}

const PLATFORMS: Record<string, PlatformLabel> = {
  instagram: { abbrev: 'IG', name: 'Instagram' },
  twitter: { abbrev: 'X', name: 'X' },
  x: { abbrev: 'X', name: 'X' },
  youtube: { abbrev: 'YT', name: 'YouTube' },
  tiktok: { abbrev: 'TT', name: 'TikTok' },
  facebook: { abbrev: 'FB', name: 'Facebook' },
  reddit: { abbrev: 'Re', name: 'Reddit' },
};

/**
 * Returns the 2-letter monogram abbreviation for a platform key. Returns
 * '?' for unknown, empty, or null keys so callers can render a neutral
 * fallback without conditional logic.
 */
export function platformAbbrev(key: string | undefined | null): string {
  if (!key) return '?';
  return PLATFORMS[key.toLowerCase()]?.abbrev ?? '?';
}

/**
 * Returns the human-readable display name for a platform key. Returns
 * the raw input for unknown keys (so a previously unseen platform value
 * still surfaces something legible). Returns '' for empty/null input.
 */
export function platformName(key: string | undefined | null): string {
  if (!key) return '';
  return PLATFORMS[key.toLowerCase()]?.name ?? key;
}
