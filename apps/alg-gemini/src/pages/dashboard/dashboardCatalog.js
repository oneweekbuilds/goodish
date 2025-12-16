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

// Tab-level trust sentences - simplified for Phase 8
export const TAB_TRUST_SENTENCES = {
  ads: 'This shows promotional patterns in your feed, not what you buy.',
  politics: 'This shows political content exposure, not your views.',
  patterns: 'This shows what appears repeatedly in your feed.',
  creators: 'This shows who appears most often, not necessarily who you follow.',
  algorithm: 'This shows rough estimates of how platforms may categorize you.',
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
    title: 'Ads in Your Feed',
    description: 'Posts labeled as ads or sponsored content.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Counted from posts explicitly labeled as ads or sponsored.',
    counterfactual: 'This may differ from what you notice if your recent browsing has changed.',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `${data.currentPercent}% of your feed is advertising.`
      : null,
    action: () => 'You could try engaging more with non-commercial creators.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Where Promotions Come From',
    description: 'Are promotions coming from many sources or just a few?',
    outputType: 'text',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measures how many accounts produce the promotional content you see.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel || null,
    action: () => 'You could mute accounts that post frequent promotions.',
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Ads by Platform',
    description: 'Which platforms show you the most promotional content.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Compares ad rates across the platforms you\'ve scanned.',
    takeaway: () => 'Some platforms show more ads than others.',
    action: () => 'You could spend less time on high-ad platforms.',
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
    title: 'What Advertisers Think You Like',
    description: 'Categories that appear repeatedly in ads you\'re shown.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Based on product categories that appear repeatedly in your ads.',
    takeaway: (data) => data?.interests?.length > 0
      ? `Your ads focus on: ${data.interests.join(', ')}.`
      : null,
    action: () => 'You could engage with different content to shift what gets advertised to you.',
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
    title: 'Political Content in Your Feed',
    description: 'Posts containing political themes or topics.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Detected using keyword matching for political topics.',
    counterfactual: 'This may differ from what you notice if you engage with politics differently than what appears.',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `${data.currentPercent}% of your feed is political.`
      : null,
    action: () => 'You could follow more non-political creators.',
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
    title: 'Who Posts Political Content',
    description: 'Accounts that contribute the most political posts to your feed.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted by political keywords per creator.',
    takeaway: () => 'A few accounts produce most of your political content.',
    action: () => 'You could unfollow accounts to reduce political posts.',
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Politics by Platform',
    description: 'Which platforms show you the most political content.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compares political content rates across platforms.',
    takeaway: () => 'Political content varies by platform.',
    action: () => 'You could use lower-politics platforms for a break.',
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
    title: 'Topics in Your Feed',
    description: 'How many different topics appear in your content.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Counted by matching content to topic categories.',
    counterfactual: 'This may differ from your interests if the algorithm shows you things you didn\'t seek out.',
    takeaway: (data) => data?.topicCount !== undefined
      ? `Your feed covers ${data.topicCount} different topics.`
      : null,
    action: () => 'You could search for new interests to expand your topics.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Content Repetition',
    description: 'Whether you\'re seeing the same topics repeatedly.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measured by how concentrated your content is in a small number of topics.',
    // PHASE 9: Qualitative concentration labels
    takeaway: (data) => data?.riskLevel || null,
    action: () => 'You could follow creators outside your usual themes.',
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
    title: 'Your Feed Patterns Summary',
    description: 'Overview of variety and repetition in your feed.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on topic distribution and repetition across your scans.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Small habit changes can shift patterns over time.',
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
    title: 'Your Top Creators',
    description: 'The 5 accounts that appear most in your feed.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Ranked by post count across your scans.',
    counterfactual: 'This may not reflect recent changes in who you follow.',
    takeaway: () => 'These 5 creators appear most in your feed.',
    action: () => 'You could diversify your follows to see different creators.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'Creator Concentration',
    description: 'How much of your feed comes from just a few accounts.',
    outputType: 'text',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measures what percentage comes from your top creators.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => data?.qualitativeLabel || null,
    action: () => 'You could follow more accounts for more variety.',
  },

  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'Source Variety',
    description: 'How varied the sources in your feed are.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Estimated by measuring creator count and distribution.',
    takeaway: (data) => data?.diversity
      ? `Your source variety is ${data.diversity.toLowerCase()}.`
      : null,
    action: () => 'You could add sources from different backgrounds.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Creators Across Platforms',
    description: 'Creators appearing on multiple platforms you use.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Found by matching handles across platforms.',
    takeaway: () => 'Some creators appear across multiple platforms.',
    action: () => 'You could diversify if one voice appears everywhere.',
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
    title: 'Your Creators Summary',
    description: 'Overview of who shapes your feed.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on frequency of appearance across your scans.',
    takeaway: () => 'These accounts appear most consistently in your feed.',
    action: () => 'You could adjust who you follow to shift what you see.',
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
    title: 'What the Algorithm Shows You Most',
    description: 'Topics you see most frequently.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Based on which topics appear most in your scans.',
    counterfactual: 'This may differ from your actual interests.',
    takeaway: () => 'The algorithm shows you these topics most often.',
    action: () => 'You could engage with different topics to retrain your feed.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'Profile Breadth',
    description: 'Is your algorithmic profile narrow or broad?',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Estimated by measuring topic concentration.',
    takeaway: (data) => data?.breadth
      ? `Your profile appears ${data.breadth.toLowerCase()}.`
      : null,
    action: () => 'You could explore new topics to broaden your profile.',
  },

  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'Consistent Patterns',
    description: 'Patterns that appear consistently in your feed.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on signals that remain stable across scans.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Changing patterns requires repeated, different engagement.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'What You May See Next',
    description: 'Content you\'ll likely see more of.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Projected from trending topics in your recent scans. Speculative.',
    takeaway: (data) => data?.predictions?.length > 0
      ? data.predictions.join(' ')
      : null,
    action: () => 'You could change your engagement to shift future recommendations.',
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
    title: 'How to Shift Your Feed',
    description: 'Actions that may help change what you see.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Suggestions based on common patterns. Results vary.',
    takeaway: () => 'Small, repeated behavior changes can shift what you see.',
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
