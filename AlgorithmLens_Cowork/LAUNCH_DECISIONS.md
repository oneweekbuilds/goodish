# Launch Decisions - AlgorithmLens Dashboard

## Last Updated
Phase 10 Launch Hardening Pass

---

## What Ships (Visible by Default)

### PRIMARY Cards (One per Tab)
| Tab | Card ID | Title | Why Primary |
|-----|---------|-------|-------------|
| Ads | ads-percentage | Ads in Your Feed | Clearest answer to "how much is selling to me?" |
| Politics | politics-share | Political Content in Your Feed | Clearest answer to "how much political content?" |
| Patterns | patterns-topic-variety | Topics in Your Feed | Clearest answer to "is my feed varied?" |
| Creators | creators-top | Your Top Creators | Clearest answer to "who shapes what I see?" |
| Algorithm | algo-topics-liked | What the Algorithm Shows You Most | Clearest answer to "how am I categorized?" |

### SECONDARY Cards (Supporting, Visible)
| Tab | Card ID | Title |
|-----|---------|-------|
| Ads | ads-concentration | Where Promotions Come From |
| Ads | ads-by-platform | Ads by Platform |
| Politics | politics-balance | Perspective Balance (opt-in) |
| Politics | politics-creators | Who Posts Political Content |
| Patterns | patterns-echo-risk | Content Repetition |
| Creators | creators-concentration | Creator Concentration |
| Creators | creators-voice-diversity | Source Variety |
| Algorithm | algo-profile-breadth | Profile Breadth |
| Algorithm | algo-confident | Consistent Patterns |

### COLLAPSED Cards (Available but De-emphasized)
| Tab | Card ID | Reason Collapsed |
|-----|---------|------------------|
| Ads | ads-likely-promo | Low confidence heuristic |
| Ads | ads-products | Supporting detail |
| Politics | politics-by-platform | Requires 2+ platforms |
| Politics | politics-leaning | Opt-in + low confidence |
| Politics | politics-blind-spots | Opt-in + low confidence |
| Patterns | patterns-repeated-themes | Numeric detail |
| Patterns | patterns-stability | Requires 2+ scans |
| Patterns | patterns-emotional-weight | Secondary signal |
| Creators | creators-cross-platform | Requires 2+ platforms |
| Algorithm | algo-future | Speculative |

---

## What's Hidden (Not Rendered)

| Card ID | Reason Hidden |
|---------|---------------|
| ads-trend | Cognitive load - trend data not primary |
| ads-explicit-vs-hidden | Redundant with ads-likely-promo |
| ads-promo-creators | Redundant with creators tab |
| ads-themes | Low value for most users |
| politics-repetition | Future feature - not implemented |
| politics-tone | Future feature - not implemented |
| politics-trend | Cognitive load - trend data not primary |
| patterns-sentiment-balance | Redundant with emotional-weight |
| patterns-discovery | Low priority signal |
| patterns-rare-content | Low priority signal |
| patterns-intensity-spikes | Requires interpretation |
| creators-new-vs-familiar | Redundant with discovery rate |
| creators-driving-ads | Redundant with promo-creators |
| creators-driving-politics | Redundant with politics tab |
| creators-by-topic | Complex interpretation needed |
| creators-by-tone | Low reliability |
| algo-topics-avoided | Confusing framing |
| algo-products | Redundant with ads tab |
| algo-political-themes | Future feature |
| algo-emotional-triggers | Low reliability |
| algo-uncertain | Confusing framing |

---

## Trust Principles Enforced

### PHASE 9: Qualitative Labels (No False Precision)
- **Political leaning**: "Leans left/right/mixed" (not percentages)
- **Echo risk**: "High/Moderate/Low concentration" (not scores)
- **Creator concentration**: "A small number of accounts..." (not percentages)
- **Ad concentration**: "A small number of accounts..." (not percentages)

### Raised Thresholds (Insufficient Data States)
| Metric | Minimum Required | Reason |
|--------|------------------|--------|
| Political leaning | 30 signals | Avoid false confidence |
| Creator concentration | 100 posts | Need statistical significance |
| Emotional tone | 50 posts | Need pattern to emerge |
| Topic distribution | 25 posts / 3 topics | Need variety to measure |
| Advertiser insights | 50 signals + 3 categories | Avoid thin data claims |

### Tab Trust Sentences
Each tab opens with a trust-building sentence:
- **Ads**: "This shows promotional patterns in your feed, not what you buy."
- **Politics**: "This shows political content exposure, not your views."
- **Patterns**: "This shows what appears repeatedly in your feed."
- **Creators**: "This shows who appears most often, not necessarily who you follow."
- **Algorithm**: "This shows rough estimates of how platforms may categorize you."

### Language Rules
- No anthropomorphizing ("the algorithm thinks" -> "your feed shows")
- No accusations ("advertisers think you like" -> "ad categories you see")
- Calm tone (no alarmism, no judgment)
- Actions are optional ("you could try" not "you should")

---

## Opt-In Features

These views require explicit user opt-in:
- `politics-leaning` - Political lean estimates
- `politics-balance` - Political balance status
- `politics-blind-spots` - Missing perspectives

Reason: Political classification is low-confidence heuristic. Users must consent to see estimates that could be wrong or misinterpreted.

---

## Premium Value Pillars

1. **Interpretation** ("What it might mean")
   - All PRIMARY cards have takeaways
   - Summary cards aggregate insights

2. **Change Over Time** (trend data)
   - Trend views exist but are hidden for launch simplicity
   - Can be unhidden in future for power users

3. **Context & Comparison** (cross-platform)
   - Platform comparison views available (collapsed)
   - Require scans from 2+ platforms

---

## Talk to Your Algorithm (Future Feature)

Foundation exists:
- `algo-change-advice` view with actionable tips
- All views have optional `action` fields
- Tips focus on behavior changes, not platform manipulation

---

## Not Shipped (Blocked or Future)

| Feature | Status | Blocker |
|---------|--------|---------|
| Manipulation Score | REMOVED | No reliable detection method |
| Misinformation Risk | REMOVED | Would require fact-checking |
| Undisclosed Sponsorship | REMOVED | Cannot prove intent |
| Partisanship Index | REMOVED | Too subjective |
| Political Theme Extraction | BLOCKED | Needs ML infrastructure |
| Political Tone Classification | BLOCKED | Needs ML infrastructure |
| Per-item Emotion Data | BLOCKED | Not in scan pipeline |
