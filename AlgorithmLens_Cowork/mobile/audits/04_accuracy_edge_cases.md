# AlgorithmLens Mobile — Accuracy & Edge Case Audit

**Audit Date:** 2026-02-20
**Auditor:** Claude (Automated Code Audit)
**Scope:** Gemini prompt quality, response parsing, pipeline logic, dashboard computation, broadcast capture edge cases, analysis pipeline edge cases, dashboard edge cases
**Status:** READ-ONLY AUDIT — No code changes made

---

## Table of Contents

1. [Gemini Prompt Quality](#1-gemini-prompt-quality)
2. [Response Parsing Robustness](#2-response-parsing-robustness)
3. [Pipeline Logic](#3-pipeline-logic)
4. [Dashboard Data Display](#4-dashboard-data-display)
5. [Broadcast Capture Edge Cases](#5-broadcast-capture-edge-cases)
6. [Analysis Pipeline Edge Cases](#6-analysis-pipeline-edge-cases)
7. [Dashboard Edge Cases](#7-dashboard-edge-cases)
8. [Confidence Assessment](#8-confidence-assessment)

---

## 1. Gemini Prompt Quality

### Finding PQ-1: Ad Classification Ambiguity — Organic Brand Content vs. Sponsored
- **Category:** Prompt Quality
- **Severity:** HIGH
- **What could go wrong:** The system prompt (line 4 of GEMINI_SYSTEM_PROMPT) instructs Gemini to detect ads by looking for labels like "Sponsored", "Ad", "Promoted", "Paid partnership". However, it does NOT define what to do with organic brand content (e.g., Nike's official account posting without a "Sponsored" label) or influencer partnerships that lack the "Paid partnership" disclosure. Gemini may inconsistently classify these as ads or non-ads depending on its own training biases.
- **What currently happens:** The prompt says to detect ads by label presence only (line 4). An organic post from @CocaCola would be classified as `is_ad: false` because no ad label is visible, which is technically correct. But an influencer post where the "#ad" is in the caption text (not a platform label) has ambiguous handling — the prompt doesn't mention hashtag-based ad detection.
- **What SHOULD happen:** The prompt should explicitly define: (a) Organic brand content from official accounts is NOT an ad unless a platform ad label is present; (b) Influencer posts with "#ad", "#sponsored", or "#partner" in caption text SHOULD be classified as ads with `ad_detection_reason: "Hashtag disclosure in caption"`; (c) Native/integrated content (brand account posting without label) should be classified as non-ad content.
- **Exact fix needed:** Add to GEMINI_SYSTEM_PROMPT rule 4: `Also check caption text for disclosure hashtags like #ad, #sponsored, #partner, #collab — these indicate undisclosed or hashtag-disclosed paid content. Do NOT classify organic posts from brand accounts as ads unless a platform ad label or disclosure hashtag is present.`

### Finding PQ-2: Political Content Definition is Underspecified
- **Category:** Prompt Quality
- **Severity:** HIGH
- **What could go wrong:** Rule 8 says "For political content, identify policy area and lean direction if apparent" but never defines what counts as "political." A news article about a weather disaster could be classified as political (climate policy) or not. A post about gun violence could be classified as political or as a news/crime story. A post criticizing a tech CEO could be political or technology commentary.
- **What currently happens:** The `political.is_political` field is entirely at Gemini's discretion. The topic list includes "Politics" as a primary_category, but there's no guidance on when `political.is_political` should be `true` vs. when `topics.primary_category` should be "Politics". These are independent fields with no coordination instructions.
- **What SHOULD happen:** The prompt should define political content explicitly: "Political content is any post that (a) references a political figure, party, or candidate by name, (b) advocates for or against specific legislation or policy, (c) is about elections, voting, or political campaigns, or (d) takes a clear stance on a partisan issue. News reporting about events with political implications (e.g., natural disasters, crime) is NOT political unless it explicitly frames the event in terms of policy or partisan blame."
- **Exact fix needed:** Add a `POLITICAL CLASSIFICATION RULES` section to the system prompt with the above definition. Also add: "If `political.is_political` is true, `topics.primary_category` MUST be 'Politics'."

### Finding PQ-3: Hallucination Risk — No Item Count Constraint
- **Category:** Prompt Quality
- **Severity:** CRITICAL
- **What could go wrong:** The prompt says "Extract EVERY distinct feed item visible in the screenshot" but provides no upper bound. Gemini could hallucinate items that aren't in the screenshot, especially for blurry or partially-visible content. There's no instruction to correlate extractions with the OCR text to verify item existence.
- **What currently happens:** The prompt includes OCR text (rule 12) and says "NEVER fabricate handles, text, or hashtags you cannot see" (rule 11). However, rule 11 only covers individual fields, not entire items. Gemini could fabricate an entirely new item structure with null handles and empty text — this wouldn't violate rule 11 because all fields would be null/empty.
- **What SHOULD happen:** Add explicit anti-hallucination constraints: "Do NOT add items that you cannot visually confirm in the screenshot. If unsure whether a visual element is a feed item or UI chrome (navigation bar, status bar, etc.), do NOT include it. The number of items should match what a human would count by scrolling through the visible feed area of the screenshot."
- **Exact fix needed:** Add to system prompt: `13. Do NOT invent feed items. Only extract items you can visually confirm as distinct feed posts/ads/stories in the screenshot. UI elements like navigation bars, headers, and status bars are NOT feed items. If you extract N items, a human looking at the same screenshot should see approximately N distinct posts.`

### Finding PQ-4: Deduplication Prompt Lacks Precision on "80% Overlap"
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** The deduplication prompt (buildDeduplicationPrompt) says items with "similar post_text (>80% overlap)" are duplicates. "80% overlap" is ambiguous — does it mean Levenshtein distance, word overlap, semantic similarity? Gemini will interpret this inconsistently. A short post "Nice!" appearing twice from different creators could be merged. Two posts with 80% identical text but different meanings (e.g., retweet vs. original) could be incorrectly merged.
- **What currently happens:** The dedup prompt passes all items as a JSON blob to Gemini and asks it to evaluate textual overlap. With dozens of items, this is a lot of context for Gemini to process accurately. The fallback (line 367-375 of geminiFlashService.ts) returns all items un-deduped if parsing fails.
- **What SHOULD happen:** The dedup criteria should be more precise: "Two items are duplicates if and only if they have the SAME creator_handle AND the post_text is functionally identical (same content, possibly truncated at different points). Short posts (<20 characters) should only be merged if creator_handle matches exactly."
- **Exact fix needed:** Revise buildDeduplicationPrompt rule 1 to: `Items with the same creator_handle AND post_text that is functionally identical (same content, possibly truncated differently) are duplicates. For short posts (<20 characters), require an EXACT creator_handle match and near-identical text. Never merge items from different creators.`

### Finding PQ-5: Temperature 0.1 — Should It Be 0?
- **Category:** Prompt Quality
- **Severity:** LOW
- **What could go wrong:** Temperature 0.1 introduces slight randomness. For a deterministic extraction task, temperature 0 would maximize reproducibility. The same screenshot analyzed twice could produce slightly different results at temp 0.1.
- **What currently happens:** generationConfig uses `temperature: 0.1` (line 158 of geminiFlashService.ts). Combined with `topP: 0.8`, this allows modest sampling variation.
- **What SHOULD happen:** For feed item extraction (a structured data extraction task), temperature 0 is more appropriate. The slight randomness of 0.1 provides no benefit and undermines reproducibility.
- **Exact fix needed:** Change `temperature: 0.1` to `temperature: 0` and `topP: 0.8` to `topP: 1.0` in both `callGeminiVision` and `callGeminiText`.

### Finding PQ-6: Platform Hints May Become Stale
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** Platform UI changes frequently. The hints reference specific UI patterns (e.g., "Sponsored" label placement on Instagram, "Promoted" label on Twitter/X). If platforms change their ad labeling (Twitter/X has already changed from "Promoted" to "Ad" and back), the hints become inaccurate, causing Gemini to miss ads.
- **What currently happens:** Static PLATFORM_HINTS dictionary (lines 151-193 of analysisPrompts.ts). Twitter hint says both "Promoted" and "Ad" which is good. Instagram hint says "Sponsored" below account name which is currently accurate.
- **What SHOULD happen:** Hints should be versioned and include a "last verified" date. Consider making hints updatable via remote config rather than requiring app updates.
- **Exact fix needed:** Add a comment with the last-verified date for each platform's hints. Consider moving hints to a remotely-updatable config. For now, add to Twitter/X hints: `Note: X frequently changes ad labeling. Look for any of: "Promoted", "Ad", "Sponsored", or any label indicating paid content.`

### Finding PQ-7: No Few-Shot Examples in Prompt
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** The prompt provides a JSON schema but no concrete examples of correct extraction. Few-shot prompting is a well-established technique for improving LLM accuracy, especially for structured output tasks. Without examples, Gemini may misinterpret edge cases like story highlights (are they feed items?), or comment threads visible in a screenshot.
- **What currently happens:** The prompt provides only the schema template with placeholder values. No example of a correctly-filled JSON response is shown.
- **What SHOULD happen:** Include 1-2 few-shot examples showing correct extraction for common scenarios (e.g., a feed with an ad, a regular post, and a suggested post).
- **Exact fix needed:** Add a `EXAMPLE OUTPUT (for reference):` section to the frame prompt with a synthetic example showing 2-3 items correctly extracted. Keep it short to not waste too many tokens.

### Finding PQ-8: "MIXED" Valence is Underspecified
- **Category:** Prompt Quality
- **Severity:** LOW
- **What could go wrong:** The emotions schema includes "MIXED" as a valid valence but the prompt doesn't define when to use it. Is a post about "celebrating a friend's recovery from illness" POSITIVE or MIXED? Is "outrage at injustice leading to positive action" POSITIVE, NEGATIVE, or MIXED? Gemini will interpret inconsistently.
- **What currently happens:** The dashboard's `extractToneAnalysis` (computeDashboardData.ts, line 541-544) counts POSITIVE, NEUTRAL, and NEGATIVE but ignores MIXED entirely. Items with MIXED valence are dropped from the tone calculation (they don't increment any counter, so they reduce `knownValenceTotal`).
- **What SHOULD happen:** Either (a) define MIXED clearly and count it in the dashboard, or (b) remove MIXED from the schema and force Gemini to choose the dominant tone. Option (b) is simpler and avoids data loss.
- **Exact fix needed:** In the prompt schema, change `"valence": "<POSITIVE|NEUTRAL|NEGATIVE|MIXED>"` to `"valence": "<POSITIVE|NEUTRAL|NEGATIVE>"` and add: `Choose the dominant emotional tone. If truly ambiguous, classify as NEUTRAL.` Also update `extractToneAnalysis` to handle MIXED items by mapping them to NEUTRAL as a fallback.

### Finding PQ-9: source_origin Relies on Label Detection Without Fallback
- **Category:** Prompt Quality
- **Severity:** HIGH
- **What could go wrong:** The `source_origin` field ("suggested" or "followed") is critical for the Suggested vs Followed tab. The prompt asks Gemini to detect "Suggested for you" labels, but many platforms don't consistently label all suggested content. On TikTok's For You page, ALL content is suggested, but none is labeled "Suggested for you." On Instagram Explore, all content is suggested but doesn't carry the "Suggested for you" label. On Twitter/X's "For You" tab, most content is algorithmically recommended but only some carries "Because you follow" labels.
- **What currently happens:** The prompt (rule 5) lists specific labels to look for. If no label is visible, `source_origin` defaults to `null`. In `validateSourceOrigin` (broadcastAnalysisPipeline.ts line 684-686), any value other than "suggested" or "followed" becomes `null`. In the dashboard, `null` source_origin items are not counted as either suggested or followed — they become invisible in the Suggested vs Followed breakdown.
- **What SHOULD happen:** The prompt should instruct Gemini to infer source_origin from context: "If the user is on a 'For You', 'Explore', or 'Discover' tab, ALL items are 'suggested' unless they show clear 'Following' context. If the user is on a 'Following' or 'Home' tab, items from followed accounts are 'followed' and items with recommendation labels are 'suggested'. If you cannot determine origin, set to null."
- **Exact fix needed:** Add platform-specific source_origin inference rules to each platform's hints. For TikTok: "If on For You page, all items are source_origin='suggested'. If on Following page, all items are source_origin='followed'." For Instagram: "If on Explore/Reels tab, all items are source_origin='suggested'." This requires the prompt to detect which tab/page the user is on.

---

## 2. Response Parsing Robustness

### Finding RP-1: JSON Wrapped in Markdown Backticks
- **Category:** Response Parsing
- **Severity:** LOW (mitigated)
- **What could go wrong:** Gemini might return JSON wrapped in ```json ... ``` despite the prompt saying "No markdown, no code fences."
- **What currently happens:** The generationConfig includes `responseMimeType: 'application/json'` (line 163 of geminiFlashService.ts). This is a Gemini API feature that forces the response to be valid JSON, stripping markdown wrapping. The `parseFrameResponse` method (line 306-341) does `JSON.parse(rawText)` which would fail on markdown-wrapped JSON, but this is mitigated by the `responseMimeType` setting.
- **What SHOULD happen:** Current mitigation via `responseMimeType` is good. However, as a defense-in-depth measure, the parser should strip markdown fences before parsing.
- **Exact fix needed:** Add to `parseFrameResponse` before `JSON.parse`: `let cleaned = rawText.trim(); if (cleaned.startsWith('```')) { cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''); }` This is low priority since `responseMimeType` already handles it.

### Finding RP-2: Extra Text Before/After JSON
- **Category:** Response Parsing
- **Severity:** LOW (mitigated)
- **What could go wrong:** Gemini might add explanatory text before or after the JSON despite instructions.
- **What currently happens:** Same mitigation as RP-1 — `responseMimeType: 'application/json'` forces pure JSON output. If Gemini ever returns non-JSON, `JSON.parse` fails and the catch block (line 333-340) returns an empty response with `extraction_confidence: 0` and `items: []`.
- **What SHOULD happen:** The fallback (empty items array) is appropriate. Frame data is silently lost but the pipeline continues. This is good behavior.
- **Exact fix needed:** None critical. Could log a more specific warning distinguishing "JSON parse failed" from "items array missing" for debugging.

### Finding RP-3: Wrong Field Types (String Instead of Number, etc.)
- **Category:** Response Parsing
- **Severity:** MEDIUM
- **What could go wrong:** Gemini returns `"estimated_position": "3"` (string) instead of `3` (number), or `"is_ad": "true"` (string) instead of `true` (boolean).
- **What currently happens:** `sanitizeExtractedItem` (lines 387-432 of geminiFlashService.ts) handles this defensively: `estimated_position` checks `typeof raw.estimated_position === 'number'` and falls back to `index + 1`. `is_ad` uses `Boolean(raw.is_ad)` which correctly converts string `"true"` → `true`, but ALSO converts string `"false"` → `true` (any non-empty string is truthy). This means if Gemini returns `"is_ad": "false"` as a string, the item is incorrectly classified as an ad. Similarly, `"is_ad": "Sponsored"` → `true` (accidentally correct but for wrong reason), `"is_ad": "No"` → `true` (incorrect).
- **VERIFIED by code tracing:** Line 397: `is_ad: Boolean(raw.is_ad)`. `Boolean("false") === true`. `Boolean("No") === true`. `Boolean("") === false`. `Boolean(0) === false`. `Boolean(null) === false`. Only empty string, null, undefined, 0, and false produce false.
- **Additional finding (Cycle 1):** `extraction_confidence` (line 330): `clamp(parsed.extraction_confidence ?? 0.5, 0, 1)` — if Gemini returns `"extraction_confidence": "high"`, then `"high" ?? 0.5` = `"high"` (not null/undefined), and `clamp("high", 0, 1)` → `Math.min(1, Math.max(0, NaN))` = `NaN`. The confidence becomes NaN, which propagates to any downstream computation that uses it.
- **What SHOULD happen:** The `Boolean()` conversion for `is_ad` must explicitly check for boolean true or string "true". The confidence clamping must coerce to number first.
- **Exact fix needed:** Change `is_ad: Boolean(raw.is_ad)` to `is_ad: raw.is_ad === true || raw.is_ad === 'true'`. Change confidence clamping to: `extraction_confidence: clamp(typeof parsed.extraction_confidence === 'number' ? parsed.extraction_confidence : 0.5, 0, 1)`.

### Finding RP-4: Gemini Returns More Items Than Actually in Screenshot
- **Category:** Response Parsing
- **Severity:** MEDIUM
- **What could go wrong:** Gemini could hallucinate extra items, inflating post counts and skewing all percentage calculations.
- **What currently happens:** There is NO validation of item count against any ground truth. The sanitizer accepts any number of items Gemini returns. There's no maximum item count per frame. A typical phone screen shows 2-4 feed items, so >10 items per frame would be suspicious.
- **What SHOULD happen:** Add a sanity check: if Gemini returns more than ~8-10 items per frame (an unreasonably high number for a single screen), flag this as suspicious and lower the extraction_confidence. Consider also cross-referencing item count with OCR text (if OCR finds 3 distinct @handles, 10 items is suspicious).
- **Exact fix needed:** In `parseFrameResponse`, after sanitizing items, add: `if (items.length > 10) { console.warn(\`Frame ${frameNumber}: suspiciously high item count (${items.length}), possible hallucination\`); return { frame_id, extraction_confidence: Math.min(extraction_confidence, 0.3), items }; }`

### Finding RP-5: Gemini Returns Zero Items for Content-Rich Frame
- **Category:** Response Parsing
- **Severity:** LOW
- **What could go wrong:** Gemini returns an empty `items` array for a frame that clearly contains feed content, causing data loss.
- **What currently happens:** The parseFrameResponse method (line 314-320) handles missing items array by returning empty items with confidence 0.5. If items is an empty array `[]`, that's accepted as-is with whatever confidence Gemini assigned. The frame's data is silently lost. The pipeline continues to the next frame.
- **What SHOULD happen:** Zero items on a frame with substantial OCR text is suspicious. Consider logging a warning when OCR text is non-trivial but items are empty, and flagging this in debug info.
- **Exact fix needed:** In `analyzeSingleFrame`, after getting the response: `if (response.items.length === 0 && params.ocrText.length > 100) { console.warn(\`Frame ${frameNumber}: Gemini returned 0 items despite substantial OCR text (${params.ocrText.length} chars)\`); }`

### Finding RP-6: sanitizeExtractedItem Falsy-Value Bug
- **Category:** Response Parsing
- **Severity:** MEDIUM
- **What could go wrong:** Several fields use `||` instead of `??` for defaults, which means falsy but valid values get overwritten. For example, `stance_or_alignment_guess: raw.political?.stance_or_alignment_guess || null` — if stance is the empty string `""`, it becomes `null`. More critically, `wellbeing_relevance: raw.wellbeing?.wellbeing_relevance || 'NONE'` — if wellbeing_relevance is an empty string, it defaults to 'NONE', which is actually correct behavior. But `source_origin: raw.source_origin || null` means a source_origin of `""` becomes `null`, which is the desired behavior.
- **What currently happens:** The `||` operator is used throughout `sanitizeExtractedItem`. For most fields, empty string → null/default is acceptable behavior. But `emotions.valence: raw.emotions?.valence || 'NEUTRAL'` means if Gemini returns an empty string for valence, it defaults to NEUTRAL, which inflates the neutral count.
- **What SHOULD happen:** Use explicit null/undefined checks for fields where empty string is meaningfully different from null.
- **Exact fix needed:** Change `valence: raw.emotions?.valence || 'NEUTRAL'` to `valence: (raw.emotions?.valence && typeof raw.emotions.valence === 'string' && raw.emotions.valence.trim()) ? raw.emotions.valence.trim().toUpperCase() : 'NEUTRAL'`. This normalizes casing and rejects empty strings.

### Finding RP-7: Deduplication Can Return More Items Than Input
- **Category:** Response Parsing
- **Severity:** MEDIUM
- **What could go wrong:** Nothing prevents Gemini from returning MORE items in `deduplicated_items` than the original `allItems` count. Gemini could split items, hallucinate new ones, or simply return a mangled list.
- **What currently happens:** `parseDeduplicationResponse` (line 346-376) accepts whatever Gemini returns. If `deduplicated_items` has more entries than `allItems`, this is accepted silently. The `deduplicated_count` comes from Gemini's self-report, not from actual counting.
- **What SHOULD happen:** Validate that `deduplicated_items.length <= allItems.length`. If not, fall back to allItems.
- **Exact fix needed:** In `parseDeduplicationResponse`, after parsing: `if (parsed.deduplicated_items.length > allItems.length) { console.warn('Dedup returned more items than input, falling back'); return { deduplicated_items: allItems, original_count: originalCount, deduplicated_count: allItems.length, duplicate_pairs_found: 0 }; }`

---

## 3. Pipeline Logic

### Finding PL-1: Aggregates Computed from Correct Source Data (Post-Dedup)
- **Category:** Pipeline Logic
- **Severity:** LOW (correct)
- **What could go wrong:** If aggregates were computed from pre-dedup items, percentages would be wrong.
- **What currently happens:** In `buildUnifiedScanResult` (line 367-493), the `items` parameter is the FINAL deduped list. `feedItems` is built from `items` (line 374). `totalAds` is computed from `feedItems` (line 419). `topicCounts` computed from `feedItems` (line 421). `politicalItems` computed from `feedItems` (line 435). All aggregates use `feedItems.length` as the denominator. This is CORRECT — aggregates are computed from the deduped set.
- **What SHOULD happen:** Current behavior is correct.
- **Exact fix needed:** None.

### Finding PL-2: ad_percentage Precision Issue
- **Category:** Pipeline Logic
- **Severity:** LOW
- **What could go wrong:** The `ad_percentage` is computed with 2 decimal places in the pipeline (`Math.round(... * 10000) / 100`) but with 0 decimal places in the dashboard (`Math.round(... * 100)`). These could produce inconsistent numbers.
- **What currently happens:** Pipeline (broadcastAnalysisPipeline.ts line 441): `Math.round((totalAds / feedItems.length) * 10000) / 100` → e.g., 33.33%. Dashboard (computeDashboardData.ts line 727): `Math.round((adCount / totalPosts) * 100)` → e.g., 33%. The pipeline stores to Supabase with 2-decimal precision, but the dashboard re-computes from raw posts with integer precision.
- **What SHOULD happen:** The dashboard should either read the pre-computed ad_percentage from the scan record OR compute consistently. Currently, the dashboard DOES re-compute from raw posts (line 726-727), which means the value shown to the user (33%) may differ from what's stored in Supabase (33.33%).
- **Exact fix needed:** Align precision. Either make both use the same rounding method, or have the dashboard read ad_percentage from the scan row when raw_data.posts is available. The discrepancy is cosmetic but could confuse users who compare dashboard numbers to API data.

### Finding PL-3: suggested_percentage Inconsistency Between Pipeline and Dashboard
- **Category:** Pipeline Logic
- **Severity:** HIGH
- **What could go wrong:** The pipeline computes `suggested_percentage` differently from the dashboard, leading to conflicting numbers.
- **What currently happens:**
  - Pipeline (broadcastAnalysisPipeline.ts line 522-524): `suggested_percentage: totalItems > 0 ? Math.round((suggestedCount / totalItems) * 100) : 0` — computes from ALL items, where `suggestedCount` counts items with `source_origin === 'suggested'`.
  - Dashboard (computeDashboardData.ts line 730-731): `suggestedCount = posts.filter(p => p.is_suggested).length` — counts based on `is_suggested` field, NOT `source_origin`.
  - These are DIFFERENT FIELDS. In the pipeline's `persistScan` (line 533), `is_suggested` is set to `item.source_origin === 'suggested'`. So both should agree... BUT the raw_data.posts stores `is_suggested: item.source_origin === 'suggested'` while the actual `source_origin` might be null for many items (see PQ-9).
  - When `source_origin` is null (which is common — see PQ-9), `is_suggested` will be `false`, and BOTH the suggested AND followed counts will be wrong. A null source_origin item is counted as "followed" (line 731: `followedCount = totalPosts - suggestedCount`), which inflates the followed count.
- **What SHOULD happen:** Items with null source_origin should be in a third "unknown" category, not lumped into "followed."
- **Exact fix needed:** In computeDashboardData.ts, compute: `const unknownOriginCount = posts.filter(p => p.is_suggested === null || p.is_suggested === undefined).length;`. Display suggested/followed/unknown breakdown. In buildSuggestedInsight, handle the three-way split. This is a significant product decision — discuss with product team.

### Finding PL-4: Topic Distribution Percentage Can Sum to More/Less Than 100%
- **Category:** Pipeline Logic
- **Severity:** LOW
- **What could go wrong:** Each item has exactly one `primary_category`, so topic percentages should sum to ~100%. With rounding, they might sum to 99% or 101%.
- **What currently happens:** In buildUnifiedScanResult (lines 425-433), percentages use `Math.round(... * 10000) / 100`. For 3 items: 1 Entertainment (33.33%), 1 News (33.33%), 1 Sports (33.33%) → sums to 99.99%. No normalization is done to ensure sum = 100%.
- **What SHOULD happen:** Either note that percentages may not sum to exactly 100% due to rounding, or apply the same normalization technique used in `extractToneAnalysis` (adjusting the largest category to force sum to 100%).
- **Exact fix needed:** Low priority. Add a comment noting the rounding behavior. If exact 100% is needed, apply the largest-remainder method.

### Finding PL-5: Backend Enrichment ad_percentage Division Error
- **Category:** Pipeline Logic
- **Severity:** MEDIUM
- **What could go wrong:** The backend enrichment payload divides ad_percentage by 100, but the stored value was already computed as a percentage (0-100).
- **What currently happens:** In `requestBackendEnrichment` (line 625): `ad_percentage: result.aggregates.ad_percentage / 100` — this converts from 33.33% to 0.3333. If the backend expects a 0-1 scale, this is correct. If the backend expects 0-100, this is a bug. The comment says "Backend expects 0-1" which clarifies intent.
- **What SHOULD happen:** The division by 100 is intentional per the comment. This is correct IF the backend truly expects 0-1. However, the backend endpoint `/api/scan/desktop` also receives the original desktop extension data where `ad_percentage` is 0-1 (see useScan.ts line 71: `ad_percentage: totalItems > 0 ? totalAds / totalItems : 0`). So the pipeline is correctly converting to match.
- **Exact fix needed:** None — behavior is correct. But the asymmetry is confusing. Add a comment clarifying: `// Pipeline stores percentage as 0-100 (e.g., 33.33) but backend API expects 0-1 (e.g., 0.3333)`.

### Finding PL-6: Concurrency Can Cause Out-of-Order Frame Analysis
- **Category:** Pipeline Logic
- **Severity:** LOW
- **What could go wrong:** With `concurrency: 3`, frames are analyzed in batches of 3. Within a batch, frames may complete in any order. The extracted items from all frames are pushed to `allItems` in completion order (line 299-303), not frame order. This means `allItems` may not be in chronological/positional order.
- **What currently happens:** Items are pushed to `allItems` in the order `Promise.allSettled` resolves. Within a batch, the fastest-completing frame's items come first. However, deduplication reorders items by `position_in_feed` anyway (prompt rule 3: "Assign final sequential position_in_feed numbers"), so the input order to dedup doesn't matter much.
- **What SHOULD happen:** Current behavior is acceptable since dedup reorders. No fix needed.
- **Exact fix needed:** None.

---

## 4. Dashboard Data Display

### Finding DD-1: MIXED Valence Items Silently Excluded from Tone Analysis
- **Category:** Dashboard Data
- **Severity:** HIGH
- **What could go wrong:** Items classified with "MIXED" valence are silently excluded from the tone calculation, reducing the denominator and skewing percentages. If 30% of items are MIXED, the tone percentages are computed over only 70% of the data.
- **What currently happens:** In `extractToneAnalysis` (lines 540-544): the loop counts POSITIVE, NEUTRAL, and NEGATIVE. MIXED is not counted. `knownValenceTotal = positiveCount + neutralCount + negativeCount`. If 10 items have valences [3 POS, 3 NEU, 2 NEG, 2 MIXED], knownValenceTotal = 8 (not 10). Percentages are computed over 8 items. The 2 MIXED items vanish.
- **What SHOULD happen:** Either count MIXED items (distribute 50/50 to POSITIVE and NEGATIVE, or add a MIXED category) or map MIXED to NEUTRAL for counting purposes.
- **Exact fix needed:** Add MIXED counting: `else if (valence === 'MIXED') neutralCount++;` — mapping MIXED to NEUTRAL is the simplest fix. Alternatively, track MIXED separately and include in the display.

### Finding DD-2: Division-by-Zero Protection Present but Inconsistent
- **Category:** Dashboard Data
- **Severity:** LOW
- **What could go wrong:** If totalPosts is 0, division would produce NaN/Infinity.
- **What currently happens:** The code has division-by-zero guards in most places:
  - `adPct` (line 727): `Math.round((adCount / totalPosts) * 100)` — totalPosts is guaranteed >0 at this point (line 692 returns early if totalPosts===0).
  - `suggestedPct` (line 732): same guard.
  - `countContentTypes` (line 179): uses `posts.length` which could be 0 if called with empty array, but this function is only called when totalPosts > 0.
  - `extractPoliticalAnalysis` (line 434): returns null if totalAnalyzed === 0.
  - `extractToneAnalysis` (line 549): returns null if knownValenceTotal === 0.
  - `ideology` percentages (lines 471-473): only computed when `knownTotal >= 10`.
  All division-by-zero cases appear handled.
- **What SHOULD happen:** Current handling is correct.
- **Exact fix needed:** None.

### Finding DD-3: Percentage Can Technically Exceed 100% Due to Rounding
- **Category:** Dashboard Data
- **Severity:** LOW
- **What could go wrong:** The ideology/tone normalization forces sum to 100%, but individual values could theoretically become >100% if the adjustment diff is large enough.
- **What currently happens:** In `extractToneAnalysis` (lines 558-565), if the sum of rounded percentages is 98%, diff = 2, and this entire +2 is added to one category. If positivePct was 99% before adjustment, it becomes 101%. This is extremely unlikely with 3 categories (max diff would be ±2), but theoretically possible for edge distributions.
- **What SHOULD happen:** Clamp individual percentages to 0-100 after adjustment.
- **Exact fix needed:** After the sum adjustment block, add: `positivePct = Math.max(0, Math.min(100, positivePct)); neutralPct = Math.max(0, Math.min(100, neutralPct)); negativePct = Math.max(0, Math.min(100, negativePct));`

### Finding DD-4: followedCount Can Be Negative
- **Category:** Dashboard Data
- **Severity:** MEDIUM
- **What could go wrong:** `followedCount = totalPosts - suggestedCount` (line 731) — if suggestedCount > totalPosts (which shouldn't happen but could if data is corrupted), followedCount becomes negative.
- **What currently happens:** `suggestedCount = posts.filter(p => p.is_suggested).length` and `totalPosts = posts.length`. Since every suggested post is in the posts array, `suggestedCount <= totalPosts` is always true. However, in the FALLBACK path (line 697-698): `followedCount = fallbackTotal - suggestedCount` where `fallbackTotal = scan?.post_count || 0` and `suggestedCount = scan?.suggested_count || 0`. If the scan record has inconsistent data (e.g., suggested_count > post_count due to a bug), followedCount goes negative.
- **What SHOULD happen:** Clamp followedCount to 0.
- **Exact fix needed:** Change line 697 to: `const followedCount = Math.max(0, fallbackTotal - suggestedCount);` and line 731 to: `const followedCount = Math.max(0, totalPosts - suggestedCount);`

### Finding DD-5: Dashboard Re-Computes Stats Instead of Using Stored Values
- **Category:** Dashboard Data
- **Severity:** LOW
- **What could go wrong:** The dashboard re-computes ad count, suggested count, and percentages from raw_data.posts rather than using the pre-computed values (ad_count, ad_percentage, etc.) stored in the scan row. If the raw_data.posts array is different from what was used to compute the stored aggregates (e.g., due to a partial save), the dashboard shows inconsistent numbers.
- **What currently happens:** When `totalPosts > 0` (raw data available), the dashboard ignores scan.ad_count, scan.ad_percentage, etc. and recomputes everything from posts. When `totalPosts === 0` (no raw data), it falls back to the stored aggregates.
- **What SHOULD happen:** This is actually a reasonable design — recomputing from source data is more reliable than trusting pre-computed values. The only risk is if raw_data.posts is truncated or corrupted.
- **Exact fix needed:** None. Current approach is acceptable.

---

## 5. Broadcast Capture Edge Cases

### Finding BC-1: User Starts Broadcast But Never Switches to Social Media App (0 Useful Frames)
- **Category:** Broadcast Edge Case
- **Severity:** HIGH
- **What could go wrong:** User starts recording, but the captured frames show the AlgorithmLens app itself or the home screen, not a social media feed. All frames would be analyzed by Gemini which would either find 0 feed items or hallucinate items from non-feed UI.
- **What currently happens:** The pipeline (broadcastAnalysisPipeline.ts line 165-167) checks `if (framesToAnalyze.length === 0)` and throws PipelineError. But if the user captured frames of their home screen, `framesToAnalyze.length` would be >0 (there ARE frames, they're just not social media). Gemini would analyze these frames and likely return 0 items per frame, or possibly misclassify home screen widgets as feed items. The pipeline would complete with 0 or near-0 items.
- **What SHOULD happen:** The OCR text from on-device processing could be used to validate that frames contain social media content before sending to Gemini. Alternatively, a quick pre-check could verify that OCR text contains @-handles or typical social media patterns. If no frames produce items, show a specific error: "No social media content detected. Make sure you switch to [platform] and scroll through your feed during recording."
- **Exact fix needed:** After frame analysis completes, if `allExtractedItems.length === 0` and frames were analyzed, show a user-friendly message. Add check in pipeline: `if (allExtractedItems.length === 0 && framesToAnalyze.length > 0) { throw new PipelineError('No feed content found in captured frames. Ensure you scrolled through your social media feed during recording.', 'ANALYZING'); }`

### Finding BC-2: User Captures Only 1 Frame
- **Category:** Broadcast Edge Case
- **Severity:** LOW
- **What could go wrong:** A single frame produces very few feed items (2-4 typically). Statistical analysis is unreliable with such small samples.
- **What currently happens:** The pipeline processes the single frame normally. The dashboard would show "Not enough data yet" for totalPosts < 10 insights (lines 194-200 of computeDashboardData.ts). Deduplication still runs (but finds 0 duplicates since there's only 1 frame). The low sample flag would trigger in political and tone analysis.
- **What SHOULD happen:** Current behavior is reasonable. The "Not enough data" messaging handles this case.
- **Exact fix needed:** None. The UI already handles low sample sizes gracefully.

### Finding BC-3: All Captured Frames Are Identical (User Didn't Scroll)
- **Category:** Broadcast Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** If the user doesn't scroll, all frames show the same content. Gemini extracts the same items from each frame. Deduplication should merge them down, but the dedup call sends a large JSON blob to Gemini with many near-identical items.
- **What currently happens:** The native capture layer has perceptual hashing (`dedup_threshold: 0.15` in DEFAULT_STREAM_CONFIG). Frames that are visually identical (perceptual hash difference < 0.15) are marked `is_unique: false`. However, looking at `collectFrames` in broadcastSessionManager.ts (line 312), ALL frames are returned with `is_unique: true` — the native dedup flag is NOT being honored. The pipeline receives ALL frames including duplicates.
- **What SHOULD happen:** The collectFrames method should filter out non-unique frames, or the pipeline should filter them before analysis.
- **Exact fix needed:** In `collectFrames()` (broadcastSessionManager.ts), the `is_unique` field is hardcoded to `true` (line 312). This should read from the native metadata: `is_unique: Boolean(entry.is_unique ?? true)`. Then either filter in collectFrames (`return frames.filter(f => f.is_unique)`) or filter in the pipeline before sending to Gemini.

### Finding BC-4: Phone Screen Rotates During Capture
- **Category:** Broadcast Edge Case
- **Severity:** LOW
- **What could go wrong:** If the phone rotates from portrait to landscape, the captured frame dimensions change. Gemini should handle this since it's a vision model, but the frame metadata (width/height) might not update correctly.
- **What currently happens:** The native module captures whatever is on screen. Frame width/height come from native metadata (broadcastSessionManager.ts line 308-309). If orientation changes, subsequent frames have different dimensions. Gemini processes each frame independently, so different dimensions shouldn't cause issues. The pipeline doesn't validate or require consistent dimensions.
- **What SHOULD happen:** Current behavior is acceptable. Gemini can handle varying frame sizes.
- **Exact fix needed:** None.

### Finding BC-5: Phone Call Comes In During Capture
- **Category:** Broadcast Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** An incoming phone call interrupts the capture. On iOS, the broadcast extension may be paused. The call screen gets captured as a frame, potentially leaking the caller's name/number to Gemini.
- **What currently happens:** The native status handler maps 'PAUSED' to 'RECORDING' (broadcastSessionManager.ts line 436). The broadcast extension pauses but doesn't stop. When the call ends, recording resumes. The phone call screen frames would be captured and sent to Gemini. Gemini would likely find 0 feed items in these frames. However, there's a PRIVACY CONCERN: the caller's name/number could appear in OCR text sent to Gemini.
- **What SHOULD happen:** Frames captured during phone calls should be filtered out. The native module should detect when the phone call screen is active and skip those frames. At minimum, frames from non-social-media apps should not have OCR text extracted/sent.
- **Exact fix needed:** This requires native-side changes. At the pipeline level, frames with 0 items AND OCR text that doesn't match social media patterns could be flagged and excluded. This is primarily a privacy concern rather than accuracy.

### Finding BC-6: User Locks Phone During Capture
- **Category:** Broadcast Edge Case
- **Severity:** LOW
- **What could go wrong:** If the user locks their phone, the screen goes black. Captured frames would be black/blank.
- **What currently happens:** On iOS, ReplayKit continues capturing even when the screen is locked, but the captured content is a black screen. The native perceptual dedup should identify these as identical (all-black) frames and mark them non-unique. However, per BC-3, `is_unique` is hardcoded to `true`, so black frames would be sent to Gemini.
- **What SHOULD happen:** Black/blank frames should be filtered out before analysis.
- **Exact fix needed:** In the pipeline, before sending a frame to Gemini, check if the OCR text is empty AND the frame's base64 data represents a very low-entropy image (all-black). Simple heuristic: if OCR text is empty or whitespace-only for a frame, AND the extraction returns 0 items, don't count it as a processing failure.

### Finding BC-7: iOS Kills Broadcast Extension for Memory
- **Category:** Broadcast Edge Case
- **Severity:** HIGH
- **What could go wrong:** iOS aggressively kills broadcast extensions that use too much memory (50MB limit for extensions). If the extension is killed mid-capture, frames in the shared container may be incomplete.
- **What currently happens:** If the extension is killed, it fires a FAILED status to the main app via the native event system (broadcastSessionManager.ts line 452-454). The session enters FAILED state. However, frames captured BEFORE the kill are still in the shared container. The current code doesn't attempt to salvage these frames.
- **What SHOULD happen:** When the extension is killed, collect whatever frames were saved before the kill and offer to analyze them (partial analysis is better than nothing).
- **Exact fix needed:** In `handleNativeStatusChange`, when status is FAILED, check if any frames exist: `if (mappedStatus === 'FAILED' && this.nativeModule.getFrameCount() > 0) { /* offer partial analysis */ }`. This requires a UI change to ask the user "Recording was interrupted but we captured X frames. Analyze what we have?"

### Finding BC-8: Split-Screen or Picture-in-Picture Active
- **Category:** Broadcast Edge Case
- **Severity:** LOW
- **What could go wrong:** If the user has split-screen (iPad) or PiP active, the captured frame contains multiple apps. Gemini might extract items from the wrong app.
- **What currently happens:** The platform hint tells Gemini which platform to expect (e.g., "Analyze this screenshot of an Instagram feed"). If the frame shows both Instagram and Safari, Gemini should focus on Instagram content. However, there's no guarantee Gemini will ignore the non-target app.
- **What SHOULD happen:** The prompt could explicitly state: "Focus ONLY on the [platform] app content. Ignore any other apps, windows, or system UI visible in the screenshot."
- **Exact fix needed:** Add to buildFramePrompt: `Focus ONLY on ${PLATFORM_DISPLAY_NAMES[platform]} content. If multiple apps are visible (split-screen, picture-in-picture), extract items ONLY from the ${PLATFORM_DISPLAY_NAMES[platform]} portion of the screen.`

### Finding BC-9: Capture Duration Exceeds 10-Minute Limit
- **Category:** Broadcast Edge Case
- **Severity:** LOW
- **What could go wrong:** The default max session duration is 600 seconds (10 minutes). If the native extension doesn't enforce this, the session could run longer, producing hundreds of frames.
- **What currently happens:** `max_session_duration_seconds: 600` is defined in DEFAULT_STREAM_CONFIG. Enforcement is on the native side (not visible in this codebase). The pipeline has `maxFramesToAnalyze` config (default 0 = no limit), and `max_frames_per_session: 200` in stream config. If 200 frames were captured, all would be analyzed (no limit in pipeline default), which would mean 200+ Gemini API calls × ~2 seconds each = ~7 minutes of analysis time.
- **What SHOULD happen:** The pipeline should have a reasonable default for maxFramesToAnalyze (e.g., 50-100 frames). Beyond that, the marginal value of additional frames decreases while cost increases.
- **Exact fix needed:** Change `maxFramesToAnalyze: 0` to `maxFramesToAnalyze: 60` in DEFAULT_CONFIG. At 0.4 fps, 60 frames = 2.5 minutes of scrolling, which should capture 100-200 unique feed items.

---

## 6. Analysis Pipeline Edge Cases

### Finding AP-1: Expired or Invalid Gemini API Key
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** If the API key is invalid, every frame analysis fails.
- **What currently happens:** VERIFIED by line-by-line tracing: In useAnalysis.ts (line 123-129), if `GEMINI_API_KEY` is empty string, the pipeline fails immediately with a clear error message — good. If the key exists but is invalid, the first API call returns HTTP 400/401/403. `isRetryableStatus` (geminiFlashService.ts line 442-444) returns `false` for these codes — only 429, 500, 502, 503 are retryable. The `executeWithRetry` (line 270-271) immediately throws the non-retryable GeminiApiError without retrying — good. In `analyzeSingleFrame` (line 346-356): the catch block checks `error instanceof GeminiApiError && !error.retryable` (line 351) and re-throws it. This thrown error is caught by `Promise.allSettled` (line 297) as a rejected promise. In the results loop (lines 299-303), only fulfilled results add items — rejected results are silently skipped. So every frame in every batch fails silently, and the pipeline completes with 0 extracted items. It then proceeds to dedup (skipped for 0 items), build (produces empty result), and save (saves a 0-item scan to Supabase). The user sees "Analysis complete — 0 feed items found" with no indication the API key was bad.
- **What SHOULD happen:** If the FIRST frame fails with a non-retryable error (invalid API key), the pipeline should abort immediately rather than trying all remaining frames.
- **Exact fix needed:** In `analyzeFrames`, after the first batch completes, check if ALL results were rejected. If so, check if the error is non-retryable and abort: `const allFailed = batchResults.every(r => r.status === 'rejected'); if (allFailed && i === 0) { const firstError = batchResults[0].status === 'rejected' ? batchResults[0].reason : null; if (firstError instanceof GeminiApiError && !firstError.retryable) throw firstError; }`

### Finding AP-2: No Internet During Analysis
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** All Gemini API calls fail with network errors.
- **What currently happens:** Fetch throws a TypeError for network failures. This isn't a GeminiApiError, so `executeWithRetry` treats it as retryable (line 270: it only skips retry for non-retryable GeminiApiError; other errors are always retried). After 3 retries (with exponential backoff: 1s, 2s, 4s), the error propagates. Each frame fails after ~7 seconds of retries. With concurrency=3 and 20 frames, that's ~7 batches × 7 seconds = ~49 seconds of failed retries before the pipeline "completes" with 0 items.
- **What SHOULD happen:** Detect network unavailability early and fail fast. After the first batch fails completely with network errors, check connectivity and abort if offline.
- **Exact fix needed:** Same pattern as AP-1: detect first-batch-all-failed and check error type. Network errors should trigger an immediate abort with user-friendly message: "No internet connection. Please connect to the internet and try again."

### Finding AP-3: Internet Drops Partway Through (5 of 20 Frames Analyzed)
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** First 5 frames succeed, then internet drops. Remaining 15 frames fail.
- **What currently happens:** The 5 successful frames contribute their items to `allExtractedItems`. The 15 failed frames contribute nothing (empty arrays from catch block). The pipeline continues to dedup and build results from the 5 frames' worth of items. The user gets a partial result with no indication that 75% of frames failed.
- **What SHOULD happen:** Track the success/failure ratio. If more than 50% of frames fail, warn the user that results may be incomplete. Add the failure info to `debugInfo.warnings`.
- **Exact fix needed:** After `analyzeFrames` completes, compute: `const failedFrames = framesToAnalyze.length - successfulFrameCount;`. If `failedFrames / framesToAnalyze.length > 0.5`, add a warning to the scan result and show it in the UI. Consider adding `framesAnalyzedSuccessfully` to PipelineProgress.

### Finding AP-4: User Backgrounds App During Analysis
- **Category:** Analysis Edge Case
- **Severity:** HIGH
- **What could go wrong:** On iOS, backgrounded apps have limited execution time (~30 seconds). The analysis pipeline could be suspended mid-execution.
- **What currently happens:** There's no background task request. When the app is backgrounded, iOS will suspend the JS thread. In-flight fetch requests may complete (iOS allows network requests to finish), but new requests won't start. If the pipeline is in the middle of a batch, some requests complete and others don't. When the app returns to foreground, the pipeline resumes from where it was suspended. However, if iOS killed the app while backgrounded, all state is lost.
- **What SHOULD happen:** Request background execution time using `beginBackgroundTaskWithExpirationHandler` (via a native module) before starting the pipeline. This gives ~3 minutes on iOS. For longer analyses, persist intermediate results so they can be recovered.
- **Exact fix needed:** Wrap the pipeline execution in a background task request. If background time is about to expire, save intermediate results to AsyncStorage and resume on next foreground. This is a significant feature request.

### Finding AP-5: Analysis Takes More Than 5 Minutes (analysisDataStore TTL)
- **Category:** Analysis Edge Case
- **Severity:** HIGH
- **What could go wrong:** The `analysisDataStore` has a 5-minute TTL. If analysis takes longer than 5 minutes, the store data expires and `consumeAnalysisData` returns null.
- **What currently happens:** In analysisDataStore.ts (line 43): `if (Date.now() - pendingAnalysis.storedAt > 5 * 60 * 1000)` → returns null. The analysis data store is used to pass frame data FROM the broadcast screen TO the analysis screen. If the analysis screen reads the data within 5 minutes of it being stored, it works. If the user navigates to the analysis screen after 5 minutes, the data is gone.
  - However, the `consumeAnalysisData` is called on the analysis screen mount. If the user goes broadcast → analysis screen immediately, the 5-minute clock starts from when the broadcast screen stored the data (after capture completes), not from when analysis starts. So the analysis can take as long as it needs — the data is consumed (and cleared) on first read.
  - The real risk: if the user delays navigating from broadcast to analysis screen by >5 minutes, the data expires. But this is unlikely in normal usage.
- **What SHOULD happen:** Current behavior is acceptable for normal flows. The 5-minute TTL protects against memory leaks. Consider increasing to 10 minutes for safety.
- **Exact fix needed:** Change TTL from 5 minutes to 10 minutes: `if (Date.now() - pendingAnalysis.storedAt > 10 * 60 * 1000)`. Low priority.

### Finding AP-6: User Starts a Second Scan While First Is Still Analyzing
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** The first scan's pipeline is still running when the user starts a new broadcast and begins a second analysis.
- **What currently happens:** `analysisDataStore` stores only ONE pending analysis (module-level singleton, line 25). `storeAnalysisData` overwrites any existing pending data. If a second scan stores its data while the first analysis is still running, the first analysis has already consumed the data (consumeAnalysisData clears on read). The first pipeline holds its data in memory within the BroadcastAnalysisPipeline instance. The second pipeline would create a new BroadcastAnalysisPipeline instance via `useAnalysis` hook. Both could run concurrently, both making Gemini API calls, potentially hitting rate limits.
- **What SHOULD happen:** Prevent concurrent analyses. The `useAnalysis` hook should check `isRunning` before starting a new analysis.
- **Exact fix needed:** In useAnalysis.ts `start` callback, add at the beginning: `if (isRunning) { console.warn('Analysis already in progress'); return; }`. The UI should also disable the "Analyze" button while isRunning is true.

### Finding AP-7: Supabase Is Down When Trying to Save Results
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** Analysis completes successfully but can't be saved to Supabase. The user sees a "complete" state but their scan isn't persisted.
- **What currently happens:** In `persistScan` (broadcastAnalysisPipeline.ts lines 502-577), if Supabase insert fails, a PipelineError is thrown with stage 'SAVING'. This propagates to the pipeline's catch block (line 248-261), setting stage to 'FAILED' and calling `onError`. The user sees an error despite the analysis being successful. The scan result object exists in memory (in the `scanResult` variable) but is not passed to `onError` (line 254 calls `this.callbacks.onError(err)` without partial result).
- **What SHOULD happen:** If analysis succeeds but persistence fails, the scan result should still be shown to the user. Save the result locally (AsyncStorage) as a fallback, and retry Supabase save later.
- **Exact fix needed:** Change the SAVING stage to catch and handle errors without failing the whole pipeline: wrap `persistScan` in try-catch, and if it fails, add a warning to debugInfo.warnings and proceed to COMPLETE. The user sees results; persistence is retried in background.

### Finding AP-8: User's Supabase Auth Token Has Expired
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** The Supabase client uses an expired JWT. Inserts fail with 401/403.
- **What currently happens:** The pipeline receives `userId` from the auth context (useAnalysis.ts line 132). Supabase client handles token refresh internally via `supabase.auth.onAuthStateChange`. However, if the refresh token is also expired (e.g., user hasn't opened the app in months), the insert fails. The error propagates as a PipelineError at SAVING stage, failing the entire pipeline (same issue as AP-7).
- **What SHOULD happen:** Before starting the pipeline, verify the auth session is valid. If expired, prompt re-authentication before analysis.
- **Exact fix needed:** In useAnalysis.ts `start`, add session validation: `const { data: session } = await supabase.auth.getSession(); if (!session?.session?.access_token) { setProgress({...INITIAL_PROGRESS, stage: 'FAILED', errorMessage: 'Session expired. Please sign in again.'}); return; }`.

---

## 7. Dashboard Edge Cases

### Finding DE-1: Scan Has 0 Feed Items (Gemini Found Nothing)
- **Category:** Dashboard Edge Case
- **Severity:** LOW
- **What could go wrong:** A scan completes but with 0 items. Dashboard shows empty/confusing state.
- **What currently happens:** In `computeDashboardData` (line 692-723), if `totalPosts === 0`, it falls back to top-level aggregates (post_count, ad_count, etc.). If those are also 0, `hasData: fallbackTotal > 0` would be `false`. The UI should check `hasData` and show an empty state. Insight builders handle `totalPosts < 10` with "Not enough data" messages.
- **What SHOULD happen:** Current handling is adequate. The `hasData: false` flag should trigger an empty state in the UI.
- **Exact fix needed:** Verify that the UI checks `hasData` and shows an appropriate empty state. No change to computeDashboardData needed.

### Finding DE-2: All Items Are Ads (100% Ad Percentage)
- **Category:** Dashboard Edge Case
- **Severity:** LOW
- **What could go wrong:** If every item is an ad, all percentages and insights would be dominated by ad content.
- **What currently happens:** `adPct = 100`. The insight builder (lines 289-295) would show "100% of your feed is commercial content" with "about 60 minutes of ads in every hour you scroll." This is factually correct and handles the edge case well.
- **What SHOULD happen:** Current behavior is correct. The messaging is appropriate.
- **Exact fix needed:** None.

### Finding DE-3: raw_data.analysis Is Null (Old Scan Format)
- **Category:** Dashboard Edge Case
- **Severity:** LOW
- **What could go wrong:** Older scans don't have the `analysis` key in raw_data. Political and tone analysis fail.
- **What currently happens:** `extractPoliticalAnalysis` (line 425-428): checks `analysis?.ai_analyzed` — if analysis is null/undefined, returns null. `extractToneAnalysis` (line 524-528): same check. Both return null, meaning `politicalAnalysis = null` and `toneAnalysis = null`. The dashboard sets `hasPoliticsData = false` and `hasToneData = false`. The insight builders show "requires AI" messages for these tabs.
- **What SHOULD happen:** Current behavior is correct. Old scans gracefully degrade.
- **Exact fix needed:** None.

### Finding DE-4: User Has 1000+ Scans (Performance)
- **Category:** Dashboard Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** Loading and computing dashboard data for a scan with 1000+ items could be slow.
- **What currently happens:** `computeDashboardData` processes a single `ScanRecord` at a time, not all scans. The function iterates over `posts` array once for each metric (ad count, suggested count, creators, content types, etc.) — that's O(n) per metric, roughly O(5n) total. For 1000 posts, this is fast (<10ms).
  - The real performance concern is loading the scan LIST — fetching 1000+ scan records from Supabase. But that's in the scan list screen, not computeDashboardData.
  - Within a single scan, the `raw_data.posts` array is unlikely to exceed 200 items (limited by max_frames_per_session × ~4 items per frame).
- **What SHOULD happen:** Current performance is fine for single scans. For the scan list, pagination should be used (not in scope of this audit).
- **Exact fix needed:** None for computeDashboardData. Pagination of scan list is a separate concern.

### Finding DE-5: ScanRecord top_creators Format Mismatch
- **Category:** Dashboard Edge Case
- **Severity:** LOW
- **What could go wrong:** The `ScanRecord` interface (line 59) defines `top_creators` as `Array<{ name: string; count: number }>`, but the pipeline's `getTopCreators` (broadcastAnalysisPipeline.ts line 637-647) returns `string[]` (just handles, no count objects). Similarly, useScan.ts (line 182-183) returns `string[]`.
- **What currently happens:** The dashboard's `computeDashboardData` doesn't use `raw_data.top_creators` at all — it recomputes top creators from raw_data.posts using `countByCreator`. So the format mismatch doesn't affect the dashboard. The stored top_creators field is unused.
- **What SHOULD happen:** Either fix the type to match the actual data (`string[]`), or remove the field if unused, or use it as a fallback when raw posts aren't available.
- **Exact fix needed:** Update `ScanRecord.raw_data.top_creators` type to `string[]` to match actual data. Low priority since the field is unused.

---

## 8. Confidence Assessment

### Broadcast Capture: 6/10
**Reasoning:** The native module interface is well-structured, but several important edge cases are unhandled:
- The `is_unique` field is hardcoded to `true`, completely bypassing on-device perceptual deduplication (BC-3). This is the most significant issue — it means all frames (including identical ones) are sent to Gemini, wasting API calls and potentially inflating/distorting results.
- Phone calls, lock screen, and extension kills (BC-5, BC-6, BC-7) have reasonable fallback behavior but could leak privacy-sensitive content or lose data.
- The 0-useful-frames scenario (BC-1) produces a confusing empty result instead of a clear error.
- Strengths: good native event system, elapsed timer, session state machine.

### Gemini Analysis (Prompt + Parsing): 5/10
**Reasoning:** This is the highest-risk component:
- The prompts have several significant ambiguity issues (PQ-1 through PQ-9). Political classification, ad detection for influencer content, and source_origin inference are all underspecified and will produce inconsistent results.
- The `responseMimeType: 'application/json'` setting (RP-1) is a strong mitigation for parsing issues.
- `sanitizeExtractedItem` is reasonably defensive but has the `Boolean()` truthy bug (RP-3) and the MIXED valence exclusion (DD-1).
- No hallucination guardrails (PQ-3, RP-4) — Gemini can invent items with no validation.
- No few-shot examples (PQ-7) means Gemini is working from a schema-only prompt.
- The dedup prompt is loose and Gemini-dependent (PQ-4), with no fallback validation (RP-7).

### Deduplication: 4/10
**Reasoning:** The deduplication layer is the weakest:
- It relies entirely on Gemini to determine duplicates from a text-only prompt (no image comparison).
- The "80% overlap" criterion is undefined (PQ-4).
- Gemini could return more items than input with no validation (RP-7).
- The fallback (return all items un-deduped) is safe but means dedup silently fails frequently.
- Should consider implementing client-side dedup using perceptual hashes or creator_handle + text similarity, falling back to Gemini only for ambiguous cases.

### Dashboard Computation: 8/10
**Reasoning:** The dashboard computation is the strongest component:
- Division-by-zero is handled consistently (DD-2).
- Insight text is well-crafted and follows epistemic restraint principles.
- The fallback path (no raw posts → use aggregates) is reasonable.
- Weaknesses: MIXED valence exclusion (DD-1), followedCount can theoretically go negative (DD-4), and the source_origin null → "followed" conflation (PL-3) is a significant accuracy issue.
- The percentage normalization for ideology/tone is good but could produce >100% in extreme edge cases (DD-3).
- Strong: handles old scan formats, low sample sizes, missing AI analysis gracefully.

---

---

## Appendix A: Self-Review Cycle 2 — Additional Edge Cases

### Finding C2-1: Memory Pressure on Old Devices — frameBase64Map Holds All Frames in Memory
- **Category:** Analysis Edge Case
- **Severity:** HIGH
- **What could go wrong:** The `analysisDataStore` holds a `frameBase64Map: Record<string, string>` (analysisDataStore.ts line 20). Each frame is a JPEG base64 string. At JPEG quality 75 and typical phone resolution (1170×2532 iPhone 14), each frame is ~300-500KB base64. With 200 frames (max_frames_per_session), that's 60-100MB of base64 strings held in the JS heap simultaneously. Old devices with 2-3GB RAM may struggle, and iOS's 50MB broadcast extension limit is separate but relevant.
- **What currently happens:** All frame base64 data is loaded into a JS dictionary before analysis begins. The pipeline processes frames sequentially (in batches of 3), but all base64 data stays in memory until `consumeAnalysisData` clears it (which happens on read). During analysis, both the base64 map AND the growing allExtractedItems array are in memory.
- **What SHOULD happen:** Implement lazy loading — read frame base64 from disk on demand via `getFrameBase64(filename)` instead of pre-loading all frames into memory. The `getFrameBase64` callback already exists in the pipeline interface.
- **Exact fix needed:** The `frameBase64Map` in analysisDataStore should be replaced with a callback pattern. Instead of storing all base64 data, store only the file paths and read base64 on demand from the native module. The pipeline already accepts `getFrameBase64` as a parameter — this callback should read directly from the native module's shared container.

### Finding C2-2: Emoji and Unicode in Creator Handles and Post Text
- **Category:** Response Parsing
- **Severity:** LOW
- **What could go wrong:** Creator handles and post text containing emoji (e.g., @user✨, post text with 🔥) could be mangled by JSON serialization/deserialization, or the post_text truncation could split a multi-byte Unicode character.
- **What currently happens:** `sanitizeExtractedItem` truncates post_text at 2000 characters (line 404): `raw.post_text.substring(0, 2000)`. JavaScript's `substring` works on UTF-16 code units, not Unicode code points. Splitting a surrogate pair (e.g., emoji like 🔥 = U+1F525, represented as 2 UTF-16 code units) at position 1999 could produce a malformed string with an unpaired surrogate.
- **What SHOULD happen:** Use a Unicode-aware truncation that doesn't split surrogate pairs.
- **Exact fix needed:** Replace `raw.post_text.substring(0, 2000)` with: `Array.from(raw.post_text).slice(0, 2000).join('')` — this iterates over code points, not code units, avoiding surrogate pair splitting. Low priority since 2000-char texts are rare from social media screenshots.

### Finding C2-3: RTL Language Content (Arabic, Hebrew, etc.)
- **Category:** Prompt Quality
- **Severity:** LOW
- **What could go wrong:** Feeds in RTL languages may have different layout patterns. Gemini processes the image, so layout direction shouldn't matter for extraction. However, OCR text for RTL content may be reversed or garbled if the on-device OCR doesn't handle RTL correctly. Gemini may also struggle with mixed LTR/RTL content (e.g., English hashtags in an Arabic post).
- **What currently happens:** The prompt doesn't mention RTL languages. OCR text is passed as-is. Gemini's vision model should handle RTL screenshots correctly since it processes the image visually. The OCR text is supplementary context (rule 12), so garbled OCR wouldn't cause data loss — it would just fail to help verify extractions.
- **What SHOULD happen:** Current behavior is acceptable. Gemini's vision capability handles RTL layout. OCR is supplementary.
- **Exact fix needed:** None. Could add a note to the prompt: "Content may be in any language including RTL scripts. Extract text exactly as it appears."

### Finding C2-4: Timezone Issues for Streak last_scan_date
- **Category:** Dashboard Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** `last_scan_date` is stored as `YYYY-MM-DD` (streak.ts line 24) but there's no specified timezone. If a user scans at 11:55 PM EST and the date is stored in UTC (2026-02-21 04:55 UTC), the date would be "2026-02-21" not "2026-02-20". The next day, when the user scans at 8 AM EST (2026-02-21 13:00 UTC), the date is again "2026-02-21" — it looks like the same day, so the streak doesn't increment. Or worse, if the user crosses a timezone (traveling), dates could skip or repeat.
- **What currently happens:** The streak type stores ISO 8601 date strings. The actual streak logic isn't in the files audited (it's likely in a separate streak manager), but the DATE string format without timezone is inherently ambiguous.
- **What SHOULD happen:** Always compute dates in the user's LOCAL timezone using `new Date().toLocaleDateString('en-CA')` (which produces YYYY-MM-DD) or explicitly use the device's timezone.
- **Exact fix needed:** This is a streak system concern, not directly an accuracy concern. But noting it here as the scan's `created_at` timestamp (used to compute when the scan happened for streak purposes) is in ISO 8601 with UTC timezone (from `new Date().toISOString()`). Streak logic should convert UTC timestamps to local dates for day-boundary calculations.

### Finding C2-5: Year Boundary for Streaks
- **Category:** Dashboard Edge Case
- **Severity:** LOW
- **What could go wrong:** A streak spanning December 31 → January 1 could break if date arithmetic uses year-month-day comparison incorrectly.
- **What currently happens:** Streak dates are ISO 8601 strings (YYYY-MM-DD). String comparison of ISO dates works correctly across year boundaries: "2025-12-31" < "2026-01-01". Standard Date arithmetic also handles this. No issue expected.
- **What SHOULD happen:** Current approach is correct.
- **Exact fix needed:** None.

### Finding C2-6: Extremely Long OCR Text
- **Category:** Response Parsing
- **Severity:** LOW
- **What could go wrong:** If OCR produces very long text (>3000 chars), it's truncated at 3000 in the prompt (analysisPrompts.ts line 59). But this truncation could cut mid-word or mid-sentence, potentially losing important context like a "Sponsored" label at the end.
- **What currently happens:** `ocrText.substring(0, 3000)` — truncates at 3000 characters. OCR text from a single phone screen is typically 500-1500 characters, so 3000 is generous.
- **What SHOULD happen:** Current behavior is acceptable. The 3000 limit is well above typical OCR output.
- **Exact fix needed:** None.

### Finding C2-7: Daylight Savings Time Transitions
- **Category:** Analysis Edge Case
- **Severity:** LOW
- **What could go wrong:** If a scan spans a DST transition (extremely unlikely — scans are max 10 minutes), the elapsed time calculation could be off by an hour. More realistically, streak date calculations could be affected if DST changes the local date.
- **What currently happens:** Elapsed time is computed using `Date.now()` (monotonic-ish) which is not affected by DST. Timestamps use `new Date().toISOString()` which is always UTC. DST doesn't affect UTC timestamps.
- **What SHOULD happen:** Current behavior is correct. UTC timestamps avoid DST issues.
- **Exact fix needed:** None.

### Finding C2-8: Concurrent Deduplication Token Limits
- **Category:** Analysis Edge Case
- **Severity:** HIGH
- **What could go wrong:** The deduplication call sends ALL extracted items as a single JSON blob to Gemini. With 200 frames × 3 items each = 600 items, the JSON payload could be enormous. Gemini 2.0 Flash has a 1M token context window, but the output is limited to 16384 tokens (maxOutputTokens in callGeminiText). If the deduplicated output exceeds 16384 tokens, Gemini truncates the response, producing invalid JSON.
- **What currently happens:** The contextPrompt (geminiFlashService.ts line 103) is: `${prompt}\n\nAll extracted items:\n${JSON.stringify(allItems, null, 0)}`. With 600 items, each ~200 tokens of JSON, the input is ~120K tokens (within limits). But the output — 600 deduplicated items in JSON — would be ~120K tokens, FAR exceeding the 16384 token output limit. The response would be truncated mid-JSON, causing `JSON.parse` to fail, triggering the fallback (return all items un-deduped).
- **What SHOULD happen:** For large item counts, either (a) increase maxOutputTokens, (b) split dedup into batches, or (c) implement client-side dedup using creator_handle + text similarity and only use Gemini for ambiguous cases.
- **Exact fix needed:** Add a check before dedup: `if (allItems.length > 100) { /* split into overlapping batches of 50, dedup each, then dedup the results */ }`. Or better: implement client-side dedup first, then use Gemini only for the remaining ambiguous pairs. This is a significant architectural change.

### Finding C2-9: Rate Limiting Under Concurrent Batches
- **Category:** Analysis Edge Case
- **Severity:** MEDIUM
- **What could go wrong:** With `concurrency: 3`, three frames are analyzed simultaneously. The rate limiter (`enforceRateLimit`) uses a promise queue, so each concurrent request waits in line. But the Gemini API has per-minute quota limits (typically 60 RPM for free tier, 1000 RPM for paid). With 3 concurrent requests and 200ms minimum delay, the effective rate is ~5 requests/second = 300 RPM. Free tier users would hit the 60 RPM limit almost immediately.
- **What currently happens:** Rate limiting enforces 200ms between requests. API 429 responses are retried with exponential backoff (retry is enabled for 429 via `isRetryableStatus`). So rate limit hits are handled gracefully but cause significant delays — each retry adds 1-8 seconds. A full analysis of 20 frames could take 5-10 minutes with rate limit retries on free tier.
- **What SHOULD happen:** Detect the user's API tier and adjust concurrency + rate limits accordingly. For free tier, use concurrency=1 with 1000ms delay.
- **Exact fix needed:** Add Gemini API quota detection. If the first request returns 429, reduce concurrency to 1 and increase RATE_LIMIT_DELAY_MS to 1500ms for the remainder of the pipeline.

---

## Appendix B: Self-Review Cycle 3 — Gemini Prompt Ambiguity Deep Dive

### Finding C3-1: "Feed Item" Definition is Ambiguous
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** The prompt says "Extract EVERY distinct feed item visible in the screenshot (posts, ads, reels, stories, suggestions)." But what about: story highlights (circles at top of Instagram)? Navigation bars? "You might like" section headers? Trending topic cards? "Topics to follow" suggestions? Shop/marketplace items in the feed? Group suggestions? Events in Facebook feed? Are these "feed items"?
- **What currently happens:** Gemini interprets "feed item" broadly. Story highlights could be extracted as individual items (one per circle), inflating the item count. Section headers like "Suggested for you" could be extracted as items. Marketplace listings could be extracted as ads or feed items.
- **What SHOULD happen:** Define "feed item" explicitly: "A feed item is a distinct post, ad, reel, short, or story that appears in the scrollable feed area. Do NOT count: navigation bars, story highlight circles (unless tapped/expanded), section headers or dividers, app UI elements, search bars, or platform feature promotions (like 'Try Reels' banners)."
- **Exact fix needed:** Add to system prompt after rule 1: `A "feed item" is a scrollable post, ad, reel, short video, or story card. Do NOT extract: navigation UI, story highlight circles, section headers ("Suggested for you"), app banners, or platform feature promotions.`

### Finding C3-2: "Visible" is Ambiguous for Partially-Rendered Content
- **Category:** Prompt Quality
- **Severity:** LOW
- **What could go wrong:** Rule 2 says partially visible items should be extracted with `is_partial: true`. But how partial is too partial? A post where only the top 5 pixels are visible (just a line of the profile picture)? Gemini might try to infer what the post is about from 5 pixels, hallucinating content.
- **What currently happens:** Gemini decides what's "partially visible" vs. "not visible enough." No minimum visibility threshold is given.
- **What SHOULD happen:** Add: "Only extract a partial item if at least the creator handle OR meaningful text/content is visible. If only a thin sliver of content is visible (e.g., less than ~20% of a post), skip it."
- **Exact fix needed:** Revise rule 2: `If a feed item is only partially visible (cut off at top or bottom), extract it only if the creator handle OR meaningful post content is visible. Set "is_partial" to true. If less than ~20% of a post is visible, do not extract it.`

### Finding C3-3: content_type "ad" Overlaps with is_ad
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** The schema has both `content_type: "ad"` and `is_ad: boolean`. These can conflict. A video ad would have `content_type: "video"` and `is_ad: true`. But Gemini might set `content_type: "ad"` for any ad, losing the underlying content type information (was it a photo ad? video ad?). Conversely, Gemini might set `content_type: "video"` and forget to set `is_ad: true`.
- **What currently happens:** The prompt doesn't explain the relationship between content_type and is_ad. `mapContentType` (broadcastAnalysisPipeline.ts line 659-671) maps "ad" → "AD". If content_type is "ad", the underlying format (video vs photo) is lost.
- **What SHOULD happen:** The prompt should say: "content_type describes the FORMAT (photo, video, reel, etc.), not whether it's an ad. Use is_ad for ad detection. A video ad should have content_type='video' and is_ad=true, NOT content_type='ad'."
- **Exact fix needed:** Add to the schema description: `"content_type": "<photo|video|reel|short|text|story|unknown> — describes content FORMAT, not ad status. A video ad = content_type 'video' + is_ad true."` Remove "ad" from the content_type enum.

### Finding C3-4: Gemini May Struggle with Dark Mode Screenshots
- **Category:** Prompt Quality
- **Severity:** MEDIUM
- **What could go wrong:** Many social media apps have dark mode. The platform hints describe light-mode UI patterns (e.g., "Sponsored" label below account name). In dark mode, labels may look different, use different colors, or be positioned differently. Gemini's vision model should handle this, but the text descriptions in hints assume light mode.
- **What currently happens:** Platform hints don't mention dark mode variants. Gemini processes the image visually, so it should detect "Sponsored" text regardless of background color. However, in some dark modes, ad labels use low-contrast text that Gemini might miss.
- **What SHOULD happen:** Add to each platform hint: "Content may appear in light or dark mode. Ad and suggestion labels are present in both modes but may have different styling."
- **Exact fix needed:** Add to system prompt: `Screenshots may be in light or dark mode. Ad labels and suggestion indicators appear in both modes.`

### Finding C3-5: No Instruction on How to Handle Instagram Carousel/Multi-Image Posts
- **Category:** Prompt Quality
- **Severity:** LOW
- **What could go wrong:** An Instagram carousel post shows multiple images. In a screenshot, only the currently-visible slide is shown, plus dots indicating multiple slides. Should this be 1 feed item or multiple?
- **What currently happens:** The prompt doesn't address carousel posts. Gemini likely counts each carousel as 1 item (correct behavior). But in consecutive frames, different slides of the same carousel might be visible, creating apparent duplicates with the same creator but different visible content.
- **What SHOULD happen:** Add: "A carousel/multi-image post counts as 1 feed item, even if different slides are visible across frames. The deduplication step will handle merging carousel appearances."
- **Exact fix needed:** Low priority. The dedup step should handle this naturally by matching creator_handle.

---

## Appendix C: Self-Review Cycle 4 — Fix Verification

### Fix Review for PQ-1 (Ad Classification):
**Proposed fix:** Add hashtag-based ad detection to the prompt.
**Would this work?** Yes — Gemini can easily check caption text for #ad, #sponsored. However, some creators use #ad sarcastically or in commentary about advertising. Fix should add: "Look for #ad or #sponsored as disclosure hashtags, not when used in commentary about advertising."
**Could introduce new bug?** Minor risk: false positives from sarcastic #ad usage. Acceptable trade-off.

### Fix Review for PQ-3 (Hallucination):
**Proposed fix:** Add rule 13 about not inventing items.
**Would this work?** Partially. Adding the instruction reduces hallucination probability but doesn't eliminate it. The item-count sanity check in RP-4 is the stronger mitigation.
**Could introduce new bug?** No.

### Fix Review for RP-3 (is_ad Boolean):
**Proposed fix:** Change `Boolean(raw.is_ad)` to `raw.is_ad === true || raw.is_ad === 'true'`.
**Would this work?** Yes. This correctly handles boolean true, string "true", and rejects all other truthy values.
**Could introduce new bug?** Edge case: Gemini returns `"is_ad": 1` (number). This would become false. But `is_ad` should be boolean, not number, so this is correct behavior.

### Fix Review for RP-4 (Hallucination Count Check):
**Proposed fix:** Lower confidence if >10 items per frame.
**Would this work?** Partially. The threshold of 10 is reasonable for most phone screens, but a user scrolling very fast might have a frame with a long visible feed (especially on iPad or large screens). The fix should check against frame dimensions: wider/taller frames could legitimately have more items.
**Could introduce new bug?** False positive on iPads or foldable phones with larger screens. Consider threshold of 15 instead of 10.

### Fix Review for DD-1 (MIXED Valence):
**Proposed fix:** Map MIXED to NEUTRAL in counting.
**Would this work?** Yes, simple and effective. However, mapping MIXED to NEUTRAL is a semantic choice — MIXED content (both positive and negative) isn't really neutral. Better fix: count MIXED separately and display as a 4th category, or split 50/50 between positive and negative.
**Could introduce new bug?** Inflates neutral count slightly. Acceptable.

### Fix Review for DD-4 (Negative followedCount):
**Proposed fix:** `Math.max(0, fallbackTotal - suggestedCount)`.
**Would this work?** Yes. Prevents negative values.
**Could introduce new bug?** No. Math.max(0, x) is safe.

### Fix Review for BC-3 (is_unique Hardcoded):
**Proposed fix:** Read from native metadata, filter non-unique frames.
**Would this work?** Depends on native module implementation. If `entry.is_unique` is correctly set by the native side, this works. Need to verify native module actually provides this field.
**Could introduce new bug?** If native module doesn't provide `is_unique` or provides incorrect values, the `?? true` fallback ensures all frames are included (same as current behavior). No regression risk.

### Fix Review for AP-1 (Invalid API Key):
**Proposed fix:** Detect first-batch all-failed and check error type.
**Would this work?** Yes, but the implementation needs care. `Promise.allSettled` returns `PromiseRejectedResult` for thrown errors. Need to access `result.reason` (not `result.value`) for rejected results. The fix should check: `if (batchResults.every(r => r.status === 'rejected'))` and then check if any reason is a non-retryable GeminiApiError.
**Could introduce new bug?** If the first batch fails for a transient reason (e.g., all 3 timeout simultaneously), the pipeline would abort even though retrying might work. Fix should only abort for non-retryable errors.

### Fix Review for C2-8 (Dedup Token Limits):
**Proposed fix:** Split dedup into batches or use client-side dedup.
**Would this work?** Client-side dedup is the better approach. Comparing creator_handle + text similarity doesn't require Gemini and is deterministic. Use Levenshtein distance or simple word overlap for text similarity.
**Could introduce new bug?** Client-side dedup might be less accurate than Gemini for borderline cases, but it's more reliable and deterministic.

---

## Appendix D: Self-Review Cycle 5 — Confidence Assessment (Updated)

### Broadcast Capture: 6/10
**Reasoning:** The native module interface is well-structured with a clear state machine (IDLE → INITIALIZING → AWAITING → RECORDING → COMPLETE/FAILED). However:
- **Critical gap:** `is_unique` hardcoded to `true` bypasses perceptual dedup entirely (BC-3). Every frame, including duplicates, is sent to Gemini. This wastes API calls and inflates analysis time.
- **Memory concern:** All frame base64 data held in memory simultaneously (C2-1) could cause OOM on older devices.
- **Privacy gap:** Phone call screens could be captured and OCR'd (BC-5).
- **Strengths:** Session state machine is robust. Error handling on FAILED state is clean. AppState listener handles foreground/background transitions.

### Gemini Analysis (Prompt + Parsing): 5/10
**Reasoning:** This is the highest-risk and most critical component:
- **Prompt gaps:** Political content undefined (PQ-2), ad detection misses influencer disclosures (PQ-1), source_origin unreliable for most platforms (PQ-9), "feed item" undefined (C3-1), content_type "ad" conflicts with is_ad (C3-3).
- **Hallucination risk:** No upper-bound validation on item count per frame (PQ-3, RP-4). Gemini can invent items.
- **Parsing bugs:** `Boolean()` truthy conversion (RP-3 — string "false" → true), NaN confidence (RP-3 Cycle 1 addition), MIXED valence silently dropped (DD-1).
- **Strengths:** `responseMimeType: 'application/json'` eliminates markdown-wrapped JSON issues. `sanitizeExtractedItem` provides reasonable defaults. Retry logic with exponential backoff is solid.

### Deduplication: 3/10
**Reasoning:** The weakest component:
- **Architecture flaw:** Relies entirely on Gemini for deduplication rather than using deterministic client-side algorithms. This makes dedup non-deterministic, expensive, slow, and prone to token limit truncation (C2-8).
- **Undefined criteria:** "80% overlap" is ambiguous (PQ-4). No minimum text length for merging.
- **No output validation:** Dedup can return more items than input (RP-7) or fewer items than expected.
- **Silent failure:** Dedup failures fall back to un-deduped items silently — user doesn't know.
- **Token truncation:** For >100 items, the output likely exceeds maxOutputTokens, causing silent fallback to un-deduped data.
- **Strengths:** Fallback to un-deduped items is safe (data loss is better than data corruption).

### Dashboard Computation: 8/10
**Reasoning:** The strongest and most reliable component:
- **Division-by-zero:** Handled consistently in all code paths.
- **Insight generation:** Well-crafted, epistemically restrained text. Low sample warnings are good.
- **Graceful degradation:** Old scan formats, missing AI analysis, and empty scans all handled with sensible defaults.
- **Weaknesses:** MIXED valence exclusion (DD-1) is a data loss bug. source_origin null → "followed" conflation (PL-3) can significantly misrepresent the suggested/followed split. followedCount can theoretically go negative (DD-4).
- **Strengths:** Re-computing from source data (rather than trusting pre-computed aggregates) is a sound architectural choice. Percentage normalization ensures tone/ideology sums to 100%.

### Overall Pipeline Accuracy: 5/10
**Summary:** The pipeline can produce correct results for straightforward cases (clear Instagram feed, labeled ads, obvious content types) but has significant gaps for edge cases. The biggest accuracy risks are: (1) source_origin being null for most items, making the Suggested vs Followed tab unreliable; (2) deduplication being non-deterministic and prone to silent failure; (3) no hallucination guardrails; (4) the is_ad Boolean() bug silently misclassifying items. The dashboard computation is solid once it receives correct data.

---

*Audit complete after 5 self-review cycles.*
*Total findings: 9 Prompt Quality + 7 Response Parsing + 6 Pipeline Logic + 5 Dashboard Data + 9 Broadcast Edge Cases + 8 Analysis Edge Cases + 5 Dashboard Edge Cases + 9 Self-Review additions = 58 findings*
*Critical: 1 | High: 9 | Medium: 15 | Low: 17 (initial) + 16 appendix findings*
