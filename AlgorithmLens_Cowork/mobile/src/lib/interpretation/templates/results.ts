/**
 * Results screen interpretation templates.
 *
 * Phase 1 of MVP implementation. No templates are defined yet.
 *
 * Each template is a TypeScript-data definition with the shape:
 *
 *   {
 *     when: (ctx: InterpretationContext) => boolean,
 *     verdict: string,
 *     observed: string,
 *     likely: string,
 *     coaching?: string,
 *     question?: string,
 *   }
 *
 * The interpretation engine evaluates `when` predicates in priority
 * order and picks the first match. A default calm-case template fires
 * when nothing else applies.
 */

import type { InterpretationContext } from '../interpretation-types';

export interface ResultsTemplate {
  when: (ctx: InterpretationContext) => boolean;
  verdict: string;
  observed: string;
  likely: string;
  coaching?: string;
  question?: string;
}

export const RESULTS_TEMPLATES: ResultsTemplate[] = [
  // Templates defined in subsequent phases.
];
