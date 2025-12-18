# Classifier Development Guidance

> **Version:** 1.0.0
> **Last Updated:** 2025-12-18
> **Purpose:** How to build new classifiers that comply with the Accuracy Architecture Contract

---

## Overview

This document explains how to build classifiers for AlgorithmLens that comply with the [Accuracy Architecture Contract](./accuracy_architecture.md). It provides practical guidance, code patterns, and examples.

**Before building a new classifier, read:**
1. [accuracy_architecture.md](./accuracy_architecture.md) - The binding contract
2. [classifier_checklist.md](./classifier_checklist.md) - Compliance checklist
3. [accuracy_contract.md](./accuracy_contract.md) - Language and presentation rules
4. [evidence_bundles.md](./evidence_bundles.md) - Bundle structure

---

## Classifier Types in AlgorithmLens

### Current Classifiers

| Classifier | Purpose | Status |
|------------|---------|--------|
| Commercial Classifier | Ads, promotions, sponsored content | v3.0 Gold Standard |
| Political Classifier | Political content detection | Planned |
| Patterns Classifier | Feed structure analysis | Planned |
| Creators Classifier | Creator diversity analysis | Planned |

### Classifier Categories

1. **Content Classifiers** - Analyze what content is about
   - Commercial intent
   - Political content
   - Topic categories

2. **Structure Classifiers** - Analyze feed patterns
   - Repetition detection
   - Temporal patterns
   - Format distribution

3. **Entity Classifiers** - Extract named entities
   - Companies/brands
   - Creators/accounts
   - Topics/categories

---

## Building a New Classifier

### Step 1: Define Classification Output

Before writing code, define your classification categories and confidence criteria.

```python
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Literal

class MyClassificationType(str, Enum):
    """Define all possible classification outputs."""
    TYPE_A = "type_a"
    TYPE_B = "type_b"
    TYPE_C = "type_c"
    AMBIGUOUS = "ambiguous"
    NONE = "none"

@dataclass
class MyClassificationResult:
    """Classification result following contract requirements."""

    # Primary classification
    classification: MyClassificationType
    confidence: Literal["high", "medium", "low"]

    # Evidence (REQUIRED for HIGH confidence)
    detection_methods: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)
    matched_patterns: List[str] = field(default_factory=list)

    # Metadata
    classifier_name: str = "my_classifier"
    classifier_version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "classification": self.classification.value,
            "confidence": self.confidence,
            "detection_methods": self.detection_methods,
            "evidence": self.evidence,
            "matched_patterns": self.matched_patterns,
            "classifier_name": self.classifier_name,
            "classifier_version": self.classifier_version,
        }

    def validate(self) -> List[str]:
        """Validate against Accuracy Architecture Contract."""
        errors = []

        # HIGH confidence requires evidence
        if self.confidence == "high" and len(self.evidence) == 0:
            errors.append("HIGH confidence requires ≥1 evidence citation")

        # HIGH confidence requires multi-signal OR specific exceptions
        if self.confidence == "high":
            is_platform_attested = "platform_label" in self.detection_methods
            has_multi_signal = len(set(self.detection_methods)) >= 2
            if not (is_platform_attested or has_multi_signal):
                errors.append("HIGH confidence requires multi-signal or platform attestation")

        # No identity claims in evidence
        identity_patterns = ["you are", "you believe", "you want", "your personality"]
        for e in self.evidence:
            if any(p in e.lower() for p in identity_patterns):
                errors.append(f"Identity claim in evidence: {e}")

        return errors
```

### Step 2: Define Detection Methods

List all signals your classifier will check. Group them by strength.

```python
from typing import List
import re

# HIGH-strength signals (can contribute to HIGH confidence)
HIGH_STRENGTH_PATTERNS = {
    "method_a": [
        r"pattern_one",
        r"pattern_two",
    ],
    "method_b": [
        r"another_pattern",
    ],
}

# MEDIUM-strength signals (can only reach MEDIUM confidence alone)
MEDIUM_STRENGTH_PATTERNS = {
    "method_c": [
        r"weaker_pattern",
    ],
}

# LOW-strength signals (informative but not decisive)
LOW_STRENGTH_PATTERNS = {
    "method_d": [
        r"common_word",
    ],
}

# Compile patterns
def compile_patterns(pattern_dict: dict) -> dict:
    return {
        method: [re.compile(p, re.IGNORECASE) for p in patterns]
        for method, patterns in pattern_dict.items()
    }

HIGH_PATTERNS_COMPILED = compile_patterns(HIGH_STRENGTH_PATTERNS)
MEDIUM_PATTERNS_COMPILED = compile_patterns(MEDIUM_STRENGTH_PATTERNS)
LOW_PATTERNS_COMPILED = compile_patterns(LOW_STRENGTH_PATTERNS)
```

### Step 3: Implement Hierarchical Classification

Check signals in priority order. Return as soon as classification is determined.

```python
def classify_item(item: Dict[str, Any], platform: str) -> MyClassificationResult:
    """
    Classify a single feed item.

    Classification hierarchy (checked in order):
    1. Platform metadata (if applicable) -> HIGH confidence
    2. Multiple HIGH-strength signals -> HIGH confidence
    3. Single HIGH-strength signal -> MEDIUM confidence
    4. Multiple MEDIUM-strength signals -> MEDIUM confidence
    5. Single MEDIUM-strength signal -> LOW confidence
    6. Only LOW-strength signals -> AMBIGUOUS
    7. No signals -> NONE classification
    """

    # REQUIRED: Reject Facebook
    if platform.lower() == "facebook":
        raise ValueError("Facebook platform not supported")

    evidence = []
    detection_methods = []
    matched_patterns = []

    # Extract text for pattern matching
    all_text = _extract_text(item)

    # ==========================================================================
    # Step 1: Check platform metadata (highest priority)
    # ==========================================================================
    if item.get("is_special_type"):  # e.g., is_ad, is_political
        metadata = item.get("type_metadata", {})
        evidence.append(f"Platform metadata: is_special_type=True")
        detection_methods.append("platform_label")

        return MyClassificationResult(
            classification=MyClassificationType.TYPE_A,
            confidence="high",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # ==========================================================================
    # Step 2: Check HIGH-strength patterns
    # ==========================================================================
    high_matches = {}
    for method, patterns in HIGH_PATTERNS_COMPILED.items():
        matches = _find_matches(all_text, patterns)
        if matches:
            high_matches[method] = matches
            detection_methods.append(method)
            matched_patterns.extend(matches)
            evidence.append(f"{method}: found {matches}")

    # Multiple HIGH-strength signals = HIGH confidence
    if len(high_matches) >= 2:
        return MyClassificationResult(
            classification=MyClassificationType.TYPE_A,
            confidence="high",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # ==========================================================================
    # Step 3: Check MEDIUM-strength patterns
    # ==========================================================================
    medium_matches = {}
    for method, patterns in MEDIUM_PATTERNS_COMPILED.items():
        matches = _find_matches(all_text, patterns)
        if matches:
            medium_matches[method] = matches
            detection_methods.append(method)
            matched_patterns.extend(matches)
            evidence.append(f"{method}: found {matches}")

    # HIGH + MEDIUM = HIGH confidence
    if len(high_matches) >= 1 and len(medium_matches) >= 1:
        return MyClassificationResult(
            classification=MyClassificationType.TYPE_A,
            confidence="high",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Single HIGH = MEDIUM confidence
    if len(high_matches) == 1:
        return MyClassificationResult(
            classification=MyClassificationType.TYPE_B,
            confidence="medium",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Multiple MEDIUM = MEDIUM confidence
    if len(medium_matches) >= 2:
        return MyClassificationResult(
            classification=MyClassificationType.TYPE_B,
            confidence="medium",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # ==========================================================================
    # Step 4: Check LOW-strength patterns
    # ==========================================================================
    low_matches = {}
    for method, patterns in LOW_PATTERNS_COMPILED.items():
        matches = _find_matches(all_text, patterns)
        if matches:
            low_matches[method] = matches
            detection_methods.append(method)
            matched_patterns.extend(matches)
            evidence.append(f"{method}: found {matches}")

    # Any combination with LOW signals = LOW confidence
    if len(medium_matches) == 1 or len(low_matches) >= 1:
        return MyClassificationResult(
            classification=MyClassificationType.AMBIGUOUS,
            confidence="low",
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # ==========================================================================
    # Step 5: No signals = NONE
    # ==========================================================================
    return MyClassificationResult(
        classification=MyClassificationType.NONE,
        confidence="high",  # Confident it's NOT this type
        detection_methods=["none"],
        evidence=["No signals detected"],
        matched_patterns=[],
    )


def _extract_text(item: Dict[str, Any]) -> str:
    """Extract all text from feed item for pattern matching."""
    parts = []
    content_text = item.get("content_text", {})

    for field in ["captions", "hashtags", "on_screen_labels"]:
        values = content_text.get(field, [])
        if values:
            parts.extend(str(v) for v in values)

    return " ".join(parts).lower()


def _find_matches(text: str, patterns: List[re.Pattern]) -> List[str]:
    """Find all pattern matches in text."""
    matches = []
    for pattern in patterns:
        found = pattern.findall(text)
        if found:
            matches.extend(found)
    return list(set(matches))
```

### Step 4: Integrate with Evidence Bundle

Your classifier must produce output compatible with Evidence Bundles.

```python
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

@dataclass
class MyBundleMeasurement:
    """Measurement structure for Evidence Bundle."""
    value: Any
    method: str
    quality: str  # "ok", "low_sample", "missing_fields", etc.
    notes: Optional[str] = None
    threshold_rule: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "value": self.value,
            "method": self.method,
            "quality": self.quality,
        }
        if self.notes:
            result["notes"] = self.notes
        if self.threshold_rule:
            result["threshold_rule"] = self.threshold_rule
        return result


def build_my_evidence_bundle(
    items: List[Dict[str, Any]],
    platform: str,
    source_type: str,
) -> Dict[str, Any]:
    """
    Build Evidence Bundle for my classifier.

    Required sections:
    - meta: Scan context
    - observations: Hard facts (counts)
    - measurements: Classifier outputs with quality flags
    - limits: What we cannot know
    """

    # Reject Facebook
    if platform.lower() == "facebook":
        return {
            "error": "Facebook platform not supported",
            "meta": {"platform": platform, "n_items": len(items)},
        }

    # Classify all items
    classifications = []
    high_conf_count = 0
    type_a_count = 0
    type_b_count = 0

    for item in items:
        result = classify_item(item, platform)
        classifications.append(result.to_dict())

        if result.confidence == "high":
            high_conf_count += 1

        if result.classification == MyClassificationType.TYPE_A:
            type_a_count += 1
        elif result.classification == MyClassificationType.TYPE_B:
            type_b_count += 1

    # Calculate coverage
    total_items = len(items)
    coverage_percent = round(
        (high_conf_count / total_items * 100) if total_items > 0 else 0, 1
    )

    # Build bundle
    bundle = {
        "meta": {
            "scan_id": None,  # Set by caller
            "platform": platform,
            "n_items": total_items,
            "source_type": source_type,
            "generated_at": None,  # Set by caller
        },
        "observations": {
            "total_items": total_items,
            "type_a_count": type_a_count,
            "type_b_count": type_b_count,
            "high_confidence_items": high_conf_count,
            "coverage_percent": coverage_percent,
        },
        "measurements": {
            "my_classification": MyBundleMeasurement(
                value={
                    "type_a": type_a_count,
                    "type_b": type_b_count,
                    "by_confidence": {
                        "high": high_conf_count,
                        "medium": sum(1 for c in classifications if c["confidence"] == "medium"),
                        "low": sum(1 for c in classifications if c["confidence"] == "low"),
                    },
                },
                method="classifier:my_classifier_v1",
                quality="ok" if total_items >= 10 else "low_sample",
                notes=f"Classified {total_items} items with {coverage_percent}% high-confidence coverage",
                threshold_rule="count >= 2 AND high_confidence >= 1 to surface",
            ).to_dict(),
        },
        "limits": {
            # REQUIRED: Epistemic boundaries (at least 2)
            "epistemic_boundaries": [
                "We cannot know why the algorithm showed this content",
                "Content presence does not indicate user beliefs or preferences",
            ],
            # Sample limitations
            "sample_limitations": (
                [f"Only {total_items} items in scan. Patterns may not be representative."]
                if total_items < 20 else []
            ),
            # Extraction limitations (source-type specific)
            "extraction_limitations": (
                ["OCR accuracy varies with video quality. Some text may be missed."]
                if source_type == "MOBILE_VIDEO" else []
            ),
            # Platform limitations
            "platform_limitations": _get_platform_limitations(platform),
            # What was excluded from metrics
            "exclusions": [
                f"{total_items - high_conf_count} items had non-HIGH confidence and are excluded from primary metrics",
            ],
        },
    }

    return bundle


def _get_platform_limitations(platform: str) -> List[str]:
    """Return platform-specific limitations for limits section."""
    limitations = {
        "instagram": [
            "Story content may have different patterns than feed",
            "Shopping tags may not be visible in all contexts",
        ],
        "x": [
            "Retweets may have different classification patterns",
            "Spaces and audio content are not analyzed",
        ],
        "twitter": [  # Alias
            "Retweets may have different classification patterns",
            "Spaces and audio content are not analyzed",
        ],
        "youtube": [
            "In-video sponsor segments are not detected",
            "Pre-roll ads are not captured in feed scans",
        ],
        "tiktok": [
            "Duets and stitches may have complex attribution",
            "Audio-only disclosures are not detected",
        ],
    }
    return limitations.get(platform.lower(), [])
```

### Step 5: Document Limitations

Every classifier MUST document its limitations.

```python
def get_classifier_limitations() -> Dict[str, List[str]]:
    """
    Return all known limitations of this classifier.

    This is called by Evidence Bundle builders to populate the limits section.
    """
    return {
        # Fundamental limitations
        "detection_limitations": [
            "Cannot detect [type] without visible/audible indicators",
            "Single-word matches may produce false positives",
            "Sarcasm and irony are not detected",
        ],
        # Source-type specific
        "mobile_video_limitations": [
            "OCR may miss small or brief text",
            "Audio content is not analyzed",
            "Fast-scrolling may miss content",
        ],
        "desktop_extension_limitations": [
            "DOM structure varies by platform version",
            "Dynamic content may load after capture",
        ],
        # What we explicitly cannot do
        "explicit_non_capabilities": [
            "Cannot infer user intent or beliefs",
            "Cannot explain why algorithm showed content",
            "Cannot predict future feed behavior",
        ],
    }
```

---

## Confidence Decision Tree

Use this decision tree for determining confidence levels:

```
START
  │
  ├─ Platform metadata confirms type (is_ad=True, etc.)?
  │   └─ YES → HIGH confidence
  │
  ├─ ≥2 HIGH-strength signals detected?
  │   └─ YES → HIGH confidence
  │
  ├─ 1 HIGH-strength + 1+ MEDIUM-strength signals?
  │   └─ YES → HIGH confidence
  │
  ├─ Exact regulatory disclosure match (Sponsored, #ad)?
  │   └─ YES → HIGH confidence
  │
  ├─ 1 HIGH-strength signal alone?
  │   └─ YES → MEDIUM confidence
  │
  ├─ ≥2 MEDIUM-strength signals?
  │   └─ YES → MEDIUM confidence
  │
  ├─ 1 MEDIUM-strength signal?
  │   └─ YES → LOW confidence
  │
  ├─ Only LOW-strength signals?
  │   └─ YES → AMBIGUOUS classification, LOW confidence
  │
  └─ No signals detected?
      └─ YES → NONE classification, HIGH confidence (confident it's NOT this type)
```

---

## Common Patterns

### Pattern: Threshold Gating

Only surface data that meets minimum confidence thresholds.

```python
MIN_COUNT_TO_SURFACE = 2
MIN_HIGH_CONFIDENCE = 1

def should_surface(count: int, high_confidence_count: int) -> bool:
    """
    Determine if data should be surfaced to users.

    Threshold rule: count >= 2 AND high_confidence >= 1
    """
    return count >= MIN_COUNT_TO_SURFACE and high_confidence_count >= MIN_HIGH_CONFIDENCE
```

### Pattern: Explicit Exclusions

Always document what was excluded and why.

```python
def aggregate_with_exclusions(
    classifications: List[MyClassificationResult]
) -> Dict[str, Any]:
    """Aggregate classifications while tracking exclusions."""

    surfaced = []
    excluded = []
    exclusion_reasons = []

    for c in classifications:
        if c.confidence == "high":
            surfaced.append(c)
        else:
            excluded.append(c)
            exclusion_reasons.append(f"{c.classification.value}: {c.confidence} confidence")

    return {
        "surfaced": [s.to_dict() for s in surfaced],
        "surfaced_count": len(surfaced),
        "excluded_count": len(excluded),
        "exclusion_reasons": exclusion_reasons,
    }
```

### Pattern: Coverage Metrics

Always compute and include coverage metrics.

```python
def compute_coverage(
    total_items: int,
    high_confidence_items: int,
    classified_items: int
) -> Dict[str, Any]:
    """Compute coverage metrics for Evidence Bundle."""

    return {
        "total_items": total_items,
        "classified_items": classified_items,
        "high_confidence_items": high_confidence_items,
        "classification_rate_percent": round(
            (classified_items / total_items * 100) if total_items > 0 else 0, 1
        ),
        "high_confidence_coverage_percent": round(
            (high_confidence_items / total_items * 100) if total_items > 0 else 0, 1
        ),
    }
```

---

## Testing Your Classifier

### Unit Tests

```python
import pytest

def test_high_confidence_requires_multi_signal():
    """HIGH confidence must have ≥2 detection methods or platform attestation."""
    # Test item with multiple signals
    item = {
        "content_text": {
            "captions": ["pattern_one and pattern_two here"]
        }
    }
    result = classify_item(item, "instagram")

    if result.confidence == "high":
        # Must have multi-signal or platform attestation
        has_platform = "platform_label" in result.detection_methods
        has_multi = len(set(result.detection_methods)) >= 2
        assert has_platform or has_multi, "HIGH confidence without multi-signal"

def test_facebook_rejected():
    """Facebook must be explicitly rejected."""
    item = {"content_text": {"captions": ["test"]}}

    with pytest.raises(ValueError) as exc:
        classify_item(item, "facebook")

    assert "not supported" in str(exc.value).lower()

def test_single_signal_not_high():
    """Single signal alone cannot produce HIGH confidence."""
    # Item with only one weak signal
    item = {
        "content_text": {
            "captions": ["just pattern_one"]
        }
    }
    result = classify_item(item, "instagram")

    # Should not be HIGH if only one pattern matched
    if len(set(result.matched_patterns)) == 1:
        assert result.confidence != "high", "Single signal produced HIGH confidence"

def test_validation_passes():
    """All results must pass validation."""
    items = [
        {"content_text": {"captions": ["test content"]}},
        {"content_text": {"captions": ["pattern_one pattern_two"]}},
        {"is_special_type": True},
    ]

    for item in items:
        result = classify_item(item, "instagram")
        errors = result.validate()
        assert errors == [], f"Validation failed: {errors}"

def test_evidence_populated():
    """Non-NONE classifications must have evidence."""
    item = {
        "content_text": {"captions": ["pattern_one found here"]}
    }
    result = classify_item(item, "instagram")

    if result.classification != MyClassificationType.NONE:
        assert len(result.evidence) > 0, "No evidence for non-NONE classification"
```

### Golden Test Cases

Maintain a set of known-good test cases:

```python
GOLDEN_TEST_CASES = [
    {
        "description": "Platform metadata should be HIGH confidence",
        "input": {"is_special_type": True},
        "expected_confidence": "high",
        "expected_classification": "type_a",
    },
    {
        "description": "Multiple HIGH signals should be HIGH confidence",
        "input": {
            "content_text": {"captions": ["pattern_one and another_pattern"]}
        },
        "expected_confidence": "high",
    },
    {
        "description": "Single signal should not be HIGH confidence",
        "input": {
            "content_text": {"captions": ["only pattern_one"]}
        },
        "expected_confidence_not": "high",
    },
    {
        "description": "Empty content should be NONE or AMBIGUOUS",
        "input": {"content_text": {}},
        "expected_classification_in": ["none", "ambiguous"],
    },
]

@pytest.mark.parametrize("case", GOLDEN_TEST_CASES)
def test_golden_cases(case):
    """Test all golden test cases."""
    result = classify_item(case["input"], "instagram")

    if "expected_confidence" in case:
        assert result.confidence == case["expected_confidence"], case["description"]

    if "expected_confidence_not" in case:
        assert result.confidence != case["expected_confidence_not"], case["description"]

    if "expected_classification" in case:
        assert result.classification.value == case["expected_classification"], case["description"]

    if "expected_classification_in" in case:
        assert result.classification.value in case["expected_classification_in"], case["description"]
```

---

## Checklist Before Submitting

Use the [Classifier Compliance Checklist](./classifier_checklist.md) and verify:

- [ ] Facebook explicitly rejected
- [ ] HIGH confidence requires multi-signal or platform attestation
- [ ] All classifications include evidence
- [ ] No identity claims in any output
- [ ] Limitations documented
- [ ] Evidence Bundle integration tested
- [ ] Golden test cases pass
- [ ] Coverage metrics computed

---

## Getting Help

If you're unsure about compliance:

1. Review [accuracy_architecture.md](./accuracy_architecture.md)
2. Check existing classifiers (e.g., `commercial_classifier.py`)
3. When in doubt, use LOWER confidence
4. Document any edge cases or exceptions
