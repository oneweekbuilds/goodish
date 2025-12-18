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
  tab: 'ads';
  question: string;
  response: {
    structured: TalkStructuredResponse;
    formatted_text: string;
  };
  cited_fields: string[];
}
