# AlgorithmLens Accuracy Audit Report

**Date:** February 15, 2026
**Auditor:** Claude (automated pipeline audit)
**Scope:** Full end-to-end scan classification pipeline

---

## Executive Summary

**Total Issues Found:** 7 Critical | 8 Important | 6 Minor

The AlgorithmLens classification pipeline has a solid foundation — the commercial classifier (Gold Standard v3.0) is well-engineered with evidence-based classification, confidence gating, and sanity checks. However, the Gemini AI analysis layer has several significant accuracy risks. The most impactful issues are: (1) the prompt uses accusatory language that violates the product's epistemic restraint principles and could bias classifications, (2) temperature is set to 0.1 instead of 0 which reduces classification consistency, (3) the model version uses an experimental tag (`gemini-2.0-flash-exp`) that could change without notice, and (4) there is no structured output schema enforced, meaning Gemini's response format could vary unpredictably. The video processor's tone classification uses extremely naive keyword matching ("good"/"love" = positive, "bad"/"hate" = negative) which is overwritten by Gemini when available, but persists as the sole tone signal for mobile scans when Gemini fails.

---

## Pipeline Map (Quick Reference)

```
USER'S DEVICE                    BACKEND                         FRONTEND
─────────────                    ───────                         ────────

┌─────────────┐    POST /api/    ┌──────────────────┐
│   Chrome     │──scan/desktop──>│  routes/scans.py  │
│  Extension   │                 │  (desktop_scan)   │
│ (capture     │                 └────────┬─────────┘
│  only)       │                          │
└─────────────┘                           │ if gemini_consent=True
                                          ▼
┌─────────────┐    POST /api/    ┌──────────────────┐    ┌────────────────────┐
│   Mobile     │──scan/upload──> │ video_processor.py│───>│ gemini_analyzer.py │
│  Video       │                 │ (OCR + keyword    │    │ (Gemini 2.0 Flash) │
│  Upload      │                 │  classification)  │    │ Topics, Sentiment, │
└─────────────┘                  └──────────────────┘    │ Politics, Wellbeing│
                                                         └────────┬───────────┘
                                                                  │
                                          ┌───────────────────────┘
                                          ▼
                                 ┌──────────────────┐    ┌────────────────────┐
                                 │  Evidence Bundles │    │ commercial_        │
                                 │  (per-tab truth)  │    │ classifier.py      │
                                 │  - ads_evidence   │    │ (Gold Std v3.0     │
                                 │  - politics_evid  │    │  pattern-based)    │
                                 │  - patterns_evid  │    └────────────────────┘
                                 │  - creators_evid  │
                                 │  - inferences     │    ┌────────────────────┐
                                 └────────┬──────────┘    │  scanAggregator.js │
                                          │               │  (multi-scan       │
                                          ▼               │   normalization)   │
                                 ┌──────────────────┐     └────────┬───────────┘
                                 │   database.py    │              │
                                 │   (Supabase)     │              ▼
                                 └──────────────────┘     ┌────────────────────┐
                                                          │  Dashboard Tabs    │
                                                          │  Overview, Sources,│
                                                          │  Ads, Politics,    │
                                                          │  Tone, Suggested   │
                                                          │  vs Followed       │
                                                          └────────────────────┘
```

### What each file does (in plain language)

1. **Chrome Extension** — Captures a snapshot of what's in the user's social media feed (posts, ads, creators). Sends the raw data to the backend. Does no analysis.
2. **routes/scans.py** — The "front door" of the backend. Receives scan data from the extension or video uploads. Kicks off processing.
3. **video_processor.py** — For mobile video uploads: extracts frames from the video, runs OCR (text recognition) on each frame, does basic keyword-based classification for topics, tone, and wellbeing themes.
4. **gemini_analyzer.py** — Sends post text to Google's Gemini 2.0 Flash AI model. Gemini classifies each post's topic, sentiment, political content, and wellbeing themes. This overwrites the keyword-based guesses when available.
5. **commercial_classifier.py** — A deterministic (no AI) classifier that detects ads and promotions using pattern matching. Very well-built with clear evidence trails and confidence levels.
6. **Evidence Bundles** (evidence_bundle.py, politics_evidence_bundle.py, etc.) — Aggregate classified data into structured "bundles" that serve as the single source of truth for each dashboard tab.
7. **scanAggregator.js** — Frontend code that combines data from multiple scans, normalizes across platforms, deduplicates, and prepares data for display.
8. **Dashboard Tabs** — The six React components that render the final visualizations users see.

---

## Step 1 — Pipeline Map

See the Quick Reference above. The pipeline has two entry paths:

**Desktop Extension Path:** Extension captures feed → sends to `/api/scan/desktop` → Gemini AI analysis (if consent given) → saved to database → frontend aggregation → dashboard display.

**Mobile Video Path:** User uploads video → video_processor.py extracts frames + OCR → keyword-based classification → Gemini AI analysis (runs automatically, no separate consent flag in this path) → saved to database → frontend aggregation → dashboard display.

**Commercial classification** runs separately via the evidence bundle layer, not through Gemini. It uses deterministic pattern matching on the text content.

---

## Step 2 — Prompt Audit

### The Gemini Prompt (gemini_analyzer.py, line 81–130)

The prompt is reproduced here for reference. It instructs Gemini to classify each post into five fields: `primary_topic`, `sentiment`, `is_political`, `political_topic`, and `wellbeing_themes`.

### Issues Found

#### CRITICAL-P1: Prompt Violates Epistemic Restraint Principles

The very first line of the prompt reads:

> *"You are an Expert Algorithm Auditor analyzing social media content. Your role is to detect subtle cues, emotional subtext, and engagement bait that algorithms use to manipulate user attention and wellbeing."*

This directly violates the epistemic restraint rules:
- Uses the word "manipulate" (banned word per epistemic-restraint SKILL.md)
- Infers algorithmic intent ("algorithms use to manipulate") — the product's core principle is to describe observable composition, never infer intent
- The instruction to "detect engagement bait" biases the classifier toward finding problems that may not exist, inflating negative classifications

**What could go wrong:** Gemini will be primed to interpret ambiguous content as manipulative or negative, producing inflated counts of negative sentiment, wellbeing risks, and engagement bait. Users would see a dashboard that makes their feed look worse than it actually is.

Later in the prompt (line 128–129):

> *"Look for subtle cues, emotional subtext, and engagement bait. If you detect even slight evidence of a theme, classify it."*

And:

> *"wellbeing_themes should include themes that are present, even if subtle. Look for engagement patterns, comparison triggers, and emotional manipulation tactics."*

Again uses "emotional manipulation" (banned), and the instruction to classify on "even slight evidence" creates a bias toward over-classification.

#### CRITICAL-P2: No Multi-Category Handling Rules

The prompt says to choose ONE `primary_topic` but provides no tiebreaker rules. A post about a politician attending a basketball game could be "politics" or "sports." A fitness influencer promoting a product could be "fitness," "business," or "beauty." The prompt gives no guidance on which category wins when multiple apply.

**What could go wrong:** Gemini will make arbitrary choices on borderline posts, producing inconsistent classifications. The same type of post could be classified differently in different scans.

#### IMPORTANT-P3: wellbeing_themes Can Be Multi-Label But Primary Topic Cannot

The prompt allows multiple `wellbeing_themes` per post but only one `primary_topic`. This means a sponsored fitness post would only appear in one topic category, losing the signal that it's also commercial content. The commercial classifier handles this separately, but the topic distribution on the Overview tab could be misleading.

#### IMPORTANT-P4: No "None of the Above" Handling for Wellbeing

The prompt lists 10 wellbeing themes but says to return an empty array if none apply. However, it also says "If you detect even slight evidence of a theme, classify it." This contradicts — it biases toward always finding something rather than returning empty.

**What could go wrong:** Wellbeing theme counts could be inflated, making users' feeds appear more concerning than they are.

#### IMPORTANT-P5: Misinformation Theme Is Problematic

The wellbeing theme "misinformation" asks Gemini to flag "false or misleading claims, conspiracy theories, unverified information." This is asking a general-purpose AI to be a fact-checker, which is unreliable and could surface incorrect flags. It also implies editorial judgment that conflicts with epistemic restraint (describing what appeared, not judging truth).

**What could go wrong:** Posts could be incorrectly flagged as misinformation, which is a serious accusation that could undermine user trust in the tool.

#### MINOR-P6: No Instruction for Non-English Content

The prompt provides no guidance on how to handle posts in languages other than English. Gemini may still attempt classification but accuracy will be unknown.

#### MINOR-P7: No Instruction for Image-Only or Video-Only Posts

Some posts may have no text (image-only memes, videos without captions). The prompt doesn't specify how to handle empty or near-empty text inputs.

---

## Step 3 — Category Definition Audit

### Current Definitions (from the Gemini prompt)

| Category | Definition | Edge Case Problems |
|----------|------------|-------------------|
| **sports** | "sports teams, games, athletes, scores, leagues" | Fantasy sports discussion — sports or gaming? Athlete fashion post — sports or fashion? Sports betting — sports or business? |
| **entertainment** | "movies, TV shows, celebrities, comedy, memes, viral content" | Celebrity political endorsement? Music video (music or entertainment)? True crime content? |
| **music** | "songs, artists, albums, concerts, music industry" | DJ performing at a fitness event? Music festival fashion? |
| **gaming** | "video games, esports, streamers, gaming culture" | Board game content? Gambling (gaming or business)? Gaming chair review (gaming or tech)? |
| **food** | "recipes, restaurants, cooking, food reviews" | Alcohol/wine content? Eating disorder recovery content (food or mental_health wellbeing)? |
| **fitness** | "workouts, gym, exercise, health routines" | Yoga meditation (fitness or lifestyle)? Physical therapy? Athletic wear haul (fitness or fashion)? |
| **beauty** | "makeup, skincare, cosmetics, beauty tutorials" | Cosmetic surgery discussion? Dermatologist advice (beauty or education)? |
| **fashion** | "clothing, style, outfits, fashion trends" | Thrift haul (fashion or lifestyle)? Uniform/workwear content? |
| **travel** | "destinations, vacations, trips, tourism" | Digital nomad content (travel or business)? Moving to a new city? |
| **tech** | "technology, gadgets, software, AI, crypto" | Crypto investment advice (tech or business)? AI art (tech or entertainment)? |
| **business** | "finance, investing, career, entrepreneurship" | Real estate content? MLM/pyramid scheme content? |
| **politics** | "elections, policy, government, political figures" | Social justice activism? Environmental content? Labor union content? |
| **news** | "current events, breaking news, journalism" | Satire news? Platform policy changes? Celebrity news (news or entertainment)? |
| **education** | "learning, tutorials, academic content, educational videos" | Fitness tutorial (education or fitness)? Coding tutorial (education or tech)? |
| **lifestyle** | "daily life, wellness, home, pets, parenting" | Catch-all risk — almost anything could be "lifestyle" |
| **general** | "if none of the above clearly apply" | Catch-all for everything ambiguous |

### Edge Cases That Expose Ambiguity (10 per category, showing 3 most problematic per category for brevity)

**Sports:**
1. "LeBron James endorsing a presidential candidate" → Politics or Sports?
2. "DraftKings betting odds for tonight's game" → Sports, Business, or Gaming?
3. "Athlete showing workout routine" → Sports or Fitness?

**Entertainment:**
1. "Celebrity speaking at a political rally" → Entertainment or Politics?
2. "Viral meme about inflation" → Entertainment, Politics, or News?
3. "Reality TV star promoting skincare" → Entertainment, Beauty, or Business?

**Politics:**
1. "Climate change documentary review" → Politics, News, Education, or Entertainment?
2. "Black Lives Matter protest footage" → Politics or News?
3. "Gun manufacturer ad" → Politics, Business, or Ads?

**Tone (Sentiment):**
1. Sarcastic post praising a politician → POSITIVE (words) or NEGATIVE (intent)?
2. Nostalgic post about a deceased celebrity → POSITIVE (love) or NEGATIVE (loss)?
3. Dark humor meme → Tone depends entirely on interpretation

**Finding:** 12 of the 15 topic categories have significant boundary overlap with at least 2 other categories. The prompt provides no tiebreaker rules. The "lifestyle" and "general" categories serve as undefined catch-alls.

---

## Step 4 — Response Parsing Audit

### File: gemini_analyzer.py (lines 244–279)

#### CRITICAL-R1: JSON Extraction Uses Fragile String Manipulation

```python
if response_text.startswith("```"):
    lines = response_text.split("\n")
    response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
```

This code tries to strip markdown code blocks from Gemini's response. However:
- It only checks for `` ``` `` at the start, not variations like `` ```json `` followed by a trailing `` ``` `` on its own line
- If Gemini returns `` ```json\n[...]\n``` `` with trailing whitespace on the last line, the `lines[-1] == "```"` check fails, and the trailing `` ``` `` stays in the JSON, causing a parse failure
- If Gemini wraps the response differently (e.g., extra text before or after the code block), this fails silently

**What could go wrong:** Scans would fail with a JSON parse error, and the entire Gemini analysis would be lost. The scan still succeeds but without any AI classification.

#### CRITICAL-R2: Count Mismatch Handled by Padding with Defaults

```python
if len(results) != len(posts):
    logger.warning(f"Gemini returned {len(results)} results for {len(posts)} posts")
    while len(results) < len(posts):
        results.append({
            "primary_topic": "general",
            "sentiment": "NEUTRAL",
            "is_political": False,
            "political_topic": None,
            "wellbeing_themes": []
        })
```

When Gemini returns fewer results than posts sent, the code silently pads the remaining posts with "general/NEUTRAL" defaults. This is a data integrity issue:
- There's no way to know WHICH posts Gemini skipped — the padding assumes it was the last N posts, but Gemini might have skipped posts in the middle
- The defaults dilute the actual classification distribution (inflating "general" and "NEUTRAL" counts)
- The warning is only logged, never surfaced to the user or dashboard
- If Gemini returns MORE results than posts, the extra results are silently ignored

**What could go wrong:** If Gemini consistently skips certain posts (e.g., very short ones), the dashboard would show inflated "general" and "NEUTRAL" counts, making the feed look more neutral than it is.

#### IMPORTANT-R3: No Field Validation on Gemini Response

The parsing code (in `merge_analysis_into_scan`, lines 304–341) reads fields from Gemini's response without validating their type or values:

```python
primary_topic = analysis.get("primary_topic", "general")
sentiment = analysis.get("sentiment", "NEUTRAL")
themes = analysis.get("wellbeing_themes", [])
is_political = analysis.get("is_political", False)
```

- `primary_topic` is not checked against the valid list of 16 categories. If Gemini returns "Sports" (capitalized) or "sport" (singular) instead of "sports", it creates a new category
- `sentiment` is not validated as one of POSITIVE/NEUTRAL/NEGATIVE. A lowercase "positive" or unexpected value passes through
- `wellbeing_themes` items are not validated against the valid theme list
- `is_political` is not type-checked — if Gemini returns the string "true" instead of boolean `true`, it would evaluate as truthy in Python but could cause issues downstream

**What could go wrong:** Phantom categories could appear in the dashboard. Sentiment counts could be wrong. The topic distribution chart could show unexpected labels.

#### IMPORTANT-R4: Variable Reference Before Assignment Risk

```python
except json.JSONDecodeError as e:
    logger.error(f"Failed to parse Gemini response as JSON: {e}")
    logger.debug(f"Response was: {response_text[:500] if 'response_text' in dir() else 'N/A'}")
```

The check `'response_text' in dir()` is a code smell — if the `response` object didn't have a `.text` attribute, this line would reference an undefined variable. The `dir()` check is unreliable for checking local variable existence.

---

## Step 5 — Determinism Audit

#### CRITICAL-D1: Temperature Set to 0.1, Not 0

```python
generation_config={
    "temperature": 0.1,
    "max_output_tokens": 8192,
}
```

The temperature is 0.1, not 0. While 0.1 is low, it still introduces randomness into classification. For a classification task where consistency is critical, temperature should be 0. The same feed content processed twice could produce different topic, sentiment, or political classifications.

**What could go wrong:** A user scanning the same feed twice could see different results, which undermines trust in the tool. The "Suggested vs Followed" tab could show different ratios from the same data.

#### CRITICAL-D2: Model Version Uses Experimental Tag

```python
_gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
```

The model is `gemini-2.0-flash-exp` — the `-exp` suffix indicates this is an experimental model that Google can change, update, or deprecate without notice. If Google updates the model, classification behavior could change overnight.

**What could go wrong:** One day all scans classify normally; the next day, after a silent model update, classifications shift dramatically. There would be no way to know the model changed, and no way to reproduce previous results.

#### IMPORTANT-D3: No Structured Output / JSON Mode Enforced

The Gemini API supports a `response_mime_type: "application/json"` configuration that forces JSON output. This is not being used. Instead, the prompt asks Gemini to "Return ONLY a JSON array, no other text" — but this is a soft instruction that Gemini can (and sometimes does) violate by adding explanatory text before/after the JSON.

**What could go wrong:** Gemini occasionally wraps responses in markdown code blocks (which the parser partially handles) or adds preamble text like "Here are the classifications:" which would cause a JSON parse failure.

#### MINOR-D4: No Seed Parameter

The Gemini API may support a `seed` parameter for reproducibility. This is not being used. Even at temperature 0, some model architectures can produce slightly different outputs without a fixed seed.

#### MINOR-D5: Retries Could Produce Different Results

The retry logic (3 attempts with exponential backoff) sends the exact same prompt on each retry. However, since temperature is 0.1, each attempt could produce slightly different results. There's no mechanism to detect or handle this inconsistency.

---

## Step 6 — Data Coverage Audit

### Tracing a Hypothetical Post Through the Pipeline

#### Desktop Extension Path

| Stage | What happens | Potential loss point |
|-------|-------------|---------------------|
| 1. Extension captures post | Post becomes a FeedItem in the scan payload | Posts could be missed if DOM parsing fails for certain post formats |
| 2. Payload sent to `/api/scan/desktop` | Full scan_result received | Large payloads could timeout; no size validation on the POST body |
| 3. Gemini analysis | `analyze_posts_batch()` receives all feed_items | **LOSS POINT:** If Gemini returns fewer results than posts, padding with defaults distorts data (see R2) |
| 4. Merge into scan_result | `merge_analysis_into_scan()` loops through feed_items | If `len(analysis_results) != len(feed_items)`, only the first N items get real analysis |
| 5. Save to database | `save_scan()` stores the full result | No validation that all items still present |
| 6. Frontend aggregation | `scanAggregator.js` processes stored data | No count reconciliation between stored items and displayed items |

#### Mobile Video Path

| Stage | What happens | Potential loss point |
|-------|-------------|---------------------|
| 1. Video uploaded | Saved to temp directory | Max 500MB limit enforced |
| 2. Frame extraction | cv2 reads frames from video | **LOSS POINT:** `frames_analyzed` depends on sampling interval; short videos may yield very few frames |
| 3. OCR on frames | Tesseract extracts text per frame | **LOSS POINT:** OCR can fail silently — empty text treated as "no content" |
| 4. Keyword classification | Simple keyword matching on OCR text | Crude classification; overwritten by Gemini when available |
| 5. Gemini analysis | Runs on extracted feed_items | Same loss points as desktop path step 3 |
| 6. Aggregation | Topic counts, sentiment scores computed | `total_samples = frames_analyzed if frames_analyzed > 0 else 1` — division guard but no minimum quality check |

#### IMPORTANT-C1: No Post Count Reconciliation

There is no mechanism at any stage to verify that the number of posts entering a stage matches the number leaving it. The only check is the Gemini result count comparison, which logs a warning but silently pads with defaults.

**What could go wrong:** Posts could be silently dropped at any stage and nobody would know. The dashboard would show results based on incomplete data without any indication.

#### IMPORTANT-C2: No Minimum Quality Threshold for Gemini Analysis

If Gemini fails entirely (returns None), the scan proceeds without AI classification. There's no minimum threshold for "enough posts must be successfully classified" before showing the dashboard. A scan with 50 posts where Gemini only classified 10 (and the rest were padded with defaults) would still display as a full scan.

#### MINOR-C3: Video Processor Equates Frames with Feed Items

In the video processor, `frames_analyzed` is used as `total_feed_items` in the aggregates. But a single social media post may span multiple frames (as the user scrolls). The frame count doesn't represent actual unique posts — it represents samples. This is acknowledged in a comment ("Treating samples as items for MVP") but could mislead users about the actual number of posts analyzed.

---

## Step 7 — Prioritized Recommendations

### Critical (Must Fix Before Beta)

| # | Problem | Real-World Consequence | Fix |
|---|---------|----------------------|-----|
| 1 | **Prompt uses banned epistemic language** (P1) | Dashboard classifications biased toward finding manipulation/negativity, making users' feeds look worse than they are. Directly undermines product credibility. | Rewrite the prompt's system instruction to use neutral, descriptive language. Remove "manipulate," "engagement bait," "emotional manipulation." Replace with: "You are a content classifier. Categorize each post by its observable content." |
| 2 | **Model version uses `-exp` tag** (D2) | Google could silently change the model, breaking classification consistency overnight. No way to reproduce results or detect the change. | Pin to a stable model version (e.g., `gemini-2.0-flash` without `-exp`). Add a model version field to scan metadata for traceability. |
| 3 | **Temperature at 0.1 instead of 0** (D1) | Same feed scanned twice produces different results, undermining user trust. | Set temperature to 0. |
| 4 | **No structured JSON output enforced** (D3) | Gemini occasionally returns non-JSON text, causing parse failures that silently drop all AI analysis for the scan. | Add `response_mime_type: "application/json"` to the generation config. This eliminates the need for the fragile code-block stripping logic. |
| 5 | **JSON extraction uses fragile string manipulation** (R1) | Certain Gemini response formats cause JSON parse failures, losing all AI analysis silently. | If structured output is enabled (fix #4), this becomes unnecessary. As a safety net, use a more robust JSON extraction regex. |
| 6 | **Count mismatch padded with defaults** (R2) | Inflates "general/NEUTRAL" counts when Gemini skips posts, distorting dashboard accuracy. | When Gemini returns fewer results, flag the scan's AI analysis as partial. Surface this in the dashboard's limits/caveats. Do not pad with defaults. |
| 7 | **No multi-category tiebreaker rules** (P2) | Borderline posts classified inconsistently, producing unreliable topic distributions. | Add explicit tiebreaker rules to the prompt: e.g., "If a post fits multiple categories, choose the most specific one. Prefer content-based categories (sports, food) over meta-categories (news, lifestyle, general)." |

### Important (Should Fix Soon)

| # | Problem | Real-World Consequence | Fix |
|---|---------|----------------------|-----|
| 8 | **No field validation on Gemini response** (R3) | Phantom topic categories, invalid sentiment values, or wrong types could appear in dashboard data. | Add validation: check `primary_topic` against valid list, validate `sentiment` enum, type-check all fields. Map unrecognized values to defaults with logging. |
| 9 | **Misinformation wellbeing theme** (P5) | Incorrectly flagging posts as misinformation is a serious accusation. Unreliable AI fact-checking undermines trust. | Remove "misinformation" from wellbeing themes, or clearly caveat it as "AI-estimated, may be inaccurate." Consider replacing with a more neutral framing. |
| 10 | **Over-classification bias in wellbeing themes** (P4) | Wellbeing concern counts inflated, making feeds appear more harmful than they are. | Change prompt instruction from "even slight evidence" to "only classify themes where there is clear, direct evidence in the text." |
| 11 | **No post count reconciliation** (C1) | Posts silently dropped at any pipeline stage with no detection mechanism. | Add count tracking at each pipeline stage. Log discrepancies. Surface in debug panel. |
| 12 | **No minimum quality threshold for Gemini** (C2) | Scans with mostly default-padded results displayed as if fully analyzed. | Track the ratio of real vs. default-padded classifications. If below a threshold (e.g., 80%), flag the scan's AI analysis quality. |
| 13 | **No structured output schema** (D3, expanded) | Even with JSON mode, Gemini could return fields with wrong names or types. | Define a JSON schema for the expected output and pass it via the API's schema parameter if available. |
| 14 | **Video processor tone detection is naive** (video_processor.py lines 729–737) | When Gemini is unavailable, tone is classified purely by whether the word "good" or "bad" appears in OCR text. Extremely inaccurate. | Document this clearly as a known limitation. Ensure Gemini is always available in production. Consider removing keyword-based tone as a fallback entirely. |
| 15 | **"political_polarization" wellbeing theme uses intent language** | "Divisive political content designed to create us-vs-them dynamics" implies algorithmic intent. Violates epistemic restraint. | Rephrase to: "Political content with strongly oppositional framing." |

### Minor (Nice to Have)

| # | Problem | Real-World Consequence | Fix |
|---|---------|----------------------|-----|
| 16 | **No handling for non-English content** (P6) | Unknown accuracy for non-English posts. | Add a language detection step or instruct Gemini to flag language. |
| 17 | **No handling for empty/image-only posts** (P7) | Posts with no text classified as "general/NEUTRAL" by default. | Add prompt instruction: "If the post text is empty or too short to classify, return primary_topic: 'general' and note the limitation." |
| 18 | **No seed parameter for Gemini** (D4) | Minor additional randomness even at temperature 0. | Set seed parameter if Gemini API supports it. |
| 19 | **Retries could produce different results** (D5) | Minimal impact at temperature 0, but still a theoretical concern. | Compare retry results and log inconsistencies. |
| 20 | **Frames ≠ feed items in video processor** (C3) | Users may misunderstand "25 posts analyzed" when it's actually "25 frames sampled." | Clarify in the UI that video scans show frame samples, not individual post counts. |
| 21 | **Variable reference risk in error handler** (R4) | Minor — could cause confusing error logs if `response_text` isn't defined. | Use a try/except or proper local variable check. |

---

## Appendix: Files Reviewed

| File | Role in Pipeline |
|------|-----------------|
| `backend/gemini_analyzer.py` | Core AI classification engine (Gemini 2.0 Flash) |
| `backend/commercial_classifier.py` | Deterministic ad/promotion classifier (Gold Standard v3.0) |
| `backend/video_processor.py` | Mobile video frame extraction + OCR + keyword classification |
| `backend/routes/scans.py` | API endpoints for scan upload and processing |
| `backend/evidence_bundle.py` | Evidence bundle builder for Ads & Influence tab |
| `backend/politics_evidence_bundle.py` | Evidence bundle for Politics tab |
| `backend/patterns_evidence_bundle.py` | Evidence bundle for Patterns tab |
| `backend/creators_evidence_bundle.py` | Evidence bundle for Creators tab |
| `backend/inferences_evidence_bundle.py` | Evidence bundle for Inferences tab |
| `backend/unified_scan_models.py` | Pydantic data models for scan results |
| `backend/promo_signals.py` | Deterministic promotion signal detection |
| `backend/text_signals.py` | Canonical text extraction and normalization |
| `backend/database.py` | Supabase persistence layer |
| `backend/accuracy/` (all files) | Accuracy framework: evidence chains, conflict resolution, statistics |
| `src/lib/dashboard/scanAggregator.js` | Frontend multi-scan aggregation (2415 lines) |
| `src/lib/dashboard/dataHelpers.js` | Frontend data processing helpers |
| `src/pages/dashboard/tabs/*.jsx` | Dashboard tab components (6 tabs) |

---

*This report was generated by an automated accuracy audit. All analysis was performed at the system level using synthetic/hypothetical examples. No actual user feed data was processed, viewed, or stored.*
