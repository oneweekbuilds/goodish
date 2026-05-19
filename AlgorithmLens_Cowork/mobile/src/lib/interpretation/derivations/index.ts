/**
 * Barrel export for cross-scan derivations.
 *
 * Each derivation is a pure function that takes scans[] (and sometimes
 * additional context) and produces a structured aggregation used by
 * the interpretation engine orchestrator.
 *
 * Future derivations beyond rollingAverage are listed in the scoping
 * doc at mobile/audits/2x-interpretation-engine-scoping/decisions.md.
 */

export {
  computeRollingAverage,
  computeMetricTrajectory,
  type RollingAverageOptions,
  type TrajectoryEntry,
} from './rollingAverage';
