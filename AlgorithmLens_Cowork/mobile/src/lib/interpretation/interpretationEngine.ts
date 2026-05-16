/**
 * interpretationEngine: the 2.x interpretation orchestrator.
 *
 * Phase 1 of MVP implementation. This module is not yet functional.
 * The full design lives in
 * mobile/audits/2x-interpretation-engine-scoping/decisions.md.
 *
 * When implemented, the public entry point will be:
 *
 *   interpretScan(context: InterpretationContext): InterpretationResult
 *
 * The orchestrator selects templates based on data shape (cross-scan
 * aggregates, single-scan thresholds) and emits a structured
 * InterpretationResult with verdict, sub-lines, and supporting rows.
 *
 * Implementation deferred to subsequent phases.
 */

import type {
  InterpretationContext,
  InterpretationResult,
} from './interpretation-types';

export function interpretScan(_context: InterpretationContext): InterpretationResult {
  throw new Error('interpretScan: not yet implemented (Phase 1 stub)');
}
