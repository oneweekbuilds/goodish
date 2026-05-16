/**
 * interpretationEngine: the 2.x interpretation orchestrator.
 *
 * Public entry point:
 *
 *   interpretScan(context: InterpretationContext, surface: EngineSurface)
 *     -> InterpretationResult
 *
 * The orchestrator iterates the surface's template registry in
 * descending priority order. The first template whose `when` predicate
 * returns true gets its `render` function called and its result
 * returned. If no template matches, a default calm-case result is
 * produced inline (this will graduate to its own template in a later
 * phase, once there are enough specific templates for the calm case
 * to read as the explicit "nothing notable" branch rather than as
 * orchestrator fallback).
 *
 * Surface coverage:
 *   - 'results' — functional in Phase 3.2 (one template: concentrated feed).
 *   - All other surfaces — throw "not yet implemented". Failing loudly
 *     is preferable to silently producing wrong output for surfaces
 *     that haven't had their templates authored yet.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type {
  InterpretationContext,
  InterpretationResult,
  Subline,
} from './interpretation-types';
import { RESULTS_TEMPLATES } from './templates';
import { capitalizePlatform } from './utils/platformDisplay';

export type EngineSurface =
  | 'results'
  | 'dashboard.overview'
  | 'dashboard.sources'
  | 'dashboard.ads'
  | 'dashboard.politics'
  | 'dashboard.tone'
  | 'dashboard.suggested';

export function interpretScan(
  context: InterpretationContext,
  surface: EngineSurface,
): InterpretationResult {
  if (surface !== 'results') {
    throw new Error(`surface ${surface} not yet implemented`);
  }

  // Iterate templates in descending priority. Sorting a copy keeps
  // the registry order stable for callers who inspect RESULTS_TEMPLATES
  // directly.
  const ordered = [...RESULTS_TEMPLATES].sort(
    (a, b) => b.priority - a.priority,
  );
  for (const template of ordered) {
    if (template.when(context)) {
      return template.render(context);
    }
  }

  return buildCalmCaseResult(context);
}

/**
 * Default result when no template matches.
 *
 * Phase 3.2 ships this inline. A future phase will replace it with a
 * proper calm-case template that has its own priority slot. The
 * placeholder OBSERVED text ("Nothing notable changed in this scan.")
 * is intentionally generic; it'll get authored once we have enough
 * specific templates to write a calm-case voice that doesn't repeat
 * verbatim across scans (see Risk 7 in the scoping doc).
 */
function buildCalmCaseResult(
  context: InterpretationContext,
): InterpretationResult {
  const { activeScan, platform } = context;
  const platformLabel = capitalizePlatform(platform);
  const sublines: Subline[] = [
    {
      mode: 'OBSERVED',
      text: 'Nothing notable changed in this scan.',
    },
  ];
  return {
    verdict: `Your ${platformLabel} feed is in its usual shape.`,
    sublines,
    supportingRows: [],
    findingDot: false,
    meta: {
      surface: 'results',
      scanId: activeScan.scan_id ?? activeScan.id,
    },
  };
}
