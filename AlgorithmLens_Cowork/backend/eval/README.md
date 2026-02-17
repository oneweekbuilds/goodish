# Accuracy Evaluation Harness (v3.1 HPA + CMA)

This folder contains the **evaluation harness scaffolding** for Accuracy Architecture v3.1, covering both the **Hallucination Prevention Architecture (HPA)** and the **Correctness Maximization Architecture (CMA)**.

> Phase 5B: This is *scaffolding only* – no live analysis behavior or thresholds are changed yet.

---

## Goals

- Provide a **repeatable harness** for running evaluations against:
  - Golden datasets (curated, fully labeled scans)
  - Edge-case fixtures (boundary conditions, empty scans, low coverage, etc.)
  - Adversarial fixtures (evasion attempts, sarcasm, Unicode tricks, etc.)
- Make it easy to:
  - Run all fixtures in a single command
  - Capture outputs in a timestamped directory
  - Plug in metric calculators in later phases

---

## Directory Layout

All paths are relative to `backend/eval/`.

- `run_eval.py`  
  Skeleton CLI script that:
  - Discovers fixture input files under `fixtures/**`
  - Loads them into memory
  - Calls a placeholder `analyze_fixture(fixture)` function (currently raises `NotImplementedError`)
  - Writes raw outputs into `outputs/<timestamp>/`

- `manifest.schema.json`  
  JSON Schema for dataset manifests used by golden datasets and fixture collections. It is intentionally conservative and will be extended in future phases as the accuracy architecture is implemented.

- `fixtures/`
  - `golden/` – Placeholder for full golden dataset inputs and manifests
  - `edge/` – Placeholder for edge-case fixtures (e.g., `FIX_EMPTY`, `FIX_MINIMAL`)
  - `adversarial/` – Placeholder for adversarial fixtures (e.g., `ADV_UNICODE`, `ADV_NEGATION`)

- `outputs/`
  - Timestamped directories will be created here by `run_eval.py`, e.g.:
    - `outputs/2025-01-06T12-00-00Z/edge_FIX_EMPTY.json`

---

## How Evaluations Will Work (Future Phases)

1. **Prepare fixtures**
   - Each fixture will be a JSON file representing either:
     - A full unified scan payload, or
     - A minimal input that the analysis pipeline can consume.
   - Golden datasets will include:
     - `manifest.json` with scenario metadata
     - `scans/*.json` with input scans
     - `expected/*.json` with expected analysis outputs (including abstentions and confidence bands).

2. **Run the harness**

```bash
cd apps/alg-gemini/backend
python -m eval.run_eval --suite edge
```

Planned behavior (not yet implemented in Phase 5B):

- `--suite edge` will run only edge fixtures
- `--suite golden` will run only golden dataset scans
- `--suite adversarial` will run adversarial fixtures
- `--suite all` will run everything

3. **Compute metrics**

In later phases, additional modules under `backend/eval/` will:

- Load the raw outputs from `outputs/<timestamp>/`
- Compare them to the expected outputs from manifests
- Compute HPA metrics (abstention, forbidden claims, phrasing compliance, etc.)
- Compute CMA metrics (confidence calibration, interval coverage, adversarial pass rate, etc.)

---

## Current Limitations (Phase 5B)

- `run_eval.py` does **not** yet call the real analysis pipeline – it only defines the contract via `analyze_fixture`.
- No metrics are computed yet; this is **structure only**.
- Fixture directories are present but empty except for `.gitkeep` placeholders.

These limitations are intentional for Phase 5B so we can land the scaffolding without touching any production analysis behavior or existing outputs.


