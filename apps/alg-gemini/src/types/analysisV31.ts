/**
 * Accuracy Architecture v3.1 (HPA + CMA) analysis schema types.
 *
 * Phase 5B NOTE:
 * - These types are scaffolding only.
 * - They are not yet wired into any live API responses.
 * - Fields are intentionally optional / nullable where needed so the
 *   backend can adopt them incrementally without breaking the UI.
 */

// ---------------------------------------------------------------------------
// Core enums and small value objects
// ---------------------------------------------------------------------------

export type ClaimStatus = 'FINAL' | 'PRELIMINARY' | 'ABSTAIN';
export type ConfidenceBand = 'LOW' | 'MED' | 'HIGH';
export type EstimateType = 'POINT' | 'INTERVAL' | 'QUALITATIVE';

export interface UncertaintyInterval {
  lower: number;
  upper: number;
  confidence_level?: number; // e.g. 0.95 for 95% CI
}

export interface CoverageSummary {
  items_supporting?: number | null;
  items_analyzed?: number | null;
  items_excluded?: number | null;
  coverage_pct?: number | null;
}

export interface ThresholdGate {
  gate_name: string;
  required_value?: number | null;
  actual_value?: number | null;
  passed?: boolean | null;
}

export interface MethodReliability {
  method?: string | null;
  base_reliability?: number | null;
  platform_modifier?: number | null;
  effective_reliability?: number | null;
  reliability_source?: string | null;
}

export type ConflictResolutionType = 'PRECEDENCE' | 'MAJORITY' | 'ABSTAIN' | 'MANUAL';

export interface ConflictResolution {
  resolution_type?: ConflictResolutionType | null;
  winning_evidence_id?: string | null;
  resolution_rationale?: string | null;
  confidence_penalty?: number | null;
}

// ---------------------------------------------------------------------------
// Global metadata & audit trail
// ---------------------------------------------------------------------------

export interface TimeSpan {
  start?: string | null; // ISO 8601
  end?: string | null; // ISO 8601
  duration_seconds?: number | null;
}

export interface CoverageBlock {
  n_covered?: number | null;
  n_excluded?: number | null;
  n_total?: number | null;
  coverage_pct?: number | null;
  exclusion_reasons?: Record<string, number>;
}

export interface LanguageInfo {
  primary?: string | null;
  confidence?: number | null;
  secondary_languages?: string[];
}

export interface GlobalMetadata {
  // Identity / versioning
  scan_id?: string | null;
  schema_version?: string | null; // e.g. "3.1.0"

  // Source characteristics
  modality?: string | null;
  platform?: string | null;

  // Sample profile
  post_count?: number | null;
  time_span?: TimeSpan | null;

  // Coverage accounting (per-field)
  coverage?: Record<string, CoverageBlock>;

  // Language detection
  language?: LanguageInfo | null;

  // Processing info
  generated_at?: string | null; // ISO timestamp
  processing_duration_ms?: number | null;
}

export interface ProcessingStage {
  stage_name: string;
  started_at?: string | null;
  completed_at?: string | null;
  items_processed?: number | null;
  items_failed?: number | null;
  notes?: string | null;
}

export interface ThresholdConfig {
  schema_version?: string | null;
  // Opaque configuration blob; concrete shape enforced server-side.
  raw_config?: Record<string, unknown>;
}

export interface AbstentionSummary {
  total_possible_insights?: number | null;
  insights_generated?: number | null;
  insights_abstained?: number | null;
  abstention_rate?: number | null;
  abstentions_by_reason?: Record<string, number>;
}

export interface AuditTrail {
  schema_version?: string | null;
  processing_stages?: ProcessingStage[];
  threshold_configuration?: ThresholdConfig | null;
  abstention_summary?: AbstentionSummary | null;
}

// ---------------------------------------------------------------------------
// Evidence & insights
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  evidence_id: string;
  source_item_index?: number | null;

  // Signal classification
  signal_type?: string | null;
  signal_subtype?: string | null;

  // Detection details
  detection_method?: string | null;
  detection_confidence?: number | null;
  method_reliability?: MethodReliability | null;
  effective_confidence?: number | null;
  detection_rationale?: string | null;

  // Evidence content
  text_snippet?: string | null;
  snippet_context?: string | null;
  pattern_matched?: string | null;
  pattern_category?: string | null;

  // Conflict tracking
  conflicts_with?: string[];
  conflict_resolution?: ConflictResolution | null;
}

export interface Insight {
  // Identity
  insight_id: string;
  claim_type: string;

  // Claim content
  claim_text?: string | null;
  claim_status?: ClaimStatus;
  claim_phrasing?: string | null;

  // Confidence
  confidence_band?: ConfidenceBand | null;
  numeric_confidence?: number | null;
  confidence_rationale?: string | null;

  // Estimate & uncertainty
  estimate_type?: EstimateType | null;
  point_estimate?: number | null;
  uncertainty_interval?: UncertaintyInterval | null;
  interval_width_acceptable?: boolean | null;

  // Evidence & coverage
  evidence_ids: string[];
  evidence_summary?: string | null;
  coverage_summary?: CoverageSummary | null;
  aggregate_method_reliability?: number | null;

  // Abstention / preliminary status
  abstention_flag?: boolean;
  abstention_reason?: string | null;
  abstention_message?: string | null;
  preliminary_upgrade_path?: string | null;

  // Audit hooks
  generation_method?: string | null;
  threshold_gates?: ThresholdGate[];
  correctness_definition_ref?: string | null;
}

export interface DataSufficiency {
  minimum_items_required?: number | null;
  items_available?: number | null;
  is_sufficient?: boolean | null;
  insufficiency_reason?: string | null;
}

export type TabStatus = 'READY' | 'PARTIAL' | 'ABSTAINED' | 'ERROR';

export interface TabResult {
  tab_name: string;
  status?: TabStatus;
  insights: Insight[];
  data_sufficiency?: DataSufficiency | null;
  limits_summary?: string[];
}

export interface AnalysisResultV31 {
  meta: GlobalMetadata;
  tabs: Record<string, TabResult>;
  audit_trail?: AuditTrail | null;
}

// ---------------------------------------------------------------------------
// Lightweight runtime type guard
// ---------------------------------------------------------------------------

/**
 * Very lightweight runtime checker to see if a value "looks like"
 * an AnalysisResultV31 object. This is intentionally shallow and
 * non-throwing so it can be used at API boundaries without pulling
 * in any validation libraries.
 */
export function isAnalysisResultV31(value: unknown): value is AnalysisResultV31 {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Partial<AnalysisResultV31>;
  if (!obj.meta || typeof obj.meta !== 'object') return false;
  if (!obj.tabs || typeof obj.tabs !== 'object') return false;

  // Check that each tab has a tab_name and insights array (shallow check)
  for (const key of Object.keys(obj.tabs)) {
    const tab = (obj.tabs as Record<string, unknown>)[key] as Partial<TabResult> | undefined;
    if (!tab) continue;
    if (typeof tab.tab_name !== 'string') return false;
    if (!Array.isArray(tab.insights)) return false;
  }

  return true;
}


