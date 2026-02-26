# Pricing Page Feature Gap Analysis

**Date:** February 17, 2026
**Context:** The pricing page (PricingPage.jsx) advertises features for both Free and Premium tiers. This document identifies which advertised features exist in the current codebase and which are missing.

---

## Premium Tier — Advertised vs. Actual

| Advertised Feature | Status | Notes |
|---|---|---|
| "Analyze all major platforms (5+)" | **MISSING** | The scan system processes one platform at a time. There is no multi-platform session or cross-platform comparison view. |
| "See 7-day, 30-day, and custom ranges" | **PARTIAL** | The DashboardPage has date range dropdowns (7d, 30d, 90d, custom) but the `userTier` was hardcoded to 'free' so they were always disabled. Now wired to real auth — the UI exists but the backend `/api/trends` endpoint only supports week-over-week aggregation, not arbitrary date ranges. |
| "Compare tone, topics & sources" | **EXISTS** | The six-tab dashboard compares these across scans. (Note: was "Compare bias" — changed to "tone, topics & sources" to comply with epistemic restraint.) |
| "See which brands and influencers shape your feed" | **EXISTS** | The Creators tab and Ads tab show this data. |
| "Advanced dashboard views" | **UNCLEAR** | Both Free and Plus users see the same 6 tabs. There is no distinction between "basic" and "advanced" views. The trends comparison feature is Plus-only. |
| "Unlimited profile refreshes" | **MISSING** | There is no scan frequency limit system for free users and no "unlimited" distinction for Plus. All users can scan as often as they want. |
| "Priority platform-level insights" | **MISSING** | No implementation. No concept of "priority" insights in the codebase. |

## Free Tier — Advertised vs. Actual

| Advertised Feature | Status | Notes |
|---|---|---|
| "Access a 7-day snapshot of your feed" | **MISLEADING** | Scans are point-in-time captures, not 7-day aggregations. A single scan shows what appeared at the moment of capture. |
| "Basic dashboard views" | **MISLEADING** | Free users see the same 6 tabs as Plus users. |
| "Limited refresh frequency" | **MISSING** | No refresh frequency limits are implemented. |

## What Actually Distinguishes Free from Plus

Based on the codebase, the real difference between Free and Plus is:

1. **Plus-only: Longitudinal trend analysis** — The `/api/trends` endpoint returns week-over-week aggregation and trend direction. This is gated behind `is_user_plus()`.
2. **Plus-only: Evidence bundles** — The evidence bundle endpoints for all tabs (Ads, Politics, Patterns, Creators, Inferences) require Plus.
3. **Plus-only: Talk to Algorithm** — The "Ask about this scan" conversational feature (currently orphaned/removed from dashboard but exists as components).

## Recommendations

The pricing page should be rewritten to describe features that actually exist. Suggested accurate copy:

**Free:**
- Scan your feed on any platform
- Full six-tab dashboard (Sources, Ads, Politics, Tone, Patterns, Algorithm)
- See your feed composition at a glance

**Plus ($10/month or $96/year):**
- Everything in Free
- Track how your feed changes over time (trend analysis)
- Evidence-grounded insights with detailed breakdowns
- 14-day free trial included

**Features to build before advertising:**
- Multi-platform comparison in a single session
- Custom date range filtering (backend support needed)
- Scan frequency limits for free users (if you want this distinction)
- "Priority insights" (define what this means)
