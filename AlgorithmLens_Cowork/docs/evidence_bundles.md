# Evidence Bundles

Evidence Bundles are the **single source of truth** for all plain-English analysis copy and Talk-to-Algorithm responses in Algorithm Lens. All generated text MUST derive from Evidence Bundle fields—never from raw feed text, generic explanations, or LLM hallucinations.

## Purpose

Evidence Bundles solve the accuracy problem by enforcing a strict contract between data and display:

1. **Deterministic**: Every field in the bundle is computed deterministically from stored scan data
2. **Auditable**: Every claim links back to specific bundle fields (cited_fields)
3. **Bounded**: The system explicitly states what it cannot know (limits section)
4. **Quality-gated**: Measurements include quality flags that inform how confidently we can present data

## Bundle Structure

Every Evidence Bundle has exactly four top-level keys:

```json
{
  "meta": { ... },           // Scan metadata
  "observations": { ... },   // Hard facts from data
  "measurements": { ... },   // Classifier-based estimates
  "limits": { ... }          // What is missing or uncertain
}
```

### meta

Context about the scan and bundle generation:

| Field | Type | Description |
|-------|------|-------------|
| scan_id | string \| null | Unique scan identifier |
| platform | string \| null | Platform name (e.g., "X", "Instagram") |
| n_items | number | Total feed items in scan |
| window_start | ISO string \| null | Start of scan window |
| window_end | ISO string \| null | End of scan window |
| generated_at | ISO string | When bundle was generated |

### observations

Hard facts computed deterministically from stored data. No inference or interpretation.

#### Commercial Exposure Spectrum (v2.0)

The primary metric for Ads & Influence is the **Commercial Exposure Spectrum** - a confidence-gated breakdown of commercial content:

| Field | Type | Description |
|-------|------|-------------|
| commercial_exposure_spectrum.stacked_bar | object | 100% stacked bar data (high-confidence only) |
| commercial_exposure_spectrum.stacked_bar.non_commercial | number | Posts with no commercial signals |
| commercial_exposure_spectrum.stacked_bar.labeled_ads | number | Platform-labeled ads |
| commercial_exposure_spectrum.stacked_bar.unlabeled_promotion | number | High-confidence promotional content |
| commercial_exposure_spectrum.excluded | object | Items excluded from bar |
| commercial_exposure_spectrum.coverage_percent | number | % of items classified with high confidence |

**Critical Rule**: Only HIGH confidence classifications appear in the stacked bar. Medium/low confidence and ambiguous items are explicitly excluded and documented in limits.

#### Brand/Entity Presence (v2.0)

| Field | Type | Description |
|-------|------|-------------|
| top_brands | array | [{name, count, high_confidence}] extracted entities |
| unique_brands_count | number | Distinct brand count (above threshold) |
| long_tail_brands_count | number | Brands that appeared only once |

#### Legacy Fields (backward compatible)

| Field | Type | Description |
|-------|------|-------------|
| total_posts_seen | number | Count of all feed items |
| total_ads_detected | number | Count of items with is_ad=true |
| ad_rate_percent | number \| null | (total_ads / total_posts) * 100 |
| top_advertisers | array | [{name, count}] if available |
| unique_advertisers_count | number | Distinct advertiser count |

**Rule**: Observations are ONLY included if they can be computed directly from explicit data fields. If we can't count it, it's not an observation.

### measurements

Classifier-based estimates or heuristic labels. Each measurement MUST include:

| Field | Type | Description |
|-------|------|-------------|
| value | any | The measured value |
| method | string | "heuristic" \| "classifier:\<name\>" |
| quality | enum | "ok" \| "low_sample" \| "missing_fields" \| "model_low_confidence" |
| notes | string \| null | Caveats about this measurement |
| threshold_rule | string \| null | (v2.0) Threshold used for surfacing |

#### Commercial Intent Classification (v2.0)

The commercial classifier assigns each feed item:

```json
{
  "unlabeled_promotions": {
    "value": {
      "high_confidence": 3,
      "medium_confidence": 2,
      "ambiguous": 5
    },
    "method": "classifier:commercial_intent_pipeline",
    "quality": "ok",
    "notes": "Only high-confidence items counted in metrics. 5 items excluded as ambiguous."
  }
}
```

Classification output per item:
- `commercial_class`: "non_commercial" | "labeled_ad" | "unlabeled_promotion" | "ambiguous"
- `commercial_confidence`: "high" | "medium" | "low"
- `commercial_detection_method`: "platform_label" | "ocr_disclosure" | "cta_pattern" | "entity_reference" | "keyword_heuristic" | "none"

#### Promotion Topics (v2.0)

Topics are derived ONLY from promotional content with confidence thresholds:

```json
{
  "promotion_topics": {
    "value": [
      {"topic": "fitness", "count": 5, "high_confidence_count": 3},
      {"topic": "tech", "count": 3, "high_confidence_count": 2}
    ],
    "method": "classifier:topic_keyword_matching",
    "quality": "ok",
    "threshold_rule": "count >= 2 AND high_confidence >= 1"
  }
}
```

#### Legacy Example

```json
{
  "possible_unlabeled_promotions": {
    "value": 3,
    "method": "classifier:commercial_intent_pipeline",
    "quality": "ok",
    "notes": "High confidence: 3, Medium confidence: 2. Only high-confidence items in metrics."
  }
}
```

### limits

What we cannot know or compute. This section is CRITICAL for honest communication.

| Field | Description |
|-------|-------------|
| sample_size_limitations | Array of strings describing sample size issues |
| missing_metadata_limitations | Array of strings describing missing fields |
| ad_detection_limitations | Array of strings about detection method limits |
| ocr_extraction_limitations | Array of strings about OCR issues |
| epistemic_boundaries | Array of fundamental unknowns (e.g., "We cannot know why the algorithm showed this") |
| commercial_analysis_exclusions | (v2.0) Items excluded from commercial metrics |
| threshold_exclusions | (v2.0) Topics/brands excluded for being below threshold |

#### Commercial Analysis Exclusions (v2.0)

The limits section now explicitly documents what was excluded from metrics:

```json
{
  "commercial_analysis_exclusions": [
    "5 items had ambiguous commercial signals and were excluded from metrics.",
    "2 items showed medium-confidence promotional signals but are not included in the primary exposure spectrum."
  ],
  "threshold_exclusions": [
    "Topics excluded (below threshold): gaming, lifestyle",
    "3 brands appeared only once and are not shown individually."
  ]
}
```

This transparency is non-negotiable. Users must understand what the system could NOT classify.

## Integration with Chart Quality

Evidence Bundles MUST NOT contradict the chart quality system (`chartQuality.js`). If a chart is marked "insufficient data," the bundle's limits section should reflect this, and analysis copy should not claim confidence.

Quality flag mapping:

| chartQuality | Evidence Bundle Quality |
|--------------|------------------------|
| CHART_READY | "ok" |
| PARTIAL | "low_sample" or "missing_fields" |
| NO_DATA | Analysis should say "insufficient data" |

## Generation Rules

### Plain-English Analysis

Per `accuracy_contract.md`:

1. **Anchor claims to sample**: "In this scan..." / "In this sample..."
2. **Avoid identity claims**: Never "You are..." or "You believe..."
3. **Avoid intent claims**: Never "The algorithm wants..." or "Advertisers think..."
4. **Avoid causal claims**: Never "This caused..." / prefer "This correlates with..."
5. **State uncertainty**: When limits indicate gaps, the copy MUST reflect that

### Talk-to-Algorithm Responses

Strict 4-part structure:

1. **What we observed** (cite 2-4 bundle fields)
2. **What it might mean** (2-3 labeled hypotheses, no certainty)
3. **What we cannot know** (cite limits section)
4. **What you can try** (2-4 non-judgmental, optional actions)

## API Endpoints

### GET /api/scans/{scan_id}/evidence-bundle/ads

Returns Evidence Bundle for Ads & Influence tab.

Query params:
- `debug=true` - Include raw bundle in _debug field (dev only)

### POST /api/scans/{scan_id}/talk/ads

Generate Talk response from Evidence Bundle.

Form data:
- `question` - User's question

Returns structured 4-part response.

## Debug Mode

In development, the Evidence Bundle can be viewed:

1. **Console**: Bundle is logged with `[Evidence Bundle]` prefix
2. **API**: Add `?debug=true` to evidence-bundle endpoint
3. **UI**: Click "Show Evidence Bundle" button (dev builds only)

## MOBILE_VIDEO OCR Extraction

For MOBILE_VIDEO scans, ad detection relies entirely on OCR (Optical Character Recognition) to find disclosure labels like "Ad", "Sponsored", or "Promoted" in video frames. The quality of OCR extraction directly affects analysis accuracy.

### OCR Preprocessing Pipeline

The OCR pipeline applies the following preprocessing to improve accuracy on mobile video frames:

1. **Grayscale conversion** - Removes color information for cleaner text detection
2. **2x upscaling** - Helps detect small UI labels (e.g., "Ad" text)
3. **CLAHE contrast enhancement** - Adaptive histogram equalization for varied lighting
4. **Adaptive thresholding** - Better handling of complex backgrounds

### OCR Observations

Evidence Bundles for MOBILE_VIDEO scans include these OCR-specific observations:

| Field | Type | Description |
|-------|------|-------------|
| ocr_extraction_rate_percent | number | Percentage of frames with extracted text |
| items_with_ocr_text | number | Count of frames with non-empty OCR |
| ads_detected_via_ocr | number | Ads found via disclosure token matching |

### Ad Detection via OCR

The system looks for these disclosure tokens (case-insensitive):
- `ad` (standalone word)
- `sponsored`
- `promoted`
- `advertisement`
- `paid partnership`
- `paid promotion`
- `#ad`
- `#sponsored`

**Limitations**:
- False positives: Posts discussing ads, "add" vs "ad", etc.
- False negatives: Non-English disclosures, unusual formats, brief labels not captured in frames

### OCR Debug Mode

To diagnose OCR extraction issues, enable debug mode:

```bash
# Windows
set ALGO_OCR_DEBUG=1
python -m uvicorn app:app --reload

# Linux/Mac
ALGO_OCR_DEBUG=1 python -m uvicorn app:app --reload
```

When enabled:
- Saves preprocessed frames to `backend/ocr_debug/scan_<id>/`
- Saves first 3 frames + 3 frames with longest OCR text
- Logs summary statistics (frames processed, non-empty rate, max text length)

Debug output location: `apps/alg-gemini/backend/ocr_debug/`

### Verifying OCR Quality

To verify OCR is working for a scan:

1. Check the Evidence Bundle API:
   ```
   GET /api/scans/{scan_id}/evidence-bundle/ads?debug=true
   ```

2. Look for these fields in the response:
   - `bundle.observations.ocr_extraction_rate_percent` - Should be > 0
   - `bundle.observations.items_with_ocr_text` - Should be > 0
   - `bundle.limits.ocr_extraction_limitations` - Describes extraction status

3. Check `_debug.scan_metadata.source_type` equals "MOBILE_VIDEO"

## Future Expansion

When adding new tabs (Politics, Patterns, Creators, Algorithm):

1. Create `build_<tab>_evidence_bundle()` in `evidence_bundle.py`
2. Add corresponding API endpoints
3. Create frontend hooks in `useEvidenceBundle.ts`
4. Create evidence-bound Talk component

The structure remains the same: meta, observations, measurements, limits.
