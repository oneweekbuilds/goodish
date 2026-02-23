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

// ─── Types ───────────────────────────────────────────────

interface RawPost {
  creator_handle: string | null;
  creator_display_name: string | null;
  post_text: string;
  is_ad: boolean;
  is_suggested: boolean;
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
  };
  emotions?: {
    valence?: string; // POSITIVE | NEUTRAL | NEGATIVE | MIXED
  };
  creator?: {
    handle?: string;
    name?: string;
  };
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

export interface InsightHeroData {
  title: string;
  meaning: string;
  whyCare: string | null;
  meta: string | null;
}

export interface CreatorStat {
  name: string;
  displayName: string | null;
  count: number;
  percentage: number;
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

  // Flags
  hasData: boolean;
  hasPoliticsData: boolean;
  hasToneData: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

function countByCreator(posts: RawPost[]): Record<string, { count: number; displayName: string | null }> {
  const counts: Record<string, { count: number; displayName: string | null }> = {};
  for (const p of posts) {
    const handle = p.creator_handle || 'Unknown';
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
      sorted[0].percentage += (100 - total);
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
    };
  }

  const topName = topCreators[0]?.name || 'one account';
  const topPct = topCreators[0]?.percentage || 0;

  if (top5Pct >= 75) {
    return {
      title: `5 accounts shape ${top5Pct}% of everything you see`,
      meaning: `@${topName} alone appeared in ${topPct}% of posts. Three-quarters of your feed came from a tiny group.`,
      whyCare: 'This is well above typical (40–60%). These creators have significant presence in your feed.',
      meta,
    };
  } else if (top5Pct >= 50) {
    return {
      title: `A few recurring voices fill ${top5Pct}% of your feed`,
      meaning: `@${topName} appeared most often at ${topPct}% of posts. About half of your content comes from your most-shown accounts.`,
      whyCare: 'This is at the higher end of typical (40–60%).',
      meta,
    };
  } else {
    return {
      title: `Your feed balances familiar and new (${top5Pct}% from top 5)`,
      meaning: 'Less than half of posts come from your top sources. You regularly encounter content from accounts outside your core group.',
      whyCare: 'A healthy balance of familiarity and discovery.',
      meta,
    };
  }
}

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
      title: 'Not enough data to assess commercial content',
      meaning: 'Need at least 10 posts to analyze advertising patterns.',
      whyCare: null,
      meta,
    };
  }

  if (adPct >= 40) {
    return {
      title: `${adPct}% of your feed is commercial content`,
      meaning: `That's about ${adMinutesIn60} minutes of ads in every hour you scroll. ${adCount} ads appeared among ${totalPosts} posts.`,
      whyCare: 'This is above the typical range of 15–30%. A large share of what appeared in your feed was commercial.',
      meta,
    };
  } else if (adPct >= 20) {
    return {
      title: `About 1 in ${Math.round(100 / Math.max(adPct, 1))} posts is an ad (${adPct}%)`,
      meaning: `${adCount} labeled ads appeared among ${totalPosts} posts. That translates to roughly ${adMinutesIn60} minutes of ad content per hour.`,
      whyCare: 'This falls within the typical range (15–30%).',
      meta,
    };
  } else if (adPct >= 5) {
    return {
      title: `${adPct}% of your feed contained ads`,
      meaning: `${adCount} ad${adCount !== 1 ? 's' : ''} appeared among ${totalPosts} posts. A moderate but not dominant presence.`,
      whyCare: 'This is within the typical range. A regular but not overwhelming amount of commercial content.',
      meta,
    };
  } else {
    return {
      title: `Commercial content is minimal in your feed (${adPct}%)`,
      meaning: `Only ${adCount} ad${adCount !== 1 ? 's were' : ' was'} detected among ${totalPosts} posts.`,
      whyCare: 'This is below the typical range of 15–30%, leaving more space for non-commercial content.',
      meta,
    };
  }
}

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
    };
  }

  if (suggestedPct >= 80) {
    return {
      title: `${suggestedPct}% of your feed came from accounts you don't follow`,
      meaning: `Only ${followedCount} of ${totalPosts} posts were from accounts you follow. The vast majority appeared through the platform's recommendation system.`,
      whyCare: 'When most content is suggested, your feed is shaped more by recommendation patterns than by your own follow choices.',
      meta,
    };
  } else if (suggestedPct >= 50) {
    return {
      title: `More than half your feed is suggested content (${suggestedPct}%)`,
      meaning: `${suggestedCount} posts came from accounts you don't follow, while ${followedCount} came from accounts you do. The platform's recommendations outweigh your follow list.`,
      whyCare: 'When suggested content exceeds followed content, a larger portion of your feed consisted of recommended content.',
      meta,
    };
  } else if (suggestedPct >= 20) {
    return {
      title: `Your feed mixes followed and suggested content (${suggestedPct}% suggested)`,
      meaning: `${followedCount} posts came from accounts you follow, with ${suggestedCount} suggested. Your follow choices still drive most of what you see.`,
      whyCare: 'A balanced mix means your feed reflects both your own choices and platform recommendations.',
      meta,
    };
  } else {
    return {
      title: `Your feed is mostly from accounts you follow (${followedPct}%)`,
      meaning: `${followedCount} of ${totalPosts} posts came from followed accounts. Very little was suggested by the platform.`,
      whyCare: 'Your follow choices strongly determine what appears in your feed.',
      meta,
    };
  }
}

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
      whyCare: 'Enable AI analysis in Settings to unlock this tab. Your data is processed securely — Google does not use it to train models.',
      meta: `${totalPosts} posts available for analysis from ${platform}`,
    };
  }

  // Low sample — show cautious messaging
  if (analysis.lowSample) {
    return {
      title: 'Limited political content appeared in this scan',
      meaning: 'Fewer than 10 posts contained political keywords, which is not enough to draw reliable conclusions about the political makeup of your feed.',
      whyCare: 'Scan more content to build a clearer picture. Political signals can vary a lot between sessions.',
      meta: `Based on ${analysis.totalAnalyzed} analyzed posts from ${platform}`,
    };
  }

  const meta = `Based on ${analysis.totalAnalyzed} analyzed posts from ${platform}`;

  if (analysis.politicalPct >= 30) {
    return {
      title: `${analysis.politicalPct}% of your feed contained political content`,
      meaning: `${analysis.politicalCount} of ${analysis.totalAnalyzed} posts showed political keywords or themes. A notable share of what appeared in your feed touched on political topics.`,
      whyCare: 'This is above typical (5–15%). Political content had a strong presence in this scan window.',
      meta,
    };
  } else if (analysis.politicalPct >= 10) {
    return {
      title: `About 1 in ${Math.round(100 / Math.max(analysis.politicalPct, 1))} posts contained political content`,
      meaning: `${analysis.politicalCount} of ${analysis.totalAnalyzed} posts showed political keywords or themes. A moderate presence in your feed.`,
      whyCare: 'This falls within the typical range (5–15%).',
      meta,
    };
  } else {
    return {
      title: `Political content appeared in ${analysis.politicalPct}% of your feed`,
      meaning: `Only ${analysis.politicalCount} of ${analysis.totalAnalyzed} posts contained political keywords. Most of your feed focused on other topics.`,
      whyCare: 'Political content had a light presence in this scan window.',
      meta,
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

    // Count stance distribution
    const stance = (item.political.stance_or_alignment || '').toLowerCase();
    if (stance === 'left') leftCount++;
    else if (stance === 'neutral' || stance === 'center') centerCount++;
    else if (stance === 'right') rightCount++;

    // Track per-creator political counts
    const handle = item.creator?.handle || item.creator?.name || '';
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
      topPoliticalSource = {
        handle: top.handle,
        count: top.count,
        pctOfPolitical: Math.round((top.count / politicalCount) * 100),
      };
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
      whyCare: 'Enable AI analysis in Settings to unlock this tab. Your data is processed securely — Google does not use it to train models.',
      meta: `${totalPosts} posts available for analysis from ${platform}`,
    };
  }

  // Low sample — show cautious messaging
  if (analysis.lowSample) {
    return {
      title: 'Limited tone data in this scan',
      meaning: 'Fewer than 10 posts had identifiable emotional tone, which is not enough to draw reliable conclusions about the emotional character of your feed.',
      whyCare: 'Scan more content to build a clearer picture. Emotional tone can vary a lot between sessions.',
      meta: `Based on ${analysis.knownValenceTotal} posts with tone data from ${platform}`,
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
      whyCare: 'A balanced feed means your mood is not being pulled strongly in one direction by the content you consume.',
      meta,
    };
  }

  if (neg === max && neg >= 35) {
    const negMinutesIn60 = Math.round(60 * neg / 100);
    return {
      title: `${neg}% of your feed carried negative or conflict-focused tone`,
      meaning: `More than 1 in 3 posts appeared framed around conflict, outrage, or negativity. In a 60-minute session, that would be about ${negMinutesIn60} minutes of negative content.`,
      whyCare: 'Typical negative tone is 20–30%. Above that, sustained exposure to negativity can shape how the world feels.',
      meta,
    };
  }

  if (pos === max && pos >= 35) {
    return {
      title: `Your feed skewed positive (${pos}% positive tone)`,
      meaning: 'More than 1 in 3 posts carried upbeat or happy emotional framing. Your scrolling experience leaned optimistic.',
      whyCare: 'Positive feeds can boost mood but may also create a highlight reel effect.',
      meta,
    };
  }

  if (neut === max && neut >= 35) {
    return {
      title: `Your feed was mostly informational (${neut}% neutral tone)`,
      meaning: 'Most posts appeared balanced or factual rather than emotionally charged.',
      whyCare: 'Neutral tone creates space for reflection without strong emotional pulls.',
      meta,
    };
  }

  // Fallback
  if (neg === max) {
    return {
      title: `Negative tone appeared most often in your feed (${neg}%)`,
      meaning: `Negative or conflict-focused posts slightly outpaced positive (${pos}%) and neutral (${neut}%) content.`,
      whyCare: 'Even a modest lean toward negativity can shape what problems feel most urgent.',
      meta,
    };
  } else if (pos === max) {
    return {
      title: `Positive tone led your feed (${pos}%)`,
      meaning: `Upbeat content slightly outpaced neutral (${neut}%) and negative (${neg}%) posts.`,
      whyCare: 'A positive lean can improve mood during scrolling, though it may also filter out important but difficult topics.',
      meta,
    };
  } else {
    return {
      title: `Neutral tone led your feed (${neut}%)`,
      meaning: `Balanced or informational content outpaced positive (${pos}%) and negative (${neg}%) posts.`,
      whyCare: 'A neutral lean means your feed appeared less emotionally activating.',
      meta,
    };
  }
}

// ─── Main Computation ────────────────────────────────────

export function computeDashboardData(scan: ScanRecord): DashboardData {
  const raw = scan?.raw_data;
  const posts: RawPost[] = raw?.posts || [];
  const totalPosts = posts.length;
  const platform = (scan?.platform || 'your platform').charAt(0).toUpperCase() +
    (scan?.platform || 'your platform').slice(1);

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
      contentTypes: [],
      overviewInsight: buildOverviewInsight(fallbackTotal, 0, platform),
      sourcesInsight: buildSourcesInsight([], fallbackTotal, 0, platform),
      adsInsight: buildAdsInsight(adPct, adCount, fallbackTotal, platform),
      suggestedInsight: buildSuggestedInsight(suggestedPct, suggestedCount, followedCount, fallbackTotal, platform),
      politicsInsight: buildPoliticsInsight(platform, fallbackTotal, politicalAnalysis),
      toneInsight: buildToneInsight(platform, fallbackTotal, toneAnalysis),
      politicalAnalysis,
      toneAnalysis,
      hasData: fallbackTotal > 0,
      hasPoliticsData,
      hasToneData,
    };
  }

  // ── Ad stats ──
  const adCount = posts.filter(p => p.is_ad).length;
  const adPct = Math.round((adCount / totalPosts) * 100);

  // ── Suggested vs followed ──
  const suggestedCount = posts.filter(p => p.is_suggested).length;
  const followedCount = Math.max(0, totalPosts - suggestedCount);
  const suggestedPct = Math.round((suggestedCount / totalPosts) * 100);
  const followedPct = 100 - suggestedPct;

  // ── Top creators ──
  const creatorData = countByCreator(posts);
  const topCreators: CreatorStat[] = Object.entries(creatorData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      displayName: data.displayName,
      count: data.count,
      percentage: Math.round((data.count / totalPosts) * 100),
    }));

  // Top 5 concentration
  const top5Total = topCreators.slice(0, 5).reduce((sum, c) => sum + c.count, 0);
  const top5Pct = totalPosts > 0 ? Math.round((top5Total / totalPosts) * 100) : 0;

  // ── Content types ──
  const contentTypes = countContentTypes(posts);

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
    contentTypes,
    overviewInsight: buildOverviewInsight(totalPosts, top5Pct, platform),
    sourcesInsight: buildSourcesInsight(topCreators, totalPosts, top5Pct, platform),
    adsInsight: buildAdsInsight(adPct, adCount, totalPosts, platform),
    suggestedInsight: buildSuggestedInsight(suggestedPct, suggestedCount, followedCount, totalPosts, platform),
    politicsInsight: buildPoliticsInsight(platform, totalPosts, politicalAnalysis),
    toneInsight: buildToneInsight(platform, totalPosts, toneAnalysis),
    politicalAnalysis,
    toneAnalysis,
    hasData: totalPosts > 0,
    hasPoliticsData,
    hasToneData,
  };
}
