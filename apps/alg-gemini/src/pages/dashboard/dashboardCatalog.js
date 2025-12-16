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

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

// Tab-level trust sentences - conversational, not clinical
export const TAB_TRUST_SENTENCES = {
  ads: "What's trying to sell to you — not what you actually buy.",
  politics: "What political content shows up — not what you believe.",
  patterns: "What keeps appearing when you scroll.",
  creators: "Who shows up most — not necessarily who you follow.",
  algorithm: "How the platform seems to see you. This is our best guess.",
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
    title: 'How Much Is Selling to You',
    description: 'Posts the platform labels as ads or sponsored.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'These are posts the platform marks as ads or sponsored.',
    counterfactual: 'This might not match what you notice — some ads blend in.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      if (pct === 0) return "Almost none of your feed is ads right now.";
      if (pct < 10) return `Not much is ads — about ${pct}% of what you see.`;
      if (pct < 25) return `About 1 in ${Math.round(100/pct)} posts is trying to sell you something.`;
      return `A lot of your feed is ads — roughly 1 in ${Math.round(100/pct)} posts.`;
    },
    action: () => 'Spending time with non-promotional content may shift this.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Same Few Sellers?',
    description: 'Whether your ads come from many sources or just a handful.',
    outputType: 'text',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Looks at how many different accounts are behind your ads.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel || null,
    action: () => 'Muting frequent promoters may help.',
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Which App Has More Ads?',
    description: 'Compares how much each platform pushes promotions.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Compares ad rates across your scanned platforms.',
    takeaway: () => 'Not all platforms push ads equally.',
    action: () => 'You might prefer the platform with fewer ads.',
  },

  // --- COLLAPSED BY DEFAULT: Lower priority supporting details ---
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Possible Unlabeled Promotions',
    description: 'Content that looks promotional but isn\'t labeled as an ad.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Detected using patterns like discount codes or affiliate links. This is a rough estimate.',
    takeaway: (data) => data?.possibleInfluencePercent !== undefined
      ? `About ${data.possibleInfluencePercent}% may be unlabeled promotion.`
      : null,
    action: () => 'You could pay attention to product mentions in non-ad posts.',
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'What\'s Being Advertised',
    description: 'Product categories appearing in your promotional content.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Identified by matching product keywords in promotional posts.',
    takeaway: (data) => data?.length > 0
      ? 'These products appear most often in your ads.'
      : null,
    action: () => 'You could avoid engaging with product content you don\'t want more of.',
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
    title: 'What They Think You Want',
    description: 'The categories that keep showing up in your ads.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Based on what keeps appearing in your promotional content.',
    takeaway: (data) => data?.interests?.length > 0
      ? `Ads keep pushing ${data.interests[0]} at you${data.interests.length > 1 ? `, plus ${data.interests.slice(1).join(' and ')}` : ''}.`
      : null,
    action: () => 'Ignoring these categories may eventually shift what appears.',
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
    title: 'How Political Your Feed Is',
    description: 'Posts that touch on politics, policy, or current events.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'We look for mentions of elections, policy, and political figures.',
    counterfactual: 'This might feel different from what you notice — political posts can stand out more.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      if (pct === 0) return "Almost no political content right now.";
      if (pct < 10) return "Politics is a small part of what you see.";
      if (pct < 30) return `Politics shows up in about 1 in ${Math.round(100/pct)} posts.`;
      return "A lot of what you scroll through touches on politics.";
    },
    action: () => 'Following non-political accounts may shift the balance.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'politics',
    id: 'politics-balance',
    title: 'Perspective Balance',
    description: 'A rough estimate of whether your political content leans in any direction.',
    outputType: 'status',
    dataFn: 'getPoliticalBalanceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Uses keyword matching. This is LOW confidence and may miss nuance.',
    takeaway: (data) => data?.message || 'Rough estimate of political balance.',
    action: () => 'You could follow credible sources across perspectives.',
  },

  {
    tab: 'politics',
    id: 'politics-creators',
    title: 'Where It Comes From',
    description: 'The accounts behind most of your political content.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on how much political content each account posts.',
    takeaway: () => 'Most of the politics you see comes from just a few accounts.',
    action: () => 'Unfollowing one or two of these may noticeably reduce political content.',
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Which App Is More Political?',
    description: 'How political content compares across platforms.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compares how much political content each app shows you.',
    takeaway: () => 'Some apps push more politics than others.',
    action: () => 'When you want a break, try the lower-politics app.',
  },

  // --- COLLAPSED BY DEFAULT: Low confidence, opt-in required ---
  {
    tab: 'politics',
    id: 'politics-leaning',
    title: 'Perspective Distribution',
    description: 'Rough estimate of political lean. Low confidence.',
    outputType: 'text',
    dataFn: 'getPoliticalLeaningData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Simple keyword matching. Cannot detect nuance or context.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel || null,
    action: () => 'If one perspective dominates, your exposure may be narrowing.',
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Perspectives You Rarely See',
    description: 'Viewpoints that rarely appear in your feed.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Detected by absence of certain keywords. Very rough estimate.',
    takeaway: (data) => data?.message || 'Some perspectives may be underrepresented.',
    action: () => 'You could follow credible sources from underrepresented areas.',
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
    title: 'Your Political Feed Summary',
    description: 'Overview of political themes in your feed.',
    outputType: 'text',
    dataFn: 'getPoliticalProfileData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on political keywords detected across your scans.',
    takeaway: (data) => data?.politicalPercent !== undefined
      ? `${data.politicalPercent}% of your feed is political.`
      : null,
    action: () => 'You could diversify who you follow to shift the balance.',
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
    title: 'What Your Feed Is About',
    description: 'The topics that show up most when you scroll.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'We group posts by what they\'re about — fitness, news, entertainment, and so on.',
    counterfactual: 'This is what shows up, not necessarily what you asked for.',
    takeaway: (data) => {
      if (!data?.topicCount) return null;
      const top = data.topTopics?.[0]?.label;
      if (data.topicCount <= 3) return `Your feed sticks to just a few things${top ? ` — mostly ${top}` : ''}.`;
      if (data.topicCount <= 7) return `${top || 'A few topics'} dominates, with ${data.topicCount - 1} other topics mixed in.`;
      return `Your feed is pretty varied — ${data.topicCount} different topics, led by ${top || 'a few themes'}.`;
    },
    action: () => 'Searching for new things may broaden what shows up.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Seeing the Same Stuff?',
    description: 'Whether the same themes keep coming back.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Looks at whether a few topics dominate or if there\'s variety.',
    // PHASE 9: Qualitative concentration labels
    takeaway: (data) => data?.riskLevel || null,
    action: () => 'Following different creators may mix things up.',
  },

  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Topic Concentration',
    description: 'How much of your feed is concentrated in a few topics.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Measures what percentage falls into your top topics.',
    takeaway: (data) => data?.top3Percent !== undefined
      ? `${data.top3Percent}% of your feed is in your top 3 topics.`
      : null,
    action: () => 'You could engage with content outside your top topics.',
  },
  {
    tab: 'patterns',
    id: 'patterns-stability',
    title: 'How Much Your Feed Changes',
    description: 'Does your feed stay the same or change between sessions?',
    outputType: 'status',
    dataFn: 'getFeedStabilityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Measured by comparing topics and creators between scans.',
    takeaway: (data) => data?.stability
      ? `Your feed is ${data.stability.toLowerCase()}.`
      : null,
    action: () => 'You could follow new creators to inject variety.',
  },

  // --- COLLAPSED BY DEFAULT: Still available but de-emphasized ---
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional Tone',
    description: 'The overall emotional feel of your content.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Estimated using keyword patterns. Rough signal.',
    takeaway: (data) => data?.intensity
      ? `Your content tends to feel ${data.intensity.toLowerCase()}.`
      : null,
    action: () => 'You could reduce engagement with intense content.',
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
    title: 'The Short Version',
    description: 'What your feed patterns add up to.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'A summary of what keeps showing up and how varied it is.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Small changes in what you engage with can shift this.',
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
    title: 'Who You See the Most',
    description: 'The accounts that show up most often.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Based on how often each account shows up when you scroll.',
    counterfactual: 'This might surprise you — the algorithm has its favorites.',
    takeaway: (data) => {
      const top = data?.[0]?.creator;
      if (!top) return 'These accounts show up more than anyone else.';
      return `You see ${top} more than almost anyone else.`;
    },
    action: () => 'Following new accounts may shift who shows up.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'Same Few Voices?',
    description: 'Whether your feed is dominated by a handful of accounts.',
    outputType: 'text',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Looks at how much comes from just your top few accounts.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel || null,
    action: () => 'Following more accounts may spread things out.',
  },

  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'How Mixed Are Your Sources?',
    description: 'Whether you hear from many voices or just a few.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on how many different accounts show up.',
    takeaway: (data) => {
      if (!data?.diversity) return null;
      const d = data.diversity.toLowerCase();
      if (d === 'low') return "You're hearing from a pretty narrow set of voices.";
      if (d === 'high') return "You're hearing from a wide range of voices.";
      return "Your sources are somewhere in the middle.";
    },
    action: () => 'Adding different kinds of accounts may mix things up.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Same Voices Everywhere?',
    description: 'Accounts that follow you across apps.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Found by matching handles across your platforms.',
    takeaway: () => 'Some accounts show up no matter which app you open.',
    action: () => 'If someone appears everywhere, that voice is shaping a lot of what you see.',
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
    title: 'Who Shapes Your Feed',
    description: 'The voices that show up most consistently.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'These accounts appear consistently across your scans.',
    takeaway: () => 'These are the voices you hear from most.',
    action: () => 'Adjusting who you follow changes who you hear from.',
  },

  // ==========================================
  // TAB 5: WHAT THE ALGORITHM THINKS
  // Core question: "How might platforms be categorizing me?"
  // Primary (1): Topics liked - the single clearest answer
  // Secondary (2): Profile breadth, Consistent patterns
  // Collapsed (1): Future recommendations
  // Summary (1): How to change it
  // ==========================================

  // --- PRIMARY: The single most important algorithm metric ---
  {
    tab: 'algorithm',
    id: 'algo-topics-liked',
    title: 'What Keeps Showing Up',
    description: 'The topics the platform pushes to you most.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Based on what shows up most often when you scroll.',
    counterfactual: 'This might not match what you actually want to see.',
    takeaway: (data) => {
      const top = data?.[0]?.topic;
      if (!top) return 'These topics appear more than anything else.';
      return `${top} keeps showing up more than almost anything else.`;
    },
    action: () => 'Engaging with different content may shift what appears.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'Narrow or Wide?',
    description: 'Whether the platform sees you as having niche or broad interests.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on how many different topics show up for you.',
    takeaway: (data) => {
      if (!data?.breadth) return null;
      const b = data.breadth.toLowerCase();
      if (b === 'narrow') return "The platform seems to have you pegged as very specific.";
      if (b === 'broad') return "The platform shows you a wide range of things.";
      return "Your interests appear somewhere in the middle.";
    },
    action: () => 'Exploring new topics may widen what shows up.',
  },

  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'What It Keeps Giving You',
    description: 'Patterns that show up every time you scroll.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'These themes appear consistently across your scans.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'These patterns are sticky — shifting them takes time.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'Where This Is Heading',
    description: 'What you\'ll probably see more of soon.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Based on what\'s been trending in your recent scans. Just a guess.',
    takeaway: (data) => data?.predictions?.length > 0
      ? data.predictions.join(' ')
      : null,
    action: () => 'Changing what you engage with now may shift what comes next.',
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
    title: 'If You Want to Change Things',
    description: 'Ways to shift what the platform shows you.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Common strategies that work for most people. Results vary.',
    takeaway: () => 'The algorithm learns from repetition — so does unlearning.',
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
