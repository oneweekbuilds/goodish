# Accuracy Architecture Contract

> **Version:** 1.1.0
> **Last Updated:** 2025-12-18
> **Status:** BINDING — All classifiers MUST comply
> **Scope:** All current and future detection/classification modules in AlgorithmLens

---

## Purpose

This document defines the **Accuracy Architecture Contract** — a set of enforceable rules that ALL classifiers in AlgorithmLens must obey. This is not guidance; these are hard requirements.

**Goal:** Make accuracy feel shockingly good while remaining conservative, explainable, and ethical.

**Philosophy:** It is better to say "we don't know" than to be confidently wrong.

---

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Instagram | ✅ Supported | Full classification |
| Twitter/X | ✅ Supported | Full classification |
| YouTube | ✅ Supported | Full classification |
| TikTok | ✅ Supported | Full classification |
| Facebook | ❌ Not Supported | Coming soon — MUST be excluded from all classifiers |

**Rule:** Any classifier receiving Facebook data MUST return `platform_not_supported` status and refuse to classify.

---

## 1. Accuracy Dimensions

AlgorithmLens accuracy is measured across four distinct dimensions. Each has specific requirements.

### 1.1 Detection Accuracy

**Definition:** Is this content correctly identified as ads, politics, etc.?

| Requirement | Rule |
|-------------|------|
| Multi-signal mandate | Classification MUST use ≥2 independent signals for HIGH confidence |
| Explicit evidence | Every classification MUST cite specific matched patterns |
| Hierarchical classification | Classifiers MUST check signals in priority order |
| No false precision | When signals conflict, classify as AMBIGUOUS, not "best guess" |

**Measurement:**
- True positive rate: Content correctly identified
- False positive rate: Organic content wrongly flagged
- False negative rate: Commercial/political content missed

### 1.2 Evidence Accuracy

**Definition:** Are we showing what we actually observed?

| Requirement | Rule |
|-------------|------|
| Observable only | Claims MUST be derived from captured feed data |
| Traceable evidence | Every claim MUST map to specific Evidence Bundle fields |
| No inference leakage | Detection methods MUST NOT leak into user-facing copy without transformation |
| Verbatim preservation | Matched patterns MUST be preserved exactly as found |

**Measurement:**
- Every displayed insight must trace to ≥1 bundle field
- Zero claims without explicit evidence citation

### 1.3 Coverage Honesty

**Definition:** What could we vs. could not observe?

| Requirement | Rule |
|-------------|------|
| Explicit gaps | Missing data MUST be surfaced in `limits` section |
| No silent failures | Failed extraction MUST produce visible limitations |
| Coverage metrics | Every bundle MUST include `coverage_percent` field |
| Exclusion transparency | Items excluded from metrics MUST be documented |

**Measurement:**
- `coverage_percent` = `high_confidence_items / total_items × 100`
- All exclusions documented in `limits.commercial_analysis_exclusions`

### 1.4 Confidence Calibration

**Definition:** When do we say HIGH vs MEDIUM vs UNKNOWN?

| Requirement | Rule |
|-------------|------|
| Defined thresholds | Each confidence level has explicit, documented requirements |
| No optimistic rounding | Partial evidence = lower confidence, not "probably HIGH" |
| Confidence gating | Only HIGH confidence items in primary metrics |
| Calibration honesty | If unsure about confidence, use lower level |
| UNKNOWN as user-facing tier | Any result below MEDIUM MUST surface as UNKNOWN to users |

**Confidence Tiers (internal → user-facing):**
- HIGH → HIGH (surfaced in metrics)
- MEDIUM → MEDIUM (documented, not in primary metrics)
- LOW → UNKNOWN (surfaced as "we don't know")
- UNKNOWN → UNKNOWN (explicit insufficient evidence)

**Measurement:**
- Confidence distribution per classifier
- Calibration accuracy: Do HIGH confidence items prove correct?

---

## 2. Prohibited Behaviors

These behaviors are **FORBIDDEN** in all classifiers. Violations are blocking errors.

### 2.1 Single-Signal Decisions

**PROHIBITED:** Making HIGH confidence classifications from one signal type alone.

```python
# FORBIDDEN - single signal HIGH confidence
if keyword_match:
    return Classification(confidence="high")  # WRONG

# REQUIRED - multi-signal for HIGH
if keyword_match and (structure_match or metadata_confirm):
    return Classification(confidence="high")  # CORRECT
```

**Exceptions:**
- Platform `is_ad=True` metadata (platform has already validated)
- Explicit disclosure tokens ("Sponsored", "Ad", "#ad") with exact match

**Rationale:** Single signals are brittle. Keywords appear in organic content. OCR has errors. Vision misinterprets. Multi-signal corroboration is required.

### 2.2 Identity-Based Claims

**PROHIBITED:** Inferring or stating user beliefs, affiliations, preferences, or intent.

| Never Infer | Example Violation | Why Prohibited |
|-------------|-------------------|----------------|
| User beliefs | "You believe in X" | Cannot read minds |
| User interests | "You're interested in Y" | Exposure ≠ interest |
| User identity | "You are a Z type person" | Feed doesn't define identity |
| User intent | "You want to buy X" | Cannot know intent |
| Political affiliation | "You lean left/right" | Exposure ≠ affiliation |

**Rule:** The phrase "You are" or "You believe" MUST NEVER appear in any output.

### 2.3 Silent Failures

**PROHIBITED:** Failing to extract/classify without visible acknowledgment.

```python
# FORBIDDEN - silent failure
def extract_text(item):
    try:
        return ocr_extract(item)
    except:
        return ""  # WRONG - silent failure

# REQUIRED - documented failure
def extract_text(item):
    try:
        return ocr_extract(item), None
    except OcrError as e:
        return "", f"OCR extraction failed: {e}"  # CORRECT - failure tracked
```

**Rule:** Every extraction failure MUST:
1. Be counted in metadata
2. Appear in Evidence Bundle `limits` section
3. Reduce `coverage_percent` appropriately

### 2.4 Overconfident Language

**PROHIBITED:** Using certainty language when evidence is partial.

| Forbidden | Required Alternative |
|-----------|---------------------|
| "This proves..." | "This is consistent with..." |
| "Definitely..." | "In this scan..." |
| "You will see..." | "If patterns continue..." |
| "The algorithm wants..." | "Content with X patterns appeared..." |
| "Shows that you..." | "Showed that content with..." |

**Rule:** Certainty language is ONLY permitted when:
- Citing exact counts ("12 posts contained...")
- Stating platform metadata ("Platform labeled as Ad")
- Describing direct observations ("Video format appeared")

### 2.5 Platform/Algorithm Intent Claims

**PROHIBITED:** Claiming to know why algorithms show content.

```
# FORBIDDEN
"The algorithm is pushing political content"
"Instagram wants you to see more ads"
"The platform thinks you like this"

# PERMITTED
"Political content appeared more frequently in this scan"
"Ad frequency in this sample was higher than average"
"Content with these topics appeared repeatedly"
```

**Rationale:** We capture what was shown, not why. Platform internals are opaque.

---

## 3. Confidence Tier Requirements

Each confidence level has **hard requirements** that MUST be met.

**The Four Confidence Tiers:**
| Tier | Internal Use | User-Facing | In Primary Metrics |
|------|--------------|-------------|-------------------|
| HIGH | ✅ | HIGH | ✅ Yes |
| MEDIUM | ✅ | MEDIUM | ❌ No |
| LOW | Internal only | → UNKNOWN | ❌ No |
| UNKNOWN | ✅ | UNKNOWN | ❌ No |

**CRITICAL RULE:** Any result below MEDIUM MUST surface to users as **UNKNOWN**, not LOW. The term "LOW" is internal only.

### 3.1 HIGH Confidence

**Definition:** Reliable enough to appear in primary metrics and user-facing summaries.

**Requirements (must meet ≥1):**

| Criterion | Description |
|-----------|-------------|
| 2+ independent modalities | Different signal types (e.g., OCR + structure, keyword + metadata) |
| 1 modality + strong corroboration | Single strong signal with supporting context |
| Platform attestation | Platform explicitly labeled (is_ad=True) |
| Regulatory disclosure | Exact match on disclosure tokens ("Sponsored", "#ad") |

**Examples of HIGH confidence evidence:**
- `is_ad=True` from platform metadata
- OCR finds "Sponsored" + account has verified badge
- "use code SAVE20" + "link in bio" (discount + CTA)
- "paid partnership with @Brand" (explicit disclosure)

### 3.2 MEDIUM Confidence

**Definition:** Informative but excluded from top-line metrics. Documented separately.

**Requirements:**

| Criterion | Description |
|-----------|-------------|
| 1 strong signal | Single clear indicator without corroboration |
| 2+ weak signals | Multiple low-strength indicators together |
| Partial corroboration | One signal with ambiguous supporting evidence |

**Treatment:**
- Documented in Evidence Bundle
- NOT included in stacked bar charts
- NOT included in percentages shown to users
- Available in debug/detailed views

**Examples of MEDIUM confidence:**
- Single CTA ("shop now") without price/discount context
- Multiple weak promotional keywords without explicit commerce
- Brand mention without clear promotional context

### 3.3 UNKNOWN Confidence (User-Facing Tier)

**Definition:** Insufficient evidence to make a determination. This is the user-facing representation of uncertainty.

**UNKNOWN MUST be used when ANY of these conditions apply:**

| Condition | Description |
|-----------|-------------|
| Insufficient evidence | Cannot meet MEDIUM threshold |
| Missing critical modality | Required signal type unavailable (e.g., no OCR text) |
| Unresolved signal conflict | Signals contradict each other |
| Insufficient coverage | Below minimum eligible item/percentage thresholds |
| Single weak signal | One ambiguous indicator (internal: LOW) |
| Extraction failure | Text/metadata extraction failed |

**Treatment:**
- Surfaced to users explicitly as "We don't know" or equivalent
- Reason for UNKNOWN MUST be documented in `limits` section
- Counted in `limits.unknown_items` with reason codes
- NEVER presented as a determination

**Examples requiring UNKNOWN:**
- Single generic keyword ("sale") without context → UNKNOWN (reason: single_weak_signal)
- OCR extraction failed for >50% of frames → UNKNOWN (reason: missing_modality)
- Conflicting signals (ad token found + non-commercial structure) → UNKNOWN (reason: signal_conflict)
- Only 3 items in scan → UNKNOWN (reason: insufficient_coverage)

### 3.4 LOW Confidence (Internal Only)

**Definition:** Internal classification tier that MUST be mapped to UNKNOWN for user-facing output.

**Rule:** LOW is used internally for classification logic but MUST NEVER appear in user-facing output. All LOW results become UNKNOWN when surfaced.

| Internal State | User-Facing Output |
|----------------|-------------------|
| LOW | → UNKNOWN |
| LOW + reason | → UNKNOWN + reason |

**Why this distinction exists:** Internal classifiers need to distinguish between "weak signal" (LOW) and "no signal at all" (UNKNOWN) for debugging and improvement. Users only need to know "we're uncertain."

---

## 4. Coverage Contract

Feed-level summaries and aggregate metrics require sufficient data to be meaningful. This section defines the **Coverage Contract** — threshold-agnostic rules that determine when results can be surfaced.

### 4.1 Coverage Requirements

**Rule:** Feed-level summaries require BOTH:
1. A **minimum eligible item count** (to be defined per classifier)
2. A **minimum eligible percentage** of scanned items (to be defined per classifier)

**If EITHER requirement is unmet:**
- The output MUST be **UNKNOWN**
- The reason MUST be surfaced in `limits.coverage_insufficiency`
- Primary metrics MUST NOT be displayed

### 4.2 Coverage Insufficiency Reasons

When coverage is insufficient, the specific reason MUST be documented:

| Reason Code | Description |
|-------------|-------------|
| `low_item_count` | Total items below minimum threshold |
| `low_eligible_percentage` | Percentage of classifiable items below threshold |
| `high_exclusion_rate` | Too many items excluded from analysis |
| `missing_modalities` | Required signal types unavailable for too many items |
| `extraction_failures` | Text/metadata extraction failed for too many items |

### 4.3 Coverage Reporting

Every Evidence Bundle MUST include coverage information:

```typescript
interface CoverageReport {
  // Counts
  total_items: number;
  eligible_items: number;
  excluded_items: number;

  // Percentages
  eligible_percent: number;
  coverage_percent: number;  // high-confidence / total

  // Sufficiency determination
  is_sufficient: boolean;
  insufficiency_reasons: string[];  // Empty if sufficient
}
```

### 4.4 Coverage Gating Rules

| Metric Type | Coverage Requirement |
|-------------|---------------------|
| Primary percentages | MUST meet both count and percentage thresholds |
| Stacked bar charts | MUST meet both count and percentage thresholds |
| Top-N lists | MUST meet count threshold |
| Topic distributions | MUST meet both thresholds |
| Trend analysis | MUST meet thresholds AND have ≥3 data points |

**Rule:** When coverage is insufficient, the UI MUST show "Insufficient data" rather than partial results.

### 4.5 Threshold Definition (Deferred)

Specific numeric thresholds are NOT defined in this contract. They will be determined per classifier based on:
- Statistical reliability requirements
- Platform-specific considerations
- Source-type characteristics

**What IS defined:** The rule structure. Thresholds MUST be:
- Documented per classifier
- Enforced programmatically
- Surfaced when unmet

---

## 5. Modality Authority & Limits

Each modality (signal source) has specific capabilities and limitations. Using a modality beyond its authority is a **contract violation**.

### 5.1 Modality Definitions

| Modality | Source | Primary Use |
|----------|--------|-------------|
| Text | OCR, captions, hashtags | Content analysis |
| Vision | Image/video analysis | Context detection |
| Audio | Speech recognition | Spoken content |
| Metadata | Platform data, DOM | Structural signals |

### 5.2 Modality Authority Matrix

#### Text Modality

| CAN Determine | CANNOT Determine |
|---------------|------------------|
| Topic presence (keywords) | User intent |
| Disclosure labels ("Sponsored", "#ad") | Why content was posted |
| Explicit statements | Sarcasm or irony |
| Commercial language (prices, CTAs) | Truthfulness of claims |
| Political keywords | Political beliefs of creator |
| Entity mentions | Relationships between entities |

**Rule:** Text signals MUST NOT be used to infer intent, beliefs, or meaning beyond literal content.

#### Vision Modality

| CAN Determine | CANNOT Determine |
|---------------|------------------|
| Political context (flags, symbols, rallies) | Political intent |
| Commercial context (product displays, stores) | Purchase intent |
| Setting/environment | User location |
| Visual disclosure labels | Hidden or obscured labels |
| Format type (video, image, carousel) | Why format was chosen |

**Rule:** Vision signals MUST NOT be used to infer identity, beliefs, or intent from visual appearance.

#### Audio Modality

| CAN Determine | CANNOT Determine |
|---------------|------------------|
| Spoken disclosures ("sponsored by") | Tone or emotional state |
| Spoken promotional language | Sincerity of endorsement |
| Spoken political statements | Political beliefs of speaker |
| Presence of speech | Quality of speech (only if detected) |

**Rule:** Audio signals are ONLY valid if speech was successfully detected and transcribed. Absence of audio detection = missing modality.

#### Metadata Modality

| CAN Determine | CANNOT Determine |
|---------------|------------------|
| Platform ad labels (is_ad=True) | Why platform labeled it |
| Creator handle/ID | Creator intent |
| Engagement counts | User behavior |
| Timestamp | Causal relationships |
| Advertiser info (when provided) | Advertiser goals |

**Rule:** Metadata is the **highest-trust source** for disclosures and creator identity. Platform attestation (is_ad=True) can support HIGH confidence alone.

### 5.3 Modality Violations

The following are **CONTRACT VIOLATIONS**:

| Violation | Example | Why Prohibited |
|-----------|---------|----------------|
| Intent inference from text | "User wants to buy X" from promotional keywords | Text shows presence, not intent |
| Identity inference from vision | "User is political" from rally images | Vision shows content, not identity |
| Belief inference from any modality | "Creator believes Y" from statements | Cannot verify beliefs |
| Missing modality ignored | Classifying without noting OCR failure | Silent failure prohibited |
| Cross-modality overreach | Using text keywords to infer visual content | Each modality has bounds |

### 5.4 Modality Availability Reporting

Every classification MUST report which modalities were available:

```typescript
interface ModalityAvailability {
  text: {
    available: boolean;
    source: 'ocr' | 'caption' | 'hashtag' | null;
    extraction_quality: 'good' | 'partial' | 'failed';
  };
  vision: {
    available: boolean;
    analyzed: boolean;
  };
  audio: {
    available: boolean;
    speech_detected: boolean;
  };
  metadata: {
    available: boolean;
    fields_present: string[];
  };
}
```

**Rule:** Missing modalities MUST be reported as epistemic boundaries.

---

## 6. Epistemic Boundaries (Clarified)

Epistemic boundaries define what the system fundamentally cannot know. Every surfaced bundle MUST include at least two epistemic boundaries.

### 6.1 What Counts as an Epistemic Boundary

An epistemic boundary is a **fundamental limitation on knowledge**, not a data quality issue.

| Category | Examples | Is Epistemic Boundary? |
|----------|----------|----------------------|
| Missing modality | "Audio not available for this scan" | ✅ Yes |
| Low-confidence extraction | "OCR quality was poor for 40% of items" | ✅ Yes |
| Conflicting signals | "Commercial and non-commercial signals both present" | ✅ Yes |
| Platform limitations | "Platform does not expose advertiser data" | ✅ Yes |
| Coverage insufficiency | "Only 5 items available for analysis" | ✅ Yes |
| Algorithm opacity | "Cannot know why content was shown" | ✅ Yes |
| User state unknown | "Cannot know how user interacted" | ✅ Yes |
| Intent unknown | "Cannot infer creator intent" | ✅ Yes |
| Small sample | "Patterns may not be representative" | ⚠️ Partial (data quality) |
| Classification error | "Some items may be misclassified" | ❌ No (accuracy issue) |

### 6.2 Required Epistemic Boundaries

Every Evidence Bundle MUST include **at least two** from this list:

| Boundary | When Required |
|----------|--------------|
| "We cannot know why the algorithm showed this content" | Always |
| "Content presence does not indicate your beliefs or preferences" | Always |
| "We cannot see how you interacted with this content" | Always |
| "This represents one scroll session, not your full feed" | Single scan |
| "[Modality] was not available for this analysis" | When modality missing |
| "Some items could not be classified with high confidence" | When coverage < 100% |
| "Conflicting signals prevented determination for N items" | When conflicts exist |
| "[Platform] does not expose [data type]" | When platform limits apply |

### 6.3 Epistemic Boundary Structure

```typescript
interface EpistemicBoundary {
  category:
    | 'missing_modality'
    | 'low_confidence_extraction'
    | 'signal_conflict'
    | 'platform_limitation'
    | 'coverage_insufficiency'
    | 'algorithm_opacity'
    | 'user_state_unknown'
    | 'intent_unknown';

  description: string;  // Human-readable explanation
  affected_items?: number;  // How many items affected
  severity: 'fundamental' | 'significant' | 'minor';
}
```

### 6.4 Epistemic Boundary Validation

```python
def validate_epistemic_boundaries(bundle: Dict) -> List[str]:
    errors = []
    boundaries = bundle.get("limits", {}).get("epistemic_boundaries", [])

    # Must have at least 2
    if len(boundaries) < 2:
        errors.append("BLOCKING: Bundle requires ≥2 epistemic boundaries")

    # Must include at least one fundamental boundary
    fundamental = [
        "cannot know why",
        "does not indicate",
        "cannot see how you interacted"
    ]
    has_fundamental = any(
        any(f in b.lower() for f in fundamental)
        for b in boundaries
    )
    if not has_fundamental:
        errors.append("CRITICAL: Bundle should include fundamental epistemic boundary")

    return errors
```

---

## 7. What We Can Never Know

These unknowns MUST be acknowledged in every Evidence Bundle's `limits` section.

### 7.1 Fundamental Unknowns

| Unknown | Why Unknown | Required Acknowledgment |
|---------|-------------|------------------------|
| Ads without disclosure | No visible/spoken label | "Ads without disclosure labels cannot be detected" |
| Political intent | Requires mind-reading | "Political intent cannot be inferred from content presence" |
| User engagement | Not captured in scan | "We cannot see how you interacted with this content" |
| Algorithm reasoning | Platform internal | "We cannot know why this content was shown" |
| User beliefs | Not observable | "Content exposure does not indicate beliefs" |
| Full feed history | Only captured moment | "This represents one scroll session, not your full feed" |
| Content you scrolled past | Not captured | "Items viewed but not captured are not included" |

### 7.2 Per-Source-Type Limitations

#### MOBILE_VIDEO Scans
```
limits.mobile_video_specific:
  - "OCR accuracy varies with video quality and text size"
  - "Brief on-screen labels may not be captured"
  - "Audio disclosures are not detected"
  - "Ads without visual 'Sponsored' label cannot be identified"
```

#### DESKTOP_EXTENSION Scans
```
limits.desktop_extension_specific:
  - "DOM structure varies by platform version"
  - "Dynamic content may not be fully captured"
  - "Private browsing may affect ad targeting"
```

### 7.3 Platform-Specific Limitations

#### Instagram
```
limits.instagram_specific:
  - "Story ads may have different disclosure patterns"
  - "Shopping tags may not be visible in all contexts"
```

#### TikTok
```
limits.tiktok_specific:
  - "In-feed ads have rapid disclosure labels"
  - "Creator marketplace disclosures vary by region"
```

#### YouTube
```
limits.youtube_specific:
  - "Sponsor segments within videos are not detected"
  - "Pre-roll ads are not captured in feed scans"
```

#### Twitter/X
```
limits.twitter_specific:
  - "'Promoted' labels may vary by interface version"
  - "Spaces and audio content are not analyzed"
```

---

## 8. Classifier Contract Interface

All classifiers MUST implement this interface:

```python
@dataclass
class ClassificationResult:
    """Required output structure for all classifiers."""

    # Primary classification
    classification: str  # e.g., "labeled_ad", "political", "non_commercial"
    confidence: Literal["high", "medium", "low", "unknown"]  # LOW → UNKNOWN for user-facing

    # Evidence (REQUIRED - cannot be empty for HIGH confidence)
    detection_methods: List[str]  # Which methods fired
    evidence: List[str]  # Human-readable evidence citations
    matched_patterns: List[str]  # Exact patterns matched

    # Metadata
    classifier_name: str  # e.g., "commercial_classifier_v3"
    classifier_version: str  # Semantic version

    def validate(self) -> List[str]:
        """Returns list of validation errors. Empty = valid."""
        errors = []

        # HIGH confidence requires evidence
        if self.confidence == "high" and len(self.evidence) == 0:
            errors.append("HIGH confidence requires ≥1 evidence citation")

        # HIGH confidence requires ≥2 detection methods OR platform attestation
        if self.confidence == "high":
            is_platform_attested = "platform_label" in self.detection_methods
            has_multi_signal = len(self.detection_methods) >= 2
            if not (is_platform_attested or has_multi_signal):
                errors.append("HIGH confidence requires multi-signal or platform attestation")

        return errors
```

### 8.1 Required Classifier Methods

Every classifier MUST implement:

```python
class BaseClassifier(ABC):
    """Abstract base for all AlgorithmLens classifiers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique classifier identifier."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Semantic version string."""
        pass

    @property
    @abstractmethod
    def supported_platforms(self) -> List[str]:
        """Platforms this classifier supports."""
        pass

    @abstractmethod
    def classify(self, item: Dict[str, Any]) -> ClassificationResult:
        """Classify a single feed item."""
        pass

    @abstractmethod
    def get_limitations(self) -> List[str]:
        """Return classifier-specific limitations for limits section."""
        pass

    def validate_platform(self, platform: str) -> bool:
        """Check if platform is supported. MUST reject Facebook."""
        if platform.lower() == "facebook":
            return False  # Facebook explicitly not supported
        return platform.lower() in [p.lower() for p in self.supported_platforms]
```

---

## 9. Evidence Bundle Requirements

Every Evidence Bundle MUST contain these sections:

### 9.1 Required Structure

```typescript
interface EvidenceBundle {
  // REQUIRED: Scan context
  meta: {
    scan_id: string | null;
    platform: string;  // Must be in supported_platforms
    n_items: number;
    source_type: "MOBILE_VIDEO" | "DESKTOP_EXTENSION";
    generated_at: string;  // ISO timestamp
  };

  // REQUIRED: Observable facts only
  observations: {
    [key: string]: number | string | object;
  };

  // REQUIRED: Classifier outputs with quality flags
  measurements: {
    [key: string]: {
      value: any;
      method: string;  // "classifier:<name>" or "heuristic"
      quality: "ok" | "low_sample" | "missing_fields" | "model_low_confidence" | "insufficient_signal";
      notes: string | null;
      threshold_rule?: string;  // e.g., "count >= 2 AND high_confidence >= 1"
    };
  };

  // REQUIRED: What we cannot know
  limits: {
    epistemic_boundaries: string[];  // Fundamental unknowns
    sample_limitations: string[];    // Sample size issues
    extraction_limitations: string[]; // OCR/extraction issues
    platform_limitations: string[];   // Platform-specific gaps
    exclusions: string[];            // Items excluded from metrics
  };
}
```

### 9.2 Limits Section Requirements

The `limits` section MUST include:

1. **Epistemic boundaries** (at least 2):
   - "We cannot know why the algorithm showed this content"
   - "Content exposure does not indicate your beliefs or preferences"

2. **Sample limitations** (if applicable):
   - If n_items < 10: "Sample size too small for reliable patterns"
   - If coverage_percent < 80: "Some items could not be classified with high confidence"

3. **Extraction limitations** (source-type specific):
   - MOBILE_VIDEO: OCR extraction rate and limitations
   - DESKTOP_EXTENSION: DOM parsing limitations

4. **Exclusions** (always):
   - Count of items excluded from primary metrics
   - Reason for exclusion (low confidence, ambiguous, etc.)

---

## 10. Validation Rules

### 10.1 Pre-Classification Validation

Before classifying, MUST verify:

```python
def pre_classify_validation(item: Dict, platform: str) -> List[str]:
    errors = []

    # Platform check
    if platform.lower() == "facebook":
        errors.append("BLOCKING: Facebook not supported")

    # Minimum data check
    if not item.get("content_text") and not item.get("ad_metadata"):
        errors.append("WARNING: No content or metadata available")

    return errors
```

### 10.2 Post-Classification Validation

After classifying, MUST verify:

```python
def post_classify_validation(result: ClassificationResult) -> List[str]:
    errors = result.validate()

    # No identity claims in evidence
    identity_patterns = ["you are", "you believe", "you want", "your personality"]
    for e in result.evidence:
        if any(p in e.lower() for p in identity_patterns):
            errors.append(f"BLOCKING: Identity claim in evidence: {e}")

    return errors
```

### 10.3 Bundle Validation

Before returning bundle, MUST verify:

```python
def validate_bundle(bundle: Dict) -> List[str]:
    errors = []

    # Limits section required
    if not bundle.get("limits"):
        errors.append("BLOCKING: Bundle missing limits section")

    # Epistemic boundaries required
    if len(bundle.get("limits", {}).get("epistemic_boundaries", [])) < 2:
        errors.append("BLOCKING: Bundle requires ≥2 epistemic boundaries")

    # Coverage metric required
    if "coverage_percent" not in str(bundle.get("observations", {})):
        errors.append("WARNING: Bundle should include coverage_percent")

    return errors
```

---

## 11. Compliance Checklist

Use this checklist for every new classifier or major update:

### Pre-Development
- [ ] Platform scope defined (Facebook explicitly excluded)
- [ ] Confidence tier criteria documented
- [ ] Multi-signal requirements specified
- [ ] Known limitations enumerated

### Implementation
- [ ] Implements BaseClassifier interface
- [ ] Returns ClassificationResult structure
- [ ] HIGH confidence requires ≥2 signals OR platform attestation
- [ ] All classifications include evidence citations
- [ ] No identity-based language in any output
- [ ] Silent failures impossible (all errors tracked)
- [ ] Coverage metrics computed

### Testing
- [ ] Validation passes on sample data
- [ ] Edge cases return AMBIGUOUS, not false positives
- [ ] Facebook data rejected with clear error
- [ ] Limits section populated correctly

### Documentation
- [ ] Classifier limitations documented
- [ ] Confidence criteria documented
- [ ] Example classifications provided
- [ ] Integration with Evidence Bundle documented

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-18 | Initial Accuracy Architecture Contract |
| 1.1.0 | 2025-12-18 | Added UNKNOWN tier, Coverage Contract, Modality Authority, Epistemic Boundaries clarification |

---

## 13. Related Documents

- [accuracy_contract.md](./accuracy_contract.md) - Language and presentation rules (v2.0)
- [evidence_bundles.md](./evidence_bundles.md) - Bundle structure and generation
- [classifier_checklist.md](./classifier_checklist.md) - Implementation checklist
- [classifier_guidance.md](./classifier_guidance.md) - Detailed guidance for new classifiers

---

## Enforcement

This contract is **BINDING**. Violations are classified as:

| Severity | Example | Required Action |
|----------|---------|-----------------|
| BLOCKING | Single-signal HIGH confidence | Deployment blocked |
| BLOCKING | Identity claim in output | Deployment blocked |
| BLOCKING | Facebook classification attempted | Deployment blocked |
| CRITICAL | Missing limits section | Must fix before merge |
| WARNING | Coverage metric missing | Should fix before merge |

**Automated enforcement is planned.** Until then, code review MUST verify compliance.
