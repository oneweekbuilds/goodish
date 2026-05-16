/**
 * rollingAverage: per-platform, per-metric running average derivation.
 *
 * Phase 1 of MVP implementation. This derivation is not yet
 * implemented. The full design lives in
 * mobile/audits/2x-interpretation-engine-scoping/decisions.md.
 *
 * When implemented, the public entry point will be:
 *
 *   computeRollingAverage(scans, platform, metric, windowSize): number | null
 *
 * Returns null when there's insufficient history (below windowSize) so
 * that callers can gate trajectory claims behind sample size.
 *
 * Implementation deferred to subsequent phases.
 */

import type { ScanDetail } from '../../../hooks/useDashboard';

export function computeRollingAverage(
  _scans: ScanDetail[],
  _platform: string,
  _metric: string,
  _windowSize: number,
): number | null {
  throw new Error('computeRollingAverage: not yet implemented (Phase 1 stub)');
}
