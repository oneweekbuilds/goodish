/**
 * interpretationEngine: the 2.x interpretation orchestrator.
 *
 * Public entry point:
 *
 *   interpretScan(context: InterpretationContext, surface: EngineSurface)
 *     -> InterpretationResult
 *
 * The orchestrator dispatches to a surface-specific template registry,
 * iterates that registry in descending priority order, and returns the
 * first template whose `when` predicate matches the context.
 *
 * Each surface's registry MUST include a calm-case template with
 * `when: () => true` as a catch-all — this is what makes
 * `selectTemplate` total (always returns a result). The thrown
 * invariant at the bottom of `selectTemplate` would only fire if a
 * registry was modified to drop its calm-case template; in that case
 * we want a loud bug rather than a silent empty render.
 *
 * Surface coverage:
 *   - 'results'           — functional (Results screen, Phase 3.1+).
 *   - 'dashboard.overview' — functional (Dashboard Overview tab, Phase 5.1.3).
 *   - 'dashboard.sources' | 'dashboard.ads' | 'dashboard.politics'
 *     | 'dashboard.tone'  | 'dashboard.suggested'
 *     — throw "not yet implemented" with the specific surface name.
 *     Failing loudly is preferable to silently producing wrong output
 *     for surfaces that haven't had their templates authored yet.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md,
 *            mobile/audits/2x-dashboard-design/decisions.md
 */

import type {
  InterpretationContext,
  InterpretationResult,
} from './interpretation-types';
import {
  DASHBOARD_OVERVIEW_TEMPLATES,
  RESULTS_TEMPLATES,
  type ResultsTemplate,
} from './templates';

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
  switch (surface) {
    case 'results':
      return selectTemplate(RESULTS_TEMPLATES, context);
    case 'dashboard.overview':
      return selectTemplate(DASHBOARD_OVERVIEW_TEMPLATES, context);
    case 'dashboard.sources':
    case 'dashboard.ads':
    case 'dashboard.politics':
    case 'dashboard.tone':
    case 'dashboard.suggested':
      throw new Error(`surface ${surface} not yet implemented`);
  }
}

/**
 * Shared template-selection logic. Sorts a copy of the registry by
 * descending priority and returns the first matching template's
 * render output. The invariant at the bottom is unreachable as long
 * as each registry includes a calm-case template with
 * `when: () => true` — see file header.
 */
function selectTemplate(
  templates: ResultsTemplate[],
  context: InterpretationContext,
): InterpretationResult {
  const ordered = [...templates].sort((a, b) => b.priority - a.priority);
  for (const template of ordered) {
    if (template.when(context)) {
      return template.render(context);
    }
  }
  throw new Error(
    'selectTemplate: no template matched. The calm-case template for this surface should always match — this indicates a bug in template registration.',
  );
}
