/**
 * Accuracy Architecture Contract Types
 *
 * These types enforce the Accuracy Architecture Contract defined in
 * docs/accuracy_architecture.md. All classifiers MUST comply with these
 * structures.
 *
 * Version: 1.1.0
 * Last Updated: 2025-12-18
 *
 * v1.1.0 Changes:
 * - Added UNKNOWN as first-class confidence tier
 * - Added Coverage Contract types
 * - Added Modality Authority types
 * - Clarified Epistemic Boundary types
 */

// =============================================================================
// Supported Platforms
// =============================================================================

/**
 * Platforms currently supported by AlgorithmLens.
 * IMPORTANT: Facebook is explicitly NOT supported.
 */
export type SupportedPlatform = 'instagram' | 'x' | 'twitter' | 'youtube' | 'tiktok';

/**
 * Type guard to check if a platform is supported.
 * Facebook MUST always return false.
 */
export function isSupportedPlatform(platform: string): platform is SupportedPlatform {
  const supported: SupportedPlatform[] = ['instagram', 'x', 'twitter', 'youtube', 'tiktok'];
  const normalized = platform.toLowerCase();

  // Facebook is explicitly NOT supported
  if (normalized === 'facebook' || normalized === 'fb' || normalized === 'meta') {
    return false;
  }

  return supported.includes(normalized as SupportedPlatform);
}

// =============================================================================
// Confidence Levels
// =============================================================================

/**
 * Internal confidence tier for classifications.
 *
 * HIGH: Reliable enough for primary metrics (requires multi-signal)
 * MEDIUM: Informative but excluded from top-line numbers
 * LOW: Internal only - maps to UNKNOWN for user-facing
 * UNKNOWN: Insufficient evidence - user-facing representation of uncertainty
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

/**
 * User-facing confidence levels.
 * LOW is NEVER shown to users - it becomes UNKNOWN.
 */
export type UserFacingConfidence = 'high' | 'medium' | 'unknown';

/**
 * Map internal confidence to user-facing confidence.
 * CRITICAL: LOW must always become UNKNOWN for user-facing output.
 */
export function toUserFacingConfidence(internal: ConfidenceLevel): UserFacingConfidence {
  if (internal === 'low') {
    return 'unknown';
  }
  return internal as UserFacingConfidence;
}

/**
 * Reason codes for UNKNOWN confidence.
 */
export type UnknownReasonCode =
  | 'insufficient_evidence'      // Cannot meet MEDIUM threshold
  | 'missing_modality'           // Required signal type unavailable
  | 'signal_conflict'            // Signals contradict each other
  | 'insufficient_coverage'      // Below minimum item/percentage thresholds
  | 'single_weak_signal'         // One ambiguous indicator (internal: LOW)
  | 'extraction_failure';        // Text/metadata extraction failed

/**
 * Structure for UNKNOWN confidence with reason.
 */
export interface UnknownConfidenceResult {
  confidence: 'unknown';
  reason_code: UnknownReasonCode;
  reason_description: string;
  affected_items?: number;
}

/**
 * Requirements for each confidence level per the Accuracy Architecture Contract.
 */
export const CONFIDENCE_REQUIREMENTS = {
  high: {
    description: 'Reliable enough for primary metrics and user-facing summaries',
    requirements: [
      '≥2 independent detection methods',
      'OR 1 modality + strong corroboration',
      'OR platform attestation (is_ad=True)',
      'OR exact regulatory disclosure match',
    ],
    surfacedInMetrics: true,
    requiresMultiSignal: true,
    userFacing: 'high' as const,
  },
  medium: {
    description: 'Informative but excluded from top-line metrics',
    requirements: [
      '1 strong signal without corroboration',
      'OR 2+ weak signals together',
      'OR partial corroboration',
    ],
    surfacedInMetrics: false,
    requiresMultiSignal: false,
    userFacing: 'medium' as const,
  },
  low: {
    description: 'Internal only - maps to UNKNOWN for users',
    requirements: [
      'Single weak signal',
      'OR conflicting signals',
      'OR below extraction threshold',
    ],
    surfacedInMetrics: false,
    requiresMultiSignal: false,
    userFacing: 'unknown' as const,  // LOW → UNKNOWN for users
  },
  unknown: {
    description: 'Insufficient evidence to make determination',
    requirements: [
      'Insufficient evidence (cannot meet MEDIUM)',
      'OR missing critical modality',
      'OR unresolved signal conflict',
      'OR insufficient coverage',
      'OR extraction failure',
    ],
    surfacedInMetrics: false,
    requiresMultiSignal: false,
    userFacing: 'unknown' as const,
  },
} as const;

// =============================================================================
// Detection Methods
// =============================================================================

/**
 * Standard detection method identifiers.
 * All classifiers should use these or extend them with classifier-specific methods.
 */
export type StandardDetectionMethod =
  | 'platform_label'      // Platform explicitly labeled (is_ad=True, etc.)
  | 'ocr_disclosure'      // OCR found disclosure tokens
  | 'discount_code'       // Discount/referral code patterns
  | 'partnership_language' // Partnership/sponsorship language
  | 'cta_pattern'         // Call-to-action patterns
  | 'entity_reference'    // Brand/entity references
  | 'keyword_heuristic'   // Keyword-based classification
  | 'structural_analysis' // DOM/structure analysis
  | 'metadata_extraction' // Metadata-based extraction
  | 'none';               // No signals detected

// =============================================================================
// Classification Result
// =============================================================================

/**
 * Base classification result structure.
 * All classifiers MUST return this structure or an extension of it.
 */
export interface ClassificationResult<TClass extends string = string> {
  /**
   * Primary classification output.
   */
  classification: TClass;

  /**
   * Confidence level of the classification.
   * HIGH requires ≥2 detection methods OR platform attestation.
   */
  confidence: ConfidenceLevel;

  /**
   * Detection methods that contributed to this classification.
   * REQUIRED for non-LOW confidence.
   * HIGH confidence requires ≥2 methods OR platform_label.
   */
  detection_methods: string[];

  /**
   * Human-readable evidence citations.
   * REQUIRED for HIGH confidence.
   * Must trace back to observable data.
   */
  evidence: string[];

  /**
   * Exact patterns that were matched.
   * Preserved verbatim from source data.
   */
  matched_patterns: string[];

  /**
   * Classifier identifier for traceability.
   */
  classifier_name: string;

  /**
   * Classifier version for traceability.
   */
  classifier_version: string;
}

/**
 * Validation errors for classification results.
 */
export interface ClassificationValidationError {
  code: string;
  message: string;
  severity: 'blocking' | 'critical' | 'warning';
}

/**
 * Validate a classification result against the Accuracy Architecture Contract.
 *
 * @returns Array of validation errors. Empty array = valid.
 */
export function validateClassificationResult(
  result: ClassificationResult
): ClassificationValidationError[] {
  const errors: ClassificationValidationError[] = [];

  // HIGH confidence requires evidence
  if (result.confidence === 'high' && result.evidence.length === 0) {
    errors.push({
      code: 'NO_EVIDENCE_FOR_HIGH',
      message: 'HIGH confidence requires ≥1 evidence citation',
      severity: 'blocking',
    });
  }

  // HIGH confidence requires multi-signal OR platform attestation
  if (result.confidence === 'high') {
    const isPlatformAttested = result.detection_methods.includes('platform_label');
    const uniqueMethods = new Set(result.detection_methods);
    const hasMultiSignal = uniqueMethods.size >= 2;

    if (!isPlatformAttested && !hasMultiSignal) {
      errors.push({
        code: 'SINGLE_SIGNAL_HIGH_CONFIDENCE',
        message: 'HIGH confidence requires ≥2 detection methods or platform attestation',
        severity: 'blocking',
      });
    }
  }

  // No identity claims in evidence
  const identityPatterns = [
    'you are',
    'you believe',
    'you want',
    'your personality',
    'you think',
    'you feel',
    "you're interested",
  ];

  for (const evidence of result.evidence) {
    const lowerEvidence = evidence.toLowerCase();
    for (const pattern of identityPatterns) {
      if (lowerEvidence.includes(pattern)) {
        errors.push({
          code: 'IDENTITY_CLAIM_IN_EVIDENCE',
          message: `Identity claim detected in evidence: "${evidence}"`,
          severity: 'blocking',
        });
        break;
      }
    }
  }

  return errors;
}

// =============================================================================
// Evidence Bundle Requirements
// =============================================================================

/**
 * Quality flags for measurements.
 */
export type MeasurementQuality =
  | 'ok'
  | 'low_sample'
  | 'missing_fields'
  | 'model_low_confidence'
  | 'not_applicable'
  | 'insufficient_signal';

/**
 * Base structure for measurements in Evidence Bundles.
 */
export interface MeasurementBase<T = unknown> {
  value: T;
  method: string;
  quality: MeasurementQuality;
  notes: string | null;
  threshold_rule?: string;
}

/**
 * Required limits section structure.
 * Every Evidence Bundle MUST include these fields.
 */
export interface RequiredLimitsSection {
  /**
   * Fundamental unknowns that MUST always be acknowledged.
   * REQUIRED: At least 2 items.
   */
  epistemic_boundaries: string[];

  /**
   * Sample size issues.
   */
  sample_limitations: string[];

  /**
   * Extraction issues (OCR, DOM, etc.).
   */
  extraction_limitations: string[];

  /**
   * Platform-specific gaps.
   */
  platform_limitations: string[];

  /**
   * Items excluded from metrics with reasons.
   */
  exclusions: string[];
}

/**
 * Standard epistemic boundaries that should appear in most bundles.
 */
export const STANDARD_EPISTEMIC_BOUNDARIES = [
  'We cannot know why the algorithm showed this content',
  'Content presence does not indicate user beliefs or preferences',
  'We cannot see how you interacted with this content',
  'This represents one scroll session, not your full feed history',
] as const;

/**
 * Validate a limits section against requirements.
 */
export function validateLimitsSection(
  limits: Partial<RequiredLimitsSection>
): ClassificationValidationError[] {
  const errors: ClassificationValidationError[] = [];

  // Must have epistemic_boundaries
  if (!limits.epistemic_boundaries || limits.epistemic_boundaries.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_EPISTEMIC_BOUNDARIES',
      message: 'Bundle requires ≥2 epistemic boundaries in limits section',
      severity: 'blocking',
    });
  }

  // Must have exclusions (even if empty array)
  if (!limits.exclusions) {
    errors.push({
      code: 'MISSING_EXCLUSIONS',
      message: 'Bundle must document exclusions (even if empty)',
      severity: 'critical',
    });
  }

  return errors;
}

// =============================================================================
// Prohibited Behaviors
// =============================================================================

/**
 * Phrases that are FORBIDDEN in all user-facing output.
 */
export const FORBIDDEN_PHRASES = {
  identity_claims: [
    'you are',
    'you believe',
    'you want',
    'your personality',
    "you're a",
    'you think',
    'you feel',
  ],
  mind_reading: [
    "you're interested in",
    'you like',
    'you prefer',
    'your interests',
  ],
  algorithmic_intent: [
    'the algorithm wants',
    'the platform is trying to',
    "they're pushing",
    'designed to make you',
  ],
  certainty: [
    'definitely',
    'certainly',
    'proves that',
    'shows that you',
    'this proves',
  ],
  prediction: [
    'you will see',
    'you will be shown',
    'expect to see',
    'will continue to',
  ],
  diagnosis: [
    'you have',
    'you suffer from',
    'signs of',
    'symptoms of',
  ],
} as const;

/**
 * Check text for forbidden phrases.
 *
 * @returns Array of forbidden phrases found, or empty if clean.
 */
export function checkForForbiddenPhrases(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [category, phrases] of Object.entries(FORBIDDEN_PHRASES)) {
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        found.push(`[${category}] "${phrase}"`);
      }
    }
  }

  return found;
}

// =============================================================================
// Threshold Rules
// =============================================================================

/**
 * Standard thresholds for surfacing data.
 */
export const SURFACING_THRESHOLDS = {
  /**
   * Minimum items required for reliable analysis.
   */
  MIN_ITEMS_FOR_ANALYSIS: 10,

  /**
   * Minimum high-confidence items for representative results.
   */
  MIN_HIGH_CONFIDENCE_ITEMS: 5,

  /**
   * Minimum count to surface a topic/brand.
   */
  MIN_COUNT_TO_SURFACE: 2,

  /**
   * Minimum high-confidence count to surface a topic/brand.
   */
  MIN_HIGH_CONFIDENCE_TO_SURFACE: 1,

  /**
   * Coverage percentage below which to warn about sample quality.
   */
  LOW_COVERAGE_THRESHOLD: 80,
} as const;

/**
 * Standard threshold rule for surfacing topics/brands.
 */
export const STANDARD_SURFACING_RULE =
  `count >= ${SURFACING_THRESHOLDS.MIN_COUNT_TO_SURFACE} AND high_confidence >= ${SURFACING_THRESHOLDS.MIN_HIGH_CONFIDENCE_TO_SURFACE}`;

/**
 * Check if data should be surfaced based on standard thresholds.
 */
export function shouldSurface(count: number, highConfidenceCount: number): boolean {
  return (
    count >= SURFACING_THRESHOLDS.MIN_COUNT_TO_SURFACE &&
    highConfidenceCount >= SURFACING_THRESHOLDS.MIN_HIGH_CONFIDENCE_TO_SURFACE
  );
}

// =============================================================================
// Coverage Metrics
// =============================================================================

/**
 * Standard coverage metrics structure.
 */
export interface CoverageMetrics {
  total_items: number;
  classified_items: number;
  high_confidence_items: number;
  classification_rate_percent: number;
  coverage_percent: number;
}

/**
 * Calculate coverage metrics.
 */
export function calculateCoverage(
  totalItems: number,
  classifiedItems: number,
  highConfidenceItems: number
): CoverageMetrics {
  return {
    total_items: totalItems,
    classified_items: classifiedItems,
    high_confidence_items: highConfidenceItems,
    classification_rate_percent:
      totalItems > 0 ? Math.round((classifiedItems / totalItems) * 1000) / 10 : 0,
    coverage_percent:
      totalItems > 0 ? Math.round((highConfidenceItems / totalItems) * 1000) / 10 : 0,
  };
}

// =============================================================================
// Platform-Specific Limitations
// =============================================================================

/**
 * Standard limitations for each platform.
 */
export const PLATFORM_LIMITATIONS: Record<SupportedPlatform, string[]> = {
  instagram: [
    'Story content may have different patterns than feed',
    'Shopping tags may not be visible in all contexts',
    'Reels may have different disclosure patterns',
  ],
  x: [
    'Retweets may have different classification patterns',
    'Spaces and audio content are not analyzed',
    'Quote tweets may have complex attribution',
  ],
  twitter: [
    'Retweets may have different classification patterns',
    'Spaces and audio content are not analyzed',
    'Quote tweets may have complex attribution',
  ],
  youtube: [
    'In-video sponsor segments are not detected',
    'Pre-roll ads are not captured in feed scans',
    'Community posts may have different patterns',
  ],
  tiktok: [
    'Duets and stitches may have complex attribution',
    'Audio-only disclosures are not detected',
    'Live content is not analyzed',
  ],
};

/**
 * Get platform-specific limitations.
 */
export function getPlatformLimitations(platform: string): string[] {
  const normalized = platform.toLowerCase() as SupportedPlatform;
  return PLATFORM_LIMITATIONS[normalized] || [];
}

// =============================================================================
// Source Type Limitations
// =============================================================================

/**
 * Source types for scans.
 */
export type SourceType = 'MOBILE_VIDEO' | 'DESKTOP_EXTENSION';

/**
 * Standard limitations for each source type.
 */
export const SOURCE_TYPE_LIMITATIONS: Record<SourceType, string[]> = {
  MOBILE_VIDEO: [
    'OCR accuracy varies with video quality and text size',
    'Brief on-screen labels may not be captured',
    'Audio disclosures are not detected',
    'Fast-scrolling may miss content',
  ],
  DESKTOP_EXTENSION: [
    'DOM structure varies by platform version',
    'Dynamic content may load after capture',
    'Private browsing may affect ad targeting',
  ],
};

/**
 * Get source-type-specific limitations.
 */
export function getSourceTypeLimitations(sourceType: SourceType): string[] {
  return SOURCE_TYPE_LIMITATIONS[sourceType] || [];
}

// =============================================================================
// Bundle Validation
// =============================================================================

/**
 * Validate an entire Evidence Bundle structure.
 */
export function validateBundle(bundle: {
  meta?: { platform?: string; n_items?: number };
  limits?: Partial<RequiredLimitsSection>;
  observations?: { coverage_report?: CoverageReport };
}): ClassificationValidationError[] {
  const errors: ClassificationValidationError[] = [];

  // Platform check
  if (bundle.meta?.platform) {
    if (!isSupportedPlatform(bundle.meta.platform)) {
      errors.push({
        code: 'UNSUPPORTED_PLATFORM',
        message: `Platform "${bundle.meta.platform}" is not supported`,
        severity: 'blocking',
      });
    }
  }

  // Sample size check
  if (bundle.meta?.n_items !== undefined && bundle.meta.n_items < SURFACING_THRESHOLDS.MIN_ITEMS_FOR_ANALYSIS) {
    errors.push({
      code: 'INSUFFICIENT_SAMPLE',
      message: `Only ${bundle.meta.n_items} items in scan. Minimum ${SURFACING_THRESHOLDS.MIN_ITEMS_FOR_ANALYSIS} required.`,
      severity: 'warning',
    });
  }

  // Limits section validation
  if (!bundle.limits) {
    errors.push({
      code: 'MISSING_LIMITS_SECTION',
      message: 'Bundle missing limits section',
      severity: 'blocking',
    });
  } else {
    errors.push(...validateLimitsSection(bundle.limits));
  }

  // Coverage check (if coverage report present)
  if (bundle.observations?.coverage_report) {
    errors.push(...validateCoverageReport(bundle.observations.coverage_report));
  }

  return errors;
}

// =============================================================================
// Coverage Contract (v1.1.0)
// =============================================================================

/**
 * Reason codes for coverage insufficiency.
 */
export type CoverageInsufficientReason =
  | 'low_item_count'           // Total items below minimum threshold
  | 'low_eligible_percentage'  // Percentage of classifiable items below threshold
  | 'high_exclusion_rate'      // Too many items excluded from analysis
  | 'missing_modalities'       // Required signal types unavailable for too many items
  | 'extraction_failures';     // Text/metadata extraction failed for too many items

/**
 * Coverage report structure per Coverage Contract.
 * Every Evidence Bundle MUST include this.
 */
export interface CoverageReport {
  // Counts
  total_items: number;
  eligible_items: number;
  excluded_items: number;

  // Percentages
  eligible_percent: number;
  coverage_percent: number;  // high-confidence / total

  // Sufficiency determination
  is_sufficient: boolean;
  insufficiency_reasons: CoverageInsufficientReason[];  // Empty if sufficient
}

/**
 * Validate a coverage report.
 * If coverage is insufficient, output MUST be UNKNOWN.
 */
export function validateCoverageReport(
  report: CoverageReport
): ClassificationValidationError[] {
  const errors: ClassificationValidationError[] = [];

  if (!report.is_sufficient && report.insufficiency_reasons.length === 0) {
    errors.push({
      code: 'INSUFFICIENT_COVERAGE_NO_REASON',
      message: 'Coverage insufficient but no reason provided',
      severity: 'critical',
    });
  }

  // Coverage sufficiency determines whether results can be surfaced
  if (!report.is_sufficient) {
    errors.push({
      code: 'COVERAGE_INSUFFICIENT',
      message: `Coverage insufficient: ${report.insufficiency_reasons.join(', ')}. Output must be UNKNOWN.`,
      severity: 'warning',  // Warning because this should trigger UNKNOWN, not block
    });
  }

  return errors;
}

/**
 * Create a coverage report from basic metrics.
 * Thresholds are NOT defined here - they must be passed in per classifier.
 */
export function createCoverageReport(
  totalItems: number,
  eligibleItems: number,
  excludedItems: number,
  highConfidenceItems: number,
  minItemThreshold: number,
  minPercentageThreshold: number
): CoverageReport {
  const eligiblePercent = totalItems > 0
    ? Math.round((eligibleItems / totalItems) * 1000) / 10
    : 0;

  const coveragePercent = totalItems > 0
    ? Math.round((highConfidenceItems / totalItems) * 1000) / 10
    : 0;

  const insufficiencyReasons: CoverageInsufficientReason[] = [];

  if (totalItems < minItemThreshold) {
    insufficiencyReasons.push('low_item_count');
  }

  if (eligiblePercent < minPercentageThreshold) {
    insufficiencyReasons.push('low_eligible_percentage');
  }

  const exclusionRate = totalItems > 0
    ? (excludedItems / totalItems) * 100
    : 0;

  if (exclusionRate > 50) {
    insufficiencyReasons.push('high_exclusion_rate');
  }

  return {
    total_items: totalItems,
    eligible_items: eligibleItems,
    excluded_items: excludedItems,
    eligible_percent: eligiblePercent,
    coverage_percent: coveragePercent,
    is_sufficient: insufficiencyReasons.length === 0,
    insufficiency_reasons: insufficiencyReasons,
  };
}

// =============================================================================
// Modality Authority (v1.1.0)
// =============================================================================

/**
 * Modality types available for classification.
 */
export type ModalityType = 'text' | 'vision' | 'audio' | 'metadata';

/**
 * Text modality sources.
 */
export type TextModalitySource = 'ocr' | 'caption' | 'hashtag';

/**
 * Extraction quality levels.
 */
export type ExtractionQuality = 'good' | 'partial' | 'failed';

/**
 * Modality availability report per item/scan.
 */
export interface ModalityAvailability {
  text: {
    available: boolean;
    source: TextModalitySource | null;
    extraction_quality: ExtractionQuality;
  };
  vision: {
    available: boolean;
    analyzed: boolean;
  };
  audio: {
    available: boolean;
    speech_detected: boolean;
  };
  metadata: {
    available: boolean;
    fields_present: string[];
  };
}

/**
 * What each modality CAN determine (authority).
 */
export const MODALITY_AUTHORITY = {
  text: {
    can_determine: [
      'topic_presence',
      'disclosure_labels',
      'explicit_statements',
      'commercial_language',
      'political_keywords',
      'entity_mentions',
    ],
    cannot_determine: [
      'user_intent',
      'why_content_posted',
      'sarcasm_or_irony',
      'truthfulness_of_claims',
      'political_beliefs_of_creator',
      'relationships_between_entities',
    ],
  },
  vision: {
    can_determine: [
      'political_context',
      'commercial_context',
      'setting_environment',
      'visual_disclosure_labels',
      'format_type',
    ],
    cannot_determine: [
      'political_intent',
      'purchase_intent',
      'user_location',
      'hidden_or_obscured_labels',
      'why_format_chosen',
    ],
  },
  audio: {
    can_determine: [
      'spoken_disclosures',
      'spoken_promotional_language',
      'spoken_political_statements',
      'presence_of_speech',
    ],
    cannot_determine: [
      'tone_or_emotional_state',
      'sincerity_of_endorsement',
      'political_beliefs_of_speaker',
    ],
  },
  metadata: {
    can_determine: [
      'platform_ad_labels',
      'creator_handle_id',
      'engagement_counts',
      'timestamp',
      'advertiser_info',
    ],
    cannot_determine: [
      'why_platform_labeled',
      'creator_intent',
      'user_behavior',
      'causal_relationships',
      'advertiser_goals',
    ],
  },
} as const;

/**
 * Check if a determination is within modality authority.
 */
export function isWithinModalityAuthority(
  modality: ModalityType,
  determination: string
): boolean {
  const authority = MODALITY_AUTHORITY[modality];
  return authority.can_determine.includes(determination as never);
}

/**
 * Check for modality violations.
 */
export function checkModalityViolations(
  modality: ModalityType,
  determinations: string[]
): string[] {
  const violations: string[] = [];
  const authority = MODALITY_AUTHORITY[modality];

  for (const det of determinations) {
    if (authority.cannot_determine.includes(det as never)) {
      violations.push(`${modality} modality cannot determine: ${det}`);
    }
  }

  return violations;
}

// =============================================================================
// Epistemic Boundaries (v1.1.0 Clarified)
// =============================================================================

/**
 * Categories of epistemic boundaries.
 */
export type EpistemicBoundaryCategory =
  | 'missing_modality'
  | 'low_confidence_extraction'
  | 'signal_conflict'
  | 'platform_limitation'
  | 'coverage_insufficiency'
  | 'algorithm_opacity'
  | 'user_state_unknown'
  | 'intent_unknown';

/**
 * Severity of epistemic boundary.
 */
export type EpistemicBoundarySeverity = 'fundamental' | 'significant' | 'minor';

/**
 * Structured epistemic boundary.
 */
export interface EpistemicBoundary {
  category: EpistemicBoundaryCategory;
  description: string;
  affected_items?: number;
  severity: EpistemicBoundarySeverity;
}

/**
 * Required epistemic boundaries that MUST appear in most bundles.
 */
export const REQUIRED_EPISTEMIC_BOUNDARIES = {
  algorithm_opacity: {
    category: 'algorithm_opacity' as const,
    description: 'We cannot know why the algorithm showed this content',
    severity: 'fundamental' as const,
  },
  user_beliefs: {
    category: 'user_state_unknown' as const,
    description: 'Content presence does not indicate your beliefs or preferences',
    severity: 'fundamental' as const,
  },
  user_interaction: {
    category: 'user_state_unknown' as const,
    description: 'We cannot see how you interacted with this content',
    severity: 'fundamental' as const,
  },
  single_session: {
    category: 'coverage_insufficiency' as const,
    description: 'This represents one scroll session, not your full feed',
    severity: 'significant' as const,
  },
} as const;

/**
 * Validate epistemic boundaries in a bundle.
 */
export function validateEpistemicBoundaries(
  boundaries: string[] | EpistemicBoundary[]
): ClassificationValidationError[] {
  const errors: ClassificationValidationError[] = [];

  // Must have at least 2
  if (boundaries.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_EPISTEMIC_BOUNDARIES',
      message: 'Bundle requires ≥2 epistemic boundaries',
      severity: 'blocking',
    });
  }

  // Check for at least one fundamental boundary
  const fundamentalPatterns = [
    'cannot know why',
    'does not indicate',
    'cannot see how you interacted',
  ];

  const boundaryTexts = boundaries.map(b =>
    typeof b === 'string' ? b.toLowerCase() : b.description.toLowerCase()
  );

  const hasFundamental = fundamentalPatterns.some(pattern =>
    boundaryTexts.some(text => text.includes(pattern))
  );

  if (!hasFundamental) {
    errors.push({
      code: 'NO_FUNDAMENTAL_BOUNDARY',
      message: 'Bundle should include at least one fundamental epistemic boundary',
      severity: 'critical',
    });
  }

  return errors;
}
