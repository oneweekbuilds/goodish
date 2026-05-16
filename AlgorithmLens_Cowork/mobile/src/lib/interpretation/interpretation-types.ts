/**
 * interpretation-types: shared types for the 2.x interpretation engine.
 *
 * Phase 1 of MVP implementation. The engine itself is not yet
 * functional; these are the structural types it will produce and
 * consume.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type { ScanDetail } from '../../hooks/useDashboard';
import type { DashboardData } from '../computeDashboardData';

// Sub-line modes from the 2.x design specs.
export type SublineMode = 'OBSERVED' | 'LIKELY' | 'COACHING' | 'QUESTION';

// Metric keys for cross-scan derivations. Each maps to a per-scan
// extraction strategy (see derivations/rollingAverage.ts). Ad and
// suggested percentages come from top-level scan fields; the rest are
// derived from raw_data (posts, analysis.feed_items, etc.).
export type MetricKey =
  | 'ad_pct'
  | 'political_pct'
  | 'top_creator_share'
  | 'tone_negative_pct'
  | 'tone_positive_pct'
  | 'tone_neutral_pct'
  | 'suggested_pct';

export interface Subline {
  mode: SublineMode;
  text: string;
}

// Supporting-card row variants from the Dashboard design spec.
export type SupportingRowVariant =
  | 'fact'
  | 'creator'
  | 'trajectory'
  | 'bar'
  | 'caveat'
  | 'methodology';

// Standard fact row (the 1.1.x supporting-card pattern). Anchor is the
// comparative phrase like "typical" or "2.2x your typical".
export interface FactRow {
  variant: 'fact';
  label: string;
  value: string;
  anchor?: string;
}

// Creator row with handle, post count, and optional history anchor
// like "in 5 of last 6 scans" or "first appeared scan 5".
export interface CreatorRow {
  variant: 'creator';
  handle: string;
  posts: number;
  historyAnchor?: string;
}

// Inline sparkline row for cross-scan metric trajectory. values is the
// per-scan time series (typically 6 points). current is the latest
// value, highlighted in the sparkline.
export interface TrajectoryRow {
  variant: 'trajectory';
  label: string;
  values: number[];
  current: number;
  unit?: string;
}

// Segmented bar row for distributions (tone breakdown, ideology lean).
// Each segment has a label, a numeric value, and an optional tone hint
// the UI uses to pick its color (leading = brand-blue, neutral = gray,
// positive = brand-accent green).
export interface BarRow {
  variant: 'bar';
  label: string;
  segments: Array<{
    label: string;
    value: number;
    tone?: 'leading' | 'neutral' | 'positive';
  }>;
}

// Caution-tinted methodology warning attached to a row.
export interface CaveatNote {
  variant: 'caveat';
  text: string;
}

// Disclosure-style row pinned to card bottom. detailRef is an optional
// identifier the UI layer maps to a navigation target (e.g., the
// "About this measurement" route).
export interface MethodologyRow {
  variant: 'methodology';
  text: string;
  detailRef?: string;
}

export type SupportingRow =
  | FactRow
  | CreatorRow
  | TrajectoryRow
  | BarRow
  | CaveatNote
  | MethodologyRow;

// The engine's output for one surface (Results, Overview, etc.).
// findingDot is the boolean used by Dashboard's tab strip to show a
// brand-blue dot next to tabs with strong findings.
// meta is null for surfaces that don't carry per-scan metadata in the
// header chrome.
export interface InterpretationResult {
  verdict: string;
  sublines: Subline[];
  supportingRows: SupportingRow[];
  findingDot: boolean;
  meta: { surface: string; scanId: string } | null;
}

// The input context passed to the orchestrator. Includes the active
// scan (the scan being interpreted), the full scan history (for
// cross-scan derivations), the pre-computed DashboardData (intra-scan
// metrics), and the platform.
export interface InterpretationContext {
  activeScan: ScanDetail;
  scans: ScanDetail[];
  dashboardData: DashboardData;
  platform: string;
}
