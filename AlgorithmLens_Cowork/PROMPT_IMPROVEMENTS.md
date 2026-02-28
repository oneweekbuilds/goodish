# AlgorithmLens — Prompt Improvement Proposals

**Date:** February 15, 2026
**Based on:** ACCURACY_AUDIT.md (February 15, 2026)
**Status:** Proposals for review — no changes have been applied

---

## Summary

- **Total prompt changes proposed:** 5
- **By impact:** 2 High | 2 Medium | 1 Low
- **Already fixed since audit:** 7 of the original 7 critical/important prompt issues have already been addressed in the current codebase (see "Previously Resolved" section below)

The current `gemini_analyzer.py` prompt has already been substantially rewritten since the accuracy audit was generated. The epistemic restraint violations, missing tiebreaker rules, over-classification bias, misinformation theme, temperature setting, model version, and structured JSON output have all been fixed. The 5 proposals below address **remaining refinement opportunities** that could further improve classification consistency and reduce edge-case misclassification.

---

## Previously Resolved (No Action Needed)

These audit findings have already been addressed in the current code. Listed here for completeness:

| Audit Issue | What Was Fixed |
|---|---|
| **CRITICAL-P1:** Prompt used "manipulate," "engagement bait," accusatory language | Prompt rewritten to neutral "You are a content classifier" framing |
| **CRITICAL-P2:** No tiebreaker rules for multi-category posts | Tiebreaker rules added (most specific category wins, classify by action not identity) |
| **CRITICAL-D1:** Temperature at 0.1 | Changed to 0 |
| **CRITICAL-D2:** Model used `-exp` tag | Pinned to `gemini-2.0-flash` (stable) |
| **IMPORTANT-D3:** No structured JSON output | Added `response_mime_type: "application/json"` |
| **IMPORTANT-P4:** "Even slight evidence" over-classification bias | Changed to "clear, direct evidence in the text" |
| **IMPORTANT-P5:** Misinformation wellbeing theme | Removed from valid themes list |
| **IMPORTANT-R3:** No field validation | Full validation function added (`_validate_analysis_result`) |
| **CRITICAL-R1:** Fragile JSON string manipulation | Replaced with regex-based JSON extraction |
| **CRITICAL-R2:** Count mismatch padded with defaults | No longer pads; partial classification tracked with quality metadata |
| **MINOR-P6:** No handling for non-English content | Added `language` field to prompt output |
| **MINOR-P7:** No handling for empty/image-only posts | Prompt now instructs: classify empty text as "general" / "NEUTRAL" |
| **Rec #15:** political_polarization used intent language | Rephrased to "strongly oppositional or us-vs-them framing" |

---

## Proposed Improvements

---

### 1. Sharpen Category Boundaries to Reduce Overlap

**Why this matters (plain language):**
The audit found that 12 of 15 topic categories have significant boundary overlap with at least 2 other categories. While the tiebreaker rules help, the category definitions themselves are still vague enough that borderline posts will be classified inconsistently. For example: a fitness influencer reviewing protein powder could be "fitness," "food," or "business." The tiebreaker says "most specific wins" — but all three are equally specific. Adding short boundary notes to the most overlap-prone categories would give Gemini clearer signals.

**Impact:** High

**Original prompt text (lines 103–119 of current ANALYSIS_PROMPT):**
```
1. **primary_topic**: The single best content category. Choose ONE from this list:
   - "sports" — sports teams, games, athletes, scores, leagues (NFL, NBA, MLB, NHL, soccer, etc.)
   - "entertainment" — movies, TV shows, celebrities, comedy, memes, viral content
   - "music" — songs, artists, albums, concerts, music industry
   - "gaming" — video games, esports, streamers, gaming culture
   - "food" — recipes, restaurants, cooking, food reviews
   - "fitness" — workouts, gym, exercise, health routines
   - "beauty" — makeup, skincare, cosmetics, beauty tutorials
   - "fashion" — clothing, style, outfits, fashion trends
   - "travel" — destinations, vacations, trips, tourism
   - "tech" — technology, gadgets, software, AI, crypto
   - "business" — finance, investing, career, entrepreneurship
   - "politics" — elections, policy, government, political figures
   - "news" — current events, breaking news, journalism
   - "education" — learning, tutorials, academic content, educational videos
   - "lifestyle" — daily life, wellness, home, pets, parenting
   - "general" — if none of the above clearly apply, or if text is too short/empty to classify
```

**Proposed replacement:**
```
1. **primary_topic**: The single best content category. Choose ONE from this list:
   - "sports" — sports teams, games, athletes, scores, leagues (NFL, NBA, MLB, NHL, soccer, etc.). Includes fantasy sports. Does NOT include athlete lifestyle content unrelated to their sport.
   - "entertainment" — movies, TV shows, celebrities, comedy, memes, viral content. Includes reality TV, true crime, and celebrity gossip. Does NOT include music (use "music") or video games (use "gaming").
   - "music" — songs, artists, albums, concerts, music industry. Includes music festivals and DJ culture.
   - "gaming" — video games, esports, streamers, gaming culture. Includes board games and tabletop gaming. Does NOT include gambling or betting (use "business").
   - "food" — recipes, restaurants, cooking, food reviews, food culture. Includes alcohol and beverage content.
   - "fitness" — workouts, gym, exercise, health routines, athletic training. Does NOT include product reviews of fitness gear (use "business" if the post is primarily a review/promotion).
   - "beauty" — makeup, skincare, cosmetics, beauty tutorials, cosmetic procedures.
   - "fashion" — clothing, style, outfits, fashion trends, thrift hauls.
   - "travel" — destinations, vacations, trips, tourism, travel guides.
   - "tech" — technology, gadgets, software, AI, apps. Does NOT include crypto investment advice (use "business").
   - "business" — finance, investing, career, entrepreneurship, product promotions, betting/gambling. Use when the primary focus of the post is selling, reviewing, or promoting a product or service.
   - "politics" — elections, policy, government, political figures, legislation. Must reference specific political entities, figures, or policy. General social commentary without political specifics is NOT political.
   - "news" — current events, breaking news, journalism from news outlets. Must be reporting, not opinion. Opinion posts about news topics should be classified by the topic itself.
   - "education" — learning content, academic material, how-to guides where teaching is the primary purpose. A fitness tutorial is "fitness" not "education"; a cooking tutorial is "food" not "education."
   - "lifestyle" — daily life, wellness, home decor, pets, parenting, personal vlogs. Use only when no specific category above applies.
   - "general" — if none of the above clearly apply, or if text is too short/empty to classify. Last resort only.
```

**What changed and why:**
Added boundary notes to 10 categories specifying what they do and do NOT include. This addresses the most common overlap scenarios identified in the audit's edge case analysis (Step 3). For example: gambling/betting is now explicitly routed to "business," fitness product reviews go to "business" when promotion is the focus, and tutorials are classified by their subject matter (not as "education"). The "education" category now explicitly defers to subject-specific categories for tutorials, which was the most common source of ambiguity.

---

### 2. Add Explicit Guidance for Sponsored/Promotional Content Topics

**Why this matters (plain language):**
The audit noted (IMPORTANT-P3) that `primary_topic` only allows one label, so a sponsored fitness post gets classified as either "fitness" or "business" — but not both. Since AlgorithmLens has a separate commercial classifier that handles ad/promotion detection (the Gold Standard v3.0 pattern matcher), the Gemini prompt should instruct the model to classify by the **content topic**, not by whether something is an ad. Otherwise, the topic distribution on the Overview tab will be skewed — fitness content that happens to be sponsored would show up as "business" instead of "fitness."

**Impact:** High

**Original prompt text (no explicit guidance exists — this is an addition):**
```
(No current instruction addresses this case)
```

**Proposed replacement (add to the tiebreaker rules section, after the existing tiebreaker rules):**
```
   - If a post is promoting or advertising a product, classify by the product's content area, not by the fact that it's an ad. A sponsored fitness post is "fitness"; a paid partnership for a skincare brand is "beauty"; a promoted tech gadget review is "tech". Commercial/ad detection is handled separately by another system — your job is to classify the content topic.
```

**What changed and why:**
This new rule tells Gemini to classify sponsored content by its subject matter rather than labeling it "business." Since the commercial classifier already handles ad detection independently, having Gemini also flag things as "business" just because they're sponsored leads to double-counting and makes the topic distribution less useful. A user's feed that's heavy on fitness content should show as fitness-heavy in the Overview tab, even if much of that fitness content is sponsored.

---

### 3. Tighten Wellbeing Theme Definitions to Reduce False Positives

**Why this matters (plain language):**
Even though the over-classification instruction ("even slight evidence") was fixed, some theme definitions are still broad enough to trigger on content that isn't really a wellbeing concern. For example, "comparison_envy" is defined as "social comparison, lifestyle showcasing that emphasizes status or wealth" — but a lot of social media is inherently about showcasing lifestyles. Without a clearer threshold, this theme could flag a large percentage of posts. Similarly, "motivation" captures "self-improvement pressure," but a lot of fitness and career content is motivational without being concerning. Tighter definitions will produce more meaningful wellbeing data.

**Impact:** Medium

**Original prompt text (lines 139–148 of current ANALYSIS_PROMPT):**
```
   Available themes:
   - "fitness" — exercise, gym, workouts
   - "diet_weight" — dieting, weight loss, calories, eating habits
   - "body_image" — appearance, body shape, beauty standards, transformations, before/after posts, cosmetic procedures, body comparisons
   - "mental_health" — anxiety, depression, therapy, stress, emotional wellbeing
   - "motivation" — productivity messaging, success mindset, self-improvement pressure
   - "conflict" — arguments, drama, controversy, outrage, confrontational framing
   - "comparison_envy" — social comparison, lifestyle showcasing that emphasizes status or wealth
   - "political_polarization" — political content with strongly oppositional or us-vs-them framing
   - "hustle_culture" — extreme productivity messaging, burnout normalization
```

**Proposed replacement:**
```
   Available themes (only classify when the theme is a clear, central element of the post — not just incidentally present):
   - "fitness" — the post's primary focus is exercise, gym, or workouts
   - "diet_weight" — explicitly discusses dieting, weight loss goals, calorie counting, or restrictive eating habits
   - "body_image" — directly focuses on body shape evaluation, before/after transformation comparisons, cosmetic procedure results, or explicit commentary on physical appearance standards
   - "mental_health" — explicitly discusses anxiety, depression, therapy, mental health struggles, or emotional crisis
   - "motivation" — centers on high-pressure productivity messaging, "grind" or "no excuses" mindset, or frames rest/balance as weakness
   - "conflict" — the post is primarily about an argument, controversy, callout, or outrage — not simply a post that mentions a disagreement
   - "comparison_envy" — explicitly frames wealth, possessions, or lifestyle as aspirational in a way that invites comparison (e.g., "look at what I have"). General lifestyle content is NOT comparison_envy.
   - "political_polarization" — political content that uses strongly oppositional or demonizing language about a political group. Standard political discussion or news is NOT polarization.
   - "hustle_culture" — glorifies overwork, frames burnout as a badge of honor, or shames rest and boundaries
```

**What changed and why:**
Each theme definition now includes a clearer threshold and, where helpful, an explicit exclusion. "motivation" was narrowed from general "self-improvement pressure" to specifically high-pressure/no-excuses framing. "comparison_envy" now requires explicit aspirational framing, not just any lifestyle content. "conflict" specifies that simply mentioning a disagreement doesn't qualify. "political_polarization" distinguishes between standard political discussion and demonizing language. These changes should reduce false positives — the wellbeing section of the dashboard will flag fewer posts overall, but the ones it does flag will be more meaningful.

---

### 4. Improve Sarcasm and Ambiguous Tone Handling

**Why this matters (plain language):**
The audit flagged (Step 3, Tone section) that sarcasm and ambiguous tone are major sources of misclassification. The current prompt says "Sarcasm should be classified by apparent intent (sarcastic praise = NEGATIVE)" — but this is a very hard judgment call for an AI, and getting it wrong means the Tone tab shows inaccurate sentiment data. It's better to route genuinely ambiguous cases to NEUTRAL rather than risk misclassifying sarcasm.

**Impact:** Medium

**Original prompt text (lines 127–130 of current ANALYSIS_PROMPT):**
```
2. **sentiment**: The overall emotional tone of the post. Must be one of: "POSITIVE", "NEUTRAL", or "NEGATIVE".
   - Base this on the predominant tone of the text content.
   - Sarcasm should be classified by apparent intent (sarcastic praise = NEGATIVE).
   - If the tone is genuinely unclear or mixed, use "NEUTRAL".
```

**Proposed replacement:**
```
2. **sentiment**: The overall emotional tone of the post. Must be one of: "POSITIVE", "NEUTRAL", or "NEGATIVE".
   - Base this on the predominant tone of the text content.
   - If sarcasm is obvious and unmistakable, classify by the intended meaning (e.g., clearly sarcastic praise of something the author dislikes = NEGATIVE). If there is any doubt about whether a post is sarcastic, classify by the literal text and use "NEUTRAL" if ambiguous.
   - Nostalgic, bittersweet, or mixed-emotion posts should be classified as "NEUTRAL".
   - If the tone is unclear, mixed, or could be read multiple ways, use "NEUTRAL".
```

**What changed and why:**
The sarcasm rule was softened from "classify by apparent intent" (which assumes the AI can reliably detect sarcasm) to "only classify by intent when sarcasm is obvious and unmistakable." A new fallback was added: when in doubt, classify literally and default to NEUTRAL. A new line was added for nostalgic/bittersweet content (the audit's edge case #2 — "nostalgic post about a deceased celebrity" — which is neither clearly positive nor negative). Overall, these changes push ambiguous sentiment toward NEUTRAL rather than risking incorrect POSITIVE/NEGATIVE labels. The Tone tab will be more conservative but more trustworthy.

---

### 5. Add Guidance for Very Short and Emoji-Only Posts

**Why this matters (plain language):**
The current prompt handles empty text ("classify as general/NEUTRAL") but doesn't address very short posts like a single emoji, a one-word reaction ("lol"), or a repost with no added commentary. These are common on social media and Gemini might try to over-interpret them, assigning topic or sentiment labels to content that doesn't have enough signal.

**Impact:** Low

**Original prompt text (line 166 of current ANALYSIS_PROMPT):**
```
- If a post has empty or unreadable text, classify it as primary_topic "general", sentiment "NEUTRAL", with empty wellbeing_themes.
```

**Proposed replacement:**
```
- If a post has empty, unreadable, or very short text (fewer than 5 words, emoji-only, or single reactions like "lol" or "wow"), classify it as primary_topic "general", sentiment "NEUTRAL", with empty wellbeing_themes and language "unknown". Do not attempt to infer topic or sentiment from minimal text.
```

**What changed and why:**
Extended the "empty text" rule to also cover very short posts, emoji-only posts, and minimal reactions. Without this, Gemini might try to classify a fire emoji as "POSITIVE" sentiment or a single "lol" as "entertainment." The threshold of fewer than 5 words gives Gemini a concrete cutoff. This produces cleaner data — posts without enough text signal won't contribute noise to the topic or sentiment distributions.

---

## Reminder

No changes have been applied to the codebase. These are proposals for Justin to review and approve. Each proposed change is independent — they can be adopted individually, in any combination, or not at all.
