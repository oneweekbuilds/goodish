# Chart Quality System

**Version:** 1.0 (Phase 11)
**Last Updated:** December 2024

This document describes the chart quality system implemented to ensure all dashboard charts are truthful and defensible. Charts must never imply precision that the underlying data cannot support.

## Overview

The chart quality system implements deterministic metric definitions and strict data-quality gating. Every chart payload includes quality metadata that the frontend uses to decide whether to render a chart or show an "Insufficient Data" state.

**Compliance:** This system complies with the [Accuracy Contract](./accuracy_contract.md).

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  scanAggregator │────>│   dataHelpers    │────>│    ViewCard     │
│  (raw data)     │     │  (+ chartQuality)│     │  (quality gate) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               v
                        ┌──────────────────┐
                        │   chartQuality   │
                        │   (thresholds)   │
                        └──────────────────┘
```

## Quality Flags

Every chart payload includes a `chartQuality` object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `n_items` | number | Total items used for this chart |
| `window_start` | string (ISO date) | Earliest data point timestamp |
| `window_end` | string (ISO date) | Latest data point timestamp |
| `quality` | enum | Quality flag (see below) |
| `quality_reason` | string | null | Human-readable explanation when not ok |

### Quality Flag Values

| Value | Meaning | Frontend Action |
|-------|---------|-----------------|
| `ok` | Data meets all thresholds | Render chart normally |
| `low_sample` | Below minimum item count | Show "Insufficient Data" state |
| `missing_fields` | Required fields are null/missing | Show "Insufficient Data" state |
| `model_low_confidence` | Classification confidence below threshold | Show "Insufficient Data" state |

## Minimum Thresholds by Chart Class

These thresholds are conservative and justified by statistical reliability requirements:

### Topic Distribution (Pie/Bar Charts)
- **Minimum Items:** 20
- **Justification:** With fewer than 20 items, a single item represents >5% of the distribution, creating misleading "spikes" from random variation. 20 items allows at least 4-5 meaningful categories with 3+ items each.
- **Reference:** Accuracy Contract Section 3.4

### Ad Share (Percentage Charts)
- **Minimum Items:** 10
- **Justification:** Ad rates typically range 5-25%. With <10 items, a single ad changes percentage by >10 points. 10 items provides ±10% stability per item.
- **Reference:** Accuracy Contract Section 2.5

### Creator Concentration
- **Minimum Items:** 10
- **Justification:** Concentration metrics need enough data to show clustering vs spread. With <10 posts, Herfindahl-like indices become meaningless.

### Political Mix
- **Minimum Items:** 15
- **Justification:** Political content is typically sparse (5-20% of feed). Higher threshold than ads because political classification has inherent uncertainty.
- **Reference:** Accuracy Contract Section 3.4

### Trend Over Time
- **Minimum Data Points:** 3 scans
- **Justification:** A "trend" requires directionality which needs at least 3 points. 2 points can only show "up" or "down", not acceleration/deceleration.
- **Reference:** Accuracy Contract Section 3.4

### Sentiment Distribution
- **Minimum Items:** 15
- **Justification:** Same reasoning as political - classification confidence concerns.
- **Reference:** Accuracy Contract Section 3.4

### Source Diversity
- **Minimum Sources:** 5
- **Justification:** Diversity metric is meaningless with fewer than 5 unique sources.
- **Reference:** Accuracy Contract Section 3.4

### Default (Unspecified Charts)
- **Minimum Items:** 10
- **Justification:** Conservative default to prevent misleading patterns from sparse data.

## Implementation Details

### Backend (chartQuality.js)

The `chartQuality.js` module provides:

1. **QUALITY_FLAGS** - Constants for quality flag values
2. **CHART_THRESHOLDS** - Minimum thresholds by chart class with justifications
3. **computeChartQuality()** - Generic quality computation function
4. **VIEW_TO_CHART_TYPE** - Mapping from view IDs to chart types

### Data Helpers (dataHelpers.js)

Each data helper function now:

1. Extracts time window from scans
2. Computes quality based on chart type
3. Returns a `chartQuality` object in the response:

```javascript
return createResponse(
  true,                    // hasData
  { /* chart data */ },    // data
  null,                    // missing reason
  scansUsed,              // scan count
  scansWithData,          // scan IDs
  {                       // chartQuality
    n_items: totalPosts,
    windowStart,
    windowEnd,
    quality: qualityResult.quality,
    quality_reason: qualityResult.reason,
  }
);
```

### Frontend (ViewCard.jsx)

The ViewCard component:

1. Extracts `chartQuality` from `dataResult`
2. Computes `qualityOk = !chartQuality || chartQuality.quality === QUALITY_FLAGS.OK`
3. Uses `showChart = hasData && qualityOk` for rendering decision
4. Passes `chartQuality` to `EmptyState` when showing insufficient data

### Empty State (EmptyState.jsx)

A new `INSUFFICIENT_DATA` empty state type:

- Shows amber warning icon
- Displays `quality_reason` from chartQuality
- Shows item count in footer when available
- Links to "Run More Scans" action

## Payload Example

### Before (without quality system):
```json
{
  "hasData": true,
  "data": {
    "currentPercent": 12,
    "trend": [...],
    "totalAds": 3,
    "totalPosts": 25
  },
  "missing": null,
  "scansUsed": 1,
  "scansWithData": ["scan-123"]
}
```

### After (with quality system):
```json
{
  "hasData": true,
  "data": {
    "currentPercent": 12,
    "trend": [...],
    "totalAds": 3,
    "totalPosts": 25
  },
  "missing": null,
  "scansUsed": 1,
  "scansWithData": ["scan-123"],
  "chartQuality": {
    "n_items": 25,
    "window_start": "2024-12-15T10:30:00.000Z",
    "window_end": "2024-12-15T10:30:00.000Z",
    "quality": "ok",
    "quality_reason": null
  }
}
```

### Low Sample Example:
```json
{
  "hasData": true,
  "data": {
    "currentPercent": 50,
    "totalAds": 1,
    "totalPosts": 2
  },
  "missing": null,
  "scansUsed": 1,
  "scansWithData": ["scan-456"],
  "chartQuality": {
    "n_items": 2,
    "window_start": "2024-12-15T10:30:00.000Z",
    "window_end": "2024-12-15T10:30:00.000Z",
    "quality": "low_sample",
    "quality_reason": "Ad percentage requires at least 10 posts for reliable measurement."
  }
}
```

## Verification Checklist

Use this checklist to verify the chart quality system is working correctly:

### Charts Render When Quality is OK
- [ ] Navigate to `/dashboard`
- [ ] Open a scan with 20+ posts
- [ ] Verify charts render with data
- [ ] Verify footer shows item count

### Insufficient Data Appears When Quality is Not OK
- [ ] Navigate to `/dashboard`
- [ ] View a tab with sparse data (< threshold items)
- [ ] Verify "Insufficient Data" state appears
- [ ] Verify amber warning icon is shown
- [ ] Verify quality reason is displayed
- [ ] Verify "Run More Scans" link is present

### No Chart Shows Without n_items and Defined Window
- [ ] Open browser developer tools
- [ ] Navigate to `/dashboard`
- [ ] Check network responses for chart data
- [ ] Verify every response includes `chartQuality` with `n_items`
- [ ] Verify `window_start` and `window_end` are present (or null if no data)

## Files Changed

- `src/lib/dashboard/chartQuality.js` - **NEW** - Quality computation module
- `src/lib/dashboard/dataHelpers.js` - Updated with quality metadata
- `src/components/dashboard/ViewCard.jsx` - Quality gating in render
- `src/components/dashboard/EmptyState.jsx` - Insufficient data state
- `docs/chart_quality_system.md` - **NEW** - This documentation

## Future Improvements

1. **Backend enforcement** - Move quality computation to Python backend for single source of truth
2. **Model confidence integration** - When ML models report confidence, use for `model_low_confidence` flag
3. **Time window normalization** - Normalize metrics across different time windows for fair comparison
4. **Threshold tuning** - Adjust thresholds based on user feedback and accuracy studies
