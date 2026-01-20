/**
 * Dashboard Catalog - Phase 8: UX Simplification and Product Judgment
 *
 * PHASE 8 PRINCIPLES:
 * ===================
 * 1. ONE PRIMARY card per tab - the clearest, calmest, most legible answer
 * 2. At most 2 SECONDARY cards - supporting details only
 * 3. Everything else collapsed behind "See details"
 * 4. Language a non-technical user understands instantly
 * 5. Actions feel optional, not prescriptive ("you could try" not "you should")
 * 6. No moral tone - especially for politics, ads, or emotional content
 *
 * TAB CORE QUESTIONS:
 * - Ads & Influence: "How much is my feed trying to sell to me?"
 * - Politics & Worldview: "How much political content am I exposed to?"
 * - Patterns in Your Feed: "Is my feed varied or repetitive?"
 * - Creators & Voices: "Who shapes what I see the most?"
 * - What the Algorithm Thinks: "How might platforms be categorizing me?"
 *
 * Each view includes:
 * - tab: which tab it belongs to
 * - id: unique identifier
 * - title: display title (plain language, exposure-based)
 * - description: what this view shows
 * - outputType: number_line | bar | stacked100 | line | table | list | text | status
 * - dataFn: function name from dataHelpers to get data
 * - takeaway: function that returns takeaway string given data
 * - action: function that returns action string given data (optional)
 * - emptyStateType: 'needs_more_scans' | 'needs_broader_behavior' | 'future_feature'
 * - isPrimary: boolean - if true, this card appears first and is visually emphasized
 * - sortOrder: 'primary' | 'supporting' | 'future' | 'summary' - controls narrative flow
 * - hidden: boolean - if true, this view is not rendered at all
 * - collapsedByDefault: boolean - if true, this view starts collapsed (user can expand)
 * - whyExplanation: string - brief explanation of how insight was inferred
 * - counterfactual: string - (PRIMARY only) legitimizes disagreement
 */

import {
  FALLBACK_MIX_TOPICS_HEADLINE,
  isHeadlineExcludedLabel,
  pickHeadlineSafeLabels,
} from '../../lib/dashboard/headlineSafety';

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

// Tab-level trust sentences - grounded in observation, not identity
export const TAB_TRUST_SENTENCES = {
  ads: "Promotional content observed in this scan — not what you buy or want.",
  politics: "Political content that appeared — not what you believe or support.",
  patterns: "Topics that showed up in this scroll session.",
  creators: "Accounts that appeared in this scan — may differ from who you follow.",
  algorithm: "Patterns we observed. We cannot know how platforms actually categorize you.",
};

export const TABS = [
  { id: 'ads', label: 'Ads & Influence' },
  { id: 'politics', label: 'Politics & Worldview' },
  { id: 'patterns', label: 'Patterns in Your Feed' },
  { id: 'creators', label: 'Creators & Voices' },
  { id: 'algorithm', label: 'What the Algorithm Thinks' },
];

export const dashboardCatalog = [
  // ==========================================
  // TAB 1: ADS & INFLUENCE
  // Core question: "How much is my feed trying to sell to me?"
  // Primary (1): Ad percentage - the single clearest answer
  // Secondary (2): Ad concentration, Platform comparison
  // Summary (1): Advertiser insights
  // ==========================================

  // --- PRIMARY: The single most important ad metric ---
  {
    tab: 'ads',
    id: 'ads-percentage',
    title: 'Promotional Content in This Scan',
    description: 'Posts labeled as ads or sponsored by the platform.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'These are posts the platform explicitly labeled as ads or sponsored.',
    counterfactual: 'This may not match your perception — some ads blend in with regular content.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      if (pct === 0) return `In this scan, no posts were labeled as ads (${total} posts observed).`;
      if (total < 20) return `In this scan, ~${pct}% appeared to be ads (${Math.round(pct * total / 100)} of ${total} posts, limited sample).`;
      if (pct < 10) return `In this scan, approximately ${pct}% of posts were labeled as ads.`;
      if (pct < 25) return `In this scan, roughly 1 in ${Math.round(100/pct)} posts was labeled as an ad.`;
      return `In this scan, a substantial portion (~1 in ${Math.round(100/pct)} posts) was labeled as ads.`;
    },
    action: () => 'You could try spending time with non-promotional content to see if this shifts.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Ad Source Diversity',
    description: 'Whether ads came from many sources or just a few in this scan.',
    outputType: 'text',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted unique advertisers in this scan.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel ? `In this scan: ${data.qualitativeLabel}` : null,
    action: () => 'You could try muting specific advertisers to see if variety changes.',
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Ad Rates by Platform',
    description: 'How ad frequency compared across platforms scanned.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Compared ad labels observed on each scanned platform.',
    takeaway: () => 'Different platforms showed different ad frequencies in these scans.',
    action: () => 'You could try spending more time on platforms with fewer observed ads.',
  },

  // --- COLLAPSED BY DEFAULT: Lower priority supporting details ---
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Possibly Promotional (Unlabeled)',
    description: 'Content that matched promotional patterns but lacked ad labels.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Detected via patterns like discount codes or affiliate links. This is a rough estimate with significant uncertainty.',
    takeaway: (data) => data?.possibleInfluencePercent !== undefined
      ? `In this scan, approximately ${data.possibleInfluencePercent}% of content matched promotional patterns but lacked ad labels. (Low confidence estimate.)`
      : null,
    action: () => 'You could watch for product mentions in content that appears organic.',
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'Product Categories Observed',
    description: 'Categories mentioned in promotional content in this scan.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Matched product keywords in labeled ads. Does not indicate your interests.',
    takeaway: (data) => data?.length > 0
      ? 'These product categories appeared most often in ads in this scan.'
      : null,
    action: () => 'You could try avoiding engagement with product content to see if targeting shifts.',
  },

  // --- HIDDEN: Removed for cognitive load reduction ---
  {
    tab: 'ads',
    id: 'ads-trend',
    title: 'Changes in Advertising Over Time',
    description: 'Track how ad percentage has changed across your scans.',
    outputType: 'line',
    dataFn: 'getAdTrendData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.direction
      ? `Advertising in your feed is ${data.direction}.`
      : null,
    action: () => 'Small behavior changes usually shift this within a week.',
  },
  {
    tab: 'ads',
    id: 'ads-explicit-vs-hidden',
    title: 'Clearly Labeled Ads vs Possible Influence',
    description: 'Compare labeled advertising versus content that may be incentivized.',
    outputType: 'stacked100',
    dataFn: 'getAdsVsPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    confidenceDisclaimer: true,
    takeaway: () => 'Labeled ads alongside possible incentivized content.',
    action: () => 'Unlabeled influence is easier to miss.',
  },
  {
    tab: 'ads',
    id: 'ads-promo-creators',
    title: 'Who is Doing the Promoting',
    description: 'Creators who post the most promotional content in your feed.',
    outputType: 'table',
    dataFn: 'getPromoCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'A small set of creators drive most promotions.',
    action: () => 'Mute or unfollow high-promo creators.',
  },
  {
    tab: 'ads',
    id: 'ads-themes',
    title: 'Promotional Themes',
    description: 'Common product categories in promotional content.',
    outputType: 'bar',
    dataFn: 'getPromoThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    confidenceDisclaimer: true,
    takeaway: () => 'Promotions focus on these product categories.',
    action: () => 'Reduce engagement to stop reinforcing patterns.',
  },

  // --- SUMMARY: What this means for you ---
  {
    tab: 'ads',
    id: 'ads-advertiser-insights',
    title: 'Recurring Ad Categories',
    description: 'Product categories that appeared multiple times in this scan.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Based on product keywords in ads in this scan. We cannot know why these were shown to you.',
    takeaway: (data) => data?.interests?.length > 0
      ? `In this scan, ${data.interests[0]} appeared most frequently in ads${data.interests.length > 1 ? `, followed by ${data.interests.slice(1).join(' and ')}` : ''}.`
      : null,
    action: () => 'You could try ignoring these categories to see if ad targeting shifts over time.',
  },

  // ==========================================
  // TAB 2: POLITICS & WORLDVIEW
  // Core question: "How much political content am I exposed to?"
  // Primary (1): Political share - the single clearest answer
  // Secondary (2): Balance (opt-in), Who drives politics
  // Collapsed (2): Leaning breakdown, Blind spots
  // Summary (1): Political profile
  // ==========================================

  // --- PRIMARY: The single most important political metric ---
  {
    tab: 'politics',
    id: 'politics-share',
    title: 'Political Content in This Scan',
    description: 'Posts that matched political keywords or topics.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Matched keywords related to elections, policy, and political figures. Keyword matching has limitations.',
    counterfactual: 'This may not match your perception — political content may be more memorable.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      if (pct === 0) return `In this scan, no posts matched political keywords (${total} posts observed).`;
      if (total < 20) return `In this scan, ~${pct}% matched political keywords (${Math.round(pct * total / 100)} of ${total} posts, limited sample).`;
      if (pct < 10) return `In this scan, approximately ${pct}% of posts matched political keywords.`;
      if (pct < 30) return `In this scan, roughly 1 in ${Math.round(100/pct)} posts matched political keywords.`;
      return `In this scan, a substantial portion (~${pct}%) matched political keywords.`;
    },
    action: () => 'You could try following non-political accounts to see if this balance shifts.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'politics',
    id: 'politics-balance',
    title: 'Perspective Balance (Estimate)',
    description: 'A rough estimate of directional lean based on keyword matching.',
    outputType: 'status',
    dataFn: 'getPoliticalBalanceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Uses simple keyword matching. LOW confidence — cannot detect nuance, irony, or context.',
    takeaway: (data) => data?.message ? `${data.message} (Low confidence estimate from this scan.)` : 'Rough estimate of directional lean from keyword matching.',
    action: () => 'You could try following credible sources across perspectives to see if balance shifts.',
  },

  {
    tab: 'politics',
    id: 'politics-creators',
    title: 'Sources of Political Content',
    description: 'Accounts that posted the most political content in this scan.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted political keyword matches per account in this scan.',
    takeaway: () => 'In this scan, most political content came from a small number of accounts.',
    action: () => 'You could try unfollowing one or two to see if political volume changes.',
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Political Content by Platform',
    description: 'How political keyword matches compared across platforms scanned.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compared political keyword rates on each scanned platform.',
    takeaway: () => 'Different platforms showed different political content frequencies in these scans.',
    action: () => 'You could try spending time on lower-politics platforms when you want a break.',
  },

  // --- COLLAPSED BY DEFAULT: Low confidence, opt-in required ---
  {
    tab: 'politics',
    id: 'politics-leaning',
    title: 'Directional Lean (Low Confidence)',
    description: 'Very rough estimate of political lean based on keyword matching.',
    outputType: 'text',
    dataFn: 'getPoliticalLeaningData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Simple keyword matching only. Cannot detect nuance, irony, or full context. This is NOT a reliable measure.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel ? `${data.qualitativeLabel} (Low confidence — from keyword matching only.)` : null,
    action: () => 'If keywords from one perspective dominated this scan, you could try diversifying sources.',
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Absent Perspectives (Low Confidence)',
    description: 'Keywords that were absent from this scan.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Detected by absence of certain keywords in this scan. Very rough estimate — absence in one scan does not prove absence in your feed.',
    takeaway: (data) => data?.message ? `${data.message} (Based on this scan only.)` : 'Some keyword categories were absent from this scan.',
    action: () => 'You could try following sources from absent categories to see if exposure broadens.',
  },

  // --- HIDDEN: Removed for cognitive load reduction ---
  {
    tab: 'politics',
    id: 'politics-repetition',
    title: 'Political Repetition',
    description: 'How often you see the same political themes repeated.',
    outputType: 'number',
    dataFn: 'getPoliticalRepetitionData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    hidden: true,
    takeaway: () => 'You often see the same political ideas repeated.',
    action: () => 'Search and engage with different subtopics to widen the feed.',
  },
  {
    tab: 'politics',
    id: 'politics-tone',
    title: 'Political Tone',
    description: 'The emotional tone of political content in your feed.',
    outputType: 'bar',
    dataFn: 'getPoliticalToneData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    hidden: true,
    takeaway: () => 'Political content tends to feel calm or intense.',
    action: () => 'Mute accounts that post outrage content.',
  },
  {
    tab: 'politics',
    id: 'politics-trend',
    title: 'Change in Political Exposure Over Time',
    description: 'Track how political content percentage has changed.',
    outputType: 'line',
    dataFn: 'getPoliticalTrendData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.direction
      ? `Your political exposure has been ${data.direction}.`
      : null,
    action: () => 'Feeds shift quickly based on what you pause on and share.',
  },

  // --- SUMMARY: What this means for you ---
  {
    tab: 'politics',
    id: 'politics-profile',
    title: 'Political Content Summary',
    description: 'Summary of political keyword matches in this scan.',
    outputType: 'text',
    dataFn: 'getPoliticalProfileData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on political keywords detected in this scan. Does not reflect your beliefs or interests.',
    takeaway: (data) => data?.politicalPercent !== undefined
      ? `In this scan, approximately ${data.politicalPercent}% of content matched political keywords.`
      : null,
    action: () => 'You could try diversifying who you follow to see if the balance shifts.',
  },

  // ==========================================
  // TAB 3: PATTERNS IN YOUR FEED
  // Core question: "Is my feed varied or repetitive?"
  // Primary (1): Topic variety - the single clearest answer
  // Secondary (2): Repetition signal, Feed stability
  // Collapsed (1): Emotional weight
  // Summary (1): Pattern summary
  // ==========================================

  // --- PRIMARY: The single most important pattern metric ---
  {
    tab: 'patterns',
    id: 'patterns-topic-variety',
    title: 'Topics Observed in This Scan',
    description: 'Topics that appeared when this scroll session was captured.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Grouped posts by detected topic (fitness, news, entertainment, etc.). Classification is approximate.',
    counterfactual: 'This is what showed up in this scan — may not represent your typical feed.',
    takeaway: (data) => {
      if (!data) return null;

      const { labels } = pickHeadlineSafeLabels(data.topTopics, {
        getLabel: (t) => t?.label,
        limit: 2,
      });
      const [top, second] = labels;

      const total = data.totalPosts || 0;
      const unclassifiedShare = (data.topTopics || []).find((t) => (
        t?.isUnclassified || isHeadlineExcludedLabel(t?.label)
      ))?.value || 0;

      // Slice 6: If everything is Unclassified/Other, do not surface it in top-line copy.
      if (!data.topicCount || data.topicCount <= 0) {
        return FALLBACK_MIX_TOPICS_HEADLINE;
      }
      
      if (data.topicCount <= 3) {
        if (top && second) {
          return `In this scan, content clustered around ${data.topicCount} topics — primarily ${top} and ${second}${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''} (${total} posts observed).`;
        } else if (top) {
          return `In this scan, content clustered around ${data.topicCount} topics — primarily ${top}${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''} (${total} posts observed).`;
        }
        return `In this scan, content clustered around ${data.topicCount} topics${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''} (${total} posts observed).`;
      }
      if (data.topicCount <= 7) {
        if (top && second) {
          return `In this scan, ${top} and ${second} appeared most, with ${data.topicCount - 2} other topics present${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
        } else if (top) {
          return `In this scan, ${top} appeared most, with ${data.topicCount - 1} other topics present${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
        }
        return `In this scan, one topic appeared most, with ${data.topicCount - 1} other topics present${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
      }
      if (top && second) {
        return `In this scan, ${data.topicCount} different topics were detected, with ${top} and ${second} appearing most often${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
      } else if (top) {
        return `In this scan, ${data.topicCount} different topics were detected, with ${top} appearing most often${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
      }
      return `In this scan, ${data.topicCount} different topics were detected${unclassifiedShare > 20 ? '. Some posts couldn\'t be categorized yet' : ''}.`;
    },
    action: () => 'You could try searching for new topics to see if variety changes.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Topic Concentration in This Scan',
    description: 'Whether topics were spread out or concentrated in this scan.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measured topic distribution in this scan. Does not indicate a pattern over time.',
    // PHASE 9: Qualitative concentration labels
    takeaway: (data) => data?.riskLevel ? `In this scan: ${data.riskLevel}` : null,
    action: () => 'You could try following different creators to see if variety changes.',
  },

  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Top Topic Share',
    description: 'What portion of this scan fell into the top few topics.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Measured what percentage of this scan fell into the top 3 detected topics.',
    takeaway: (data) => data?.top3Percent !== undefined
      ? `In this scan, approximately ${data.top3Percent}% of content fell into the top 3 topics.`
      : null,
    action: () => 'You could try engaging with content outside these topics.',
  },
  {
    tab: 'patterns',
    id: 'patterns-stability',
    title: 'Feed Consistency (Requires Multiple Scans)',
    description: 'How topics compare across scans (requires 2+ scans).',
    outputType: 'status',
    dataFn: 'getFeedStabilityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compares topics and creators between scans. Requires multiple scans to measure.',
    takeaway: (data) => data?.stability
      ? `Across your scans, feed content appeared ${data.stability.toLowerCase()}.`
      : 'Insufficient scans to measure stability.',
    action: () => 'You could try following new creators to see if variety increases.',
  },

  // --- COLLAPSED BY DEFAULT: Still available but de-emphasized ---
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional Tone (Estimate)',
    description: 'Estimated emotional tone of content in this scan.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Estimated using keyword patterns. Very rough signal — sentiment analysis has significant limitations.',
    takeaway: (data) => data?.intensity
      ? `In this scan, content appeared to lean ${data.intensity.toLowerCase()} (rough estimate).`
      : null,
    action: () => 'You could try reducing engagement with intense content to see if tone shifts.',
  },
  {
    tab: 'patterns',
    id: 'manipulative-patterns',
    title: 'Attention tactics',
    description: 'Posts that contained patterns often associated with attention-grabbing tactics.',
    outputType: 'number_line',
    dataFn: 'getManipulativePatternsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on patterns we detected, these posts contained wellbeing themes or engagement hooks. Context matters — not all urgency is manipulative.',
    takeaway: (data) => {
      if (!data) return null;
      const count = data.flaggedCount || 0;
      const total = data.totalPosts || 0;
      const pct = data.currentPercent || 0;
      if (count === 0) return `In this scan, no posts contained patterns often associated with attention-grabbing tactics (${total} posts observed).`;
      if (total < 20) return `In this scan, ${count} of ${total} posts contained patterns often associated with attention-grabbing tactics (${pct}%, limited sample).`;
      return `In this scan, ${count} post${count !== 1 ? 's' : ''} (${pct}%) contained patterns often associated with attention-grabbing tactics.`;
    },
    action: () => 'You could try reducing engagement with content that uses urgency language or engagement hooks.',
  },

  // --- HIDDEN: Removed for cognitive load reduction ---
  {
    tab: 'patterns',
    id: 'patterns-sentiment-balance',
    title: 'Negative vs Positive Balance',
    description: 'Distribution of positive, neutral, and negative content.',
    outputType: 'stacked100',
    dataFn: 'getSentimentBalanceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'Content sentiment distribution in your feed.',
    action: () => 'Interact with uplifting accounts if negative is high.',
  },
  {
    tab: 'patterns',
    id: 'patterns-discovery',
    title: 'Discovery Rate',
    description: 'Percentage of content from new creators.',
    outputType: 'number',
    dataFn: 'getDiscoveryRateData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.discoveryRate !== undefined
      ? `${data.discoveryRate}% of creators were new.`
      : null,
    action: () => 'Like and save content from new accounts.',
  },
  {
    tab: 'patterns',
    id: 'patterns-rare-content',
    title: 'Topics That Rarely Show Up',
    description: 'Topics that appear infrequently in your feed.',
    outputType: 'list',
    dataFn: 'getRareContentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.rareTopics?.length > 0
      ? `These topics rarely appear.`
      : 'Your feed has fairly even topic distribution.',
    action: () => 'Engage with missing topics for a broader feed.',
  },
  {
    tab: 'patterns',
    id: 'patterns-intensity-spikes',
    title: 'Intensity Spikes',
    description: 'When intense or negative content peaks.',
    outputType: 'line',
    dataFn: 'getIntensitySpikesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'Some periods show spikes in intense content.',
    action: () => 'Take a break or reset engagement signals during spikes.',
  },

  // --- SUMMARY: What this means for you ---
  {
    tab: 'patterns',
    id: 'patterns-summary',
    title: 'Summary of This Scan',
    description: 'What this snapshot showed about topic distribution.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'A summary of topics detected in this scan. Does not indicate patterns over time.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'You could try changing what you engage with to see if topics shift.',
  },

  // ==========================================
  // TAB 4: CREATORS & VOICES
  // Core question: "Who shapes what I see the most?"
  // Primary (1): Top creators - the single clearest answer
  // Secondary (2): Creator concentration, Voice diversity
  // Collapsed (1): Cross-platform overlap
  // Summary (1): Who shapes your feed
  // ==========================================

  // --- PRIMARY: The single most important creator metric ---
  {
    tab: 'creators',
    id: 'creators-top',
    title: 'Accounts That Appeared Most',
    description: 'Accounts that showed up most often in this scan.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Counted how often each account appeared in this scan.',
    counterfactual: 'This may not match who you follow or expect — it is what appeared in this specific scroll session.',
    takeaway: (data) => {
      const top = data?.[0]?.creator;
      const total = data?.[0]?.postCount || 0;
      if (!top) return 'These accounts appeared most often in this scan.';
      return `In this scan, ${top} appeared ${total > 1 ? `${total} times` : 'most often'}.`;
    },
    action: () => 'You could try following new accounts to see if the mix changes.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'Source Concentration',
    description: 'Whether content came from many accounts or just a few in this scan.',
    outputType: 'text',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measured how much of this scan came from the top few accounts.',
    takeaway: (data) => data?.primaryInsight ? data.primaryInsight : null,
    action: () => 'You could try following more accounts to see if concentration decreases.',
  },

  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'Source Diversity in This Scan',
    description: 'How many different accounts appeared in this scan.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted unique accounts in this scan.',
    takeaway: (data) => {
      if (!data?.diversity) return null;
      const d = data.diversity.toLowerCase();
      if (d === 'low') return "In this scan, a narrow set of accounts appeared.";
      if (d === 'high') return "In this scan, a wide range of accounts appeared.";
      return "In this scan, source diversity was moderate.";
    },
    action: () => 'You could try adding different accounts to see if diversity increases.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Cross-Platform Accounts',
    description: 'Accounts that appeared on multiple scanned platforms.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Matched handles across scanned platforms.',
    takeaway: () => 'These accounts appeared across multiple platforms in your scans.',
    action: () => 'Accounts appearing on multiple platforms may have outsized influence on what you see.',
  },

  // --- HIDDEN: Removed for cognitive load reduction ---
  {
    tab: 'creators',
    id: 'creators-new-vs-familiar',
    title: 'New vs Familiar Creators',
    description: 'Breakdown of content from new versus repeat creators.',
    outputType: 'stacked100',
    dataFn: 'getNewVsFamiliarData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'Your feed mix of new and familiar creators.',
    action: () => 'Interact with unfamiliar accounts to discover more.',
  },
  {
    tab: 'creators',
    id: 'creators-driving-ads',
    title: 'Creators Driving Ads',
    description: 'Which creators contribute the most promotional content.',
    outputType: 'table',
    dataFn: 'getPromoCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'These creators contribute most promotional content.',
    action: () => 'Mute high-promo creators to reduce ads.',
  },
  {
    tab: 'creators',
    id: 'creators-driving-politics',
    title: 'Creators Driving Politics',
    description: 'Which creators contribute the most political content.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'These creators drive most political exposure.',
    action: () => 'Unfollow top drivers if you want less politics.',
  },
  {
    tab: 'creators',
    id: 'creators-by-topic',
    title: 'Creators by Topic',
    description: 'Which creators dominate which topics in your feed.',
    outputType: 'table',
    dataFn: 'getCreatorsByTopicData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.takeaway || 'Different creators dominate different topics.',
    action: () => 'Follow creators in topics you want more of.',
  },
  {
    tab: 'creators',
    id: 'creators-by-tone',
    title: 'Creators by Emotional Tone',
    description: 'Which creators consistently post intense content.',
    outputType: 'table',
    dataFn: 'getCreatorsByToneData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'Some creators consistently post intense content.',
    action: () => 'Mute accounts if intense content affects you.',
  },

  // --- SUMMARY: What this means for you ---
  {
    tab: 'creators',
    id: 'creators-influential',
    title: 'Most Frequent Sources',
    description: 'Accounts that appeared most often in your scans.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on appearance frequency in your scans. Does not indicate your preferences.',
    takeaway: () => 'These accounts appeared most frequently in your scans.',
    action: () => 'You could try adjusting who you follow to see if the source mix changes.',
  },

  // ==========================================
  // TAB 5: OBSERVED PATTERNS
  // Core question: "What patterns appeared in this scan?"
  // NOTE: We CANNOT know what the algorithm "thinks" - only what appeared
  // Primary (1): Topics observed - the single clearest answer
  // Secondary (2): Topic breadth, Recurring themes
  // Collapsed (1): Possible future content
  // Summary (1): Possible experiments
  // ==========================================

  // --- PRIMARY: The single most important pattern metric ---
  {
    tab: 'algorithm',
    id: 'algo-topics-liked',
    title: 'Topics That Appeared Most',
    description: 'Topics that showed up most frequently in this scan.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Counted topic occurrences in this scan. Does not indicate what the platform "thinks" about you.',
    counterfactual: 'This is what appeared in this scan — may not match what you want or expect.',
    takeaway: (data) => {
      const { labels, hadExcluded } = pickHeadlineSafeLabels(data, {
        getLabel: (t) => t?.topic,
        limit: 1,
      });
      const top = labels[0];
      const count = top
        ? (Array.isArray(data) ? data.find((t) => t?.topic === top) : null)?.count || 0
        : 0;

      if (!top) {
        return hadExcluded ? FALLBACK_MIX_TOPICS_HEADLINE : 'These topics appeared most often in this scan.';
      }
      return `In this scan, ${top} appeared most frequently${count > 1 ? ` (${count} times)` : ''}.`;
    },
    action: () => 'You could try engaging with different content to see if topics shift.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'Topic Breadth in This Scan',
    description: 'Whether topics were concentrated or spread out in this scan.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted distinct topics in this scan. Does not indicate how the platform categorizes you.',
    takeaway: (data) => {
      if (!data?.breadth) return null;
      const b = data.breadth.toLowerCase();
      if (b === 'narrow') return "In this scan, content concentrated around few topics.";
      if (b === 'broad') return "In this scan, a wide range of topics appeared.";
      return "In this scan, topic breadth was moderate.";
    },
    action: () => 'You could try exploring new topics to see if variety increases.',
  },

  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'Recurring Themes (Requires Multiple Scans)',
    description: 'Topics that appeared across multiple scans.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Compared topics across scans. Requires multiple scans to identify recurring themes.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : 'Requires multiple scans to identify recurring themes.',
    action: () => 'Topics that recur across scans may be more persistent — shifting them may take sustained effort.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'Possible Future Content (Speculation)',
    description: 'Speculation about what might appear based on observed patterns.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Based on topic trends across scans. This is speculation — we cannot predict what platforms will show.',
    takeaway: (data) => data?.predictions?.length > 0
      ? `Speculation: ${data.predictions.join(' ')}`
      : null,
    action: () => 'You could try changing what you engage with to see if content shifts.',
  },

  // --- HIDDEN: Removed for cognitive load reduction ---
  {
    tab: 'algorithm',
    id: 'algo-topics-avoided',
    title: 'Topics That Rarely Show Up For You',
    description: 'Topics that rarely appear in your feed.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsAvoidedData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.topics?.length > 0
      ? 'These topics rarely appear.'
      : 'No topics are significantly underrepresented.',
    action: () => 'Search and follow accounts in those areas.',
  },
  {
    tab: 'algorithm',
    id: 'algo-products',
    title: 'Product Categories You\'re Shown',
    description: 'Product categories that appear repeatedly in ads you\'re shown.',
    outputType: 'bar',
    dataFn: 'getAlgoProductsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    confidenceDisclaimer: true,
    takeaway: () => 'These product categories appear frequently in ads you\'re shown.',
    action: () => 'Reducing engagement with product content may shift targeting.',
  },
  {
    tab: 'algorithm',
    id: 'algo-political-themes',
    title: 'Political Themes You\'re Shown',
    description: 'Political themes that appear frequently in your feed.',
    outputType: 'list',
    dataFn: 'getAlgoPoliticalThemesData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    hidden: true,
    takeaway: () => 'These political themes appear frequently in what you\'re shown.',
    action: () => 'Diversify what you watch and follow.',
  },
  {
    tab: 'algorithm',
    id: 'algo-emotional-triggers',
    title: 'Emotional Content Patterns',
    description: 'Emotional content types that appear most often in your feed.',
    outputType: 'bar',
    dataFn: 'getAlgoEmotionalTriggersData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: () => 'Content with these emotional tones appears more often in your feed.',
    action: () => 'Reducing engagement with certain emotional content may shift what you\'re shown.',
  },
  {
    tab: 'algorithm',
    id: 'algo-uncertain',
    title: 'Variable Patterns',
    description: 'Areas with high variance across your scans.',
    outputType: 'text',
    dataFn: 'getAlgoUncertainData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Engage consistently with what you want to see more of.',
  },

  // --- SUMMARY: What this means for you ---
  {
    tab: 'algorithm',
    id: 'algo-change-advice',
    title: 'Possible Experiments',
    description: 'Actions you could try to see if content shifts.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'General strategies that may influence what appears. We cannot guarantee results.',
    takeaway: () => 'These are experiments you could try — results may vary and we cannot predict outcomes.',
    action: null,
  },
];

// Sort order priority (for narrative flow)
const SORT_ORDER_PRIORITY = {
  primary: 1,
  supporting: 2,
  future: 3,
  summary: 4,
};

/**
 * Get views for a specific tab, filtering out hidden views
 * PHASE 6B: Hidden views are completely excluded from rendering
 * @param {string} tabId - The tab ID
 * @param {Object} options - Options for filtering
 * @param {boolean} options.includeHidden - Include hidden views (for debugging)
 * @returns {Array} Sorted array of views
 */
export const getViewsForTab = (tabId, options = {}) => {
  const { includeHidden = false } = options;

  return dashboardCatalog
    .filter((view) => {
      // Must match tab
      if (view.tab !== tabId) return false;
      // Filter out hidden views unless explicitly requested
      if (!includeHidden && view.hidden) return false;
      return true;
    })
    .sort((a, b) => {
      const orderA = SORT_ORDER_PRIORITY[a.sortOrder] || 2;
      const orderB = SORT_ORDER_PRIORITY[b.sortOrder] || 2;
      return orderA - orderB;
    });
};

/**
 * Get count of visible views for a tab (excludes hidden)
 * @param {string} tabId - The tab ID
 * @returns {number} Count of visible views
 */
export const getVisibleViewCount = (tabId) => {
  return getViewsForTab(tabId).length;
};

// Helper function to get a specific view by ID
export const getViewById = (viewId) => {
  return dashboardCatalog.find((view) => view.id === viewId);
};
