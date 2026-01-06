# AlgorithmLens Accuracy Architecture v3.0

> **Superseded:** This v3.0 accuracy architecture has been superseded by `accuracy-architecture-v3.1.md` (HPA + CMA).  
> This document is retained for historical reference only; v3.1 is the canonical accuracy architecture.

**Document Type:** Design Specification
**Scope:** `apps/alg-gemini/**` only
**Phase:** 5A (Design Only — No Code Edits)
**Status:** Draft for Review

---

## Table of Contents

1. [Global Output Schema](#1-global-output-schema)
2. [Tab-Specific Accuracy Contracts](#2-tab-specific-accuracy-contracts)
3. [Failure Mode Catalog](#3-failure-mode-catalog)
4. [Evaluation Plan](#4-evaluation-plan)
5. [Implementation Sequence](#5-implementation-sequence)

---

## 1. Global Output Schema

### 1.1 Top-Level Structure

```typescript
interface AnalysisResult {
  meta: GlobalMetadata;
  tabs: {
    ads: TabResult;
    politics: TabResult;
    patterns: TabResult;
    creators: TabResult;
    algorithm: TabResult;
  };
  audit: AuditTrail;
}
```

### 1.2 Global Metadata

```typescript
interface GlobalMetadata {
  // Identity
  scan_id: string;                    // UUID, immutable
  version: string;                    // Schema version: "3.0.0"

  // Source Characteristics
  modality: 'DESKTOP_EXTENSION' | 'MOBILE_VIDEO';
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'unknown';

  // Sample Profile
  post_count: number;                 // Total items in scan
  time_span: {
    start: string;                    // ISO 8601
    end: string;                      // ISO 8601
    duration_seconds: number;
  };

  // Coverage Accounting (strict contract: total = covered + excluded)
  coverage: {
    caption_coverage: CoverageBlock;
    ocr_coverage: CoverageBlock;
    metadata_coverage: CoverageBlock;
    overall_text_coverage: CoverageBlock;
  };

  // Language Detection
  language: {
    primary: string;                  // ISO 639-1 (e.g., "en")
    confidence: number;               // 0.0–1.0
    secondary_languages: string[];    // If multi-language detected
  };

  // Processing Info
  generated_at: string;               // ISO 8601
  processing_duration_ms: number;
}

interface CoverageBlock {
  n_covered: number;
  n_excluded: number;
  n_total: number;                    // INVARIANT: n_total === n_covered + n_excluded
  coverage_pct: number;               // (n_covered / n_total) * 100
  exclusion_reasons: Record<ExclusionReason, number>;
}

type ExclusionReason =
  | 'missing_text'
  | 'unreadable_ocr'
  | 'unsupported_language'
  | 'processing_error'
  | 'below_confidence_threshold';
```

### 1.3 Tab Result Structure

```typescript
interface TabResult {
  tab_name: TabName;
  status: TabStatus;
  insights: Insight[];
  data_sufficiency: DataSufficiency;
  limits_summary: string[];           // Human-readable epistemic limits
}

type TabName = 'ads' | 'politics' | 'patterns' | 'creators' | 'algorithm';

type TabStatus =
  | 'READY'                           // Sufficient data, insights generated
  | 'PARTIAL'                         // Some insights generated, others abstained
  | 'ABSTAINED'                       // Insufficient data for any insights
  | 'ERROR';                          // Processing failed

interface DataSufficiency {
  minimum_items_required: number;
  items_available: number;
  is_sufficient: boolean;
  insufficiency_reason?: string;      // Only if is_sufficient === false
}
```

### 1.4 Insight Structure

```typescript
interface Insight {
  // Identity
  insight_id: string;                 // Unique within scan: "{tab}_{claim_type}_{index}"
  claim_type: ClaimType;              // From tab-specific allowed list

  // The Claim
  claim_text: string;                 // Human-readable statement
  claim_phrasing: ClaimPhrasing;      // How hedged is this claim

  // Confidence Assessment
  confidence_band: ConfidenceBand;
  confidence_rationale: string;       // Why this band was assigned

  // Evidence Chain
  evidence_ids: string[];             // References to EvidenceItem.evidence_id
  evidence_summary: string;           // "Based on N items with X pattern"
  coverage_summary: CoverageSummary;

  // Abstention (if applicable)
  abstention_flag: boolean;
  abstention_reason?: AbstentionReason;
  abstention_message?: string;        // User-facing explanation

  // Audit
  generation_method: string;          // Which code path generated this
  threshold_gates_passed: ThresholdGate[];
}

type ConfidenceBand = 'LOW' | 'MED' | 'HIGH';

type ClaimPhrasing =
  | 'OBSERVATION'                     // "We observed X" (strongest)
  | 'ESTIMATE'                        // "Approximately X" (measured with uncertainty)
  | 'INDICATION'                      // "There are indications of X" (pattern-based)
  | 'POSSIBILITY'                     // "X may be present" (weak signal)
  | 'ABSTENTION';                     // "We cannot determine X" (no claim made)

interface CoverageSummary {
  items_supporting: number;           // Items with positive signal
  items_analyzed: number;             // Items examined for this claim
  items_excluded: number;             // Items excluded from analysis
  coverage_pct: number;               // (items_analyzed / total_posts) * 100
}

type AbstentionReason =
  | 'INSUFFICIENT_SAMPLE_SIZE'
  | 'INSUFFICIENT_COVERAGE'
  | 'LOW_CLASSIFIER_CONFIDENCE'
  | 'CONFLICTING_SIGNALS'
  | 'MISSING_REQUIRED_DATA'
  | 'THRESHOLD_NOT_MET'
  | 'OUTSIDE_EPISTEMIC_SCOPE';

interface ThresholdGate {
  gate_name: string;
  required_value: number;
  actual_value: number;
  passed: boolean;
}
```

### 1.5 Evidence Item Structure

```typescript
interface EvidenceItem {
  evidence_id: string;                // Unique: "{scan_id}_{item_index}_{signal_type}"
  source_item_index: number;          // Position in original feed

  // Signal Classification
  signal_type: SignalType;
  signal_subtype?: string;            // More specific classification

  // Detection Details
  detection_method: DetectionMethod;
  detection_confidence: number;       // 0.0–1.0
  detection_rationale: string;        // Why this was classified this way

  // Text Evidence (if applicable)
  text_snippet?: string;              // Relevant excerpt (max 200 chars)
  snippet_context?: string;           // Where in item this was found

  // Pattern Evidence (if applicable)
  pattern_matched?: string;           // Regex or keyword that triggered
  pattern_category?: string;          // Which pattern group
}

type SignalType =
  // Ads & Influence
  | 'labeled_ad'
  | 'unlabeled_promotion'
  | 'affiliate_content'
  | 'brand_mention'
  // Politics & Worldview
  | 'political_content'
  | 'political_keyword'
  | 'political_entity'
  // Patterns
  | 'topic_cluster'
  | 'repetition_instance'
  | 'format_signal'
  // Creators
  | 'creator_identity'
  | 'creator_signal'
  // Algorithm
  | 'inference_signal';

type DetectionMethod =
  | 'PLATFORM_LABEL'                  // Explicit platform marking
  | 'OCR_DISCLOSURE'                  // Text detected via OCR
  | 'KEYWORD_MATCH'                   // Keyword pattern matched
  | 'REGEX_PATTERN'                   // Regex pattern matched
  | 'NER_EXTRACTION'                  // Named entity recognition
  | 'CLASSIFIER_OUTPUT'               // ML classifier decision
  | 'HEURISTIC_RULE'                  // Rule-based logic
  | 'METADATA_FIELD';                 // Direct from platform metadata
```

### 1.6 Audit Trail

```typescript
interface AuditTrail {
  schema_version: string;
  processing_stages: ProcessingStage[];
  threshold_configuration: ThresholdConfig;
  abstention_summary: AbstentionSummary;
}

interface ProcessingStage {
  stage_name: string;
  started_at: string;
  completed_at: string;
  items_processed: number;
  items_failed: number;
  notes?: string;
}

interface ThresholdConfig {
  min_sample_size_default: number;
  min_coverage_pct_default: number;
  min_confidence_for_high: number;
  min_confidence_for_med: number;
  tab_overrides: Record<TabName, Partial<ThresholdOverrides>>;
}

interface AbstentionSummary {
  total_possible_insights: number;
  insights_generated: number;
  insights_abstained: number;
  abstention_rate: number;            // abstained / possible
  abstentions_by_reason: Record<AbstentionReason, number>;
}
```

---

## 2. Tab-Specific Accuracy Contracts

### 2.1 Ads & Influence

#### A) Allowed Claim Types

| Claim Type | Description | Phrasing Allowed |
|------------|-------------|------------------|
| `ads_labeled_rate` | % of items with platform ad labels | OBSERVATION, ESTIMATE |
| `ads_unlabeled_promo_rate` | % with unlabeled promotional signals | ESTIMATE, INDICATION |
| `ads_total_commercial_rate` | Combined commercial content rate | ESTIMATE |
| `ads_brand_frequency` | Frequency of specific brand mentions | OBSERVATION, ESTIMATE |
| `ads_promo_signal_types` | Types of promotional signals detected | OBSERVATION |
| `ads_advertiser_diversity` | Variety of advertising sources | ESTIMATE, INDICATION |

#### B) Forbidden Claim Types

| Forbidden Claim | Reason |
|-----------------|--------|
| User purchase intent | Cannot infer from content exposure |
| User susceptibility to ads | Psychological inference not possible |
| Ad effectiveness | No behavioral data available |
| User preferences for products | Exposure ≠ preference |
| Platform monetization strategy | Internal platform data unavailable |
| Whether user "should" see fewer ads | Normative judgment |

#### C) Minimum Evidence Gates

| Gate | Threshold | If Unmet |
|------|-----------|----------|
| `min_sample_size` | N ≥ 10 | Abstain entire tab |
| `min_text_coverage` | ≥ 30% items have text | Abstain text-based claims |
| `min_high_confidence_ads` | ≥ 1 for brand claims | Abstain brand frequency |
| `min_detection_diversity` | ≥ 2 methods for unlabeled | Add uncertainty note |

**Abstention Message Template:**
> "This scan contains only {N} items. We require at least 10 items to reliably estimate advertising rates. The patterns in a small sample may not represent your typical feed."

#### D) Confidence Rubric

| Band | Criteria (ALL must be met) |
|------|----------------------------|
| **HIGH** | • Platform-labeled ads only OR detection_confidence ≥ 0.85 • Sample size ≥ 30 • Coverage ≥ 70% • ≥ 2 detection methods agree |
| **MED** | • Detection_confidence ≥ 0.60 • Sample size ≥ 15 • Coverage ≥ 50% |
| **LOW** | • Detection_confidence ≥ 0.40 • Sample size ≥ 10 • Coverage ≥ 30% |
| **ABSTAIN** | Any metric below LOW thresholds |

#### E) Evidence-Linking Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| `ads_labeled_rate` | Platform label detection + item indices |
| `ads_unlabeled_promo_rate` | Pattern matches + text snippets + confidence scores |
| `ads_brand_frequency` | Brand extraction + mention counts + detection methods |
| `ads_promo_signal_types` | Signal type breakdown + example snippets |

---

### 2.2 Politics & Worldview

#### A) Allowed Claim Types

| Claim Type | Description | Phrasing Allowed |
|------------|-------------|------------------|
| `politics_content_rate` | % of items with political signals | ESTIMATE, INDICATION |
| `politics_subtopic_distribution` | Breakdown by political subtopic | OBSERVATION, ESTIMATE |
| `politics_keyword_frequency` | Frequency of political keywords | OBSERVATION |
| `politics_source_types` | Types of sources for political content | OBSERVATION, INDICATION |
| `politics_entity_mentions` | Political figures/orgs mentioned | OBSERVATION |

#### B) Forbidden Claim Types

| Forbidden Claim | Reason |
|-----------------|--------|
| User political beliefs | Exposure ≠ belief |
| User political identity | Cannot infer from content |
| User voting behavior | No behavioral data |
| Whether feed is "biased" | Requires ground truth baseline |
| Platform political agenda | Internal intent unknowable |
| Perspective "balance" without opt-in | Requires explicit consent |
| What user "agrees with" | Psychological inference |

#### C) Minimum Evidence Gates

| Gate | Threshold | If Unmet |
|------|-----------|----------|
| `min_sample_size` | N ≥ 10 | Abstain entire tab |
| `min_text_coverage` | ≥ 40% (politics requires text) | Abstain all claims |
| `min_political_items` | ≥ 3 items with political signal | Abstain distribution claims |
| `min_keyword_matches` | ≥ 5 matches for keyword freq | Add "sparse signal" note |

**Abstention Message Template:**
> "Only {coverage_pct}% of items in this scan had readable text. Political content detection relies on text analysis. We cannot provide reliable estimates without sufficient text coverage."

#### D) Confidence Rubric

| Band | Criteria (ALL must be met) |
|------|----------------------------|
| **HIGH** | • ≥ 10 items with political signal • Coverage ≥ 60% • Detection based on multiple keyword categories |
| **MED** | • ≥ 5 items with political signal • Coverage ≥ 40% |
| **LOW** | • ≥ 3 items with political signal • Coverage ≥ 30% |
| **ABSTAIN** | < 3 political items OR coverage < 30% |

#### E) Evidence-Linking Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| `politics_content_rate` | Item indices + keyword matches + subtopic classification |
| `politics_subtopic_distribution` | Subtopic → item mapping + keyword evidence |
| `politics_entity_mentions` | Entity name + extraction method + item indices |

---

### 2.3 Patterns in Your Feed

#### A) Allowed Claim Types

| Claim Type | Description | Phrasing Allowed |
|------------|-------------|------------------|
| `patterns_topic_diversity` | Diversity index of topics | ESTIMATE |
| `patterns_topic_concentration` | % in top N topics | OBSERVATION, ESTIMATE |
| `patterns_repetition_rate` | % of items in repetition clusters | ESTIMATE |
| `patterns_format_mix` | Distribution of content formats | OBSERVATION |
| `patterns_posting_frequency` | Temporal patterns in feed | OBSERVATION, INDICATION |
| `patterns_skew_flags` | Specific imbalance indicators | INDICATION |

#### B) Forbidden Claim Types

| Forbidden Claim | Reason |
|-----------------|--------|
| Why algorithm chose items | Platform internals unknowable |
| User interest intensity | Cannot infer engagement from exposure |
| Filter bubble existence | Requires comparative baseline |
| Whether diversity is "good/bad" | Normative judgment |
| User content preferences | Exposure ≠ preference |
| Algorithm "intent" | Anthropomorphizing system |

#### C) Minimum Evidence Gates

| Gate | Threshold | If Unmet |
|------|-----------|----------|
| `min_sample_size` | N ≥ 15 | Abstain entire tab |
| `min_topic_coverage` | ≥ 50% items classified | Abstain diversity claims |
| `min_cluster_size` | ≥ 2 items per cluster | Exclude cluster from count |
| `min_format_variety` | ≥ 2 formats present | Note "single format detected" |

**Abstention Message Template:**
> "With only {N} items, we cannot reliably measure feed diversity. Topic and repetition patterns require a larger sample to distinguish signal from noise."

#### D) Confidence Rubric

| Band | Criteria (ALL must be met) |
|------|----------------------------|
| **HIGH** | • Sample ≥ 50 items • Topic coverage ≥ 70% • ≥ 5 distinct topics detected |
| **MED** | • Sample ≥ 25 items • Topic coverage ≥ 50% • ≥ 3 distinct topics |
| **LOW** | • Sample ≥ 15 items • Topic coverage ≥ 30% |
| **ABSTAIN** | Below LOW thresholds |

#### E) Evidence-Linking Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| `patterns_topic_diversity` | Topic assignments + diversity calculation method + coverage |
| `patterns_repetition_rate` | Cluster definitions + item assignments + similarity scores |
| `patterns_skew_flags` | Flag trigger condition + observed value + threshold |

---

### 2.4 Creators & Voices

#### A) Allowed Claim Types

| Claim Type | Description | Phrasing Allowed |
|------------|-------------|------------------|
| `creators_unique_count` | Number of unique creators | OBSERVATION |
| `creators_concentration` | % from top N creators | OBSERVATION, ESTIMATE |
| `creators_frequency_list` | Most frequent creators | OBSERVATION |
| `creators_verification_rate` | % from verified accounts | OBSERVATION, ESTIMATE |
| `creators_handle_diversity` | Variety of creator handles | OBSERVATION |

#### B) Forbidden Claim Types

| Forbidden Claim | Reason |
|-----------------|--------|
| Who user "trusts" | Cannot infer from exposure |
| User relationship to creators | No engagement data |
| Creator influence on user | Psychological inference |
| Why these creators appear | Algorithm internals unknown |
| Creator credibility | Normative judgment |
| Whether user "follows" creator | Feed ≠ follow list |

#### C) Minimum Evidence Gates

| Gate | Threshold | If Unmet |
|------|-----------|----------|
| `min_sample_size` | N ≥ 10 | Abstain entire tab |
| `min_creator_coverage` | ≥ 50% items have creator ID | Abstain concentration claims |
| `min_unique_creators` | ≥ 3 for diversity claims | Note "limited variety" |

**Abstention Message Template:**
> "Creator information was extractable from only {coverage_pct}% of items. We cannot reliably measure creator concentration without broader coverage."

#### D) Confidence Rubric

| Band | Criteria (ALL must be met) |
|------|----------------------------|
| **HIGH** | • Creator coverage ≥ 80% • ≥ 10 unique creators • Sample ≥ 30 |
| **MED** | • Creator coverage ≥ 60% • ≥ 5 unique creators • Sample ≥ 15 |
| **LOW** | • Creator coverage ≥ 50% • ≥ 3 unique creators • Sample ≥ 10 |
| **ABSTAIN** | Below LOW thresholds |

#### E) Evidence-Linking Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| `creators_unique_count` | Creator ID extraction method + deduplication logic |
| `creators_concentration` | Creator → item count mapping + coverage % |
| `creators_frequency_list` | Ranked list with counts + extraction method per creator |

---

### 2.5 What the Algorithm Thinks

#### A) Allowed Claim Types

| Claim Type | Description | Phrasing Allowed |
|------------|-------------|------------------|
| `inference_content_clusters` | Topic patterns in content | INDICATION, POSSIBILITY |
| `inference_commercial_signals` | Commercial pattern observations | INDICATION |
| `inference_political_signals` | Political content observations | INDICATION, POSSIBILITY |
| `inference_structure_signals` | Feed structure patterns | INDICATION |
| `inference_aggregated` | Cross-tab pattern synthesis | INDICATION, POSSIBILITY |

**CRITICAL PHRASING REQUIREMENT:**
All claims in this tab MUST be phrased as observations about **content patterns**, NOT inferences about **user identity or platform categorization**.

✅ Correct: "Your feed contains a high concentration of fitness content."
❌ Incorrect: "The algorithm thinks you're interested in fitness."

#### B) Forbidden Claim Types

| Forbidden Claim | Reason |
|-----------------|--------|
| What platform "thinks" about user | Internal state unknowable |
| User identity categories | Cannot infer from content |
| Platform categorization of user | No access to ad targeting |
| User interest profile | Exposure ≠ interest |
| Why platform shows this content | Causal inference impossible |
| Predictions about future content | Speculation |

#### C) Minimum Evidence Gates

| Gate | Threshold | If Unmet |
|------|-----------|----------|
| `min_sample_size` | N ≥ 30 | Abstain entire tab |
| `min_cross_tab_signals` | ≥ 2 tabs with HIGH-confidence signals | Abstain aggregation |
| `min_cluster_strength` | ≥ 15% of items in cluster | Exclude weak clusters |
| `min_signal_diversity` | ≥ 2 signal types for inference | Require multiple evidence types |

**Abstention Message Template:**
> "We observed patterns in your feed content, but with only {N} items and {signal_count} clear signals, we cannot reliably identify content clusters that might indicate how platforms categorize your feed."

#### D) Confidence Rubric

| Band | Criteria (ALL must be met) |
|------|----------------------------|
| **HIGH** | • ≥ 3 tabs contribute signals • ≥ 50 items • Pattern appears in ≥ 25% of items |
| **MED** | • ≥ 2 tabs contribute signals • ≥ 30 items • Pattern appears in ≥ 15% of items |
| **LOW** | • ≥ 1 tab contributes signals • ≥ 30 items • Pattern appears in ≥ 10% of items |
| **ABSTAIN** | Below LOW thresholds |

#### E) Evidence-Linking Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| `inference_content_clusters` | Source tab + signal type + item indices + cluster definition |
| `inference_aggregated` | Cross-tab evidence chain + confidence per source |

---

## 3. Failure Mode Catalog

### 3.1 Hallucination / Overreach (FM-H)

| ID | Failure Mode | Example | Detection | Mitigation |
|----|--------------|---------|-----------|------------|
| FM-H01 | Inferring user intent from exposure | "You're interested in X" | Claim type validation | Forbidden claim list |
| FM-H02 | Asserting platform internal state | "The algorithm knows you like X" | Phrasing validation | Required phrasing patterns |
| FM-H03 | Causal claims without evidence | "This caused you to see Y" | Causal language detection | Banned word list |
| FM-H04 | Extrapolating beyond sample | "Your feed is always X" | Temporal qualifier check | Required hedging |
| FM-H05 | Inventing evidence | Citing non-existent patterns | Evidence chain validation | Evidence ID verification |
| FM-H06 | Anthropomorphizing algorithm | "The algorithm wants you to..." | Intent language detection | Phrasing guidelines |
| FM-H07 | Normative judgments | "Too many ads is bad" | Evaluative language check | Neutral phrasing requirement |

### 3.2 Insufficient Data (FM-D)

| ID | Failure Mode | Example | Detection | Mitigation |
|----|--------------|---------|-----------|------------|
| FM-D01 | Claims with N < threshold | Diversity claim with 5 items | Sample size gate | Threshold validation |
| FM-D02 | Claims with low coverage | Political rate with 20% text coverage | Coverage gate | Coverage threshold |
| FM-D03 | Single-source claims | Confidence HIGH from one method | Detection diversity check | Multi-method requirement |
| FM-D04 | Sparse signal claims | 1 political keyword in 100 items | Signal density check | Minimum signal gate |
| FM-D05 | Missing modality claims | OCR claims without OCR data | Modality availability check | Graceful degradation |

### 3.3 Inconsistency Across Modalities (FM-M)

| ID | Failure Mode | Example | Detection | Mitigation |
|----|--------------|---------|-----------|------------|
| FM-M01 | Desktop/Mobile divergence | Different ad rates for same content | Cross-modality comparison | Modality-specific thresholds |
| FM-M02 | OCR vs metadata conflict | OCR says ad, metadata says no | Conflict detection | Conflict resolution rules |
| FM-M03 | Text vs visual disconnect | Caption benign, image promotional | Multi-signal check | Weighted evidence rules |
| FM-M04 | Platform-specific false patterns | Instagram patterns applied to TikTok | Platform validation | Platform-specific rules |
| FM-M05 | Temporal inconsistency | Session patterns claimed as permanent | Time-scope validation | Temporal hedging requirement |

### 3.4 Miscalibration of Confidence (FM-C)

| ID | Failure Mode | Example | Detection | Mitigation |
|----|--------------|---------|-----------|------------|
| FM-C01 | HIGH confidence with low N | HIGH confidence from 10 items | Sample→confidence validation | Confidence rubric enforcement |
| FM-C02 | HIGH confidence with single method | HIGH from keyword match only | Method diversity check | Multi-method requirement for HIGH |
| FM-C03 | LOW confidence presented prominently | LOW confidence in primary view | Confidence→visibility mapping | Visibility rules |
| FM-C04 | Confidence inflation over aggregation | Combined signal inflates confidence | Aggregation validation | Aggregate confidence rules |
| FM-C05 | Missing uncertainty quantification | "30% ads" without error margin | Uncertainty check | Required error bounds |
| FM-C06 | False precision | "32.7% political content" | Significant figures check | Rounding rules |

### 3.5 Misleading Phrasing / Implied Determinism (FM-P)

| ID | Failure Mode | Example | Detection | Mitigation |
|----|--------------|---------|-----------|------------|
| FM-P01 | Definitive language for estimates | "Your feed IS 40% ads" | Certainty language check | Required hedging words |
| FM-P02 | Universal claims from sample | "All your content is X" | Scope validation | Sample-scoping requirement |
| FM-P03 | Implied permanence | "Your feed shows X" vs "This scan shows X" | Temporal validation | Required temporal scoping |
| FM-P04 | Active voice for passive processes | "The algorithm targets you" | Agency language check | Passive phrasing guidelines |
| FM-P05 | Missing abstention explanation | Empty state without reason | Abstention message check | Required abstention template |
| FM-P06 | Comparative claims without baseline | "More political than average" | Baseline validation | Baseline requirement or abstain |
| FM-P07 | Hidden qualifications | Important caveats buried | Qualification placement check | Prominent caveat requirement |

---

## 4. Evaluation Plan

### 4.1 Golden Dataset Specification

#### Storage Format
```
apps/alg-gemini/
├── test/
│   └── golden/
│       ├── manifest.json           # Version + index
│       ├── scans/
│       │   ├── golden_001.json     # Full scan data
│       │   ├── golden_002.json
│       │   └── ...
│       ├── expected/
│       │   ├── golden_001_expected.json  # Expected outputs
│       │   └── ...
│       └── annotations/
│           ├── golden_001_annotations.json  # Human labels
│           └── ...
```

#### Manifest Schema
```typescript
interface GoldenManifest {
  version: string;                    // "1.0.0"
  created_at: string;
  last_updated: string;
  dataset_stats: {
    total_scans: number;
    by_platform: Record<string, number>;
    by_modality: Record<string, number>;
    by_scenario: Record<string, number>;
  };
  scans: GoldenScanEntry[];
}

interface GoldenScanEntry {
  id: string;                         // "golden_001"
  scenario: string;                   // "high_ad_density"
  platform: string;
  modality: string;
  expected_abstentions: string[];     // Claim types that should abstain
  expected_confidence: Record<string, ConfidenceBand>;
  notes: string;
}
```

#### Labeling Protocol
1. Each scan labeled by 2 independent annotators
2. Disagreements resolved by third annotator
3. Labels include:
   - Ground truth counts (ads, political items, etc.)
   - Expected claim presence/absence
   - Expected confidence bands
   - Expected abstention reasons

#### Versioning
- Semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Schema changes
- MINOR: New scenarios added
- PATCH: Corrections to existing labels
- Git tags for each version

### 4.2 Fixture Edge-Case Suite

| # | Fixture ID | Scenario | Purpose | Expected Behavior |
|---|------------|----------|---------|-------------------|
| 1 | `FIX_EMPTY` | 0 items | Empty feed handling | Abstain all tabs with clear message |
| 2 | `FIX_MINIMAL` | 5 items | Below threshold | Abstain with N<threshold message |
| 3 | `FIX_NO_TEXT` | 30 items, 0% text coverage | OCR-only feed | Abstain text-dependent claims |
| 4 | `FIX_ALL_ADS` | 100% labeled ads | Saturation case | HIGH confidence, proper percentage |
| 5 | `FIX_ZERO_ADS` | 0% ads, 50 items | Clean feed | Report 0% without abstaining |
| 6 | `FIX_MIXED_CONF` | 50% HIGH, 50% LOW confidence | Confidence mixing | Only HIGH in primary metrics |
| 7 | `FIX_SINGLE_CREATOR` | 1 creator, 100 items | Monopoly case | 100% concentration, proper warning |
| 8 | `FIX_ALL_POLITICAL` | 100% political items | Saturation | HIGH confidence political rate |
| 9 | `FIX_CONFLICTING_SIGNALS` | Ad label + "not sponsored" text | Signal conflict | Prefer platform label, note conflict |
| 10 | `FIX_MULTI_LANGUAGE` | Mixed EN/ES content | Language handling | Report primary + secondary |
| 11 | `FIX_THRESHOLD_EDGE` | Exactly at threshold (e.g., 10 items) | Boundary behavior | Accept at threshold |
| 12 | `FIX_JUST_BELOW` | 9 items (one below threshold) | Boundary behavior | Abstain cleanly |
| 13 | `FIX_SPARSE_POLITICAL` | 2 political items in 100 | Weak signal | LOW confidence or abstain |
| 14 | `FIX_MOBILE_OCR_ONLY` | Mobile video, no metadata | Modality constraint | Graceful OCR-only analysis |
| 15 | `FIX_COVERAGE_GAP` | 40% coverage, strong signal | Partial data | MED confidence with coverage note |

### 4.3 Metrics Definitions

| # | Metric | Definition | Target |
|---|--------|------------|--------|
| M1 | **Abstention Rate** | (insights_abstained / insights_possible) × 100 | 10-30% |
| M2 | **Appropriate Abstention Rate** | (correct_abstentions / total_abstentions) × 100 | ≥ 95% |
| M3 | **Missed Abstention Rate** | (should_have_abstained / insights_generated) × 100 | ≤ 2% |
| M4 | **Confidence Calibration** | % of HIGH claims that are correct | ≥ 90% |
| M5 | **Evidence Linking Rate** | (claims_with_valid_evidence / total_claims) × 100 | 100% |
| M6 | **Coverage Accounting Accuracy** | % of scans where n_total = n_covered + n_excluded | 100% |
| M7 | **Forbidden Claim Rate** | (forbidden_claims_generated / total_claims) × 100 | 0% |
| M8 | **Threshold Gate Compliance** | % of claims passing all required gates | 100% |
| M9 | **Phrasing Compliance** | % of claims using only allowed phrasing | 100% |
| M10 | **Cross-Modality Consistency** | Agreement rate between modalities for same content | ≥ 85% |

### 4.4 Acceptance Criteria for Phase 5C Success

#### Hard Requirements (ALL must pass)
1. **M5 (Evidence Linking)** = 100%
2. **M6 (Coverage Accounting)** = 100%
3. **M7 (Forbidden Claims)** = 0%
4. **M8 (Threshold Compliance)** = 100%
5. **M9 (Phrasing Compliance)** = 100%

#### Soft Requirements (Must meet targets)
1. **M1 (Abstention Rate)** within 10-30%
2. **M2 (Appropriate Abstention)** ≥ 95%
3. **M3 (Missed Abstention)** ≤ 2%
4. **M4 (Confidence Calibration)** ≥ 90%
5. **M10 (Cross-Modality)** ≥ 85%

#### Golden Dataset Coverage
- 100% of fixtures pass
- 100% of golden scans produce expected outputs

---

## 5. Implementation Sequence

### Phase 5B: Schema & Contract Implementation

**Objective:** Implement the output schema and validation layer

**Deliverables:**
1. TypeScript type definitions matching Section 1
2. Zod/similar runtime validators for all schemas
3. Schema version management system
4. Evidence ID generation utilities

**Verification:**
- [ ] All types compile without errors
- [ ] Round-trip serialization tests pass
- [ ] Schema version properly embedded in outputs

**Risk:** LOW (pure type/validation work)

---

### Phase 5C: Threshold & Abstention Implementation

**Objective:** Implement all threshold gates and abstention logic

**Deliverables:**
1. Threshold configuration system (per-tab overrides)
2. Gate evaluation functions for each claim type
3. Abstention message templates
4. Abstention reason tracking

**Verification:**
- [ ] All 15 edge-case fixtures pass
- [ ] Abstention messages match templates
- [ ] Threshold gates correctly block insufficient data

**Risk:** MEDIUM (logic complexity in gate evaluation)

---

### Phase 5D: Evidence Chain Implementation

**Objective:** Complete evidence linking and audit trail

**Deliverables:**
1. Evidence ID generation and tracking
2. Evidence → Claim linking validation
3. Audit trail generation
4. Coverage accounting enforcement

**Verification:**
- [ ] M5 (Evidence Linking) = 100%
- [ ] M6 (Coverage Accounting) = 100%
- [ ] Audit trail correctly captures all processing stages

**Risk:** MEDIUM (requires touching multiple code paths)

---

### Phase 5E: Confidence Calibration

**Objective:** Implement and calibrate confidence rubrics

**Deliverables:**
1. Per-tab confidence calculation functions
2. Confidence rubric enforcement
3. Confidence rationale generation
4. Confidence visualization updates

**Verification:**
- [ ] M4 (Confidence Calibration) ≥ 90%
- [ ] Golden dataset confidence expectations met
- [ ] No HIGH confidence with insufficient evidence

**Risk:** MEDIUM (calibration may require iteration)

---

### Phase 5F: Phrasing & Forbidden Claims

**Objective:** Enforce phrasing rules and claim restrictions

**Deliverables:**
1. Claim type validation against allowed lists
2. Phrasing enforcement for each claim type
3. Forbidden claim detection (for Talk responses)
4. Phrasing templates and validators

**Verification:**
- [ ] M7 (Forbidden Claims) = 0%
- [ ] M9 (Phrasing Compliance) = 100%
- [ ] All Talk responses pass phrasing validation

**Risk:** LOW-MEDIUM (mostly validation and template work)

---

### Phase 5G: Integration & Golden Dataset Validation

**Objective:** Full integration testing against golden dataset

**Deliverables:**
1. Complete golden dataset (min 20 scans)
2. Automated test suite running all fixtures + golden scans
3. Metrics dashboard showing M1-M10
4. Documented edge cases and known limitations

**Verification:**
- [ ] All acceptance criteria met
- [ ] CI/CD integration for regression prevention
- [ ] Documentation updated

**Risk:** LOW (validation phase, issues should surface earlier)

---

### Implementation Order Rationale

```
5B (Schema) → 5C (Thresholds) → 5D (Evidence) → 5E (Confidence) → 5F (Phrasing) → 5G (Integration)
```

**Why this order:**

1. **5B first:** Everything depends on the schema. Cannot build validators without types.

2. **5C second:** Thresholds and abstention are the foundation of accuracy. Claims that shouldn't be made must be blocked before we worry about how they're made.

3. **5D third:** Evidence linking requires the threshold system to know which claims to link. Must complete before confidence (which depends on evidence quantity/quality).

4. **5E fourth:** Confidence calibration requires evidence chains and threshold gates to be in place. Confidence is derived from evidence.

5. **5F fifth:** Phrasing enforcement can only happen once we know which claims will be generated. Depends on confidence bands being assigned.

6. **5G last:** Integration is inherently final. Validates everything works together.

---

## Appendix A: Abstention Message Templates

### Sample Size Insufficient

> **We need more data**
>
> This scan contains {N} items. To provide reliable {analysis_type} insights, we need at least {threshold} items. A small sample may not represent your typical feed.
>
> **What you can do:** Capture a longer scroll session or combine multiple scans.

### Coverage Insufficient

> **Limited text coverage**
>
> Only {coverage_pct}% of items in this scan had readable text. {Analysis_type} relies on analyzing text content.
>
> **What this means:** We can only analyze the portion of your feed with text, which may not represent the full picture.

### Signal Too Weak

> **Signal below threshold**
>
> We detected {signal_type} in {count} items ({pct}% of your feed). This is below our minimum threshold of {threshold} items to draw reliable conclusions.
>
> **What this means:** While we observed some {signal_type}, we cannot confidently characterize the pattern.

### Conflicting Signals

> **Mixed signals detected**
>
> We found conflicting indicators: {signal_1} suggests X, while {signal_2} suggests Y. We cannot reliably resolve this conflict.
>
> **What this means:** The data doesn't clearly point in one direction.

---

## Appendix B: Phrasing Guidelines

### Allowed Hedge Words by Phrasing Type

| Phrasing | Required Hedge Words |
|----------|---------------------|
| OBSERVATION | "In this scan...", "We observed...", "This session contained..." |
| ESTIMATE | "Approximately...", "Around...", "Estimated at...", "Roughly..." |
| INDICATION | "There are indications...", "Patterns suggest...", "Signals point to..." |
| POSSIBILITY | "May include...", "Possibly...", "Could contain..." |
| ABSTENTION | "We cannot determine...", "Insufficient data to...", "Unable to assess..." |

### Banned Phrases (Auto-Reject)

- "The algorithm thinks..."
- "The platform knows..."
- "You are interested in..."
- "You prefer..."
- "Your feed is biased..."
- "You should..."
- "This proves..."
- "Definitely..."
- "Always..."
- "Never..."
- "100% certain..."

---

## Appendix C: Schema Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-01-06 | Initial accuracy architecture |

---

*Document generated for Phase 5A design review. No code changes in this phase.*
