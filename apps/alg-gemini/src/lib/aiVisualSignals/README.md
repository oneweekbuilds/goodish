# AI Visual Signals Detection - Backend Integration Guide

⚠️ **CRITICAL: THIS FEATURE IS NOT CURRENTLY FUNCTIONAL IN PRODUCTION** ⚠️

## Status: Illustrative Only

The AlgorithmLens scan schema **does not include the metadata fields** required for AI detection.

### What's Missing (All of These):
- ❌ `c2pa_manifest` / `content_credentials` - C2PA content provenance
- ❌ `platform_labels` / `content_labels` - Platform AI tags
- ❌ `exif_metadata` - EXIF data with tool signatures
- ❌ `image_url` / `video_url` / `media_bytes` - Media access

### What This Means:
- **Demo mode**: Works with synthetic `aiVisualSignals` field added by `demoData.js`
- **Production**: Always shows honest empty state explaining limitation
- **Backend module**: Cannot be integrated until scan schema is extended

## Why This Limitation Is Shown Transparently

AlgorithmLens prioritizes **epistemic honesty** over feature completeness.
We show users what we cannot measure rather than guessing or inferring AI generation.

This limitation is displayed clearly in the dashboard UI with detailed explanation.

## Integration Point (Future Backend Work)

The `enrichFeedItemsWithAiSignals()` function should be called **in the backend API** when processing scan results, before saving to the database or returning to the frontend.

### Where to Integrate

**Location**: Backend API scan processing pipeline (likely `apps/alg-gemini/backend/` or similar)

**When**: After feed items are extracted from the screen recording and before the scan result is saved or returned

**Example Integration** (Python backend):

```python
# In your backend scan processing code (e.g., app.py, scan_processor.py)

from lib.ai_visual_signals import enrich_feed_items_with_ai_signals

async def process_scan(video_file, platform, user_id):
    # 1. Extract feed items from video (existing logic)
    feed_items = await extract_feed_items_from_video(video_file, platform)

    # 2. Enrich feed items with AI visual signals detection
    # This adds the 'aiVisualSignals' field to each visual post
    feed_items = enrich_feed_items_with_ai_signals(feed_items)

    # 3. Calculate aggregates (existing logic)
    aggregates = calculate_aggregates(feed_items)

    # 4. Save to database (existing logic)
    scan_id = await save_scan_result(user_id, platform, feed_items, aggregates)

    return scan_id
```

### Required Fields

For the AI signal detection to work properly, each feed item must have:

- `media_type` or `content_type` or `type`: 'image' | 'video' | 'text'
- At least one of:
  - `media_bytes`: Raw image/video bytes
  - `thumbnail_bytes`: Thumbnail image bytes
  - `image_url`: URL to image (not fetched for privacy)
  - `video_url`: URL to video (not fetched for privacy)

### Optional Fields (for better detection)

- `c2pa_manifest` or `content_credentials`: C2PA metadata (highest confidence)
- `platform_labels` or `content_labels` or `labels`: Platform-provided labels
- `exif_metadata` or `metadata`: EXIF data from image

### Classification Output

The function adds the `aiVisualSignals` field to each feed item:

- `'LIKELY_AI'`: Strong signals consistent with AI generation (e.g., C2PA manifest, platform AI label)
- `'POSSIBLY_AI'`: Weak signals or multiple indicators
- `'NO_STRONG_SIGNALS'`: Default when no clear signals detected (conservative approach)

**IMPORTANT**: Classification is based on metadata signals only, not visual analysis. It defaults to `NO_STRONG_SIGNALS` when uncertain.

## Frontend Consumption

The frontend dashboard automatically consumes the `aiVisualSignals` field via:

1. `aggregateAiVisualSignals()` in `scanAggregator.js`
2. Overview tab section showing AI visual signals distribution
3. Demo mode provides deterministic test data

## Demo Mode

Demo mode (`?demo=1`) generates synthetic data with:
- 112 visual posts (70% of 160 total)
- 20 LIKELY_AI (18%)
- 13 POSSIBLY_AI (12%)
- 79 NO_STRONG_SIGNALS (70%)

This ensures the dashboard displays correctly during development.

## Conservative Approach

This module follows a **conservative detection policy**:
- Never guess or speculate
- Default to NO_STRONG_SIGNALS when uncertain
- Rely on explicit metadata signals (C2PA, platform labels, EXIF)
- Do not perform visual analysis unless explicitly enabled (and it's not yet implemented)
- Clearly communicate that signals are not definitive proof

## Testing

To test the integration:

1. **Demo Mode**: Visit `/dashboard?demo=1` to see the section populated with test data
2. **Real Scans**: Process a scan with visual content and verify:
   - `aiVisualSignals` field appears on visual posts
   - Dashboard Overview tab shows AI visual signals section
   - Console output shows correct aggregation counts

## Future Enhancements

Potential improvements (not yet implemented):
- Pixel-based visual heuristics (opt-in only)
- Integration with third-party AI detection APIs
- User feedback loop for improving detection accuracy
- Per-platform signal customization
