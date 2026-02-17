/**
 * Evidence Bundle Types for Ads & Influence Tab
 *
 * The Evidence Bundle is the single source of truth for all analysis copy
 * and Talk-to-Algorithm responses. All types here mirror the backend structure.
 *
 * Accuracy v2.0: Includes Commercial Exposure Spectrum with confidence-gated data.
 */

// Quality enum matching backend
// v3.0: Added 'not_applicable' and 'insufficient_signal' for promotion_topics
export type QualityFlag = 'ok' | 'low_sample' | 'missing_fields' | 'model_low_confidence' | 'not_applicable' | 'insufficient_signal';

// Commercial confidence levels
export type CommercialConfidence = 'high' | 'medium' | 'low';

// Meta section
export interface EvidenceBundleMeta {
  scan_id: string | null;
  platform: string | null;
  n_items: number;
  window_start: string | null;
  window_end: string | null;
  generated_at: string;
}

// =============================================================================
// Commercial Exposure Spectrum (View A) - The Primary Metric
// =============================================================================

export interface CommercialStackedBar {
  non_commercial: number;
  labeled_ads: number;
  unlabeled_promotion: number;
  total: number;
}

export interface CommercialExcluded {
  unlabeled_promotion_medium_confidence: number;
  ambiguous: number;
}

export interface CommercialExposureSpectrum {
  stacked_bar: CommercialStackedBar;
  excluded: CommercialExcluded;
  total_items: number;
  high_confidence_items: number;
  coverage_percent: number;
}

// =============================================================================
// Company/Brand info (View C) - renamed from Brand to Company per spec
// =============================================================================

export interface CompanyInfo {
  name: string;
  count: number;
  high_confidence: number;
}

// Backward compatibility alias
export type BrandInfo = CompanyInfo;

// Advertiser info (legacy, backward compatible)
export interface AdvertiserInfo {
  name: string;
  count: number;
}

// =============================================================================
// Observations section (hard facts only)
// =============================================================================

export interface EvidenceBundleObservations {
  total_posts_seen: number;
  total_ads_detected: number;
  ad_rate_percent: number | null;

  // Commercial Exposure Spectrum (v3.0)
  commercial_exposure_spectrum?: CommercialExposureSpectrum;
  unlabeled_promotions_high_confidence?: number;
  total_promotional_content?: number;
  promotional_rate_percent?: number | null;

  // Companies (v3.0 - renamed from brands)
  top_companies?: CompanyInfo[];
  unique_companies_surfaced?: number;
  top_companies_note?: string;

  // Legacy brands (backward compat)
  top_brands?: BrandInfo[];
  unique_brands_count?: number;
  long_tail_brands_count?: number;

  // OCR metrics
  ocr_extraction_rate_percent?: number;
  items_with_ocr_text?: number;
  ads_detected_via_ocr?: number;

  // Legacy advertiser data
  top_advertisers?: AdvertiserInfo[];
  repeated_advertisers_count?: number;
  top1_advertiser_share_percent?: number;
  top3_advertiser_share_percent?: number;
  unique_advertisers_count?: number;
}

// =============================================================================
// Promotion Topics (View B)
// =============================================================================

export interface PromotionTopic {
  topic: string;
  count: number;
  high_confidence_count: number;
}

export interface UnlabeledPromotionsValue {
  high_confidence: number;
  medium_confidence: number;
  ambiguous: number;
}

// =============================================================================
// Measurements section (classifier-based estimates)
// =============================================================================

export interface MeasurementValue {
  value: number | string[] | Array<{ category: string; count: number }> | PromotionTopic[] | UnlabeledPromotionsValue;
  method: string;
  quality: QualityFlag;
  notes: string | null;
  threshold_rule?: string;
  detected_but_excluded_count?: number;
}

export interface EvidenceBundleMeasurements {
  // Commercial classification (v2.0)
  unlabeled_promotions?: MeasurementValue;
  promotion_topics?: MeasurementValue;
  promotion_topics_excluded?: MeasurementValue;

  // Legacy (backward compatible)
  possible_unlabeled_promotions?: MeasurementValue;
  possible_promo_rate_percent?: MeasurementValue;
  ad_product_categories?: MeasurementValue;
}

// =============================================================================
// Limits section (what we cannot know)
// =============================================================================

export interface EvidenceBundleLimits {
  sample_size_limitations: string[];
  missing_metadata_limitations: string[];
  ad_detection_limitations: string[];
  ocr_extraction_limitations: string[];
  epistemic_boundaries: string[];

  // Commercial analysis exclusions (v2.0)
  commercial_analysis_exclusions?: string[];
  threshold_exclusions?: string[];
}

// Full Evidence Bundle
export interface AdsEvidenceBundle {
  meta: EvidenceBundleMeta;
  observations: EvidenceBundleObservations;
  measurements: EvidenceBundleMeasurements;
  limits: EvidenceBundleLimits;
}

// =============================================================================
// Analysis copy generated from bundle
// =============================================================================

export interface AnalysisCopyItem {
  text: string;
  cited_fields: string[];
  quality: 'ok' | 'insufficient_data';
}

export interface AdsAnalysisCopy {
  primary_insight?: AnalysisCopyItem;
  concentration_insight?: AnalysisCopyItem;
  topic_insight?: AnalysisCopyItem;
  unlabeled_promo_insight?: AnalysisCopyItem;
  limitations_summary?: AnalysisCopyItem;
}

// =============================================================================
// Talk response structure
// =============================================================================

export interface TalkHypothesis {
  label: string;
  text: string;
}

export interface TalkResponseSection {
  intro: string;
  facts?: string[];
  hypotheses?: TalkHypothesis[];
  limits?: string[];
  actions?: string[];
  cited_fields?: string[];
}

export interface TalkStructuredResponse {
  what_we_observed: TalkResponseSection;
  what_it_might_mean: TalkResponseSection;
  what_we_cannot_know: TalkResponseSection;
  what_you_can_try: TalkResponseSection;
}

// =============================================================================
// API response types
// =============================================================================

export interface AdsEvidenceBundleResponse {
  scan_id: string;
  tab: 'ads';
  bundle: AdsEvidenceBundle;
  analysis: AdsAnalysisCopy;
  _debug?: {
    raw_bundle: AdsEvidenceBundle;
    scan_metadata: Record<string, unknown>;
    aggregates: Record<string, unknown>;
    feed_items_count: number;
  };
}

export interface TalkResponse {
  scan_id: string;
  tab: 'ads' | 'politics';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}

// =============================================================================
// Politics & Worldview Evidence Bundle Types
// =============================================================================

// Political classification types
export type PoliticsClass = 'non_political' | 'political' | 'ambiguous';
export type PoliticsConfidence = 'high' | 'medium' | 'low';
export type PoliticsSubtopic =
  | 'elections'
  | 'policy'
  | 'geopolitics'
  | 'culture_war'
  | 'activism'
  | 'economy'
  | 'crime_security'
  | 'climate_energy'
  | 'health_science'
  | 'other';

// Political Content Spectrum
export interface PoliticalStackedBar {
  non_political: number;
  political: number;
  total: number;
}

export interface PoliticalExcluded {
  ambiguous: number;
  medium_confidence: number;
}

export interface PoliticalContentSpectrum {
  stacked_bar: PoliticalStackedBar;
  excluded: PoliticalExcluded;
  total_items: number;
  high_confidence_items: number;
  coverage_percent: number;
}

// Political topic types
export interface PoliticalTopic {
  topic: PoliticsSubtopic;
  count: number;
  high_confidence_count: number;
  confidence_breakdown?: {
    high: number;
    medium: number;
    low: number;
  };
}

// =============================================================================
// Politics Observations section
// =============================================================================

export interface PoliticsEvidenceBundleObservations {
  total_posts_seen: number;
  political_content_spectrum?: PoliticalContentSpectrum;
  political_items_high_confidence?: number;
  political_rate_percent?: number | null;
  non_political_items_high_confidence?: number;
}

// =============================================================================
// Politics Measurements section
// =============================================================================

export interface PoliticsMeasurementValue {
  value: string[] | PoliticalTopic[] | null;
  method: string;
  quality: QualityFlag;
  notes: string | null;
  threshold_rule?: string;
  detected_but_excluded_count?: number;
  _full_breakdown?: PoliticalTopic[];
}

export interface PoliticsEvidenceBundleMeasurements {
  political_topic_mix?: PoliticsMeasurementValue;
  political_valence?: PoliticsMeasurementValue;
  political_topics_excluded?: PoliticsMeasurementValue;
}

// =============================================================================
// Politics Limits section
// =============================================================================

export interface PoliticsEvidenceBundleLimits {
  sample_size_limitations: string[];
  classification_limitations: string[];
  epistemic_boundaries: string[];
  threshold_exclusions?: string[];
  data_quality_warnings?: string[];
}

// =============================================================================
// Politics Evidence Bundle
// =============================================================================

export interface PoliticsEvidenceBundle {
  meta: EvidenceBundleMeta;
  observations: PoliticsEvidenceBundleObservations;
  measurements: PoliticsEvidenceBundleMeasurements;
  limits: PoliticsEvidenceBundleLimits;
}

// =============================================================================
// Politics Analysis copy
// =============================================================================

export interface PoliticsAnalysisCopy {
  primary_insight?: AnalysisCopyItem;
  topic_insight?: AnalysisCopyItem;
  limitations_summary?: AnalysisCopyItem;
}

// =============================================================================
// Politics API response types
// =============================================================================

export interface PoliticsEvidenceBundleResponse {
  scan_id: string;
  tab: 'politics';
  bundle: PoliticsEvidenceBundle;
  analysis: PoliticsAnalysisCopy;
  _debug?: {
    raw_bundle: PoliticsEvidenceBundle;
    scan_metadata: Record<string, unknown>;
    aggregates: Record<string, unknown>;
    feed_items_count: number;
  };
}

export interface PoliticsTalkResponse {
  scan_id: string;
  tab: 'politics';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}

// =============================================================================
// Patterns in Your Feed Evidence Bundle Types
// =============================================================================

// Feed Structure Overview
export interface FeedStructureOverview {
  total_posts_seen: number;
  window_start: string | null;
  window_end: string | null;
  scan_source_type: string | null;
  platform: string | null;
}

// Repetition Summary
export interface RepeatedSignal {
  type: string;
  occurrences: number;
  signal?: string;
}

export interface RepetitionSummary {
  items_in_repetition_clusters: number;
  total_items: number;
  largest_cluster_size: number;
  repetition_rate_percent: number | null;
  quality: string;
  detection_methods_used: string[];
  top_repeated_signals: RepeatedSignal[];
  rate_note?: string;
  cluster_detected: boolean;
  cluster_note: string;
}

// Topic Diversity Summary
export interface TopicEntry {
  topic: string;
  count: number;
  percent?: number;
}

export interface TopicDiversitySummary {
  unique_topics_count: number;
  labeled_items: number;
  total_items: number;
  coverage_percent: number;
  quality: string;
  top_topics: TopicEntry[];
  topic_concentration_top1_percent: number | null;
  topic_concentration_top3_percent: number | null;
  simpson_diversity_index: number | null;
  diversity_interpretation?: string;
  concentration_note?: string;
  notes?: string;
}

// Format Mix Summary
export interface FormatMixSummary {
  format_counts?: Record<string, number>;
  total_items: number;
  quality: string;
  note?: string;
}

// Feed Skew Flag
export interface FeedSkewFlag {
  flag: string;
  triggered: boolean;
  threshold: string;
  observed_value: number | null;
  quality: string;
}

// =============================================================================
// Patterns Observations section
// =============================================================================

export interface PatternsEvidenceBundleObservations {
  feed_structure_overview: FeedStructureOverview;
  repetition_summary: RepetitionSummary;
  topic_diversity_summary: TopicDiversitySummary;
  format_mix_summary: FormatMixSummary;
}

// =============================================================================
// Patterns Measurements section
// =============================================================================

export interface FeedSkewFlagsMeasurement {
  value: FeedSkewFlag[];
  method: string;
  quality: QualityFlag;
  notes: string;
}

export interface PatternsEvidenceBundleMeasurements {
  feed_skew_flags: FeedSkewFlagsMeasurement;
  triggered_flags_count: number;
}

// =============================================================================
// Patterns Limits section
// =============================================================================

export interface PatternsEvidenceBundleLimits {
  sample_size_limitations: string[];
  missing_metadata_limitations: string[];
  epistemic_boundaries: string[];
  threshold_exclusions?: string[];
  data_quality_warnings?: string[];
}

// =============================================================================
// Patterns Evidence Bundle
// =============================================================================

export interface PatternsEvidenceBundle {
  meta: EvidenceBundleMeta;
  observations: PatternsEvidenceBundleObservations;
  measurements: PatternsEvidenceBundleMeasurements;
  limits: PatternsEvidenceBundleLimits;
}

// =============================================================================
// Patterns Analysis copy
// =============================================================================

export interface PatternsAnalysisCopy {
  primary_insight?: AnalysisCopyItem;
  repetition_insight?: AnalysisCopyItem;
  topic_insight?: AnalysisCopyItem;
  flags_insight?: AnalysisCopyItem;
  limitations_summary?: AnalysisCopyItem;
}

// =============================================================================
// Patterns API response types
// =============================================================================

export interface PatternsEvidenceBundleResponse {
  scan_id: string;
  tab: 'patterns';
  bundle: PatternsEvidenceBundle;
  analysis: PatternsAnalysisCopy;
  _debug?: {
    raw_bundle: PatternsEvidenceBundle;
    scan_metadata: Record<string, unknown>;
    aggregates: Record<string, unknown>;
    feed_items_count: number;
  };
}

export interface PatternsTalkResponse {
  scan_id: string;
  tab: 'patterns';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}

// =============================================================================
// Creators & Voices Evidence Bundle Types
// =============================================================================

// Creator Data Coverage
export interface CreatorDataCoverage {
  total_posts_seen: number;
  items_with_creator_id_or_handle: number;
  creator_coverage_percent: number;
  coverage_quality: 'ok' | 'partial' | 'insufficient';
}

// Creator Entry (for most_frequent_creators list)
export interface CreatorEntry {
  creator: string;
  count: number;
  percent?: number; // Only if eligible
}

// Creator Concentration
export interface CreatorConcentration {
  unique_creators_count: number;
  repeated_creator_posts_count: number;
  top1_creator_share_percent?: number; // Only if eligible
  top3_creator_share_percent?: number; // Only if eligible
  most_frequent_creators: CreatorEntry[];
  share_denominator_note?: string;
  note?: string;
}

// Voice Variety Proxies
export interface VoiceVarietyProxies {
  unique_handles_count?: number;
  unique_verified_accounts_count?: number;
  unique_domains_count?: number;
  quality: 'ok' | 'partial' | 'not_applicable';
  note?: string;
}

// Creator Skew Flag
export interface CreatorSkewFlag {
  flag: string;
  triggered: boolean;
  threshold: string;
  observed_value: number | null;
  quality: 'ok' | 'not_enough_data';
}

// =============================================================================
// Creators Observations section
// =============================================================================

export interface CreatorsEvidenceBundleObservations {
  creator_data_coverage: CreatorDataCoverage;
  creator_concentration: CreatorConcentration;
  voice_variety_proxies: VoiceVarietyProxies;
}

// =============================================================================
// Creators Measurements section
// =============================================================================

export interface CreatorSkewFlagsMeasurement {
  value: CreatorSkewFlag[];
  method: string;
  quality: QualityFlag;
  notes: string;
}

export interface CreatorsEvidenceBundleMeasurements {
  creator_skew_flags: CreatorSkewFlagsMeasurement;
  triggered_flags_count: number;
}

// =============================================================================
// Creators Limits section
// =============================================================================

export interface CreatorsEvidenceBundleLimits {
  sample_size_limitations: string[];
  missing_metadata_limitations: string[];
  epistemic_boundaries: string[];
  threshold_exclusions?: string[];
  data_quality_warnings?: string[];
}

// =============================================================================
// Creators Meta section
// =============================================================================

export interface CreatorsEvidenceBundleMeta {
  scan_id: string | null;
  platform: string | null;
  source_type: string | null;
  n_items: number;
  window_start: string | null;
  window_end: string | null;
  generated_at: string;
}

// =============================================================================
// Creators Evidence Bundle
// =============================================================================

export interface CreatorsEvidenceBundle {
  meta: CreatorsEvidenceBundleMeta;
  observations: CreatorsEvidenceBundleObservations;
  measurements: CreatorsEvidenceBundleMeasurements;
  limits: CreatorsEvidenceBundleLimits;
}

// =============================================================================
// Creators Analysis copy
// =============================================================================

export interface CreatorsAnalysisCopy {
  coverage_insight?: AnalysisCopyItem;
  primary_insight?: AnalysisCopyItem;
  frequent_creators_insight?: AnalysisCopyItem;
  flags_insight?: AnalysisCopyItem;
  limitations_summary?: AnalysisCopyItem;
}

// =============================================================================
// Creators API response types
// =============================================================================

export interface CreatorsEvidenceBundleResponse {
  scan_id: string;
  tab: 'creators';
  bundle: CreatorsEvidenceBundle;
  analysis: CreatorsAnalysisCopy;
  _debug?: {
    raw_bundle: CreatorsEvidenceBundle;
    scan_metadata: Record<string, unknown>;
    aggregates: Record<string, unknown>;
    feed_items_count: number;
  };
}

export interface CreatorsTalkResponse {
  scan_id: string;
  tab: 'creators';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}

// =============================================================================
// Inferences Evidence Bundle Types ("What the Algorithm Thinks" tab)
// =============================================================================

// Inference Kind enum matching backend
export type InferenceKind =
  | 'content_cluster'
  | 'commercial_signal'
  | 'political_signal'
  | 'feed_structure_signal';

// Inference Confidence levels
export type InferenceConfidence = 'high' | 'medium' | 'low';

// Inference Candidate
export interface InferenceCandidate {
  label: string;
  kind: InferenceKind;
  confidence: InferenceConfidence;
  evidence_fields: string[];
  observed_stats: {
    topic?: string;
    count?: number;
    percent?: number;
    n_items?: number;
    promotional_count?: number;
    ad_rate_percent?: number;
    political_count?: number;
    political_rate_percent?: number;
    coverage_percent?: number;
    topics?: string[];
    flag?: string;
    triggered?: boolean;
    observed_value?: number | null;
    threshold?: string;
    [key: string]: unknown;
  };
  exclusions?: string | null;
}

// Inference Overview
export interface InferenceOverview {
  total_candidates_surfaced: number;
  total_candidates_generated: number;
  candidates_by_kind: Record<string, number>;
  note: string;
}

// Candidate Exclusions Summary
export interface CandidateExclusionsSummary {
  medium_confidence_candidates_count: number;
  low_confidence_candidates_count: number;
  reasons: string[];
}

// =============================================================================
// Inferences Observations section
// =============================================================================

export interface InferencesEvidenceBundleObservations {
  inference_overview: InferenceOverview;
  surfaced_inferences: InferenceCandidate[];
  candidate_exclusions_summary: CandidateExclusionsSummary;
}

// =============================================================================
// Inferences Measurements section
// =============================================================================

export interface InferenceThresholdsUsed {
  content_cluster_high: string;
  content_cluster_medium: string;
  commercial_signal_high: string;
  political_signal_high: string;
  feed_structure_high: string;
  minimum_sample_size: string;
}

export interface ScanSignalMatrix {
  n_items: number;
  ad_rate_percent?: number;
  political_rate_percent?: number;
  political_coverage_percent?: number;
  topic_coverage_percent?: number;
  creator_coverage_percent?: number;
}

export interface InferencesEvidenceBundleMeasurements {
  inference_thresholds_used: InferenceThresholdsUsed;
  scan_signal_matrix: ScanSignalMatrix;
}

// =============================================================================
// Inferences Limits section
// =============================================================================

export interface InferencesEvidenceBundleLimits {
  sample_size_limitations: string[];
  missing_metadata_limitations: string[];
  epistemic_boundaries: string[];
  data_quality_warnings?: string[];
}

// =============================================================================
// Inferences Evidence Bundle
// =============================================================================

export interface InferencesEvidenceBundle {
  meta: EvidenceBundleMeta;
  observations: InferencesEvidenceBundleObservations;
  measurements: InferencesEvidenceBundleMeasurements;
  limits: InferencesEvidenceBundleLimits;
}

// =============================================================================
// Inferences Analysis copy
// =============================================================================

export interface InferencesAnalysisCopy {
  primary_insight?: AnalysisCopyItem;
  signal_breakdown?: AnalysisCopyItem;
  exclusions_insight?: AnalysisCopyItem;
  limitations_summary?: AnalysisCopyItem;
}

// =============================================================================
// Inferences API response types
// =============================================================================

export interface InferencesEvidenceBundleResponse {
  scan_id: string;
  tab: 'inferences';
  bundle: InferencesEvidenceBundle;
  analysis: InferencesAnalysisCopy;
  _debug?: {
    raw_bundle: InferencesEvidenceBundle;
    source_bundles: {
      ads: AdsEvidenceBundle;
      politics: PoliticsEvidenceBundle;
      patterns: PatternsEvidenceBundle;
      creators: CreatorsEvidenceBundle;
    };
    scan_metadata: Record<string, unknown>;
    aggregates: Record<string, unknown>;
    feed_items_count: number;
  };
}

export interface InferencesTalkResponse {
  scan_id: string;
  tab: 'inferences';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}
