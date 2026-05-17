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
 * returned.
 *
 * Phase 4.5.2.2 introduced the calm-case template (`results.calm_case`,
 * priority 10) with a `when: () => true` predicate, so for the 'results'
 * surface at least one template ALWAYS matches. The orchestrator's
 * "no template fired" branch is now a thrown invariant — if it ever
 * fires that's a bug in template registration, not a runtime case
 * to handle.
 *
 * Surface coverage:
 *   - 'results' — functional (two templates: concentrated feed,
 *     calm case catch-all).
 *   - All other surfaces — throw "not yet implemented". Failing loudly
 *     is preferable to silently producing wrong output for surfaces
 *     that haven't had their templates authored yet.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type {
  InterpretationContext,
  InterpretationResult,
} from './interpretation-types';
import { RESULTS_TEMPLATES } from './templates';

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

  // Invariant: the calm-case template's `when: () => true` should
  // always match. Reaching here means the registry was modified to
  // drop calm-case or a template's `when` threw. Either way: bug.
  throw new Error(
    'interpretScan: no template matched for surface=results. The calm-case template should match any context — this indicates a bug in template registration.',
  );
}
