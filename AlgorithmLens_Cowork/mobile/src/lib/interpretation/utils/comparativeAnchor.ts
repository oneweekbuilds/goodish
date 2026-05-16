/**
 * comparativeAnchor: produce the 2-4 word "how this scan compares
 * to your usual" phrase that anchors supporting card rows.
 *
 * The engine uses this whenever a metric has both a current value
 * and a per-platform rolling average. When rolling average is null
 * (e.g. first scan, sparse history), this returns null and callers
 * should omit the anchor entirely rather than substitute a placeholder.
 *
 * Bucketing (against ratio = currentValue / rollingAverage):
 *   ratio < 0.7              -> "lower than typical"
 *   0.7 <= ratio <= 1.3      -> "typical"
 *   1.3 < ratio <= 2.0       -> "higher than typical"
 *   ratio > 2.0              -> "Nx your typical" (1-decimal multiplier)
 *
 * Buckets and labels are customizable via the options object for
 * cases where the host metric needs different wording.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

export interface ComparativeAnchorOptions {
  lowerLabel?: string;
  typicalLabel?: string;
  higherLabel?: string;
}

const DEFAULT_LOWER = 'lower than typical';
const DEFAULT_TYPICAL = 'typical';
const DEFAULT_HIGHER = 'higher than typical';

export function getComparativeAnchor(
  currentValue: number,
  rollingAverage: number | null,
  options: ComparativeAnchorOptions = {},
): string | null {
  // No history to anchor against.
  if (rollingAverage === null) return null;

  // Defensive: NaN, Infinity, or other non-finite inputs produce no anchor.
  if (!Number.isFinite(currentValue) || !Number.isFinite(rollingAverage)) {
    return null;
  }

  // Zero rolling average means the metric has never appeared. Ratio
  // would be Infinity or NaN. No meaningful anchor; caller omits.
  if (rollingAverage === 0) return null;

  const lower = options.lowerLabel ?? DEFAULT_LOWER;
  const typical = options.typicalLabel ?? DEFAULT_TYPICAL;
  const higher = options.higherLabel ?? DEFAULT_HIGHER;

  const ratio = currentValue / rollingAverage;

  if (ratio < 0.7) return lower;
  if (ratio <= 1.3) return typical;
  if (ratio <= 2.0) return higher;

  // Much-higher bucket: surface the multiplier itself with one decimal.
  const multiplier = Math.round(ratio * 10) / 10;
  return `${multiplier}× your typical`;
}
