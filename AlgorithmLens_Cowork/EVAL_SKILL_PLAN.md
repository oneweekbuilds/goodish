# Eval Skill — Implementation Plan

**Date:** February 15, 2026
**Status:** AWAITING YOUR APPROVAL — No code will be written until you say go.

---

## Plain-Language Summary

Here's what I want to build, explained without code jargon:

**The big idea:** A tool that automatically checks whether AlgorithmLens is doing its job correctly. It does this by:

1. Going to Twitter/X in your browser and reading what's actually on the screen (the "ground truth")
2. Running that same data through AlgorithmLens's analysis
3. Comparing what AlgorithmLens said vs. what was actually there
4. If anything is wrong, figuring out what broke and trying to fix it
5. Repeating until everything passes (or giving up after 10 tries and telling you what's still broken)

**Why this matters:** Right now, there's no automated way to know if AlgorithmLens is accurately describing someone's feed. This tool creates that quality check.

---

## What I'll Build (In Order)

### Phase 1: Twitter/X Capture Module
**What it does:** Opens Twitter in your browser, reads the posts that are visible, and saves them as structured data.

**Files I'll create:**
```
backend/eval/platforms/
    __init__.py
    registry.py              ← Makes it easy to add new platforms later
    common/
        __init__.py
        schema.py            ← The shared data format all platforms normalize to
        grader.py            ← Compares analysis output vs ground truth
        fixer.py             ← Orchestrates the fix-and-retry loop
        reporter.py          ← Generates human-readable reports
    twitter/
        __init__.py
        capture.py           ← Reads Twitter's DOM to extract post data
        selectors.py         ← CSS selectors for finding posts, authors, metrics, etc.
        normalize.py         ← Converts Twitter-specific data into the common format
```

**How capture works:** Uses the Claude-in-Chrome browser tools to:
- Navigate to twitter.com (assumes you're already logged in)
- Scroll through the feed slowly (with pauses to be gentle)
- Read post content, author handles, engagement numbers, media types
- Take a screenshot for visual reference
- Save everything as a JSON snapshot

**Important:** This does NOT automate login, doesn't rapidly hit APIs, and doesn't do anything that looks suspicious. It just reads what's already on screen, like a human would.

### Phase 2: Analysis Integration
**What it does:** Takes the captured data and runs it through AlgorithmLens's existing analysis pipeline.

**How it works:**
- Converts the captured Twitter data into the `UnifiedScanResult` format (which is what AlgorithmLens already expects)
- Calls the Gemini analyzer on the feed items
- Generates all six evidence bundles
- Saves the complete analysis output

**Files I'll modify:**
- `backend/eval/run_eval.py` ← Wire up the placeholder `analyze_fixture()` to actually run analysis

**Files I'll create:**
- `backend/eval/platforms/common/pipeline.py` ← Bridges captured data → UnifiedScanResult → analysis pipeline

### Phase 3: Grading System
**What it does:** Compares the analysis output against the ground truth and scores it.

**Grading criteria (as you specified):**
- **Content type distribution**: Are the percentages of text/image/video/link posts accurate within ±5%?
- **Post count**: Does the analysis account for every captured post?
- **Engagement ranges**: Are the reported engagement numbers accurate within ±5%?
- **Source diversity**: Are author/source metrics accurate within ±5%?
- **Theme accuracy**: Does every identified theme map to real post content? (No hallucinated themes)
- **Epistemic restraint**: Does ANY output speculate about why content appeared? (Automatic fail)
- **Content references**: Is every quoted/referenced post actually in the captured data?
- **Completeness**: No missing posts, no phantom posts, all six tabs have output

**Output:** A JSON grading report with pass/fail per criterion, accuracy percentages, and suggested fix categories.

### Phase 4: Fix Loop
**What it does:** For each failing criterion, identifies what went wrong and attempts to fix it.

**Fix categories:**
- **Parsing bugs** (data not being read correctly) → Fix data processing code
- **Analysis logic errors** (wrong calculations) → Fix the analysis module
- **Prompt engineering issues** (Gemini speculating about intent) → Refine the Gemini prompts
- **Data pipeline issues** (posts being lost or duplicated) → Fix the data flow

**Honest note about this phase:** Fully automated code fixing is the most ambitious part. For v1, I recommend:
- **Auto-fix** for prompt engineering issues (these are just text changes)
- **Auto-fix** for known patterns (e.g., off-by-one count errors, missing normalizations)
- **Suggest-only** for structural code issues (tells you what's wrong and where, but asks you to approve the fix)

**Max iterations:** 10 cycles, then it stops and gives you a report of what's still failing.

### Phase 5: CLI Entry Point & Reporting
**What it does:** Gives you a simple way to run the whole thing.

**Command:** `python backend/eval/run_eval.py --platform twitter --threshold 0.05 --max-cycles 10`

**Reports generated:**
- Per-cycle grading results
- Before/after accuracy scores
- What was broken and how it was fixed
- Cumulative history of all eval runs (so you can see improvement over time)

### Phase 6: Grader Tests
**What it does:** Tests the grading logic itself, so we can trust its judgments.

**Files I'll create:**
- `backend/eval/platforms/common/test_grader.py` ← Unit tests for every grading criterion
- `backend/eval/platforms/twitter/test_capture.py` ← Tests for the Twitter capture module
- `backend/eval/platforms/common/test_reporter.py` ← Tests for report generation

---

## What I WON'T Do

- **Won't automate Twitter login** — you handle that yourself
- **Won't rapidly scrape** — gentle DOM reading with delays
- **Won't modify your existing dashboard** — this is a separate eval tool
- **Won't delete or overwrite existing eval fixtures** — additive only
- **Won't auto-fix without logging** — every change is documented

---

## How Long This Will Take

Realistically, this is a multi-session project. Here's the build order:

| Phase | What | Estimated Effort |
|-------|------|-----------------|
| 1 | Twitter capture module | Session 1 |
| 2 | Analysis integration | Session 1-2 |
| 3 | Grading system | Session 2 |
| 4 | Fix loop | Session 2-3 |
| 5 | CLI & reporting | Session 3 |
| 6 | Grader tests | Session 3 |
| 7 | End-to-end test run | Session 3-4 |

---

## Questions for You Before I Start

1. **Gemini API key**: The analysis pipeline calls Gemini Flash. Is your API key configured in `.env.local`? (I won't read the file, just need a yes/no)

2. **Twitter session**: Are you currently logged into Twitter/X in your Chrome browser?

3. **Which feed**: Should I capture from the "For You" tab, "Following" tab, or both?

4. **Threshold preference**: You mentioned ±5% — do you want this as the default, or should I start stricter/looser?

5. **Fix loop scope**: For v1, are you okay with auto-fix for prompt changes only, and suggest-only for code changes? (I can expand auto-fix later as we build confidence)

---

## Approval Needed

Per your instructions in CLAUDE.md, I will not write any code until you review this plan and tell me to proceed. Let me know:
- ✅ "Looks good, go ahead" — I'll start with Phase 1
- ✏️ "Change X" — I'll revise the plan
- ❓ "I have questions" — Happy to explain anything further
