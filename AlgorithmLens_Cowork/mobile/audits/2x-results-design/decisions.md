# 2.x Results screen: design decisions

Captured from Claude Design exploration during the 1.1.x TestFlight live-with period (May 2026). This document is the design specification for the 2.x Results screen. Implementation has not started.

## Status

Design v2 approved as direction. Implementation deferred to a future cycle. The interpretation engine that would generate the strings rendered in these mockups does not yet exist.

Strategic context lives at `mobile/audits/algorithmlens-2x-interpretation-layer-brief.md`.

## What was produced

Two Claude Design passes:

- **v1**: Four iPhone Pro mockups (Outcomes A, B, C, D) plus an Observed-vs-Likely treatment comparison row plus a written decisions card.
- **v2**: Four iPhone Pro mockups with three-beat sub-line escalation plus a Coaching treatment comparison row plus an updated decisions card.

Both versions exist as static high-fidelity mockups in the originating Claude Design conversation. Screenshots are not committed to this repo (yet). The markdown below captures the durable design decisions.

## The structural design

### Screen anatomy, top to bottom

1. **Status bar and platform header** (e.g., "YouTube" with back chevron). Standard navigation chrome.
2. **Meta-line** (v2 only): "ANALYZED · 49 POSTS · 1:26 SESSION" in tertiary gray micro size, prefixed with three small brand-blue progress segments reading as a completed progress bar. Same register as the footer disclosure. Drops to null on dense outcomes (e.g., Outcome D has `meta: null`).
3. **Verdict eyebrow**: "VERDICT · TODAY" in brand-blue with a 2px brand-blue rule above the title.
4. **Hero verdict**: 30/36 near-black, set tight at -0.02em with `text-wrap: balance`. Replaces the 1.1.x 64pt brand-blue item count.
5. **Sub-line zone**: three-beat escalation per outcome. See sub-line modes below.
6. **Supporting card**: bg-secondary fill (#F7F7F8). Four rows (Ads, Patterns, Political, Tone). Each row carries a 2-4 word comparative anchor in tertiary gray after the value. "FROM THIS SCAN" eyebrow.
7. **Primary CTA**: "View full dashboard" brand-blue button.
8. **Footer disclosure**: Shield icon plus "Frames are analyzed by Google's Gemini..." caption.

### Sub-line modes (the four-mode interpretation system)

Every sub-line in the zone between hero and supporting card uses one of four modes. Each has its own visual treatment.

**OBSERVED**: Filled brand-blue square marker, uppercase "OBSERVED" label, body text in near-black. Used for direct measurements ("Your top creator made up 32% of what you saw").

**LIKELY**: Hollow gray ring marker, uppercase "LIKELY" label, body text in near-black. Used for inferred causes or hypotheses ("Sustained engagement with their videos in recent weeks is the most likely reason").

**SOMETHING TO TRY (Coaching)**: Right-pointing arrow marker in brand-blue, uppercase "SOMETHING TO TRY" label, body text in near-black. Used for optional behavioral suggestions when the pattern warrants action ("To diversify, try opening videos from search or subscriptions"). Voice must be permissive ("try," "could," "if you want to"), never imperative.

**A QUESTION FOR YOU**: Italic body text with a thin brand-blue left rule, uppercase "A QUESTION FOR YOU" eyebrow. Used when the product has detected a shift but doesn't have enough information to confidently attribute cause. The visual is intentionally a different shape, not a third label color.

### Sub-line zone rhythm

Adaptive vertical gaps:
- 12px gap when next sub-line is the same mode
- 22px gap when crossing modes (Observed → Likely → Coaching)
- 24px gap before a Question (most distinct mode)

No hairline rules between modes. Whitespace and marker change do the work. Hairlines were tested and fought the brand's subtractive surface.

### Comparative anchors on the supporting card

Each row carries a 2-4 word anchor in tertiary gray after the value, separated by a middot:

- "12% of feed · typical"
- "24% of feed · 2.2× your typical"
- "Top: News · new pattern"
- "Tone: Mostly negative · shift from neutral"

The anchor is conditional on history. First scans on a new platform have no history to anchor against. Recommended behavior: omit the anchor entirely on first scans (calmer than a placeholder like "first read"). The component accepts both `anchor: undefined` (omit) and `anchor: "first read"` (show).

## The four worked example outcomes

These are the strings the interpretation engine should produce for the canonical example outcomes. Voice and structure are normative; specific numbers are illustrative.

### Outcome A: Concentrated YouTube feed

**Underlying data:** top creator 32%, top three 58%, ad density 12%, no political content.

- **Verdict:** A few voices are shaping your YouTube feed.
- **OBSERVED:** Your top creator made up 32% of what you saw, and the top three made up 58%.
- **LIKELY:** Sustained engagement signals strong interest, and the algorithm responds to that strongly.
  - (Original v2 string was "Sustained engagement with their videos in recent weeks is the most likely reason. The algorithm reads that as confidence." This was flagged as borderline anthropomorphic; the tighter alternative above was adopted to avoid ascribing mental states like "confidence" to the algorithm. Brand thesis is AI transparency; honest language about how algorithms actually behave matters.)
- **SOMETHING TO TRY:** To diversify, try opening videos from search or subscriptions for a few sessions rather than the recommended feed.

**Supporting card:**
- Ads: 12% of feed · typical
- Patterns: Top: Tech · same as last 4 scans
- Political: None detected · usual for this feed
- Tone: Mostly neutral · steady

### Outcome B: Broadly sourced YouTube feed

**Underlying data:** top source 4%, no dominant category, ad density 9%.

- **Verdict:** Your YouTube feed leans balanced today.
- **OBSERVED:** Your top source contributed only 4%. Nothing dominated.
- **LIKELY:** The algorithm is sampling broadly from your watch history rather than narrowing in on one signal.

**Supporting card:**
- Ads: 9% of feed · lower than typical
- Patterns: Top: Entertainment · varied mix
- Political: None detected · usual for this feed
- Tone: Mostly neutral · steady

### Outcome C: Heavy ad load

**Underlying data:** ad density 24%, user's running average 11%.

- **Verdict:** Unusually ad‑heavy today. (Note: non-breaking hyphen U+2011 between "ad" and "heavy" so the verdict single-lines. Engine should emit U+2011 or a CSS rule scoped to verdicts should handle word-break.)
- **OBSERVED:** Ads made up 24% of your feed, more than double your typical 11%.
- **LIKELY:** Could be a YouTube campaign rotation, or the algorithm reading recent activity as commercial intent.
- **SOMETHING TO TRY:** If this keeps happening, check whether you've been searching or clicking on shopping-adjacent content recently.

**Supporting card:**
- Ads: 24% of feed · 2.2× your typical
- Patterns: Top: Sports · recurring
- Political: None detected · usual for this feed
- Tone: Mostly neutral · steady

### Outcome D: Political shift over time

**Underlying data:** political content was 3-5% in first four scans, jumped to 18% in current scan.

- **Verdict:** Politics climbed sharply in your feed.
- **OBSERVED:** Political content hit 18% this scan, up from 3-5% across your previous four.
- **LIKELY:** The algorithm responds to recent activity more than historical patterns, so whatever shifted is probably recent.
- **A QUESTION FOR YOU:** Have you been engaging more with political content lately, or does this feel like it came out of nowhere?

**Supporting card:**
- Ads: 11% of feed · typical
- Patterns: Top: News · new pattern
- Political: 18% detected · sharp increase
- Tone: Mostly negative · shift from neutral

(Meta-line: `meta: null` because the question-question is a 3-line italic, which is the densest configuration this surface produces.)

## Voice discipline

The 2.x voice must hold across the heavier interpretive load. Specifically:

- Declarative without being clinical
- Hedged where appropriate ("likely," "could be," "probably") without being mushy
- Specific where possible (a number, a percentage, a comparison) but not number-dense
- Calm in register; no exclamation marks, no all-caps, no gamification language
- Confident without being preachy
- Coaching beat permissive ("try," "could," "if you want to"), never imperative ("you should," "do this")
- No anthropomorphism of the algorithm. Algorithms respond to signals; they don't "decide," "feel confident," "want," or "prefer." The verb "reads" was used in early drafts and is borderline; subsequent revisions prefer "responds to" or similar mechanism-language.

## Design tradeoffs considered and rejected

- **Two-tier (italic body, no marker) for observed-vs-likely.** Calmer but too easy to skim past. The foundation of trust for the interpretation layer has to be glanceable, so the marker convention wins despite the small chrome tax.
- **Full-bleed bg-secondary band for the Coaching mode.** Would promote coaching to verdict-tier weight, double-anchoring the screen. Inline marker keeps coaching as one mode of sub-line interpretation rather than a separate UI tier.
- **Hairline rules between sub-line modes.** Fought the brand's subtractive surface. Whitespace and markers do the work.
- **Three-tier label system (Observed / Inferred / Speculative).** Adds decision fatigue. Two tiers with hedge language inside "Likely" carries the uncertainty gradient.
- **Color shift for hero verdict.** Considered but rejected; near-black with weight does enough.
- **Two-typeface system (serif verdict, sans body).** Crosses the line from "calm and considered" into "publication design." System font discipline holds.

## Engineering implications captured during design

These are notes for the eventual interpretation engine and UI implementation.

- **U+2011 non-breaking hyphen** needs to be emitted by the engine for verdicts containing compound words like "ad-heavy." Alternative: a CSS rule scoped to verdict text that handles word-break, but engine-side is preferred (more portable, less brittle).
- **Comparative anchors are conditional** on the user having scan history for that platform. Engine should omit the anchor when no comparison is possible. Component supports both `anchor: undefined` (omit) and `anchor: "first read"` (show as text). Recommended: omit on first scans.
- **The meta-line is the first thing to drop** when an outcome runs dense. Outcome D drops it because the third beat is a 3-line italic question. Component accepts `meta: null`.
- **Sub-line modes are stateful.** A single Results screen may have 1-4 sub-lines across 1-4 modes. The renderer needs to handle variable sub-line zones with adaptive rhythm (12/22/24px gaps depending on mode transitions).
- **First-party engagement signal capture.** The QUESTION mode (Outcome D) is structurally a request for user input. v2 design has no response affordances yet, but the layout pre-bakes the possibility of response so a future version can grow them without breaking the layout. The engagement signal captured here could feed back into future interpretation quality.

## Carry-forward to other surfaces

This Results screen is the first surface to receive the 2.x interpretation pattern. The pattern should extend to:

- **Dashboard Overview**: hero-as-interpretation with "vs your average" or "vs last scan" framing
- **Who Shapes Your Feed**: concentration verdict at the top, supporting list, optional coaching beat below
- **Analyzing screen (within Scan flow)**: rotating one-line interpretation pre-frames during the 90-second wait
- **About this analysis**: methodology expansion to cover how interpretations are generated and labeled
- **Capture complete (within Scan flow)**: optional pre-frame of what's about to be analyzed

The four-mode sub-line system (OBSERVED / LIKELY / SOMETHING TO TRY / A QUESTION FOR YOU) is the design system primitive that should propagate to every surface that does interpretation.

## Open questions for future work

1. **Implementation of the interpretation engine itself.** This document specifies what the engine should produce, not how. The engine is real work — threshold-based template selection for 2.0, possibly LLM-driven selection for later. See strategic brief.

2. **The OBSERVED label appears only on direct measurements.** Most current scans will have a mix of one OBSERVED sub-line (the raw fact) and one LIKELY sub-line (the inference). The engine needs to consistently produce this pairing.

3. **Coaching frequency calibration.** Coaching beat should appear only when the pattern warrants it. Too frequent and the product feels preachy. Too rare and the value isn't delivered. Threshold to be determined.

4. **First-scan behavior.** First scans on a new platform have no history. Outcome B and Outcome F (not designed) represent this. Anchors get omitted; LIKELY claims should be more conservative (Level 1 generic interpretations rather than Level 2 pattern-based ones).

5. **Dark mode.** Out of scope for v1/v2 design pass. Will need its own pass.

## Source of truth

For visual reference, the Claude Design conversation that produced v1 and v2 contains:
- v1 mockups (four iPhone Pro outcomes)
- v1 Observed-vs-Likely treatment comparison
- v1 decisions card
- v2 mockups (four iPhone Pro outcomes with three-beat escalation)
- v2 Coaching treatment comparison
- v2 decisions card

Until those screenshots are committed to this repo, the Claude Design conversation is the canonical visual source. This document is the textual source of truth for the design decisions.
