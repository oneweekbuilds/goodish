# Ground Truth Labeling Template

## Overview
This template is for labeling evidence bundles from 5 scans across 5 tabs (Ads, Politics, Patterns, Creators, Inferences).

**Run Directory**: `eval/gt_runs/20260108_012303`

**Scan IDs**:
1. `desktop-1767216093373-0dykcpc`
2. `desktop-1767213421203-es5qrua`
3. `desktop-1767213795895-7cvybej`
4. `desktop-1767282143724-w7lwh78`
5. `desktop-1767214732271-5fvxxhi`

---

## Labeling Rubric (6-Point Consistency Guide)

1. **Claim Correctness**: A claim is "correct" if it accurately reflects what the evidence supports, without overstating or understating confidence.

2. **FINAL vs PRELIMINARY**: 
   - FINAL: Strong, unambiguous evidence with high reliability
   - PRELIMINARY: Some evidence exists but uncertainty is significant or evidence quality is lower

3. **ABSTAIN Appropriateness**: 
   - ABSTAIN is correct when evidence is insufficient, conflicting, or unreliable
   - ABSTAIN is incorrect if strong evidence exists but was missed

4. **Evidence Completeness**: 
   - Expected evidence should include all relevant signals from the scan
   - Missing key evidence types (e.g., platform labels, OCR, captions) should be noted

5. **Conflict Handling**: 
   - Conflicting evidence should lead to PRELIMINARY or ABSTAIN unless resolved with clear precedence rules
   - Platform/first-party signals should dominate when present

6. **Overclaim Detection**: 
   - Claims that go beyond what evidence supports are incorrect
   - Claims that are too conservative but have strong evidence may also be incorrect

---

## Labeling Form

### Scan: `{SCAN_ID}` | Tab: `{TAB_NAME}`

**Bundle File**: `{SCAN_ID}__{TAB_NAME}.json`

#### Main Claim Assessment

**Is the main claim correct?**
- [ ] Yes
- [ ] No
- [ ] Unsure

**If No, what is wrong?**
```
[Free text description of the error]
```

**Should it have abstained?**
- [ ] Yes (evidence insufficient/conflicting)
- [ ] No (evidence is sufficient)
- [ ] N/A (already abstained)

**What evidence would you expect?**
```
[List expected evidence types, sources, or specific signals]
```

#### Status Assessment

**Current claim_status**: `{FINAL|PRELIMINARY|ABSTAIN}`

**Should it be different?**
- [ ] No, status is appropriate
- [ ] Yes, should be FINAL (currently PRELIMINARY/ABSTAIN)
- [ ] Yes, should be PRELIMINARY (currently FINAL/ABSTAIN)
- [ ] Yes, should be ABSTAIN (currently FINAL/PRELIMINARY)

**Reason for status change (if applicable)**:
```
[Explain why status should differ]
```

#### Evidence Quality

**Evidence completeness**:
- [ ] Complete (all expected evidence present)
- [ ] Partial (some evidence missing)
- [ ] Incomplete (key evidence missing)

**Missing evidence types**:
```
[List any missing evidence types]
```

**Evidence reliability concerns**:
```
[Note any reliability issues with evidence sources or methods]
```

#### Conflict Assessment

**Are there conflicts in the evidence?**
- [ ] Yes (describe below)
- [ ] No
- [ ] Unsure

**If yes, describe conflicts**:
```
[Describe conflicting signals and how they should be resolved]
```

**Were conflicts handled correctly?**
- [ ] Yes
- [ ] No (explain below)

---

## Quick Reference: Per-Tab Expectations

### Ads Tab
- **Expected evidence**: Platform ad labels, OCR disclosures, aggregate ad rates
- **FINAL threshold**: Platform labels or strong OCR signals
- **Abstention triggers**: No platform labels, weak OCR, low sample size

### Politics Tab
- **Expected evidence**: Keyword matches, platform labels, content signals
- **FINAL threshold**: Platform labels or multiple strong keyword matches
- **Abstention triggers**: Weak signals, ambiguous keywords, no platform confirmation

### Patterns Tab
- **Expected evidence**: Temporal patterns, creator repetition, content similarity
- **FINAL threshold**: Clear patterns with sufficient sample size
- **Abstention triggers**: Insufficient data, ambiguous patterns

### Creators Tab
- **Expected evidence**: Creator identifiers, self-descriptions, observed content
- **FINAL threshold**: Platform identifiers or strong self-description matches
- **Abstention triggers**: Missing identifiers, conflicting signals

### Inferences Tab
- **Expected evidence**: Algorithm signals, engagement patterns, content features
- **FINAL threshold**: Strong algorithmic signals with supporting evidence
- **Abstention triggers**: Weak signals, insufficient data, high uncertainty

---

## Notes
- Fill out one form per scan/tab combination (25 total)
- Be consistent with the rubric across all labels
- Note edge cases or ambiguous situations
- Save completed labels in a separate file (e.g., `labels_{timestamp}.json` or `labels_{timestamp}.md`)

