# Phase 5F1: Ads Conflict Resolution Engine

**Status:** DESIGN COMPLETE
**Scope:** Ads tab only (Phase 5F2+ will extend to other tabs)
**Dependencies:** Phase 5D1 (Evidence Chain Enforcement) ✓ Complete
**Author:** Claude Opus 4.5
**Date:** 2026-01-06

---

## Executive Summary

Phase 5F1 introduces a Conflict Resolution Engine for the Ads tab that systematically detects, categorizes, and resolves conflicting signals to increase classification correctness while maintaining auditability. The engine leverages method reliability as the primary resolution mechanism, with PLATFORM_LABEL (0.999 reliability) serving as the authoritative signal for ad/not-ad classification.

**Key Principle:** Conflicts should be resolved when possible—not abstained from. Abstention is a last resort when no reliable resolution path exists.

---

## 1. Conflict Taxonomy for Ads

### 1.1 Conflict Type Definitions

| Conflict Type | Code | Description | Example |
|--------------|------|-------------|---------|
| **Platform vs. OCR** | `PLATFORM_OCR_MISMATCH` | Platform label contradicts OCR-detected text | Platform says "sponsored" but OCR finds "not sponsored" in post |
| **Platform vs. Creator Denial** | `CREATOR_DENIAL` | Creator explicitly denies ad while platform labels sponsored | "#notanad" or "not sponsored" text with platform ad label |
| **Label vs. Promo Signals** | `LABEL_PROMO_MISMATCH` | No ad label but strong promotional signals present | Discount codes, affiliate links without ad disclosure |
| **Multi-Method Disagreement** | `MULTI_METHOD_CONFLICT` | 3+ detection methods yield conflicting classifications | Platform=ad, OCR=no label, CTA=promo, Keywords=ambiguous |
| **Duplicate Detection** | `DUPLICATE_ITEM` | Same content detected multiple times with different signals | Scrollback vs. fresh render of same post |
| **Partial Metadata** | `INCOMPLETE_METADATA` | Key fields missing, preventing confident classification | DOM has ad container but no disclosure text |
| **Temporal Inconsistency** | `TEMPORAL_CONFLICT` | Same item classified differently across scan windows | Ad label appeared/disappeared between scans |

### 1.2 Conflict Severity Levels

```python
class ConflictSeverity(Enum):
    CRITICAL = "critical"    # Must resolve or abstain (e.g., platform vs OCR)
    MODERATE = "moderate"    # Should resolve, can proceed with penalty
    MINOR = "minor"          # Informational, minimal impact on confidence
```

| Conflict Type | Default Severity |
|--------------|------------------|
| `PLATFORM_OCR_MISMATCH` | CRITICAL |
| `CREATOR_DENIAL` | CRITICAL |
| `LABEL_PROMO_MISMATCH` | MODERATE |
| `MULTI_METHOD_CONFLICT` | MODERATE |
| `DUPLICATE_ITEM` | MINOR |
| `INCOMPLETE_METADATA` | MODERATE |
| `TEMPORAL_CONFLICT` | MODERATE |

---

## 2. Resolution Principles

### 2.1 Core Tenets

1. **Method Reliability Drives Precedence**
   Higher reliability methods override lower reliability methods. No exceptions.

2. **PLATFORM_LABEL is Authoritative for Ad Classification**
   At 0.999 reliability, platform labels are treated as ground truth for determining whether content is a paid advertisement. Creator denials do not override platform disclosures.

3. **Resolution Over Abstention**
   When a conflict can be reliably resolved (winning method reliability ≥ 0.90), resolve it. Abstention is reserved for genuinely unresolvable cases.

4. **Audit Trail is Mandatory**
   Every resolution must produce a `ConflictResolutionRecord` with full evidence chain.

5. **Confidence Penalty, Not Downgrade**
   Resolved conflicts apply a confidence penalty rather than forcing abstention. The penalty reflects residual uncertainty from the losing signal(s).

### 2.2 Method Reliability Reference

| Method | Reliability | Can Override Others |
|--------|-------------|---------------------|
| PLATFORM_LABEL | 0.999 | Yes (all) |
| METADATA_FIELD | 0.95 | Yes (≤0.90) |
| OCR_DISCLOSURE | 0.85 | Partial |
| CLASSIFIER_OUTPUT | 0.80 | Partial |
| NER_EXTRACTION | 0.75 | No |
| REGEX_PATTERN | 0.75 | No |
| KEYWORD_MATCH | 0.70 | No |
| HEURISTIC_RULE | 0.65 | No |

### 2.3 Resolution Type Semantics

| Resolution Type | When Used | Outcome |
|-----------------|-----------|---------|
| `PRECEDENCE` | Clear reliability gap ≥ 0.10 between methods | Highest reliability method wins |
| `MAJORITY` | Multiple methods with similar reliability agree | Majority classification wins |
| `ABSTAIN` | No reliable resolution path | claim_status = ABSTAIN |
| `MANUAL` | Human review required (future) | Flagged for review queue |

---

## 3. Resolution Decision Tree

### 3.1 Primary Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFLICT DETECTED                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Is PLATFORM_LABEL present?                                  │
│         Reliability = 0.999                                          │
└─────────────────────────────────────────────────────────────────────┘
          │ YES                              │ NO
          ▼                                  ▼
┌──────────────────────────┐    ┌──────────────────────────────────────┐
│ PLATFORM_LABEL WINS      │    │ Step 2: Find highest reliability     │
│ resolution_type=PRECEDENCE    │          method among conflicting     │
│ confidence_penalty=0.0   │    │          signals                      │
│ (no penalty for authority)    └──────────────────────────────────────┘
└──────────────────────────┘                 │
                                             ▼
                            ┌─────────────────────────────────────────┐
                            │ Step 3: Is reliability gap ≥ 0.10?      │
                            └─────────────────────────────────────────┘
                                   │ YES                │ NO
                                   ▼                    ▼
                     ┌──────────────────────┐  ┌──────────────────────┐
                     │ HIGHEST METHOD WINS  │  │ Step 4: Majority     │
                     │ resolution_type=     │  │ vote among methods   │
                     │   PRECEDENCE         │  │ with reliability     │
                     │ confidence_penalty=  │  │ ≥ 0.70               │
                     │   0.05               │  └──────────────────────┘
                     └──────────────────────┘           │
                                                        ▼
                                          ┌──────────────────────────┐
                                          │ Step 5: Clear majority?  │
                                          │ (≥60% agreement)         │
                                          └──────────────────────────┘
                                                 │ YES        │ NO
                                                 ▼            ▼
                                    ┌────────────────┐  ┌────────────────┐
                                    │ MAJORITY WINS  │  │ ABSTAIN        │
                                    │ resolution_type│  │ resolution_type│
                                    │  =MAJORITY     │  │  =ABSTAIN      │
                                    │ confidence_    │  │ claim_status=  │
                                    │  penalty=0.10  │  │  ABSTAIN       │
                                    └────────────────┘  └────────────────┘
```

### 3.2 Conflict-Specific Handlers

#### 3.2.1 PLATFORM_OCR_MISMATCH

```python
def resolve_platform_ocr_mismatch(platform_ev: EvidenceItem, ocr_ev: EvidenceItem) -> ConflictResolutionRecord:
    """
    Platform label vs OCR text conflict.

    Scenario: Platform says "Sponsored" but OCR found "not an ad" in post text.
    Resolution: PLATFORM_LABEL always wins (0.999 > 0.85).

    Rationale: Platform ad labels are legally binding disclosures. Creator-written
    "not an ad" text while platform-labeled as sponsored is either:
    - Creator error
    - Attempt to mislead
    - Cached/stale content
    None of these override the platform's disclosure requirement.
    """
    return ConflictResolutionRecord(
        conflict_type="PLATFORM_OCR_MISMATCH",
        conflict_severity="CRITICAL",
        winning_method="PLATFORM_LABEL",
        winning_evidence_id=platform_ev.evidence_id,
        losing_methods=["OCR_DISCLOSURE"],
        losing_evidence_ids=[ocr_ev.evidence_id],
        resolution_type="PRECEDENCE",
        rationale="Platform disclosure (reliability=0.999) overrides OCR text (reliability=0.85). Platform ad labels are legally binding.",
        confidence_penalty=0.0,  # No penalty—platform is authoritative
        claim_status="FINAL"
    )
```

#### 3.2.2 CREATOR_DENIAL

```python
def resolve_creator_denial(platform_ev: EvidenceItem, denial_ev: EvidenceItem) -> ConflictResolutionRecord:
    """
    Creator explicitly denies ad while platform labels it sponsored.

    Scenario: Post contains "#notanad" or "this is not sponsored" but has
    platform ad disclosure label.
    Resolution: PLATFORM_LABEL wins. Creator denial is informational only.

    Note: This is a red flag for the content but does not change classification.
    """
    return ConflictResolutionRecord(
        conflict_type="CREATOR_DENIAL",
        conflict_severity="CRITICAL",
        winning_method="PLATFORM_LABEL",
        winning_evidence_id=platform_ev.evidence_id,
        losing_methods=["OCR_DISCLOSURE", "KEYWORD_MATCH"],
        losing_evidence_ids=[denial_ev.evidence_id],
        resolution_type="PRECEDENCE",
        rationale="Platform ad label (reliability=0.999) overrides creator denial. Denial noted but does not change classification.",
        confidence_penalty=0.0,
        claim_status="FINAL",
        metadata={"creator_denial_noted": True}  # Track for potential flagging
    )
```

#### 3.2.3 LABEL_PROMO_MISMATCH

```python
def resolve_label_promo_mismatch(promo_evidence: List[EvidenceItem]) -> ConflictResolutionRecord:
    """
    No platform ad label but promotional signals detected.

    Scenario: Post has discount codes, affiliate links, or partnership language
    but no official ad disclosure.
    Resolution: Classify as UNLABELED_PROMOTION (not LABELED_AD).

    This is not technically a conflict—it's correct classification.
    The "conflict" is between expectation (should be labeled) and reality (not labeled).
    """
    # Aggregate reliability from promo signals
    avg_reliability = sum(e.method_reliability.value for e in promo_evidence) / len(promo_evidence)

    return ConflictResolutionRecord(
        conflict_type="LABEL_PROMO_MISMATCH",
        conflict_severity="MODERATE",
        winning_method="AGGREGATE_PROMO_SIGNALS",
        winning_evidence_id=promo_evidence[0].evidence_id,  # Primary evidence
        losing_methods=[],  # No losing method—absence of label is not a signal
        losing_evidence_ids=[],
        resolution_type="PRECEDENCE",
        rationale=f"Promotional signals detected (avg reliability={avg_reliability:.2f}) without ad label. Classified as unlabeled promotion.",
        confidence_penalty=0.05 if avg_reliability >= 0.80 else 0.10,
        claim_status="FINAL" if avg_reliability >= 0.80 else "PRELIMINARY"
    )
```

#### 3.2.4 MULTI_METHOD_CONFLICT

```python
def resolve_multi_method_conflict(evidence_items: List[EvidenceItem]) -> ConflictResolutionRecord:
    """
    3+ detection methods yield conflicting classifications.

    Resolution strategy:
    1. If any method has reliability ≥ 0.95: that method wins (PRECEDENCE)
    2. Else: majority vote among methods with reliability ≥ 0.70
    3. If no majority: ABSTAIN
    """
    # Sort by reliability descending
    sorted_ev = sorted(evidence_items, key=lambda e: e.method_reliability.value, reverse=True)

    # Check for dominant method
    if sorted_ev[0].method_reliability.value >= 0.95:
        gap = sorted_ev[0].method_reliability.value - sorted_ev[1].method_reliability.value
        if gap >= 0.10:
            return ConflictResolutionRecord(
                conflict_type="MULTI_METHOD_CONFLICT",
                winning_method=sorted_ev[0].detection_method,
                resolution_type="PRECEDENCE",
                confidence_penalty=0.05,
                claim_status="FINAL"
            )

    # Majority vote
    reliable_methods = [e for e in evidence_items if e.method_reliability.value >= 0.70]
    classifications = [e.signal_type for e in reliable_methods]  # simplified
    majority = Counter(classifications).most_common(1)[0]

    if majority[1] / len(reliable_methods) >= 0.60:
        return ConflictResolutionRecord(
            conflict_type="MULTI_METHOD_CONFLICT",
            winning_method="MAJORITY",
            resolution_type="MAJORITY",
            confidence_penalty=0.10,
            claim_status="FINAL"
        )

    # No resolution possible
    return ConflictResolutionRecord(
        conflict_type="MULTI_METHOD_CONFLICT",
        resolution_type="ABSTAIN",
        confidence_penalty=1.0,  # Full penalty
        claim_status="ABSTAIN",
        rationale="No majority agreement among detection methods. Cannot reliably classify."
    )
```

#### 3.2.5 DUPLICATE_ITEM

```python
def resolve_duplicate(original_ev: EvidenceItem, duplicate_ev: EvidenceItem) -> ConflictResolutionRecord:
    """
    Same content detected multiple times.

    Resolution: Keep first occurrence, mark duplicate as superseded.
    Confidence: No penalty if signals match; minor penalty if signals differ.
    """
    signals_match = original_ev.signal_type == duplicate_ev.signal_type

    return ConflictResolutionRecord(
        conflict_type="DUPLICATE_ITEM",
        conflict_severity="MINOR",
        winning_method=original_ev.detection_method,
        winning_evidence_id=original_ev.evidence_id,
        losing_methods=[duplicate_ev.detection_method],
        losing_evidence_ids=[duplicate_ev.evidence_id],
        resolution_type="PRECEDENCE",
        rationale="Duplicate detected; keeping first occurrence." +
                  (" Signal mismatch noted." if not signals_match else ""),
        confidence_penalty=0.0 if signals_match else 0.02,
        claim_status="FINAL"
    )
```

---

## 4. Output Contract

### 4.1 ConflictResolutionRecord Schema

```python
class ConflictResolutionRecord(BaseModel):
    """Complete audit record for a resolved conflict."""

    # Conflict identification
    conflict_id: str  # Unique ID: "conflict-{item_index}-{sequence}"
    conflict_type: Literal[
        "PLATFORM_OCR_MISMATCH",
        "CREATOR_DENIAL",
        "LABEL_PROMO_MISMATCH",
        "MULTI_METHOD_CONFLICT",
        "DUPLICATE_ITEM",
        "INCOMPLETE_METADATA",
        "TEMPORAL_CONFLICT"
    ]
    conflict_severity: Literal["CRITICAL", "MODERATE", "MINOR"]

    # Resolution outcome
    resolution_type: Literal["PRECEDENCE", "MAJORITY", "ABSTAIN", "MANUAL"]
    winning_method: Optional[str]  # Detection method or "MAJORITY"
    winning_evidence_id: Optional[str]  # Primary evidence that won
    losing_methods: List[str]  # Methods that were overridden
    losing_evidence_ids: List[str]  # Evidence IDs that lost

    # Rationale and impact
    rationale: str  # Short, non-judgmental explanation (< 200 chars)
    confidence_penalty: float  # 0.0 to 1.0 penalty applied

    # Outcome
    claim_status: Literal["FINAL", "PRELIMINARY", "ABSTAIN"]

    # Optional metadata
    metadata: Optional[Dict[str, Any]] = None  # Conflict-specific data

    # Timestamps
    detected_at: datetime
    resolved_at: datetime
```

### 4.2 Integration with EvidenceItem

```python
# Updated EvidenceItem (already has these fields, now fully used)
class EvidenceItem(BaseModel):
    evidence_id: str
    signal_type: str
    detection_method: DetectionMethod
    method_reliability: MethodReliability
    source: str
    item_context: Optional[ItemContext] = None

    # Conflict fields (now active)
    conflicts_with: List[str] = []  # Evidence IDs this conflicts with
    conflict_resolution: Optional[ConflictResolution] = None  # Resolution summary
```

### 4.3 Evidence Bundle Additions

```python
class EvidenceBundle(BaseModel):
    # ... existing fields ...

    # NEW: Conflict resolution section
    conflict_resolutions: Dict[str, ConflictResolutionRecord] = {}

    # NEW: Conflict metrics
    conflict_metrics: ConflictMetrics
```

---

## 5. Required Metrics

### 5.1 Conflict Metrics Schema

```python
class ConflictMetrics(BaseModel):
    """Metrics for conflict detection and resolution."""

    # Detection metrics
    total_conflicts_detected: int
    conflicts_by_type: Dict[str, int]  # conflict_type -> count
    conflicts_by_severity: Dict[str, int]  # severity -> count

    # Resolution metrics
    conflicts_resolved: int
    conflicts_abstained: int
    conflict_resolution_rate: float  # resolved / detected

    # Quality metrics
    precedence_resolutions: int
    majority_resolutions: int
    avg_confidence_penalty: float  # Average penalty applied

    # Platform label dominance
    platform_label_override_count: int  # How often platform label won
    platform_label_override_rate: float  # % of conflicts won by platform label

    # Invariant checks
    validation_passed: bool
    validation_errors: List[str]
```

### 5.2 Metric Calculations

```python
# Resolution rate
conflict_resolution_rate = conflicts_resolved / total_conflicts_detected

# Unresolved rate (target: < 5%)
unresolved_conflict_rate = conflicts_abstained / total_conflicts_detected

# Platform label authority (expected: > 95% when platform label present)
platform_label_override_rate = platform_label_override_count / conflicts_with_platform_label
```

### 5.3 Acceptance Thresholds

| Metric | Target | Threshold | Action if Violated |
|--------|--------|-----------|-------------------|
| conflict_resolution_rate | ≥ 0.95 | ≥ 0.90 | WARNING |
| unresolved_conflict_rate | < 0.05 | < 0.10 | ERROR: Review logic |
| platform_label_override_rate | ≥ 0.99 | ≥ 0.95 | ERROR: Platform label not dominant |
| avg_confidence_penalty | < 0.05 | < 0.10 | WARNING: High uncertainty |

---

## 6. Test Fixtures

### 6.1 Fixture Location

```
apps/alg-gemini/backend/eval/fixtures/phase5f1/
├── platform_vs_ocr_denial.json
├── creator_notanad_hashtag.json
├── unlabeled_promo_codes.json
├── multi_method_disagreement.json
├── duplicate_different_signals.json
├── adversarial_sponsored_denial.json
└── expected_outcomes.json
```

### 6.2 Fixture Definitions

#### Fixture 1: Platform Label vs OCR "Not Sponsored"

```json
{
  "fixture_id": "platform_vs_ocr_denial",
  "description": "Platform says sponsored, OCR finds 'not sponsored' text",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": true, "label_text": "Sponsored"},
        "ocr_text": "This is not sponsored content, just sharing what I love!",
        "ocr_disclosure": {"found": false, "denial_text": "not sponsored"}
      }
    }
  ],
  "expected": {
    "conflict_type": "PLATFORM_OCR_MISMATCH",
    "resolution_type": "PRECEDENCE",
    "winning_method": "PLATFORM_LABEL",
    "classification": "LABELED_AD",
    "claim_status": "FINAL",
    "confidence_penalty": 0.0
  }
}
```

#### Fixture 2: Creator #notanad with Platform Label

```json
{
  "fixture_id": "creator_notanad_hashtag",
  "description": "Creator uses #notanad hashtag while platform shows ad label",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": true, "label_text": "Paid partnership"},
        "ocr_text": "Loving this product! #notanad #organic #gifted",
        "hashtags": ["notanad", "organic", "gifted"]
      }
    }
  ],
  "expected": {
    "conflict_type": "CREATOR_DENIAL",
    "resolution_type": "PRECEDENCE",
    "winning_method": "PLATFORM_LABEL",
    "classification": "LABELED_AD",
    "claim_status": "FINAL",
    "confidence_penalty": 0.0,
    "metadata": {"creator_denial_noted": true}
  }
}
```

#### Fixture 3: Unlabeled Promotion with Discount Codes

```json
{
  "fixture_id": "unlabeled_promo_codes",
  "description": "No ad label but discount codes and affiliate links present",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": false},
        "ocr_text": "Use code SAVE20 for 20% off! Link in bio!",
        "promo_signals": {
          "discount_code": "SAVE20",
          "cta": "link in bio",
          "affiliate_indicators": []
        }
      }
    }
  ],
  "expected": {
    "conflict_type": "LABEL_PROMO_MISMATCH",
    "resolution_type": "PRECEDENCE",
    "winning_method": "AGGREGATE_PROMO_SIGNALS",
    "classification": "UNLABELED_PROMOTION",
    "claim_status": "FINAL",
    "confidence_penalty": 0.05
  }
}
```

#### Fixture 4: Multi-Method Disagreement

```json
{
  "fixture_id": "multi_method_disagreement",
  "description": "Platform=no ad, OCR=ambiguous, Keywords=promo, CTA=present",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": false},
        "ocr_disclosure": {"found": false},
        "keyword_match": {"commercial_keywords": ["buy", "shop", "deal"]},
        "cta_pattern": {"found": true, "cta_text": "get yours now"}
      }
    }
  ],
  "expected": {
    "conflict_type": "MULTI_METHOD_CONFLICT",
    "resolution_type": "MAJORITY",
    "winning_method": "MAJORITY",
    "classification": "UNLABELED_PROMOTION",
    "claim_status": "FINAL",
    "confidence_penalty": 0.10
  }
}
```

#### Fixture 5: Duplicate with Different Signals

```json
{
  "fixture_id": "duplicate_different_signals",
  "description": "Same post seen twice, second time shows ad label (scrollback artifact)",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": false},
        "content_hash": "abc123"
      }
    },
    {
      "item_index": 5,
      "signals": {
        "platform_label": {"is_ad": true, "label_text": "Sponsored"},
        "content_hash": "abc123"
      }
    }
  ],
  "expected": {
    "conflict_type": "DUPLICATE_ITEM",
    "resolution_type": "PRECEDENCE",
    "winning_method": "PLATFORM_LABEL",
    "winning_evidence_source": "second_occurrence",
    "classification": "LABELED_AD",
    "claim_status": "FINAL",
    "confidence_penalty": 0.02,
    "rationale": "Duplicate detected with signal mismatch. Platform label from second occurrence used."
  }
}
```

#### Fixture 6: Adversarial Sponsored Denial

```json
{
  "fixture_id": "adversarial_sponsored_denial",
  "description": "Creator writes 'This is definitely NOT a sponsored post' directly after platform-labeled sponsored content",
  "items": [
    {
      "item_index": 0,
      "signals": {
        "platform_label": {"is_ad": true, "label_text": "Sponsored"},
        "ocr_text": "This is definitely NOT a sponsored post. I genuinely love @BrandName!",
        "denial_confidence": 0.95,
        "brand_mention": "BrandName"
      }
    }
  ],
  "expected": {
    "conflict_type": "CREATOR_DENIAL",
    "conflict_severity": "CRITICAL",
    "resolution_type": "PRECEDENCE",
    "winning_method": "PLATFORM_LABEL",
    "classification": "LABELED_AD",
    "claim_status": "FINAL",
    "confidence_penalty": 0.0,
    "rationale": "Platform ad label (reliability=0.999) overrides explicit creator denial. Denial noted for audit."
  }
}
```

### 6.3 Expected Outcomes Summary

| Fixture | Classification | Status | Penalty | Resolution |
|---------|---------------|--------|---------|------------|
| platform_vs_ocr_denial | LABELED_AD | FINAL | 0.0 | PRECEDENCE |
| creator_notanad_hashtag | LABELED_AD | FINAL | 0.0 | PRECEDENCE |
| unlabeled_promo_codes | UNLABELED_PROMOTION | FINAL | 0.05 | PRECEDENCE |
| multi_method_disagreement | UNLABELED_PROMOTION | FINAL | 0.10 | MAJORITY |
| duplicate_different_signals | LABELED_AD | FINAL | 0.02 | PRECEDENCE |
| adversarial_sponsored_denial | LABELED_AD | FINAL | 0.0 | PRECEDENCE |

---

## 7. Implementation Guidance for Cursor Agent

### 7.1 File Structure

```
apps/alg-gemini/backend/
├── accuracy/
│   ├── conflicts.py              # NEW: Core conflict resolution engine
│   ├── conflict_handlers.py      # NEW: Per-conflict-type handlers
│   ├── conflict_metrics.py       # NEW: Metrics calculation
│   ├── schema.py                 # UPDATE: Add ConflictResolutionRecord
│   ├── evidence_chain.py         # MINOR UPDATE: Call conflict resolver
│   └── method_reliability.py     # NO CHANGE
├── evidence_bundle.py            # UPDATE: Integrate conflict resolution
└── eval/
    ├── fixtures/phase5f1/        # NEW: Test fixtures
    └── test_phase5f1_conflicts.py # NEW: Tests
```

### 7.2 Core Module: `accuracy/conflicts.py`

```python
"""
Phase 5F1: Conflict Resolution Engine for Ads

This module detects and resolves conflicts between detection methods.
"""

from typing import List, Dict, Optional, Tuple
from enum import Enum
from datetime import datetime

from .schema import (
    EvidenceItem,
    ConflictResolutionRecord,
    ConflictMetrics,
    ConflictSeverity,
    ConflictType
)
from .method_reliability import get_reliability


class ConflictResolver:
    """
    Detects and resolves conflicts in evidence items.

    Usage:
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process(evidence_items)
    """

    def __init__(self):
        self.handlers = {
            ConflictType.PLATFORM_OCR_MISMATCH: self._handle_platform_ocr,
            ConflictType.CREATOR_DENIAL: self._handle_creator_denial,
            ConflictType.LABEL_PROMO_MISMATCH: self._handle_label_promo,
            ConflictType.MULTI_METHOD_CONFLICT: self._handle_multi_method,
            ConflictType.DUPLICATE_ITEM: self._handle_duplicate,
        }

    def detect_conflicts(
        self,
        evidence_items: List[EvidenceItem]
    ) -> List[Tuple[ConflictType, List[EvidenceItem]]]:
        """Detect all conflicts in evidence items."""
        conflicts = []

        # Group by item_index to find per-item conflicts
        by_item = self._group_by_item(evidence_items)

        for item_index, items in by_item.items():
            # Check for platform vs OCR mismatch
            platform_ev = self._find_by_method(items, "PLATFORM_LABEL")
            ocr_ev = self._find_by_method(items, "OCR_DISCLOSURE")

            if platform_ev and ocr_ev:
                if self._signals_conflict(platform_ev, ocr_ev):
                    conflicts.append((
                        ConflictType.PLATFORM_OCR_MISMATCH,
                        [platform_ev, ocr_ev]
                    ))

            # Check for creator denial
            if platform_ev and platform_ev.signal_type == "platform_labeled_ad":
                denial_ev = self._find_denial_signal(items)
                if denial_ev:
                    conflicts.append((
                        ConflictType.CREATOR_DENIAL,
                        [platform_ev, denial_ev]
                    ))

            # ... additional conflict detection

        return conflicts

    def resolve(
        self,
        conflict_type: ConflictType,
        evidence_items: List[EvidenceItem]
    ) -> ConflictResolutionRecord:
        """Resolve a single conflict."""
        handler = self.handlers.get(conflict_type, self._handle_unknown)
        return handler(evidence_items)

    def process(
        self,
        evidence_items: List[EvidenceItem]
    ) -> Tuple[Dict[str, ConflictResolutionRecord], ConflictMetrics]:
        """
        Full conflict detection and resolution pipeline.

        Returns:
            Tuple of (resolution records dict, metrics)
        """
        conflicts = self.detect_conflicts(evidence_items)

        resolutions = {}
        metrics = ConflictMetrics()

        for i, (conflict_type, items) in enumerate(conflicts):
            conflict_id = f"conflict-{items[0].item_context.item_index}-{i}"
            resolution = self.resolve(conflict_type, items)
            resolution.conflict_id = conflict_id
            resolutions[conflict_id] = resolution

            # Update metrics
            metrics.total_conflicts_detected += 1
            metrics.conflicts_by_type[conflict_type.value] = \
                metrics.conflicts_by_type.get(conflict_type.value, 0) + 1

            if resolution.resolution_type != "ABSTAIN":
                metrics.conflicts_resolved += 1
            else:
                metrics.conflicts_abstained += 1

        # Calculate rates
        if metrics.total_conflicts_detected > 0:
            metrics.conflict_resolution_rate = (
                metrics.conflicts_resolved / metrics.total_conflicts_detected
            )

        return resolutions, metrics

    # Handler implementations...
    def _handle_platform_ocr(self, items: List[EvidenceItem]) -> ConflictResolutionRecord:
        """Platform label always wins over OCR."""
        platform_ev = self._find_by_method(items, "PLATFORM_LABEL")
        ocr_ev = self._find_by_method(items, "OCR_DISCLOSURE")

        return ConflictResolutionRecord(
            conflict_type=ConflictType.PLATFORM_OCR_MISMATCH,
            conflict_severity=ConflictSeverity.CRITICAL,
            resolution_type="PRECEDENCE",
            winning_method="PLATFORM_LABEL",
            winning_evidence_id=platform_ev.evidence_id,
            losing_methods=["OCR_DISCLOSURE"],
            losing_evidence_ids=[ocr_ev.evidence_id],
            rationale="Platform disclosure (reliability=0.999) overrides OCR text.",
            confidence_penalty=0.0,
            claim_status="FINAL",
            detected_at=datetime.utcnow(),
            resolved_at=datetime.utcnow()
        )
```

### 7.3 Integration Points

#### 7.3.1 Update `evidence_bundle.py`

```python
# In build_ads_evidence_bundle(), after building evidence items:

from accuracy.conflicts import ConflictResolver

def build_ads_evidence_bundle(...):
    # ... existing code to build evidence_items ...

    # NEW: Conflict resolution
    resolver = ConflictResolver()
    conflict_resolutions, conflict_metrics = resolver.process(evidence_items)

    # Apply resolutions to evidence items
    for conflict_id, resolution in conflict_resolutions.items():
        if resolution.winning_evidence_id:
            winning_ev = evidence_items_dict[resolution.winning_evidence_id]
            winning_ev.conflict_resolution = ConflictResolution(
                resolution_type=resolution.resolution_type,
                winning_evidence_id=resolution.winning_evidence_id,
                resolution_rationale=resolution.rationale,
                confidence_penalty=resolution.confidence_penalty
            )

        for losing_id in resolution.losing_evidence_ids:
            losing_ev = evidence_items_dict[losing_id]
            losing_ev.conflicts_with.append(resolution.winning_evidence_id)

    # Include in bundle
    bundle = {
        # ... existing fields ...
        "conflict_resolutions": conflict_resolutions,
        "conflict_metrics": conflict_metrics.model_dump()
    }
```

#### 7.3.2 Update `accuracy/schema.py`

```python
# Add to schema.py

class ConflictType(str, Enum):
    PLATFORM_OCR_MISMATCH = "PLATFORM_OCR_MISMATCH"
    CREATOR_DENIAL = "CREATOR_DENIAL"
    LABEL_PROMO_MISMATCH = "LABEL_PROMO_MISMATCH"
    MULTI_METHOD_CONFLICT = "MULTI_METHOD_CONFLICT"
    DUPLICATE_ITEM = "DUPLICATE_ITEM"
    INCOMPLETE_METADATA = "INCOMPLETE_METADATA"
    TEMPORAL_CONFLICT = "TEMPORAL_CONFLICT"


class ConflictSeverity(str, Enum):
    CRITICAL = "critical"
    MODERATE = "moderate"
    MINOR = "minor"


class ConflictResolutionRecord(BaseModel):
    """Complete audit record for a resolved conflict."""
    conflict_id: str
    conflict_type: ConflictType
    conflict_severity: ConflictSeverity
    resolution_type: Literal["PRECEDENCE", "MAJORITY", "ABSTAIN", "MANUAL"]
    winning_method: Optional[str] = None
    winning_evidence_id: Optional[str] = None
    losing_methods: List[str] = []
    losing_evidence_ids: List[str] = []
    rationale: str
    confidence_penalty: float = 0.0
    claim_status: Literal["FINAL", "PRELIMINARY", "ABSTAIN"]
    metadata: Optional[Dict[str, Any]] = None
    detected_at: datetime
    resolved_at: datetime


class ConflictMetrics(BaseModel):
    """Metrics for conflict resolution."""
    total_conflicts_detected: int = 0
    conflicts_by_type: Dict[str, int] = {}
    conflicts_by_severity: Dict[str, int] = {}
    conflicts_resolved: int = 0
    conflicts_abstained: int = 0
    conflict_resolution_rate: float = 0.0
    precedence_resolutions: int = 0
    majority_resolutions: int = 0
    avg_confidence_penalty: float = 0.0
    platform_label_override_count: int = 0
    platform_label_override_rate: float = 0.0
    validation_passed: bool = True
    validation_errors: List[str] = []
```

### 7.4 Minimal Invasive Approach

1. **New files only** for core logic (`conflicts.py`, `conflict_handlers.py`, `conflict_metrics.py`)
2. **Schema additions** are backward-compatible (new optional fields)
3. **Evidence bundle integration** is a single insertion point after `_build_evidence_items()`
4. **No changes** to existing method reliability or CI calculations
5. **Evidence chain enforcement** remains unchanged—conflict resolution happens *before* enforcement

### 7.5 Execution Order

```
Feed Data
    │
    ▼
_build_evidence_items()
    │
    ▼
ConflictResolver.process()    ← NEW: Phase 5F1
    │
    ├── detect_conflicts()
    ├── resolve()
    └── update evidence items
    │
    ▼
_build_insights()
    │
    ▼
enforce_evidence_chain()      ← Existing: Phase 5D1
    │
    ▼
Evidence Bundle Output
```

---

## 8. Acceptance Criteria

### 8.1 Functional Requirements

| ID | Requirement | Validation Method |
|----|-------------|-------------------|
| F1 | Detect all 7 conflict types | Unit tests with fixtures |
| F2 | Resolve PLATFORM_OCR_MISMATCH with PRECEDENCE | Fixture 1 passes |
| F3 | Resolve CREATOR_DENIAL with PRECEDENCE | Fixtures 2, 6 pass |
| F4 | Resolve LABEL_PROMO_MISMATCH correctly | Fixture 3 passes |
| F5 | Resolve MULTI_METHOD_CONFLICT with MAJORITY | Fixture 4 passes |
| F6 | Handle DUPLICATE_ITEM with signal reconciliation | Fixture 5 passes |
| F7 | All fixtures pass with expected outcomes | `pytest eval/test_phase5f1_conflicts.py` |

### 8.2 Quality Requirements

| ID | Requirement | Threshold |
|----|-------------|-----------|
| Q1 | conflict_resolution_rate | ≥ 0.90 |
| Q2 | unresolved_conflict_rate | < 0.10 |
| Q3 | platform_label_override_rate | ≥ 0.95 (when present) |
| Q4 | avg_confidence_penalty | < 0.10 |

### 8.3 Non-Regression Requirements

| ID | Requirement | Validation |
|----|-------------|------------|
| NR1 | Platform label correctness unchanged | Compare with Phase 5D1 baseline |
| NR2 | Evidence chain invariants preserved | `evidence_linking_rate == 1.0` |
| NR3 | No new orphan evidence | `orphan_evidence_rate <= 0.20` |
| NR4 | Existing fixtures still pass | Run Phase 5C3, 5D1 tests |

### 8.4 Definition of Done

- [ ] All 6 fixtures defined and passing
- [ ] `accuracy/conflicts.py` implemented with all handlers
- [ ] `accuracy/schema.py` updated with new types
- [ ] `evidence_bundle.py` integrated
- [ ] Conflict metrics included in bundle output
- [ ] Unit tests for each conflict type
- [ ] Integration test for full pipeline
- [ ] Documentation updated

---

## 9. Future Extensions (Phase 5F2+)

### 9.1 Extend to Other Tabs

- **Creators tab:** Conflict between creator statistics and observed behavior
- **Topics tab:** Conflicting topic classifications
- **Metrics tab:** Aggregate conflicts

### 9.2 Machine Learning Integration

- Train conflict resolution model on resolved conflicts
- Predict resolution type based on evidence patterns
- Adaptive confidence penalties based on historical accuracy

### 9.3 User Feedback Loop

- Allow users to flag incorrect resolutions
- Feed corrections back into reliability scoring
- A/B test resolution strategies

---

## Appendix A: Conflict Detection Pseudocode

```python
def detect_all_conflicts(evidence_items: List[EvidenceItem]) -> List[Conflict]:
    conflicts = []

    # Group evidence by item
    by_item = group_by_item_index(evidence_items)

    for item_index, items in by_item.items():
        # 1. Platform vs OCR
        if has_platform_label(items) and has_ocr_signal(items):
            platform = get_platform_label(items)
            ocr = get_ocr_signal(items)
            if platform.is_ad != ocr.indicates_ad:
                conflicts.append(Conflict(
                    type=PLATFORM_OCR_MISMATCH,
                    items=[platform, ocr],
                    item_index=item_index
                ))

        # 2. Creator denial
        if has_platform_label(items) and get_platform_label(items).is_ad:
            denial = find_denial_text(items)
            if denial:
                conflicts.append(Conflict(
                    type=CREATOR_DENIAL,
                    items=[get_platform_label(items), denial],
                    item_index=item_index
                ))

        # 3. Label vs promo mismatch
        if not has_platform_label(items) or not get_platform_label(items).is_ad:
            promo_signals = find_promo_signals(items)
            if len(promo_signals) >= 2 and avg_reliability(promo_signals) >= 0.75:
                conflicts.append(Conflict(
                    type=LABEL_PROMO_MISMATCH,
                    items=promo_signals,
                    item_index=item_index
                ))

        # 4. Multi-method disagreement
        methods = get_unique_methods(items)
        if len(methods) >= 3:
            classifications = [classify(m) for m in methods]
            if not all_agree(classifications):
                conflicts.append(Conflict(
                    type=MULTI_METHOD_CONFLICT,
                    items=items,
                    item_index=item_index
                ))

    # 5. Duplicates (across items)
    content_hashes = {}
    for item in evidence_items:
        hash = item.content_hash
        if hash in content_hashes:
            conflicts.append(Conflict(
                type=DUPLICATE_ITEM,
                items=[content_hashes[hash], item],
                item_index=item.item_index
            ))
        else:
            content_hashes[hash] = item

    return conflicts
```

---

## Appendix B: Resolution Decision Matrix

| Conflict Type | PLATFORM_LABEL Present | Resolution | Penalty |
|--------------|------------------------|------------|---------|
| PLATFORM_OCR_MISMATCH | Yes | PRECEDENCE → PLATFORM_LABEL | 0.0 |
| CREATOR_DENIAL | Yes | PRECEDENCE → PLATFORM_LABEL | 0.0 |
| LABEL_PROMO_MISMATCH | No | PRECEDENCE → PROMO_SIGNALS | 0.05-0.10 |
| MULTI_METHOD_CONFLICT | Yes | PRECEDENCE → PLATFORM_LABEL | 0.0 |
| MULTI_METHOD_CONFLICT | No | MAJORITY or ABSTAIN | 0.10 |
| DUPLICATE_ITEM | Either | PRECEDENCE → Latest signal | 0.0-0.02 |
| INCOMPLETE_METADATA | N/A | ABSTAIN or PRELIMINARY | 0.15 |
| TEMPORAL_CONFLICT | Either | PRECEDENCE → Latest scan | 0.05 |

---

*End of Phase 5F1 Specification*
