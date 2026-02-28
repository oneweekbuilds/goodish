# AlgorithmLens — Copy Audit Report

**Date:** February 15, 2026
**Scope:** All user-facing text in the AlgorithmLens codebase
**Standard:** Epistemic Restraint Language Guide (v0.1.0)
**Files scanned:** 82 (all .jsx, .js, and .html files containing user-facing text)

---

## Summary

| Category | Count |
|---|---|
| **Clear Violations** | 31 |
| **Borderline — Worth Reviewing** | 8 |
| **Positive Examples** | 6 |

The dashboard tabs and data-presentation components are generally well-written — they describe observable feed composition with appropriate disclaimers. The violations are concentrated in two areas: (1) the **landing page and marketing sections** (Hero, HowItWorks, SectionTracking, SectionLoop, LabelsPreview, HeroDashboardPreview), which use sensational and intent-implying language to sell the product, and (2) the **"Talk to Your Algorithm" feature naming and descriptions**, which personify the algorithm and imply targeting. Fixing the landing page copy is the highest-impact change since every visitor sees it.

---

## Clear Violations

---

### V1. "Algorithms track everything you do."
**File:** `src/components/Sections/SectionTracking.jsx`, line 27
**Type:** Section heading
**Rule broken:** Sensational framing. "Everything" is hyperbolic. "Track" implies deliberate surveillance intent.
**Why it matters:** This is a heading that sets the tone for an entire section. It frames platforms as adversarial surveillance systems, which is an editorial judgment — not a description of observable data.

**Suggested replacement:**
> "What your activity signals"

---

### V2. "Every scroll is a signal. Your interactions are meticulously logged to build a digital model of your psyche."
**File:** `src/components/Sections/SectionTracking.jsx`, line 36
**Type:** Section description
**Rule broken:** Sensational framing ("meticulously logged," "digital model of your psyche"). Implies intent ("to build"). "Psyche" is loaded and unverifiable.
**Why it matters:** This tells users they're being psychologically profiled, which is an accusation the product can't substantiate. It also tells users how to feel (alarmed).

**Suggested replacement:**
> "Social media platforms collect interaction data — scrolls, pauses, taps, and likes. This data can influence what appears in your feed."

---

### V3. "Algorithms learn who you are from your actions"
**File:** `src/components/Sections/SectionTracking.jsx`, line 52
**Type:** Left section description
**Rule broken:** Intent-implying ("learn who you are"). Implies algorithms have understanding or knowledge of identity.
**Why it matters:** Anthropomorphizes algorithms and implies they understand users as people.

**Suggested replacement:**
> "Your feed reflects patterns in your activity"

---

### V4. "Key takeaways algorithms gather from your behavior"
**File:** `src/components/Sections/SectionTracking.jsx`, line 94
**Type:** Right section heading
**Rule broken:** Intent-implying ("gather"). Implies deliberate collection with purpose.

**Suggested replacement:**
> "Signals that may influence your feed"

---

### V5–V9. Signal interpretation text implies algorithmic intent
**File:** `src/components/Sections/SectionTracking.jsx`, lines 102, 111, 120, 129, 138
**Type:** Signal interpretation descriptions
**Texts:**
- Line 102: "Show more self-improvement and routine-building content."
- Line 111: "Increase political content with similar viewpoints."
- Line 120: "Show additional beauty, lifestyle, and product-focused content."
- Line 129: "Increase emotional-support and anxiety-related content."
- Line 138: "Recommend more relationship, dating, and attachment-related content."

**Rule broken:** All five present algorithmic decisions as known facts. These are phrased as commands the algorithm executes, implying we know the algorithm's logic.
**Why it matters:** AlgorithmLens cannot know what any platform's algorithm will do with a given signal. Presenting these as definitive outcomes is speculative.

**Suggested replacements:**
- "Self-improvement and routine content may appear more often."
- "Political content with similar viewpoints may appear more often."
- "Beauty, lifestyle, and product content may appear more often."
- "Emotional-support and anxiety-related content may appear more often."
- "Relationship and dating content may appear more often."

---

### V10. "We reveal the patterns algorithms use so you can act with intention, not autopilot."
**File:** `src/components/Sections/HowItWorksSection.jsx`, line 11
**Type:** Section description
**Rule broken:** "Reveal" is banned sensational language. "Patterns algorithms use" implies intent. "Autopilot" implies users are passive victims.
**Why it matters:** This is marketing copy on the landing page. It frames the product as exposing hidden truths, which contradicts the core principle of calm, measured description.

**Suggested replacement:**
> "We document your feed composition so you can make more informed choices about how you use social media."

---

### V11. "Our models identify the clusters you've been placed in."
**File:** `src/components/Sections/HowItWorksSection.jsx`, line 26
**Type:** Step description ("Detect Patterns")
**Rule broken:** "Placed in" implies the algorithm deliberately categorized the user. AlgorithmLens does not know what clusters platforms use internally.
**Why it matters:** Claims knowledge of platform internals that the product doesn't have.

**Suggested replacement:**
> "Our analysis identifies patterns in the content that appeared in your feed."

---

### V12. "Every tap, scroll, and pause teaches the algorithm."
**File:** `src/components/Sections/SectionLoop.jsx`, line 34
**Type:** Loop card description
**Rule broken:** "Teaches the algorithm" implies algorithmic agency and learning intent. Anthropomorphizes the system.

**Suggested replacement:**
> "Taps, scrolls, and pauses are interaction data that platforms collect."

---

### V13. "A cycle where your behavior trains the model, which refines the content, which shapes your behavior."
**File:** `src/components/Sections/SectionLoop.jsx`, line 12
**Type:** Section description
**Rule broken:** "Trains the model" and "shapes your behavior" both imply causal intent. "Shapes your behavior" is an unverifiable claim about user psychology.

**Suggested replacement:**
> "A pattern where your interactions may influence what content appears, and what appears may influence your interactions."

---

### V14. "Your worldview shifts" / "Exposure shapes your beliefs, interests, and habits."
**File:** `src/components/Sections/SectionLoop.jsx`, lines 63–64
**Type:** Loop card title and description
**Rule broken:** "Shapes your beliefs" is a causal psychological claim. The product describes feed composition, not psychological effects.
**Why it matters:** Claims the product can demonstrate psychological influence, which it cannot.

**Suggested replacement:**
> Title: "Your media diet evolves"
> Description: "Over time, feed composition may reflect and reinforce the topics you engage with most."

---

### V15. "Algorithms assign inferred labels to you."
**File:** `src/components/Sections/LabelsPreviewSection.jsx`, line 15
**Type:** Section heading
**Rule broken:** States as definitive fact. We don't know what labels platforms assign, or even if they use "labels" at all.

**Suggested replacement:**
> "Your feed may reflect inferred categories"

---

### V16. "From thousands of signals, algorithms categorize you into clusters."
**File:** `src/components/Sections/LabelsPreviewSection.jsx`, line 17
**Type:** Section description
**Rule broken:** Asserts internal platform behavior as fact. We cannot verify "thousands of signals" or that "clusters" are used.

**Suggested replacement:**
> "Platforms use interaction data to determine what content to show. The patterns in your feed may reflect how your activity has been interpreted."

---

### V17. "AlgorithmLens breaks the cycle."
**File:** `src/components/Hero/HeroDashboardPreview.jsx`, line 129
**Type:** Section heading
**Rule broken:** Sensational framing. Implies a malicious "cycle" and positions the product as a savior. This is exactly the kind of narrative the epistemic restraint standard is designed to avoid.

**Suggested replacement:**
> "AlgorithmLens shows you what's in your feed."

---

### V18. "The algorithm assumes he thrives on pressure."
**File:** `src/components/Hero/HeroDashboardPreview.jsx`, line 12
**Type:** Profile story text (Jordan M.)
**Rule broken:** "The algorithm assumes" is banned language (variant of "the algorithm wants/is trying to"). Claims to know what the algorithm "thinks."

**Suggested replacement:**
> "His feed increasingly features pressure-related content."

---

### V19–V22. Profile story texts imply algorithmic intent
**File:** `src/components/Hero/HeroDashboardPreview.jsx`
**Texts:**
- Line 24: "The feed reinforces pressure" — "reinforces" implies intent
- Line 35: "The app misreads this as perfectionism." — claims to know the algorithm's interpretation
- Line 72: "Alexandra watches emotional videos in bed; the algorithm amplifies intensity." — "amplifies" implies deliberate action
- Line 88: "Luis taps tech, sneakers, and gadgets 'just to look.' The app sees buying potential." — "The app sees" anthropomorphizes the algorithm

**Rule broken:** All four use intent-implying language, attributing understanding, goals, or deliberate actions to the algorithm.

**Suggested replacements:**
- "Pressure-related content continued to appear."
- "Her feed increasingly features extreme wellness content."
- "Emotional and high-intensity content continued to appear."
- "Shopping and product content increasingly appeared in his feed."

---

### V23. "Go beyond the surface. Understand how your digital world really works."
**File:** `src/components/PricingPage.jsx`, line 110
**Type:** Premium plan description
**Rule broken:** "Really works" implies hidden truth being uncovered. Close to "the truth about your feed" (banned). Sensational framing.

**Suggested replacement:**
> "See your feed in more detail. Compare platforms, track changes, and spot patterns over time."

---

### V24. "Reveal brand & influencer influence"
**File:** `src/components/PricingPage.jsx`, line 133
**Type:** Premium feature bullet
**Rule broken:** "Reveal" is banned sensational language. "Influence" used in a way that implies hidden manipulation.

**Suggested replacement:**
> "See which brands and creators appear most in your feed"

---

### V25. "We'll show you what the algorithm thinks about you."
**File:** `src/pages/ScanPage.jsx`, lines 163–164
**Type:** Page description
**Rule broken:** "What the algorithm thinks about you" directly anthropomorphizes the algorithm and implies it has thoughts/opinions about users. Variant of banned "the algorithm wants."

**Suggested replacement:**
> "We'll show you what appeared in your feed and how it breaks down by topic, tone, and source."

---

### V26. "Explore what your ad data reveals about how you're being targeted."
**File:** `src/components/dashboard/AdsTalkToAlgorithm.jsx`, line 229
**Type:** Feature subtitle
**Rule broken:** "Targeted" is banned ("targeting you"). "Reveals" is banned sensational language.

**Suggested replacement:**
> "Ask questions about the ad content that appeared in your feed."

---

### V27. "Talk to Your Algorithm" (feature name)
**File:** `src/components/dashboard/AdsTalkToAlgorithm.jsx`, line 123 (and multiple other TalkToAlgorithm files)
**Type:** Feature heading
**Rule broken:** "Your Algorithm" personifies and possesses the algorithm. Implies users have a personal algorithm with agency.
**Why it matters:** This is a feature name that appears on every dashboard tab. It frames the entire conversation feature around an entity ("your algorithm") rather than around data.

**Suggested replacement:**
> "Ask About This Scan" (already used in TalkToAlgorithmSection.jsx — adopt it consistently)

---

### V28. "The algorithm is actively introducing you to new voices beyond your follows."
**File:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`, line 427
**Type:** Insight text (high novelty)
**Rule broken:** "Actively introducing" implies deliberate intent and agency. "The algorithm is" is a variant of banned "the algorithm wants/is trying to."

**Suggested replacement:**
> "Most suggested content came from creators you don't follow — your feed included a high proportion of new voices."

---

### V29. "Topics the algorithm favors"
**File:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`, line 539
**Type:** Section heading
**Rule broken:** "Favors" implies the algorithm has preferences and intent.

**Suggested replacement:**
> "Most common topics in suggested content"

---

### V30. "What the system is reinforcing" / "How the algorithm appears to be reading your signals"
**File:** `src/pages/dashboard/DashboardPage.jsx`, lines 438–445
**Type:** Story header titles and subtexts
**Rule broken:** "Reinforcing" implies deliberate intent. "Reading your signals" implies the algorithm understands and interprets user behavior with purpose.

**Suggested replacements:**
- Line 438: "Content patterns during this window"
- Line 440: "What content appeared based on your recent activity."
- Line 444: "Recurring themes"
- Line 445: "Themes that appeared repeatedly across your scans."

---

### V31. "Understand how and why it changes over time."
**File:** `src/pages/plus/PlusPage.jsx`, line 175
**Type:** Plus plan feature description
**Rule broken:** "Why" implies the product can explain causal reasons for feed changes. The product's core principle is to describe what appeared, not explain why.

**Suggested replacement:**
> "See what changed between scans over time."

---

## Borderline — Worth Reviewing

---

### B1. "We'll help you understand what the algorithm shows you."
**File:** `src/pages/StartPage.jsx`, lines 91–93
**Type:** Page description
**Note:** "What the algorithm shows you" uses the platform's own terminology and is more neutral than "thinks about you." However, it still slightly implies algorithmic agency. Could be tightened.

**Possible alternative:**
> "We'll show you what appeared in your feed and how it breaks down."

---

### B2. "These patterns suggest what the algorithm may be prioritizing based on recent activity"
**File:** `src/pages/dashboard/tabs/PatternsTab.jsx`, line 264
**Type:** Explanation text
**Note:** "May be prioritizing" uses a hedge ("may be") which softens it. Still implies the algorithm has priorities. The "not a fixed preference or identity" qualifier is good. Borderline acceptable.

**Possible alternative:**
> "These patterns may reflect recent activity, not a fixed preference or identity."

---

### B3. "content the algorithm suggests for you"
**File:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`, line 284
**Type:** Coming soon description
**Note:** "Suggests" is the actual platform feature name (e.g., "Suggested for you"). Using platform terminology is generally acceptable, but "for you" adds a targeting dimension.

**Possible alternative:**
> "content labeled as suggested by the platform"

---

### B4. "The algorithm mostly recommends creators you already follow."
**File:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`, line 430
**Type:** Insight text (low novelty)
**Note:** "Recommends" is a standard platform term. Still slightly anthropomorphizes. The insight itself is fine.

**Possible alternative:**
> "Most suggested content came from creators you already follow."

---

### B5. "No ads were detected in this scan. This may indicate limited feed variety."
**File:** `src/components/ScanWarnings.jsx`, line 36
**Type:** Warning message
**Note:** "Limited feed variety" is a judgment about the user's feed that goes beyond observable data. The product scanned and found no ads — that's the fact. Interpreting this as "limited variety" adds editorial judgment.

**Possible alternative:**
> "No ads were detected in this scan."

---

### B6. "understand the patterns in your algorithm"
**File:** `src/components/results/PostScanUpsell.jsx`, line 21–23
**Type:** Upsell copy
**Note:** "Your algorithm" personifies and possesses the algorithm. Same pattern as V27 but in a lower-traffic location.

**Possible alternative:**
> "understand the patterns in your feed"

---

### B7. "Securely link your accounts to generate your algorithmic profile."
**File:** `src/components/FeedConnect/FeedConnect.jsx`, line 31
**Type:** Feature description
**Note:** "Algorithmic profile" implies the product generates a profile that represents how algorithms see the user. The product actually shows feed composition, not a "profile." This may also set inaccurate user expectations.

**Possible alternative:**
> "Securely link your accounts to analyze your feed composition."

---

### B8. "See your inferred digital profile and decide what to do with it."
**File:** `src/components/Sections/HowItWorksSection.jsx`, line 33
**Type:** Step description
**Note:** Same issue as B7 — "inferred digital profile" implies AlgorithmLens generates a profile of the user, but the product shows feed composition data. Sets expectations the product may not meet.

**Possible alternative:**
> "See your feed breakdown and decide what, if anything, you'd like to change."

---

## Positive Examples

These are instances where the copy does an especially good job of following epistemic restraint. They can serve as models for rewriting the violations above.

---

### P1. "Answers are based only on this scan's evidence. We cannot know why content appeared or what you prefer."
**File:** `src/components/dashboard/TalkToAlgorithmSection.jsx`, lines 508–509
**Why it's good:** Explicitly acknowledges the limits of the product's knowledge. States what it cannot do. This is the gold standard for epistemic restraint.

---

### P2. "Categorized based on stance keywords found in post text. This is approximate and may not capture nuance."
**File:** `src/pages/dashboard/tabs/PoliticsTab.jsx`, line 281
**Why it's good:** Explains the methodology, acknowledges it's approximate, and flags that it may miss things. Perfect transparency.

---

### P3. "Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented."
**File:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`, line 677
**Why it's good:** Attributes claims to what platforms say ("describe"), hedges appropriately ("often"), and explicitly notes the limits of public knowledge. Exactly the right way to discuss platform behavior.

---

### P4. "The following are common factors that can influence feeds. They may or may not apply here."
**File:** `src/components/dashboard/TrendsPanel.jsx`, line 327
**Why it's good:** Presents information as possibilities, not certainties. "May or may not apply" is an honest framing that avoids false precision.

---

### P5. "Your feed contained 34% suggested content" / "Ad content made up 8% of posts."
**File:** `src/pages/dashboard/tabs/OverviewTab.jsx`, lines 39–68
**Why it's good:** Pure observable description. States what percentage appeared. No judgment, no intent-implying language, no sensationalism. This is the model for all feed composition text.

---

### P6. "This insight is based on repeated patterns, not confirmed intent."
**File:** `src/components/dashboard/ViewCard.jsx`, line 1298
**Why it's good:** Explicitly distinguishes between pattern observation and intent claims. Reminds users that correlation is not causation.

---

## Files Scanned

**Dashboard Tabs (7):** OverviewTab.jsx, AdsTab.jsx, PoliticsTab.jsx, ToneTab.jsx, SourcesTab.jsx, SuggestedVsFollowedTab.jsx, PatternsTab.jsx

**Dashboard Components (22):** TalkToAlgorithmSection.jsx, AdsTalkToAlgorithm.jsx, CreatorsTalkToAlgorithm.jsx, InferencesTalkToAlgorithm.jsx, PatternsTalkToAlgorithm.jsx, PoliticsTalkToAlgorithm.jsx, AdsEvidenceAnalysis.jsx, InsightHero.jsx, EmptyState.jsx, TrendsCTA.jsx, TrendsPanel.jsx, TrendsStubPanel.jsx, ConfidenceBadge.jsx, SectionHeader.jsx, ViewCard.jsx, ExperimentSuggestionCard.jsx, ConcentrationSummary.jsx, ToplineMetricCard.jsx, DenominatorLine.jsx, MasterNumbersLine.jsx, MiniCalculator.jsx, CompositionBar100WithCounts.jsx

**Dashboard Charts (6):** BarChartSimple.jsx, BigNumber.jsx, InsightCard.jsx, LineChartSimple.jsx, SimpleTable.jsx, StackedBar100.jsx, StatusCard.jsx

**Landing Page & Marketing (12):** Hero.jsx, HeroSection.jsx, HeroDashboardPreview.jsx, HowItWorksSection.jsx, LabelsPreviewSection.jsx, SectionLoop.jsx, SectionTracking.jsx, ConnectFeedsSection.jsx, FeedConnect.jsx, InsightCardsRow.jsx, BentoGrid.jsx, DigitalTwinGrid.jsx

**Onboarding & Auth (4):** OnboardingModal.jsx, SignInPrompt.jsx, ResultsGate.jsx, AuthCallbackPage.jsx

**Pricing & Plans (6):** PricingPage.jsx, PlusPage.jsx, PaywallModal.jsx, UpgradeCTA.jsx, LockedOverlayCard.jsx, PlanBadge.jsx

**Scan Flow (5):** ScanPage.jsx, ScanPlatformPage.jsx, ProcessingPage.jsx, StartPage.jsx, ScanTestPage.jsx

**Results & History (4):** ResultsPage.jsx, HistoryPage.jsx, ScanHistoryPage.jsx, PostScanUpsell.jsx

**Utilities & Shared (11):** ErrorBoundary.jsx, ComingSoonBanner.jsx, WaitlistSignup.jsx, Navbar.jsx, ScanWarnings.jsx, PostItem.jsx, MetricCard.jsx, NotFoundPage.jsx, errorMessages.js, insightBuilders.js, headlineSafety.js

**Other (5):** DashboardPage.jsx, DebugPanel.jsx, DashboardSkeleton.jsx, BackLink.jsx, demoData.js

---

*This audit was performed against the Epistemic Restraint Language Guide v0.1.0. All examples use synthetic/hypothetical content. No actual user feed data was reviewed.*
