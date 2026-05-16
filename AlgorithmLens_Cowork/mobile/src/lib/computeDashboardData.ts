/**
 * computeDashboardData.ts
 *
 * Computes all dashboard metrics and insight narratives from raw scan data.
 * This module is the single source of truth for the mobile dashboard.
 *
 * Follows epistemic restraint rules:
 * - Describe composition, never infer algorithmic intent
 * - Use "appeared", "showed", "your feed contained" — not "the algorithm targeted"
 * - Banned words: manipulate, trick, targeting you, the algorithm wants, etc.
 */

import { getPlatformDisplayName } from './utils';
import { formatHandle } from './formatHandle';

// ─── Types ───────────────────────────────────────────────

interface RawPost {
  creator_handle: string | null;
  creator_display_name: string | null;
  post_text: string;
  is_ad: boolean;
  // PIPELINE FIX H-03: is_suggested can be null when subscription status is unknown.
  // null means "unknown" — we distribute unknowns proportionally based on known ratios.
  is_suggested: boolean | null;
  content_type: string;
  hashtags: string[];
  position_in_feed: number;
  ad_label_text: string | null;
}

// Political analysis types (from Gemini AI analysis)
export interface PoliticalAnalysis {
  politicalPct: number;
  politicalCount: number;
  totalAnalyzed: number;
  ideology: {
    left: number;
    center: number;
    right: number;
    leftCount: number;
    centerCount: number;
    rightCount: number;
    knownTotal: number;
  } | null;
  topPoliticalSource: {
    handle: string;
    count: number;
    pctOfPolitical: number;
  } | null;
  lowSample: boolean;
}

export interface ScanRecord {
  id?: string;
  platform?: string;
  post_count?: number;
  ad_count?: number;
  ad_percentage?: number;
  suggested_count?: number;
  suggested_percentage?: number;
  raw_data?: {
    posts?: RawPost[];
    top_creators?: Array<{ name: string; count: number }>;
    scanned_at?: string;
    duration_seconds?: number;
    // Gemini AI analysis results (enriched after backend processing)
    analysis?: {
      feed_items?: AnalyzedFeedItem[];
      political_content_summary?: {
        political_items?: number;
        political_percentage?: number;
      };
      ai_analyzed?: boolean;
    };
  };
  created_at?: string;
}

// Feed item with Gemini political + tone classification
interface AnalyzedFeedItem {
  political?: {
    is_political?: boolean;
    stance_or_alignment?: string;
    // A-06 FIX: Gemini service outputs stance_or_alignment_guess — support both field names
    stance_or_alignment_guess?: string;
  };
  emotions?: {
    valence?: string; // POSITIVE | NEUTRAL | NEGATIVE | MIXED
  };
  creator?: {
    handle?: string;
    name?: string;
  };
  // A-06: also support flat creator fields from Gemini output
  creator_handle?: string;
  creator_display_name?: string;
  // AI disclosure field (from unified scan result)
  ai_disclosure?: 'LABELED_AI' | 'NOT_LABELED' | null;
  content_type?: string;
}

// Unified FeedItem shape — used when raw_data contains the full UnifiedScanResult
interface UnifiedFeedItemLike {
  ai_disclosure?: 'LABELED_AI' | 'NOT_LABELED' | null;
  content_type?: string;
  [key: string]: unknown;
}

// Tone analysis types (from Gemini AI analysis)
export interface ToneAnalysis {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  knownValenceTotal: number;
  totalAnalyzed: number;
  lowSample: boolean;
}

// Top sources by tone (for Tone tab)
export interface ToneSourceStat {
  handle: string;
  count: number;
}

// Tone breakdown for suggested vs followed comparison
export interface ToneBySourceOrigin {
  hasData: boolean;
  suggested: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    total: number;
  } | null;
  followed: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    total: number;
  } | null;
}

// Creator novelty analysis (for Suggested vs Followed tab)
export interface CreatorNovelty {
  hasData: boolean;
  noveltyPercent: number;
  suggestedCreatorCount: number;
  followedCreatorCount: number;
  overlapCount: number;
  approximate: boolean; // true when follow detection is unreliable
}

// AI content analysis (for Overview tab)
export interface AiContentAnalysis {
  labeledCount: number;
  noSignalsCount: number;
  labeledPct: number;
  totalVisualPosts: number;
}

// Unlabeled promotional content analysis (for Ads tab)
export interface UnlabeledPromos {
  count: number;
  percentage: number;
  topTriggers: { name: string; count: number }[];
  exampleAccounts: string[];
}

// Advertised product type (for Ads tab)
export interface AdvertisedProductType {
  theme: string;
  percentage: number;
  count: number;
  exampleAdvertisers: string[];
}

// Tone split: selling vs not selling (for Ads tab)
export interface ToneBySelling {
  selling: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  notSelling: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  biggestDifference: string | null;
}

// Tone split: political vs non-political (for Tone tab)
export interface ToneByPolitical {
  political: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  nonPolitical: { positivePct: number; neutralPct: number; negativePct: number; total: number };
  biggestDifference: string | null;
}

// Brands & Influencers analysis (for Overview tab, Plus feature)
export interface BrandOrInfluencer {
  handle: string;
  postCount: number;
  adCount: number;
}

export interface BrandsAndInfluencers {
  topBrands: BrandOrInfluencer[];
  topInfluencers: BrandOrInfluencer[];
}

// By-platform breakdown (for Suggested tab, multi-platform scans)
export interface ByPlatformBreakdown {
  platform: string;
  followedCount: number;
  followedPct: number;
  suggestedCount: number;
  suggestedPct: number;
}

// Commercial content comparison: suggested vs followed (for Suggested tab)
export interface CommercialComparison {
  suggested: { adPct: number; total: number };
  followed: { adPct: number; total: number };
  biggestDifference: string | null;
}

// Topic frequency (for Suggested tab)
export interface TopicFrequency {
  topic: string;
  count: number;
  percentage: number;
}

// Content format comparison (for Suggested tab)
export interface ContentFormatComparison {
  format: string;
  suggestedPct: number;
  followedPct: number;
  delta: number;
}

export interface InsightHeroData {
  title: string;
  meaning: string;
  whyCare: string | null;
  meta: string | null;
  /**
   * Methodology disclosure prose for the "About this measurement" card.
   * Optional so existing builders that haven't been migrated continue to
   * typecheck. Populated by builders whose tabs have been redesigned
   * against the new design system (Sources from build #51 onward).
   *
   * Carry-forward note: prior to build #51 this content lived as a JSX
   * prop on the legacy InsightHero component in dashboard.tsx. Lifting
   * it onto the data shape so screens consume it from the data layer
   * rather than duplicating prose in screen files.
   */
  howWeMeasure?: {
    what: string;
    how: string;
    limitations: string;
  };
}

export interface CreatorStat {
  name: string;
  displayName: string | null;
  count: number;
  percentage: number;
}

export interface AdvertiserStat {
  name: string;
  count: number;
  percent: number;
}

export interface DashboardData {
  // Core counts
  totalPosts: number;
  adCount: number;
  adPct: number;
  suggestedCount: number;
  followedCount: number;
  suggestedPct: number;
  followedPct: number;

  // Top creators
  topCreators: CreatorStat[];
  top5Pct: number;
  uniqueCreatorCount: number;

  // Top advertisers (from ad posts)
  topAdvertisers: AdvertiserStat[];

  // Content types
  contentTypes: { label: string; count: number; percentage: number }[];

  // Insights (for InsightHero component)
  overviewInsight: InsightHeroData;
  sourcesInsight: InsightHeroData;
  adsInsight: InsightHeroData;
  suggestedInsight: InsightHeroData;
  politicsInsight: InsightHeroData;
  toneInsight: InsightHeroData;

  // Political analysis (from Gemini)
  politicalAnalysis: PoliticalAnalysis | null;

  // Tone analysis (from Gemini)
  toneAnalysis: ToneAnalysis | null;

  // Top sources by tone (top 3 positive and negative)
  topPositiveSources: ToneSourceStat[];
  topNegativeSources: ToneSourceStat[];

  // Tone comparison: suggested vs followed
  toneBySourceOrigin: ToneBySourceOrigin | null;

  // Creator novelty analysis (for Suggested vs Followed tab)
  creatorNovelty: CreatorNovelty | null;

  // Political summary sentence
  politicalSummary: string | null;

  // AI content analysis (for Overview tab)
  aiContentAnalysis: AiContentAnalysis | null;

  // Ads tab: new parity fields
  unlabeledPromos: UnlabeledPromos | null;
  topAdvertisedProductTypes: AdvertisedProductType[];
  toneBySelling: ToneBySelling | null;
  toneByPolitical: ToneByPolitical | null;
  brandsAndInfluencers: BrandsAndInfluencers | null;

  // Suggested tab: new parity fields
  byPlatform: ByPlatformBreakdown[] | null;
  commercialComparison: CommercialComparison | null;
  topTopicsBySuggested: TopicFrequency[];
  topTopicsByFollowed: TopicFrequency[];
  contentFormatComparison: ContentFormatComparison[];

  // Scan metadata
  platform: string;
  scanDate: string | null;

  // Flags
  hasData: boolean;
  hasPoliticsData: boolean;
  hasToneData: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function countByCreator(posts: RawPost[]): Record<string, { count: number; displayName: string | null }> {
  const counts: Record<string, { count: number; displayName: string | null }> = {};
  for (const p of posts) {
    // Use display name as fallback when handle is missing, to reduce "Unknown" bucket
    const handle = p.creator_handle || p.creator_display_name || 'Unknown';
    if (!counts[handle]) {
      counts[handle] = { count: 0, displayName: p.creator_display_name };
    }
    counts[handle].count++;
  }
  return counts;
}

function countContentTypes(posts: RawPost[]): { label: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const type = p.content_type || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  }
  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
      percentage: Math.round((count / posts.length) * 100),
    }));

  // Correct rounding so percentages sum to exactly 100
  if (sorted.length > 0) {
    const total = sorted.reduce((sum, item) => sum + item.percentage, 0);
    if (total !== 100 && total !== 0) {
      const first = sorted[0];
      if (first) first.percentage += (100 - total);
    }
  }

  return sorted;
}

// ─── Insight Builders ────────────────────────────────────
// Pattern: observation → implication → context
// Following insightBuilders.js from the web codebase

function buildOverviewInsight(
  totalPosts: number,
  top5Pct: number,
  platform: string,
): InsightHeroData {
  const meta = `Based on ${totalPosts} posts from ${platform}`;

  if (totalPosts < 10) {
    return {
      title: 'Not enough data yet',
      meaning: 'Scan at least 10 posts to see meaningful patterns in your feed.',
      whyCare: null,
      meta,
    };
  }

  if (top5Pct >= 60) {
    return {
      title: `${top5Pct}% of your feed comes from just 5 accounts`,
      meaning: `Roughly ${Math.round(top5Pct / 10)} out of every 10 posts you scrolled past came from the same small group of creators.`,
      whyCare: 'The typical range is 40–60%. A small number of creators have outsized presence in what you see.',
      meta,
    };
  } else if (top5Pct >= 40) {
    return {
      title: `Your top 5 sources make up ${top5Pct}% of your feed`,
      meaning: 'Nearly half of what you scroll through comes from a handful of familiar accounts. The rest is spread across many voices.',
      whyCare: 'This falls within the typical range (40–60%). A mix of familiar sources and new perspectives.',
      meta,
    };
  } else {
    return {
      title: `Your feed draws from many voices (${top5Pct}% from top 5)`,
      meaning: 'No small group of creators dominates what you see. Your attention is distributed across a wide range of sources.',
      whyCare: 'This is below the typical range of 40–60%, meaning more diverse perspectives appear in your feed.',
      meta,
    };
  }
}

/**
 * "How we measure" prose for the Sources tab.
 *
 * Carry-forward from legacy SourcesContent in dashboard.tsx pre-build #51,
 * where these three strings were hard-coded as a JSX prop on the legacy
 * InsightHero component. Lifted to the data layer so the redesigned
 * SourcesTab (src/screens/dashboard/SourcesTab.tsx) consumes them from
 * `data.sourcesInsight.howWeMeasure` instead of duplicating prose in
 * the screen file.
 */
const SOURCES_HOW_WE_MEASURE = {
  what:
    'Which accounts created the content you scrolled past, and how concentrated your feed is among a few sources.',
  how:
    'We extract the creator handle from each post and rank by frequency. Top-5 concentration is the percentage of all posts from your five most-shown accounts.',
  limitations:
    'Some posts may not have identifiable creators (e.g. promoted content without a visible handle). These are excluded from source analysis.',
} as const;

function buildSourcesInsight(
  topCreators: CreatorStat[],
  totalPosts: number,
  top5Pct: number,
  platform: string,
): InsightHeroData {
  const meta = `Based on ${totalPosts} posts from ${platform}`;

  if (topCreators.length === 0 || totalPosts < 10) {
    return {
      title: 'Not enough data to assess source patterns',
      meaning: 'Need at least 10 posts with identifiable creators to analyze source distribution.',
      whyCare: null,
      meta,
      howWeMeasure: SOURCES_HOW_WE_MEASURE,
    };
  }

  const topName = topCreators[0]?.name || 'one account';
  const topPct = topCreators[0]?.percentage || 0;

  if (top5Pct >= 75) {
    return {
      title: `5 accounts account for ${top5Pct}% of the content in your feed`,
      meaning: `${formatHandle(topName)} alone appeared in ${topPct}% of posts. Three-quarters of your feed came from a tiny group.`,
      whyCare: 'This is well above typical (40–60%). These creators have significant presence in your feed.',
      meta,
      howWeMeasure: SOURCES_HOW_WE_MEASURE,
    };
  } else if (top5Pct >= 50) {
    return {
      title: `A few recurring voices fill ${top5Pct}% of your feed`,
      meaning: `${formatHandle(topName)} appeared most often at ${topPct}% of posts. About half of your content comes from your most-shown accounts.`,
      whyCare: 'This is at the higher end of typical (40–60%).',
      meta,
      howWeMeasure: SOURCES_HOW_WE_MEASURE,
    };
  } else {
    return {
      title: `Your feed balances familiar and new (${top5Pct}% from top 5)`,
      meaning: 'Less than half of posts come from your top sources. You regularly encounter content from accounts outside your core group.',
      whyCare: 'A healthy balance of familiarity and discovery.',
      meta,
      howWeMeasure: SOURCES_HOW_WE_MEASURE,
    };
  }
}

/**
 * "How we measure" prose for the Ads tab.
 *
 * Carry-forward from the legacy AdsContent in dashboard.tsx pre-build #52,
 * where these three strings were hard-coded as a JSX prop on the legacy
 * InsightHero component (the `howWeMeasure={{...}}` prop on the
 * InsightHero in AdsContent, pre-redesign). Lifted to the data layer so
 * the redesigned AdsTab (src/screens/dashboard/AdsTab.tsx) consumes them
 * from `data.adsInsight.howWeMeasure` instead of duplicating prose in
 * the screen file — mirrors the SOURCES_HOW_WE_MEASURE and
 * POLITICS_HOW_WE_MEASURE patterns established in build #51.
 */
const ADS_HOW_WE_MEASURE = {
  what:
    'The share of your feed that contains labeled ads and likely promotional content.',
  how:
    'We identify ads based on platform-provided labels (e.g. "Sponsored", "Ad") and promotional URL patterns. Each post is checked for these signals.',
  limitations:
    'Some native advertising or influencer partnerships may not be detected if they lack standard ad labels. Only explicitly labeled content is counted in the headline percentage; the "unlabeled promotions" section surfaces softer signals separately.',
} as const;

function buildAdsInsight(
  adPct: number,
  adCount: number,
  totalPosts: number,
  platform: string,
): InsightHeroData {
  const meta = `Based on ${totalPosts} posts from ${platform}`;
  const adMinutesIn60 = Math.round(60 * adPct / 100);

  if (totalPosts < 10) {
    return {
      title: 'Not enough data to assess ads',
      meaning: 'Need at least 10 posts to analyze advertising patterns.',
      whyCare: null,
      meta,
      howWeMeasure: ADS_HOW_WE_MEASURE,
    };
  }

  if (adPct >= 40) {
    return {
      title: `${adPct}% of your feed was ads`,
      meaning: `That's about ${adMinutesIn60} minutes of ads in every hour you scroll. ${adCount} ads appeared among ${totalPosts} posts.`,
      whyCare: 'This is above the typical range of 15–30%. A large share of what appeared in your feed was advertising.',
      meta,
      howWeMeasure: ADS_HOW_WE_MEASURE,
    };
  } else if (adPct >= 20) {
    return {
      title: `About 1 in ${Math.round(100 / Math.max(adPct, 1))} posts is an ad (${adPct}%)`,
      meaning: `${adCount} labeled ads appeared among ${totalPosts} posts. That translates to roughly ${adMinutesIn60} minutes of ad content per hour.`,
      whyCare: 'This falls within the typical range (15–30%).',
      meta,
      howWeMeasure: ADS_HOW_WE_MEASURE,
    };
  } else if (adPct >= 5) {
    return {
      title: `${adPct}% of your feed contained ads`,
      meaning: `${adCount} ad${adCount !== 1 ? 's' : ''} appeared among ${totalPosts} posts. A moderate but not dominant presence.`,
      whyCare: 'This is within the typical range. A regular but not overwhelming presence of ads.',
      meta,
      howWeMeasure: ADS_HOW_WE_MEASURE,
    };
  } else {
    // MC-007/MC-008 FIX: Handle zero-count gracefully, replace "detected" with friendlier language
    const meaningText = adCount === 0
      ? `This scan captured ${totalPosts} posts with no visible ad labels.`
      : `${adCount} labeled ad${adCount !== 1 ? 's' : ''} appeared among ${totalPosts} posts.`;
    return {
      title: adCount === 0
        ? `No labeled ads appeared in this ${totalPosts}-post scan`
        : `Ads were minimal in your feed (${adPct}%)`,
      meaning: meaningText,
      whyCare: adCount === 0
        ? 'Some promotional content may not carry visible labels, native ads and influencer partnerships often blend in.'
        : 'This is below the typical range of 15–30%, leaving more space for non-ad content.',
      meta,
      howWeMeasure: ADS_HOW_WE_MEASURE,
    };
  }
}

/**
 * "How we measure" prose for the Suggested vs. Followed tab.
 *
 * Carry-forward from the legacy SuggestedContent in dashboard.tsx
 * pre-build #52, where these three strings were hard-coded as a JSX
 * prop on the legacy InsightHero component (the `howWeMeasure={{...}}`
 * prop on the InsightHero in SuggestedContent, pre-redesign). Lifted
 * to the data layer so the redesigned SuggestedTab
 * (src/screens/dashboard/SuggestedTab.tsx) consumes it from
 * `data.suggestedInsight.howWeMeasure` — mirrors the
 * SOURCES_/POLITICS_/ADS_HOW_WE_MEASURE patterns from builds #51-52.
 */
const SUGGESTED_HOW_WE_MEASURE = {
  what:
    'How much of your feed comes from accounts you follow versus content recommended by the platform.',
  how:
    'Each post is classified as "following" or "suggested" based on platform indicators, labels like "Suggested for you" or "Recommended", or the absence of a follow relationship.',
  limitations:
    'Platform indicators vary and may not always be present. Some platforms mix followed and suggested content without clear labels. Classification is based on observable signals only.',
} as const;

function buildSuggestedInsight(
  suggestedPct: number,
  suggestedCount: number,
  followedCount: number,
  totalPosts: number,
  platform: string,
): InsightHeroData {
  const meta = `Based on ${totalPosts} posts from ${platform}`;
  const followedPct = 100 - suggestedPct;

  if (totalPosts < 10) {
    return {
      title: 'Not enough data to compare content origins',
      meaning: 'Need at least 10 posts to analyze suggested vs followed content.',
      whyCare: null,
      meta,
      howWeMeasure: SUGGESTED_HOW_WE_MEASURE,
    };
  }

  if (suggestedPct >= 80) {
    return {
      title: `${suggestedPct}% of your feed came from accounts you don't follow`,
      meaning: `Only ${followedCount} of ${totalPosts} posts were from accounts you follow. The vast majority appeared through the platform's recommendation system.`,
      whyCare: 'When most content is suggested, your feed contains more content from accounts you don\'t follow than from those you do.',
      meta,
      howWeMeasure: SUGGESTED_HOW_WE_MEASURE,
    };
  } else if (suggestedPct >= 50) {
    return {
      title: `More than half your feed is suggested content (${suggestedPct}%)`,
      meaning: `${suggestedCount} posts came from accounts you don't follow, while ${followedCount} came from accounts you do. The platform's recommendations outweigh your follow list.`,
      whyCare: 'When suggested content exceeds followed content, a larger portion of your feed consisted of recommended content.',
      meta,
      howWeMeasure: SUGGESTED_HOW_WE_MEASURE,
    };
  } else if (suggestedPct >= 20) {
    return {
      title: `Your feed mixes followed and suggested content (${suggestedPct}% suggested)`,
      meaning: `${followedCount} posts came from accounts you follow, with ${suggestedCount} suggested. Most of your feed comes from accounts you follow.`,
      whyCare: 'A balanced mix means your feed reflects both your own choices and platform recommendations.',
      meta,
      howWeMeasure: SUGGESTED_HOW_WE_MEASURE,
    };
  } else {
    return {
      title: `Your feed is mostly from accounts you follow (${followedPct}%)`,
      meaning: `${followedCount} of ${totalPosts} posts came from followed accounts. Very little was suggested by the platform.`,
      whyCare: 'Your follow choices strongly determine what appears in your feed.',
      meta,
      howWeMeasure: SUGGESTED_HOW_WE_MEASURE,
    };
  }
}

/**
 * "How we measure" prose for the Politics tab.
 *
 * Carry-forward from two legacy locations in dashboard.tsx pre-build #51:
 *   1. The inline `howWeMeasure` JSX prop on InsightHero in PoliticsContent
 *      (what / how / limitations triplet — this is the substantive content).
 *   2. The standalone `PoliticsMethodologyDisclaimer` subcomponent (a single
 *      paragraph reiterating the same methodology in different words).
 *
 * The two sources said substantively the same thing; the merged copy here
 * keeps the tighter what/how/limitations structure from source #1 and
 * folds in the disclaimer's "describes what appeared, not your views or
 * the platform's intent" framing into limitations. Lifted to the data
 * layer so the redesigned PoliticsTab
 * (src/screens/dashboard/PoliticsTab.tsx) consumes it from
 * `data.politicsInsight.howWeMeasure` instead of duplicating prose in
 * the screen file (mirrors the SOURCES_HOW_WE_MEASURE pattern).
 */
const POLITICS_HOW_WE_MEASURE = {
  what:
    'The share of your feed that contained political keywords and themes, and the approximate ideological distribution of those posts.',
  how:
    'Post text is analyzed by Google\'s Gemini AI to detect political content and approximate ideological alignment (left, center, or right) based on stance keywords found in each post.',
  limitations:
    'AI classification is approximate. Short posts may be misclassified. Ideological alignment is based on keyword signals, not nuanced understanding. This describes what appeared in your feed. It does not infer your personal views or the platform\'s intent.',
} as const;

function buildPoliticsInsight(
  platform: string,
  totalPosts: number,
  analysis: PoliticalAnalysis | null,
): InsightHeroData {
  // No AI analysis available — show consent prompt
  if (!analysis) {
    return {
      title: 'Political content analysis requires AI',
      meaning: 'To identify political content in your feed, AlgorithmLens uses Google\'s Gemini AI to analyze post text. This gives you an accurate count of how much political content appears in your feed.',
      whyCare: 'Enable AI analysis in Settings to unlock this tab. Your data is processed securely, Google does not use it to train models.',
      meta: `${totalPosts} posts available for analysis from ${platform}`,
      howWeMeasure: POLITICS_HOW_WE_MEASURE,
    };
  }

  // Low sample — show cautious messaging
  if (analysis.lowSample) {
    return {
      title: 'Limited political content appeared in this scan',
      meaning: 'Fewer than 10 posts contained political keywords, which is not enough to draw reliable conclusions about the political makeup of your feed.',
      whyCare: 'Scan more content to build a clearer picture. Political signals can vary a lot between sessions.',
      meta: `Based on ${analysis.totalAnalyzed} analyzed posts from ${platform}`,
      howWeMeasure: POLITICS_HOW_WE_MEASURE,
    };
  }

  const meta = `Based on ${analysis.totalAnalyzed} analyzed posts from ${platform}`;

  if (analysis.politicalPct >= 30) {
    return {
      title: `${analysis.politicalPct}% of your feed contained political content`,
      meaning: `${analysis.politicalCount} of ${analysis.totalAnalyzed} posts showed political keywords or themes. A notable share of what appeared in your feed touched on political topics.`,
      whyCare: 'This is above typical (5–15%). Political content had a strong presence in this scan window.',
      meta,
      howWeMeasure: POLITICS_HOW_WE_MEASURE,
    };
  } else if (analysis.politicalPct >= 10) {
    return {
      title: `About 1 in ${Math.round(100 / Math.max(analysis.politicalPct, 1))} posts contained political content`,
      meaning: `${analysis.politicalCount} of ${analysis.totalAnalyzed} posts showed political keywords or themes. A moderate presence in your feed.`,
      whyCare: 'This falls within the typical range (5–15%).',
      meta,
      howWeMeasure: POLITICS_HOW_WE_MEASURE,
    };
  } else {
    return {
      title: `Political content appeared in ${analysis.politicalPct}% of your feed`,
      meaning: `Only ${analysis.politicalCount} of ${analysis.totalAnalyzed} posts contained political keywords. Most of your feed focused on other topics.`,
      whyCare: 'Political content had a light presence in this scan window.',
      meta,
      howWeMeasure: POLITICS_HOW_WE_MEASURE,
    };
  }
}

// ─── Political Data Extraction ───────────────────────────
// Extracts political analysis from Gemini-enriched scan data.
// Returns null if no AI analysis was performed.

function extractPoliticalAnalysis(raw: ScanRecord['raw_data']): PoliticalAnalysis | null {
  const analysis = raw?.analysis;
  if (!analysis?.ai_analyzed || !analysis.feed_items) {
    return null;
  }

  const feedItems = analysis.feed_items;
  const totalAnalyzed = feedItems.length;

  if (totalAnalyzed === 0) return null;

  // Count political posts
  let politicalCount = 0;
  let leftCount = 0;
  let centerCount = 0;
  let rightCount = 0;
  const creatorPoliticalCounts: Record<string, { count: number; handle: string }> = {};

  for (const item of feedItems) {
    if (!item.political?.is_political) continue;
    politicalCount++;

    // A-06 FIX: Support both field names from different pipeline versions
    const stance = (item.political.stance_or_alignment || item.political.stance_or_alignment_guess || '').toLowerCase();
    if (stance === 'left') leftCount++;
    else if (stance === 'neutral' || stance === 'center') centerCount++;
    else if (stance === 'right') rightCount++;

    // Track per-creator political counts — A-06: support both nested and flat creator fields
    const handle = item.creator?.handle || item.creator?.name || item.creator_handle || '';
    if (handle) {
      if (!creatorPoliticalCounts[handle]) {
        creatorPoliticalCounts[handle] = { count: 0, handle };
      }
      creatorPoliticalCounts[handle].count++;
    }
  }

  const politicalPct = totalAnalyzed > 0 ? Math.round((politicalCount / totalAnalyzed) * 100) : 0;
  const lowSample = politicalCount < 10;

  // Ideology distribution (only if enough known alignment)
  const knownTotal = leftCount + centerCount + rightCount;
  let ideology: PoliticalAnalysis['ideology'] = null;

  if (knownTotal >= 10) {
    let leftPct = Math.round((leftCount / knownTotal) * 100);
    let centerPct = Math.round((centerCount / knownTotal) * 100);
    let rightPct = Math.round((rightCount / knownTotal) * 100);

    // Ensure sum is exactly 100
    const sum = leftPct + centerPct + rightPct;
    if (sum !== 100) {
      const diff = 100 - sum;
      if (leftCount >= centerCount && leftCount >= rightCount) leftPct += diff;
      else if (centerCount >= rightCount) centerPct += diff;
      else rightPct += diff;
    }

    ideology = {
      left: leftPct,
      center: centerPct,
      right: rightPct,
      leftCount,
      centerCount,
      rightCount,
      knownTotal,
    };
  }

  // Top political source
  let topPoliticalSource: PoliticalAnalysis['topPoliticalSource'] = null;
  if (politicalCount >= 10) {
    const sortedCreators = Object.values(creatorPoliticalCounts)
      .sort((a, b) => b.count - a.count);
    if (sortedCreators.length > 0) {
      const top = sortedCreators[0];
      if (top) {
        topPoliticalSource = {
          handle: top.handle,
          count: top.count,
          pctOfPolitical: Math.round((top.count / politicalCount) * 100),
        };
      }
    }
  }

  return {
    politicalPct,
    politicalCount,
    totalAnalyzed,
    ideology,
    topPoliticalSource,
    lowSample,
  };
}

// ─── Tone Data Extraction ────────────────────────────────
// Extracts emotional tone analysis from Gemini-enriched scan data.
// Returns null if no AI analysis was performed.

function extractToneAnalysis(raw: ScanRecord['raw_data']): ToneAnalysis | null {
  const analysis = raw?.analysis;
  if (!analysis?.ai_analyzed || !analysis.feed_items) {
    return null;
  }

  const feedItems = analysis.feed_items;
  const totalAnalyzed = feedItems.length;

  if (totalAnalyzed === 0) return null;

  // Count valence categories
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  for (const item of feedItems) {
    const valence = (item.emotions?.valence || '').toUpperCase();
    if (valence === 'POSITIVE') positiveCount++;
    else if (valence === 'NEUTRAL') neutralCount++;
    else if (valence === 'NEGATIVE') negativeCount++;
    else if (valence === 'MIXED') neutralCount++; // Map MIXED → NEUTRAL to avoid data loss
  }

  const knownValenceTotal = positiveCount + neutralCount + negativeCount;

  if (knownValenceTotal === 0) return null;

  const lowSample = knownValenceTotal < 10;

  // Calculate percentages with rounding
  let positivePct = Math.round((positiveCount / knownValenceTotal) * 100);
  let neutralPct = Math.round((neutralCount / knownValenceTotal) * 100);
  let negativePct = Math.round((negativeCount / knownValenceTotal) * 100);

  // Ensure percentages sum to exactly 100
  const sum = positivePct + neutralPct + negativePct;
  if (sum !== 100) {
    const diff = 100 - sum;
    if (positiveCount >= neutralCount && positiveCount >= negativeCount) positivePct += diff;
    else if (neutralCount >= negativeCount) neutralPct += diff;
    else negativePct += diff;
  }

  return {
    positivePct,
    neutralPct,
    negativePct,
    positiveCount,
    neutralCount,
    negativeCount,
    knownValenceTotal,
    totalAnalyzed,
    lowSample,
  };
}

// ─── Top Sources by Tone Extraction ─────────────────────
// Returns top 3 positive and top 3 negative sources by post count.

function extractTopToneSources(raw: ScanRecord['raw_data']): { topPositive: ToneSourceStat[]; topNegative: ToneSourceStat[] } {
  const analysis = raw?.analysis;
  if (!analysis?.ai_analyzed || !analysis.feed_items) {
    return { topPositive: [], topNegative: [] };
  }

  const positiveCounts: Record<string, number> = {};
  const negativeCounts: Record<string, number> = {};

  for (const item of analysis.feed_items) {
    const handle = item.creator?.handle || item.creator?.name || item.creator_handle || '';
    if (!handle) continue;

    const valence = (item.emotions?.valence || '').toUpperCase();
    if (valence === 'POSITIVE') {
      positiveCounts[handle] = (positiveCounts[handle] || 0) + 1;
    } else if (valence === 'NEGATIVE') {
      negativeCounts[handle] = (negativeCounts[handle] || 0) + 1;
    }
  }

  const topPositive = Object.entries(positiveCounts)
    .map(([handle, count]) => ({ handle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topNegative = Object.entries(negativeCounts)
    .map(([handle, count]) => ({ handle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return { topPositive, topNegative };
}

// ─── Tone by Source Origin Extraction ────────────────────
// Compares tone breakdown between suggested and followed posts.

function extractToneBySourceOrigin(posts: RawPost[], raw: ScanRecord['raw_data']): ToneBySourceOrigin | null {
  const analysis = raw?.analysis;
  if (!analysis?.ai_analyzed || !analysis.feed_items) {
    return null;
  }

  // Build a map from position to source origin from raw posts
  const originByPosition: Record<number, boolean | null> = {};
  for (const p of posts) {
    originByPosition[p.position_in_feed] = p.is_suggested;
  }

  let sugPos = 0, sugNeut = 0, sugNeg = 0;
  let folPos = 0, folNeut = 0, folNeg = 0;

  for (let i = 0; i < analysis.feed_items.length; i++) {
    const item = analysis.feed_items[i];
    if (!item) continue;
    const valence = (item.emotions?.valence || '').toUpperCase();
    if (valence !== 'POSITIVE' && valence !== 'NEUTRAL' && valence !== 'NEGATIVE') continue;

    // Try to match with raw post by index position
    const isSuggested = originByPosition[i] ?? null;
    if (isSuggested === null) continue; // unknown origin, skip

    if (isSuggested) {
      if (valence === 'POSITIVE') sugPos++;
      else if (valence === 'NEUTRAL') sugNeut++;
      else sugNeg++;
    } else {
      if (valence === 'POSITIVE') folPos++;
      else if (valence === 'NEUTRAL') folNeut++;
      else folNeg++;
    }
  }

  const sugTotal = sugPos + sugNeut + sugNeg;
  const folTotal = folPos + folNeut + folNeg;

  if (sugTotal < 5 || folTotal < 5) {
    return { hasData: false, suggested: null, followed: null };
  }

  const pct = (n: number, total: number) => Math.round((n / total) * 100);

  return {
    hasData: true,
    suggested: {
      positivePct: pct(sugPos, sugTotal),
      neutralPct: pct(sugNeut, sugTotal),
      negativePct: pct(sugNeg, sugTotal),
      total: sugTotal,
    },
    followed: {
      positivePct: pct(folPos, folTotal),
      neutralPct: pct(folNeut, folTotal),
      negativePct: pct(folNeg, folTotal),
      total: folTotal,
    },
  };
}

// ─── Creator Novelty Extraction ─────────────────────────
// Analyzes how many suggested posts come from creators the user doesn't follow.

function extractCreatorNovelty(posts: RawPost[]): CreatorNovelty | null {
  if (posts.length === 0) return null;

  const suggestedCreators = new Set<string>();
  const followedCreators = new Set<string>();
  let unknownCount = 0;

  for (const p of posts) {
    const handle = (p.creator_handle || '').toLowerCase();
    if (!handle) continue;

    if (p.is_suggested === true) {
      suggestedCreators.add(handle);
    } else if (p.is_suggested === false) {
      followedCreators.add(handle);
    } else {
      unknownCount++;
    }
  }

  if (suggestedCreators.size === 0) return null;

  // Calculate overlap
  const overlap = new Set([...suggestedCreators].filter(c => followedCreators.has(c)));
  const novelCreators = suggestedCreators.size - overlap.size;
  const noveltyPercent = suggestedCreators.size > 0
    ? Math.round((novelCreators / suggestedCreators.size) * 100)
    : 0;

  // Flag as approximate if many posts have unknown origin
  const approximate = unknownCount > posts.length * 0.3;

  return {
    hasData: true,
    noveltyPercent,
    suggestedCreatorCount: suggestedCreators.size,
    followedCreatorCount: followedCreators.size,
    overlapCount: overlap.size,
    approximate,
  };
}

// ─── AI Content Analysis Extraction ─────────────────────
// Checks for AI-labeled content in the scan data.
// Looks in analysis.feed_items and top-level feed_items for ai_disclosure field.

const VISUAL_CONTENT_TYPES = new Set(['video', 'image', 'photo', 'reel', 'short', 'carousel']);

function extractAiContentAnalysis(raw: ScanRecord['raw_data']): AiContentAnalysis | null {
  // Try analysis.feed_items first (Gemini-enriched), then top-level feed_items (unified result)
  const feedItems: UnifiedFeedItemLike[] =
    (raw?.analysis?.feed_items as UnifiedFeedItemLike[] | undefined) ||
    (raw as Record<string, unknown>)?.feed_items as UnifiedFeedItemLike[] ||
    [];

  if (feedItems.length === 0) return null;

  // Check if any item actually has the ai_disclosure field
  const hasAiField = feedItems.some(item => item.ai_disclosure !== undefined);
  if (!hasAiField) return null;

  let labeledCount = 0;
  let totalVisualPosts = 0;

  for (const item of feedItems) {
    const contentType = (item.content_type || '').toLowerCase();
    if (!VISUAL_CONTENT_TYPES.has(contentType)) continue;

    totalVisualPosts++;
    if (item.ai_disclosure === 'LABELED_AI') {
      labeledCount++;
    }
  }

  if (totalVisualPosts === 0) return null;

  const noSignalsCount = totalVisualPosts - labeledCount;
  const labeledPct = Math.round((labeledCount / totalVisualPosts) * 100);

  return {
    labeledCount,
    noSignalsCount,
    labeledPct,
    totalVisualPosts,
  };
}

// ─── Political Summary Builder ──────────────────────────
// Generates a single summary sentence for the Political tab.

function buildPoliticalSummary(analysis: PoliticalAnalysis | null): string | null {
  if (!analysis || analysis.lowSample) return null;

  let summary = `Based on keyword and AI analysis, your feed appeared to contain ${analysis.politicalPct}% political content`;

  if (analysis.topPoliticalSource) {
    summary += `, mostly from ${formatHandle(analysis.topPoliticalSource.handle)}`;
  }

  if (analysis.ideology) {
    const { left, center, right } = analysis.ideology;
    const max = Math.max(left, center, right);
    if (max === left && left > center + 10 && left > right + 10) {
      summary += '. The ideological distribution appeared to lean left.';
    } else if (max === right && right > center + 10 && right > left + 10) {
      summary += '. The ideological distribution appeared to lean right.';
    } else if (max === center && center > left + 10 && center > right + 10) {
      summary += '. The ideological distribution appeared mostly center.';
    } else {
      summary += '. The ideological distribution appeared relatively balanced.';
    }
  } else {
    summary += '.';
  }

  return summary;
}

/**
 * "How we measure" prose for the Tone tab.
 *
 * Carry-forward from the legacy ToneContent in dashboard.tsx pre-build #53,
 * where these three strings were hard-coded as a JSX prop on the legacy
 * InsightHero component (the `howWeMeasure={{...}}` prop on the
 * InsightHero in ToneContent, pre-redesign). Lifted to the data layer
 * so the redesigned ToneTab (src/screens/dashboard/ToneTab.tsx) consumes
 * it from `data.toneInsight.howWeMeasure` — mirrors the
 * SOURCES_/POLITICS_/ADS_/SUGGESTED_HOW_WE_MEASURE patterns from builds
 * #51-52.
 *
 * The legacy ToneContent also rendered a standalone
 * ToneMethodologyDisclaimer subcomponent paragraph that said
 * substantively the same thing as `limitations`. That subcomponent is
 * deleted in build #53 and not merged here; the InsightHero version
 * lifted below is the more comprehensive of the two (it adds the
 * "Sarcasm and irony are difficult to detect" caveat).
 */
const TONE_HOW_WE_MEASURE = {
  what:
    'The emotional character of posts in your feed, categorized as positive, neutral, or negative.',
  how:
    'Post text is analyzed by Google\'s Gemini AI to classify emotional tone based on language patterns. Each post receives one valence label.',
  limitations:
    'Sentiment analysis is approximate, tone is subjective, and short posts may be misclassified. Sarcasm and irony are difficult to detect. This describes what appeared, not your emotional state or the platform\'s intent.',
} as const;

function buildToneInsight(
  platform: string,
  totalPosts: number,
  analysis: ToneAnalysis | null,
): InsightHeroData {
  // No AI analysis available — show consent prompt
  if (!analysis) {
    return {
      title: 'Emotional tone analysis requires AI',
      meaning: 'To classify the emotional tone of posts (positive, neutral, negative), AlgorithmLens uses Google\'s Gemini AI. This reveals the emotional character of your feed.',
      whyCare: 'Enable AI analysis in Settings to unlock this tab. Your data is processed securely, Google does not use it to train models.',
      meta: `${totalPosts} posts available for analysis from ${platform}`,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  // Low sample — show cautious messaging
  if (analysis.lowSample) {
    return {
      title: 'Limited tone data in this scan',
      meaning: 'Fewer than 10 posts had identifiable emotional tone, which is not enough to draw reliable conclusions about the emotional character of your feed.',
      whyCare: 'Scan more content to build a clearer picture. Emotional tone can vary a lot between sessions.',
      meta: `Based on ${analysis.knownValenceTotal} posts with tone data from ${platform}`,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  const meta = `Based on ${analysis.knownValenceTotal} posts with tone data from ${platform}`;
  const pos = analysis.positivePct;
  const neut = analysis.neutralPct;
  const neg = analysis.negativePct;
  const max = Math.max(pos, neut, neg);
  const spread = max - Math.min(pos, neut, neg);

  if (spread < 15) {
    return {
      title: `Your feed has a balanced emotional mix (${pos}% positive, ${neut}% neutral, ${neg}% negative)`,
      meaning: 'No single emotional tone dominates. You encounter a roughly even spread of upbeat, informational, and conflict-focused content.',
      whyCare: 'A balanced feed means your feed shows a mix of emotional tones without a strong lean in one direction.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  if (neg === max && neg >= 35) {
    const negMinutesIn60 = Math.round(60 * neg / 100);
    return {
      title: `${neg}% of your feed carried negative or conflict-focused tone`,
      meaning: `More than 1 in 3 posts appeared framed around conflict, outrage, or negativity. In a 60-minute session, that would be about ${negMinutesIn60} minutes of negative content.`,
      whyCare: 'Typical negative tone is 20–30%. Above that, a feed with a high proportion of negative content may present a skewed picture.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  if (pos === max && pos >= 35) {
    return {
      title: `Your feed skewed positive (${pos}% positive tone)`,
      meaning: 'More than 1 in 3 posts carried upbeat or happy emotional framing. Your scrolling experience leaned optimistic.',
      whyCare: 'Positive feeds can boost mood but may also create a highlight reel effect.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  if (neut === max && neut >= 35) {
    return {
      title: `Your feed was mostly informational (${neut}% neutral tone)`,
      meaning: 'Most posts appeared balanced or factual rather than emotionally charged.',
      whyCare: 'Neutral tone creates space for reflection without a dominant emotional tone.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }

  // Fallback
  if (neg === max) {
    return {
      title: `Negative tone appeared most often in your feed (${neg}%)`,
      meaning: `Negative or conflict-focused posts slightly outpaced positive (${pos}%) and neutral (${neut}%) content.`,
      whyCare: 'A modest lean toward negative content is present in your feed.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  } else if (pos === max) {
    return {
      title: `Positive tone led your feed (${pos}%)`,
      meaning: `Upbeat content slightly outpaced neutral (${neut}%) and negative (${neg}%) posts.`,
      whyCare: 'A positive lean can improve mood during scrolling, though it may also filter out important but difficult topics.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  } else {
    return {
      title: `Neutral tone led your feed (${neut}%)`,
      meaning: `Balanced or informational content outpaced positive (${pos}%) and negative (${neg}%) posts.`,
      whyCare: 'A neutral lean means your feed appeared less emotionally activating.',
      meta,
      howWeMeasure: TONE_HOW_WE_MEASURE,
    };
  }
}

// ─── Unlabeled Promos Extraction ─────────────────────────
// Identifies posts with influence signals that are not labeled as ads.
// Returns null if the scan data doesn't contain influenceSignals fields.

function extractUnlabeledPromos(posts: RawPost[], raw: ScanRecord['raw_data']): UnlabeledPromos | null {
  const feedItems = raw?.analysis?.feed_items;
  if (!feedItems || feedItems.length === 0) return null;

  // Check if any item has influenceSignals field — if not, pipeline doesn't support it yet
  const hasInfluenceField = feedItems.some(
    (item) => Array.isArray((item as unknown as Record<string, unknown>).influenceSignals)
  );
  if (!hasInfluenceField) return null;

  let count = 0;
  const triggerCounts: Record<string, number> = {};
  const accountSet = new Set<string>();

  for (let i = 0; i < feedItems.length; i++) {
    const item = feedItems[i] as any;
    const signals: string[] = item.influenceSignals || [];
    if (signals.length === 0) continue;

    // Check if the corresponding raw post is NOT labeled as an ad
    const rawPost = posts[i];
    if (rawPost?.is_ad) continue;

    count++;

    // Track triggers
    for (const signal of signals) {
      triggerCounts[signal] = (triggerCounts[signal] || 0) + 1;
    }

    // Track accounts
    const handle = item.creator?.handle || item.creator_handle || rawPost?.creator_handle || '';
    if (handle) accountSet.add(handle);
  }

  if (count === 0) return null;

  const totalPosts = posts.length || feedItems.length;
  const percentage = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;

  const topTriggers = Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, cnt]) => ({ name, count: cnt }));

  const exampleAccounts = [...accountSet].slice(0, 5);

  return { count, percentage, topTriggers, exampleAccounts };
}

// ─── Top Advertised Product Types Extraction ─────────────
// Groups ad posts by product category / primary topic.

function extractTopAdvertisedProductTypes(posts: RawPost[], raw: ScanRecord['raw_data']): AdvertisedProductType[] {
  const feedItems = raw?.analysis?.feed_items;
  if (!feedItems) return [];

  const adPosts = posts.filter(p => p.is_ad);
  if (adPosts.length === 0) return [];

  const themeCounts: Record<string, { count: number; advertisers: Set<string> }> = {};

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post || !post.is_ad) continue;

    const analysisItem = feedItems[i] as any;
    if (!analysisItem) continue;

    // Try to extract category from topics.primary_category or ad_metadata.product_or_service
    const category =
      analysisItem?.topics?.primary_category ||
      analysisItem?.ad_metadata?.product_or_service ||
      null;

    if (!category) continue;

    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

    const bucket = themeCounts[normalized] ?? (themeCounts[normalized] = { count: 0, advertisers: new Set<string>() });
    bucket.count++;

    const handle = post.creator_handle || post.creator_display_name || '';
    if (handle) bucket.advertisers.add(handle);
  }

  const totalAds = adPosts.length;

  return Object.entries(themeCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([theme, data]) => ({
      theme,
      percentage: totalAds > 0 ? Math.round((data.count / totalAds) * 100) : 0,
      count: data.count,
      exampleAdvertisers: [...data.advertisers].slice(0, 3),
    }));
}

// ─── Tone by Selling Extraction ──────────────────────────
// Splits posts into "selling" (is_ad or has influence signals) and "not selling",
// then computes tone percentages for each group.

function extractToneBySelling(posts: RawPost[], raw: ScanRecord['raw_data']): ToneBySelling | null {
  const feedItems = raw?.analysis?.feed_items;
  if (!feedItems || feedItems.length === 0) return null;

  let sellPos = 0, sellNeut = 0, sellNeg = 0;
  let nonPos = 0, nonNeut = 0, nonNeg = 0;

  for (let i = 0; i < feedItems.length; i++) {
    const item = feedItems[i] as any;
    const valence = (item?.emotions?.valence || '').toUpperCase();
    if (valence !== 'POSITIVE' && valence !== 'NEUTRAL' && valence !== 'NEGATIVE') continue;

    const rawPost = posts[i];
    const isSelling = rawPost?.is_ad ||
      (Array.isArray(item.influenceSignals) && item.influenceSignals.length > 0);

    if (isSelling) {
      if (valence === 'POSITIVE') sellPos++;
      else if (valence === 'NEUTRAL') sellNeut++;
      else sellNeg++;
    } else {
      if (valence === 'POSITIVE') nonPos++;
      else if (valence === 'NEUTRAL') nonNeut++;
      else nonNeg++;
    }
  }

  const sellTotal = sellPos + sellNeut + sellNeg;
  const nonTotal = nonPos + nonNeut + nonNeg;

  // Require >= 10 posts per group
  if (sellTotal < 10 || nonTotal < 10) return null;

  const pct = (n: number, total: number) => Math.round((n / total) * 100);

  const selling = {
    positivePct: pct(sellPos, sellTotal),
    neutralPct: pct(sellNeut, sellTotal),
    negativePct: pct(sellNeg, sellTotal),
    total: sellTotal,
  };

  const notSelling = {
    positivePct: pct(nonPos, nonTotal),
    neutralPct: pct(nonNeut, nonTotal),
    negativePct: pct(nonNeg, nonTotal),
    total: nonTotal,
  };

  // Calculate biggest difference
  const posDelta = Math.abs(selling.positivePct - notSelling.positivePct);
  const neutDelta = Math.abs(selling.neutralPct - notSelling.neutralPct);
  const negDelta = Math.abs(selling.negativePct - notSelling.negativePct);
  const maxDelta = Math.max(posDelta, neutDelta, negDelta);

  let biggestDifference: string | null = null;
  if (maxDelta >= 5) {
    if (posDelta === maxDelta) {
      const direction = selling.positivePct > notSelling.positivePct ? 'more' : 'less';
      biggestDifference = `Selling posts appeared ${posDelta} points ${direction} positive`;
    } else if (negDelta === maxDelta) {
      const direction = selling.negativePct > notSelling.negativePct ? 'more' : 'less';
      biggestDifference = `Selling posts appeared ${negDelta} points ${direction} negative`;
    } else {
      const direction = selling.neutralPct > notSelling.neutralPct ? 'more' : 'less';
      biggestDifference = `Selling posts appeared ${neutDelta} points ${direction} neutral`;
    }
  }

  return { selling, notSelling, biggestDifference };
}

// ─── Tone by Political Extraction ──────────────────────────
// Splits posts into political and non-political groups,
// then computes tone percentages for each.

function extractToneByPolitical(posts: RawPost[], raw: ScanRecord['raw_data']): ToneByPolitical | null {
  const feedItems = raw?.analysis?.feed_items;
  if (!feedItems || feedItems.length === 0) return null;

  let polPos = 0, polNeut = 0, polNeg = 0;
  let nonPos = 0, nonNeut = 0, nonNeg = 0;

  for (let i = 0; i < feedItems.length; i++) {
    const item = feedItems[i] as any;
    const valence = (item?.emotions?.valence || '').toUpperCase();
    if (valence !== 'POSITIVE' && valence !== 'NEUTRAL' && valence !== 'NEGATIVE') continue;

    const isPolitical = item?.political?.is_political === true;

    if (isPolitical) {
      if (valence === 'POSITIVE') polPos++;
      else if (valence === 'NEUTRAL') polNeut++;
      else polNeg++;
    } else {
      if (valence === 'POSITIVE') nonPos++;
      else if (valence === 'NEUTRAL') nonNeut++;
      else nonNeg++;
    }
  }

  const polTotal = polPos + polNeut + polNeg;
  const nonTotal = nonPos + nonNeut + nonNeg;

  // Require >= 10 posts per group
  if (polTotal < 10 || nonTotal < 10) return null;

  const pct = (n: number, total: number) => Math.round((n / total) * 100);

  const political = {
    positivePct: pct(polPos, polTotal),
    neutralPct: pct(polNeut, polTotal),
    negativePct: pct(polNeg, polTotal),
    total: polTotal,
  };

  const nonPolitical = {
    positivePct: pct(nonPos, nonTotal),
    neutralPct: pct(nonNeut, nonTotal),
    negativePct: pct(nonNeg, nonTotal),
    total: nonTotal,
  };

  // Calculate biggest difference
  const posDelta = Math.abs(political.positivePct - nonPolitical.positivePct);
  const neutDelta = Math.abs(political.neutralPct - nonPolitical.neutralPct);
  const negDelta = Math.abs(political.negativePct - nonPolitical.negativePct);
  const maxDelta = Math.max(posDelta, neutDelta, negDelta);

  let biggestDifference: string | null = null;
  if (maxDelta >= 3) {
    if (posDelta === maxDelta) {
      const direction = political.positivePct > nonPolitical.positivePct ? 'more' : 'less';
      biggestDifference = `Political posts appeared ${posDelta} points ${direction} positive`;
    } else if (negDelta === maxDelta) {
      const direction = political.negativePct > nonPolitical.negativePct ? 'more' : 'less';
      biggestDifference = `Political posts appeared ${negDelta} points ${direction} negative`;
    } else {
      const direction = political.neutralPct > nonPolitical.neutralPct ? 'more' : 'less';
      biggestDifference = `Political posts appeared ${neutDelta} points ${direction} neutral`;
    }
  }

  return { political, nonPolitical, biggestDifference };
}

// ─── Brands & Influencers Extraction ────────────────────────
// Brand accounts: creators where adCount/postCount >= 0.5 AND adCount >= 2
// Influencers: creators where postCount >= 3 AND adCount/postCount < 0.5
// Returns top 3 each.

function extractBrandsAndInfluencers(posts: RawPost[]): BrandsAndInfluencers | null {
  if (posts.length < 10) return null;

  const creatorStats: Record<string, { postCount: number; adCount: number }> = {};

  for (const p of posts) {
    const handle = p.creator_handle || p.creator_display_name || '';
    if (!handle || handle === 'Unknown') continue;
    if (!creatorStats[handle]) {
      creatorStats[handle] = { postCount: 0, adCount: 0 };
    }
    creatorStats[handle].postCount++;
    if (p.is_ad) {
      creatorStats[handle].adCount++;
    }
  }

  const brands: BrandOrInfluencer[] = [];
  const influencers: BrandOrInfluencer[] = [];

  for (const [handle, stats] of Object.entries(creatorStats)) {
    const adRatio = stats.postCount > 0 ? stats.adCount / stats.postCount : 0;
    if (adRatio >= 0.5 && stats.adCount >= 2) {
      brands.push({ handle, ...stats });
    } else if (stats.postCount >= 3 && adRatio < 0.5) {
      influencers.push({ handle, ...stats });
    }
  }

  if (brands.length === 0 && influencers.length === 0) return null;

  brands.sort((a, b) => b.adCount - a.adCount);
  influencers.sort((a, b) => b.postCount - a.postCount);

  return {
    topBrands: brands.slice(0, 3),
    topInfluencers: influencers.slice(0, 3),
  };
}

// ─── Commercial Comparison Extraction ────────────────────
// Compares ad percentage in suggested vs followed posts.

function extractCommercialComparison(posts: RawPost[]): CommercialComparison | null {
  const suggestedPosts = posts.filter(p => p.is_suggested === true);
  const followedPosts = posts.filter(p => p.is_suggested === false);

  if (suggestedPosts.length < 5 || followedPosts.length < 5) return null;

  const sugAdCount = suggestedPosts.filter(p => p.is_ad).length;
  const folAdCount = followedPosts.filter(p => p.is_ad).length;

  const sugAdPct = Math.round((sugAdCount / suggestedPosts.length) * 100);
  const folAdPct = Math.round((folAdCount / followedPosts.length) * 100);

  const delta = Math.abs(sugAdPct - folAdPct);
  let biggestDifference: string | null = null;
  if (delta >= 5) {
    const higherGroup = sugAdPct > folAdPct ? 'suggested' : 'followed';
    biggestDifference = `${higherGroup === 'suggested' ? 'Suggested' : 'Followed'} posts contained ${delta} percentage points more ad content`;
  }

  return {
    suggested: { adPct: sugAdPct, total: suggestedPosts.length },
    followed: { adPct: folAdPct, total: followedPosts.length },
    biggestDifference,
  };
}

// ─── Top Topics by Source Origin Extraction ──────────────
// Extracts top topics from suggested and followed posts separately.

function extractTopicsBySourceOrigin(posts: RawPost[], raw: ScanRecord['raw_data']): { suggested: TopicFrequency[]; followed: TopicFrequency[] } {
  const feedItems = raw?.analysis?.feed_items;
  if (!feedItems) return { suggested: [], followed: [] };

  const sugTopics: Record<string, number> = {};
  const folTopics: Record<string, number> = {};
  let sugTotal = 0;
  let folTotal = 0;

  for (let i = 0; i < Math.min(posts.length, feedItems.length); i++) {
    const post = posts[i];
    const item = feedItems[i] as any;
    if (!post || !item) continue;

    const topic = item?.topics?.primary_category || null;
    if (!topic) {
      // Fallback to hashtags
      if (post.hashtags && post.hashtags.length > 0) {
        const tag = post.hashtags[0];
        if (tag) {
          if (post.is_suggested === true) {
            sugTopics[tag] = (sugTopics[tag] || 0) + 1;
            sugTotal++;
          } else if (post.is_suggested === false) {
            folTopics[tag] = (folTopics[tag] || 0) + 1;
            folTotal++;
          }
        }
      }
      continue;
    }

    const normalized = topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();

    if (post.is_suggested === true) {
      sugTopics[normalized] = (sugTopics[normalized] || 0) + 1;
      sugTotal++;
    } else if (post.is_suggested === false) {
      folTopics[normalized] = (folTopics[normalized] || 0) + 1;
      folTotal++;
    }
  }

  const toFrequency = (counts: Record<string, number>, total: number): TopicFrequency[] =>
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

  return {
    suggested: toFrequency(sugTopics, sugTotal),
    followed: toFrequency(folTopics, folTotal),
  };
}

// ─── Content Format Comparison Extraction ────────────────
// Compares content type distribution between suggested and followed posts.

function extractContentFormatComparison(posts: RawPost[]): ContentFormatComparison[] {
  const suggestedPosts = posts.filter(p => p.is_suggested === true);
  const followedPosts = posts.filter(p => p.is_suggested === false);

  if (suggestedPosts.length < 5 || followedPosts.length < 5) return [];

  const allTypes = new Set<string>();
  const sugCounts: Record<string, number> = {};
  const folCounts: Record<string, number> = {};

  for (const p of suggestedPosts) {
    const type = p.content_type || 'unknown';
    allTypes.add(type);
    sugCounts[type] = (sugCounts[type] || 0) + 1;
  }

  for (const p of followedPosts) {
    const type = p.content_type || 'unknown';
    allTypes.add(type);
    folCounts[type] = (folCounts[type] || 0) + 1;
  }

  return [...allTypes]
    .map(format => {
      const sugPct = Math.round(((sugCounts[format] || 0) / suggestedPosts.length) * 100);
      const folPct = Math.round(((folCounts[format] || 0) / followedPosts.length) * 100);
      return {
        format: format.charAt(0).toUpperCase() + format.slice(1),
        suggestedPct: sugPct,
        followedPct: folPct,
        delta: sugPct - folPct,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// ─── Main Computation ────────────────────────────────────

export function computeDashboardData(scan: ScanRecord): DashboardData {
  const raw = scan?.raw_data;
  const posts: RawPost[] = raw?.posts || [];
  const totalPosts = posts.length;
  const platform = getPlatformDisplayName(scan?.platform) !== 'Unknown'
    ? getPlatformDisplayName(scan?.platform)
    : 'your platform';

  // ── Political analysis (from Gemini AI enrichment) ──
  const politicalAnalysis = extractPoliticalAnalysis(raw);
  const hasPoliticsData = politicalAnalysis !== null && politicalAnalysis.politicalCount > 0;

  // ── Tone analysis (from Gemini AI enrichment) ──
  const toneAnalysis = extractToneAnalysis(raw);
  const hasToneData = toneAnalysis !== null && toneAnalysis.knownValenceTotal > 0;

  // If no raw posts, use top-level aggregates
  if (totalPosts === 0) {
    const fallbackTotal = scan?.post_count || 0;
    const adCount = scan?.ad_count || 0;
    const adPct = Math.round(scan?.ad_percentage || 0);
    const suggestedCount = scan?.suggested_count || 0;
    const followedCount = Math.max(0, fallbackTotal - suggestedCount);
    const suggestedPct = Math.round(scan?.suggested_percentage || 0);

    const toneSources = extractTopToneSources(raw);
    const aiContentAnalysis = extractAiContentAnalysis(raw);

    return {
      totalPosts: fallbackTotal,
      adCount,
      adPct,
      suggestedCount,
      followedCount,
      suggestedPct,
      followedPct: 100 - suggestedPct,
      topCreators: [],
      top5Pct: 0,
      uniqueCreatorCount: 0,
      topAdvertisers: [],
      contentTypes: [],
      overviewInsight: buildOverviewInsight(fallbackTotal, 0, platform),
      sourcesInsight: buildSourcesInsight([], fallbackTotal, 0, platform),
      adsInsight: buildAdsInsight(adPct, adCount, fallbackTotal, platform),
      suggestedInsight: buildSuggestedInsight(suggestedPct, suggestedCount, followedCount, fallbackTotal, platform),
      politicsInsight: buildPoliticsInsight(platform, fallbackTotal, politicalAnalysis),
      toneInsight: buildToneInsight(platform, fallbackTotal, toneAnalysis),
      politicalAnalysis,
      toneAnalysis,
      topPositiveSources: toneSources.topPositive,
      topNegativeSources: toneSources.topNegative,
      toneBySourceOrigin: null,
      creatorNovelty: null,
      politicalSummary: buildPoliticalSummary(politicalAnalysis),
      aiContentAnalysis,
      unlabeledPromos: null,
      topAdvertisedProductTypes: [],
      toneBySelling: null,
      toneByPolitical: null,
      brandsAndInfluencers: null,
      byPlatform: null,
      commercialComparison: null,
      topTopicsBySuggested: [],
      topTopicsByFollowed: [],
      contentFormatComparison: [],
      platform,
      scanDate: scan?.created_at || raw?.scanned_at || null,
      hasData: fallbackTotal > 0,
      hasPoliticsData,
      hasToneData,
    };
  }

  // ── Ad stats ──
  const adCount = posts.filter(p => p.is_ad).length;
  const adPct = Math.round((adCount / totalPosts) * 100);

  // ── Suggested vs followed ──
  // PIPELINE FIX H-03: Handle null is_suggested values.
  // When subscription status is unknown (null), distribute unknowns
  // proportionally based on the ratio of known suggested/followed posts.
  // If ALL are unknown, default to a 70/30 suggested/followed split
  // (typical for algorithmic platforms like YouTube).
  const knownSuggested = posts.filter(p => p.is_suggested === true).length;
  const knownFollowed = posts.filter(p => p.is_suggested === false).length;
  const unknownCount = posts.filter(p => p.is_suggested === null || p.is_suggested === undefined).length;

  let suggestedCount: number;
  let followedCount: number;

  if (unknownCount === 0) {
    // All posts have known subscription status
    suggestedCount = knownSuggested;
    followedCount = knownFollowed;
  } else if (knownSuggested + knownFollowed > 0) {
    // Distribute unknowns proportionally based on known ratio
    const knownTotal = knownSuggested + knownFollowed;
    const suggestedRatio = knownSuggested / knownTotal;
    const distributedSuggested = Math.round(unknownCount * suggestedRatio);
    suggestedCount = knownSuggested + distributedSuggested;
    followedCount = knownFollowed + (unknownCount - distributedSuggested);
  } else {
    // ALL posts have unknown status — use platform default (70/30 for YouTube)
    suggestedCount = Math.round(totalPosts * 0.7);
    followedCount = totalPosts - suggestedCount;
  }

  const suggestedPct = totalPosts > 0 ? Math.round((suggestedCount / totalPosts) * 100) : 0;
  const followedPct = 100 - suggestedPct;

  // ── Top creators ──
  const creatorData = countByCreator(posts);
  // Count unique creators excluding "Unknown" bucket
  const unknownBucket = creatorData['Unknown'];
  const uniqueCreatorCount = Object.keys(creatorData).filter(k => k !== 'Unknown').length;
  // Rank creators, excluding "Unknown" from the top list — it's not a real creator
  const topCreators: CreatorStat[] = Object.entries(creatorData)
    .filter(([name]) => name !== 'Unknown')
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      displayName: data.displayName,
      count: data.count,
      percentage: Math.round((data.count / totalPosts) * 100),
    }));

  // Top 5 concentration (of identified creators only)
  const top5Total = topCreators.slice(0, 5).reduce((sum, c) => sum + c.count, 0);
  const top5Pct = totalPosts > 0 ? Math.round((top5Total / totalPosts) * 100) : 0;

  // ── Top advertisers ──
  const advertiserCounts: Record<string, number> = {};
  for (const p of posts) {
    if (p.is_ad) {
      const name = p.creator_handle || p.creator_display_name || 'Unknown advertiser';
      advertiserCounts[name] = (advertiserCounts[name] || 0) + 1;
    }
  }
  const topAdvertisers: AdvertiserStat[] = Object.entries(advertiserCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percent: adCount > 0 ? Math.round((count / adCount) * 100) : 0,
    }));

  // ── Content types ──
  const contentTypes = countContentTypes(posts);

  // ── New cross-tab data ──
  const toneSources = extractTopToneSources(raw);
  const toneBySourceOrigin = extractToneBySourceOrigin(posts, raw);
  const creatorNovelty = extractCreatorNovelty(posts);
  const politicalSummary = buildPoliticalSummary(politicalAnalysis);
  const aiContentAnalysis = extractAiContentAnalysis(raw);

  // ── Ads tab parity fields ──
  const unlabeledPromos = extractUnlabeledPromos(posts, raw);
  const topAdvertisedProductTypes = extractTopAdvertisedProductTypes(posts, raw);
  const toneBySelling = extractToneBySelling(posts, raw);
  const toneByPolitical = extractToneByPolitical(posts, raw);
  const brandsAndInfluencers = extractBrandsAndInfluencers(posts);

  // ── Suggested tab parity fields ──
  // byPlatform: only relevant when multiple scans from different platforms are merged
  // For single-scan data, this is always null. Multi-scan aggregation would happen upstream.
  const byPlatform: ByPlatformBreakdown[] | null = null;
  const commercialComparison = extractCommercialComparison(posts);
  const topicsByOrigin = extractTopicsBySourceOrigin(posts, raw);
  const contentFormatComparison = extractContentFormatComparison(posts);

  return {
    totalPosts,
    adCount,
    adPct,
    suggestedCount,
    followedCount,
    suggestedPct,
    followedPct,
    topCreators,
    top5Pct,
    uniqueCreatorCount,
    topAdvertisers,
    contentTypes,
    overviewInsight: buildOverviewInsight(totalPosts, top5Pct, platform),
    sourcesInsight: buildSourcesInsight(topCreators, totalPosts, top5Pct, platform),
    adsInsight: buildAdsInsight(adPct, adCount, totalPosts, platform),
    suggestedInsight: buildSuggestedInsight(suggestedPct, suggestedCount, followedCount, totalPosts, platform),
    politicsInsight: buildPoliticsInsight(platform, totalPosts, politicalAnalysis),
    toneInsight: buildToneInsight(platform, totalPosts, toneAnalysis),
    politicalAnalysis,
    toneAnalysis,
    topPositiveSources: toneSources.topPositive,
    topNegativeSources: toneSources.topNegative,
    toneBySourceOrigin,
    creatorNovelty,
    politicalSummary,
    aiContentAnalysis,
    unlabeledPromos,
    topAdvertisedProductTypes,
    toneBySelling,
    toneByPolitical,
    brandsAndInfluencers,
    byPlatform,
    commercialComparison,
    topTopicsBySuggested: topicsByOrigin.suggested,
    topTopicsByFollowed: topicsByOrigin.followed,
    contentFormatComparison,
    platform,
    scanDate: scan?.created_at || raw?.scanned_at || null,
    hasData: totalPosts > 0,
    hasPoliticsData,
    hasToneData,
  };
}
