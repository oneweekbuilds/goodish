# AlgorithmLens Accuracy Contract

> **Version:** 2.0
> **Last Updated:** 2025-12-17
> **Scope:** All dashboard analysis text, all charts/metrics, and the "Talk to Your Algorithm" feature

---

## Core Principle

**"These insights show patterns in what you're shown — not who you are."**

AlgorithmLens analyzes what content appears in a user's social feed. It does NOT:
- Know what the user believes, thinks, or feels
- Know why the algorithm chose specific content
- Have access to the platform's internal ranking signals
- Represent the user's full digital experience
- Know user intent, preferences, or desires
- Know platform motivations or goals

All analysis must operate within these epistemic boundaries.

---

## Single-Scan vs Multi-Scan Constraints

### Single-Scan Reality

**Most users have only ONE scan.** All language must assume single-scan data unless explicitly aggregated.

| Data Type | Single Scan | Multiple Scans |
|-----------|-------------|----------------|
| Percentages | Must be labeled "approximate" or "~" | May show without qualifier if N≥30 items |
| Trends | FORBIDDEN - cannot show | Allowed with ≥3 data points |
| "Your feed is..." | FORBIDDEN | Use "Across your scans..." |
| Predictions | FORBIDDEN | Labeled as speculation only |
| Pattern claims | "In this scan..." only | "Across your [N] scans..." |

### Single-Scan Required Language

When data comes from a single scan:
- "In this scan, approximately X% of items..."
- "This snapshot shows..."
- "From this scroll session..."
- "~X out of Y items in this scan..."

### Single-Scan Forbidden Language

Never use with single-scan data:
- "Your feed is..." (implies permanence)
- "The algorithm thinks..." (implies knowledge of internal state)
- "You're interested in..." (infers user preference from exposure)
- "This pattern..." (implies repetition not yet observed)
- "Consistently..." or "always..." (requires multiple observations)
- "Will continue to..." (prediction from single sample)

---

## 1. Legitimate vs Illegitimate Claims

### 1.1 Legitimate Claims (ALLOWED)

Claims grounded in directly observable evidence from the captured feed scan:

| Claim Type | Example | Why Legitimate |
|------------|---------|----------------|
| Content counts | "In this scan, 12 of 47 posts contained political content" | Directly countable |
| Topic presence | "News about climate appeared 3 times in this sample" | Observable in data |
| Relative frequency | "Health topics appeared more often than finance topics" | Comparative counts |
| Temporal patterns | "Most political content appeared in the first half of this scroll session" | Timestamp-ordered observation |
| Engagement indicators | "Posts with high comment counts appeared earlier in the feed" | Observable metadata |
| Source diversity | "Content came from 8 different accounts in this scan" | Countable sources |
| Format distribution | "Video content made up 40% of this sample" | Observable format types |

### 1.2 Illegitimate Claims (FORBIDDEN)

Claims that exceed what the data can support:

| Claim Type | Forbidden Example | Why Illegitimate |
|------------|-------------------|------------------|
| Identity claims | "You are interested in conspiracy theories" | Cannot infer user identity from feed |
| Belief attribution | "You believe climate change is a hoax" | Cannot read user's mind |
| Algorithmic intent | "The algorithm wants you to be angry" | Cannot know platform's intent |
| Strong causation | "This content caused you to feel anxious" | Cannot measure user emotional state |
| Prediction certainty | "You will see more of this content" | Cannot predict future feed behavior |
| User behavior claims | "You engage most with political content" | Scan doesn't capture user behavior |
| Platform motivation | "Facebook is trying to radicalize you" | Cannot know internal motivations |
| Psychological diagnosis | "Your feed shows signs of filter bubble anxiety" | Not qualified, not observable |

### 1.3 Decision Rule

Before generating any claim, ask:
1. **Is this directly observable in the captured data?** If no, do not claim it.
2. **Does this require knowing the user's internal state?** If yes, do not claim it.
3. **Does this require knowing platform internals?** If yes, do not claim it.
4. **Can I point to specific evidence bundle fields?** If no, do not claim it.

---

## 2. Language Rules

### 2.1 Required Anchoring Phrases

**Every analytical statement MUST begin with a temporal/scope anchor.**

| Context | Required Anchors |
|---------|------------------|
| Single scan | "In this scan," / "In this captured sample," / "In this snapshot," |
| Time window | "In this time window," / "During this scroll session," / "In these [N] minutes," |
| Comparative | "Compared to your previous scan," / "Relative to last week's sample," |
| Aggregate | "Across your [N] scans," / "In your scan history," |

**Examples:**
- "In this scan, 23% of posts were video content."
- "In this captured sample, political topics appeared 8 times."
- "During this scroll session, content from verified accounts was more common."

### 2.2 Allowed Uncertainty Phrases

**Use these to signal appropriate epistemic humility:**

| Certainty Level | Phrases |
|-----------------|---------|
| Observation | "appeared," "was present," "showed up," "was captured" |
| Frequency | "appeared more often," "was less common," "tended to appear" |
| Possibility | "may indicate," "could suggest," "might reflect" |
| Consistency | "is consistent with," "aligns with patterns of," "resembles" |
| Apparent pattern | "appears to," "seems to," "looks like" |

**Examples:**
- "Political content appeared more often in the evening scan."
- "This pattern may indicate topic clustering by the feed algorithm."
- "The frequency is consistent with increased platform activity around this topic."

### 2.3 Forbidden Phrasing

**These phrases are NEVER allowed:**

| Category | Forbidden Phrases | Why |
|----------|-------------------|-----|
| Identity | "You are," "You're a," "You believe," "Your personality" | Cannot infer identity |
| Mind reading | "You feel," "You think," "You want," "You're interested in" | Cannot read minds |
| Algorithmic intent | "The algorithm wants," "The platform is trying to," "They're pushing" | Cannot know intent |
| Strong causation | "This caused," "This made you," "This resulted in you" | Cannot prove causation |
| Certainty | "Definitely," "Certainly," "Proves that," "Shows that you" | Overstates confidence |
| Diagnosis | "You have," "You suffer from," "Signs of [disorder]" | Not qualified |
| Future certainty | "You will see," "This will happen," "Expect to" | Cannot predict |

### 2.4 Replacement Table

| Instead of | Use |
|------------|-----|
| "You are interested in politics" | "In this scan, political content appeared frequently" |
| "The algorithm thinks you like drama" | "Content with conflict themes appeared more often in this sample" |
| "You're being radicalized" | "In this scan, content with strong viewpoints appeared more than neutral content" |
| "This proves filter bubbles" | "This sample showed limited source diversity, which is consistent with filter bubble patterns" |
| "You will see more outrage" | "If patterns continue, outrage-framed content may remain common" |

### 2.5 Insufficient Data Rules

**Stop analysis and state "insufficient data" when:**

| Condition | Threshold | Required Message |
|-----------|-----------|------------------|
| Total posts | < 10 posts | "This scan captured fewer than 10 posts. Analysis requires more data for meaningful patterns." |
| Category count | < 3 items in category | "Only [N] posts in this category. More data needed for reliable frequency analysis." |
| Time window | < 2 minutes | "Scan duration was very short. Patterns may not be representative." |
| Failed classification | > 30% unclassified | "Classification confidence was low for many posts. Results may be unreliable." |
| Single source | All from 1 account | "All content from a single source. Diversity metrics not applicable." |

---

## 3. Chart Validity Rules

### 3.1 Counts vs Percentages

| Use Counts When | Use Percentages When |
|-----------------|---------------------|
| Total sample is small (< 30 items) | Sample is large enough (≥30 items) |
| Showing absolute magnitude matters | Showing proportion matters |
| Single scan with any N | Multiple scans aggregated, N≥30 |
| Raw data transparency is priority | Relative comparison is priority |

**Rules:**
1. Always display the total N alongside any percentage. Example: "~45% (18 of 40 posts)"
2. Single-scan percentages MUST use "~" or "approximately"
3. When N < 10, show only counts, never percentages
4. When N < 20, add "limited sample" qualifier

### 3.2 When to Show "Insufficient Signal"

Display "Insufficient signal from this scan" instead of data when:

| Metric Type | Threshold | Reason |
|-------------|-----------|--------|
| Percentages | N < 10 | Single item = 10%+ swing |
| Topic distribution | N < 20 | Random variation dominates |
| Political content | N < 15 | Classification uncertainty |
| Sentiment | N < 15 | Keyword matching is noisy |
| Creator concentration | N < 10 | Cannot measure concentration |
| Trends | < 3 scans | Cannot establish direction |

**Always prefer showing "Insufficient signal" over presenting noisy data with false precision.**

### 3.2 Normalization Requirements

| Scenario | Normalization Required |
|----------|----------------------|
| Comparing across time periods | Yes - normalize to posts/hour or posts/session |
| Comparing across platforms | Yes - normalize to percentage of total |
| Comparing topic frequencies | Yes - normalize to percentage of classified posts |
| Single scan topic breakdown | Optional - can show raw counts if N displayed |
| Engagement metrics | Yes - normalize to per-post averages |

### 3.3 Time Window Rules

| Time Context | Display Requirement |
|--------------|---------------------|
| Single scan | Show scan timestamp and duration |
| Daily aggregate | Show date range and total scan count |
| Weekly/monthly | Show date range, scan count, and total posts |
| Trend charts | X-axis must show actual dates, not just "Day 1, Day 2" |

**Rule:** Never show time-series data without explicit date labels.

### 3.4 Minimum Sample Thresholds by Chart Type

| Chart Type | Minimum Sample | Below Threshold Action |
|------------|---------------|----------------------|
| Pie/Donut (topic breakdown) | 20 posts | Show "Insufficient data" message, hide chart |
| Bar chart (category comparison) | 3 items per category minimum | Collapse categories below threshold into "Other" |
| Time series (trend) | 3 data points minimum | Show "More scans needed for trend analysis" |
| Sentiment distribution | 15 classified posts | Show "Insufficient classified posts" |
| Source diversity | 5 unique sources | Show actual count, note if below threshold |
| Engagement comparison | 10 posts with engagement data | Show "Limited engagement data available" |

### 3.5 Data Quality Flags

**These flags MUST gate chart rendering:**

| Flag | Condition | Required Action |
|------|-----------|-----------------|
| `LOW_CONFIDENCE` | > 20% of posts have classification confidence < 0.6 | Show warning badge on chart |
| `PARTIAL_DATA` | > 10% of expected fields are null/missing | Show "Partial data" indicator |
| `STALE_DATA` | Scan is > 24 hours old | Show timestamp prominently, add "Historical" label |
| `SINGLE_SOURCE` | > 80% of posts from one account | Hide diversity charts, show warning |
| `CLASSIFICATION_FAILURE` | > 30% of posts failed classification | Hide topic charts, show error message |
| `INSUFFICIENT_SAMPLE` | Total posts below chart-specific threshold | Hide chart, show threshold message |

**Implementation Rule:** Charts MUST check all applicable flags before rendering. If any blocking flag is present, the chart MUST NOT render and MUST display the appropriate message.

---

## 4. "Talk to Your Algorithm" Rules

### 4.1 What It Is NOT

- NOT a chatbot for general conversation
- NOT a therapist or counselor
- NOT a mind reader that knows what you think or feel
- NOT an oracle that can predict algorithm behavior
- NOT a representative of any social media platform
- NOT a diagnostic tool for mental health or radicalization

### 4.2 What It IS

A **reflective interface** that helps users understand patterns in their observed feed data through structured dialogue.

### 4.3 Response Structure

Every "Talk" response MUST follow this **four-part structure** (NOT five - interpretation and speculation are combined):

```
## What We Observed
[What the data directly shows - cite evidence bundle fields]
- Must cite 2-4 specific fields from the Evidence Bundle
- Use exact numbers where available
- Anchor to "In this scan..." or "In this sample..."

## What It Might Mean
[Hypotheses only - 2-3 labeled possibilities]
- Always use "may", "might", "could"
- Label each hypothesis explicitly (H1, H2, H3 or descriptive labels)
- Never present as fact

## What We Cannot Know
[Explicit epistemic boundaries]
- Cite the limits section of the Evidence Bundle
- Always include at least 2 specific unknowns
- Example: "We cannot know why this content appeared or how you interacted with it."

## What You Can Try
[User experiments, not corrections]
- Frame as experiments: "You could try..." not "You should..."
- 2-4 optional actions
- Non-judgmental, non-prescriptive
- Acknowledge results may vary
```

**CRITICAL:** Talk responses are NOT:
- A chatbot conversation
- A therapist or counselor
- A diagnostic tool
- An explainer of platform internals
- An oracle predicting future behavior

### 4.4 Evidence Citation Requirements

**Every observation MUST cite its source:**

| Claim Type | Required Citation Format |
|------------|-------------------------|
| Topic frequency | "Based on `topicCounts` field: [value]" |
| Sentiment | "Based on `sentimentDistribution` field: [value]" |
| Source diversity | "Based on `uniqueSources` field: [value]" |
| Time pattern | "Based on `postTimestamps` field analysis" |
| Engagement | "Based on `engagementMetrics` field: [value]" |

**Example:**
> "In this scan, political content appeared in 12 posts (based on `topicCounts.political: 12`). This is higher than the 5-post average across your scan history."

### 4.5 Uncertainty Statement Requirements

**Every response MUST include at least one explicit uncertainty statement:**

| Context | Required Uncertainty Statement |
|---------|-------------------------------|
| Topic analysis | "This reflects what appeared in your feed, not your interests or beliefs." |
| Pattern observation | "This pattern is based on [N] scans and may not represent your overall feed experience." |
| Comparison | "Differences between scans could reflect many factors including time of day, platform changes, or random variation." |
| Any interpretation | "We cannot know why the algorithm showed this content or how you interacted with it." |

### 4.6 Prohibited Talk Behaviors

| Behavior | Example | Why Prohibited |
|----------|---------|----------------|
| Agreeing with user's self-diagnosis | "Yes, you do seem to be in a filter bubble" | Cannot confirm user's beliefs about themselves |
| Making recommendations about platform use | "You should spend less time on social media" | Not a counselor, out of scope |
| Explaining platform internals | "Facebook's algorithm works by..." | Cannot know internal workings |
| Validating emotional reactions | "It's understandable you feel manipulated" | Cannot assess or validate emotions |
| Making predictions | "Your feed will likely become more extreme" | Cannot predict future |
| Comparing to other users | "Most people see similar patterns" | No access to other users' data |

### 4.7 Talk Response Quality Checklist

Before sending any Talk response, verify:

- [ ] All observations cite specific evidence bundle fields
- [ ] All interpretations use uncertainty language
- [ ] Speculation is explicitly labeled as speculation
- [ ] Limits section acknowledges what cannot be known
- [ ] No identity, belief, or emotional claims about the user
- [ ] No claims about algorithmic intent or platform motivation
- [ ] Actionable suggestions are experiments, not lifestyle advice
- [ ] Total response follows the 5-part structure

---

## 5. Compliance Verification

### 5.1 Pre-Generation Checklist

Before generating ANY analysis text:

1. **Source Check:** Is this derived from the evidence bundle only?
2. **Anchor Check:** Does every statement have a scope anchor?
3. **Language Check:** Are all phrases from the allowed list?
4. **Threshold Check:** Does the data meet minimum sample requirements?
5. **Flag Check:** Are all data quality flags accounted for?

### 5.2 Post-Generation Review

After generating analysis text, scan for:

- Any second-person claims ("You are," "You believe," etc.)
- Any certainty language ("definitely," "proves," etc.)
- Any algorithmic intent language ("wants," "trying to," etc.)
- Any missing scope anchors
- Any uncited observations

### 5.3 Violation Severity

| Severity | Violation Type | Required Action |
|----------|---------------|-----------------|
| Critical | Identity/belief claims about user | Block output, log error |
| Critical | Psychological diagnosis language | Block output, log error |
| High | Missing scope anchors | Add default anchor, log warning |
| High | Certainty language | Replace with uncertainty phrase, log warning |
| Medium | Missing evidence citation | Add citation, log info |
| Medium | Below-threshold chart rendering | Hide chart, show message |
| Low | Missing N alongside percentage | Add N display |

---

## Appendix A: Evidence Bundle Field Reference

The evidence bundle contains these fields that may be cited:

| Field | Type | Description |
|-------|------|-------------|
| `scanId` | string | Unique identifier for this scan |
| `timestamp` | datetime | When the scan was captured |
| `duration` | number | Scan duration in seconds |
| `totalPosts` | number | Total posts captured |
| `topicCounts` | object | Counts per topic category |
| `sentimentDistribution` | object | Positive/negative/neutral counts |
| `uniqueSources` | number | Count of unique content sources |
| `sourceList` | array | List of source identifiers |
| `engagementMetrics` | object | Likes, comments, shares aggregates |
| `postTimestamps` | array | Timestamp of each captured post |
| `classificationConfidence` | array | Confidence scores per classification |
| `formatBreakdown` | object | Video/image/text/link counts |
| `platform` | string | Source platform identifier |

---

## Appendix B: Example Compliant vs Non-Compliant Text

### Topic Analysis

**Non-Compliant:**
> "You're clearly interested in conspiracy theories. The algorithm knows you like this content and keeps showing it to you. This is causing you to become more extreme in your views."

**Compliant:**
> "In this scan, content classified as 'conspiracy-adjacent' appeared 7 times out of 45 posts (16%). Based on `topicCounts.conspiracy_adjacent: 7`. This is higher than the 3-post average in your previous scans. We cannot know why this content appeared or how you interacted with it. This reflects what was shown, not your beliefs or interests."

### Sentiment Analysis

**Non-Compliant:**
> "Your feed is full of negative content, which proves the algorithm is trying to make you angry. You should be concerned about your mental health."

**Compliant:**
> "In this captured sample, 28 of 52 posts (54%) were classified as having negative sentiment (based on `sentimentDistribution.negative: 28`). This is consistent with patterns researchers have observed in engagement-optimized feeds, though we cannot confirm this is the cause. This observation is about content shown, not about your emotional state."

### Talk Response

**Non-Compliant:**
> User: "Am I in a filter bubble?"
> "Yes, you definitely are. Your feed shows all the classic signs of a filter bubble - limited perspectives, echo chamber content, and algorithmic reinforcement. You should diversify your sources and spend less time on social media."

**Compliant:**
> User: "Am I in a filter bubble?"
>
> **Observation:** In this scan, content came from 4 unique sources (based on `uniqueSources: 4`). Of 38 classified posts, 31 (82%) aligned with a similar topical perspective (based on `topicCounts` aggregation).
>
> **Interpretation:** Limited source diversity and high topical consistency are patterns that may be associated with filter bubble conditions, though this single scan cannot confirm a filter bubble exists.
>
> **Speculation:** Possible explanations include: your follow list, recent engagement patterns the platform detected, trending topics, or random variation in this particular scan.
>
> **Limits:** We cannot know: your full feed history, content you scrolled past, your engagement behavior, or the platform's internal ranking signals. A single scan captures a moment, not a complete picture.
>
> **What You Can Try:** Run scans at different times of day to see if patterns persist. Compare weekday vs weekend scans. These experiments could reveal whether this pattern is consistent or variable.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | AlgorithmLens Team | Initial contract |

**This contract is binding for all analysis generation. Violations must be logged and reviewed.**
