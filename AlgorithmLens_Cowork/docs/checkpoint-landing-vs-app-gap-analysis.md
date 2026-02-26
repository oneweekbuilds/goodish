# Checkpoint: Landing Page vs. App Gap Analysis

**Date:** February 17, 2026
**Purpose:** Identify all features promised on the main website (landing page + pricing page) that are not yet built or enforced in the actual app/dashboard.

---

## Summary

After auditing every landing page component, the pricing page, and all dashboard tabs/utilities, I found **9 distinct gaps** between what the website promises and what the app delivers. Some are gating issues (features exist but aren't properly restricted by tier), and some are entirely missing features.

---

## Gap 1: Free Tier Date Range Is Backwards

**What the pricing page says:** Starter gets "Access a 7-day snapshot of your feed"
**What the app does:** Free users only get "Today" and "All time" — the 7-day option is Premium-gated

**Why it matters:** The pricing page explicitly promises free users a 7-day view. Currently, the code disables the "Last 7 days" option for free users and marks it "(Premium)". This is a direct contradiction.

**Fix:** Allow free users to select "Today," "Last 7 days," and "All time." Keep 30-day, 90-day, and Custom as Premium-only.

---

## Gap 2: Free Tier Platform Restriction Not Enforced

**What the pricing page says:** Starter gets "Analyze 1 platform"
**What the app does:** No restriction exists. Free users can scan and view data from any number of platforms.

**Why it matters:** The pricing differentiates Starter ("1 platform") from Premium ("5+ platforms"), but the app doesn't enforce this. There's no platform filter for free users, and no restriction on which platform's data they see.

**Fix:** For free users, auto-detect their most-used platform and filter the dashboard to show only that platform's data. Show a "Premium" badge on the platform dropdown indicating multi-platform is a Premium feature.

---

## Gap 3: Free Tier "Top 5" Limit Not Enforced

**What the pricing page says:** Starter gets "See top 5 topics and creators"
**What the app does:** The Sources tab shows the top 10 creators. No cap at 5 for free users.

**Why it matters:** This is a pricing promise that affects perceived value of upgrading. If free users already see top 10, the Premium upgrade feels less compelling.

**Fix:** Cap tables to 5 rows for free users. Show a "See all with Premium" teaser below the truncated table.

---

## Gap 4: No "Basic" vs. "Advanced" Dashboard View Distinction

**What the pricing page says:** Starter gets "Basic dashboard views only" / Premium gets "Advanced dashboard views"
**What the app does:** All 6 tabs are visible to both tiers. Many views in `dashboardCatalog.js` are marked `hidden: true` but this is not tied to Premium gating — they're hidden for everyone.

**Why it matters:** The pricing page promises Premium unlocks "advanced" views, but there's nothing in the app that distinguishes basic from advanced.

**Fix:** Unhide select dashboard catalog views for Premium users that are currently marked `hidden: true`. For free users, show these as locked cards with "Upgrade to see this insight" overlays. Specifically, the following hidden views should become Premium-unlockable:
- Ads: `ads-trend`, `ads-explicit-vs-hidden`, `ads-promo-creators`, `ads-themes`
- Politics: `politics-repetition`, `politics-tone`, `politics-trend`
- Patterns: `patterns-sentiment-balance`, `patterns-discovery`, `patterns-rare-content`

---

## Gap 5: "Compare Across Time Periods" Not Prominent

**What the pricing page says:** Premium gets "Compare tone, topics & sources across time periods"
**What the app does:** A `TrendsPanel` and `TrendsStubPanel` exist, plus `trendsComparison.js`, but the cross-time comparison feature is not prominently surfaced as a first-class Premium feature.

**Why it matters:** This is a headline Premium differentiator on the pricing page.

**Fix:** Make the trends/comparison panel a visible Premium section at the top of each tab (or on the Overview tab) instead of just a small CTA. For free users, show a locked preview of what trend analysis looks like.

---

## Gap 6: "Brands and Influencers" View Missing

**What the pricing page says:** Premium gets "See which brands and influencers shape your feed"
**What the app does:** The Sources tab shows creators, and the Ads tab shows advertisers, but there's no unified "brands and influencers" view that combines both.

**Why it matters:** The pricing page frames this as a distinct Premium benefit. Users expect a view that specifically calls out brand and influencer presence.

**Fix:** Add a combined "Brands & Influencers" card in the Overview or Sources tab that surfaces: top brand/advertiser accounts, top influencer accounts (by post count), and the percentage of feed shaped by commercial entities (brands + influencers combined).

---

## Gap 7: Digital Twin / Algorithmic Profile Not Built

**What the landing page shows:** The BentoGrid component prominently displays an inferred "algorithmic profile" with: Political Alignment (e.g., "Left-Leaning" with a confidence bar), Predicted Age Range (e.g., "24-30"), Emotional Signals (e.g., "High Anxiety"), Engagement Value (e.g., "Top 5% Valuable User")
**What the app does:** None of this exists in the dashboard. The dashboard shows factual feed composition but does not infer or display an "algorithmic profile."

**Why it matters:** This is one of the most visually striking elements of the landing page and likely a key reason users sign up. Its complete absence from the dashboard is a significant expectation gap.

**Fix:** Build an "Algorithmic Profile" card (or section within the Overview tab) that synthesizes existing dashboard data into profile-style inferences. Use data already available:
- Political alignment → from the Politics tab's ideological distribution data
- Predicted interests → from topic distribution data
- Emotional pattern → from the Tone tab's sentiment distribution
- Content consumption style → from Suggested vs Followed ratio + content type data

**Important:** Per the epistemic restraint rules, these must be clearly framed as "what the algorithm may infer" — not as identity claims.

---

## Gap 8: Feedback Loop Education Missing

**What the landing page shows:** The SectionLoop component shows a 4-step cycle: "Your behavior → The algorithm's view → Tailored content → Your media diet evolves"
**What the app does:** No educational component about the feedback loop exists in the dashboard.

**Why it matters:** The landing page educates users about *why* their feed looks the way it does. The dashboard shows *what* is in the feed but doesn't connect it back to the feedback loop concept.

**Fix:** Add a small educational "How This Works" expandable section or info tooltip in the Overview tab that briefly explains the feedback loop concept. This connects the dashboard data to the "why" that the landing page promises.

---

## Gap 9: "Limited Refresh Frequency" Not Enforced

**What the pricing page says:** Starter has "Limited refresh frequency"
**What the app does:** Free users have a 5-scan-per-month quota, but there's no time-based refresh frequency limit (e.g., "1 scan per 24 hours"). The only limit is total scan count.

**Why it matters:** "Limited refresh frequency" implies a time-based restriction (e.g., can only scan once a day), not just a total count. The current behavior doesn't match this language.

**Fix:** Either (a) add a cooldown timer for free users (e.g., minimum 24 hours between scans), or (b) update the pricing page copy to say "5 scans per month" instead of "Limited refresh frequency" to match reality. Recommend option (b) since it's more honest and simpler.

---

## Priority Ranking

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | Gap 1: Fix free tier 7-day access | Small | High — direct pricing page contradiction |
| 2 | Gap 7: Build Algorithmic Profile card | Large | High — most visible landing page promise |
| 3 | Gap 4: Basic vs. Advanced view gating | Medium | High — core pricing differentiator |
| 4 | Gap 3: Free tier top-5 cap | Small | Medium — pricing enforcement |
| 5 | Gap 5: Make trends comparison prominent | Medium | Medium — Premium value perception |
| 6 | Gap 2: Free tier platform restriction | Medium | Medium — pricing enforcement |
| 7 | Gap 6: Brands & Influencers view | Medium | Medium — Premium promise |
| 8 | Gap 8: Feedback loop education | Small | Low — nice-to-have |
| 9 | Gap 9: Refresh frequency language | Tiny | Low — copy fix only |

---

## Next Steps

Awaiting Justin's approval on which gaps to address and in what order.
