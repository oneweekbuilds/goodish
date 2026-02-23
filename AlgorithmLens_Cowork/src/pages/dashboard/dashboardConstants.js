/**
 * Dashboard Constants
 * Centralized theme, surface, and configuration values
 */

/**
 * THEME CONSTANTS - Part 1 Color System
 * Rule A: All 5 dashboard tabs use BLUE theme
 * Rule B: Talk to Your Algorithm module uses GREEN theme everywhere
 */
export const THEME = {
  // Blue theme for all tabs (consistent, calm editorial product)
  blue: {
    accent: '#2563EB',
    accentLight: 'rgba(37, 99, 235, 0.1)',
    accentMedium: 'rgba(37, 99, 235, 0.15)',
    gradient: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.06) 50%, rgba(37, 99, 235, 0.02) 100%)',
    border: 'rgba(37, 99, 235, 0.12)',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.06)',
  },
  // Green theme ONLY for Talk to Your Algorithm module (premium standout)
  green: {
    accent: '#10B981',
    accentLight: 'rgba(16, 185, 129, 0.1)',
    accentMedium: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
    border: 'rgba(16, 185, 129, 0.15)',
    shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  },
};

/**
 * SOLID SURFACE TOKENS - Solid Surfaces Strategy
 * Replace translucent everywhere with solid, intentional surfaces
 */
export const SURFACES = {
  // Hero chapter - solid light blue background
  HERO_BLUE: {
    background: '#EFF6FF', // solid light blue
    border: '1px solid #BFDBFE',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.08)',
  },
  // Support cards in hero - solid white with clear border
  SUPPORT_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  // Talk chapter - solid light green background
  TALK_GREEN: {
    background: '#ECFDF5', // solid light green
    border: '1px solid #A7F3D0',
    shadow: '0 4px 24px rgba(16, 185, 129, 0.1)',
  },
  // Content sections - solid white with border
  SECTION_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
  // Alternating tint for visual rhythm
  SECTION_TINT: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
};

/**
 * Story-driven section header config for ALL tabs
 * These headers guide the reader through observations, NOT predictions
 * All language grounded in "this scan" and observation, not identity or intent
 */
export const TAB_STORY_HEADERS = {
  algorithm: {
    keyInsight: {
      label: 'Observed',
      title: 'Content patterns during this window',
      subtext: 'What content appeared based on your recent activity.',
    },
    details: {
      label: 'Context',
      title: 'Recurring themes',
      subtext: 'Themes that appeared repeatedly across your scans.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'Extrapolated future associations',
      subtext: 'If patterns continue, the system might associate you with these themes. Pure speculation.',
    },
    summary: {
      label: 'Summary',
      title: 'Current algorithmic interpretation',
      subtext: 'How the system appears to be categorizing you based on observed patterns.',
    },
  },
  ads: {
    keyInsight: {
      label: 'Observed',
      title: 'Commercial content in your feed',
      subtext: 'What share of your feed contains labeled ads and promotional content.',
    },
    details: {
      label: 'Context',
      title: 'Where commercial content comes from',
      subtext: 'Which advertisers and platforms account for the most commercial content during this window.',
    },
    moreDetails: {
      label: 'Speculation',
      title: 'Additional detail from the same window',
      subtext: 'Optional deeper cuts from the same window. We cannot predict.',
    },
    summary: {
      label: 'Experiments',
      title: 'What you could try',
      subtext: 'Optional actions if you want to test changes in upcoming scans.',
    },
  },
  politics: {
    keyInsight: {
      label: 'Observed',
      title: 'Political keywords during this window',
      subtext: 'Measures exposure to political content, not belief formation.',
    },
    details: {
      label: 'Context',
      title: 'Where political exposure comes from',
      subtext: 'Which accounts and platforms drove political keywords during this window.',
    },
    moreDetails: {
      label: 'Additional detail',
      title: 'How this is measured',
      subtext: 'We look for political terms in post text and captions within your scans. We count how often those terms appear and which accounts they appear from. This does not estimate your viewpoint. It only summarizes what appeared in the feed content you scanned.',
    },
    summary: {
      label: 'Summary',
      title: 'Political keyword patterns',
      subtext: 'Observed patterns during this window.',
    },
  },
  patterns: {
    keyInsight: {
      label: 'Observed',
      title: 'Topics during this window',
      subtext: 'What surfaced. Patterns in exposure, not preference.',
    },
    details: {
      label: 'Context',
      title: 'How topics distributed',
      subtext: 'Where repetition formed and where variety emerged.',
    },
    moreDetails: {
      label: 'Additional detail',
      title: 'Pattern movement from this window',
      subtext: 'How themes shifted. Narrowing, broadening, or stabilizing.',
    },
    summary: {
      label: 'Summary',
      title: 'Topic patterns observed',
      subtext: 'Movement detected during this window.',
    },
  },
  // FIX C9: Clarified "More details" organization with specific labels
  creators: {
    keyInsight: {
      label: 'Observed',
      title: 'Influence during this window',
      subtext: 'Which accounts shaped what you saw. What appeared, not who you are.',
    },
    details: {
      label: 'Context',
      title: 'How influence concentrated',
      subtext: 'Whether a few voices dominated or many contributed.',
    },
    moreDetails: {
      label: 'Cross-platform presence',
      title: 'Accounts that appeared in multiple spaces',
      subtext: 'Voices that reached you across different platforms.',
    },
    summary: {
      label: 'Summary',
      title: 'Which creators dominate your feed',
      subtext: 'This section summarizes recurring patterns in which accounts dominate your scanned feed, such as repeated appearances or tight clustering around a small set of creators. It does not judge quality or intent.',
    },
  },
};

// Legacy alias for backward compatibility
export const ALGORITHM_TAB_HEADERS = TAB_STORY_HEADERS.algorithm;

// Curated supporting view whitelists per tab (deterministic)
export const CURATED_SUPPORTING_BY_TAB = {
  ads: ['ads-concentration', 'ads-by-platform', 'ads-products'],
  politics: ['politics-creators', 'politics-platform-compare', 'politics-profile'],
  patterns: ['patterns-echo-risk', 'repetition-patterns', 'patterns-repeated-themes'],
  creators: ['creators-concentration', 'creators-voice-diversity', 'creators-new-vs-familiar'],
  algorithm: ['algorithm-profile-breadth', 'algorithm-recurring-themes', 'algorithm-future-recommendations'],
};

// HERO_VIEW_ID_BY_TAB - Deterministic hero metric per tab (Slice 2).
// This is the single source of truth for hero selection in v1.
export const HERO_VIEW_ID_BY_TAB = {
  ads: 'ads-percentage',
  politics: 'politics-share',
  patterns: 'patterns-topic-variety',
  creators: 'creators-top',
  algorithm: 'algo-topics-liked',
};
