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
 * Surface coverage (all surfaces functional as of Phase 6.5.3):
 *   - 'results'             — Results screen (Phase 3.1+).
 *   - 'dashboard.overview'  — Dashboard Overview tab (Phase 5.1.3).
 *   - 'dashboard.sources'   — Dashboard Sources tab (Phase 6.1.3).
 *   - 'dashboard.ads'       — Dashboard Ads tab (Phase 6.2.3).
 *   - 'dashboard.tone'      — Dashboard Tone tab (Phase 6.3.3).
 *   - 'dashboard.politics'  — Dashboard Politics tab (Phase 6.4.3).
 *   - 'dashboard.suggested' — Dashboard Suggested vs Followed tab
 *                             (Phase 6.5.3).
 *
 * The throw-on-unimplemented-surface branch was removed in Phase
 * 6.5.3 — every surface in EngineSurface now has a template registry.
 * TypeScript's exhaustiveness check on the switch enforces that any
 * future surface added to EngineSurface MUST have a case here (the
 * implicit "no default" branch becomes a compile error if it doesn't).
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md,
 *            mobile/audits/2x-dashboard-design/decisions.md
 */

import type {
  InterpretationContext,
  InterpretationResult,
} from './interpretation-types';
import {
  DASHBOARD_ADS_TEMPLATES,
  DASHBOARD_OVERVIEW_TEMPLATES,
  DASHBOARD_POLITICS_TEMPLATES,
  DASHBOARD_SOURCES_TEMPLATES,
  DASHBOARD_SUGGESTED_TEMPLATES,
  DASHBOARD_TONE_TEMPLATES,
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
      return selectTemplate(DASHBOARD_SOURCES_TEMPLATES, context);
    case 'dashboard.ads':
      return selectTemplate(DASHBOARD_ADS_TEMPLATES, context);
    case 'dashboard.tone':
      return selectTemplate(DASHBOARD_TONE_TEMPLATES, context);
    case 'dashboard.politics':
      return selectTemplate(DASHBOARD_POLITICS_TEMPLATES, context);
    case 'dashboard.suggested':
      return selectTemplate(DASHBOARD_SUGGESTED_TEMPLATES, context);
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
