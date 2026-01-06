# Accuracy Architecture v3.1 (HPA + CMA)

**Document Type:** Design Specification
**Scope:** `apps/alg-gemini/**` only
**Phase:** 5A (Design Only — No Code Edits)
**Status:** Draft for Review
**Supersedes:** v3.0
**Canonical Status:** This is the canonical accuracy architecture for AlgorithmLens v3.1, covering both the Hallucination Prevention Architecture (HPA) and Correctness Maximization Architecture (CMA).

---

## Table of Contents

1. [Mission Statements: HPA + CMA](#1-mission-statements-hpa--cma)
2. [Upgraded Output Schema](#2-upgraded-output-schema)
3. [Formal Correctness Definitions](#3-formal-correctness-definitions)
4. [Method-Aware Confidence & Signal-Adaptive Thresholds](#4-method-aware-confidence--signal-adaptive-thresholds)
5. [Learning & Calibration Loop](#5-learning--calibration-loop)
6. [Adversarial Robustness Plan](#6-adversarial-robustness-plan)
7. [Capability Unlock Roadmap](#7-capability-unlock-roadmap)
8. [Evaluation Plan v3.1](#8-evaluation-plan-v31)

---

## 1. Mission Statements: HPA + CMA

### 1A. Hallucination Prevention Architecture (HPA)

**Mission:** Ensure that every claim AlgorithmLens makes is epistemically defensible—grounded in observable evidence, scoped to what the data can support, and explicitly uncertain where uncertainty exists. The HPA guarantees that when we speak, we speak truthfully; when we cannot speak truthfully, we abstain and explain why. Success is measured by the **absence of false claims**, not by the volume of output. A system with 0% hallucination and 10% coverage is preferable to one with 5% hallucination and 90% coverage.

### 1B. Correctness Maximization Architecture (CMA)

**Mission:** Maximize the fraction of possible true claims that AlgorithmLens actually makes with HIGH confidence, conditional on available data. The CMA treats abstention as a **temporary failure state** to be minimized through better extraction, aggregation, reasoning, and calibration. Success is measured by **recall of true claims at target precision**. A system that correctly identifies 95% of ads with 99% precision is superior to one that identifies 50% of ads with 99.5% precision. The CMA provides the roadmap for capability improvements that shrink abstention over time while maintaining HPA guarantees.

### How They Interact

```
┌─────────────────────────────────────────────────────────────┐
│                         INPUT DATA                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              CMA: Maximize Extraction & Signal              │
│   (Better OCR, better classifiers, better aggregation)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                HPA: Filter & Validate Claims                │
│   (Threshold gates, evidence requirements, phrasing)        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      OUTPUT CLAIMS                          │
│         (FINAL | PRELIMINARY | ABSTAIN)                     │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** CMA pushes claims *toward* the threshold; HPA ensures only claims *above* the threshold pass through.

---

## 2. Upgraded Output Schema

### 2.1 Enhanced Insight Structure

```typescript
interface Insight {
  // === Identity ===
  insight_id: string;
  claim_type: ClaimType;

  // === Claim Content ===
  claim_text: string;
  claim_status: ClaimStatus;           // NEW: FINAL | PRELIMINARY | ABSTAIN
  claim_phrasing: ClaimPhrasing;

  // === Confidence (Enhanced) ===
  confidence_band: ConfidenceBand;     // LOW | MED | HIGH (categorical)
  numeric_confidence: number;          // NEW: 0.0–1.0 (continuous)
  confidence_rationale: string;

  // === Estimate Type & Uncertainty ===
  estimate_type: EstimateType;         // NEW: POINT | INTERVAL | QUALITATIVE
  point_estimate?: number;             // For POINT/INTERVAL types
  uncertainty_interval?: {             // NEW: For INTERVAL type
    lower: number;
    upper: number;
    confidence_level: number;          // e.g., 0.95 for 95% CI
  };
  interval_width_acceptable: boolean;  // NEW: Is interval narrow enough to be useful?

  // === Evidence Chain ===
  evidence_ids: string[];
  evidence_summary: string;
  coverage_summary: CoverageSummary;
  aggregate_method_reliability: number; // NEW: Weighted reliability of evidence methods

  // === Abstention / Preliminary ===
  abstention_flag: boolean;
  abstention_reason?: AbstentionReason;
  abstention_message?: string;
  preliminary_upgrade_path?: string;   // NEW: What would make this FINAL?

  // === Audit ===
  generation_method: string;
  threshold_gates: ThresholdGate[];
  correctness_definition_ref: string;  // NEW: Link to formal correctness spec
}

type ClaimStatus = 'FINAL' | 'PRELIMINARY' | 'ABSTAIN';

type EstimateType = 'POINT' | 'INTERVAL' | 'QUALITATIVE';

// Phrasing rules by claim status
type ClaimPhrasing =
  | 'OBSERVATION'      // FINAL only: "This scan contained X"
  | 'ESTIMATE'         // FINAL only: "Approximately X"
  | 'INDICATION'       // FINAL or PRELIMINARY: "Patterns suggest X"
  | 'PRELIMINARY'      // PRELIMINARY only: "Early signal suggests X, pending more data"
  | 'POSSIBILITY'      // PRELIMINARY only: "X may be present"
  | 'ABSTENTION';      // ABSTAIN only: "Insufficient data to determine X"
```

### 2.2 Enhanced Evidence Item Structure

```typescript
interface EvidenceItem {
  evidence_id: string;
  source_item_index: number;

  // === Signal Classification ===
  signal_type: SignalType;
  signal_subtype?: string;

  // === Detection Details (Enhanced) ===
  detection_method: DetectionMethod;
  detection_confidence: number;        // 0.0–1.0
  method_reliability: MethodReliability; // NEW: Static reliability of this method
  effective_confidence: number;        // NEW: detection_confidence * method_reliability
  detection_rationale: string;

  // === Evidence Content ===
  text_snippet?: string;
  snippet_context?: string;
  pattern_matched?: string;
  pattern_category?: string;

  // === Conflict Tracking ===
  conflicts_with?: string[];           // NEW: Evidence IDs that contradict this
  conflict_resolution?: ConflictResolution; // NEW: How conflict was resolved
}

interface MethodReliability {
  method: DetectionMethod;
  base_reliability: number;            // Static reliability score (0.0–1.0)
  platform_modifier?: number;          // Platform-specific adjustment
  effective_reliability: number;       // Final reliability score
  reliability_source: string;          // How was this reliability determined?
}

interface ConflictResolution {
  resolution_type: 'PRECEDENCE' | 'MAJORITY' | 'ABSTAIN' | 'MANUAL';
  winning_evidence_id?: string;
  resolution_rationale: string;
  confidence_penalty: number;          // How much confidence was reduced due to conflict
}
```

### 2.3 Method Reliability Table (Static Configuration)

```typescript
const METHOD_RELIABILITY: Record<DetectionMethod, MethodReliability> = {
  PLATFORM_LABEL: {
    method: 'PLATFORM_LABEL',
    base_reliability: 0.999,
    effective_reliability: 0.999,
    reliability_source: 'Platform labels are authoritative by definition'
  },
  METADATA_FIELD: {
    method: 'METADATA_FIELD',
    base_reliability: 0.95,
    effective_reliability: 0.95,
    reliability_source: 'Structured metadata is highly reliable'
  },
  OCR_DISCLOSURE: {
    method: 'OCR_DISCLOSURE',
    base_reliability: 0.85,
    platform_modifier: -0.10,  // Mobile video OCR is less reliable
    effective_reliability: 0.75,
    reliability_source: 'OCR accuracy varies by image quality'
  },
  KEYWORD_MATCH: {
    method: 'KEYWORD_MATCH',
    base_reliability: 0.70,
    effective_reliability: 0.70,
    reliability_source: 'Keywords can be ambiguous or sarcastic'
  },
  REGEX_PATTERN: {
    method: 'REGEX_PATTERN',
    base_reliability: 0.75,
    effective_reliability: 0.75,
    reliability_source: 'Patterns are precise but context-blind'
  },
  CLASSIFIER_OUTPUT: {
    method: 'CLASSIFIER_OUTPUT',
    base_reliability: 0.80,  // Updated via calibration loop
    effective_reliability: 0.80,
    reliability_source: 'ML classifier with Platt-scaled probabilities'
  },
  HEURISTIC_RULE: {
    method: 'HEURISTIC_RULE',
    base_reliability: 0.65,
    effective_reliability: 0.65,
    reliability_source: 'Hand-crafted rules have edge cases'
  },
  NER_EXTRACTION: {
    method: 'NER_EXTRACTION',
    base_reliability: 0.75,
    effective_reliability: 0.75,
    reliability_source: 'NER accuracy on social media text is moderate'
  }
};
```

### 2.4 Preliminary Claim Phrasing Rules

| Claim Status | Allowed Phrasings | Required Elements |
|--------------|-------------------|-------------------|
| **FINAL** | OBSERVATION, ESTIMATE, INDICATION | Must have `numeric_confidence >= 0.70` |
| **PRELIMINARY** | PRELIMINARY, POSSIBILITY, INDICATION | Must include `preliminary_upgrade_path` |
| **ABSTAIN** | ABSTENTION only | Must include `abstention_reason` and `abstention_message` |

**Preliminary Claim Templates:**

```typescript
const PRELIMINARY_TEMPLATES = {
  insufficient_sample:
    "Early signal from {n} items suggests {claim}. " +
    "This is preliminary—{threshold - n} more items would allow a confident estimate.",

  low_coverage:
    "Based on the {coverage_pct}% of items we could analyze, " +
    "there are indications of {claim}. " +
    "Higher text coverage would strengthen this finding.",

  weak_signal:
    "We detected {signal_type} in {count} items. " +
    "This pattern may indicate {claim}, but the signal is not yet strong enough for confident reporting.",

  single_method:
    "One detection method ({method}) suggests {claim}. " +
    "Confirmation from additional methods would increase confidence."
};
```

---

## 3. Formal Correctness Definitions

### 3.1 Correctness Framework

```typescript
interface CorrectnessDefinition {
  claim_type: ClaimType;
  estimate_type: EstimateType;
  correctness_criterion: CorrectnessCriterion;
  tolerance?: number;                  // For POINT estimates
  inter_rater_target?: number;         // For QUALITATIVE (Cohen's kappa)
  scoring_function: string;            // Reference to scoring implementation
}

type CorrectnessCriterion =
  | 'POINT_WITHIN_TOLERANCE'           // |estimate - truth| <= tolerance
  | 'INTERVAL_CONTAINS_TRUTH'          // lower <= truth <= upper
  | 'LABEL_MATCHES_CONSENSUS'          // Matches majority of raters
  | 'ORDINAL_WITHIN_ONE'               // Within 1 rank of truth
  | 'DIRECTION_CORRECT';               // Sign/direction matches truth
```

### 3.2 Ads & Influence: Correctness Definitions

| Claim Type | Estimate Type | Correctness Criterion | Tolerance / Target | Scoring |
|------------|---------------|----------------------|-------------------|---------|
| `ads_labeled_rate` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI must contain true rate | Score = 1 if true rate ∈ [lower, upper], else 0 |
| `ads_unlabeled_promo_rate` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Same as above |
| `ads_total_commercial_rate` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Same as above |
| `ads_brand_frequency` | POINT | POINT_WITHIN_TOLERANCE | ±1 for counts ≤10, ±10% for counts >10 | Score = 1 if within tolerance |
| `ads_promo_signal_types` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.80 | Score = % of signals matching gold labels |
| `ads_advertiser_diversity` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Same as above |

**Ground Truth Protocol for Ads:**
- **Labeled ads:** Platform label present = ad. No ambiguity.
- **Unlabeled promotions:** 3 raters label each item. Majority vote = truth. Items with 3-way disagreement = "ambiguous" (excluded from correctness scoring).
- **Brands:** NER + manual review. Brand present if 2/3 raters agree.

### 3.3 Politics & Worldview: Correctness Definitions

| Claim Type | Estimate Type | Correctness Criterion | Tolerance / Target | Scoring |
|------------|---------------|----------------------|-------------------|---------|
| `politics_content_rate` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Score = 1 if true rate ∈ interval |
| `politics_subtopic_distribution` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.70 (subtopics are harder) | Score = % of items with correct subtopic |
| `politics_keyword_frequency` | POINT | POINT_WITHIN_TOLERANCE | ±2 for counts ≤20, ±10% otherwise | Score = 1 if within tolerance |
| `politics_source_types` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.75 | Score = % of source types correct |
| `politics_entity_mentions` | POINT | POINT_WITHIN_TOLERANCE | ±1 per entity | Score = F1 of entity set |

**Ground Truth Protocol for Politics:**
- **Political content:** Item is political if it mentions elections, policy, political figures, or partisan issues. 3 raters, majority vote.
- **Subtopics:** Raters assign one of 10 subtopics. κ ≥ 0.70 required; items below threshold = "ambiguous subtopic."
- **Entities:** Named entity must be a political figure/org. 2/3 rater agreement required.

### 3.4 Patterns: Correctness Definitions

| Claim Type | Estimate Type | Correctness Criterion | Tolerance / Target | Scoring |
|------------|---------------|----------------------|-------------------|---------|
| `patterns_topic_diversity` | INTERVAL | INTERVAL_CONTAINS_TRUTH | Simpson index within 95% CI | Score = 1 if true diversity ∈ interval |
| `patterns_topic_concentration` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Same |
| `patterns_repetition_rate` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Same |
| `patterns_format_mix` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.85 (format is clear) | Score = % of formats correct |
| `patterns_skew_flags` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.75 | Score = precision & recall of flags |

**Ground Truth Protocol for Patterns:**
- **Topics:** LDA topic model trained on large corpus. Item topic = highest-probability topic. Human validation sample.
- **Repetition:** Two items are repetitive if 2/3 raters agree they cover the same topic/story.
- **Format:** Clear taxonomy (video, image, text, carousel, etc.). High inter-rater agreement expected.

### 3.5 Creators: Correctness Definitions

| Claim Type | Estimate Type | Correctness Criterion | Tolerance / Target | Scoring |
|------------|---------------|----------------------|-------------------|---------|
| `creators_unique_count` | POINT | POINT_WITHIN_TOLERANCE | ±0 (exact match required) | Score = 1 if exact |
| `creators_concentration` | INTERVAL | INTERVAL_CONTAINS_TRUTH | 95% CI contains truth | Score = 1 if true % ∈ interval |
| `creators_frequency_list` | QUALITATIVE | ORDINAL_WITHIN_ONE | Top-5 list, each position ±1 | Score = Spearman correlation |
| `creators_verification_rate` | POINT | POINT_WITHIN_TOLERANCE | ±0 (verification is binary) | Score = 1 if exact |
| `creators_handle_diversity` | POINT | POINT_WITHIN_TOLERANCE | ±0 (exact count) | Score = 1 if exact |

**Ground Truth Protocol for Creators:**
- **Creator identity:** Extracted handle/ID must exactly match. Case-insensitive.
- **Verification:** Platform verification badge present = verified. Binary, no ambiguity.
- **Frequency ranking:** Count-based ranking is deterministic. Ties broken alphabetically.

### 3.6 Algorithm Inferences: Correctness Definitions

| Claim Type | Estimate Type | Correctness Criterion | Tolerance / Target | Scoring |
|------------|---------------|----------------------|-------------------|---------|
| `inference_content_clusters` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.65 (inferences are subjective) | Score = % of clusters matching rater consensus |
| `inference_commercial_signals` | QUALITATIVE | DIRECTION_CORRECT | Above/below median commercial | Score = 1 if direction correct |
| `inference_political_signals` | QUALITATIVE | DIRECTION_CORRECT | Above/below median political | Score = 1 if direction correct |
| `inference_structure_signals` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.60 | Score = % of signals correct |
| `inference_aggregated` | QUALITATIVE | LABEL_MATCHES_CONSENSUS | κ ≥ 0.60 | Score = % of inferences correct |

**Ground Truth Protocol for Inferences:**
- **Content clusters:** Raters identify dominant topics. System cluster matches if ≥70% overlap with rater cluster.
- **Direction claims:** "High commercial" = above platform median. Median computed from golden dataset.
- **Aggregated inferences:** 3 raters describe top-3 inferences. System score = Jaccard similarity.

---

## 4. Method-Aware Confidence & Signal-Adaptive Thresholds

### 4.1 Single-Method HIGH Confidence Rules

**Principle:** Some detection methods are reliable enough to yield HIGH confidence alone.

| Method | Can Yield HIGH Alone? | Condition | Rationale |
|--------|----------------------|-----------|-----------|
| `PLATFORM_LABEL` | **YES** | Always | Platform labels are authoritative (reliability 0.999) |
| `METADATA_FIELD` | **YES** | If field is platform-verified | Structured metadata from platform is reliable |
| `OCR_DISCLOSURE` | **NO** | — | OCR can misread; needs confirmation |
| `KEYWORD_MATCH` | **NO** | — | Keywords can be sarcastic, quoted, negated |
| `REGEX_PATTERN` | **NO** | — | Patterns lack context |
| `CLASSIFIER_OUTPUT` | **YES** | If calibrated P ≥ 0.95 AND N ≥ 5 similar items | Calibrated classifier with consistent signal |
| `HEURISTIC_RULE` | **NO** | — | Heuristics have known edge cases |
| `NER_EXTRACTION` | **NO** | — | NER on social media is noisy |

### 4.2 Signal-Adaptive Threshold Formula

**Replace rigid N ≥ threshold with adaptive formula:**

```typescript
function minimumSampleSize(
  signal_strength: number,      // 0.0–1.0: fraction of items with positive signal
  unanimity: number,            // 0.0–1.0: consistency of signal across items
  method_reliability: number,   // 0.0–1.0: aggregate reliability of detection methods
  base_threshold: number        // Default minimum (e.g., 10)
): number {
  // Higher signal strength → lower N required
  const strength_factor = 1 - (signal_strength * 0.5);  // Range: 0.5–1.0

  // Higher unanimity → lower N required
  const unanimity_factor = 1 - (unanimity * 0.4);       // Range: 0.6–1.0

  // Higher reliability → lower N required
  const reliability_factor = 1 - (method_reliability * 0.3); // Range: 0.7–1.0

  const adjusted_threshold = base_threshold * strength_factor * unanimity_factor * reliability_factor;

  // Floor: never go below 5 items
  return Math.max(5, Math.ceil(adjusted_threshold));
}
```

**Examples:**

| Scenario | Signal Strength | Unanimity | Method Reliability | Base | Adjusted N |
|----------|-----------------|-----------|-------------------|------|------------|
| Weak signal, mixed methods | 0.1 | 0.3 | 0.7 | 30 | 28 |
| Strong signal, consistent, good methods | 0.8 | 0.9 | 0.9 | 30 | 11 |
| 100% signal, unanimous, platform labels | 1.0 | 1.0 | 0.999 | 30 | 6 |
| Moderate signal, OCR only | 0.5 | 0.7 | 0.75 | 30 | 16 |

### 4.3 Per-Field Coverage Thresholds

**Replace global coverage with field-specific thresholds:**

```typescript
const FIELD_COVERAGE_THRESHOLDS: Record<string, FieldCoverageConfig> = {
  // === Ads Tab ===
  'ads.platform_label': {
    min_coverage: 0.90,  // Platform labels should be everywhere
    claim_types_affected: ['ads_labeled_rate'],
    fallback: 'ABSTAIN'
  },
  'ads.text_content': {
    min_coverage: 0.30,  // Text optional for labeled ads
    claim_types_affected: ['ads_unlabeled_promo_rate', 'ads_promo_signal_types'],
    fallback: 'PRELIMINARY'
  },

  // === Politics Tab ===
  'politics.text_content': {
    min_coverage: 0.50,  // Politics requires text analysis
    claim_types_affected: ['politics_content_rate', 'politics_subtopic_distribution'],
    fallback: 'ABSTAIN'
  },

  // === Creators Tab ===
  'creators.handle': {
    min_coverage: 0.60,  // Need handles for concentration
    claim_types_affected: ['creators_concentration', 'creators_frequency_list'],
    fallback: 'PRELIMINARY'
  },
  'creators.verification': {
    min_coverage: 0.80,  // Verification should be extractable
    claim_types_affected: ['creators_verification_rate'],
    fallback: 'PRELIMINARY'
  },

  // === Patterns Tab ===
  'patterns.topic_classification': {
    min_coverage: 0.50,
    claim_types_affected: ['patterns_topic_diversity', 'patterns_topic_concentration'],
    fallback: 'PRELIMINARY'
  },
  'patterns.format': {
    min_coverage: 0.70,  // Format should be clear
    claim_types_affected: ['patterns_format_mix'],
    fallback: 'ABSTAIN'
  }
};
```

### 4.4 Confidence Band Calculation (Revised)

```typescript
function calculateConfidenceBand(
  numeric_confidence: number,
  sample_size: number,
  minimum_sample: number,
  coverage: number,
  coverage_threshold: number,
  has_conflicts: boolean,
  highest_method_reliability: number
): { band: ConfidenceBand; rationale: string } {

  // Hard gates that force LOW or ABSTAIN
  if (sample_size < minimum_sample * 0.5) {
    return { band: 'ABSTAIN', rationale: `Sample size ${sample_size} below minimum ${minimum_sample}` };
  }
  if (coverage < coverage_threshold * 0.6) {
    return { band: 'ABSTAIN', rationale: `Coverage ${coverage} below threshold ${coverage_threshold}` };
  }

  // Calculate composite score
  let score = numeric_confidence;

  // Sample size modifier
  const sample_ratio = Math.min(sample_size / (minimum_sample * 2), 1.0);
  score *= (0.7 + 0.3 * sample_ratio);

  // Coverage modifier
  const coverage_ratio = Math.min(coverage / coverage_threshold, 1.0);
  score *= (0.8 + 0.2 * coverage_ratio);

  // Conflict penalty
  if (has_conflicts) {
    score *= 0.85;
  }

  // Method reliability boost (only for HIGH)
  const can_boost = highest_method_reliability >= 0.95;

  // Assign band
  if (score >= 0.85 || (score >= 0.75 && can_boost)) {
    return { band: 'HIGH', rationale: `Score ${score.toFixed(2)} with reliability ${highest_method_reliability}` };
  } else if (score >= 0.60) {
    return { band: 'MED', rationale: `Score ${score.toFixed(2)}` };
  } else if (score >= 0.40) {
    return { band: 'LOW', rationale: `Score ${score.toFixed(2)}` };
  } else {
    return { band: 'ABSTAIN', rationale: `Score ${score.toFixed(2)} below LOW threshold` };
  }
}
```

---

## 5. Learning & Calibration Loop

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LEARNING LOOP                                │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Platform   │    │  Classifier  │    │   User Feedback      │  │
│  │    Priors    │    │ Calibration  │    │   (Opt-in only)      │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│         │                   │                       │               │
│         ▼                   ▼                       ▼               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 PRIOR & CALIBRATION STORE                    │  │
│  │   (Anonymized, aggregated, versioned, auditable)             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    INFERENCE ENGINE                          │  │
│  │   (Uses priors for small samples, calibrated classifiers)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Platform Priors: Build & Update Protocol

**What are priors?**
Population-level statistics about content distribution on each platform, derived from anonymized aggregate scan data.

**Prior Structure:**

```typescript
interface PlatformPrior {
  platform: string;
  metric: string;                      // e.g., 'ads_labeled_rate'
  distribution: {
    mean: number;
    std: number;
    p5: number;                        // 5th percentile
    p25: number;
    p50: number;                       // median
    p75: number;
    p95: number;
  };
  sample_size: number;                 // Scans contributing to this prior
  last_updated: string;                // ISO timestamp
  version: string;
}
```

**Build Protocol:**

1. **Data collection:** Only from users who opt-in to "contribute anonymized statistics."
2. **Anonymization:** Strip all PII. Keep only: platform, metric value, item count, timestamp.
3. **Aggregation:** Compute distribution statistics. Require N ≥ 100 scans per platform before publishing prior.
4. **Storage:** Priors stored in `priors.json`, versioned, auditable.

**Update Protocol:**

1. **Frequency:** Weekly batch update.
2. **Smoothing:** Use exponential moving average with α = 0.1 (90% weight on existing prior).
3. **Outlier handling:** Winsorize at 1st and 99th percentile before aggregation.
4. **Version control:** Each update creates new version. Old versions retained for audit.

**Prior Usage:**

```typescript
function applyPrior(
  observed_rate: number,
  observed_n: number,
  prior: PlatformPrior
): { adjusted_rate: number; confidence_boost: number } {
  // Bayesian update: weight observation by sample size
  const prior_weight = 1 / (1 + observed_n / 50);  // Prior fades as N grows
  const adjusted_rate = prior_weight * prior.distribution.mean +
                        (1 - prior_weight) * observed_rate;

  // Confidence boost for being consistent with prior
  const z_score = Math.abs(observed_rate - prior.distribution.mean) / prior.distribution.std;
  const confidence_boost = z_score < 2 ? 0.05 : 0;  // Boost if within 2 std

  return { adjusted_rate, confidence_boost };
}
```

### 5.3 Classifier Calibration

**Problem:** Raw classifier scores are not calibrated probabilities.

**Solution:** Platt scaling (logistic regression) on holdout set.

**Calibration Protocol:**

```typescript
interface CalibrationConfig {
  classifier_id: string;
  calibration_method: 'platt' | 'isotonic' | 'temperature';
  holdout_size: number;                // N items for calibration
  recalibration_trigger: {
    min_new_samples: number;           // Recalibrate after N new labeled samples
    max_age_days: number;              // Or after N days
    drift_threshold: number;           // Or if calibration error exceeds threshold
  };
}
```

**Platt Scaling Implementation:**

```typescript
// After training classifier, fit calibrator on holdout
function fitPlattScaling(
  raw_scores: number[],               // Classifier outputs
  true_labels: boolean[]              // Ground truth
): PlattCalibrator {
  // Fit logistic regression: P(y=1|score) = 1 / (1 + exp(A*score + B))
  const { A, B } = logisticRegression(raw_scores, true_labels);
  return { A, B };
}

function calibrateScore(raw_score: number, calibrator: PlattCalibrator): number {
  return 1 / (1 + Math.exp(calibrator.A * raw_score + calibrator.B));
}
```

**Calibration Metrics:**

| Metric | Definition | Target |
|--------|------------|--------|
| Expected Calibration Error (ECE) | Avg absolute difference between predicted prob and actual freq | ≤ 0.05 |
| Maximum Calibration Error (MCE) | Max difference in any probability bin | ≤ 0.15 |
| Brier Score | Mean squared error of probability predictions | ≤ 0.10 |

### 5.4 User Feedback Integration (Consent-Aware)

**Principle:** Users can optionally validate or correct insights. This feedback improves the system but must not be gameable.

**What Users Can Validate:**

| Feedback Type | User Action | System Response |
|---------------|-------------|-----------------|
| `confirm_ad` | "Yes, this was an ad" | +1 to ad count, update unlabeled→labeled if unlabeled |
| `deny_ad` | "No, this wasn't an ad" | -1 to ad count, flag for review |
| `confirm_creator` | "Yes, this is correct" | +confidence to creator extraction |
| `correct_creator` | "Actually it was @X" | Update creator, flag extraction error |
| `confirm_topic` | "Yes, this topic is right" | +confidence to topic classification |
| `deny_topic` | "This topic is wrong" | Flag for review, don't auto-update |

**Abuse Prevention:**

```typescript
interface FeedbackValidation {
  // Rate limiting
  max_feedback_per_scan: 10;
  max_feedback_per_day: 50;

  // Consistency checking
  min_agreement_with_system: 0.5;      // Flag users who disagree >50%

  // Statistical filtering
  require_consensus: true;             // Single user feedback is "soft signal"
  consensus_threshold: 3;              // Need 3 agreeing users for "hard update"

  // Audit trail
  store_all_feedback: true;            // Never delete, even if not used
  feedback_weight: {
    single_user: 0.1,                  // Low weight
    consensus: 0.5,                    // Medium weight
    expert_review: 1.0                 // Full weight
  };
}
```

**Feedback Update Protocol:**

1. **Soft update:** Single user feedback stored but doesn't change priors.
2. **Consensus update:** 3+ users agree → update prior with weight 0.3.
3. **Expert review:** Flagged items reviewed by team → full update.
4. **Drift detection:** If user feedback systematically disagrees with system, trigger review.

### 5.5 No-External-Model Baseline

**Current state:** AlgorithmLens uses keyword/regex classifiers. No external ML models.

**Baseline guarantees:**
- All classification logic is auditable
- No dependency on external API
- Deterministic: same input → same output
- No data leaves user's device (except opt-in anonymized stats)

**External Model Introduction Path (Future):**

```typescript
interface ExternalModelPolicy {
  // Governance
  require_user_consent: true;
  require_data_minimization: true;
  require_local_fallback: true;        // Must work without external model

  // Integration pattern
  integration_type: 'ENHANCEMENT';      // External model improves, not replaces
  confidence_source: 'LOCAL';           // Confidence from local validation
  disagreement_handling: 'PREFER_LOCAL'; // Local model wins on conflict

  // Audit
  log_all_external_calls: true;
  compare_external_vs_local: true;
  report_divergence_rate: true;
}
```

---

## 6. Adversarial Robustness Plan

### 6.1 Threat Model

| Threat Actor | Motivation | Capability |
|--------------|------------|------------|
| Content creator | Avoid ad disclosure detection | Control text, hashtags, visual content |
| Platform | Obscure ad labeling | Control metadata, UI elements |
| User | Game their own metrics | Control which content is captured |
| Malicious third party | Cause false reports | Inject content into user's feed |

### 6.2 Adversarial Fixture Suite (12 Fixtures)

| # | Fixture ID | Attack Type | Input | Expected Behavior |
|---|------------|-------------|-------|-------------------|
| 1 | `ADV_NEGATION` | Negated disclosure | "This is NOT an ad" on sponsored content | Ignore negation, detect "ad" keyword, flag conflict |
| 2 | `ADV_SARCASM` | Sarcastic disclosure | "Obviously I'm doing this for the exposure, not the $$$" | LOW confidence, do not count as ad |
| 3 | `ADV_UNICODE` | Unicode evasion | "Sp0ns0red" with zero-width chars | Normalize unicode, detect pattern |
| 4 | `ADV_LEET` | Leetspeak evasion | "5p0n50r3d" | Detect leetspeak variants |
| 5 | `ADV_HIDDEN_LABEL` | Obscured platform label | Ad label in tiny font / low contrast | OCR should still extract; if not, rely on metadata |
| 6 | `ADV_FAKE_LABEL` | False ad claim | "This is an ad" on organic content | Require supporting evidence; single claim insufficient for HIGH |
| 7 | `ADV_QUOTE` | Quoted disclosure | 'She said "it\'s sponsored"' | Detect quoted context, downweight |
| 8 | `ADV_MULTILANG` | Language switching | "Publicidad" (Spanish ad label) | Multi-language pattern support |
| 9 | `ADV_POLITICAL_SATIRE` | Satirical political content | "I'm literally Hitler /s" | Detect satire markers, exclude from political count |
| 10 | `ADV_IMPERSONATION` | Fake creator handle | Similar Unicode handle | Normalize handles, detect impersonation patterns |
| 11 | `ADV_BULK_SAME` | Duplicate injection | 50 copies of same post | Detect duplicates, count as 1 |
| 12 | `ADV_TIMING_ATTACK` | Selective capture | User captures only non-ad content | Report coverage limitation, do not extrapolate |

### 6.3 Pass/Fail Criteria

| Fixture | Pass Condition |
|---------|----------------|
| `ADV_NEGATION` | Conflict flag raised; confidence ≤ MED |
| `ADV_SARCASM` | Not counted as ad OR confidence = LOW |
| `ADV_UNICODE` | Pattern detected after normalization |
| `ADV_LEET` | Pattern detected OR flagged as uncertain |
| `ADV_HIDDEN_LABEL` | Either OCR extracts OR metadata provides label |
| `ADV_FAKE_LABEL` | Single claim ≠ HIGH confidence |
| `ADV_QUOTE` | Quoted content downweighted or excluded |
| `ADV_MULTILANG` | Spanish disclosure detected |
| `ADV_POLITICAL_SATIRE` | Satire detected OR confidence ≤ LOW |
| `ADV_IMPERSONATION` | Handles normalized; impersonation flagged |
| `ADV_BULK_SAME` | Duplicates collapsed; count = 1 |
| `ADV_TIMING_ATTACK` | Coverage limitation explicitly stated |

### 6.4 Adversarial Testing Protocol

```typescript
interface AdversarialTestConfig {
  run_frequency: 'every_release';
  fixture_location: 'test/adversarial/';

  scoring: {
    pass_rate_target: 1.0;             // All fixtures must pass
    regression_alert: true;            // Alert on any regression
  };

  evolution: {
    add_new_fixtures: 'quarterly';
    review_real_world_evasions: true;
    red_team_exercise: 'annually';
  };
}
```

---

## 7. Capability Unlock Roadmap

### 7.1 Priority Order

| Priority | Unlock | Impact | Complexity | Risk |
|----------|--------|--------|------------|------|
| 1 | Platform-Specific Priors | HIGH | LOW | LOW |
| 2 | Confidence Intervals | HIGH | MED | LOW |
| 3 | Conflict Resolution Engine | HIGH | MED | MED |
| 4 | Calibrated Classifiers | HIGH | HIGH | MED |
| 5 | Multi-Frame OCR Fusion | MED | HIGH | LOW |
| 6 | Hierarchical Aggregation | MED | MED | MED |
| 7 | Targeted High-Value Extraction | MED | HIGH | LOW |

### 7.2 Detailed Unlock Specifications

#### Unlock 1: Platform-Specific Priors

**Description:** Use aggregate statistics to provide calibrated estimates from small samples.

**Expected Metric Improvements:**
- M1 (Abstention Rate): ↓ 15-25% (fewer abstentions due to small N)
- M4 (Confidence Calibration): ↑ 5-10% (prior-informed estimates more accurate)
- M11 (Abstention Shrink Rate): Strong positive trend

**Prerequisites:**
- Opt-in data collection infrastructure
- Anonymization pipeline
- Prior storage schema

**Risk of Regressions:**
- LOW: Priors only used when local signal weak
- Mitigation: Prior weight decreases with sample size

**Evaluation in Harness:**
```typescript
{
  test_type: 'A/B',
  control: 'no_priors',
  treatment: 'with_priors',
  metrics: ['abstention_rate', 'interval_coverage_accuracy'],
  sample: 'golden_dataset',
  success_criterion: 'abstention_rate ↓ 10% AND coverage_accuracy stable'
}
```

#### Unlock 2: Confidence Intervals

**Description:** Replace point estimates with intervals. Correctness = truth in interval.

**Expected Metric Improvements:**
- M4 (Confidence Calibration): ↑ 20-30% (intervals easier to calibrate than points)
- M12 (Interval Coverage): Target 95%
- M3 (Missed Abstention): ↓ (intervals naturally handle uncertainty)

**Prerequisites:**
- Schema upgrade (done in v3.1)
- Interval calculation functions
- UI updates to display intervals

**Risk of Regressions:**
- LOW: Intervals strictly more informative than points
- Mitigation: Can always report point as [value, value]

**Evaluation in Harness:**
```typescript
{
  test_type: 'direct_measurement',
  metrics: ['interval_coverage_accuracy'],
  sample: 'golden_dataset',
  success_criterion: 'coverage >= 0.93 for 95% CI'
}
```

#### Unlock 3: Conflict Resolution Engine

**Description:** When evidence conflicts, apply precedence rules and output resolved claim with explanation.

**Expected Metric Improvements:**
- M1 (Abstention Rate): ↓ 5-10% (conflicts no longer auto-abstain)
- M2 (Appropriate Abstention): Stable (only appropriate conflicts abstain)
- M5 (Evidence Linking): ↑ (resolution adds evidence chain)

**Prerequisites:**
- Conflict detection (exists)
- Precedence rule definition
- Resolution audit trail

**Risk of Regressions:**
- MED: Wrong resolution = wrong claim
- Mitigation: Conservative precedence; abstain on close calls

**Evaluation in Harness:**
```typescript
{
  test_type: 'fixture_suite',
  fixtures: ['FIX_CONFLICTING_SIGNALS', 'ADV_NEGATION', 'ADV_FAKE_LABEL'],
  metrics: ['conflict_resolution_accuracy'],
  success_criterion: 'resolution_accuracy >= 0.90'
}
```

#### Unlock 4: Calibrated Classifiers

**Description:** Replace keyword/regex with ML classifiers calibrated via Platt scaling.

**Expected Metric Improvements:**
- M4 (Confidence Calibration): ↑ 15-25% (calibrated probabilities)
- M13 (ECE): Target ≤ 0.05
- M1 (Abstention Rate): ↓ 10-15% (soft probabilities vs. hard thresholds)

**Prerequisites:**
- Labeled training data (golden dataset)
- Classifier architecture selection
- Calibration holdout set

**Risk of Regressions:**
- MED: ML introduces opacity
- Mitigation: Keep keyword baseline; require classifier to beat it

**Evaluation in Harness:**
```typescript
{
  test_type: 'A/B',
  control: 'keyword_classifier',
  treatment: 'ml_classifier_calibrated',
  metrics: ['precision', 'recall', 'ECE', 'Brier_score'],
  sample: 'golden_dataset',
  success_criterion: 'F1 ↑ 10% AND ECE ≤ 0.05'
}
```

#### Unlock 5: Multi-Frame OCR Fusion

**Description:** For mobile video, extract text from multiple frames and fuse results.

**Expected Metric Improvements:**
- Coverage (text): ↑ 30-50% for mobile modality
- M1 (Abstention Rate): ↓ 10-20% for mobile scans
- M10 (Cross-Modality Consistency): ↑ (mobile approaches desktop)

**Prerequisites:**
- Multi-frame extraction pipeline
- Temporal consistency scoring
- Frame selection heuristics

**Risk of Regressions:**
- LOW: More frames = more data
- Mitigation: Fusion weights prefer high-quality frames

**Evaluation in Harness:**
```typescript
{
  test_type: 'modality_comparison',
  modalities: ['MOBILE_VIDEO_single_frame', 'MOBILE_VIDEO_multi_frame'],
  metrics: ['text_coverage', 'OCR_accuracy'],
  sample: 'mobile_golden_subset',
  success_criterion: 'coverage ↑ 25% AND accuracy stable'
}
```

#### Unlock 6: Hierarchical Aggregation

**Description:** Aggregate evidence at item → cluster → tab → scan levels, preserving confidence granularity.

**Expected Metric Improvements:**
- M4 (Confidence Calibration): ↑ 5-10% (no confidence dilution)
- M15 (Granular Correctness): New metric, track per-cluster accuracy

**Prerequisites:**
- Cluster definition (exists for topics)
- Hierarchical confidence propagation
- UI for drill-down

**Risk of Regressions:**
- MED: More complexity in confidence calculation
- Mitigation: Test against flat aggregation baseline

**Evaluation in Harness:**
```typescript
{
  test_type: 'A/B',
  control: 'flat_aggregation',
  treatment: 'hierarchical_aggregation',
  metrics: ['confidence_calibration', 'granular_correctness'],
  success_criterion: 'granular_correctness measurable AND calibration stable'
}
```

#### Unlock 7: Targeted High-Value Extraction

**Description:** Build specialized extractors for fields that most often cause abstention.

**Target Fields (by abstention impact):**
1. Creator handle (mobile)
2. Ad disclosure text (mobile)
3. Post timestamp
4. Hashtags (styled text)
5. Verification badge

**Expected Metric Improvements:**
- Coverage (per-field): ↑ 20-40% for target fields
- M1 (Abstention Rate): ↓ 10-15%
- M5 (Evidence Linking): ↑ (more evidence available)

**Prerequisites:**
- Field-specific extraction pipelines
- Training data per field
- Quality metrics per extractor

**Risk of Regressions:**
- LOW: More extraction = more data
- Mitigation: Extractors validated against golden set

**Evaluation in Harness:**
```typescript
{
  test_type: 'field_coverage',
  fields: ['creator_handle', 'ad_disclosure', 'timestamp'],
  metrics: ['field_coverage', 'field_accuracy'],
  sample: 'golden_dataset',
  success_criterion: 'each field coverage ↑ 15% AND accuracy >= 0.90'
}
```

---

## 8. Evaluation Plan v3.1

### 8.1 Golden Dataset Protocol (Expanded)

#### Storage Structure

```
test/golden/
├── manifest.json
├── labeling/
│   ├── instructions.md           # Detailed labeling guide
│   ├── rubrics/                  # Per-claim-type rubrics
│   │   ├── ads.md
│   │   ├── politics.md
│   │   └── ...
│   └── inter_rater/              # Agreement tracking
│       ├── kappa_scores.json
│       └── disagreements.json
├── scans/
│   └── *.json
├── expected/
│   └── *.json
└── annotations/
    └── *.json
```

#### Labeling Instructions (Summary)

**General Principles:**
1. Label what you see, not what you infer
2. When uncertain, mark as "uncertain" rather than guessing
3. Use the rubric for each claim type
4. Document any edge cases encountered

**Ad Labeling Rubric:**

| Label | Criteria |
|-------|----------|
| `labeled_ad` | Platform "Sponsored" / "Ad" label visible |
| `unlabeled_promotion` | Commercial intent clear (discount code, affiliate link, "link in bio" + product) but no platform label |
| `organic` | No commercial signals detected |
| `uncertain` | Ambiguous; could be either |

**Political Labeling Rubric:**

| Label | Criteria |
|-------|----------|
| `political` | Mentions elections, candidates, policy, legislation, political parties, protests |
| `political_adjacent` | Social issues that are politically charged but not explicitly political |
| `not_political` | No political content |
| `uncertain` | Could be interpreted either way |

#### Inter-Rater Reliability Targets

| Claim Type | Cohen's Kappa Target | Resolution |
|------------|----------------------|------------|
| `ads_labeled_rate` | κ ≥ 0.90 | Platform labels are unambiguous |
| `ads_unlabeled_promo_rate` | κ ≥ 0.75 | Some subjectivity in "promotion" |
| `politics_content_rate` | κ ≥ 0.70 | Political vs. adjacent is fuzzy |
| `politics_subtopic` | κ ≥ 0.65 | Subtopics can overlap |
| `creators_identity` | κ ≥ 0.95 | Handles are factual |
| `patterns_topic` | κ ≥ 0.70 | Topics can be ambiguous |

**Disagreement Resolution Protocol:**
1. Two raters label each item independently
2. If disagreement: third rater breaks tie
3. If 3-way disagreement: mark as "ambiguous", exclude from correctness scoring
4. Track disagreement rate per claim type; investigate if > 15%

### 8.2 Metrics (12 Total)

#### HPA Metrics (Hallucination Prevention)

| # | Metric | Definition | Target | Hard/Soft |
|---|--------|------------|--------|-----------|
| M1 | Abstention Rate | abstained / possible | 10-30% | Soft |
| M2 | Appropriate Abstention | correct_abstentions / abstentions | ≥ 95% | Hard |
| M3 | Missed Abstention | should_abstain / generated | ≤ 2% | Hard |
| M5 | Evidence Linking | claims_with_valid_evidence / claims | 100% | Hard |
| M7 | Forbidden Claim Rate | forbidden_claims / claims | 0% | Hard |
| M9 | Phrasing Compliance | compliant_claims / claims | 100% | Hard |

#### CMA Metrics (Correctness Maximization)

| # | Metric | Definition | Target | Hard/Soft |
|---|--------|------------|--------|-----------|
| M4 | Confidence Calibration | HIGH claims correct / HIGH claims | ≥ 90% | Hard |
| M10 | Cross-Modality Consistency | same_result_rate across modalities | ≥ 85% | Soft |
| M11 | Abstention Shrink Rate | (abstention_t - abstention_t-1) / abstention_t-1 | < 0 (decreasing) | Soft |
| M12 | Interval Coverage | truth_in_interval / interval_claims | ≥ 93% for 95% CI | Hard |
| M13 | Calibration Error (ECE) | avg(|predicted_prob - actual_freq|) | ≤ 0.05 | Soft |
| M14 | Adversarial Pass Rate | adversarial_fixtures_passed / total | 100% | Hard |

### 8.3 Phase 5C Success Criteria

#### Hard Requirements (ALL must pass)

**HPA Hard Gates:**
- M2 (Appropriate Abstention) ≥ 95%
- M3 (Missed Abstention) ≤ 2%
- M5 (Evidence Linking) = 100%
- M7 (Forbidden Claims) = 0%
- M9 (Phrasing Compliance) = 100%

**CMA Hard Gates:**
- M4 (Confidence Calibration) ≥ 90%
- M12 (Interval Coverage) ≥ 93%
- M14 (Adversarial Pass Rate) = 100%

#### Soft Requirements (Must meet targets)

- M1 (Abstention Rate) within 10-30%
- M10 (Cross-Modality Consistency) ≥ 85%
- M11 (Abstention Shrink Rate) negative trend over 3 releases
- M13 (Calibration Error) ≤ 0.05

#### Minimum Dataset Requirements

- Golden dataset: ≥ 30 scans
- Each platform: ≥ 5 scans
- Each modality: ≥ 10 scans
- Edge case fixtures: 15 (all passing)
- Adversarial fixtures: 12 (all passing)

### 8.4 Regression Prevention

```typescript
interface RegressionConfig {
  ci_integration: true;

  on_every_pr: {
    run_fixtures: true;
    run_golden_subset: true;           // Random 10 scans
    hard_metrics_must_pass: true;
    block_on_regression: true;
  };

  on_every_release: {
    run_full_golden_dataset: true;
    run_adversarial_suite: true;
    generate_metrics_report: true;
    compare_to_previous_release: true;
    alert_on_soft_regression: true;
  };

  quarterly: {
    expand_golden_dataset: true;
    review_abstention_reasons: true;
    update_priors: true;
    recalibrate_classifiers: true;
  };
}
```

---

## Appendix A: Schema Version Migration

### From v3.0 to v3.1

| v3.0 Field | v3.1 Field | Migration |
|------------|------------|-----------|
| `confidence_band` | `confidence_band` | Unchanged |
| — | `numeric_confidence` | Add: calculate from band (LOW=0.45, MED=0.65, HIGH=0.85) |
| — | `uncertainty_interval` | Add: null initially; populate when interval calculation available |
| — | `estimate_type` | Add: infer from claim_type |
| — | `claim_status` | Add: FINAL for generated, ABSTAIN for abstained |
| — | `method_reliability` | Add: lookup from METHOD_RELIABILITY table |

### Backwards Compatibility

v3.1 outputs include all v3.0 fields. v3.0 consumers can ignore new fields.

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **HPA** | Hallucination Prevention Architecture |
| **CMA** | Correctness Maximization Architecture |
| **Abstention** | Choosing not to make a claim due to insufficient evidence |
| **Confidence Band** | Categorical confidence: LOW, MED, HIGH |
| **Numeric Confidence** | Continuous confidence: 0.0–1.0 |
| **Interval Coverage** | Fraction of intervals that contain ground truth |
| **ECE** | Expected Calibration Error |
| **Prior** | Population-level statistic used to inform small-sample estimates |
| **Platt Scaling** | Calibration method using logistic regression |

---

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 3.0 | 2025-01-06 | Opus 4.5 | Initial accuracy architecture |
| 3.1 | 2025-01-06 | Opus 4.5 | Added CMA, intervals, priors, adversarial plan, learning loop |

---

*This document targets BOTH hallucination prevention AND correctness maximization. Phase 5C success requires passing ALL hard gates from both architectures.*
