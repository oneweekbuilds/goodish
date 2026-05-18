/**
 * SublineRow + sublineGapTop: shared rendering helpers for the
 * interpretation engine's sub-line zone.
 *
 * The engine emits sublines as `{ mode: SublineMode, text: string }`
 * objects. Each consumer (Results screen, Dashboard Overview tab,
 * future Dashboard tabs) iterates the array and renders each entry
 * via the matching design-system primitive: filled brand-blue square
 * for OBSERVED, hollow tertiary-gray ring for LIKELY. COACHING and
 * QUESTION modes are reserved for Phase 5+ supporting-primitive work
 * and fall through to a console.warn with the offending mode.
 *
 * The adaptive vertical rhythm BETWEEN sublines is the parent
 * layout's responsibility, per the 2.x Results design spec
 * (mobile/audits/2x-results-design/decisions.md). `sublineGapTop`
 * computes the marginTop for each subline based on the previous
 * subline's mode:
 *
 *   12px — same mode → same mode
 *   22px — crossing modes (e.g. OBSERVED → LIKELY)
 *   24px — before a QUESTION (the most distinct mode)
 *
 * Extracted to this module in Phase 5.1.4 when the Dashboard Overview
 * tab became the second consumer. Previously inlined in
 * app/analysis/[sessionId].tsx.
 */

import React from 'react';
import { View } from 'react-native';
import {
  LikelySubline,
  ObservedSubline,
} from '../../design-system';
import type {
  Subline,
  SublineMode,
} from '../../lib/interpretation/interpretation-types';

/** Surface name passed to the COACHING/QUESTION warn so unimplemented
 *  modes are easy to trace to the right engine surface. Phase 6 adds
 *  the remaining Dashboard tabs as they wire up. */
export type SublineRowSurface =
  | 'Results'
  | 'Dashboard Overview'
  | 'Dashboard Sources'
  | 'Dashboard Ads'
  | 'Dashboard Politics'
  | 'Dashboard Tone'
  | 'Dashboard Suggested';

export interface SublineRowProps {
  subline: Subline;
  marginTop: number;
  /** Surface name for the console.warn on COACHING/QUESTION. */
  surface: SublineRowSurface;
}

export function SublineRow({ subline, marginTop, surface }: SublineRowProps) {
  if (subline.mode === 'OBSERVED') {
    return (
      <View style={{ marginTop }}>
        <ObservedSubline>{subline.text}</ObservedSubline>
      </View>
    );
  }
  if (subline.mode === 'LIKELY') {
    return (
      <View style={{ marginTop }}>
        <LikelySubline>{subline.text}</LikelySubline>
      </View>
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[2x] subline mode not yet implemented on ${surface}: ${subline.mode}`,
  );
  return null;
}

/**
 * Adaptive vertical rhythm between sublines, per the 2.x Results
 * design spec. The first subline has no top margin.
 */
export function sublineGapTop(
  prevMode: SublineMode | undefined,
  currentMode: SublineMode,
): number {
  if (!prevMode) return 0;
  if (currentMode === 'QUESTION') return 24;
  if (prevMode === currentMode) return 12;
  return 22;
}
