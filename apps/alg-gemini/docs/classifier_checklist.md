# Classifier Compliance Checklist

> **Version:** 1.1.0
> **Last Updated:** 2025-12-18
> **Purpose:** Every new classifier or major update MUST satisfy this checklist before deployment.
>
> **v1.1.0 Changes:** Added UNKNOWN tier, Coverage Contract, Modality Authority, Epistemic Boundaries

---

## Quick Reference

This checklist enforces the [Accuracy Architecture Contract](./accuracy_architecture.md). Use it when:
- Creating a new classifier
- Modifying confidence thresholds
- Adding new detection signals
- Updating classification logic

**All REQUIRED items must pass. RECOMMENDED items should pass unless documented exception.**

---

## Phase 1: Design Checklist

Complete BEFORE writing code.

### 1.1 Scope Definition

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D1 | Classifier has clear, documented purpose | REQUIRED | What does it detect? |
| D2 | Supported platforms explicitly listed | REQUIRED | Instagram, X, YouTube, TikTok only |
| D3 | Facebook explicitly EXCLUDED | REQUIRED | Must reject Facebook data |
| D4 | Source types documented (MOBILE_VIDEO, DESKTOP_EXTENSION) | REQUIRED | Different handling? |
| D5 | Classification output categories defined | REQUIRED | What are the possible outputs? |

### 1.2 Confidence Tier Specification

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D6 | HIGH confidence criteria documented | REQUIRED | What evidence is needed? |
| D7 | HIGH requires ≥2 signals OR platform attestation | REQUIRED | Multi-signal mandate |
| D8 | MEDIUM confidence criteria documented | REQUIRED | When partial evidence? |
| D9 | UNKNOWN criteria documented | REQUIRED | When insufficient evidence? |
| D10 | LOW → UNKNOWN mapping implemented | REQUIRED | LOW never shown to users |
| D11 | UNKNOWN reason codes defined | REQUIRED | Why is result UNKNOWN? |

**CRITICAL:** LOW confidence MUST map to UNKNOWN for user-facing output. The term "LOW" is internal only.

### 1.3 Evidence Requirements

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D12 | Detection methods enumerated | REQUIRED | What signals does it check? |
| D13 | Evidence format specified | REQUIRED | Human-readable citations |
| D14 | Pattern matching approach documented | REQUIRED | Regex? Keyword? Structure? |
| D15 | No single-signal HIGH confidence paths | REQUIRED | Review all code paths |

### 1.4 Coverage Contract Specification

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D16 | Minimum item count threshold defined | REQUIRED | Below = UNKNOWN |
| D17 | Minimum eligible percentage threshold defined | REQUIRED | Below = UNKNOWN |
| D18 | Coverage insufficiency handling documented | REQUIRED | What happens when unmet? |
| D19 | Coverage report structure implemented | REQUIRED | See CoverageReport type |

### 1.5 Modality Authority Specification

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D20 | Modalities used by classifier documented | REQUIRED | text/vision/audio/metadata |
| D21 | Each modality's authority bounds respected | REQUIRED | No intent/belief inference |
| D22 | Missing modality handling documented | REQUIRED | How handled? |
| D23 | Modality availability reporting implemented | REQUIRED | Track what was available |

### 1.6 Limitations Pre-Analysis

| # | Check | Status | Notes |
|---|-------|--------|-------|
| D24 | Known false positive scenarios documented | REQUIRED | What might it wrongly flag? |
| D25 | Known false negative scenarios documented | REQUIRED | What might it miss? |
| D26 | Platform-specific limitations documented | REQUIRED | Per-platform gaps |
| D27 | Source-type limitations documented | REQUIRED | MOBILE_VIDEO vs DESKTOP |
| D28 | Epistemic boundaries enumerated | REQUIRED | What can NEVER be known? |

---

## Phase 2: Implementation Checklist

Complete DURING development.

### 2.1 Interface Compliance

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I1 | Returns ClassificationResult structure | REQUIRED | See accuracy_architecture.md |
| I2 | Includes classifier name and version | REQUIRED | Traceability |
| I3 | All outputs include confidence level | REQUIRED | high/medium/low/unknown |
| I4 | Detection methods list populated | REQUIRED | Which signals fired |
| I5 | Evidence list populated for non-UNKNOWN results | REQUIRED | Traceable claims |
| I6 | UNKNOWN includes reason_code | REQUIRED | Why insufficient? |

### 2.2 Confidence Rules

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I7 | HIGH confidence = ≥2 detection methods OR platform_label | REQUIRED | Enforced in code |
| I8 | Single signal alone = MEDIUM at most | REQUIRED | No single-signal HIGH |
| I9 | Conflicting signals = UNKNOWN | REQUIRED | Don't guess |
| I10 | Missing modality = UNKNOWN or reduced confidence | REQUIRED | Not ignored |
| I11 | Platform attestation (is_ad=True) = HIGH | ALLOWED | Platform already validated |
| I12 | Coverage insufficient = UNKNOWN | REQUIRED | Below threshold = unknown |
| I13 | LOW mapped to UNKNOWN for user output | REQUIRED | LOW internal only |

### 2.3 Coverage Contract Implementation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I14 | CoverageReport populated for each bundle | REQUIRED | Track coverage |
| I15 | is_sufficient correctly computed | REQUIRED | Based on thresholds |
| I16 | insufficiency_reasons populated when unmet | REQUIRED | Why insufficient? |
| I17 | Insufficient coverage → output is UNKNOWN | REQUIRED | Not partial results |

### 2.4 Modality Authority Implementation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I18 | ModalityAvailability tracked per item | REQUIRED | What was available? |
| I19 | No intent inference from any modality | REQUIRED | Contract violation |
| I20 | No belief inference from any modality | REQUIRED | Contract violation |
| I21 | Missing modality reported in limits | REQUIRED | Epistemic boundary |

### 2.5 Prohibited Behaviors

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I22 | No "You are" / "You believe" in any output | REQUIRED | Identity prohibition |
| I23 | No algorithmic intent claims | REQUIRED | "Algorithm wants" forbidden |
| I24 | No prediction claims | REQUIRED | "You will see" forbidden |
| I25 | No certainty language for partial evidence | REQUIRED | "Definitely" forbidden |
| I26 | No silent failures (all errors tracked) | REQUIRED | Failures visible |
| I27 | Facebook data raises error | REQUIRED | Explicit rejection |

### 2.6 Evidence Traceability

| # | Check | Status | Notes |
|---|-------|--------|-------|
| I28 | Every evidence citation maps to observable data | REQUIRED | No invented claims |
| I29 | Matched patterns preserved verbatim | REQUIRED | Exact text found |
| I30 | Evidence readable by non-technical users | RECOMMENDED | Clear language |
| I31 | No classifier internals leak to evidence | REQUIRED | No "regex matched" |

---

## Phase 3: Testing Checklist

Complete BEFORE merge.

### 3.1 Validation Tests

| # | Check | Status | Notes |
|---|-------|--------|-------|
| T1 | ClassificationResult.validate() passes for all outputs | REQUIRED | Structural validity |
| T2 | HIGH confidence items have ≥2 detection methods OR platform_label | REQUIRED | Multi-signal verified |
| T3 | Sample data from each platform tested | REQUIRED | Platform coverage |
| T4 | MOBILE_VIDEO samples tested | REQUIRED | OCR path tested |
| T5 | DESKTOP_EXTENSION samples tested | REQUIRED | DOM path tested |

### 3.2 Edge Case Tests

| # | Check | Status | Notes |
|---|-------|--------|-------|
| T6 | Empty content returns UNKNOWN, not error | REQUIRED | Graceful handling |
| T7 | Missing fields return UNKNOWN or reduced confidence | REQUIRED | Not crashes |
| T8 | Facebook data returns explicit rejection | REQUIRED | Not classification |
| T9 | Conflicting signals return UNKNOWN | REQUIRED | No false confidence |
| T10 | Known false positive cases handled correctly | REQUIRED | Document test cases |
| T11 | Coverage insufficient returns UNKNOWN | REQUIRED | Not partial results |
| T12 | Missing modality returns UNKNOWN or degraded | REQUIRED | Per modality rules |

### 3.3 Evidence Bundle Integration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| T13 | Classifier output integrates with bundle structure | REQUIRED | Compatible format |
| T14 | Limitations appear in bundle's limits section | REQUIRED | Gaps documented |
| T15 | Coverage metrics computed correctly | REQUIRED | high_confidence / total |
| T16 | Exclusions documented in limits.exclusions | REQUIRED | Transparency |
| T17 | CoverageReport populated correctly | REQUIRED | All fields present |
| T18 | ≥2 epistemic boundaries in limits | REQUIRED | Fundamental + situational |
| T19 | Modality availability documented | REQUIRED | What was checked |

### 3.4 Regression Tests

| # | Check | Status | Notes |
|---|-------|--------|-------|
| T15 | Golden test cases pass | REQUIRED | Known-good examples |
| T16 | No confidence level regressions | REQUIRED | HIGH shouldn't become MEDIUM |
| T17 | Performance within acceptable bounds | RECOMMENDED | <100ms per item |

---

## Phase 4: Documentation Checklist

Complete BEFORE deployment.

### 4.1 Classifier Documentation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| DOC1 | Docstring explains purpose and approach | REQUIRED | In code |
| DOC2 | Confidence tier criteria in docstring | REQUIRED | Reference in code |
| DOC3 | Known limitations documented | REQUIRED | In code or separate doc |
| DOC4 | Example classifications provided | RECOMMENDED | Help future developers |

### 4.2 Evidence Bundle Integration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| DOC5 | Bundle fields documented | REQUIRED | What fields does it populate? |
| DOC6 | Threshold rules documented | REQUIRED | When does data surface? |
| DOC7 | Limits section contributions documented | REQUIRED | What limitations added? |

### 4.3 Accuracy Contract Alignment

| # | Check | Status | Notes |
|---|-------|--------|-------|
| DOC8 | References accuracy_architecture.md | REQUIRED | Shows compliance awareness |
| DOC9 | Justifies any exceptions | REQUIRED if applicable | Why deviation? |
| DOC10 | Added to classifier registry | REQUIRED | Central tracking |

---

## Approval Workflow

### Before Code Review

1. Self-complete this checklist
2. Document any REQUIRED items that cannot pass with justification
3. Tag items needing discussion as "DISCUSS"

### During Code Review

Reviewer MUST verify:
- [ ] All REQUIRED items pass or have documented exceptions
- [ ] No prohibited behaviors present
- [ ] Tests demonstrate multi-signal requirements
- [ ] Limits section is populated correctly

### Before Merge

- [ ] This checklist saved in PR description or linked document
- [ ] All BLOCKING items resolved
- [ ] Accuracy Architecture Contract referenced

---

## Checklist Template

Copy this for your PR:

```markdown
## Classifier Compliance Checklist

**Classifier Name:** [name]
**Version:** [version]
**Platforms:** Instagram, X, YouTube, TikTok (Facebook EXCLUDED)

### Design Phase
- [ ] D1-D5: Scope defined
- [ ] D6-D10: Confidence tiers specified
- [ ] D11-D14: Evidence requirements met
- [ ] D15-D18: Limitations pre-analyzed

### Implementation Phase
- [ ] I1-I5: Interface compliance
- [ ] I6-I10: Confidence rules enforced
- [ ] I11-I16: No prohibited behaviors
- [ ] I17-I20: Evidence traceable

### Testing Phase
- [ ] T1-T5: Validation tests pass
- [ ] T6-T10: Edge cases handled
- [ ] T11-T14: Bundle integration works
- [ ] T15-T17: Regression tests pass

### Documentation Phase
- [ ] DOC1-DOC4: Classifier documented
- [ ] DOC5-DOC7: Bundle integration documented
- [ ] DOC8-DOC10: Contract alignment confirmed

### Exceptions Documented
[List any REQUIRED items that could not pass with justification]
```

---

## Quick Reference Card

### Confidence Tiers (v1.1.0)
```
HIGH     → User sees: HIGH     (in primary metrics)
MEDIUM   → User sees: MEDIUM   (documented, not in metrics)
LOW      → User sees: UNKNOWN  (LOW is internal only!)
UNKNOWN  → User sees: UNKNOWN  (insufficient evidence)

CRITICAL: "LOW" must NEVER appear in user-facing output
```

### HIGH Confidence Requirements
```
(≥2 independent detection methods)
OR
(platform_label / is_ad=True)
OR
(exact disclosure token match: "Sponsored", "#ad", etc.)
```

### UNKNOWN is Required When
```
- Insufficient evidence (cannot meet MEDIUM)
- Missing critical modality
- Unresolved signal conflict
- Coverage below thresholds
- Extraction failure
```

### PROHIBITED in All Outputs
```
- "You are..."
- "You believe..."
- "The algorithm wants..."
- "Definitely..."
- "This proves..."
- "You will see..."
- Intent inference from any modality
- Belief inference from any modality
```

### REQUIRED in All Classifications
```
- confidence: "high" | "medium" | "unknown" (NOT "low" for users)
- detection_methods: [list of methods that fired]
- evidence: [human-readable citations]
- reason_code (if UNKNOWN): why insufficient
```

### REQUIRED in All Bundles
```
- limits.epistemic_boundaries (≥2, at least one fundamental)
- limits.exclusions (what was excluded)
- coverage_report (is_sufficient, insufficiency_reasons)
- coverage_percent
- modality_availability (what was checked)
```

### Modality Authority Quick Check
```
Text:     CAN detect keywords, disclosures, entities
          CANNOT infer intent, beliefs, sarcasm

Vision:   CAN detect context, labels, settings
          CANNOT infer intent, identity, beliefs

Audio:    CAN detect spoken disclosures (IF detected)
          CANNOT infer tone, sincerity, beliefs

Metadata: CAN detect platform labels, creator IDs
          CANNOT infer platform reasoning, intent
```
