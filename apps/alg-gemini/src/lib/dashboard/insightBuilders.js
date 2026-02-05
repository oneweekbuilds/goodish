/**
 * Insight Builders - Generate data-grounded hero content for dashboard tabs
 *
 * Each builder function takes computed tab data and returns an object with:
 * - title: Data-grounded takeaway with actual values
 * - meaning: What this finding means in plain English
 * - whyCare: Why this matters for the user
 * - meta: Supporting line (e.g., "Based on X posts across Y platforms")
 *
 * Threshold logic ensures headlines change meaningfully based on actual values.
 * No vague adjectives. No generic filler. About "your feed" and this scan window only.
 */

/**
 * Build hero for Overview tab
 * Focuses on source concentration as the primary pattern
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

  // Threshold logic for concentration
  if (top5 >= 60) {
    return {
      title: `A small set of creators dominates your feed (${top5}% from top 5)`,
      meaning: 'The majority of posts you see come from just a handful of accounts.',
      whyCare: 'High concentration means these few sources have outsized influence on what you think about and pay attention to.',
      meta,
    };
  } else if (top5 >= 40) {
    return {
      title: `Your feed leans toward repeat sources (${top5}% from top 5)`,
      meaning: 'Nearly half of your feed comes from your top 5 most-shown accounts.',
      whyCare: 'Moderate concentration means familiar voices shape your feed, but you still see variety.',
      meta,
    };
  } else {
    return {
      title: `Your feed is relatively diverse by source (${top5}% from top 5)`,
      meaning: 'Posts are spread across many different accounts rather than concentrated in a few.',
      whyCare: 'Lower concentration means more varied perspectives reach you, though repetition can help build deeper understanding.',
      meta,
    };
  }
}

/**
 * Build hero for Sources tab
 * Focuses on source concentration and distribution
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

  // Threshold logic for source concentration
  if (top5Percent >= 75) {
    return {
      title: `A handful of accounts shape most of what you see (${top5Percent}% from top 5)`,
      meaning: 'Three-quarters or more of your feed comes from just 5 accounts.',
      whyCare: 'Extreme concentration means a very small group controls the vast majority of what reaches you.',
      meta,
    };
  } else if (top5Percent >= 60) {
    return {
      title: `Your feed is concentrated around a few recurring voices (${top5Percent}% from top 5)`,
      meaning: 'About two-thirds of posts come from your most-shown accounts.',
      whyCare: 'High concentration means these sources have significant influence on your perspective.',
      meta,
    };
  } else if (top5Percent >= 40) {
    return {
      title: `Your feed balances familiar accounts with variety (${top5Percent}% from top 5)`,
      meaning: 'Less than half of posts come from your top sources.',
      whyCare: 'Moderate concentration means you see recurring voices but also encounter new perspectives regularly.',
      meta,
    };
  } else {
    return {
      title: `Your feed is shaped by a wide range of voices (${top5Percent}% from top 5)`,
      meaning: 'Posts are distributed across many accounts rather than concentrated.',
      whyCare: 'Low concentration means more diverse viewpoints reach you, though it can be harder to build deep familiarity.',
      meta,
    };
  }
}

/**
 * Build hero for Ads tab
 * Focuses on commercial content share
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

  const labeledSeg = commercialComposition.segments.find(s => s.label === 'Ads clearly labeled as ads');
  const likelySeg = commercialComposition.segments.find(s => s.label === 'Likely selling, not labeled as an ad');

  const labeled = labeledSeg?.percentage || 0;
  const likely = likelySeg?.percentage || 0;
  const totalCommercial = labeled + likely;

  // Special case: High unlabeled promo
  if (likely >= 10) {
    return {
      title: `A meaningful share of promotion is not clearly labeled (${likely}% unlabeled, ${labeled}% labeled ads)`,
      meaning: 'One in ten posts appears to be selling something without clear disclosure.',
      whyCare: 'Unlabeled promotion blends persuasion with entertainment, making it harder to evaluate intent.',
      meta,
    };
  }

  // General commercial content thresholds
  if (totalCommercial >= 40) {
    return {
      title: `Commercial content makes up a large portion of your feed (${totalCommercial}% total)`,
      meaning: 'More than one-third of posts are either labeled ads or unlabeled promotion.',
      whyCare: 'High commercial exposure means much of your attention is being monetized.',
      meta,
    };
  } else if (totalCommercial >= 25) {
    return {
      title: `Commercial content takes up a noticeable share of your feed (${totalCommercial}% total)`,
      meaning: 'About one-quarter of posts are selling something.',
      whyCare: 'Significant commercial exposure shapes what products and purchases feel normal.',
      meta,
    };
  } else if (totalCommercial >= 10) {
    return {
      title: `Your feed includes regular commercial content (${totalCommercial}% total)`,
      meaning: 'About one in ten posts is advertising or promotion.',
      whyCare: 'Commercial content influences purchasing behavior even when you scroll past.',
      meta,
    };
  } else {
    return {
      title: `Commercial content is a small part of your feed (${totalCommercial}% total)`,
      meaning: 'Less than one in ten posts is selling something.',
      whyCare: 'Lower commercial exposure leaves more space for personal expression and connection.',
      meta,
    };
  }
}

/**
 * Build hero for Politics tab
 * Focuses on political exposure magnitude
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

  // Threshold logic for political share
  if (percent >= 25) {
    return {
      title: `Politics is a major theme in your feed (${percent}%)`,
      meaning: 'One in four posts addresses political topics.',
      whyCare: 'High political exposure continuously shapes your mood and worldview, even when you do not actively engage.',
      meta,
    };
  } else if (percent >= 10) {
    return {
      title: `Politics is a recurring background theme in your feed (${percent}%)`,
      meaning: 'Roughly one in ten posts is political.',
      whyCare: 'Regular political content keeps governance and conflict salient in your daily attention.',
      meta,
    };
  } else {
    return {
      title: `Politics is a smaller slice of your feed (${percent}%)`,
      meaning: 'Political posts appear occasionally but are not a major presence.',
      whyCare: 'Lower political exposure leaves more space for other topics to shape your daily attention.',
      meta,
    };
  }
}

/**
 * Build hero for Tone tab
 * Focuses on emotional tone distribution
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

  const posSeg = toneDistribution.segments.find(s => s.label === 'Positive or happy tone');
  const neutSeg = toneDistribution.segments.find(s => s.label === 'Neutral or balanced tone');
  const negSeg = toneDistribution.segments.find(s => s.label === 'Negative or outrage tone');

  const pos = posSeg?.percentage || 0;
  const neut = neutSeg?.percentage || 0;
  const neg = negSeg?.percentage || 0;

  // Find dominant tone
  const max = Math.max(pos, neut, neg);
  const spread = max - Math.min(pos, neut, neg);

  // Near-tie case (spread < 15 points)
  if (spread < 15) {
    return {
      title: `No single tone dominates your feed (Positive ${pos}%, Neutral ${neut}%, Negative ${neg}%)`,
      meaning: 'Posts are fairly evenly split across positive, neutral, and negative tones.',
      whyCare: 'Balanced tone exposure means you encounter a range of emotional content rather than clustering in one feeling.',
      meta,
    };
  }

  // Negative dominant
  if (neg === max && neg >= 35) {
    return {
      title: `Negative or outrage tone is the most common in your feed (${neg}%)`,
      meaning: 'More than one-third of posts carry negative or conflict-focused emotion.',
      whyCare: 'Outrage-driven content is engaging but can affect how you feel after scrolling and what issues feel urgent.',
      meta,
    };
  }

  // Positive dominant
  if (pos === max && pos >= 35) {
    return {
      title: `Positive tone leads your feed (${pos}%)`,
      meaning: 'More than one-third of posts carry upbeat or happy emotion.',
      whyCare: 'Positive tone can shape mood and make optimism feel more accessible.',
      meta,
    };
  }

  // Neutral dominant
  if (neut === max && neut >= 35) {
    return {
      title: `Neutral tone is most common in your feed (${neut}%)`,
      meaning: 'More than one-third of posts are balanced or informational rather than emotionally charged.',
      whyCare: 'Neutral tone creates space for reflection without strong emotional pulls.',
      meta,
    };
  }

  // Fallback: describe the leader
  if (neg === max) {
    return {
      title: `Negative tone appears most often in your feed (${neg}%)`,
      meaning: 'Negative posts are more common than positive or neutral.',
      whyCare: 'Frequent negative content can shape what feels normal and what problems feel most pressing.',
      meta,
    };
  } else if (pos === max) {
    return {
      title: `Positive tone appears most often in your feed (${pos}%)`,
      meaning: 'Positive posts are more common than neutral or negative.',
      whyCare: 'Frequent positive content can shape mood and what opportunities feel accessible.',
      meta,
    };
  } else {
    return {
      title: `Neutral tone appears most often in your feed (${neut}%)`,
      meaning: 'Neutral posts are more common than positive or negative.',
      whyCare: 'Neutral content creates space for information without strong emotional framing.',
      meta,
    };
  }
}

/**
 * Build hero for Suggested vs Followed tab
 * Focuses on suggested share and tone differences
 */
export function buildSuggestedVsFollowedHero({ sourceData, toneBySourceOrigin, totalPosts, platformCount }) {
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

  // Compute tone difference if available
  let toneDifference = null;
  if (toneBySourceOrigin.hasData) {
    const sugSegs = toneBySourceOrigin.suggested.segments;
    const folSegs = toneBySourceOrigin.followed.segments;

    const sugPos = sugSegs.find(s => s.label === 'Positive or happy tone')?.percentage || 0;
    const folPos = folSegs.find(s => s.label === 'Positive or happy tone')?.percentage || 0;
    const sugNeg = sugSegs.find(s => s.label === 'Negative or outrage tone')?.percentage || 0;
    const folNeg = folSegs.find(s => s.label === 'Negative or outrage tone')?.percentage || 0;

    const posDiff = folPos - sugPos;
    const negDiff = folNeg - sugNeg;

    // Find the largest absolute difference
    if (Math.abs(negDiff) >= 8) {
      toneDifference = negDiff > 0
        ? `Followed posts are ${Math.abs(negDiff)} points more negative than suggested content.`
        : `Suggested posts are ${Math.abs(negDiff)} points more negative than followed content.`;
    } else if (Math.abs(posDiff) >= 8) {
      toneDifference = posDiff > 0
        ? `Followed posts are ${Math.abs(posDiff)} points more positive than suggested content.`
        : `Suggested posts are ${Math.abs(posDiff)} points more positive than followed content.`;
    }
  }

  // Threshold logic for suggested share
  if (suggested >= 60) {
    return {
      title: `Recommendations drive most of what you see (${suggested}% suggested)`,
      meaning: 'Nearly two-thirds of posts come from algorithmic recommendations rather than accounts you chose to follow.',
      whyCare: toneDifference || 'Algorithmic recommendations optimize for engagement, which may not align with what you consciously want to see.',
      meta,
    };
  } else if (suggested >= 40) {
    return {
      title: `Recommendations shape a large share of your feed (${suggested}% suggested)`,
      meaning: 'Nearly half of posts come from algorithmic suggestions.',
      whyCare: toneDifference || 'Algorithmic recommendations can surface new content but reduce your direct control over what shapes your attention.',
      meta,
    };
  } else {
    return {
      title: `Most of your feed comes from accounts you follow (${100 - suggested}% followed)`,
      meaning: 'The majority of posts are from accounts you deliberately chose.',
      whyCare: toneDifference || 'Following accounts gives you more direct control over what content reaches you.',
      meta,
    };
  }
}
