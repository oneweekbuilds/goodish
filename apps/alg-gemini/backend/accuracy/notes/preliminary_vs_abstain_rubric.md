# PRELIMINARY vs ABSTAIN Decision Rubric

**Status:** Design Document (Policy Definition)  
**Date:** 2026-01-11  
**Scope:** Policy and calibration design only — no behavior changes

---

## Executive Summary

This document defines a measurable, reusable decision rubric for distinguishing between PRELIMINARY claims and ABSTAIN outcomes. The goal is to establish clear, cross-tab policy that preserves current metrics while providing a foundation for future calibration.

**Key Principles:**
- FINAL claim semantics are explicitly out of scope and must not be modified
- All current metrics must be preserved (100% accuracy, 85.71% appropriate abstention, 0% false abstention)
- This is policy definition ("writing the constitution"), not enforcement
- Ground truth labels (labels_v0.json) are stable and trusted

---

## 1. Decision Rubric (Inputs → Outcome)

### 1.1 Measurable Inputs (Tab-Agnostic)

The rubric operates on the following measurable inputs, computed from evidence items and bundle metadata:

#### Core Inputs

1. **evidence_rate** (float, 0.0-1.0)
   - Definition: `len(evidence_ids) / total_items_in_scan`
   - Purpose: Measures signal density across the scan
   - Example: 2 evidence items / 41 total items = 0.049 (4.9%)

2. **unique_support_count** (int, ≥0)
   - Definition: Count of distinct evidence items after deduplication by:
     - `source_item_index` (same feed item)
     - `signal_type` + `signal_subtype` (same signal class)
     - `detection_method` (same detection approach)
   - Purpose: Prevents double-counting when multiple evidence items reference the same underlying observation
   - Example: 3 evidence items, but 2 reference item_index=7 → unique_support_count = 2

3. **support_quality_mix** (dict: evidence_type → count)
   - Definition: Breakdown of evidence by reliability tier:
     - `high_reliability`: method_reliability ≥ 0.80
     - `medium_reliability`: 0.50 ≤ method_reliability < 0.80
     - `low_reliability`: method_reliability < 0.50
   - Purpose: Distinguishes high-confidence signals from weak indicators
   - Example: `{"high": 1, "medium": 1, "low": 0}`

4. **counterevidence_presence** (bool + int)
   - Definition: 
     - `has_counterevidence`: boolean indicating conflicting signals exist
     - `counterevidence_count`: number of conflicting evidence items
   - Purpose: Detects when evidence contradicts the claim
   - Example: Claim says "political keywords present" but platform_label says "not political" → `has_counterevidence = True`

5. **evidence_type_diversity** (int, 1-N)
   - Definition: Count of distinct `(signal_type, signal_subtype)` pairs
   - Purpose: Measures corroboration across different signal sources
   - Example: `[("news_keyword", "news"), ("platform_label", "political")]` → diversity = 2

#### Optional Inputs (Claim-Specific)

6. **claim_specificity** (float, 0.0-1.0, optional)
   - Definition: Measure of how specific vs. generic the claim is
   - Purpose: More specific claims require stronger evidence
   - Note: This is harder to measure automatically; may require tab-specific heuristics
   - Example: "Political keywords detected" (generic) vs. "Conservative political content detected" (specific)

### 1.2 Decision Rules

#### Rule 1: Mandatory ABSTAIN Conditions

The system **MUST** ABSTAIN if **ANY** of the following conditions are true:

1. **No Evidence Condition**
   - `unique_support_count == 0`
   - Rationale: Cannot make any claim without evidence

2. **Counterevidence Dominance**
   - `has_counterevidence == True` AND `counterevidence_count >= unique_support_count`
   - Rationale: Conflicting evidence outweighs supporting evidence

3. **Extreme Low Rate**
   - `evidence_rate < min_abstain_rate` (tab-specific threshold, typically 0.01-0.02)
   - Rationale: Signal is too sparse to justify any claim

4. **All Low Reliability**
   - `support_quality_mix["high"] == 0` AND `support_quality_mix["medium"] == 0`
   - Rationale: No reliable evidence to support even a tentative claim

#### Rule 2: PRELIMINARY Conditions

The system **MAY** issue a PRELIMINARY claim if **ALL** of the following are true:

1. **Evidence Exists**
   - `unique_support_count >= 1`
   - Rationale: Some evidence exists to support a tentative claim

2. **Not Mandatory ABSTAIN**
   - None of Rule 1 conditions are met
   - Rationale: Not forced to abstain

3. **Below FINAL Threshold**
   - Either:
     - `unique_support_count < min_evidence_for_final` (contract-defined)
     - OR `evidence_rate < min_evidence_rate_for_final` (contract-defined, if applicable)
     - OR `support_quality_mix["high"] < min_high_reliability_for_final` (contract-defined, if applicable)
   - Rationale: Evidence is insufficient for FINAL but sufficient for PRELIMINARY

4. **Quality Gate**
   - At least one of:
     - `support_quality_mix["high"] >= 1` (at least one high-reliability signal)
     - OR `support_quality_mix["medium"] >= 2` (at least two medium-reliability signals)
     - OR `evidence_type_diversity >= 2` (corroboration across signal types)
   - Rationale: Some quality or diversity threshold must be met

#### Rule 3: Edge Cases

- **Zero Evidence Rate but Evidence Exists**: If `evidence_rate == 0` but `unique_support_count > 0`, this indicates a calculation error (total_items may be wrong). Default to PRELIMINARY with a warning.

- **All High Reliability but Low Count**: If `support_quality_mix["high"] == unique_support_count` but `unique_support_count < min_evidence_for_final`, this is a strong PRELIMINARY case (high quality, low quantity).

- **Mixed Quality with Counterevidence**: If `has_counterevidence == True` but `counterevidence_count < unique_support_count`, this is a PRELIMINARY case with conflict annotation.

### 1.3 Explicit Out-of-Scope

**FINAL claim logic is unchanged and out of scope.** This rubric only governs:
- When to ABSTAIN (Rule 1)
- When to issue PRELIMINARY (Rule 2)
- The transition from PRELIMINARY → FINAL is governed by existing contract logic and is not modified by this rubric.

---

## 2. Architectural Placement

### 2.1 Contracts (Policy Thresholds)

**Location:** `accuracy/schema.py` → `TabAccuracyContract`

**Responsibilities:**
- Define tab-specific thresholds:
  - `min_abstain_rate: Optional[float]` — evidence rate below which ABSTAIN is mandatory
  - `min_high_reliability_for_final: Optional[int]` — minimum high-reliability evidence count for FINAL
  - `min_evidence_diversity_for_final: Optional[int]` — minimum evidence type diversity for FINAL
- Define tab-specific evidence type classifications (what counts as "high" vs "medium" reliability)
- Define tab-specific counterevidence detection rules

**Rationale:** Contracts are the "constitution" — they define policy but don't enforce it. They are tab-specific because different tabs have different evidence characteristics.

### 2.2 Evidence Bundles (Metric Computation)

**Location:** Per-tab bundle builders (e.g., `politics_evidence_bundle.py`)

**Responsibilities:**
- Compute the measurable inputs from raw evidence items:
  - Calculate `evidence_rate` from `len(evidence_ids)` and `meta.n_items`
  - Compute `unique_support_count` via deduplication logic
  - Build `support_quality_mix` from `method_reliability` values
  - Detect `counterevidence_presence` via conflict detection
  - Calculate `evidence_type_diversity` from evidence item types
- Store these metrics in bundle metadata (new optional section: `abstention_metrics`)

**Rationale:** Bundles are the "fact-finding" layer — they compute what is measurable but don't make decisions. This separation allows the same metrics to be used for both PRELIMINARY/ABSTAIN decisions and for future analysis.

### 2.3 Critic (Application of Rubric)

**Location:** `accuracy/critic.py` → `Critic.evaluate()`

**Responsibilities:**
- Apply Rule 1 (Mandatory ABSTAIN) to FINAL and PRELIMINARY insights
- Apply Rule 2 (PRELIMINARY conditions) to FINAL insights that don't meet FINAL thresholds
- Generate structured reasoning in `abstention_reason` or `preliminary_upgrade_path`
- Populate `critic_metrics` with:
  - `downgraded_final_to_preliminary` (count)
  - `downgraded_final_to_abstain` (count)
  - `downgraded_reasons` (structured list)

**Rationale:** Critic is the "judge" — it applies policy (from contracts) to facts (from bundles) and produces decisions. This is where the rubric logic lives.

### 2.4 Justification for Split

**Reproducibility:** By separating metric computation (bundles) from decision logic (critic), we can:
- Recompute metrics without re-running decisions
- Test decision logic with synthetic metrics
- Audit decisions by inspecting both metrics and policy

**Cross-Tab Reuse:** By defining tab-agnostic inputs (evidence_rate, unique_support_count, etc.), we can:
- Share decision logic across tabs
- Compare calibration across tabs
- Maintain consistency while allowing tab-specific thresholds

---

## 3. Validation Plan (No Behavior Change)

### 3.1 Shadow Evaluation Approach

Using `labels_v0.json` only (no new labels, no behavior changes):

1. **Load Ground Truth Labels**
   - For each item in `labels_v0.json`:
     - Load corresponding bundle file
     - Extract current `claim_status` (FINAL, PRELIMINARY, or ABSTAIN)
     - Extract `ground_truth.should_have_abstained` (yes, no, or null)

2. **Compute Rubric Metrics**
   - For each bundle, compute the measurable inputs:
     - `evidence_rate`
     - `unique_support_count`
     - `support_quality_mix`
     - `counterevidence_presence`
     - `evidence_type_diversity`
   - Store these in a shadow evaluation report (separate from production)

3. **Apply Rubric (Shadow Mode)**
   - For each bundle, apply Rules 1 and 2 to determine what the rubric would output
   - Compare rubric output to current `claim_status`
   - Compare rubric output to `ground_truth.should_have_abstained`

4. **Compute Shadow Metrics**
   - Accuracy: `(rubric_output == ground_truth.is_main_claim_correct)`
   - Appropriate abstention: `(ground_truth.should_have_abstained == "yes" AND rubric_output == "ABSTAIN")`
   - False abstention: `(ground_truth.should_have_abstained == "no" AND rubric_output == "ABSTAIN")`
   - FINAL rate: `(rubric_output == "FINAL") / total_items`

### 3.2 Guardrails (Must Not Regress)

The shadow evaluation must enforce these guardrails:

1. **Accuracy Guardrail**
   - Current: 100.00%
   - Requirement: Shadow accuracy ≥ 100.00%
   - Rationale: Cannot introduce incorrect claims

2. **Appropriate Abstention Guardrail**
   - Current: 85.71%
   - Requirement: Shadow appropriate abstention ≥ 85.71%
   - Rationale: Cannot reduce appropriate abstention (must not become overconfident)

3. **False Abstention Guardrail**
   - Current: 0.00%
   - Requirement: Shadow false abstention ≤ 0.00%
   - Rationale: Cannot introduce false abstentions (must not become overcautious)

4. **FINAL Rate Guardrail**
   - Current: 60.00% (after politics fix)
   - Requirement: Shadow FINAL rate ≤ 60.00% (or within ±2%)
   - Rationale: Cannot increase FINAL rate due to this work (this rubric only affects PRELIMINARY/ABSTAIN)

### 3.3 Validation Report Format

The shadow evaluation should produce a report with:

1. **Per-Item Comparison Table**
   - scan_id, tab
   - Current status vs. Rubric output vs. Ground truth
   - Metrics: evidence_rate, unique_support_count, support_quality_mix
   - Discrepancy flag (if current ≠ rubric)

2. **Aggregate Metrics**
   - Current metrics (baseline)
   - Shadow metrics (rubric-based)
   - Delta (shadow - current)
   - Guardrail pass/fail for each metric

3. **Discrepancy Analysis**
   - Items where current status ≠ rubric output
   - Items where rubric output ≠ ground truth expectation
   - Categorized by discrepancy type (ABSTAIN→PRELIMINARY, PRELIMINARY→ABSTAIN, etc.)

4. **Threshold Sensitivity Analysis**
   - For each candidate threshold set (Section 4), show:
     - Shadow metrics
     - Guardrail pass/fail
     - Discrepancy count

### 3.4 Implementation Notes

- Shadow evaluation is **read-only** — it does not modify bundles, labels, or production code
- Shadow evaluation can be run as a separate script: `eval/shadow_evaluate_preliminary_vs_abstain.py`
- Results are stored in: `eval/gt_runs/20260108_012303/shadow_evaluation_preliminary_vs_abstain.json`
- This allows iterative threshold tuning without affecting production

---

## 4. Candidate Thresholds (Not Decisions)

The following threshold sets are **candidates for evaluation**, not chosen values. Each set represents a different calibration philosophy.

### Threshold Set A: "Conservative" (High Abstention)

| Threshold | Value | Rationale |
|-----------|-------|-----------|
| `min_abstain_rate` | 0.02 (2%) | Very low signal density → ABSTAIN |
| `min_high_reliability_for_final` | 2 | Require at least 2 high-reliability signals for FINAL |
| `min_evidence_diversity_for_final` | 2 | Require at least 2 different evidence types for FINAL |
| Quality gate for PRELIMINARY | `high >= 1 OR (medium >= 2 AND diversity >= 1)` | Strict quality requirements |

**Philosophy:** Prefer abstention when uncertain. High precision, lower recall.

**Expected Impact:**
- Higher appropriate abstention rate (may exceed 85.71%)
- Lower false abstention (likely remains 0%)
- Lower FINAL rate (may decrease from 60%)

### Threshold Set B: "Balanced" (Current-Equivalent)

| Threshold | Value | Rationale |
|-----------|-------|-----------|
| `min_abstain_rate` | 0.01 (1%) | Very low signal density → ABSTAIN |
| `min_high_reliability_for_final` | 1 | Require at least 1 high-reliability signal for FINAL |
| `min_evidence_diversity_for_final` | 1 | Require at least 1 evidence type (no diversity requirement) |
| Quality gate for PRELIMINARY | `high >= 1 OR medium >= 1` | Moderate quality requirements |

**Philosophy:** Balance between coverage and precision. Matches current behavior closely.

**Expected Impact:**
- Appropriate abstention rate ≈ 85.71% (maintains current)
- False abstention ≈ 0% (maintains current)
- FINAL rate ≈ 60% (maintains current)

### Threshold Set C: "Aggressive" (Low Abstention)

| Threshold | Value | Rationale |
|-----------|-------|-----------|
| `min_abstain_rate` | 0.005 (0.5%) | Extremely low signal density → ABSTAIN |
| `min_high_reliability_for_final` | 1 | Require at least 1 high-reliability signal for FINAL |
| `min_evidence_diversity_for_final` | 1 | Require at least 1 evidence type |
| Quality gate for PRELIMINARY | `high >= 1 OR medium >= 1 OR (low >= 2)` | Lenient quality requirements (allows low-reliability if multiple) |

**Philosophy:** Prefer tentative claims over abstention. Higher recall, may reduce precision.

**Expected Impact:**
- Lower appropriate abstention rate (may decrease from 85.71%)
- Higher false abstention risk (may increase from 0%)
- Higher FINAL rate (may increase from 60%)

### Threshold Set D: "Quality-Focused" (High Reliability Emphasis)

| Threshold | Value | Rationale |
|-----------|-------|-----------|
| `min_abstain_rate` | 0.01 (1%) | Very low signal density → ABSTAIN |
| `min_high_reliability_for_final` | 2 | Require at least 2 high-reliability signals for FINAL |
| `min_evidence_diversity_for_final` | 2 | Require at least 2 different evidence types for FINAL |
| Quality gate for PRELIMINARY | `high >= 1 OR (medium >= 2)` | Emphasize reliability over diversity |

**Philosophy:** Prioritize high-reliability evidence. Diversity is secondary to quality.

**Expected Impact:**
- Appropriate abstention rate ≈ 85.71% (maintains current)
- False abstention ≈ 0% (maintains current)
- FINAL rate may decrease slightly (stricter quality requirements)

### Threshold Set E: "Diversity-Focused" (Corroboration Emphasis)

| Threshold | Value | Rationale |
|-----------|-------|-----------|
| `min_abstain_rate` | 0.01 (1%) | Very low signal density → ABSTAIN |
| `min_high_reliability_for_final` | 1 | Require at least 1 high-reliability signal for FINAL |
| `min_evidence_diversity_for_final` | 2 | Require at least 2 different evidence types for FINAL |
| Quality gate for PRELIMINARY | `diversity >= 2 OR (high >= 1 AND medium >= 1)` | Emphasize diversity over single-source reliability |

**Philosophy:** Prioritize corroboration across signal types. Multiple weak signals can be stronger than one strong signal.

**Expected Impact:**
- Appropriate abstention rate ≈ 85.71% (maintains current)
- False abstention ≈ 0% (maintains current)
- FINAL rate may decrease slightly (stricter diversity requirements)

### Threshold Selection Process

1. Run shadow evaluation for each threshold set (A-E)
2. For each set, compute:
   - Shadow metrics (accuracy, appropriate abstention, false abstention, FINAL rate)
   - Guardrail pass/fail status
   - Discrepancy count vs. current behavior
3. Select the threshold set that:
   - Passes all guardrails
   - Minimizes discrepancy count (closest to current behavior)
   - Maximizes appropriate abstention (if multiple sets pass guardrails)
4. Document selection rationale in a follow-up design note

---

## 5. Implementation Roadmap (Future Work)

This section is **informational only** — not part of the current design phase.

### Phase 1: Metric Computation (Bundles)
- Add `abstention_metrics` section to bundle schema
- Implement deduplication logic for `unique_support_count`
- Implement quality mix computation
- Implement counterevidence detection
- Add to all tab bundle builders

### Phase 2: Rubric Application (Critic)
- Implement Rule 1 (Mandatory ABSTAIN) logic
- Implement Rule 2 (PRELIMINARY conditions) logic
- Add structured reasoning to `abstention_reason` and `preliminary_upgrade_path`
- Update `critic_metrics` with downgrade counts

### Phase 3: Shadow Evaluation
- Implement shadow evaluation script
- Run against `labels_v0.json`
- Generate validation report
- Iterate on threshold selection

### Phase 4: Threshold Selection
- Evaluate all candidate threshold sets (A-E)
- Select optimal set based on guardrails
- Document selection rationale

### Phase 5: Production Integration
- Add selected thresholds to contracts
- Enable rubric in critic (behind feature flag initially)
- Monitor metrics for regressions
- Gradual rollout if metrics remain stable

---

## 6. Open Questions

1. **Claim Specificity Measurement**: How should we measure `claim_specificity` automatically? Is this necessary, or can we rely on tab-specific heuristics?

2. **Tab-Specific Thresholds**: Should all tabs use the same thresholds, or should each tab have its own calibration? (Current contracts suggest tab-specific is preferred.)

3. **Temporal Considerations**: Should the rubric consider temporal patterns (e.g., signals clustered in time vs. spread out)? This may be relevant for patterns tab.

4. **Uncertainty Intervals**: Should `uncertainty_interval` width factor into PRELIMINARY vs ABSTAIN decisions? Currently it only affects FINAL vs PRELIMINARY.

5. **Conflict Resolution Integration**: How should resolved conflicts affect PRELIMINARY vs ABSTAIN? If a conflict is resolved via PRECEDENCE, does that strengthen the claim?

---

## 7. References

- Ground Truth Labels: `eval/gt_runs/20260108_012303/labels_v0.json`
- Current Contracts: `accuracy/schema.py` → `TAB_ACCURACY_CONTRACTS`
- Critic Implementation: `accuracy/critic.py`
- Evidence Chain Metrics: `accuracy/evidence_chain.py`
- Conflict Resolution: `accuracy/conflicts.py`

---

**Document Status:** Design Complete — Ready for Review  
**Next Step:** Shadow Evaluation Implementation (Phase 3)


