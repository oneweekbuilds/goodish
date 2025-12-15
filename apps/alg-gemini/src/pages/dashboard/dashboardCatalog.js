/**
 * Dashboard Catalog - defines all views across all tabs
 *
 * Each view must have:
 * - tab: which tab it belongs to
 * - id: unique identifier
 * - title: display title
 * - description: what this view shows
 * - dataRequirement: plain English description of what data is needed
 */

export const TABS = [
  { id: 'trends', label: 'Trends Analysis' },
  { id: 'creators', label: 'Creator Stats' },
  { id: 'library', label: 'Post Library' },
  { id: 'compare', label: 'Platform Compare' },
  { id: 'insights', label: 'AI Insights' },
];

export const dashboardCatalog = [
  // ==========================================
  // TAB: Trends Analysis (10 views)
  // ==========================================
  {
    tab: 'trends',
    id: 'trends-content-categories',
    title: 'Content Categories Over Time',
    description: 'Track how the types of content shown to you have changed across your scans.',
    dataRequirement: 'Requires at least 3 scans with content category data to show trends.',
  },
  {
    tab: 'trends',
    id: 'trends-engagement-patterns',
    title: 'Engagement Pattern Shifts',
    description: 'See how your engagement behavior has evolved over your scanning history.',
    dataRequirement: 'Requires engagement data from multiple scan sessions.',
  },
  {
    tab: 'trends',
    id: 'trends-topic-evolution',
    title: 'Topic Evolution',
    description: 'Observe which topics have grown or declined in your feed recommendations.',
    dataRequirement: 'Requires topic classification data from at least 2 scans.',
  },
  {
    tab: 'trends',
    id: 'trends-watch-time-distribution',
    title: 'Watch Time Distribution',
    description: 'Analyze how your viewing duration patterns have changed over time.',
    dataRequirement: 'Requires watch time data from video content scans.',
  },
  {
    tab: 'trends',
    id: 'trends-algorithm-shift',
    title: 'Algorithm Behavior Changes',
    description: 'Detect when the platform appears to have changed how it recommends content to you.',
    dataRequirement: 'Requires consistent scanning data over at least 2 weeks.',
  },
  {
    tab: 'trends',
    id: 'trends-content-freshness',
    title: 'Content Freshness Over Time',
    description: 'Track whether you are being shown newer or older content.',
    dataRequirement: 'Requires post timestamp data from multiple scans.',
  },
  {
    tab: 'trends',
    id: 'trends-scroll-velocity',
    title: 'Scroll Velocity Trends',
    description: 'Measure how your scrolling speed has changed across sessions.',
    dataRequirement: 'Requires scroll behavior data from feed recordings.',
  },
  {
    tab: 'trends',
    id: 'trends-recommendation-diversity',
    title: 'Recommendation Diversity Index',
    description: 'Track whether your feed is becoming more or less diverse over time.',
    dataRequirement: 'Requires content diversity metrics from multiple scans.',
  },
  {
    tab: 'trends',
    id: 'trends-time-of-day',
    title: 'Time-of-Day Patterns',
    description: 'See how content recommendations vary based on when you use the platform.',
    dataRequirement: 'Requires scans taken at different times of day.',
  },
  {
    tab: 'trends',
    id: 'trends-sentiment-shift',
    title: 'Content Sentiment Trends',
    description: 'Track the overall emotional tone of content being recommended to you.',
    dataRequirement: 'Requires sentiment analysis data from multiple scans.',
  },

  // ==========================================
  // TAB: Creator Stats (10 views)
  // ==========================================
  {
    tab: 'creators',
    id: 'creators-top-recommended',
    title: 'Most Recommended Creators',
    description: 'See which content creators appear most frequently in your feed.',
    dataRequirement: 'Requires creator attribution data from scan results.',
  },
  {
    tab: 'creators',
    id: 'creators-new-vs-familiar',
    title: 'New vs Familiar Creators',
    description: 'Compare how often you see content from new creators versus those you already follow.',
    dataRequirement: 'Requires follow status and creator appearance data.',
  },
  {
    tab: 'creators',
    id: 'creators-category-breakdown',
    title: 'Creator Categories',
    description: 'Understand the types of creators the algorithm surfaces to you.',
    dataRequirement: 'Requires creator categorization data from scans.',
  },
  {
    tab: 'creators',
    id: 'creators-engagement-correlation',
    title: 'Creator Engagement Correlation',
    description: 'See which creators drive the most engagement from you.',
    dataRequirement: 'Requires engagement action data linked to specific creators.',
  },
  {
    tab: 'creators',
    id: 'creators-appearance-frequency',
    title: 'Creator Appearance Frequency',
    description: 'Track how often specific creators appear in your recommendations.',
    dataRequirement: 'Requires scan data with creator identification.',
  },
  {
    tab: 'creators',
    id: 'creators-size-distribution',
    title: 'Creator Size Distribution',
    description: 'See the follower count distribution of creators in your feed.',
    dataRequirement: 'Requires creator follower data from platform profiles.',
  },
  {
    tab: 'creators',
    id: 'creators-growth-tracking',
    title: 'Creator Emergence',
    description: 'Identify creators who have recently started appearing more in your feed.',
    dataRequirement: 'Requires historical scan data with creator tracking.',
  },
  {
    tab: 'creators',
    id: 'creators-content-style',
    title: 'Creator Content Styles',
    description: 'Categorize creators by their content production style.',
    dataRequirement: 'Requires content style analysis from multiple posts per creator.',
  },
  {
    tab: 'creators',
    id: 'creators-posting-frequency',
    title: 'Creator Posting Patterns',
    description: 'See how frequently your recommended creators post new content.',
    dataRequirement: 'Requires post timing data across creator profiles.',
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Cross-Platform Creator Presence',
    description: 'See if recommended creators also appear on other platforms you scan.',
    dataRequirement: 'Requires scan data from multiple platforms with creator matching.',
  },

  // ==========================================
  // TAB: Post Library (10 views)
  // ==========================================
  {
    tab: 'library',
    id: 'library-all-posts',
    title: 'All Scanned Posts',
    description: 'Browse all posts captured during your scans.',
    dataRequirement: 'Requires at least one completed scan with post data.',
  },
  {
    tab: 'library',
    id: 'library-saved-posts',
    title: 'Posts You Engaged With',
    description: 'View posts where you liked, commented, or saved.',
    dataRequirement: 'Requires engagement action tracking during scans.',
  },
  {
    tab: 'library',
    id: 'library-by-category',
    title: 'Posts by Category',
    description: 'Filter and browse posts organized by content category.',
    dataRequirement: 'Requires content categorization data from scans.',
  },
  {
    tab: 'library',
    id: 'library-by-creator',
    title: 'Posts by Creator',
    description: 'View posts grouped by the creator who made them.',
    dataRequirement: 'Requires creator attribution data from scans.',
  },
  {
    tab: 'library',
    id: 'library-by-date',
    title: 'Posts by Scan Date',
    description: 'Browse posts organized by when they were captured.',
    dataRequirement: 'Requires timestamp data from scan sessions.',
  },
  {
    tab: 'library',
    id: 'library-high-engagement',
    title: 'High Engagement Posts',
    description: 'See posts that had the highest engagement metrics.',
    dataRequirement: 'Requires engagement metric data from post analysis.',
  },
  {
    tab: 'library',
    id: 'library-ads',
    title: 'Sponsored Content',
    description: 'View all ads and sponsored posts from your scans.',
    dataRequirement: 'Requires ad detection data from scans.',
  },
  {
    tab: 'library',
    id: 'library-video-content',
    title: 'Video Content',
    description: 'Browse all video posts captured during scans.',
    dataRequirement: 'Requires content type classification from scans.',
  },
  {
    tab: 'library',
    id: 'library-image-content',
    title: 'Image Content',
    description: 'Browse all image posts captured during scans.',
    dataRequirement: 'Requires content type classification from scans.',
  },
  {
    tab: 'library',
    id: 'library-text-content',
    title: 'Text-Based Posts',
    description: 'Browse posts that are primarily text content.',
    dataRequirement: 'Requires content type classification from scans.',
  },

  // ==========================================
  // TAB: Platform Compare (10 views)
  // ==========================================
  {
    tab: 'compare',
    id: 'compare-content-overlap',
    title: 'Content Overlap',
    description: 'See how much content overlaps across different platforms you use.',
    dataRequirement: 'Requires scan data from at least 2 different platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-engagement-style',
    title: 'Engagement Style Comparison',
    description: 'Compare how you engage differently on each platform.',
    dataRequirement: 'Requires engagement data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-topic-distribution',
    title: 'Topic Distribution by Platform',
    description: 'See which topics dominate on each platform for you.',
    dataRequirement: 'Requires topic analysis data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-time-spent',
    title: 'Time Spent Comparison',
    description: 'Compare your usage time across different platforms.',
    dataRequirement: 'Requires session duration data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-creator-overlap',
    title: 'Creator Overlap',
    description: 'See which creators appear across multiple platforms.',
    dataRequirement: 'Requires creator data from scans on multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-recommendation-quality',
    title: 'Recommendation Quality',
    description: 'Compare how well each platform seems to understand your interests.',
    dataRequirement: 'Requires relevance scoring data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-ad-frequency',
    title: 'Ad Frequency Comparison',
    description: 'Compare how many ads you see on each platform.',
    dataRequirement: 'Requires ad detection data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-content-freshness',
    title: 'Content Freshness by Platform',
    description: 'Compare how fresh the recommended content is on each platform.',
    dataRequirement: 'Requires content timestamp data from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-sentiment-by-platform',
    title: 'Content Sentiment by Platform',
    description: 'Compare the emotional tone of content across platforms.',
    dataRequirement: 'Requires sentiment analysis from multiple platforms.',
  },
  {
    tab: 'compare',
    id: 'compare-algorithm-aggression',
    title: 'Algorithm Engagement Tactics',
    description: 'Compare how aggressively each platform tries to keep you engaged.',
    dataRequirement: 'Requires behavioral pattern analysis from multiple platforms.',
  },

  // ==========================================
  // TAB: AI Insights (10 views)
  // ==========================================
  {
    tab: 'insights',
    id: 'insights-profile-summary',
    title: 'Your Algorithm Profile Summary',
    description: 'AI-generated summary of how platforms see you.',
    dataRequirement: 'Requires sufficient scan data to build a profile model.',
  },
  {
    tab: 'insights',
    id: 'insights-interest-map',
    title: 'Interest Map',
    description: 'Visual map of your detected interests and how they connect.',
    dataRequirement: 'Requires topic and category data from multiple scans.',
  },
  {
    tab: 'insights',
    id: 'insights-echo-chamber',
    title: 'Echo Chamber Analysis',
    description: 'Assess whether your feed is showing you diverse perspectives.',
    dataRequirement: 'Requires viewpoint diversity analysis from content data.',
  },
  {
    tab: 'insights',
    id: 'insights-attention-patterns',
    title: 'Attention Pattern Analysis',
    description: 'AI analysis of what captures and holds your attention.',
    dataRequirement: 'Requires engagement and dwell time data from scans.',
  },
  {
    tab: 'insights',
    id: 'insights-manipulation-detection',
    title: 'Engagement Tactic Detection',
    description: 'Identify common psychological tactics used in your recommended content.',
    dataRequirement: 'Requires content analysis data with tactic classification.',
  },
  {
    tab: 'insights',
    id: 'insights-wellbeing-score',
    title: 'Digital Wellbeing Score',
    description: 'Overall assessment of how your feed content may affect wellbeing.',
    dataRequirement: 'Requires comprehensive scan data with sentiment and content analysis.',
  },
  {
    tab: 'insights',
    id: 'insights-prediction',
    title: 'Feed Predictions',
    description: 'AI predictions about what content you will see next.',
    dataRequirement: 'Requires historical scan data to train prediction model.',
  },
  {
    tab: 'insights',
    id: 'insights-blind-spots',
    title: 'Content Blind Spots',
    description: 'Topics and categories that rarely appear in your feed.',
    dataRequirement: 'Requires comprehensive topic mapping from multiple scans.',
  },
  {
    tab: 'insights',
    id: 'insights-comparison-peers',
    title: 'Anonymous Peer Comparison',
    description: 'See how your algorithm profile compares to anonymized aggregates.',
    dataRequirement: 'Requires opt-in to anonymous data sharing and sufficient comparison data.',
  },
  {
    tab: 'insights',
    id: 'insights-recommendations',
    title: 'Personalized Recommendations',
    description: 'AI-generated suggestions to improve your feed experience.',
    dataRequirement: 'Requires comprehensive profile data from multiple scans.',
  },
];

// Helper function to get views for a specific tab
export const getViewsForTab = (tabId) => {
  return dashboardCatalog.filter((view) => view.tab === tabId);
};

// Helper function to get a specific view by ID
export const getViewById = (viewId) => {
  return dashboardCatalog.find((view) => view.id === viewId);
};
