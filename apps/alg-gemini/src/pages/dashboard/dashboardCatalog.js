/**
 * Dashboard Catalog - Phase 4 Implementation
 *
 * Each view includes:
 * - tab: which tab it belongs to
 * - id: unique identifier
 * - title: display title
 * - description: what this view shows
 * - outputType: number_line | bar | stacked100 | line | table | list | text | status
 * - dataFn: function name from dataHelpers to get data
 * - takeaway: function that returns takeaway string given data
 * - action: function that returns action string given data (optional)
 * - emptyStateType: 'needs_more_scans' | 'needs_broader_behavior' | 'future_feature'
 * - isPrimary: boolean - if true, this card appears first and is visually emphasized
 * - sortOrder: 'primary' | 'supporting' | 'future' | 'summary' - controls narrative flow
 */

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
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
  // TAB 1: ADS & INFLUENCE (10 views)
  // Grouped into: "Clearly labeled advertising" and "Possible influence or incentivized content"
  // Note: Not all influence is labeled as advertising, and not all influence is intentional.
  // ==========================================

  // --- Clearly labeled advertising ---
  {
    tab: 'ads',
    id: 'ads-percentage',
    title: 'How Much of Your Feed is Advertising',
    description: 'Track the percentage of posts labeled as ads or sponsored content.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    category: 'labeled_ads',
    isPrimary: true, // PRIMARY INSIGHT: Core metric for this tab
    sortOrder: 'primary',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `About ${data.currentPercent}% of your feed is clearly marked as advertising.`
      : null,
    action: () => 'If this feels high, engage more with non-commercial creators to rebalance.',
  },
  {
    tab: 'ads',
    id: 'ads-trend',
    title: 'Changes in Advertising Over Time',
    description: 'Track how ad percentage has changed across your scans.',
    outputType: 'line',
    dataFn: 'getAdTrendData',
    emptyStateType: 'needs_more_scans',
    category: 'labeled_ads',
    sortOrder: 'supporting',
    takeaway: (data) => data?.direction
      ? `Advertising in your feed is ${data.direction}.`
      : null,
    action: () => 'Small behavior changes usually shift this within a week.',
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Platforms Driving the Most Promotion',
    description: 'Compare promotional content across different platforms.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    category: 'labeled_ads',
    sortOrder: 'supporting',
    takeaway: () => 'Some platforms rely more heavily on promotion.',
    action: () => 'If one platform feels salesy, reduce time there or reset engagement.',
  },

  // --- Possible influence or incentivized content ---
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Possible Promotional Content (Not Labeled)',
    description: 'Content that shows patterns commonly associated with promotion, even when not labeled as an ad.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'future_feature',
    category: 'possible_influence',
    isPrimary: true, // PRIMARY INSIGHT: Critical even if sparse
    sortOrder: 'future',
    confidenceDisclaimer: true,
    takeaway: () => 'This content shows patterns commonly associated with promotion, even when not labeled as an ad.',
    action: () => 'Treat recommendations as marketing when products keep showing up.',
  },
  {
    tab: 'ads',
    id: 'ads-explicit-vs-hidden',
    title: 'Clearly Labeled Ads vs Possible Influence',
    description: 'Compare labeled advertising versus content that may be incentivized. Not all influence is labeled as advertising, and not all influence is intentional.',
    outputType: 'stacked100',
    dataFn: 'getAdsVsPromoData',
    emptyStateType: 'future_feature',
    category: 'possible_influence',
    sortOrder: 'future',
    confidenceDisclaimer: true,
    takeaway: () => 'This comparison shows clearly labeled ads alongside possible incentivized content.',
    action: () => 'Unlabeled influence is easier to miss. Be extra skeptical of casual product mentions.',
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'Products Mentioned Most Often',
    description: 'The product categories or brands that appear repeatedly in your feed.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    category: 'possible_influence',
    isPrimary: true, // PRIMARY INSIGHT: Reveals targeting patterns
    sortOrder: 'primary',
    confidenceDisclaimer: true,
    takeaway: (data) => data?.length > 0
      ? 'These products show up repeatedly in your feed.'
      : null,
    action: () => 'If you see repeat product pushes, the algorithm may be optimizing for purchases.',
  },
  {
    tab: 'ads',
    id: 'ads-promo-creators',
    title: 'Who is Doing the Promoting',
    description: 'Creators who post the most promotional content in your feed.',
    outputType: 'table',
    dataFn: 'getPromoCreatorsData',
    emptyStateType: 'needs_more_scans',
    category: 'possible_influence',
    sortOrder: 'supporting',
    takeaway: () => 'A small set of creators drive most promotions.',
    action: () => 'Mute or unfollow high-promo creators if you want fewer sales pitches.',
  },
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Ad Concentration',
    description: 'How concentrated promotional content is among top creators.',
    outputType: 'number',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    category: 'possible_influence',
    sortOrder: 'supporting',
    takeaway: (data) => data?.concentration !== undefined
      ? `${data.concentration}% of promotions come from the top ${data.top5Count} creators.`
      : null,
    action: () => 'Concentrated promotion often comes from a few influencer-heavy accounts.',
  },
  {
    tab: 'ads',
    id: 'ads-themes',
    title: 'Promotional Themes',
    description: 'Common emotional narratives used in promotional content.',
    outputType: 'bar',
    dataFn: 'getPromoThemesData',
    emptyStateType: 'future_feature',
    category: 'possible_influence',
    sortOrder: 'future',
    confidenceDisclaimer: true,
    takeaway: () => 'Promotions often rely on these emotional narratives.',
    action: () => 'When you notice a pattern, you can reduce engagement to stop reinforcing it.',
  },
  {
    tab: 'ads',
    id: 'ads-advertiser-insights',
    title: 'What Advertisers Seem to Want From You',
    description: 'Inferred interest areas based on repeated products and categories.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    category: 'possible_influence',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    takeaway: (data) => data?.interests?.length > 0
      ? `Advertisers appear to associate you with: ${data.interests.join(', ')}.`
      : null,
    action: () => 'If it\'s wrong, deliberately engage with content outside these categories.',
  },

  // ==========================================
  // TAB 2: POLITICS & WORLDVIEW (10 views)
  // ==========================================
  {
    tab: 'politics',
    id: 'politics-share',
    title: 'Political Content Share',
    description: 'What percentage of your feed contains political content.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Core metric for this tab
    sortOrder: 'primary',
    takeaway: (data) => data?.currentPercent !== undefined
      ? `Political content appears in about ${data.currentPercent}% of your feed.`
      : null,
    action: () => 'If this feels high, follow more non-political creators to diversify.',
  },
  {
    tab: 'politics',
    id: 'politics-leaning',
    title: 'Political Leaning Breakdown',
    description: 'Distribution of political content by leaning (Left / Neutral / Right).',
    outputType: 'stacked100',
    dataFn: 'getPoliticalLeaningData',
    emptyStateType: 'future_feature',
    isPrimary: true, // PRIMARY INSIGHT: Critical perspective balance metric
    sortOrder: 'future',
    takeaway: () => 'Political content distribution by leaning.',
    action: () => 'If one side dominates, your feed may be narrowing.',
  },
  {
    tab: 'politics',
    id: 'politics-balance',
    title: 'Balance vs Imbalance',
    description: 'Assessment of whether your political content is balanced or skewed.',
    outputType: 'status',
    dataFn: 'getPoliticalBalanceData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'Your political content balance status.',
    action: () => 'To rebalance, engage with credible sources across perspectives.',
  },
  {
    tab: 'politics',
    id: 'politics-creators',
    title: 'Who Drives Political Content',
    description: 'Creators who post the most political content in your feed.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Shows who shapes your political exposure
    sortOrder: 'primary',
    takeaway: () => 'A small number of creators drive most political exposure.',
    action: () => 'Unfollow the top drivers if you want less politics.',
  },
  {
    tab: 'politics',
    id: 'politics-repetition',
    title: 'Political Repetition',
    description: 'How often you see the same political themes repeated.',
    outputType: 'number',
    dataFn: 'getPoliticalRepetitionData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
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
    takeaway: () => 'Political content tends to feel calm or intense.',
    action: () => 'If it\'s intense, consider muting accounts that post outrage content.',
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
    takeaway: (data) => data?.direction
      ? `Your political exposure has been ${data.direction}.`
      : null,
    action: () => 'Feeds shift quickly based on what you pause on and share.',
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Political Blind Spots',
    description: 'Viewpoints or themes that rarely appear in your feed.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'Some viewpoints rarely appear in your feed.',
    action: () => 'If you want balance, intentionally follow credible sources from missing areas.',
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Cross-Platform Political Differences',
    description: 'Compare political content across different platforms.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    takeaway: () => 'Political exposure varies by platform.',
    action: () => 'Use the lowest-politics platform when you want a mental break.',
  },
  {
    tab: 'politics',
    id: 'politics-profile',
    title: 'What Your Feed Suggests About Your Political Interests',
    description: 'Summary of political themes your feed emphasizes.',
    outputType: 'text',
    dataFn: 'getPoliticalProfileData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    takeaway: (data) => data?.politicalPercent !== undefined
      ? `Your feed emphasizes political content (${data.politicalPercent}%).`
      : null,
    action: () => 'If it doesn\'t reflect you, diversify what you watch and follow.',
  },

  // ==========================================
  // TAB 3: PATTERNS IN YOUR FEED (10 views)
  // ==========================================
  {
    tab: 'patterns',
    id: 'patterns-topic-variety',
    title: 'Topic Variety',
    description: 'How many different topics appear in your feed.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Core diversity metric
    sortOrder: 'primary',
    takeaway: (data) => data?.topicCount !== undefined
      ? `Your feed covers ${data.topicCount} topics.`
      : null,
    action: () => 'Search for a new interest to increase variety.',
  },
  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Repeated Themes',
    description: 'What percentage of your feed concentrates in the top 3 topics.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: (data) => data?.top3Percent !== undefined
      ? `${data.top3Percent}% of your feed is in the top 3 topics.`
      : null,
    action: () => 'Engage with content outside the top topics to broaden recommendations.',
  },
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional Weight',
    description: 'The overall emotional tone of content in your feed.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Key wellbeing metric
    sortOrder: 'primary',
    takeaway: (data) => data?.intensity
      ? `Your feed feels ${data.intensity} emotionally.`
      : null,
    action: () => 'If heavy, reduce engagement with intense content for a few days.',
  },
  {
    tab: 'patterns',
    id: 'patterns-sentiment-balance',
    title: 'Negative vs Positive Balance',
    description: 'Distribution of positive, neutral, and negative content.',
    outputType: 'stacked100',
    dataFn: 'getSentimentBalanceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: () => 'Content sentiment distribution in your feed.',
    action: () => 'If negative is high, intentionally interact with uplifting accounts.',
  },
  {
    tab: 'patterns',
    id: 'patterns-stability',
    title: 'Stability of Your Feed',
    description: 'How much your feed content changes between scans.',
    outputType: 'status',
    dataFn: 'getFeedStabilityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: (data) => data?.stability
      ? `Your feed is ${data.stability} between scans (${data.overlapPercent}% topic overlap).`
      : null,
    action: () => 'Stable feeds can get repetitive. Follow 3 new creators to inject variety.',
  },
  {
    tab: 'patterns',
    id: 'patterns-discovery',
    title: 'Discovery Rate',
    description: 'Percentage of content from new creators you haven\'t seen before.',
    outputType: 'number',
    dataFn: 'getDiscoveryRateData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: (data) => data?.discoveryRate !== undefined
      ? `${data.discoveryRate}% of creators in your latest scan were new.`
      : null,
    action: () => 'To increase discovery, like and save content from new accounts.',
  },
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Reinforcement Warning',
    description: 'Assessment of whether your feed may be reinforcing the same ideas.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Critical even if sparse
    sortOrder: 'primary',
    takeaway: (data) => data?.riskLevel
      ? `Echo chamber risk: ${data.riskLevel}.`
      : null,
    action: () => 'Try one new topic search and follow 5 creators outside your usual themes.',
  },
  {
    tab: 'patterns',
    id: 'patterns-rare-content',
    title: 'Content You Almost Never See',
    description: 'Topics that rarely appear in your feed.',
    outputType: 'list',
    dataFn: 'getRareContentData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'Some topics rarely appear in your feed.',
    action: () => 'If you want a broader feed, deliberately engage with missing topics.',
  },
  {
    tab: 'patterns',
    id: 'patterns-intensity-spikes',
    title: 'Intensity Spikes',
    description: 'Track when intense or negative content peaks in your feed.',
    outputType: 'line',
    dataFn: 'getIntensitySpikesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: () => 'Some periods show spikes in intense content.',
    action: () => 'When spikes happen, take a short break or reset engagement signals.',
  },
  {
    tab: 'patterns',
    id: 'patterns-summary',
    title: 'What Your Patterns Suggest',
    description: 'Summary of variety, repetition, and emotional weight patterns.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Small habit changes can shift this quickly.',
  },

  // ==========================================
  // TAB 4: CREATORS & VOICES (10 views)
  // ==========================================
  {
    tab: 'creators',
    id: 'creators-top',
    title: 'Creators You See Most',
    description: 'The creators who appear most frequently in your feed.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Core metric for this tab
    sortOrder: 'primary',
    takeaway: () => 'These creators appear most frequently in your feed.',
    action: () => 'If one creator dominates, consider diversifying who you follow.',
  },
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'Creator Concentration',
    description: 'What percentage of your feed comes from the top 10 creators.',
    outputType: 'number',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Key diversity metric
    sortOrder: 'primary',
    takeaway: (data) => data?.concentration !== undefined
      ? `${data.concentration}% of your feed comes from the top ${data.top10Count} creators.`
      : null,
    action: () => 'Follow 10 new creators to reduce concentration.',
  },
  {
    tab: 'creators',
    id: 'creators-new-vs-familiar',
    title: 'New vs Familiar Creators',
    description: 'Breakdown of content from new versus repeat creators.',
    outputType: 'stacked100',
    dataFn: 'getNewVsFamiliarData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: () => 'Your feed mix of new and familiar creators.',
    action: () => 'To discover more, interact with unfamiliar accounts.',
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
    takeaway: () => 'These creators drive most political exposure.',
    action: () => 'Unfollow the top drivers if you want less politics.',
  },
  {
    tab: 'creators',
    id: 'creators-by-topic',
    title: 'Creators by Topic',
    description: 'Which creators dominate which topics in your feed.',
    outputType: 'bar',
    dataFn: 'getCreatorsByTopicData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'Different creators dominate different topics.',
    action: () => 'Follow creators in topics you want more of.',
  },
  {
    tab: 'creators',
    id: 'creators-by-tone',
    title: 'Creators by Emotional Tone',
    description: 'Which creators consistently post intense content.',
    outputType: 'table',
    dataFn: 'getCreatorsByToneData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'Some creators consistently post intense content.',
    action: () => 'If intense content affects you, mute those accounts.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Cross-Platform Creator Overlap',
    description: 'Creators who appear across multiple platforms you scan.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    takeaway: () => 'Some creators follow you across platforms.',
    action: () => 'If one voice is everywhere, you can diversify intentionally.',
  },
  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'Voice Diversity',
    description: 'Assessment of how diverse the voices in your feed are.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Critical perspective metric
    sortOrder: 'primary',
    takeaway: (data) => data?.diversity
      ? `Your feed shows ${data.diversity} voice diversity.`
      : null,
    action: () => 'Low diversity often means fewer perspectives. Add new voices.',
  },
  {
    tab: 'creators',
    id: 'creators-influential',
    title: 'Who Shapes Your Feed the Most',
    description: 'Top creators and what they contribute (ads/politics/topics).',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    takeaway: () => 'These accounts have the biggest influence on what you see.',
    action: () => 'Adjust who you follow to shift what the algorithm learns.',
  },

  // ==========================================
  // TAB 5: WHAT THE ALGORITHM THINKS (10 views)
  // ==========================================
  {
    tab: 'algorithm',
    id: 'algo-topics-liked',
    title: 'Topics the Algorithm Thinks You Like',
    description: 'Topics most strongly associated with your profile.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Core algorithmic inference
    sortOrder: 'primary',
    takeaway: () => 'The algorithm strongly associates you with these topics.',
    action: () => 'If it\'s inaccurate, engage with other topics to retrain it.',
  },
  {
    tab: 'algorithm',
    id: 'algo-topics-avoided',
    title: 'Topics the Algorithm Thinks You Avoid',
    description: 'Topics that rarely appear in your feed.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsAvoidedData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'These topics rarely appear, suggesting low interest.',
    action: () => 'To see them more, search and follow accounts in those areas.',
  },
  {
    tab: 'algorithm',
    id: 'algo-products',
    title: 'Products the Algorithm Thinks You\'re Receptive To',
    description: 'Product categories that appear repeatedly in ads shown to you.',
    outputType: 'bar',
    dataFn: 'getAlgoProductsData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Key commercial targeting metric
    sortOrder: 'primary',
    confidenceDisclaimer: true,
    takeaway: () => 'Your feed suggests interest in these product categories.',
    action: () => 'If you don\'t want targeted selling, reduce engagement with product content.',
  },
  {
    tab: 'algorithm',
    id: 'algo-political-themes',
    title: 'Political Themes the Algorithm Thinks Matter to You',
    description: 'Political themes that appear prioritized in your feed.',
    outputType: 'list',
    dataFn: 'getAlgoPoliticalThemesData',
    emptyStateType: 'future_feature',
    sortOrder: 'future',
    takeaway: () => 'These political themes appear prioritized in your feed.',
    action: () => 'If it feels unbalanced, diversify what you watch and follow.',
  },
  {
    tab: 'algorithm',
    id: 'algo-emotional-triggers',
    title: 'Emotional Triggers the Algorithm Responds To',
    description: 'Emotional content types that appear most often.',
    outputType: 'bar',
    dataFn: 'getAlgoEmotionalTriggersData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: () => 'Content with these emotions appears more often.',
    action: () => 'If a trigger is unhelpful, stop lingering on that content.',
  },
  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'What the Algorithm is Confident About',
    description: 'Patterns that remain consistent across your scans.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'Changing these takes repeated behavior changes.',
  },
  {
    tab: 'algorithm',
    id: 'algo-uncertain',
    title: 'What the Algorithm is Uncertain About',
    description: 'Areas with high variance across your scans.',
    outputType: 'text',
    dataFn: 'getAlgoUncertainData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    takeaway: (data) => data?.insights?.length > 0
      ? data.insights.join(' ')
      : null,
    action: () => 'If you want to shape this, engage consistently with what you want.',
  },
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'How Narrow or Broad Your Inferred Profile Is',
    description: 'Assessment of your algorithmic profile breadth.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    isPrimary: true, // PRIMARY INSIGHT: Critical overall profile assessment
    sortOrder: 'primary',
    takeaway: (data) => data?.breadth
      ? `Your inferred profile is ${data.breadth.toLowerCase()}.`
      : null,
    action: () => 'Broader profiles usually come from exploring new topics.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'How This Profile May Shape Future Recommendations',
    description: 'Predictions about what content you\'ll likely see more of.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    confidenceDisclaimer: true,
    takeaway: (data) => data?.predictions?.length > 0
      ? data.predictions.join(' ')
      : null,
    action: () => 'Change signals now to change recommendations later.',
  },
  {
    tab: 'algorithm',
    id: 'algo-change-advice',
    title: 'How to Change What the Algorithm Thinks About You',
    description: 'Concrete actions you can take to shift your algorithmic profile.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    takeaway: () => 'Small behavior changes can shift these assumptions.',
    action: null, // Action is embedded in the tips
  },
];

// Sort order priority (for narrative flow)
const SORT_ORDER_PRIORITY = {
  primary: 1,
  supporting: 2,
  future: 3,
  summary: 4,
};

// Helper function to get views for a specific tab (sorted by narrative order)
export const getViewsForTab = (tabId) => {
  return dashboardCatalog
    .filter((view) => view.tab === tabId)
    .sort((a, b) => {
      const orderA = SORT_ORDER_PRIORITY[a.sortOrder] || 2;
      const orderB = SORT_ORDER_PRIORITY[b.sortOrder] || 2;
      return orderA - orderB;
    });
};

// Helper function to get a specific view by ID
export const getViewById = (viewId) => {
  return dashboardCatalog.find((view) => view.id === viewId);
};
