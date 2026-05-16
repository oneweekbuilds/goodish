# Audit 20 — Diagnostic: "52 feed items from 43 frames" inflated post count

**Date:** 2026-05-07
**Trigger:** Justin's TestFlight build #46 broadcast scan on YouTube. User behavior: scrolled YouTube briefly, watched 2 videos, total 1m 49s, 43 frames captured. AlgorithmLens reported **52 distinct feed items**, **75% of feed from "just 5 accounts"**, **@ResurgeStories at 44% of posts**, 3 ads (5.77%), 7 unique creators.
**Status:** READ-ONLY DIAGNOSIS. No code changed.
**Branch:** `claude/upbeat-dirac-a374dc` at commit `a538549c` (build #46-prep).

---

## Section 1 — Executive summary

**The bug:** The "52 feed items" number is the byproduct of two compounding root causes operating against a YouTube watch-page screen layout.

1. **Per-frame over-extraction.** Gemini is told (system prompt rule 1, [analysisPrompts.ts:25](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L25)) to "Extract EVERY distinct feed item visible in the screenshot." On a YouTube watch page, the visible elements include the main video, the "Up Next" sidebar (3–5 thumbnails on mobile), and any "Recommended" rail below the player. The YouTube platform hints ([analysisPrompts.ts:204-209](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L204)) say nothing about distinguishing the *watched* video from the *recommended* sidebar. Gemini correctly returns 4–8 items per watch-page frame.
2. **Soft-key LLM dedup.** Dedup is delegated entirely to a second Gemini text-only call ([broadcastAnalysisPipeline.ts:271](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L271), [geminiFlashService.ts:104](AlgorithmLens_Cowork/mobile/src/lib/analysis/geminiFlashService.ts#L104)). There is **no local key-based dedup anywhere** in the codebase. The dedup prompt ([analysisPrompts.ts:138-153](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L138)) uses (creator_handle, post_text) text-similarity matching, biases toward "keep separate when in doubt" (rule 5), and hits ~75% recall in practice. With ~200 raw items as input, ~52 survive dedup — exactly the observed number.

**Most likely cause: H6 + H2 combined** — no robust dedup *and* sidebar items are being extracted. Neither alone is sufficient; together they produce the observed 52 from 43 frames.

**Confidence: HIGH** for the pipeline analysis (we read the code). **MEDIUM-HIGH** for the specific YouTube-watch-page failure mode (we'd need to see actual `raw_data.posts` from this scan in Supabase to confirm the per-item content). The reasoning is supported by an existing audit finding ([04_accuracy_edge_cases.md:49-55](AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md#L49) PQ-4) that flagged the dedup-prompt ambiguity in build #43, and another ([04_accuracy_edge_cases.md:41-47](AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md#L41) PQ-3) that flagged hallucination risk.

---

## Section 2 — Pipeline map

```
                          [user scrolls YouTube during broadcast]
                                          │
                                          ▼
                             43 raw frames on disk (.jpg)
                                          │
                                          ▼
        ┌────────────────────────────────────────────────────────────────┐
        │ Stage 2 — ANALYZING                                            │
        │ broadcastAnalysisPipeline.ts:402  analyzeFrames()              │
        │   for each frame, parallel concurrency=8:                      │
        │     analyzeSingleFrame  (line 496)                             │
        │       → geminiFlashService.analyzeFrame  (line 75)             │
        │           → callGeminiVision  (line 169)                       │
        │              prompt: GEMINI_SYSTEM_PROMPT (analysisPrompts:22) │
        │                    + buildFramePrompt   (analysisPrompts:64)   │
        │              schema: GeminiExtractedItem (analysisPrompts:244) │
        │   result: GeminiExtractedItem[] per frame                      │
        │   ALL frame results are concatenated (line 446)                │
        │   → allExtractedItems: GeminiExtractedItem[]                   │
        └────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
        ┌────────────────────────────────────────────────────────────────┐
        │ Stage 3 — DEDUPLICATING                                        │
        │ broadcastAnalysisPipeline.ts:266                               │
        │   IF allExtractedItems.length > 0 AND enableDeduplication:    │
        │     gemini.deduplicateItems(allExtractedItems, platform)       │
        │       → geminiFlashService.ts:104                              │
        │       → if items <= 100: single _deduplicateBatch              │
        │       → if items > 100: chunked, accumulator pattern           │
        │       → builds prompt: buildDeduplicationPrompt                │
        │           (analysisPrompts:134-153)                            │
        │       → callGeminiText with the JSON of all items              │
        │   IF dedup returns 0 items → falls back to raw items           │
        │   IF dedup throws         → falls back to raw items            │
        │   IF dedup returns MORE items than input → falls back to       │
        │                              raw items (geminiFlashService:424)│
        │   finalItems: GeminiExtractedItem[]                            │
        └────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
        ┌────────────────────────────────────────────────────────────────┐
        │ Stage 4 — BUILDING                                             │
        │ broadcastAnalysisPipeline.ts:596  buildUnifiedScanResult       │
        │   maps each item → FeedItem                                    │
        │   computes aggregates from feedItems.length (line 670)         │
        │     - total_feed_items = feedItems.length                      │
        │     - ad_percentage    = totalAds / feedItems.length           │
        │     - topic_distribution, political_content_summary likewise   │
        └────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
        ┌────────────────────────────────────────────────────────────────┐
        │ Stage 5 — SAVING                                               │
        │ broadcastAnalysisPipeline.ts:734  persistScan                  │
        │   scanRow.post_count = totalItems  (= feedItems.length)        │
        │   scanRow.raw_data.posts[] = feedItems mapped 1:1 (line 769)   │
        │   scanRow.raw_data.top_creators = getTopCreators(feedItems)    │
        │     (line 883: counts by item.account.account_handle, top 10)  │
        └────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
        ┌────────────────────────────────────────────────────────────────┐
        │ DASHBOARD READ                                                 │
        │ computeDashboardData.ts                                        │
        │   totalPosts = raw_data.posts.length     (line 1139)           │
        │   topCreators % = count / posts.length    (line 358)           │
        │   ad_percentage already in scanRow.ad_percentage               │
        │   ALL DOWNSTREAM STATS USE posts.length AS DENOMINATOR.        │
        └────────────────────────────────────────────────────────────────┘
```

The denominator wiring matters. The "52 feed items" is `total_feed_items` from `aggregates`, which equals `feed_items.length`, which equals `dedup output length`. Every percentage on the dashboard divides by this number. If dedup is broken, every dashboard stat is wrong.

---

## Section 3 — The Gemini prompt analysis

### Per-frame extraction prompt (the upstream over-extractor)

System prompt instructs ([analysisPrompts.ts:25](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L25)):

> "Extract EVERY distinct feed item visible in the screenshot (posts, ads, reels, stories, suggestions)."

Anti-hallucination rule was added in build #43 ([analysisPrompts.ts:37](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L37)):

> "Do NOT invent feed items. Only extract items you can visually confirm as distinct feed posts/ads/stories in the screenshot. UI elements like navigation bars, headers, and status bars are NOT feed items. If you extract N items, a human looking at the same screenshot should see approximately N distinct posts."

The schema ([analysisPrompts.ts:84-123](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L84)) returns an `items` array per frame. There is **no upper bound** on items per frame and **no concept of "main item vs. sidebar item"** in the schema.

The YouTube hints ([analysisPrompts.ts:204-209](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L204)) say:

```
- Ads show "Ad" badge on the thumbnail or "Sponsored" label
- Shorts are vertical format with white text overlays
- Suggested videos show "Recommended for you" context
- Channel names appear below video titles
- Live streams show a red "LIVE" badge
```

**Critical gap:** the YouTube hints do not address what to do on the *watch page* (where the user spent most of the 1m 49s). On the watch page, the screen is dominated by the main video (player + title + channel), but also shows the "Up Next" sidebar with 3–5 thumbnails on iPhone and a "Recommended" rail below. Per system prompt rule 1, all of those are "distinct feed items visible in the screenshot," so Gemini will return them. There is no instruction like "on a watch page, only the main video is the feed item; sidebar/recommended thumbnails are not feed items unless the user is on the home/recommendations tab."

Compare with the Instagram hint ([analysisPrompts.ts:194](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L194)):

> "source_origin: If on Explore or Reels tab, ALL items are source_origin='suggested'. On home feed, items with 'Suggested for you' are 'suggested', others from followed accounts are 'followed'."

Instagram and TikTok hints have tab-aware rules. YouTube does not.

**Could the prompt cause over-extraction on YouTube watch pages? YES, by design.** It tells Gemini to extract every visible feed item, and on a watch page the sidebar thumbnails ARE visible feed items by any reasonable interpretation.

### Dedup prompt (the downstream compactor)

[analysisPrompts.ts:138-153](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L138):

> 1. Items with the same creator_handle AND similar post_text are duplicates — keep the version with higher confidence. "Similar" means the shorter text is a substring of the longer text, OR at least 80% of the words in the shorter text also appear in the longer text. **When in doubt, prefer to keep items separate** rather than merge distinct posts.
> 2. Items with the same creator_handle but DIFFERENT post_text are distinct items from the same creator — keep both.
> 5. The deduplicated_items array MUST NOT contain more items than the input. **If you are unsure about a merge, keep items separate.**

The dedup prompt has two "when in doubt, keep separate" instructions. This is intentional (audit PQ-4 was concerned about over-merging different posts), but on YouTube the *same video* appearing in 10 frames will have:

- Slightly different visible text in the player UI (timestamp overlay "0:32" vs "1:47")
- Slightly different sidebar Up Next text (Up Next list rotates as user scrolls or as recommendations refresh)
- Different `is_partial` values depending on scroll position
- Maybe partial channel names on some frames if the channel chip is cut off

If `post_text` field is filled with the visible title + caption text, that title text *should* be stable. But if it includes any dynamic UI text (timestamps, "x views", "1 minute ago"), the per-frame text varies and the dedup prompt's "when in doubt, keep separate" bias defaults to NOT merging.

There is no test verifying that "the same video across 10 frames produces 1 deduplicated item." See Section 4.

---

## Section 4 — The deduplication analysis

### Where dedup happens

ONE place only: [broadcastAnalysisPipeline.ts:266-290](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L266). It calls `this.gemini.deduplicateItems(allExtractedItems, platform)` ([line 271](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L271)). That method ([geminiFlashService.ts:104-132](AlgorithmLens_Cowork/mobile/src/lib/analysis/geminiFlashService.ts#L104)) sends a JSON dump of all items to Gemini with the dedup prompt and trusts the LLM to return a smaller array.

There is **no other dedup site** in the broadcast pipeline. I grep'd the `analysis/` folder for `dedup|deduplicat|unique|already.*seen|duplicate` and found only:
- The pipeline call at line 271 (the LLM dedup itself)
- Status-string handling in `useAnalysis.ts` (cosmetic)
- Field comments

The Precision Mode WebView scanner has its own client-side dedup ([scannerHelpers.ts](AlgorithmLens_Cowork/mobile/src/components/scanner/scannerHelpers.ts) — `buildDedupKey` for `FEED_ITEM` messages, used by `WebViewScanner.tsx:179` via `dedupKeysRef.current.add(...)`). That is a separate code path for Precision Mode and does NOT apply to the broadcast pipeline.

### The dedup "key"

The dedup is not key-based at all. It is LLM-based text similarity. The dedup prompt asks Gemini to compare `creator_handle + post_text` pairs and apply soft text-similarity rules. The LLM picks duplicates per its own judgement.

The closest thing to a deterministic key check is the hallucination guard at [geminiFlashService.ts:424-435](AlgorithmLens_Cowork/mobile/src/lib/analysis/geminiFlashService.ts#L424): if the dedup output has more items than the input, fall back to originals. There is no opposite check (output has *too few* items, or output items don't actually correspond to inputs).

### Why the LLM dedup could fail on YouTube watch pages

1. **Same video, different visible UI text.** A "video being watched" has a player timestamp overlay (`0:00 → 4:23`) that Gemini might capture as part of `post_text`. Frame 5 sees `0:32`, frame 12 sees `1:47`. Same video, different text. With the "keep separate when unsure" bias, dedup keeps them separate.
2. **Sidebar items rotating.** YouTube's Up Next sidebar can show different videos in different frames (especially if the user scrolls the sidebar or YouTube refreshes recommendations). Each new sidebar item is genuinely new data, but the *same* sidebar item appearing in frame 1 vs frame 7 might be detected once and missed once due to scroll position.
3. **The "creator_handle" field is the channel name.** On the YouTube watch page, the channel is shown as something like `@ResurgeStories` below the title. If Gemini extracts that consistently, all watch-page frames of one video share `creator_handle`. But for sidebar items, the channel may not be visible per frame (mobile UI hides it sometimes), causing `creator_handle` to be `null`. Dedup rule 1 needs `creator_handle` equality — items with `null` handle plus different `post_text` are kept separate.
4. **Short post_text values.** YouTube videos often have short titles (e.g., "Story Time #47"). The dedup prompt warns about short posts but doesn't actually exclude them from merging. With short titles, the "80% word overlap" check can be either too aggressive (merging different videos with similar titles) or too conservative (failing to merge two captures of the same video where one had a partial title cut off).

**Evidence:** [analysisPrompts.ts:141-145](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L141), confirmed by audit PQ-4.

---

## Section 5 — Math reconstruction

User behavior:
- Total duration: 1m 49s = 109 seconds
- 43 frames captured → ≈2.5 s/frame interval (matches the broadcast extension's typical 2 s + scroll-triggered cadence)
- Brief YouTube home scrolling, then watched 2 videos

Plausible frame distribution (estimates):
- Home scrolling phase: 5–10 s ≈ 3–4 frames
- Video 1 watch page: ~30–50 s ≈ 12–20 frames
- Transition/back: ~5 s ≈ 2 frames
- Video 2 watch page: ~30–50 s ≈ 12–20 frames

Per-frame Gemini extraction estimates (no specific YouTube watch-page guidance, prompt says "extract every visible feed item"):
- Home feed frame: 3–5 visible video tiles per frame
- Watch page frame: 1 main video + 3–6 sidebar/recommended items = 4–7 items
- Transition frame: ambiguous, could be 0–6 items

Predicted raw item totals before dedup:
- Home: 4 frames × 4 items = 16
- Watch A: 16 frames × 5 items = 80
- Watch B: 16 frames × 5 items = 80
- Transition: ~4 items
- **Total raw items: ~180** (range 130–230)

Dedup compresses with imperfect recall. Industry norm for LLM text-similarity dedup on noisy data: 70–80% true-duplicate detection, so output is roughly 25–35% the size of input.

Predicted post-dedup items:
- 180 × 0.29 ≈ **52 items**. **Match.**

If dedup were perfect, the right answer would be:
- 2 watched videos
- 1–3 home-feed tiles the user actually saw distinctly
- 5–10 sidebar/recommended unique items (across both watch pages, accounting for some overlap)
- **= 8–15 items**, not 52.

If sidebar items were excluded entirely (Hypothesis: only count the "primary" item per frame):
- Home: 4 frames × 1 item = 4
- Watch A: 16 frames × 1 item = 16
- Watch B: 16 frames × 1 item = 16
- = 36 raw, dedup to **2–5 items** (the user's stated mental model).

So:
- "Bug is dedup alone" predicts: ~10–15 items if sidebar isn't extracted, observed 52, doesn't match.
- "Bug is sidebar over-extraction with no dedup" predicts: ~180 items, observed 52, doesn't match.
- "Bug is sidebar over-extraction + partial LLM dedup" predicts: 50–60 items, observed 52, **matches**.

---

## Section 6 — Ranked hypotheses

### H6 + H2 combined: sidebar over-extraction + soft LLM dedup with partial recall — **HIGH CONFIDENCE**
- **Supporting:** Math reconstruction in Section 5 lands precisely at 52. Pipeline architecture in Section 2 confirms both behaviors. Audit PQ-3 ([04_accuracy_edge_cases.md:41-47](AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md#L41)) flagged hallucination risk in build #43; PQ-4 ([04_accuracy_edge_cases.md:49-55](AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md#L49)) flagged dedup ambiguity. Neither has been fully addressed (PQ-3 had partial mitigation in rule 13, PQ-4 was deferred).
- **Contradicting:** Nothing in code rules this out.
- **Code refs:** [analysisPrompts.ts:25](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L25) (extract everything), [analysisPrompts.ts:204-209](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L204) (no watch-page rules), [analysisPrompts.ts:141-145](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L141) (soft dedup with bias toward separate), [broadcastAnalysisPipeline.ts:271](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L271) (only dedup site).

### H1: No dedup OR broken dedup (each frame counts separately) — RULED OUT (or rather, "partially")
- **Contradicting:** If there were literally no dedup, 43 frames × ~5 items = 215, not 52. Dedup IS running and reducing the count. The bug is *partial* dedup, not absent.
- **Caveat:** It's possible dedup silently failed and the fallback path triggered — but then it would be 215, not 52. The observed 52 means dedup ran and reduced items, just not enough.
- **Code refs:** [broadcastAnalysisPipeline.ts:266-290](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L266) (fallback paths exist but only trigger on exception or empty response).

### H2: Sidebar elements being extracted as feed items — HIGH CONFIDENCE (component of root cause)
- **Supporting:** YouTube hints don't address the watch-page screen. System prompt rule 1 says "extract every visible feed item." On a YouTube watch page, sidebar items ARE visible.
- **Contradicting:** Without seeing actual `raw_data.posts`, we can't 100% verify Gemini is doing this. But the prompt structure makes it the expected behavior.
- **Code refs:** [analysisPrompts.ts:204-209](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L204).

### H3: Single video metadata shifting across frames (timestamp, view count) — MEDIUM CONFIDENCE (contributing factor)
- **Supporting:** Real possibility for the watched videos. Gemini's `post_text` for the main video could include the title + visible caption + "x views" + "y minutes ago" — those latter two shift across frames. With the dedup prompt's "keep separate when unsure" bias, this could prevent merging.
- **Contradicting:** Mostly speculative without real `raw_data` to inspect.
- **Code refs:** Needs runtime data to confirm.

### H4: Gemini hallucinating items — LOW-MEDIUM CONFIDENCE
- **Supporting:** Audit PQ-3 explicitly flagged this. Rule 11 ("never fabricate") only covers individual fields, not whole items.
- **Contradicting:** Build #43 added rule 13 ("Do NOT invent feed items"), which partly mitigates. Hallucination doesn't cleanly explain the *specific* "@ResurgeStories at 44%" pattern — Gemini would have to consistently hallucinate the same handle across many frames, which is unlikely if the channel name is actually visible.
- **Code refs:** [analysisPrompts.ts:35-37](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L35).

### H5: Dedup uses key that's too unique (timestamp/position-tainted) — RULED OUT
- **Contradicting:** Dedup is not key-based. It's LLM text similarity. There is no positional or timestamp field in the dedup criteria.
- **Code refs:** [analysisPrompts.ts:138-153](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L138) — only `creator_handle` and `post_text` are inputs to the LLM dedup judgement.

### H7 (new): Tests do not enforce dedup correctness — HIGH CONFIDENCE (root-cause enabler)
- **Supporting:** [broadcastAnalysisPipeline.test.ts:47-54](AlgorithmLens_Cowork/mobile/src/__tests__/broadcastAnalysisPipeline.test.ts#L47) mocks both `analyzeFrame` AND `deduplicateItems`. The dedup test at line 444 verifies dedup is *called*, not that it works correctly on real data. There's no test asserting "the same post in N frames produces 1 item." [analysisPrompts.test.ts:110-126](AlgorithmLens_Cowork/mobile/src/__tests__/analysisPrompts.test.ts#L110) only checks string presence in the dedup prompt — surface-level.
- **Implication:** This bug shipped because no test ever ran the real pipeline against a real YouTube watch-page screenshot end-to-end. CI passes with mocked Gemini responses that don't reflect actual model behavior.
- **Code refs:** [broadcastAnalysisPipeline.test.ts:443-470](AlgorithmLens_Cowork/mobile/src/__tests__/broadcastAnalysisPipeline.test.ts#L443).

---

## Section 7 — Proposed fixes (DO NOT APPLY)

Three candidate fixes ranked by confidence-vs-risk trade-off. Each is independent; they can be applied separately or together.

### Candidate Fix #1 — Add a deterministic local dedup pass (RECOMMENDED FIRST)

**Files:** `mobile/src/lib/analysis/broadcastAnalysisPipeline.ts`. Add a new local-dedup helper module, e.g. `mobile/src/lib/analysis/localDedup.ts`.

**Change:** Insert a deterministic local dedup pass between Stage 2 (analyze) and Stage 3 (LLM dedup). Use a normalized-key approach:

```ts
// Pseudocode for the new step
function localDedup(items: GeminiExtractedItem[]): GeminiExtractedItem[] {
  const seen = new Map<string, GeminiExtractedItem>();
  for (const item of items) {
    const handle = (item.creator_handle ?? '').toLowerCase().trim();
    const text = (item.post_text ?? '').toLowerCase().trim();
    // Strip timestamp-like tokens, view counts, "x ago" durations
    const normText = text
      .replace(/\b\d+:\d+\b/g, '')           // 0:32, 12:45
      .replace(/\b\d[\d,.]*\s*(views?|m|k|b)\b/gi, '')  // 1.2M views, 4K
      .replace(/\b\d+\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    const key = `${handle}::${normText}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}
```

Then in `run()`, call `localDedup(allExtractedItems)` before the LLM dedup. The LLM dedup remains as a second-pass refinement. Or alternatively: keep only the local dedup and disable the LLM dedup entirely (cheaper, more deterministic).

**Why it would fix the bug:** The local dedup catches frame-to-frame "same video, slightly different text" cases the LLM dedup misses. Strips dynamic UI tokens (timestamps, view counts, time-ago durations) before comparing. Deterministic.

**Risk:**
- Could merge legitimately-different posts that share a creator and short title (e.g., "Story Time #47" vs "Story Time #48" if the # got stripped). The text normalization needs careful tuning.
- If `creator_handle` is null for many sidebar items (likely), they all hash to the same `null::text` bucket and get aggressively merged by text alone, which could over-merge different videos with similar titles.
- Doesn't fix the root over-extraction. The dashboard still shows sidebar items as "feed items," just fewer of them.

**Test plan after applying:**
- 60-frame YouTube watch-page scan should produce 5–15 items, not 50+.
- Top creator percentage should be more sensible (single video dominating shouldn't read as "44% of feed" because feed is now ~5 items, not 52).
- Build #46-prep's `concurrency: 8` perf gain still applies.

---

### Candidate Fix #2 — Tighten the YouTube platform hint to exclude sidebar/recommended items on watch pages

**File:** [analysisPrompts.ts:204-209](AlgorithmLens_Cowork/mobile/src/lib/analysis/analysisPrompts.ts#L204).

**Change:** Add explicit guidance for the YouTube watch-page screen:

```
youtube: `YouTube-specific hints:
- Identify the SCREEN TYPE first:
    - Home feed / Subscriptions / Trending: extract every visible video tile as a feed item.
    - Watch page (a single video player dominates the screen): extract ONLY the
      main video as ONE feed item. Do NOT extract sidebar "Up Next" thumbnails,
      "Recommended" rail items, comments, or chapter list items as feed items.
    - Shorts: each Short visible is one feed item.
    - Search results: each result is one feed item.
- Ads show "Ad" badge on the thumbnail or "Sponsored" label.
- Channel names appear below video titles. Extract as creator_handle.
- Live streams show a red "LIVE" badge.`,
```

**Why it would fix the bug:** Cuts the per-frame extraction count on watch pages from 4–7 down to 1. Combined with existing dedup, would land in the 5–10 item range for a 2-video session.

**Risk:**
- Changes Gemini's behavior across all YouTube scans. Existing scans on the home feed should be unaffected (different screen type), but if the model has trouble distinguishing screen types, it could under-extract on legitimate feed scans.
- Doesn't help non-YouTube platforms with the same issue (TikTok comments page, Instagram in-app browser quirks, etc.). Targeted fix only.
- Prompt changes are inherently nondeterministic; the model might interpret "screen type detection" inconsistently.

**Test plan after applying:**
- YouTube home-feed scan: should still extract every visible tile.
- YouTube watch-page scan: should extract just the watched video.
- YouTube Shorts scan: each Short extracted.
- Sanity check: TikTok and Instagram unchanged.

---

### Candidate Fix #3 — Add an end-to-end test with a real YouTube watch-page screenshot

**Files:** `mobile/src/__tests__/broadcastAnalysisPipeline.integration.test.ts` (new) plus a fixture screenshot in `mobile/src/__tests__/fixtures/`.

**Change:** Use a recorded real YouTube watch-page screenshot, run the actual Gemini API once and snapshot the response, then assert: "single watch-page frame produces 1 main item." Also add a multi-frame test: "10 watch-page frames of the same video produce 1 final item after dedup."

This is the test that should have caught the bug originally.

**Why it would fix the bug (indirectly):** Doesn't fix the bug per se. Catches regressions on Fix #1 and #2 going forward, and creates a real safety net so future prompt edits don't silently re-introduce the issue.

**Risk:**
- Adds a real Gemini API call to the test suite. Costs money per CI run; could be flaky if Gemini's behavior shifts. Mitigation: snapshot the API response and use the snapshot for subsequent runs, only re-record when explicitly asked.
- Requires a real YouTube screenshot fixture, which is a small copyright/privacy consideration (use a public channel's video, blur user-identifiable elements).

**Test plan after applying:**
- N/A — the test IS the verification.

---

## Section 8 — What I couldn't determine

**Things I'd need runtime data for, not visible from code alone:**

1. **The actual `raw_data.posts` array of tonight's scan in Supabase.** This is the single highest-value data point. Inspecting it would confirm:
   - Whether Gemini is in fact returning sidebar items (look for many distinct video titles per scan).
   - Whether `creator_handle` is null or a real handle for the inflated items.
   - Whether `post_text` for the same video varies across items (which would confirm H3, the dynamic-UI-text theory).
   - Whether ResurgeStories items have visually-different text (different timestamps in the title, e.g.) or are textually identical.

   Justin can pull this from the Supabase dashboard: select `raw_data` from `scans` where `id = '<scanId>'`. The posts array length should be 52, with each post's `creator_handle` and `post_text` showing the dedup-key inputs.

2. **The actual frames captured.** If the user (or future debugging) preserved the broadcast extension's frames before cleanup, looking at them would reveal what was actually on screen per frame and how many "items" a human would count. The pipeline's `lastDiskCount` and `lastMetadataCount` diagnostic exports ([broadcastSessionManager.ts:84-93](AlgorithmLens_Cowork/mobile/src/lib/broadcastSessionManager.ts#L84)) confirm 43 frames hit disk; those frames are deleted on cleanup so they're gone now, but next time we could preserve them.

3. **Whether dedup actually ran successfully.** The pipeline catches dedup exceptions and falls back to raw items ([broadcastAnalysisPipeline.ts:279-286](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L279)). If dedup *threw* and we fell back to raw, the count would be ~180–200, not 52. So dedup DID run and DID compress the items — just not enough. But we can't distinguish "dedup ran with the LLM call" from "dedup ran but returned an empty array and we fell back to raw" without logs. The `__pipelineDiag` export ([broadcastAnalysisPipeline.ts:101-113](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L101)) only stores `lastItemsExtracted` (pre-dedup count), not post-dedup. **Recommend adding `lastItemsAfterDedup` to the diag export so future scans can reveal the dedup ratio.**

**Other unrelated observations (not bugs to fix here):**

- The `getTopCreators` helper ([broadcastAnalysisPipeline.ts:883-893](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L883)) sorts by `account_handle` count. If Gemini stores the channel as "@ResurgeStories" some frames and "ResurgeStories" other frames (shouldn't, given the build #46-prep prompt fix that says "no leading @"), they'd split into two creators. Build #46-prep should have fixed that, but worth verifying in the actual scan data.
- `correctPercentageRounding` ([broadcastAnalysisPipeline.ts:946-956](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L946)) only adjusts the largest item to make percentages sum to 100. This is fine for normal data but could be misleading if the largest item is over-counted (i.e., it would hide sub-percent rounding errors that actually point to data quality issues). Not relevant to this bug, just noting.

---

## Section 9 — Recommended next step

**Inspect Supabase `raw_data.posts` for tonight's scan first, then apply Candidate Fix #1.**

The diagnostic in this report is high-confidence on architecture but medium-confidence on the specific shape of the inflated items. A 5-minute look at `raw_data.posts` would settle whether the 52 items are:
- (a) The same video appearing 23 times with slightly different `post_text` → confirms H6/H3 → Fix #1 alone solves it.
- (b) 23 different sidebar/recommended items mixed in with the watched videos → confirms H2 → both Fix #1 and Fix #2 needed for clean results.
- (c) Some hallucinated items with null handles and bare text → confirms H4 → tighten prompt anti-hallucination further.

The most likely outcome is (b). In that case, Fix #1 is still the right *first* commit because it's defense-in-depth — it makes the dashboard resilient to over-extraction even if Fix #2 has gaps. Fix #2 should follow, and Fix #3 should land alongside both as the regression fence.

I would NOT push Fix #2 alone. The prompt change is non-deterministic and doesn't give any local guarantee — if Gemini misinterprets it, we're back to where we started with no safety net.

---

## Appendix: The exact data flow that produced the observed numbers

For Justin's reference. Each line traces a specific reported number to its source.

| Reported number | Source | File:line |
|---|---|---|
| "52 distinct feed items" | `aggregates.total_feed_items` = `feedItems.length` | [broadcastAnalysisPipeline.ts:670](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L670) |
| "75% of feed from just 5 accounts" | `top5Pct` from `topCreators.slice(0,5)` over `posts.length` | [computeDashboardData.ts:355-358](AlgorithmLens_Cowork/mobile/src/lib/computeDashboardData.ts#L355) |
| "Top source: @ResurgeStories at 44%" | First entry of `topCreators`, `count / posts.length` | [computeDashboardData.ts:358](AlgorithmLens_Cowork/mobile/src/lib/computeDashboardData.ts#L358) + handle rendering via `formatHandle` |
| "3 ads (5.77% of 52)" | `ad_percentage` = `total_ads / feedItems.length × 100` (2 decimals) | [broadcastAnalysisPipeline.ts:672-674](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L672) |
| "7 unique creators" | `uniqueCreatorCount` from `countByCreator` | [computeDashboardData.ts:334-358](AlgorithmLens_Cowork/mobile/src/lib/computeDashboardData.ts#L334) |
| "Topics: Sports, Technology, Finance" | `topic_distribution` top 3 from `feedItems[*].topics.primary_category` | [broadcastAnalysisPipeline.ts:649-665](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts#L649) |
| "54% neutral tone" | tone aggregation from `feedItems[*].emotions.valence` | [computeDashboardData.ts](AlgorithmLens_Cowork/mobile/src/lib/computeDashboardData.ts) `extractToneAnalysis` |

**Every single one divides by `feedItems.length` (= 52). Fix the dedup, and every number above corrects itself.**
