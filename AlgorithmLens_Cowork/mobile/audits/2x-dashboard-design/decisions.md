# 2.x Dashboard: design decisions

Captured from Claude Design exploration during the 1.1.x TestFlight live-with period (May 2026). This document is the design specification for the 2.x Dashboard screen across all six tabs. Implementation has not started.

## Status

Design v1 approved as direction. Implementation deferred. The interpretation engine that would generate the strings rendered in these mockups does not yet exist.

Strategic context: `mobile/audits/algorithmlens-2x-interpretation-layer-brief.md`.
Related design work: `mobile/audits/2x-results-design/decisions.md`.

## What was produced

One Claude Design pass:
- Six iPhone Pro mockups, one per Dashboard tab, rendering a canonical 6th-scan user state
- A "calm-case" Ads tab mockup showing the design holds when findings are quiet
- A chrome treatment artboard (title, caption, Scan button, tab strip)
- A tab strip behavior artboard (single accent, finding-dot, busy vs calm scans)
- A written decisions card

Screenshots not committed to this repo. The markdown below is the durable record.

## Canonical user state for the worked examples

The worked examples below render a single user state across all six tabs, showing how the Dashboard reads as a coherent product. This user state is illustrative, not literal — real production strings will use real data.

**User context:** 6th YouTube scan, May 15 2026. 49 posts, 1:26 session.

**Current scan metrics:** Top creator 28%, top 3 = 51%, ad density 14%, political content 11%, tone 45% negative / 35% neutral / 20% positive, suggested 62% / followed 38%.

**Prior 5 YouTube scans average:** Top creator 18%, ad density 13%, political content 3-4%, tone 25% negative, suggested 60% / followed 40%.

**Patterns visible across 6 scans:**
- @MarquesBrownlee in 5 of 6 scans, always top 5
- @PoliticalNewsChannel first appeared scan 5, driving most political content
- Political content trajectory: 4%, 4%, 4%, 5%, 7%, 11% (steady climb)
- Tone began drifting negative on scan 4 (correlated with politics)
- One tech retailer advertiser in 4 of 6 scans
- @ColinAndSamir (top followed creator) hasn't posted in 8 days

## Cross-cutting design system extensions

The Dashboard extends the v2 Results design system. Five cross-cutting decisions that apply across all six tabs.

### 1. Dashboard chrome

Platform-led title ("YouTube") plus single scan caption ("TODAY · 3:42 PM · 49 POSTS · 1:26") prefixed by three small brand-blue progress segments preserving the "finding delivered" signal. Scan button stays top-right.

The per-tab meta-line from Results folds up to screen-level — six tabs repeating the meta-line would cross from anchor into chrome noise. Each tab's hero loses the meta row but keeps a simplified "VERDICT" eyebrow (dropping "· TODAY" since the temporal anchor lives in the screen caption above).

### 2. Tab strip behavior

Single brand-blue accent on the active tab (per-tab accent colors from 1.1.x are dropped). A 6px brand-blue dot appears next to any tab whose interpretation is strong enough to warrant the user's attention.

**Finding-dot threshold (engine spec):** A tab gets a dot if its hero contains any of:
- A Coaching beat (SOMETHING TO TRY)
- A multi-scan trajectory call-out
- An unusual concentration finding
- Otherwise, no dot

The component reads a boolean per tab. Same threshold should be reused for any future History/Compare surfaces so users get consistent saliency signals.

When no tab has a strong finding (calm-case scan), the strip degrades cleanly to no dots — same calm as the busy-scan strip, minus the dots.

### 3. Cross-tab coherence

Verbal interpretation does the connective work. The finding-dots reinforce by showing the user which tabs the analysis is excited about. No explicit "see other tab" pointers — those train users to leave the current tab, which fights the screen calm.

Connected findings (e.g., politics climbing on Tab 4, tone moving with it on Tab 5) are stated as self-contained insights on each tab. When a user navigates between connected tabs, the connection is recognized through the verbal interpretation, not signposted with cross-references.

### 4. Calm-case tabs

When a tab has no strong finding, the design pattern is preserved but quieter:
- Verdict allowed to be a calm declarative ("Your ads have been steady.")
- Coaching beat drops (no SOMETHING TO TRY)
- OBSERVED + LIKELY are enough
- Supporting card stays the same shape
- Tab strip dot drops to nothing

The voice guidance should explicitly forbid templates like "Your X has been normal" that re-emit unchanged across scans. If there's truly nothing dramatic to say, the verdict can be specific without being eventful ("Ads sat at 11%, your usual range").

### 5. Supporting card flex

The Results screen's 4-row supporting card extends with six row variants:
- **FactRow** — label, value, optional comparative anchor. The 1.1.x and Results pattern.
- **CreatorRow** — handle, post count, history anchor ("in 5 of last 6 scans")
- **TrajectoryRow** — inline 6-bar sparkline showing metric trajectory across scans
- **BarRow** — segmented horizontal bar with labels (used for distributions like ideology lean, tone breakdown)
- **CaveatNote** — caution-tinted methodology warning attached to a row (e.g., "Native promos may be under-counted")
- **MethodologyRow** — small disclosure-style row pinned to card bottom, replaces the standalone "About this measurement" expandable

All variants sit in the same bg-secondary shell with the same eyebrow.

**Visual evidence rule:** Supporting cards lead with their strongest visual evidence when one exists. For the canonical user state:
- Tab 1: TopVoiceRow first (recurring creator is the proof)
- Tab 2: Top creators list (already the proof)
- Tab 3: Recurring advertiser row first (matches the verdict)
- Tab 4: TrajectoryRow first (the sparkline IS the proof)
- Tab 5: Tone-of-political-vs-non-political first (proof of causal claim)
- Tab 6: Quietest followed creator first (named cause)

**Sparkline color choice (Tab 4):** Historical bars in brand-blue at 35% opacity, latest scan at full brand-blue. No green/red — whether a climbing metric is "good" depends on context the chart shouldn't pre-judge. Direction shows through bar heights alone.

**Bar color choice (Tabs 4, 5):** Segmented bars use brand-blue for leading/highlighted segments, tertiary gray for neutral, brand-accent green for positive. For tone specifically, "negative" gets brand-blue rather than red — red is reserved for destructive UI states. The accent-green / brand-blue / gray triad reads as "a categorical split" not "good vs bad," which matches the brand voice (we describe, we don't judge).

### 6. Scrolling behavior (implementation question)

Tabs 2, 5, and 6 have supporting content that overflows iPhone Pro viewport. The mockups show top-of-tab. On real devices the surface scrolls.

Open implementation question: when a tab scrolls, what stays sticky at top?

Recommended approach: chrome (title + caption) collapses on scroll; tab strip stays sticky; the hero verdict and below scroll naturally within the tab. This preserves tab navigation while letting the user dig into supporting content. Final treatment to be confirmed during implementation.

## The six tabs: worked examples

These are the canonical strings each tab's hero zone produces in this user state. Voice and structure are normative; specific numbers and names are illustrative.

### Tab 1: Overview

**Verdict:** Your feed has been shifting toward news for two weeks.

**OBSERVED:** Political content has climbed across your last three scans — 4%, then 7%, now 11%. The shift began roughly two weeks ago when @PoliticalNewsChannel first appeared in your feed.

**LIKELY:** This is a steady drift, not a one-time spike. Once a news source enters a feed and the user engages even a little, the algorithm tends to amplify it across sessions. Your tone has been moving more negative on the same trajectory.

**SOMETHING TO TRY:** Drifts like this don't usually reverse on their own. Engaging less with the source that's driving the shift, or actively watching non-news creators you follow, both work as counter-signals over a few sessions.

**Supporting card (TopVoiceRow leads):**
- Top voice: @MarquesBrownlee · in 5 of last 6 scans
- Content types: Video 51%, Shorts 32%, Ad 14% · normal mix
- Time estimate: ~3 min political, ~4 min ads in this session
- Most-changed metric: Political content · up 7x from your baseline

### Tab 2: Who Shapes Your Feed

**Verdict:** One creator has quietly become your most-seen voice.

**OBSERVED:** @MarquesBrownlee has appeared in 5 of your last 6 scans, always in your top 5, and made up 28% of this scan. That's a 56% increase in concentration over your average.

**LIKELY:** Their content consistently triggers your engagement enough that the algorithm has narrowed in on them as a reliable signal for what to show next. This pattern typically forms when a user watches 3+ videos from the same creator in a short window.

(Note: original draft was "the algorithm has high confidence you want more" — rewritten per the locked no-anthropomorphism rule. "High confidence" is a model state, not an algorithm state.)

**SOMETHING TO TRY:** Patterns like this respond to engagement signals more than active blocking. If you want more variety, the broad lever is spending more time on different creators in the same category. Watching one or two videos from other tech voices usually broadens what the algorithm reads as your interest.

**Supporting card (CreatorRows lead):**
- @MarquesBrownlee · 14 posts · 5 of last 6 scans
- @PoliticalNewsChannel · 6 posts · first appeared scan 5
- @ColinAndSamir · 4 posts · in 3 of last 6 scans
- @TheoVon · 2 posts · new this scan
- @GameTheory · 2 posts · in 4 of last 6 scans
- Top 5 made: 52% of feed · up from 42% average
- Unique creators: 18 · fewer than typical (usually 23)

### Tab 3: Ads & Promotions

**Verdict:** One advertiser is sitting on your feed more than the others.

**OBSERVED:** A tech-retail advertiser has appeared in 4 of your last 6 scans, contributing 2-3 ads each time. They accounted for 36% of all ads you've seen across these sessions.

**LIKELY:** Either they're running a sustained campaign that overlaps with your viewing windows, or YouTube's targeting has locked onto a signal from your activity — most often the tech and gadget content you regularly watch. The second is more likely given your top creator is also tech-focused.

**SOMETHING TO TRY:** Recurring advertisers usually mean YouTube has read a signal in your activity as commercial-intent for that category. Exploring different content topics (not just blocking the brand) is what shifts what the targeting reads.

**Supporting card (Recurring advertiser row leads):**
- Recurring advertiser: tech-retail brand · 4 of 6 scans
- Labeled ads in this scan: 4 (8% of feed) · typical
- Unlabeled promos in this scan: 3 (6% of feed) · note: hard to detect, may be underreported
- Top advertised category across scans: Consumer tech · 4 of 6 scans
- Ads vs non-ads tone: ads run more positive than feed average · typical

### Tab 4: Political Exposure

**Verdict:** Your political exposure isn't varied — it's coming from one place.

**OBSERVED:** 11% of your feed was political this session. Of that, 73% came from @PoliticalNewsChannel alone. They've only appeared in your last two scans.

**LIKELY:** When a single source dominates a content category like this, the algorithm has narrowed in on that source as a reliable engagement-driver for political content. You'll likely keep seeing them — and probably more like them — unless you actively skip or downvote.

**SOMETHING TO TRY:** Once a category gets concentrated like this, it usually keeps expanding unless something interrupts it. Reducing engagement with the dominant source is the most direct lever. Adding varied political perspectives (across center, left, or right) also works because it gives the algorithm a broader read on what you're actually interested in.

**Supporting card (TrajectoryRow leads):**
- Trajectory: 4% → 4% → 4% → 5% → 7% → 11% (last 6 scans, steady climb) [inline 6-bar sparkline]
- Ideological lean: 60% center, 25% left, 15% right [BarRow]
- Tone of political content: 68% negative · much higher than feed average
- Methodology: AI classification of political content is approximate [MethodologyRow]

### Tab 5: Emotional Tone

**Verdict:** Your feed got more negative because politics got bigger.

**OBSERVED:** Tone leaned 45% negative this scan, up from your 25% baseline. The increase tracks almost exactly with your political content climb — politics is at 11% (negative 68% of the time) and the rest of your feed actually held steady in tone.

**LIKELY:** This isn't a general mood shift in your feed. It's one expanding content category pulling the average. The political content in particular is running 68% negative this scan, which is enough to move the overall tone meaningfully when politics is at 11%.

**SOMETHING TO TRY:** Tone shifts driven by a single content category usually move with that category. Whatever shifts the political content load up or down will pull the tone average with it. Engaging with analytical or explanatory content tends to be lighter in tone than reactive news, even on similar topics.

**Supporting card (tone breakdown leads):**
- Tone of non-political content: 28% negative · close to your normal
- Tone of political content: 68% negative · pulling the average
- Tone this scan: 45% negative · 35% neutral · 20% positive [BarRow]
- Most negative source: @PoliticalNewsChannel
- Most positive source: @TheoVon
- Suggested vs followed tone gap: suggested runs 18% more negative · larger gap than usual

### Tab 6: Suggested vs. Followed

**Verdict:** Your followed creators have gone quiet, so suggestions are filling the gap.

**OBSERVED:** 62% of your feed was suggested content this scan, close to your 60% average. But @ColinAndSamir, your top followed creator, hasn't posted in 8 days. That gap is being filled by suggestions, mostly news.

**LIKELY:** When followed creators slow down, the recommendation pool fills more of the feed. The category that fills depends on what you've been engaging with — and lately that's been news.

(Note: original draft was "the algorithm reaches into recommendations to keep the feed full" — rewritten per the locked no-anthropomorphism rule. "Reaches into" is agentive; the rewrite describes the mechanism without attributing intent.)

**SOMETHING TO TRY:** Two general directions. To shift what fills the gap, watching more from creators you follow (or rewatching their older content) gives the algorithm a stronger followed-side signal. To bring in more news but from sources you choose, subscribing to specific news channels treats them as followed rather than recommended.

**Supporting card (Quietest creator row leads):**
- Quietest followed creator: @ColinAndSamir · 8 days since last post
- Most-active followed creator: @MarquesBrownlee · still posting regularly
- Suggested 62% · Followed 38% · typical split [BarRow]
- Suggested creators new to your feed: 21% · most are returning
- Suggested side ad density: 2.1x followed side · typical gap
- Top topics on suggested: News, Tech · note shift toward news
- Top topics on followed: Tech, Gaming · stable

## Calm-case Ads tab

In a user state with no recurring advertiser, normal ad density, and no notable composition:

**Verdict:** Your ads have been steady.

**OBSERVED:** Ads made up 11% of this scan, within 1-2 points of every other scan in your history. No single advertiser is dominating.

**LIKELY:** Your viewing patterns aren't producing a strong commercial-intent signal in any one direction. The mix you're seeing reflects YouTube's general inventory for this content category.

(No SOMETHING TO TRY beat — nothing useful to coach when nothing notable is happening.)

**Supporting card stays the same shape.**

The voice guidance must explicitly forbid templates like "Your X has been normal" that emit identical strings across scans. The verdict can be specific without being eventful.

## Voice flags resolved during this pass

The brief locked the rule: "Algorithms respond to signals; they don't decide, feel, want, or read as confident." Two draft strings violated this and were flagged by Claude Design during rendering. Resolutions captured here:

- **Tab 2 LIKELY:** "the algorithm has high confidence you want more" → "the algorithm has narrowed in on them as a reliable signal for what to show next." "High confidence" is a model state, not algorithm state. Rewrite uses mechanism language.
- **Tab 6 LIKELY:** "the algorithm reaches into recommendations to keep the feed full" → "the recommendation pool fills more of the feed. The category that fills depends on what you've been engaging with." Original used agentive verb. Rewrite uses passive mechanism language.
- **Tab 4 LIKELY:** "the algorithm has narrowed in on that source as a reliable engagement-driver" — flagged as borderline (verb "narrowed in" is agentive-adjacent). Accepted as-is. "Narrowed in" describes outcome state rather than intent, which keeps it on the right side of the rule.
- **Tab 1 LIKELY:** "the algorithm tends to amplify it across sessions" — passes. "Tends to amplify" is observational.

## Engineering implications captured during design

- **Finding-dot threshold** needs to be defined as an upstream engine signal, not a UI logic concern. Same threshold should be reused for future History/Compare surfaces.
- **Trajectory sparklines** require the engine to expose per-scan time series for each tracked metric (political %, ad %, top-creator-share, tone breakdown).
- **Cross-scan recurrence detection** (creators, advertisers, sources) requires the engine to maintain rolling history aggregations.
- **Coaching threshold calibration** — coaching beats should only appear when patterns warrant action. Too frequent and the product feels preachy. To be determined during interpretation engine development.
- **Scroll behavior** — see Section 6 above. Final treatment confirmed during implementation.

## Carry-forward to other surfaces

The Dashboard establishes patterns that should propagate to:

- **History** — listing of past scans should use the finding-dot signal to highlight scans with strong findings; selection of a History entry deep-links to the Dashboard rendered for that scan
- **Compare** — when comparing two scans, the same verdict-plus-sub-line system applies, with the comparative anchors becoming the load-bearing visual element
- **About this analysis** — methodology surface should expand to cover how the interpretation layer works (observed vs likely, finding thresholds, source attribution)

## Open questions for future work

1. How does the finding-dot threshold get calibrated? Too sensitive and every scan has dots on every tab; too strict and dots never appear.
2. When the engine produces calm verdicts, how does it avoid template repetition across scans?
3. Do real-world creator handles fit the existing supporting-card row width? Long handles ("@VeryLongCreatorHandleName") may need ellipsis or wrap rules.
4. Sparkline scaling: how is the y-axis calibrated when metric ranges vary wildly across users?

## Source of truth

For visual reference, the Claude Design conversation that produced this v1 contains:
- Six iPhone Pro tab mockups (Overview, Who Shapes Your Feed, Ads, Politics, Tone, Suggested vs. Followed)
- Calm-case Ads tab
- Dashboard chrome treatment artboard
- Tab strip behavior artboard (busy scan, calm scan)
- Decisions card

Until those screenshots are committed, the Claude Design conversation is the canonical visual source. This document is the textual source of truth for the design decisions.
