# AlgorithmLens 1.x to 2.x: From Dashboard to Coach

Strategic brief for the next major product cycle, derived from the 1.1.x redesign live-with period. Captures the frame shift from "show users facts about their feed" to "tell users what those facts mean and what's likely producing them." Intended as input to the next design pass.

## Status

This brief documents thinking from the 1.1.x TestFlight live-with period (build #55, May 2026). It is not a 1.1.x deliverable. The 1.1.x sweep landed brand cohesion and visual redesign. The work described here is the next major capability layer: an interpretation engine that turns dashboard facts into coached insights.

Implementation is deferred to a future cycle. This brief captures the framing so the thinking does not have to be re-derived.

## The frame shift

### Current state (1.1.x)

AlgorithmLens surfaces facts about a user's feed and lets the user do the interpretation. The Results screen shows "14% of your feed was ads" without context for whether that is high or low. The Dashboard shows "4% from your top source" without context for whether that means concentrated or balanced. This is a defensible design choice. The product respects the user enough to let them draw their own conclusions. But it caps the product's value at "useful measurement tool" when the brand thesis is "AI transparency partner."

### Target state (2.x)

Surface a fact, then carry the user one step further to what the fact means and what is likely producing it. Two new editorial moves.

**Interpretation as a first-class element.** Not "14% ads." Instead "14% ads, typical for YouTube where ad density usually runs 10-18%." Or "14% ads, higher than your average of 9% across platforms. Worth noticing." The product reads the facts and offers a read on them.

**Likely-cause as a follow-up element.** "Your top creator concentration is high. Likely because you've engaged with their content recently." The product offers a hypothesis about what user behavior is producing the observed pattern, labeled as inference rather than fact.

The difference between current and target is the difference between a dashboard and a coach. Dashboards show numbers. Coaches tell you what to make of them.

## The trust architecture

Inference layers drift from "honest interpretation" into "confident hallucination" quickly, especially with an LLM doing the inference. The product reputation depends on inference being more right than wrong. The win condition is the user reading an interpretation and thinking "huh, that tracks." The failure mode is the user reading an interpretation and thinking "that's not why, you're guessing."

The mitigation is a two-tier labeling convention that is visible to the user on every interpretive surface.

**Observed.** A direct measurement from the captured frames. "14% of items were ads." Hard fact, can be cited.

**Likely.** An inference based on the observation plus a model of how feeds work. "Your top creator concentration suggests recent engagement with their content." Soft fact, must be hedged.

### Why this specific architecture

**Why two tiers and not three.** A three-tier system (observed / inferred / speculative) creates decision fatigue both for users (more conventions to learn) and for the interpretation engine (more edge cases on which label applies). Two tiers covers the meaningful distinction: did we see this, or are we inferring it from what we saw. Adding a third tier for "speculative" just means writers have to choose between "likely" and "speculative" on every claim. Better to keep two tiers clean and let hedge language inside the "likely" tier carry the uncertainty gradient ("likely," "possibly," "may be").

**Why two tiers and not zero.** The alternative to taxonomic labels is honest hedge prose ("we think," "it seems," "probably"). This works at small scale but fails at product scale because the same engine generates content across hundreds of scans per user, and users need a visible cue to know when to treat output as fact versus interpretation. Without the convention, every interpretation has to re-establish its uncertainty in language, which gets repetitive and undermines the brand's calm voice.

**Why "likely" as the hedge word.** Softer than "probably" (which sounds confident enough to be falsifiable), stronger than "we think" (which sounds like opinion). Single-word hedge that doesn't require a personal pronoun, which keeps the product voice institutional rather than chatty.

**Why visible labeling.** Invisible convention is no convention. If the difference between observed and likely lives only in word choice, users won't learn to look for it. A visible treatment (italics, small tag, color tone, icon) becomes the cue that teaches users the convention exists. Pick one treatment and use it everywhere.

## The three levels of cause attribution

Cause claims fall into three levels of specificity. Each has different data requirements and different trust costs.

### Level 1: Population-level cause

"You're seeing more political content likely because you've watched or spent time on political videos."

Generic claim about how algorithms work. True on average. Does not require knowing anything about this specific user's behavior. Safe but soft.

**Data requirement:** none beyond domain knowledge.
**Trust cost:** low.
**Limitation:** generic, gives no specific insight.

### Level 2: Pattern-level cause inferred from scan history

"Political content was under 5% in your first three scans and is at 18% today. Something shifted in the last two weeks. The algorithm responds to recent activity patterns more than historical ones, so whatever changed is probably recent."

Requires multiple scans over time but no behavioral data beyond what the scans themselves capture. A real finding without claiming behavioral data the product does not have.

**Data requirement:** longitudinal scan history per user per platform (which the product already accumulates).
**Trust cost:** medium. The interpretation is grounded in observable trends.
**Strength:** specific, actionable, gets better with more scans (good retention shape).

### Level 3: Behavior-level cause inferred from specific engagement

"Yesterday you lingered on that political video for 30 seconds. The algorithm read that as a signal of interest and is now showing you more like it."

Requires the product to have behavioral data: dwell time, taps, replays, scrolls past, completion rate. The product does not have this data and cannot reliably get it.

**Data requirement:** the user's actual engagement signals on specific videos. Locked inside the platforms (Instagram, YouTube, etc.) and not accessible from outside. Could theoretically be approximated by dwell-on-frame heuristics from the broadcast extension, but the signal is fuzzy and the engineering cost is significant.

**Trust cost:** high. The specificity that makes Level 3 powerful is also what makes it falsifiable in real-time by the user's own memory. If the product claims the user lingered on a political video and the user did not, all other claims become suspect.

**Verdict:** out of reach for the current data infrastructure. Pursuing Level 3 in the next 12 months is not recommended.

### The trap to avoid

Level 2.5: making specific behavioral claims without the data to back them. This is where trust dies fastest. Either be specific because you actually have the data (Level 3, which the product cannot reliably reach), or be honest about what is inferred versus observed (Level 2, which the product can deliver).

## Where 2.x should land

**Level 2 is the right ceiling for 2.x.** It is the place where the product can be specific, accurate, and earn trust over time without requiring data the product cannot reliably get. It also has the right retention shape: the product becomes more valuable the more the user scans, because each scan adds to the longitudinal data that powers interpretation.

First-scan users get Level 1 generic interpretations. By scan three or four, the product is generating Level 2 claims that get more confident as more data accumulates. This compounds.

## Borrowing from Level 3 without taking on Level 3 risk

Two editorial moves let Level 2 get close to Level 3's punch without claiming behavioral data the product does not have.

### Move 1: Hypothetical specificity

Phrase interpretations to name a plausible mechanism without claiming to have observed it.

> "When you spend longer on a video, even just a few extra seconds, the algorithm reads that as interest. If political videos are catching your attention more lately, the feed is responding to that."

Carries the punch of "the algorithm is reading your dwell time" without claiming the product specifically saw the user's dwell time. Teaches the user how the system works while applying it to their visible pattern. The user does the connection in their own head, which is more powerful than a flat assertion.

### Move 2: Question instead of claim

When interpretation is uncertain, ask the user.

> "Your feed has gotten 12% more political since last month. Have you been engaging more with political content lately, or does this feel like it came out of nowhere?"

Makes the user a participant in the diagnosis. If the user confirms, the product has learned something it could not have inferred and can use it for future scans. If the user disagrees, that is also a finding. Either way, the user has agency. The product is not telling them what they did; it is helping them notice what they might be doing.

This move has a side benefit: it generates first-party user-confirmed signal that future interpretations can lean on.

## Editorial range: example interpretations across scan outcomes

The interpretation engine has to gracefully handle a wide range of scan outcomes. The examples below illustrate target voice across ten representative cases, organized by what the underlying data shows. They are not literal copy. They are voice samples for a design pass to work from.

### Case 1: Concentrated feed, single platform, first scan

**Underlying data:** top creator contributed 32% of YouTube feed, ad density 12%, no political content detected.

> **Hero:** A few voices are shaping your YouTube feed.
> **Subhero (likely):** Your top creator made up nearly a third of what you saw. Likely from sustained engagement with their videos in recent weeks.
> **Supporting:** Ads sat at 12%, typical for YouTube. No political content detected.

### Case 2: Broadly sourced feed, single platform, first scan

**Underlying data:** top source 4%, no single dominant category, ad density 9%.

> **Hero:** Your YouTube feed leans balanced today.
> **Subhero (likely):** Your top source contributed only 4%, well below the threshold where one voice tends to dominate. The algorithm is sampling broadly from your watch history.
> **Supporting:** Ads at 9%, slightly below average. Content spread across video, shorts, and ads in roughly equal measure.

### Case 3: Heavy ad load, established user

**Underlying data:** ad density 24%, user's running average across platforms is 11%.

> **Hero:** Unusually ad-heavy today.
> **Subhero (likely):** Ads made up 24% of your feed, more than double your typical 11%. Could be a campaign rotation on YouTube's side, or the algorithm reading recent activity as commercial intent.
> **Supporting:** Top categories: Sports, Tech. Top creator share: 14%.

### Case 4: Political content shift over time

**Underlying data:** political content was 3-5% in first four scans, jumped to 18% in current scan.

> **Hero:** Politics climbed sharply in your feed.
> **Subhero (likely):** Political content hit 18% this scan, up from 3-5% across your previous four. The algorithm responds to recent activity more than historical patterns, so whatever shifted is probably recent.
> **Question:** Have you been watching or engaging with political content lately, or does this feel like it came out of nowhere?

### Case 5: Quiet scan, nothing remarkable

**Underlying data:** all metrics near user's running averages, no notable shifts.

> **Hero:** Your feed has been steady.
> **Subhero (observed):** All metrics tracked close to your running average. No unusual concentration, ad load, or thematic shifts.
> **Supporting:** Top source 11%, ads 10%, mostly entertainment and tech content.

### Case 6: First-time scan on a new platform

**Underlying data:** Instagram, no prior scan history, top source 28%, ad density 18%.

> **Hero:** First read on your Instagram feed.
> **Subhero (observed):** Top source contributed 28% and ads sat at 18%. We don't have your running average for Instagram yet, but these numbers are in the typical range for the platform.
> **Note:** Run a few more Instagram scans to start seeing trends and comparisons specific to your account.

### Case 7: Cross-platform comparison

**Underlying data:** user has scan history for YouTube, Instagram, and TikTok; ad density differs significantly.

> **Hero:** TikTok runs ad-heavier than your other feeds.
> **Subhero (observed):** Your last five TikTok scans averaged 22% ads, compared to 9% on YouTube and 14% on Instagram.
> **Subhero (likely):** This is roughly typical for TikTok, which monetizes more aggressively than the other platforms. Not a sign of anything specific to your account.

### Case 8: Echo chamber pattern, multi-scan

**Underlying data:** top creator has appeared in 5 of last 6 YouTube scans.

> **Hero:** One voice keeps shaping your YouTube feed.
> **Subhero (observed):** Your top creator has appeared in five of your last six scans, often near the top.
> **Subhero (likely):** That kind of consistency usually means the algorithm has high confidence you want this creator's content, likely from sustained engagement with their videos.
> **Coaching:** To diversify, try watching from search or subscriptions directly rather than the recommended feed for a few sessions.

### Case 9: Tone shift, no obvious cause

**Underlying data:** tone classification shifted from "mostly neutral" to "mostly negative" between scans.

> **Hero:** Your feed turned more negative today.
> **Subhero (observed):** Tone classification leaned negative on 38% of items this scan, up from 12% on average.
> **Question:** Has something in your viewing patterns shifted lately, or has the news been heavier than usual? Both can pull a feed in this direction.

### Case 10: User with messy or sparse data

**Underlying data:** scan history has gaps, some scans flagged as low-frame, comparisons are noisy.

> **Hero:** Hard to draw firm conclusions from this scan.
> **Subhero (observed):** Captured 22 items, fewer than usual. Several signals were too sparse to interpret confidently.
> **Note:** Try a longer scan (around 90 seconds) next time for cleaner data.

### Notes on the editorial range

Across these ten cases, a few patterns emerge that the engine and the copy guidelines should respect.

The hero is always a verdict, not a number. The subhero is where the number lives.

The "likely" subhero is the workhorse element. Most scans have something the engine can hypothesize about. The honest cases (5, 6, 10) drop the likely subhero and stay closer to observation, which is its own kind of interpretive integrity.

Questions (cases 4 and 9) are used sparingly and only when the data suggests a shift the user might know more about than the product does. Overusing questions makes the product feel needy.

Coaching (case 8) is rarest. It only fires when the pattern is strong enough that a directional recommendation is responsible. Most scans get observation and interpretation but not advice.

## Per-surface implications

The sections below are organized by user flow order, not implementation order. See Prioritization for sequencing recommendations.

### Results screen

**Today:** Giant "49" hero (item count) with a four-row digest (Ads, Patterns, Political, Tone). The hero is a procedure stat, not a finding.

**Target:** Replace the item-count hero with a single interpretation chosen by the analysis pipeline as the most surprising or actionable insight for this scan.

Structure:

> **Hero:** A verdict (see editorial range above).
> **Subhero (likely-labeled):** Explanation of the verdict, including likely cause.
> **Below:** The four-row fact card stays, supporting the hero.

The hero rotates per scan based on whichever interpretation has the strongest signal. The variety makes opening a scan feel like getting a real read.

### Dashboard Overview

**Today:** Broken hero copy ("4% from your top source dominates this session" when 4% is the opposite of dominating). Filed as a 1.1.x fix (three-tier threshold copy) with the deeper interpretation work deferred to 2.x.

**Target:** Hero as interpretation, with explicit "vs your average" or "vs last scan" framing.

Same hero structure as Results but tuned for the more comprehensive Dashboard surface. The Dashboard hero benefits more from longitudinal comparisons because the user is in deep-dive mode rather than results-skim mode.

### Who Shapes Your Feed

**Today:** List of creators with post counts. User has to interpret concentration themselves. Empty creator names are a 1.1.x bug filed for separate fix.

**Target:** Concentration read at the top, list as supporting detail, interpretive layer below.

> **Top of tab:** Concentration verdict ("Your top 5 creators produced 30% of your feed, moderately concentrated.") with brief context.
> **List:** Top creators with post and ad counts.
> **Below list:** Why this concentration? Plus a coaching sentence on what to do about it (see case 8 in editorial range).

This is the first place a coaching move lands in the product. It is also where labeling discipline matters most. Coaching that names specific user behavior is only claimable if scan history actually shows the pattern. Otherwise it must be hedged.

### Capture complete (transition screen)

**Today:** Green check, "Capture complete," "34 frames captured," "Analyze frames" CTA.

**Target:** Same calm completion moment, plus a one-line pre-frame of what is about to be analyzed.

> "Analyzing 34 posts for ad density, voice concentration, and tone patterns."

Sets up the user for the interpretation that will land on Results. Costs nothing, builds anticipation.

### Analyzing (90-second wait)

**Today:** Three-step indicator (Frames, Dedupe, Report), progress bar, "Analyzing 8 of 34 frames," ETA.

**Target:** Rotating one-line teases of what is being checked, replacing the cold process detail.

> "Looking for whether a few voices dominate or your feed is balanced..."
> "Checking ad density against typical YouTube ranges..."
> "Mapping which themes the algorithm thinks you want..."

Turns the wait into soft education. Pre-frames the interpretation framework so Results feels expected.

Also: relabel the three-step indicator from Frames / Dedupe / Report (engineering abstractions) to user-facing labels like Reading / Sorting / Summarizing or Capture / Recognize / Analyze.

## Cross-cutting implications

### The product needs an interpretation engine

Current pipeline: capture frames -> extract items -> classify items -> count categories.

Target pipeline: same as above, plus -> generate interpretation candidates -> select best interpretation for hero -> label every interpretation as observed-or-likely -> surface across Results, Dashboard, History.

The selection step is real work. Options range from threshold-based template selection (cheap, deterministic, limited variety) to an LLM call with a tight prompt and a small set of interpretation templates (richer output, requires guardrails).

Pragmatic starting point: threshold-based template selection for 2.0, LLM-driven selection for 2.x where x > 0. The threshold version delivers a meaningful share of the value at a small share of the cost, and it validates whether users find the interpretation layer valuable before committing to LLM infrastructure.

### Unit consistency

The current product uses different units across screens: time (Recording), frames (Capture complete, Analyzing), items (Results), posts (Dashboard). The user has to translate across four units to keep track.

Pick one user-facing unit and use it consistently. "Posts" is the right one because it matches the mental model. "Frames" should be an implementation detail surfaced nowhere on the user-facing flow.

This is a 2.x copy and labeling change, low-risk, high-clarity-impact.

### History and Compare become more valuable

Once the product is generating interpretations, the longitudinal layer becomes a primary value driver. "Your last three YouTube scans all flagged voice concentration. Your top creator has stayed the same across all three" is a finding the user could not get any other way. It is the kind of insight that makes them open the app on day 30 instead of day 3.

Compare today is a single-scan-vs-single-scan diff. Compare in 2.x should also be capable of trend analysis across N scans, with the interpretation layer providing the narrative arc.

### The methodology surface grows in importance

When the product makes interpretive claims, the user has to be able to verify the basis for them. The "About this analysis" screen (currently methodology around scan capture and analysis) needs to expand to include "how we generate interpretations." This is the move that protects against the confident-hallucination risk.

The existing methodology copy ("It is your number, not a universal grade") is some of the best copy in the product. The 2.x methodology surface should extend that voice into the interpretation layer: "These are our best reads based on your scan history. We label what we observed versus what we are inferring. When we are not sure, we say so."

### The brand voice gets more confident, not less calm

The current calm reads as "we will not tell you what to think." Under the 2.x frame, the calm reads as "we will tell you what we see and what we think, and we will be honest about which is which." That is a stronger version of the same brand.

The 1.1.x copy is over-hedged in places ("Mostly neutral" tells the user almost nothing). 2.x can sharpen these reads without breaking the calm positioning. Confidence and calm are not in opposition; cowardice and calm are.

## Risks and failure modes

The 2.x direction has real upside but real risks. Naming them honestly so the design pass can engineer against them.

### Risk 1: Interpretations read as condescending

The coaching frame can tip into paternalism if the voice is wrong. "You should diversify your viewing" comes across as the product telling the user what to do. The mitigation is voice discipline: interpretations describe what the product sees, name likely causes, and offer optional coaching only when the pattern is strong. Coaching is the rarest mode, not the default.

### Risk 2: Users develop dependency on the product's reading

A coaching product can paradoxically reduce user agency by pre-digesting interpretations the user could have reached on their own. This is in real tension with the foundational mission of increasing human agency in AI-mediated environments. The mitigation is keeping the underlying observations always visible alongside interpretations, so the user can verify or disagree. Coaching that teaches the user how feeds work (Move 1: hypothetical specificity) is agency-positive; coaching that just hands the user a conclusion is not. See "Alignment with the agency thesis" below.

### Risk 3: The interpretation layer becomes the most copyable feature

Hard moats in this product space are scarce. The frame-capture and analysis pipeline is hard to replicate. The interpretation layer is comparatively easy for a competitor to copy once it exists. Mitigation: lean on the longitudinal data advantage (per-user scan history compounds into interpretation quality that a new entrant cannot match), and invest in the methodology transparency surface as a trust moat that competitors will not bother to build.

### Risk 4: Multi-platform users find platform-specific interpretations confusing

Comparing YouTube ad density to Instagram ad density is not apples-to-apples. Comparing political content across platforms with different baseline rates is similarly noisy. The mitigation is platform-scoped defaults (most interpretations stay within a single platform's history) with cross-platform comparison treated as a deliberate, labeled mode rather than a default behavior.

### Risk 5: The interpretation engine becomes a maintenance burden

Platform behaviors change. Instagram tweaks its algorithm and the engine's assumptions about ad density typical ranges go stale. The interpretation templates need quarterly review at minimum. The mitigation is treating the interpretation engine as a maintained product surface, not a ship-and-forget feature, and budgeting accordingly.

### Risk 6: The "likely" hedge gets ignored or misread

If users skim the labels and treat all interpretations as fact, the labeling convention fails its job. Mitigation: the visible treatment for "likely" should be persistent and learnable within two scans (italics, color, icon). The methodology surface should include a worked example of an observed-vs-likely pair so users have a reference point.

### Risk 7: Quiet scans feel anticlimactic

Users who get "Your feed has been steady" three scans in a row may stop opening the app. The mitigation is making quiet-scan messaging feel like a positive read rather than a flat report. Quiet patterns are real findings if framed correctly. Editorial range case 5 shows one approach.

## Alignment with the agency thesis

AlgorithmLens exists to increase human agency in AI-mediated environments. The 2.x interpretation layer is in interesting tension with that thesis. Helping users understand their feed increases agency. Pre-digesting interpretations for them could decrease it.

The argument that resolves the tension: coaching that teaches the user how feeds work increases agency over time even when individual interpretations are pre-digested, provided two conditions hold.

**Condition 1: The underlying observations remain visible.** Users can always see the numbers the interpretations are built on. The product is not a black box that hands down verdicts. It is a layer of analysis on top of facts the user can verify.

**Condition 2: The methodology is transparent.** The "About this analysis" surface explains how interpretations are generated, what data they rely on, and where they are uncertain. Users who want to think for themselves have everything they need.

Under those conditions, the interpretation layer functions like a trusted analyst: surfacing patterns the user might miss, offering reads the user can adopt or reject, teaching the user how the underlying system works. This is closer to agency-positive than agency-negative.

The agency-negative version of the same feature would: hide the underlying data, obscure the methodology, prevent the user from disagreeing, and push the user toward platform changes the product profits from. 2.x should structurally avoid all of these.

The brief commits to: visible observations, transparent methodology, no platform pressure, and explicit invitation for the user to disagree (Move 2: question instead of claim). With those commitments, the agency thesis holds.

## Prioritization for 2.x sequencing

Ordered by impact-per-effort if implementation goes one step at a time. The ordering is hypothesis-based, prioritized for "validate the interpretation layer concept cheaply before scaling." Different priorities would emerge from different framings (e.g., engineering-first or user-research-first).

1. **Hero-as-interpretation on Results screen.** Threshold-based template selection. Lowest effort, highest single-screen impact. Validates the interpretation layer concept before committing to deeper infrastructure. Depends on Open Question 1 resolving favorably.

2. **Unit consistency pass.** Replace "frames" with "posts" or "items" across user-facing copy. Trivial implementation, immediate clarity gain. Independent of interpretation work, can ship before or after item 1.

3. **Observed-vs-likely labeling convention.** Pick the visual treatment, apply across Results and Dashboard. Sets up trust architecture for everything that follows. Required before item 4.

4. **Dashboard hero promotion.** Apply the same interpretation-as-hero pattern to Dashboard Overview. Reuses the work from item 1.

5. **Analyzing screen teases.** Rotate one-line interpretation pre-frames during the 90-second wait. Low effort, soft education win.

6. **Who Shapes Your Feed concentration read and coaching sentence.** First place a real coaching move lands in the product. Test how users respond to "what you can do about it" framing. Highest risk for the paternalism failure mode (Risk 1), worth user-testing before broader rollout.

7. **Methodology expansion.** Extend the About screen to cover interpretation methodology. Required before scaling the interpretation layer further. Also required by the agency thesis (Condition 2 above).

8. **Longitudinal interpretation in History and Compare.** Multi-scan trend reads. Highest-leverage but depends on accumulated scan history per user.

9. **LLM-driven interpretation selection.** Replace threshold-based templates with model-generated interpretations. Highest infrastructure cost, requires the trust architecture (items 3 and 7) to be solid first.

Items 1-3 are 2.0. Items 4-7 are 2.1 to 2.3. Items 8-9 are 2.x where x is higher.

## What this brief does not address

- Specific component-level design (typography, color, spacing for the interpretation layer). Belongs in a Claude Design pass after this brief is digested.
- Engineering architecture for the interpretation engine. Belongs in a technical design doc after the product direction is confirmed.
- Data model changes required to support longitudinal interpretation (user-level scan history aggregation, cross-platform averaging, etc.). Belongs in a separate data brief.
- Onboarding implications. The current Onboarding is brand-thesis-driven. 2.x may need an Onboarding addition that teaches users the observed-vs-likely convention.
- Monetization implications. 2.x adds real interpretive value that could shape pricing, paid tiers, or other commercial direction. Out of scope for this product brief.

## Open questions

These are the genuine uncertainties that need user research or prototyping to resolve. They are cross-referenced into the Prioritization section where they bear on specific recommendations.

1. **Does threshold-based template selection deliver enough variety to feel like real interpretation, or do users hit the same templates repeatedly and lose trust?** Bears on prioritization item 1. Needs user testing on a prototype before scaling.

2. **How should the product handle quiet scans where no interpretation is interesting?** Editorial range case 5 shows one approach (frame steadiness as the finding). Bears on Risk 7. Needs validation that this framing feels valuable to users rather than empty.

3. **What is the right cold-start behavior for first-scan users with no longitudinal data?** Editorial range case 6 shows one approach. Level 1 generic interpretations are safe but may set the wrong expectation for what the product delivers at maturity.

4. **How does the interpretation layer interact with multi-platform users?** Bears on Risk 4. Cross-platform averages exist but require careful framing.

5. **Is the observed-vs-likely convention learnable without explicit Onboarding?** Bears on Risk 6 and prioritization item 7. Or does 2.x need a dedicated teaching moment?

6. **How does the coaching mode (Who Shapes Your Feed, prioritization item 6) avoid the paternalism failure mode (Risk 1)?** Voice and frequency are the levers. Needs user testing before broader rollout.

## How to use this brief

The most valuable next step is validation, not implementation.

**Recommended path: cheap validation before scaled investment.**

Two activities in parallel:

1. **User research on the dashboard-to-coach frame.** Talk to 5-10 current AlgorithmLens users. Show them representative examples from the editorial range (cases 1, 3, 4, 8 are the most differentiated from current state). Test whether they find the interpretation layer valuable, whether the observed-vs-likely convention is intuitive, and whether the coaching frame reads as helpful or paternalistic.

2. **Low-fidelity Results-screen prototype.** Build a static prototype of the Results screen with hero-as-interpretation, using 3-4 canned interpretations representing different scan outcomes. Use it as the visual aid for the user research.

Both can happen without committing to the interpretation engine architecture. Combined cost: a week of focused work plus user research time.

After validation, the recommended sequence is the Prioritization list, starting with item 1.

**Alternative path A: direct implementation.** Skip validation, build prioritization items 1-3 as a minimum viable interpretation layer, ship to existing users, learn from telemetry and feedback. Higher risk of building the wrong thing, but faster to market.

**Alternative path B: technical-architecture-first.** Build the interpretation engine infrastructure (LLM integration, template system, observed-vs-likely labeling propagation) before committing to specific surfaces. Lower risk of architectural debt, but defers the product validation that the whole brief depends on.

The recommended path (validation first) is the lowest-cost way to learn whether the brief's framing is right before committing to infrastructure that depends on it.

## When this brief is superseded

This brief is a framing document, not a spec. It will be partially superseded as 2.x work proceeds.

- **Design specs** supersede the Per-surface implications and editorial range sections.
- **Technical specs** supersede the interpretation engine architecture notes.
- **Shipped features** supersede the prioritization items as they land.
- **User research findings** supersede the open questions as they are answered.
- **Updated data infrastructure** supersedes the Level 1/2/3 cause attribution analysis if the data the product can access materially changes.

The brief retains value as a framing document and as a record of the strategic thinking behind the 2.x direction. It should not be treated as a spec once design and engineering work begins.

This brief should be reviewed for staleness every six months. If the product has shipped substantial 2.x work, large parts of this brief may be archivable.
