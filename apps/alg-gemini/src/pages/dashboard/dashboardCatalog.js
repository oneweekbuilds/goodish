/**
 * Dashboard Catalog - Phase 7: Belief Calibration and Trust Framing
 *
 * Each view includes:
 * - tab: which tab it belongs to
 * - id: unique identifier
 * - title: display title (PHASE 7: exposure-based, not intent-based)
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
 * - whyExplanation: string - PHASE 7: brief explanation of how insight was inferred
 * - counterfactual: string - PHASE 7: (PRIMARY only) legitimizes disagreement
 *
 * PHASE 7 PRINCIPLES:
 * ===================
 * 1. Patterns, not truths - never imply intent, belief, desire, or motivation
 * 2. Always frame insights as exposure, repetition, or association
 * 3. Explain why an insight exists (whyExplanation)
 * 4. Acknowledge uncertainty proactively
 * 5. Invite reflection, not compliance
 * 6. No moralizing - especially for politics, ads, or emotional tone
 *
 * TAB NARRATIVE QUESTIONS:
 * - Ads & Influence: "What's being sold to me and how?"
 * - Politics & Worldview: "How politically skewed is my feed?"
 * - Patterns in Your Feed: "Is my feed diverse or repetitive?"
 * - Creators & Voices: "Who dominates what I see?"
 * - What the Algorithm Thinks: "What does the algorithm believe about me?"
 */

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

// PHASE 7: Tab-level trust sentences
export const TAB_TRUST_SENTENCES = {
  ads: 'These insights summarize repeated promotional patterns across your scans, not individual posts or purchases.',
  politics: 'These insights reflect content exposure based on keywords and patterns, not your actual political views or beliefs.',
  patterns: 'These insights show what appears repeatedly in your feed. If something feels off, your behavior may be changing faster than these patterns.',
  creators: 'These insights show which voices appear most often. This reflects algorithmic surfacing, not necessarily who you follow or prefer.',
  algorithm: 'These are rough estimates of how platforms may categorize you based on content patterns. They reflect exposure, not identity.',
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
  // Core question: "What's being sold to me and how?"
  // Primary (3): Ad percentage, Ad concentration, Platforms
  // Secondary (2): Possible promo, Products mentioned
  // Summary (1): Advertiser insights
  // ==========================================

  // --- PRIMARY: Core metrics about advertising load ---
  {
    tab: 'ads',
    id: 'ads-percentage',
    title: 'How Much of Your Feed is Advertising',
    description: 'The percentage of posts clearly labeled as ads or sponsored content.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Based on posts explicitly labeled as ads or sponsored across your scans.',
    counterfactual: 'This may feel higher or lower than expected if your recent browsing differs from your scan history.',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `About ${data.currentPercent}% of the content you're shown is advertising.`
      : null,
    action: () => 'Engaging more with non-commercial creators may gradually reduce ad density.',
  },
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Where Promotions Come From',
    description: 'How much promotional content comes from a small set of sources.',
    outputType: 'number',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Calculated by measuring how many creators account for the majority of promotional posts.',
    counterfactual: 'If you recently followed or unfollowed promotional accounts, this may not reflect those changes yet.',
    takeaway: (data) => data?.concentration !== undefined
      ? `${data.concentration}% of promotions you're shown come from just ${data.top5Count} sources.`
      : null,
    action: () => 'Muting or unfollowing concentrated promo sources may diversify your feed over time.',
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Platforms Showing You the Most Promotion',
    description: 'Which platforms surface the most promotional content in your feed.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Compares ad and promotional content rates across the platforms you\'ve scanned.',
    counterfactual: 'Platform differences may vary based on when and how you use each one.',
    takeaway: () => 'Some platforms surface more promotional content than others.',
    action: () => 'Spending less time on high-promo platforms may reduce overall ad exposure.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Possible Promotional Content (Estimate)',
    description: 'Content showing promotional signals even when not labeled as an ad.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    confidenceDisclaimer: true,
    whyExplanation: 'Detected using keyword patterns like discount codes, affiliate links, or product mentions. This is a rough estimate.',
    takeaway: (data) => data?.possibleInfluencePercent !== undefined
      ? `About ${data.possibleInfluencePercent}% of content may contain unlabeled promotion.`
      : null,
    action: () => 'Being aware of casual product mentions can help you notice unlabeled influence.',
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'Product Categories Appearing Most Often',
    description: 'Product categories that appear repeatedly in promotional content you\'re shown.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    confidenceDisclaimer: true,
    whyExplanation: 'Identified by matching product-related keywords in promotional posts across your scans.',
    takeaway: (data) => data?.length > 0
      ? 'These product categories appear frequently in the promotions you\'re shown.'
      : null,
    action: () => 'Avoiding engagement with unwanted product content may reduce similar targeting.',
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
    title: 'Signals Advertisers May Be Responding To',
    description: 'Inferred interest areas based on repeated products and categories you\'re shown.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Summarized from product categories and ad themes that appear repeatedly across your scans.',
    takeaway: (data) => data?.interests?.length > 0
      ? `Advertisers may associate you with: ${data.interests.join(', ')}. This reflects ad targeting, not your actual interests.`
      : null,
    action: () => 'Engaging with content outside these categories may gradually shift how you\'re targeted.',
  },

  // ==========================================
  // TAB 2: POLITICS & WORLDVIEW
  // Core question: "How politically skewed is my feed?"
  // Tab remains opt-in for leaning insights
  // Primary (2): Political share, Balance status
  // Secondary (2): Who drives politics, Cross-platform differences
  // Collapsed (2): Leaning breakdown, Blind spots (LOW confidence, opt-in)
  // Summary (1): Political profile
  // ==========================================

  // --- PRIMARY: Core metrics about political exposure ---
  {
    tab: 'politics',
    id: 'politics-share',
    title: 'Political Content in Your Feed',
    description: 'What percentage of content you\'re shown contains political themes.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Detected using keyword matching for political topics. This is a rough estimate based on content patterns.',
    counterfactual: 'This may feel inaccurate if you engage with political content differently than what appears in your feed.',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `About ${data.currentPercent}% of the content you're shown contains political themes.`
      : null,
    action: () => 'Following non-political creators may gradually reduce political content exposure.',
  },
  {
    tab: 'politics',
    id: 'politics-balance',
    title: 'Perspective Balance (Rough Estimate)',
    description: 'A rough estimate of whether political content skews toward particular perspectives.',
    outputType: 'status',
    dataFn: 'getPoliticalBalanceData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Uses keyword matching to estimate perspective distribution. This is LOW confidence and may not reflect nuance.',
    counterfactual: 'Political content is complex. This rough estimate may miss context, irony, or critique.',
    takeaway: (data) => data?.message || 'This is a rough estimate of political content balance in what you\'re shown.',
    action: () => 'Engaging with credible sources across perspectives may help diversify exposure.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'politics',
    id: 'politics-creators',
    title: 'Sources of Political Content',
    description: 'Creators contributing the most political content to what you\'re shown.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Identified by counting political keyword matches per creator across your scans.',
    takeaway: () => 'A few sources account for most of the political content you\'re shown.',
    action: () => 'Unfollowing top political sources may reduce political content if desired.',
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Political Content by Platform',
    description: 'How political content exposure varies across the platforms you\'ve scanned.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Compares political content percentages across each platform you\'ve scanned.',
    takeaway: () => 'Political content exposure varies significantly by platform.',
    action: () => 'Using lower-politics platforms may provide a break when needed.',
  },

  // --- COLLAPSED BY DEFAULT: Low confidence, opt-in required ---
  {
    tab: 'politics',
    id: 'politics-leaning',
    title: 'Perspective Distribution (Low Confidence)',
    description: 'Rough distribution by perspective. Uses keyword matching only.',
    outputType: 'stacked100',
    dataFn: 'getPoliticalLeaningData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Based on simple keyword matching. Cannot detect nuance, irony, or context. Treat as a rough signal only.',
    takeaway: (data) => data?.takeaway || 'Rough estimate of content distribution. This reflects exposure, not your views.',
    action: () => 'If one perspective dominates, your feed exposure may be narrowing.',
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Underrepresented Perspectives (Low Confidence)',
    description: 'Perspectives that rarely appear in content you\'re shown.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Detected by absence of keywords associated with certain perspectives. This is a very rough estimate.',
    takeaway: (data) => data?.message || 'Some perspectives may be underrepresented in what you\'re shown.',
    action: () => 'Following credible sources from underrepresented areas may broaden exposure.',
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
    title: 'Political Themes You\'re Shown Most',
    description: 'Summary of political themes that appear frequently in your feed.',
    outputType: 'text',
    dataFn: 'getPoliticalProfileData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Summarized from political keywords detected across your scans. Reflects content exposure, not your views.',
    takeaway: (data) => data?.politicalPercent !== undefined
      ? `Your feed contains ${data.politicalPercent}% political content. This reflects what you're shown, not what you believe.`
      : null,
    action: () => 'Diversifying what you watch and follow may shift the balance over time.',
  },

  // ==========================================
  // TAB 3: PATTERNS IN YOUR FEED
  // Core question: "Is my feed diverse or repetitive?"
  // Primary (2): Topic variety, Reinforcement warning
  // Secondary (2): Repeated themes, Feed stability
  // Collapsed (1): Emotional weight
  // Summary (1): Pattern summary
  // ==========================================

  // --- PRIMARY: Core metrics about feed diversity ---
  {
    tab: 'patterns',
    id: 'patterns-topic-variety',
    title: 'Topics You\'re Shown',
    description: 'How many different topics appear in the content you\'re shown.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Counted by matching content to topic categories across your scans.',
    counterfactual: 'This may feel different from your interests if the algorithm shows you content you didn\'t seek out.',
    takeaway: (data) => data?.topicCount !== undefined
      ? `You're shown content across ${data.topicCount} distinct topics.`
      : null,
    action: () => 'Searching for new interests may expand the topics you\'re shown.',
  },
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Content Repetition Signal',
    description: 'Whether the same ideas appear repeatedly in what you\'re shown.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Measured by how concentrated your content is in a small number of topics or themes.',
    counterfactual: 'Repetition isn\'t always bad. It may reflect genuine interest or algorithmic over-optimization.',
    takeaway: (data) => data?.riskLevel
      ? `Content repetition level: ${data.riskLevel}. This reflects patterns in what you're shown.`
      : null,
    action: () => 'Following creators outside your usual themes may increase variety.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Topic Concentration',
    description: 'How concentrated the content you\'re shown is in just a few topics.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Calculated by measuring what percentage of content falls into your top topics.',
    takeaway: (data) => data?.top3Percent !== undefined
      ? `${data.top3Percent}% of what you're shown is in your top 3 topics.`
      : null,
    action: () => 'Engaging with content outside top topics may broaden recommendations.',
  },
  {
    tab: 'patterns',
    id: 'patterns-stability',
    title: 'How Much Your Feed Changes',
    description: 'How much the content you\'re shown changes between scans.',
    outputType: 'status',
    dataFn: 'getFeedStabilityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measured by comparing topic and creator overlap between your scans.',
    takeaway: (data) => data?.stability
      ? `Your feed is ${data.stability} (${data.overlapPercent}% overlap between scans).`
      : null,
    action: () => 'Following new creators may inject variety into stable feeds.',
  },

  // --- COLLAPSED BY DEFAULT: Still available but de-emphasized ---
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional Tone of Content',
    description: 'The overall emotional tone of content you\'re shown.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Estimated using keyword patterns associated with different emotional tones. This is a rough signal.',
    takeaway: (data) => data?.intensity
      ? `The content you're shown tends to feel ${data.intensity} emotionally.`
      : null,
    action: () => 'Reducing engagement with intense content may lighten emotional load over time.',
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
    title: 'What These Patterns Suggest',
    description: 'Summary of variety, repetition, and feed dynamics in what you\'re shown.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Synthesized from topic distribution, repetition rates, and stability across your scans.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Small habit changes can shift patterns over time.',
  },

  // ==========================================
  // TAB 4: CREATORS & VOICES
  // Core question: "Who dominates what I see?"
  // Primary (2): Top creators (top 5), Creator concentration
  // Secondary (2): Voice diversity, Cross-platform overlap
  // Summary (1): Who shapes your feed
  // ==========================================

  // --- PRIMARY: Core metrics about creator dominance ---
  {
    tab: 'creators',
    id: 'creators-top',
    title: 'Creators Appearing Most Often',
    description: 'The top 5 creators who appear most frequently in what you\'re shown.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Ranked by post count across all your scans. Reflects algorithmic surfacing, not just who you follow.',
    counterfactual: 'If you recently changed who you follow, this may not reflect those changes yet.',
    takeaway: () => 'These 5 creators appear most frequently in what you\'re shown.',
    action: () => 'Diversifying your follows may shift which creators appear most.',
  },
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'How Concentrated Your Sources Are',
    description: 'How much of what you\'re shown comes from a small number of creators.',
    outputType: 'number',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Calculated by measuring what percentage of content comes from your top creators.',
    counterfactual: 'High concentration may reflect following a small number of active creators, not necessarily a narrow feed.',
    takeaway: (data) => data?.concentration !== undefined
      ? `${data.concentration}% of what you're shown comes from just ${data.top10Count} creators.`
      : null,
    action: () => 'Following more creators may reduce concentration.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'Source Variety',
    description: 'A rough assessment of how varied the sources in your feed are.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Estimated by measuring creator count and distribution across topics.',
    takeaway: (data) => data?.diversity
      ? `Your feed shows ${data.diversity} source variety.`
      : null,
    action: () => 'Adding sources from different backgrounds may increase variety.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Creators Appearing Across Platforms',
    description: 'Creators who appear in your feed on multiple platforms you scan.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Identified by matching creator handles or names across different platform scans.',
    takeaway: () => 'Some creators appear in your feed across multiple platforms.',
    action: () => 'Diversifying intentionally may help if one voice appears everywhere.',
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
    title: 'Who Shapes What You\'re Shown',
    description: 'Summary of the creators with the most presence in your feed.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on frequency and consistency of appearance across your scans.',
    takeaway: () => 'These accounts appear most consistently in what you\'re shown.',
    action: () => 'Adjusting who you follow may shift what the algorithm surfaces.',
  },

  // ==========================================
  // TAB 5: WHAT THE ALGORITHM THINKS
  // Core question: "What does the algorithm believe about me?"
  // Primary (2): Topics liked, Profile breadth
  // Secondary (2): What it's confident about, Future recommendations
  // Summary (1): How to change it
  // ==========================================

  // --- PRIMARY: Core metrics about algorithmic profile ---
  {
    tab: 'algorithm',
    id: 'algo-topics-liked',
    title: 'Topics You\'re Most Often Shown',
    description: 'Topics most strongly associated with your feed patterns.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Identified by which topics appear most frequently and consistently in your scans.',
    counterfactual: 'This reflects what the algorithm surfaces, which may differ from your actual interests.',
    takeaway: () => 'The algorithm frequently shows you content in these topics. This reflects exposure, not preference.',
    action: () => 'Engaging with different topics may gradually retrain what you\'re shown.',
  },
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'How Varied Your Feed Profile Is',
    description: 'Whether your algorithmic profile appears diverse or narrowly focused.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Estimated by measuring topic distribution and concentration across your scans.',
    counterfactual: 'A narrow profile isn\'t inherently bad. It may reflect deep interest in specific areas.',
    takeaway: (data) => data?.breadth
      ? `Your inferred profile appears ${data.breadth.toLowerCase()}. This reflects content patterns, not who you are.`
      : null,
    action: () => 'Exploring new topics may broaden what you\'re shown.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'Consistent Patterns in Your Feed',
    description: 'Patterns that appear consistently across your scans.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Identified by measuring which signals remain stable across multiple scans.',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Changing established patterns typically requires repeated, different engagement.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'What You May See More Of',
    description: 'Content types you\'ll likely be shown more of based on current patterns.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    confidenceDisclaimer: true,
    whyExplanation: 'Projected from trending topics and growing categories in your recent scans. This is speculative.',
    takeaway: (data) => data?.predictions?.length > 0
      ? data.predictions.join(' ')
      : null,
    action: () => 'Changing your engagement now may shift what you\'re shown in the future.',
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
    title: 'Shifting What You\'re Shown',
    description: 'Actions that may help shift your algorithmic profile over time.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Suggestions based on common patterns. Results vary and are not guaranteed.',
    takeaway: () => 'Small, repeated behavior changes may gradually shift what you\'re shown.',
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
