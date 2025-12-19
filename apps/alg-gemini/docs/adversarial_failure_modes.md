# Adversarial Failure Modes Documentation

**Version:** 1.0.0
**Date:** 2024-12-18
**Prompt:** 8 (Adversarial Hardening)

This document catalogs known adversarial failure modes in the AlgorithmLens signal detection system, what we do about them, and what remains explicitly out of scope.

---

## Design Philosophy

**Epistemic humility > intelligence.**

The system is designed to **under-claim rather than over-claim**. When in doubt:
- Return `unknown` or `low` confidence
- Use `signals_not_evaluated` when modalities are missing
- Never claim certainty without corroborating signals

---

## Known Adversarial Edge Cases

### 1. Meme Politics

**Scenario:** Political imagery combined with meme text, sarcasm in captions.

**Example:**
- Image shows Capitol building (OCR: "CONGRESS")
- Caption: "me waiting for the government to fix things lol"

**Current Behavior:**
- OCR institutional cues will fire (`visual` modality)
- Confidence is capped at `low`/`medium` due to single modality
- Caption text provides no corroborating political signals
- Signal fusion downgrades confidence when modalities disagree

**What we do today:** Conservative output. Single-modality signals remain low confidence.

**Out of scope:** Sarcasm detection, meme semantic understanding.

---

### 2. Political Imagery with Neutral Caption

**Scenario:** Podium, flag, or government building visible; caption is empty or generic ("big day", "exciting!").

**Current Behavior:**
- OCR may detect institutional cues if text is on screen
- Empty/generic caption contributes no corroborating signal
- Missing text marked as `signals_not_evaluated` or `signals_not_found`
- Confidence capped due to limited coverage

**What we do today:** Return detected signal with `low` confidence; note missing text modality.

**Out of scope:** Visual semantic analysis of images (flags, podiums, suits) beyond OCR text.

---

### 3. Sarcasm / Irony

**Scenario:** Text says opposite of meaning ("love being manipulated", "totally not an ad").

**Current Behavior:**
- Text is analyzed literally for keyword matches
- No sarcasm detection
- If political terms appear sarcastically, may fire low-confidence signal

**What we do today:**
- Single text match = `low` confidence
- Require multiple modalities or multiple matches for higher confidence
- Let users interpret context via explanations

**Out of scope:** Natural language understanding for sarcasm, sentiment analysis.

---

### 4. Soft Influencer Ads

**Scenario:** No "ad"/"sponsored" disclosure, but subtle CTAs ("link in bio", "use my code", "obsessed with this product").

**Current Behavior:**
- Public figure signals module does NOT detect commercial content
- Commercial detection is handled by separate `commercial_classifier.py`
- Soft ad language does NOT trigger false political signals

**What we do today:** Political signal detection correctly ignores commercial language.

**Out of scope (in public_figure_signals):** Soft ad detection (handled elsewhere).

---

### 5. Ambiguous Public Figure Signals

**Scenario:** Titles that look political but aren't:
- "president of the club"
- "VP of marketing"
- "CEO/CFO/COO"
- "student body president"
- "regional president"

**Current Behavior:**
- **Negative context filtering** blocks these false positives
- Regular expressions in `NEGATIVE_CONTEXT_PATTERNS` filter:
  - School/university contexts
  - Club/organization contexts
  - Business/corporate contexts

**What we do today:** Pattern-based filtering prevents firing on non-political titles.

**Tests validate:** 6+ specific cases (club president, VP of marketing, CEO, student body president, regional president, company president).

---

### 6. Missing Modalities

**Scenario:** Partial data availability:
- Video with no audio track
- Image-only post with no OCR-able text
- Audio-only where vision missing

**Current Behavior:**
- Missing modalities are explicitly listed in `signals_not_evaluated`
- Cannot claim `"no"` (absence) without sufficient coverage
- Fusion rule: `<2 content modalities with coverage -> confidence capped at low`
- Fusion rule: `Absence != Evidence of Absence`

**What we do today:** Transparent reporting of what was/wasn't checked.

**Known gap (documented in tests):** Audio signals only fire when timestamp segments are provided. Without segments, even if transcript matches are found, no signals are emitted. This is under-claiming behavior (safe).

---

## Fusion Engine Safety Rules

The Signal Fusion Engine (`signal_fusion_engine.py`) enforces these rules:

| Rule | Description | Effect |
|------|-------------|--------|
| COVERAGE_FIRST | <2 content modalities with coverage | Cap confidence at `low` |
| DISAGREEMENT | Some modalities fire, others don't | Downgrade confidence |
| WEAK_SIGNALS | Metadata-only signals (verified badge) | Always `low` confidence |
| PRE_FUSION_OVERRIDE | Fusion can override pre-fusion estimates | Documented in output |
| ABSENCE_RULE | Cannot claim `no` with poor coverage | Return `unknown` instead |

---

## What This System Does NOT Do

Explicit scope boundaries (enforced in code and documented in `what_this_does_not_mean`):

1. **No face recognition** - We do not identify anyone from imagery
2. **No identity claims** - "Signal detected" ≠ "This is person X"
3. **No political stance inference** - We detect signals, not ideology
4. **No partisan classification** - Left/right/center is out of scope
5. **No visual semantic analysis** - Beyond OCR, we don't interpret imagery
6. **No sarcasm detection** - Text is analyzed literally
7. **No audio analysis without segments** - Timestamp segments required for audio signals

---

## Testing Coverage

The adversarial test suite (`test_adversarial.py`) validates:

| Category | Test Count | Focus |
|----------|------------|-------|
| Meme Politics | 3 | Sarcastic captions, meme references, ironic context |
| Political Imagery + Neutral Caption | 3 | Empty captions, ambiguous captions, missing OCR |
| Sarcasm / Irony | 3 | Sarcastic text, ironic title usage, colloquial language |
| Soft Influencer Ads | 2 | Commercial CTAs don't trigger political signals |
| Ambiguous Public Figure Signals | 6 | Corporate/club titles filtered correctly |
| Missing Modalities | 4 | Proper `not_evaluated` handling |
| Signal Fusion Safety | 5 | Coverage caps, conflict downgrades, absence rules |
| Epistemic Boundaries | 3 | `what_this_does_not_mean` present, no identity claims |

**Total:** 29 adversarial tests

---

## Future Considerations

These items are explicitly **out of scope** until future prompts address them:

1. **Visual semantic analysis** - Understanding imagery beyond OCR (e.g., flags, crowds, suits)
2. **Sarcasm/irony detection** - NLP for understanding implied meaning
3. **Audio signal emission without segments** - Currently under-claims when segments missing
4. **Cross-post context** - Understanding context from linked content
5. **Temporal patterns** - Detecting coordinated campaigns over time

---

## Maintenance Notes

When adding new detection capabilities:

1. Add corresponding adversarial tests in `test_adversarial.py`
2. Ensure negative context patterns are updated if needed
3. Verify fusion rules still apply correctly
4. Update `what_this_does_not_mean` boundaries if scope changes
5. Run golden harness: `powershell -File scripts/verify_evidence_bundles.ps1`

---

*Generated as part of Prompt 8 (Adversarial Hardening) implementation.*
