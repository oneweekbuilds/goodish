// The methodology page's pinned content: the evaluation figures the page
// cites (src/methodologyPrompts.test.js holds them to what the app's own
// evidence module carries) and the schema table (every field checked
// against the generated frame prompt). Kept apart from MethodologyPage.jsx
// so that file exports only its component.

export const EVALUATION_FIGURES = {
  // Gold set (mobile eval/gold/goldset.json, 2026-08-09; scored artifact
  // accuracy-committed-png-no-ocr-1786312104873.json).
  goldItems: 110,
  goldFrames: 35,
  distinctPosts: 71,
  annotators: 1,
  pointEstimateFloor: 20,
  // Stability run B (mobile eval/results/eval-1786156691961.json, 2026-08-07).
  stabilityFrames: 8,
  stabilityRuns: 5,
  stabilityFlips: { ads: 1, origin: 0, politics: 0, tone: 2, observations: 96 },
  // Per-platform accuracy (mobile eval/wide-research/PLATFORM_ACCURACY.json, 2026-10-05).
  platformAccuracyFloor: 50,
};

export const SCHEMA_FIELDS = [
  ['frame_id', 'Per frame', 'The frame number, echoed back so an answer can be matched to its frame.'],
  ['extraction_confidence', 'Per frame', 'Model-reported confidence for the whole frame, 0.0 to 1.0. Lowered for blurry or hard-to-read images.'],
  ['estimated_position', 'Per post', '1-based position of the post within the feed as captured.'],
  ['content_type', 'Per post', 'One of: photo, video, reel, short, text, story, ad, unknown.'],
  ['creator_handle', 'Per post', 'Handle exactly as shown on screen, or null if not visible.'],
  ['creator_display_name', 'Per post', 'Display name as shown, or null.'],
  ['is_ad', 'Per post', 'True only when an explicit paid-content disclosure is visible on screen: a platform label ("Sponsored", "Ad", "Promoted", "Paid partnership") or a disclosure hashtag. A brand logo, a famous poster or promotional-sounding text is not evidence (rule 4).'],
  ['ad_detection_reason', 'Per post', 'The exact on-screen disclosure that triggered is_ad, or null.'],
  ['is_suggested', 'Per post', 'True only when the platform explicitly marks the item as recommended, by an on-screen label or a tab context named in the platform hints; null means no origin signal was observed (rule 5).'],
  ['suggestion_detection_reason', 'Per post', 'The on-screen suggestion label or tab context that triggered is_suggested, or null.'],
  ['post_text', 'Per post', 'Visible caption or text, at most 500 characters. Read during analysis and never stored.'],
  ['hashtags', 'Per post', 'Hashtags visible in the post.'],
  ['is_partial', 'Per post', 'True when the post is cut off at the top or bottom of the frame.'],
  ['topics.primary_category', 'Per post', 'One of 19 fixed categories plus Other (the list is in the system prompt below).'],
  ['topics.secondary_categories', 'Per post', 'Additional applicable categories.'],
  ['topics.freeform_tags', 'Per post', 'Free-text tags.'],
  ['political.is_political', 'Per post', 'Boolean, per the political classification rules in the prompt. Required: since 10 August 2026 the model must answer, where before it could stay silent and the app recorded silence as "not political".'],
  ['political.stance_or_alignment_guess', 'Per post', 'LEFT, CENTER, RIGHT, UNKNOWN, or null. UNKNOWN when political but the lean is not apparent.'],
  ['political.policy_area', 'Per post', 'Free-text policy area, or null.'],
  ['wellbeing.wellbeing_relevance', 'Per post', 'NONE, LOW, MODERATE, or HIGH, for content related to body image, mental health, financial anxiety, FOMO, comparison triggers, or toxic positivity.'],
  ['wellbeing.themes', 'Per post', 'Wellbeing-related themes observed.'],
  ['wellbeing.potential_risk_flags', 'Per post', 'Requested from the model but deliberately not stored and not displayed anywhere in the app.'],
  ['emotions.valence', 'Per post', 'POSITIVE, NEUTRAL, NEGATIVE, or MIXED, per the valence rules in the prompt. The model may leave it empty; such posts are left out of every tone count.'],
  ['source_origin', 'Per post', 'suggested, followed, or null when no origin signal was observed.'],
  ['ai_disclosure', 'Per post', 'LABELED_AI when the platform shows an AI-content label, NOT_LABELED, or null. The thinnest extraction field in practice.'],
];
