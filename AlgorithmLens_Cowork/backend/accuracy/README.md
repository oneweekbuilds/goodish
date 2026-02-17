# Accuracy Architecture

This folder contains the accuracy calibration and validation infrastructure for AlgorithmLens.

## Overview

The accuracy system ensures that insights across all tabs (Ads, Politics, Patterns, Creators, Inferences) are:
- **Correct:** Claims are factually accurate
- **Appropriately calibrated:** FINAL, PRELIMINARY, and ABSTAIN statuses are assigned correctly
- **Evidence-backed:** All FINAL claims have valid, linked evidence
- **Conflict-resolved:** Conflicting evidence is detected and resolved

## Key Components

- **`schema.py`** — Data models, accuracy contracts, and tab-specific thresholds
- **`critic.py`** — Independent second-pass critic that downgrades overconfident claims
- **`evidence_chain.py`** — Enforces evidence linking and metadata completeness
- **`conflicts.py`** — Conflict detection and resolution engine
- **`method_reliability.py`** — Reliability scores for different detection methods
- **`notes/`** — Design documents and policy definitions
- **`reports/`** — Shadow evaluation reports (read-only, no behavior changes)

## Process Guardrails

**⚠️ IMPORTANT: Any future change to critic logic, contracts, thresholds, or evidence interpretation MUST be accompanied by a shadow evaluation against `labels_v0.json`.**

### Shadow Evaluation Requirements

Before implementing any accuracy calibration change:

1. **Create shadow evaluation script** in `accuracy/shadow_*.py`
2. **Run against ground truth:** `eval/gt_runs/20260108_012303/labels_v0.json`
3. **Check guardrails:**
   - Accuracy must remain ≥ 100%
   - Appropriate abstention must not regress below 85.71%
   - False abstention must remain ≤ 0%
   - FINAL rate must not increase unless justified
4. **Generate report** in `accuracy/reports/shadow_*_v0.md`
5. **Document recommendation:** "No enforcement needed" OR "Safe to enforce" with justification

### Baseline Reference

**Git Tag:** `accuracy-calibration-v0-complete`

This tag marks the completion of the v0 accuracy calibration cycle with:
- 100% accuracy
- 85.71% appropriate abstention
- 0% false abstention
- 60% FINAL rate

See `accuracy/notes/accuracy_v0_checkpoint.md` for full details.

### Ground Truth Dataset

**Location:** `eval/gt_runs/20260108_012303/labels_v0.json`

Contains 25 labeled items (5 tabs × 5 scans) with:
- `is_main_claim_correct`: yes/no/unsure
- `should_have_abstained`: yes/no/unsure
- Complete bundle files for each item

**Do not modify labels_v0.json** — it is the stable baseline for all shadow evaluations.

## Shadow Evaluation Examples

- **`shadow_prelim_abstain_eval.py`** — Evaluates PRELIMINARY vs ABSTAIN rubric (0 flips, all guardrails pass)
- **`shadow_counterevidence_dominance_eval.py`** — Evaluates counterevidence dominance rule (0 triggers in v0 dataset)
- **`shadow_evidence_quality_eval.py`** — Evaluates evidence quality thresholds (rejected due to false abstention)

## Development Workflow

1. **Identify calibration gap** from ground truth analysis
2. **Design candidate rule** (document in `notes/`)
3. **Implement shadow evaluation** (no production changes)
4. **Run against labels_v0.json** and check guardrails
5. **Generate report** with recommendation
6. **If safe:** Implement in critic/bundles with feature flag
7. **Monitor metrics** for regressions

## Questions?

See `accuracy/notes/accuracy_v0_checkpoint.md` for the complete v0 calibration summary.

