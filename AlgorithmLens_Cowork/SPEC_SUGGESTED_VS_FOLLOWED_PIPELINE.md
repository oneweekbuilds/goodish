# Specification: Suggested vs Followed Data Pipeline

**Date:** February 13, 2026
**Status:** Roadmap item — not yet implemented
**Priority:** Core product differentiator

---

## What This Is

Right now, Tab 6 (Suggested vs Followed) only works in demo mode. It shows a message saying "AlgorithmLens will be able to compute this in future releases when platform metadata is captured during scans."

This spec describes what needs to happen for this tab to work with real scan data.

## The Good News: Most of It Is Already Built

The frontend is ready. The tab component, the data aggregation function, the hero insight builder, and the tone comparison logic all exist and work correctly with demo data. The only missing piece is getting the actual data from the Chrome extension into each scan.

## What Needs to Change

### 1. Chrome Extension — Capture Source Origin Per Post

This is the main work. The extension needs to detect, for each post it captures, whether it came from:

- **"suggested"** — the platform recommended this post (e.g., TikTok "For You" page, Instagram "Suggested Posts" in feed, YouTube "Shorts" recommendations)
- **"followed"** — this post is from an account the user follows

How this works depends on the platform:

- **TikTok:** The "For You" tab is all suggested. The "Following" tab is all followed. The extension could detect which tab is active.
- **Instagram:** Feed posts from followed accounts have a "Following" indicator. Suggested posts say "Suggested for you." The extension could look for these platform labels in the DOM.
- **YouTube Shorts:** The Shorts feed is primarily algorithmic. Subscribed channel content could be detected via channel subscription status.
- **X/Twitter:** The "For You" and "Following" tabs are separate, similar to TikTok.

The extension should add a `sourceOrigin` field to each feed item with the value `"suggested"`, `"followed"`, or `null` (if it can't determine).

### 2. Backend — Accept the New Field

The backend model file (`backend/unified_scan_models.py`) needs to accept `sourceOrigin` as an optional string on each FeedItem. This is a small change — just adding one field to the schema. The field should be optional so that scans from older extension versions (which don't capture it) still work.

### 3. Nothing Else Changes

The frontend aggregation function (`aggregateSourceOrigin` in `scanAggregator.js`) already knows how to read `sourceOrigin` from feed items. The hero insight builder already generates appropriate messages based on the percentage. The tone comparison already works. The tab component already renders everything.

Once the extension starts sending `sourceOrigin`, the tab will light up automatically.

## Platform-Specific Detection Notes

Each platform exposes suggested vs followed content differently. Here are the key signals the extension would look for:

| Platform | Suggested Signal | Followed Signal |
|----------|-----------------|-----------------|
| TikTok | "For You" tab active | "Following" tab active |
| Instagram | "Suggested for you" label, Explore page | No "Suggested" label, in main feed |
| YouTube Shorts | Default Shorts feed | Subscribed channel indicator |
| X/Twitter | "For You" tab active | "Following" tab active |

## Data Quality Considerations

- **It's okay if some posts have `null` sourceOrigin.** The aggregation function already handles this — it only counts posts where the field is present.
- **Minimum threshold:** The hero card requires at least some posts with sourceOrigin data to display. If too few posts have this data, the tab will show the "not yet available" message.
- **Tone comparison threshold:** The insight builder only surfaces tone differences between suggested and followed content if the gap is 8 percentage points or more, to avoid showing noise as a finding.

## Estimated Effort

- **Extension changes:** Medium effort. Requires platform-specific DOM detection logic. Each platform needs its own detection strategy, and these can break when platforms update their UI. Expect 1-2 weeks of development plus ongoing maintenance.
- **Backend changes:** Minimal — one new optional field on the FeedItem model. Under an hour.
- **Frontend changes:** None needed. Already complete.

## Suggested Implementation Order

1. Start with one platform (TikTok is simplest — it has distinct "For You" and "Following" tabs)
2. Ship it, verify the tab works with real data
3. Add Instagram detection
4. Add remaining platforms over time

---

*This spec describes the feature gap only. No code was changed.*
