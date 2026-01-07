# Phase 5D: Evidence Chain Enforcement

**Status:** Specification Ready
**Scope:** apps/alg-gemini/backend only
**Dependencies:** Phase 5C1-5C4 complete

---

## 1. Overview

Phase 5D establishes **auditable evidence chains** that link every claim to its supporting evidence. This ensures:
- No claim is emitted without traceable evidence
- All evidence is referenced (no orphans)
- Aggregate claims have documented evidence policies
- The system can prove *why* it said what it said

---

## 2. Evidence Chain Definition

### 2.1 Core Contract

An **evidence chain** is a bidirectional link between claims (Insights) and evidence (EvidenceItems):

```
Insight.evidence_ids[] ──references──> EvidenceItem.evidence_id
```

**Invariants:**
1. Every `evidence_id` in `Insight.evidence_ids` MUST exist in the scan's `evidence_items` collection
2. Every `EvidenceItem.evidence_id` SHOULD be referenced by at least one Insight (orphan threshold applies)
3. `Insight.claim_status = FINAL` requires `len(evidence_ids) >= 1` (with documented exceptions)

### 2.2 EvidenceItem Schema (extend existing)

Location: `accuracy/schema.py`

```python
@dataclass
class EvidenceItem:
    evidence_id: str                    # Required: Unique ID (e.g., "ev-ads-platform-001")
    signal_type: str                    # Required: What was detected (e.g., "platform_labeled_ad")
    detection_method: str               # Required: How detected (e.g., "PLATFORM_LABEL", "OCR_DISCLOSURE")
    method_reliability: float           # Required: 0.0-1.0 reliability score
    source: str                         # NEW Required: Where evidence came from
    item_context: Optional[ItemContext] # NEW: Pointer to underlying item (without raw content)
    text_snippet: Optional[str]         # Optional: Relevant text excerpt (privacy-filtered)
    detection_confidence: Optional[str] # HIGH/MEDIUM/LOW
    conflicts_with: list[str]           # evidence_ids that conflict
    conflict_resolution: Optional[str]  # How conflicts were resolved

@dataclass
class ItemContext:
    """Pointer to source item without storing raw content."""
    item_index: int                     # Position in feed_items array (0-indexed)
    item_type: str                      # "post", "ad", "story", etc.
    platform_id: Optional[str]          # Platform's ID for the item (if available)
    timestamp_relative: Optional[str]   # "early", "middle", "late" in feed
```

### 2.3 Evidence Types by Claim Category

| Claim Category | Allowed Evidence Types | Aggregation Policy |
|----------------|------------------------|-------------------|
| **Item-level ads** | `platform_labeled_ad`, `ocr_disclosure`, `keyword_match` | Direct: 1 evidence per item |
| **Ad rate (aggregate)** | `aggregate_ad_count`, `aggregate_sample_size` | Computed: Reference count evidence |
| **Unlabeled promos** | `promo_signal_cta`, `promo_signal_disclosure`, `classifier_score` | Direct or aggregate |
| **Topics/Categories** | `topic_extraction`, `category_classification` | Aggregate with item refs |
| **Companies/Brands** | `brand_extraction`, `ocr_brand`, `platform_brand_tag` | Aggregate with item refs |
| **Confidence intervals** | `statistical_computation`, `bayesian_prior` | Computed: Reference method + inputs |

### 2.4 Evidence ID Conventions

```
ev-{tab}-{signal_type}-{index}

Examples:
  ev-ads-platform-001          # Platform-labeled ad #1
  ev-ads-promo-high-003        # High-confidence unlabeled promo #3
  ev-ads-aggregate-adrate      # Aggregate ad rate computation
  ev-ads-aggregate-wilson-ci   # Wilson CI computation
  ev-ads-aggregate-bayesian    # Bayesian prior application
  ev-ads-topic-fashion-001     # Topic extraction evidence
  ev-ads-brand-nike-001        # Brand extraction evidence
```

---

## 3. Enforcement Rules

### 3.1 Claim Status Requirements

| Claim Status | Evidence Requirement | When to Use |
|--------------|---------------------|-------------|
| `FINAL` | `len(evidence_ids) >= 1` | Strong evidence, can display to user |
| `PRELIMINARY` | `len(evidence_ids) >= 0` | Evidence exists but incomplete/low quality |
| `ABSTAIN` | `len(evidence_ids) >= 0` | Insufficient evidence, must include reason |

### 3.2 Enforcement Logic Location

Create new module: `accuracy/evidence_chain.py`

```python
class EvidenceChainEnforcer:
    """Validates evidence chains before claims are finalized."""

    def validate_insight(self, insight: Insight, evidence_items: dict[str, EvidenceItem]) -> ValidationResult
    def validate_tab_result(self, tab_result: TabResult, evidence_items: dict[str, EvidenceItem]) -> ValidationResult
    def find_orphan_evidence(self, insights: list[Insight], evidence_items: dict[str, EvidenceItem]) -> list[str]
    def compute_linking_metrics(self, insights: list[Insight], evidence_items: dict[str, EvidenceItem]) -> LinkingMetrics
```

### 3.3 Validation Rules

**Rule 1: FINAL requires evidence**
```python
def validate_insight(insight, evidence_items):
    if insight.claim_status == "FINAL":
        if not insight.evidence_ids:
            raise EvidenceChainViolation(
                f"FINAL insight {insight.insight_id} has no evidence_ids"
            )
        for eid in insight.evidence_ids:
            if eid not in evidence_items:
                raise EvidenceChainViolation(
                    f"evidence_id {eid} not found in evidence_items"
                )
```

**Rule 2: Aggregate claims must reference computation evidence**
```python
# Aggregate claims (ad_rate, topic_summary, etc.) reference:
# - ev-ads-aggregate-{computation_type} evidence items
# - NOT individual item evidence (unless directly relevant)
```

**Rule 3: Missing evidence triggers status downgrade**
```python
def enforce_or_downgrade(insight, evidence_items):
    if insight.claim_status == "FINAL":
        missing = [eid for eid in insight.evidence_ids if eid not in evidence_items]
        if missing:
            insight.claim_status = "PRELIMINARY"
            insight.abstention_flag = AbstentionFlag(
                reason="missing_evidence",
                detail=f"Evidence IDs not found: {missing}"
            )
    return insight
```

### 3.4 Forbidden Outputs

The following outputs are **forbidden** and must trigger errors in tests:

1. **FINAL insight with empty evidence_ids**
2. **evidence_id referencing non-existent EvidenceItem**
3. **Orphan rate > 20%** (evidence items never referenced)
4. **Method reliability missing** on any EvidenceItem
5. **Source field missing** on any EvidenceItem

---

## 4. Metrics

### 4.1 Evidence Linking Metrics

Location: `eval/measure_evidence_chain.py`

```python
@dataclass
class EvidenceLinkingMetrics:
    # Core linking rates
    evidence_linking_rate: float        # insights with evidence / total insights
    missing_evidence_rate: float        # referenced but missing evidence_ids / total references
    orphan_evidence_rate: float         # unreferenced evidence / total evidence items

    # Completeness
    final_claims_with_evidence: int     # count of FINAL claims with >= 1 evidence
    final_claims_missing_evidence: int  # VIOLATIONS: FINAL claims with 0 evidence

    # Quality
    avg_evidence_per_insight: float     # mean evidence_ids per insight
    method_reliability_coverage: float  # evidence items with method_reliability set
    source_coverage: float              # evidence items with source set

    # Debugging
    orphan_evidence_ids: list[str]      # list of unreferenced evidence_ids
    dangling_references: list[str]      # evidence_ids referenced but not found
```

### 4.2 Metric Calculations

```python
def compute_linking_metrics(insights: list[Insight], evidence_items: dict[str, EvidenceItem]) -> EvidenceLinkingMetrics:
    # Evidence linking rate
    insights_with_evidence = sum(1 for i in insights if i.evidence_ids)
    evidence_linking_rate = insights_with_evidence / len(insights) if insights else 1.0

    # Missing evidence rate
    all_refs = [eid for i in insights for eid in (i.evidence_ids or [])]
    missing_refs = [eid for eid in all_refs if eid not in evidence_items]
    missing_evidence_rate = len(missing_refs) / len(all_refs) if all_refs else 0.0

    # Orphan evidence rate
    referenced_ids = set(all_refs)
    orphan_ids = [eid for eid in evidence_items if eid not in referenced_ids]
    orphan_evidence_rate = len(orphan_ids) / len(evidence_items) if evidence_items else 0.0

    # ...
```

### 4.3 Acceptance Thresholds

| Metric | Threshold | Action if Violated |
|--------|-----------|-------------------|
| `evidence_linking_rate` | >= 1.0 for FINAL | Error: Block output |
| `missing_evidence_rate` | == 0.0 | Error: Block output |
| `orphan_evidence_rate` | <= 0.20 | Warning: Log but allow |
| `method_reliability_coverage` | == 1.0 | Error: Block output |
| `source_coverage` | == 1.0 | Error: Block output |

---

## 5. Implementation Plan

### 5.1 Phase 5D1: Ads Tab Evidence Chain (First Checkpoint)

**Scope:** Ads & Influence tab only

**Step 1: Schema Updates** (accuracy/schema.py)
- Add `source` field to EvidenceItem (required)
- Add `ItemContext` dataclass
- Add `item_context` field to EvidenceItem (optional)

**Step 2: Evidence Generation** (evidence_bundle.py)
- Create `_generate_evidence_items()` function
- Generate evidence for:
  - Platform-labeled ads (ev-ads-platform-{idx})
  - Unlabeled promos (ev-ads-promo-{conf}-{idx})
  - Aggregate computations (ev-ads-aggregate-*)
  - Topics (ev-ads-topic-{topic}-{idx})
  - Brands (ev-ads-brand-{brand}-{idx})

**Step 3: Insight Generation with Evidence Linking**
- Create `_generate_ads_insights()` function
- Each insight references its evidence_ids
- Enforce: FINAL claims require evidence

**Step 4: Evidence Chain Enforcer** (accuracy/evidence_chain.py)
- Implement `EvidenceChainEnforcer` class
- Wire into `build_ads_evidence_bundle()` as final validation step

**Step 5: Tests** (eval/test_phase5d1_*.py)
- Fail if FINAL insight missing evidence
- Fail if evidence_id references missing item
- Fail if orphan rate > 20%

### 5.2 Phase 5D2: Other Tabs (Future)

Apply same pattern to:
- Politics & Worldview tab
- Patterns in Feed tab
- Creator Analysis tab
- Algorithm Inferences tab

---

## 6. Data Contract Adjustments

### 6.1 Evidence Bundle Structure (Updated)

```python
{
    "meta": { ... },
    "observations": { ... },
    "measurements": { ... },
    "limits": { ... },

    # NEW Phase 5D fields
    "evidence_items": {
        "ev-ads-platform-001": {
            "evidence_id": "ev-ads-platform-001",
            "signal_type": "platform_labeled_ad",
            "detection_method": "PLATFORM_LABEL",
            "method_reliability": 0.999,
            "source": "feed_items[3].is_ad",
            "item_context": {
                "item_index": 3,
                "item_type": "ad",
                "platform_id": null,
                "timestamp_relative": "early"
            },
            "detection_confidence": "HIGH"
        },
        "ev-ads-aggregate-adrate": {
            "evidence_id": "ev-ads-aggregate-adrate",
            "signal_type": "aggregate_computation",
            "detection_method": "STATISTICAL",
            "method_reliability": 1.0,
            "source": "wilson_ci(n_ads=5, n_total=47)",
            "item_context": null,
            "detection_confidence": "HIGH"
        }
        # ...
    },

    "insights": [
        {
            "insight_id": "ads-commercial-spectrum",
            "claim_type": "aggregate_observation",
            "claim_status": "FINAL",
            "evidence_ids": ["ev-ads-platform-001", "ev-ads-platform-002", "ev-ads-aggregate-adrate"],
            "evidence_summary": "5 platform-labeled ads detected across 47 posts",
            "numeric_confidence": 0.95,
            "confidence_band": "HIGH",
            # ...
        }
    ],

    "evidence_chain_metrics": {
        "evidence_linking_rate": 1.0,
        "missing_evidence_rate": 0.0,
        "orphan_evidence_rate": 0.05,
        "validation_passed": true
    }
}
```

### 6.2 Backward Compatibility

- Existing `observations`, `measurements`, `limits` sections remain unchanged
- New `evidence_items`, `insights`, `evidence_chain_metrics` sections are additive
- Old clients can ignore new sections
- `generate_ads_analysis_copy()` continues to work from existing data

---

## 7. Test Specifications

### 7.1 Test File: `eval/test_phase5d1_evidence_chain.py`

```python
"""Phase 5D1: Evidence Chain Enforcement Tests for Ads Tab"""

import pytest
from accuracy.evidence_chain import EvidenceChainEnforcer, EvidenceChainViolation
from accuracy.schema import Insight, EvidenceItem, TabResult

class TestEvidenceChainEnforcement:

    def test_final_insight_requires_evidence(self):
        """FAIL if any FINAL insight has empty evidence_ids."""
        insight = Insight(
            insight_id="test-insight",
            claim_status="FINAL",
            evidence_ids=[],  # VIOLATION
        )
        enforcer = EvidenceChainEnforcer()
        with pytest.raises(EvidenceChainViolation, match="no evidence_ids"):
            enforcer.validate_insight(insight, {})

    def test_evidence_ids_must_exist(self):
        """FAIL if evidence_ids reference non-existent EvidenceItems."""
        insight = Insight(
            insight_id="test-insight",
            claim_status="FINAL",
            evidence_ids=["ev-ads-platform-001"],  # References non-existent
        )
        enforcer = EvidenceChainEnforcer()
        with pytest.raises(EvidenceChainViolation, match="not found"):
            enforcer.validate_insight(insight, {})  # Empty evidence_items

    def test_evidence_ids_reference_valid_items(self):
        """PASS when all evidence_ids exist in evidence_items."""
        evidence = {
            "ev-ads-platform-001": EvidenceItem(
                evidence_id="ev-ads-platform-001",
                signal_type="platform_labeled_ad",
                detection_method="PLATFORM_LABEL",
                method_reliability=0.999,
                source="feed_items[0].is_ad",
            )
        }
        insight = Insight(
            insight_id="test-insight",
            claim_status="FINAL",
            evidence_ids=["ev-ads-platform-001"],
        )
        enforcer = EvidenceChainEnforcer()
        result = enforcer.validate_insight(insight, evidence)
        assert result.valid

    def test_orphan_evidence_threshold(self):
        """WARN if orphan_evidence_rate > 0.20."""
        # Create 10 evidence items, only reference 7 (30% orphan rate > 20% threshold)
        evidence = {f"ev-ads-{i}": EvidenceItem(
            evidence_id=f"ev-ads-{i}",
            signal_type="test",
            detection_method="TEST",
            method_reliability=1.0,
            source="test",
        ) for i in range(10)}

        insights = [Insight(
            insight_id="test",
            claim_status="FINAL",
            evidence_ids=[f"ev-ads-{i}" for i in range(7)],  # Only 7/10 referenced
        )]

        enforcer = EvidenceChainEnforcer()
        metrics = enforcer.compute_linking_metrics(insights, evidence)
        assert metrics.orphan_evidence_rate == 0.30
        assert metrics.orphan_evidence_rate > 0.20  # Would trigger warning

    def test_method_reliability_required(self):
        """FAIL if any EvidenceItem missing method_reliability."""
        evidence = {
            "ev-ads-001": EvidenceItem(
                evidence_id="ev-ads-001",
                signal_type="test",
                detection_method="TEST",
                method_reliability=None,  # VIOLATION
                source="test",
            )
        }
        enforcer = EvidenceChainEnforcer()
        with pytest.raises(EvidenceChainViolation, match="method_reliability"):
            enforcer.validate_evidence_items(evidence)

    def test_source_required(self):
        """FAIL if any EvidenceItem missing source."""
        evidence = {
            "ev-ads-001": EvidenceItem(
                evidence_id="ev-ads-001",
                signal_type="test",
                detection_method="TEST",
                method_reliability=1.0,
                source=None,  # VIOLATION
            )
        }
        enforcer = EvidenceChainEnforcer()
        with pytest.raises(EvidenceChainViolation, match="source"):
            enforcer.validate_evidence_items(evidence)


class TestAdsTabEvidenceChain:
    """Integration tests for Ads tab evidence chain."""

    def test_platform_labeled_ads_have_evidence(self, sample_scan_with_ads):
        """Each platform-labeled ad must generate an EvidenceItem."""
        bundle = build_ads_evidence_bundle(sample_scan_with_ads)

        n_labeled_ads = bundle["observations"]["commercial_spectrum"]["labeled_ads"]
        platform_evidence = [
            eid for eid in bundle["evidence_items"]
            if eid.startswith("ev-ads-platform-")
        ]
        assert len(platform_evidence) == n_labeled_ads

    def test_aggregate_ad_rate_has_evidence(self, sample_scan_with_ads):
        """Ad rate insight must reference aggregate computation evidence."""
        bundle = build_ads_evidence_bundle(sample_scan_with_ads)

        ad_rate_insight = next(
            i for i in bundle["insights"]
            if i["claim_type"] == "ad_rate"
        )
        assert "ev-ads-aggregate-adrate" in ad_rate_insight["evidence_ids"]
        assert "ev-ads-aggregate-adrate" in bundle["evidence_items"]

    def test_full_evidence_chain_validation(self, sample_scan_with_ads):
        """Full bundle must pass evidence chain validation."""
        bundle = build_ads_evidence_bundle(sample_scan_with_ads)

        assert bundle["evidence_chain_metrics"]["validation_passed"]
        assert bundle["evidence_chain_metrics"]["evidence_linking_rate"] == 1.0
        assert bundle["evidence_chain_metrics"]["missing_evidence_rate"] == 0.0
```

### 7.2 Test File: `eval/test_phase5d1_evidence_generation.py`

```python
"""Phase 5D1: Evidence Item Generation Tests"""

import pytest
from evidence_bundle import _generate_evidence_items

class TestEvidenceGeneration:

    def test_platform_ad_evidence_format(self, feed_item_with_ad):
        """Platform-labeled ad evidence has correct structure."""
        evidence = _generate_evidence_items([feed_item_with_ad], idx=0)

        ev = evidence["ev-ads-platform-000"]
        assert ev["signal_type"] == "platform_labeled_ad"
        assert ev["detection_method"] == "PLATFORM_LABEL"
        assert ev["method_reliability"] == 0.999
        assert ev["source"] == "feed_items[0].is_ad"
        assert ev["item_context"]["item_index"] == 0

    def test_promo_signal_evidence_format(self, feed_item_with_promo_signals):
        """Unlabeled promo evidence captures signal type."""
        evidence = _generate_evidence_items([feed_item_with_promo_signals], idx=0)

        ev = evidence["ev-ads-promo-high-000"]
        assert ev["signal_type"] == "promo_signal"
        assert ev["detection_method"] in ["OCR_DISCLOSURE", "KEYWORD_MATCH", "CTA_PATTERN"]
        assert 0.0 <= ev["method_reliability"] <= 1.0

    def test_aggregate_evidence_format(self, commercial_analysis_result):
        """Aggregate computation evidence is well-formed."""
        evidence = _generate_aggregate_evidence(commercial_analysis_result)

        ev = evidence["ev-ads-aggregate-adrate"]
        assert ev["signal_type"] == "aggregate_computation"
        assert ev["detection_method"] == "STATISTICAL"
        assert ev["method_reliability"] == 1.0
        assert "wilson_ci" in ev["source"] or "count" in ev["source"]

    def test_no_raw_content_stored(self, feed_item_with_ad):
        """Evidence items must NOT store raw post content."""
        evidence = _generate_evidence_items([feed_item_with_ad], idx=0)

        for ev in evidence.values():
            # item_context should only have index/type, not raw text
            if ev.get("item_context"):
                assert "raw_text" not in ev["item_context"]
                assert "image_data" not in ev["item_context"]
                assert "video_data" not in ev["item_context"]
```

### 7.3 Fixtures: `eval/fixtures/phase5d1/`

```
eval/fixtures/phase5d1/
├── valid_chain_simple.json       # 3 ads, all with evidence
├── valid_chain_complex.json      # Mixed ads/promos/topics with full chain
├── missing_evidence_ids.json     # FINAL insight with empty evidence_ids (should fail)
├── dangling_reference.json       # evidence_id refs non-existent item (should fail)
├── high_orphan_rate.json         # 50% orphan rate (should warn)
├── zero_ads.json                 # No ads, should abstain gracefully
└── aggregate_only.json           # Only aggregate evidence, no item-level
```

---

## 8. Acceptance Criteria

### 8.1 Phase 5D1 Complete When:

- [ ] `EvidenceItem` schema updated with `source` (required) and `item_context` (optional)
- [ ] `EvidenceChainEnforcer` class implemented in `accuracy/evidence_chain.py`
- [ ] `build_ads_evidence_bundle()` generates `evidence_items` dict
- [ ] `build_ads_evidence_bundle()` generates `insights` list with proper `evidence_ids`
- [ ] `build_ads_evidence_bundle()` includes `evidence_chain_metrics` in output
- [ ] Validation runs automatically and blocks output if FINAL claims lack evidence
- [ ] All tests in `test_phase5d1_evidence_chain.py` pass
- [ ] All tests in `test_phase5d1_evidence_generation.py` pass
- [ ] Existing tests continue to pass (backward compatibility)

### 8.2 Metrics at Phase 5D1 Completion:

| Metric | Target |
|--------|--------|
| `evidence_linking_rate` | 100% for FINAL claims |
| `missing_evidence_rate` | 0% |
| `orphan_evidence_rate` | <= 20% |
| `method_reliability_coverage` | 100% |
| `source_coverage` | 100% |

---

## 9. Code Location Summary

| Component | File Path | Status |
|-----------|-----------|--------|
| Schema (EvidenceItem, ItemContext) | `accuracy/schema.py` | UPDATE |
| Evidence Chain Enforcer | `accuracy/evidence_chain.py` | NEW |
| Evidence Generation | `evidence_bundle.py` | UPDATE |
| Linking Metrics | `eval/measure_evidence_chain.py` | NEW |
| Unit Tests | `eval/test_phase5d1_evidence_chain.py` | NEW |
| Generation Tests | `eval/test_phase5d1_evidence_generation.py` | NEW |
| Fixtures | `eval/fixtures/phase5d1/*.json` | NEW |

---

## 10. Open Questions for Implementation

1. **Orphan threshold**: Is 20% too permissive? Could tighten to 10% after initial rollout.

2. **Text snippets**: Should evidence items include `text_snippet` for debugging? Privacy implications if stored. Current answer: Optional, privacy-filtered, max 100 chars.

3. **Aggregate evidence granularity**: Should `ev-ads-aggregate-adrate` reference individual `ev-ads-platform-*` items? Current answer: No, keep separation clean. Aggregate evidence is self-contained.

4. **Conflict handling**: If two evidence items conflict (e.g., OCR says ad, classifier says not), how to resolve? Current answer: Use `conflicts_with` and `conflict_resolution` fields, prefer higher `method_reliability`.

---

## Appendix A: Example Evidence Chain

**Scenario:** Scan with 47 posts, 5 platform-labeled ads, 2 high-confidence unlabeled promos

```json
{
  "evidence_items": {
    "ev-ads-platform-000": {
      "evidence_id": "ev-ads-platform-000",
      "signal_type": "platform_labeled_ad",
      "detection_method": "PLATFORM_LABEL",
      "method_reliability": 0.999,
      "source": "feed_items[3].is_ad=true",
      "item_context": {"item_index": 3, "item_type": "ad"},
      "detection_confidence": "HIGH"
    },
    "ev-ads-platform-001": { /* ... */ },
    "ev-ads-platform-002": { /* ... */ },
    "ev-ads-platform-003": { /* ... */ },
    "ev-ads-platform-004": { /* ... */ },
    "ev-ads-promo-high-000": {
      "evidence_id": "ev-ads-promo-high-000",
      "signal_type": "promo_signal",
      "detection_method": "OCR_DISCLOSURE",
      "method_reliability": 0.85,
      "source": "feed_items[12].ocr_text contains '#ad'",
      "item_context": {"item_index": 12, "item_type": "post"},
      "detection_confidence": "HIGH"
    },
    "ev-ads-promo-high-001": { /* ... */ },
    "ev-ads-aggregate-adrate": {
      "evidence_id": "ev-ads-aggregate-adrate",
      "signal_type": "aggregate_computation",
      "detection_method": "WILSON_CI",
      "method_reliability": 1.0,
      "source": "wilson_ci(successes=5, n=47, confidence=0.95)",
      "item_context": null,
      "detection_confidence": "HIGH"
    },
    "ev-ads-aggregate-bayesian": {
      "evidence_id": "ev-ads-aggregate-bayesian",
      "signal_type": "aggregate_computation",
      "detection_method": "BAYESIAN_POSTERIOR",
      "method_reliability": 1.0,
      "source": "beta_posterior(prior=TikTok(2,18), obs=(5,47))",
      "item_context": null,
      "detection_confidence": "HIGH"
    }
  },
  "insights": [
    {
      "insight_id": "ads-commercial-spectrum",
      "claim_type": "commercial_exposure",
      "claim_status": "FINAL",
      "evidence_ids": [
        "ev-ads-platform-000", "ev-ads-platform-001", "ev-ads-platform-002",
        "ev-ads-platform-003", "ev-ads-platform-004",
        "ev-ads-promo-high-000", "ev-ads-promo-high-001"
      ],
      "evidence_summary": "5 platform-labeled ads + 2 high-confidence promos in 47 posts",
      "numeric_confidence": 0.95,
      "confidence_band": "HIGH"
    },
    {
      "insight_id": "ads-ad-rate",
      "claim_type": "ad_rate",
      "claim_status": "FINAL",
      "evidence_ids": ["ev-ads-aggregate-adrate", "ev-ads-aggregate-bayesian"],
      "evidence_summary": "Ad rate 10.6% (95% CI: 4.5%-22.6%)",
      "numeric_confidence": 0.95,
      "confidence_band": "HIGH",
      "point_estimate": 10.6,
      "uncertainty_interval": {"lower": 4.5, "upper": 22.6, "confidence_level": 0.95}
    }
  ],
  "evidence_chain_metrics": {
    "evidence_linking_rate": 1.0,
    "missing_evidence_rate": 0.0,
    "orphan_evidence_rate": 0.0,
    "validation_passed": true
  }
}
```

---

*End of Phase 5D Specification*
