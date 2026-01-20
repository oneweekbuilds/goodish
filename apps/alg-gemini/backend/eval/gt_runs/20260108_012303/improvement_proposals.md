# Accuracy Improvement Proposals
## Based on Ground Truth Run 20260108_012303

**Date:** 2026-01-08  
**Baseline Metrics:**
- Accuracy: 100.00%
- Appropriate abstention rate: 85.71%
- False abstention rate: 0.00%
- Coverage (FINAL rate): 64.00%

---

## Overconfidence Analysis

**Total overconfidence cases:** 1

### Case 1: desktop-1767216093373-0dykcpc - politics
- **Claim Status:** FINAL
- **Evidence Count:** 2 (news_keyword items)
- **Evidence Rate:** 2/41 = 4.9%
- **Political Keywords:** 0
- **News Keywords:** 2
- **Claim Text:** "Political or news keywords detected in this scan."
- **Ground Truth:** should_have_abstained = "yes"
- **Issue:** FINAL claim with only 2 news keywords (4.9% rate) and 0 political keywords. The claim mentions "political or news" but only news is present, and the rate is very low.

---

## Proposed Improvements

### Proposal 1: Add Evidence Rate Threshold Check to Politics Critic

**File:** `apps/alg-gemini/backend/accuracy/critic.py`  
**Function:** `Critic.evaluate()` (around line 42-50)

**Change:**
Add a check for politics tab that downgrades FINAL to PRELIMINARY if:
- Evidence count meets minimum (≥2) BUT
- Evidence rate (evidence_count / total_items) < 0.10 (10%)
- AND all evidence is news_keyword (not political_keyword)

**Rationale:**
The overconfidence case has 2 evidence items (meets min_evidence_for_final=2) but only 4.9% rate. For politics, very low rates (<10%) with only news keywords (not political) should be PRELIMINARY, not FINAL.

**Implementation:**
```python
# After line 44 (evidence count check)
if tab_name == "politics" and len(evidence_ids) >= contract.min_evidence_for_final:
    # Check evidence rate and type
    # Need access to total_items - would need to pass bundle metadata or compute from evidence_items
    evidence_types = [evidence_lookup[ev_id].signal_subtype for ev_id in evidence_ids if ev_id in evidence_lookup]
    if all(et == "news" for et in evidence_types) and len(evidence_types) > 0:
        # This is news-only evidence - check if we have total_items context
        # If evidence_rate < 0.10, downgrade to PRELIMINARY
        pass  # Implementation depends on how to get total_items
```

**Risk:** LOW - Only affects politics tab, only downgrades overconfident FINAL claims. Does not affect Ads or other tabs.

**How we measure improvement:**
- Re-run scorer on same ground truth labels
- Check: `should_have_abstained=yes AND claim_status=FINAL` cases should decrease
- Target: 0 overconfidence cases (currently 1)
- Monitor: Politics tab FINAL rate may decrease slightly, but appropriate abstention rate should improve

---

### Proposal 2: Add Evidence Type Quality Check to Politics Contract

**File:** `apps/alg-gemini/backend/accuracy/schema.py`  
**Function:** `TAB_ACCURACY_CONTRACTS["politics"]` (around line 123-143)

**Change:**
Add a new field to `TabAccuracyContract`:
- `min_evidence_rate_for_final: Optional[float] = None` (default None for backward compatibility)

For politics, set `min_evidence_rate_for_final=0.10` (10%)

**Rationale:**
Even if evidence count meets minimum, very low rates (<10%) indicate weak signals that shouldn't be FINAL.

**Implementation:**
```python
"politics": TabAccuracyContract(
    tab="politics",
    # ... existing fields ...
    min_evidence_rate_for_final=0.10,  # NEW: require at least 10% of items
    # ... rest of contract ...
),
```

**Risk:** LOW - Additive field, defaults to None for other tabs. Only affects politics tab.

**How we measure improvement:**
- Critic can now check evidence_rate against this threshold
- Re-run scorer: overconfidence cases should decrease
- Politics FINAL rate may decrease, but appropriate abstention rate should improve

---

### Proposal 3: Enhance Critic with Bundle Metadata Context

**File:** `apps/alg-gemini/backend/accuracy/critic.py`  
**Function:** `Critic.evaluate()` signature and implementation

**Change:**
Modify `Critic.evaluate()` to accept optional `bundle_meta: Optional[Dict[str, Any]] = None` parameter to access `n_items` for rate calculations.

**Rationale:**
The critic needs `total_items` to compute evidence_rate = evidence_count / total_items. Currently it only has evidence_items and insights, not the total scan size.

**Implementation:**
```python
def evaluate(
    self,
    tab_name: str,
    insights: Iterable[Insight],
    evidence_items: Iterable[EvidenceItem],
    conflict_metrics: Optional[ConflictMetrics] = None,
    bundle_meta: Optional[Dict[str, Any]] = None,  # NEW
) -> tuple[List[Insight], CriticMetrics]:
    # ... existing code ...
    
    # In the FINAL check section, after evidence count check:
    if tab_name == "politics" and bundle_meta:
        total_items = bundle_meta.get("n_items", 0)
        if total_items > 0:
            evidence_rate = len(evidence_ids) / total_items
            contract = get_tab_accuracy_contract(tab_name)
            min_rate = getattr(contract, "min_evidence_rate_for_final", None)
            if min_rate and evidence_rate < min_rate:
                # Check if all evidence is news-only
                evidence_types = [
                    evidence_lookup[ev_id].signal_subtype 
                    for ev_id in evidence_ids 
                    if ev_id in evidence_lookup
                ]
                if all(et == "news" for et in evidence_types) and len(evidence_types) > 0:
                    mutated.claim_status = "PRELIMINARY"
                    reason = f"{tab_name}: evidence rate {evidence_rate:.2%} below threshold {min_rate:.0%} with news-only signals"
                    mutated.abstention_reason = mutated.abstention_reason or reason
                    critic_metrics.downgraded_final_to_preliminary += 1
                    if len(critic_metrics.downgraded_reasons) < 10:
                        critic_metrics.downgraded_reasons.append(reason)
```

**Risk:** LOW - Optional parameter, backward compatible. Only affects politics tab when bundle_meta is provided.

**How we measure improvement:**
- Update `politics_evidence_bundle.py` to pass `bundle_meta` to critic
- Re-run scorer: overconfidence case should be fixed
- Politics appropriate abstention rate should improve from 66.67% to higher

---

## Summary

**Recommended approach:** Implement all 3 proposals together as they are interdependent:
1. Proposal 2 adds the contract field
2. Proposal 3 enables the critic to use it
3. Proposal 1 implements the logic (though it's actually part of Proposal 3)

**Expected outcome:**
- Overconfidence cases: 1 → 0
- Politics appropriate abstention rate: 66.67% → ~85%+
- Politics FINAL rate: 20% → may decrease slightly (but more appropriate)
- Overall accuracy: Maintain 100%

**Files to modify:**
1. `apps/alg-gemini/backend/accuracy/schema.py` (add `min_evidence_rate_for_final` to politics contract)
2. `apps/alg-gemini/backend/accuracy/critic.py` (add bundle_meta parameter and rate check)
3. `apps/alg-gemini/backend/politics_evidence_bundle.py` (pass bundle_meta to critic)

**Testing:**
- Re-run scorer on same ground truth labels
- Verify overconfidence case is fixed
- Ensure no regression in other tabs




