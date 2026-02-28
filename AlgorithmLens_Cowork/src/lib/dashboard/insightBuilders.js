/**
 * Insight Builders - Generate data-grounded hero content for dashboard tabs
 *
 * Pattern: observation → implication → context
 * - title: The finding with actual computed values
 * - meaning: What it means in real-world terms (time, attention, behavior)
 * - whyCare: Why this matters personally + benchmark context
 * - meta: Supporting line (e.g., "Based on X posts across Y platforms")
 */

/**
 * Build hero for Overview tab
 */
export function buildOverviewHero({ sourceConcentration, totalPosts, platformCount }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!sourceConcentration.hasData) {
    return {
      title: 'Not enough data to assess source concentration',
      meaning: 'Need at least 10 posts with identifiable creators to show source patterns.',
      whyCare: null,
      meta,
    };
  }

  const top5 = sourceConcentration.top5Percent;

  if (top5 >= 60) {
    return {
      title: `${top5}% of your feed comes from just 5 accounts`,
      meaning: `About 6 in 10 posts you scroll past come from the same small group.`,
      whyCare: 'Above the typical 40–60% range.',
      meta,
    };
  } else if (top5 >= 40) {
    return {
      title: `Your top 5 sources make up ${top5}% of your feed`,
      meaning: `Nearly half of what you scroll through comes from a handful of familiar accounts.`,
      whyCare: 'Within the typical range (40–60%).',
      meta,
    };
  } else {
    return {
      title: `Your feed is spread across many voices (${top5}% from top 5)`,
      meaning: 'No small group of creators dominates what you see.',
      whyCare: 'Below the typical range of 40–60%.',
      meta,
    };
  }
}

/**
 * Build hero for Sources tab
 */
export function buildSourcesHero({ top5Percent, totalPosts, platformCount, hasData }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!hasData) {
    return {
      title: 'Not enough data to assess source patterns',
      meaning: 'Need at least 10 posts with identifiable creators to analyze source distribution.',
      whyCare: null,
      meta,
    };
  }

  if (top5Percent >= 75) {
    return {
      title: `5 accounts shape ${top5Percent}% of everything you see`,
      meaning: `Three-quarters of your feed comes from a small group of accounts.`,
      whyCare: 'Well above typical (40–60%).',
      meta,
    };
  } else if (top5Percent >= 60) {
    return {
      title: `A few recurring voices fill ${top5Percent}% of your feed`,
      meaning: 'About two-thirds of posts come from your most-shown accounts.',
      whyCare: 'At the high end of typical (40–60%).',
      meta,
    };
  } else if (top5Percent >= 40) {
    return {
      title: `Your feed balances familiar and new (${top5Percent}% from top 5)`,
      meaning: 'Less than half of posts come from your top sources.',
      whyCare: 'Within the typical range (40–60%).',
      meta,
    };
  } else {
    return {
      title: `Your feed draws from a wide range of voices (${top5Percent}% from top 5)`,
      meaning: 'Posts are distributed across many accounts.',
      whyCare: 'Below the typical range (40–60%).',
      meta,
    };
  }
}

/**
 * Build hero for Ads tab
 */
export function buildAdsHero({ commercialComposition, totalPosts, platformCount }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!commercialComposition.hasData) {
    return {
      title: 'Not enough data to assess commercial content',
      meaning: 'Need at least 10 posts to analyze advertising and promotional patterns.',
      whyCare: null,
      meta,
    };
  }

  const labeledSeg = commercialComposition.segments.find(s => s.label === 'Labeled ads');
  const likelySeg = commercialComposition.segments.find(s => s.label === 'Unlabeled promos');

  // Fallback to old labels during transition
  const labeledSegFallback = labeledSeg || commercialComposition.segments.find(s => s.label === 'Ads clearly labeled as ads');
  const likelySegFallback = likelySeg || commercialComposition.segments.find(s => s.label === 'Likely selling, not labeled as an ad');

  const labeled = labeledSegFallback?.percentage || 0;
  const likely = likelySegFallback?.percentage || 0;
  const totalCommercial = labeled + likely;

  if (likely >= 10) {
    return {
      title: `${likely}% of your feed appears promotional but isn't labeled`,
      meaning: `On top of ${labeled}% labeled ads, another ${likely}% of posts appear promotional but aren't disclosed.`,
      whyCare: 'Typical unlabeled promotion is 3–8%.',
      meta,
    };
  }

  if (totalCommercial >= 40) {
    return {
      title: `${totalCommercial}% of your feed is commercial content`,
      meaning: `Nearly half of posts in this scan were commercial in nature.`,
      whyCare: 'Above the typical range of 15–30%.',
      meta,
    };
  } else if (totalCommercial >= 25) {
    return {
      title: `About 1 in 4 posts is commercial content (${totalCommercial}%)`,
      meaning: `About 1 in 4 posts is an ad or promotion.`,
      whyCare: 'At the higher end of typical (15–30%).',
      meta,
    };
  } else if (totalCommercial >= 10) {
    return {
      title: `${totalCommercial}% of your feed is commercial content`,
      meaning: `About 1 in ${Math.round(100 / totalCommercial)} posts is an ad or promotion.`,
      whyCare: 'Within the typical range (15–30%).',
      meta,
    };
  } else {
    return {
      title: `Commercial content is minimal in your feed (${totalCommercial}%)`,
      meaning: 'Less than 1 in 10 posts is selling something.',
      whyCare: 'Below the typical range of 15–30%.',
      meta,
    };
  }
}

/**
 * Build hero for Politics tab
 */
export function buildPoliticsHero({ politicalShare, totalPosts, platformCount }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!politicalShare.hasData) {
    return {
      title: 'Political content is minimal or absent in your feed',
      meaning: 'Too few political posts to analyze patterns reliably.',
      whyCare: null,
      meta,
    };
  }

  const percent = politicalShare.politicalPercent;

  if (percent >= 25) {
    return {
      title: `1 in ${Math.round(100 / percent)} posts in your feed is political (${percent}%)`,
      meaning: `About 1 in ${Math.round(100 / percent)} posts is political.`,
      whyCare: 'Above the typical range of 8–20%.',
      meta,
    };
  } else if (percent >= 10) {
    return {
      title: `${percent}% of your feed carries political content`,
      meaning: `About 1 in ${Math.round(100 / percent)} posts is political.`,
      whyCare: 'Within the typical range (8–20%).',
      meta,
    };
  } else {
    return {
      title: `Politics is a small slice of your feed (${percent}%)`,
      meaning: 'Political posts appear occasionally but are far from dominant.',
      whyCare: 'Below the typical range (8–20%).',
      meta,
    };
  }
}

/**
 * Build hero for Tone tab
 */
export function buildToneHero({ toneDistribution, totalPosts, platformCount }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!toneDistribution.hasData) {
    return {
      title: 'Not enough data to assess emotional tone',
      meaning: 'Need at least 10 posts with tone analysis to show patterns.',
      whyCare: null,
      meta,
    };
  }

  const posSeg = toneDistribution.segments.find(s => s.label === 'Positive' || s.label === 'Positive or happy tone');
  const neutSeg = toneDistribution.segments.find(s => s.label === 'Neutral' || s.label === 'Neutral or balanced tone');
  const negSeg = toneDistribution.segments.find(s => s.label === 'Negative' || s.label === 'Negative or conflict-focused tone');

  const pos = posSeg?.percentage || 0;
  const neut = neutSeg?.percentage || 0;
  const neg = negSeg?.percentage || 0;

  const max = Math.max(pos, neut, neg);
  const spread = max - Math.min(pos, neut, neg);

  if (spread < 15) {
    return {
      title: `Your feed has a balanced emotional mix (${pos}% positive, ${neut}% neutral, ${neg}% negative)`,
      meaning: 'No single emotional tone dominates.',
      whyCare: 'A balanced feed means diverse perspectives rather than heavy exposure to a single tone.',
      meta,
    };
  }

  if (neg === max && neg >= 35) {
    return {
      title: `${neg}% of your feed carries negative or conflict-focused tone`,
      meaning: `More than 1 in 3 posts is framed around conflict, outrage, or negativity.`,
      whyCare: 'Typical negative tone is 20–30%.',
      meta,
    };
  }

  if (pos === max && pos >= 35) {
    return {
      title: `Your feed skews positive (${pos}% positive tone)`,
      meaning: 'More than 1 in 3 posts carries upbeat or happy framing.',
      whyCare: 'A skew toward upbeat content may mean you\'re seeing a narrower emotional range than typical.',
      meta,
    };
  }

  if (neut === max && neut >= 35) {
    return {
      title: `Your feed is mostly informational (${neut}% neutral tone)`,
      meaning: 'Most posts are balanced or factual rather than emotionally charged.',
      whyCare: 'Neutral tone creates space for reflection without strong emotional pulls.',
      meta,
    };
  }

  // Fallback
  if (neg === max) {
    return {
      title: `Negative tone appears most often in your feed (${neg}%)`,
      meaning: `Negative or conflict-focused posts slightly outpace positive (${pos}%) and neutral (${neut}%) content.`,
      whyCare: 'Even a modest lean toward negativity can shape what problems feel most urgent.',
      meta,
    };
  } else if (pos === max) {
    return {
      title: `Positive tone leads your feed (${pos}%)`,
      meaning: `Upbeat content slightly outpaces neutral (${neut}%) and negative (${neg}%) posts.`,
      whyCare: 'A positive lean can improve mood, though it may filter out important but difficult topics.',
      meta,
    };
  } else {
    return {
      title: `Neutral tone leads your feed (${neut}%)`,
      meaning: `Balanced or informational content outpaces positive (${pos}%) and negative (${neg}%) posts.`,
      whyCare: 'A neutral lean means your feed is less emotionally activating.',
      meta,
    };
  }
}

/**
 * Build hero for Suggested vs Followed tab
 */
export function buildSuggestedVsFollowedHero({ sourceData, toneBySourceOrigin, totalPosts, platformCount, creatorFamiliarity, adComparison }) {
  const meta = totalPosts > 0
    ? `Based on ${totalPosts} posts${platformCount > 1 ? ` across ${platformCount} platforms` : ''}`
    : null;

  if (!sourceData.hasData) {
    return {
      title: 'Not enough data to compare suggested vs followed content',
      meaning: 'Need source origin metadata to analyze how algorithmic recommendations shape your feed.',
      whyCare: null,
      meta,
    };
  }

  const suggested = sourceData.suggestedPercentage;
  const followed = 100 - suggested;

  // Compute tone difference if available
  let toneDifference = null;
  if (toneBySourceOrigin.hasData) {
    const sugSegs = toneBySourceOrigin.suggested.segments;
    const folSegs = toneBySourceOrigin.followed.segments;

    const sugNeg = sugSegs.find(s => s.label === 'Negative' || s.label === 'Negative or conflict-focused tone')?.percentage || 0;
    const folNeg = folSegs.find(s => s.label === 'Negative' || s.label === 'Negative or conflict-focused tone')?.percentage || 0;
    const sugPos = sugSegs.find(s => s.label === 'Positive' || s.label === 'Positive or happy tone')?.percentage || 0;
    const folPos = folSegs.find(s => s.label === 'Positive' || s.label === 'Positive or happy tone')?.percentage || 0;

    const negDiff = sugNeg - folNeg;
    const posDiff = sugPos - folPos;

    if (Math.abs(negDiff) >= 8) {
      toneDifference = negDiff > 0
        ? `Suggested posts were ${Math.abs(negDiff)} points more negative than content from accounts you follow.`
        : `Content you follow is ${Math.abs(negDiff)} points more negative than suggested posts.`;
    } else if (Math.abs(posDiff) >= 8) {
      toneDifference = posDiff > 0
        ? `Suggested posts were ${Math.abs(posDiff)} points more positive than content you follow.`
        : `Content you follow is ${Math.abs(posDiff)} points more positive than suggested posts.`;
    }
  }

  // Enhance whyCare with creator familiarity or ad comparison context
  let additionalContext = null;
  if (creatorFamiliarity?.hasData && creatorFamiliarity.noveltyPercent >= 50) {
    additionalContext = `${creatorFamiliarity.noveltyPercent}% of suggested posts come from creators you don't follow.`;
  } else if (adComparison?.hasData && Math.abs(adComparison.adDelta) >= 5) {
    const more = adComparison.adDelta > 0 ? 'more' : 'less';
    additionalContext = `Suggested posts are ${Math.abs(adComparison.adDelta)} points ${more} commercial than followed posts.`;
  }

  if (suggested > 50) {
    return {
      title: `${suggested}% of your feed was suggested content`,
      meaning: `More than half of your feed was suggested rather than from accounts you follow.`,
      whyCare: toneDifference || additionalContext || 'Typical suggested content is 30–50%.',
      meta,
    };
  } else if (suggested >= 45) {
    return {
      title: `${suggested}% of your feed is suggested content`,
      meaning: `Nearly half of what you see was suggested.`,
      whyCare: toneDifference || additionalContext || 'Within the typical range (30–50%).',
      meta,
    };
  } else if (suggested >= 30) {
    return {
      title: `${suggested}% of your feed is suggested content`,
      meaning: `About 1 in 3 posts were suggested to you.`,
      whyCare: toneDifference || additionalContext || 'Within the typical range (30–50%).',
      meta,
    };
  } else {
    return {
      title: `You control most of your feed (${followed}% from accounts you follow)`,
      meaning: `Only ${suggested}% of posts were suggested.`,
      whyCare: toneDifference || additionalContext || 'Below the typical range (30–50%).',
      meta,
    };
  }
}
