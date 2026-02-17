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
      meaning: `That means roughly ${Math.round(top5 / 10)} out of every 10 posts you scroll past are from the same small group. In a 60-minute session, these voices fill about ${Math.round(60 * top5 / 100)} minutes of your attention.`,
      whyCare: 'This is above the typical range of 40–60%. A small number of creators have outsized influence on what you see and think about.',
      meta,
    };
  } else if (top5 >= 40) {
    return {
      title: `Your top 5 sources make up ${top5}% of your feed`,
      meaning: `Nearly half of what you scroll through comes from a handful of familiar accounts. The rest is spread across many voices.`,
      whyCare: 'This falls within the typical range (40–60%). You get a mix of familiar sources and new perspectives.',
      meta,
    };
  } else {
    return {
      title: `Your feed is spread across many voices (${top5}% from top 5)`,
      meaning: 'No small group of creators dominates what you see. Your attention is distributed across a wide range of sources.',
      whyCare: 'This is below the typical range of 40–60%, meaning you encounter more diverse perspectives than most users.',
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
      meaning: `Three-quarters of your feed is controlled by a tiny group. In a typical scroll session, you'd need to pass ${Math.round(75 / 10)} posts from these sources before seeing 3 from anyone else.`,
      whyCare: 'This is well above typical (40–60%). These creators have enormous influence on your worldview, mood, and what topics feel important.',
      meta,
    };
  } else if (top5Percent >= 60) {
    return {
      title: `A few recurring voices fill ${top5Percent}% of your feed`,
      meaning: 'About two-thirds of posts come from your most-shown accounts, leaving limited space for new perspectives.',
      whyCare: 'This is at the high end of typical (40–60%). These sources significantly shape what information reaches you.',
      meta,
    };
  } else if (top5Percent >= 40) {
    return {
      title: `Your feed balances familiar and new (${top5Percent}% from top 5)`,
      meaning: 'Less than half of posts come from your top sources. You regularly encounter content from accounts outside your core group.',
      whyCare: 'This is within the typical range (40–60%). A healthy balance of familiarity and discovery.',
      meta,
    };
  } else {
    return {
      title: `Your feed draws from a wide range of voices (${top5Percent}% from top 5)`,
      meaning: 'Posts are distributed across many accounts. No small group dominates your attention.',
      whyCare: 'This is below the typical range (40–60%), meaning more diverse viewpoints reach you than most users see.',
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

  // Time calculation for implication
  const adMinutesIn60 = Math.round(60 * totalCommercial / 100);

  if (likely >= 10) {
    return {
      title: `${likely}% of your feed appears promotional but isn't labeled`,
      meaning: `On top of ${labeled}% labeled ads, another ${likely}% of posts appear promotional but aren't disclosed. That's about ${adMinutesIn60} minutes of commercial content in a 60-minute session.`,
      whyCare: 'Typical unlabeled promotion is 3–8%. At this level, a meaningful share of what looks like organic content appears to be commercial.',
      meta,
    };
  }

  if (totalCommercial >= 40) {
    return {
      title: `${totalCommercial}% of your feed is commercial content`,
      meaning: `That's about ${adMinutesIn60} minutes of ads and promotions in every hour you scroll. Nearly half of your attention is being monetized.`,
      whyCare: 'This is above the typical range of 15–30%. A large share of what appeared in your feed is commercial in nature.',
      meta,
    };
  } else if (totalCommercial >= 25) {
    return {
      title: `About 1 in 4 posts is commercial content (${totalCommercial}%)`,
      meaning: `That translates to roughly ${adMinutesIn60} minutes of commercial content per hour of scrolling.`,
      whyCare: 'This falls at the higher end of typical (15–30%). Enough to meaningfully shape what products and brands feel familiar.',
      meta,
    };
  } else if (totalCommercial >= 10) {
    return {
      title: `${totalCommercial}% of your feed is commercial content`,
      meaning: `About 1 in ${Math.round(100 / totalCommercial)} posts is an ad or promotion. That's roughly ${adMinutesIn60} minutes per hour of scrolling.`,
      whyCare: 'This is within the typical range (15–30%). A regular but not dominant presence of commercial content.',
      meta,
    };
  } else {
    return {
      title: `Commercial content is minimal in your feed (${totalCommercial}%)`,
      meaning: 'Less than 1 in 10 posts is selling something. Most of your feed is non-commercial content.',
      whyCare: 'This is below the typical range of 15–30%, leaving more space for personal expression and genuine connection.',
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
  const minutesIn60 = Math.round(60 * percent / 100);

  if (percent >= 25) {
    return {
      title: `1 in ${Math.round(100 / percent)} posts in your feed is political (${percent}%)`,
      meaning: `In a 60-minute scroll session, that's roughly ${minutesIn60} minutes of political content shaping your perception of the world.`,
      whyCare: 'This is above the typical range of 8–20%. At this level, political framing is a constant background presence in your daily attention.',
      meta,
    };
  } else if (percent >= 10) {
    return {
      title: `${percent}% of your feed carries political content`,
      meaning: `About 1 in ${Math.round(100 / percent)} posts is political. That's roughly ${minutesIn60} minutes per hour of scrolling.`,
      whyCare: 'This falls within the typical range (8–20%). Regular exposure to political content keeps governance and social issues present in your thinking.',
      meta,
    };
  } else {
    return {
      title: `Politics is a small slice of your feed (${percent}%)`,
      meaning: 'Political posts appear occasionally but are far from dominant. Most of your feed is non-political.',
      whyCare: 'This is below the typical range (8–20%), meaning your daily attention is less shaped by political framing than most users.',
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
      meaning: 'No single emotional tone dominates. You encounter a roughly even spread of upbeat, informational, and conflict-focused content.',
      whyCare: "A balanced feed means your mood isn't being pulled strongly in one direction by the content you consume.",
      meta,
    };
  }

  if (neg === max && neg >= 35) {
    const negMinutesIn60 = Math.round(60 * neg / 100);
    return {
      title: `${neg}% of your feed carries negative or conflict-focused tone`,
      meaning: `More than 1 in 3 posts is framed around conflict, outrage, or negativity. In a 60-minute session, that's about ${negMinutesIn60} minutes of negative content.`,
      whyCare: 'Typical negative tone is 20–30%. Above that, research suggests it can elevate stress and make the world feel more threatening than it is.',
      meta,
    };
  }

  if (pos === max && pos >= 35) {
    return {
      title: `Your feed skews positive (${pos}% positive tone)`,
      meaning: 'More than 1 in 3 posts carries upbeat or happy emotional framing. Your scrolling experience leans optimistic.',
      whyCare: "Positive feeds can boost mood but may also create a highlight reel effect that makes other people's lives look easier than they are.",
      meta,
    };
  }

  if (neut === max && neut >= 35) {
    return {
      title: `Your feed is mostly informational (${neut}% neutral tone)`,
      meaning: 'Most posts are balanced or factual rather than emotionally charged. Your feed reads more like a news digest than an emotional rollercoaster.',
      whyCare: 'Neutral tone creates space for reflection without strong emotional pulls. This is common in feeds heavy on news and educational content.',
      meta,
    };
  }

  // Fallback
  if (neg === max) {
    return {
      title: `Negative tone appears most often in your feed (${neg}%)`,
      meaning: `Negative or conflict-focused posts slightly outpace positive (${pos}%) and neutral (${neut}%) content.`,
      whyCare: 'Even a modest lean toward negativity can shape what problems feel most urgent and what topics dominate your thinking.',
      meta,
    };
  } else if (pos === max) {
    return {
      title: `Positive tone leads your feed (${pos}%)`,
      meaning: `Upbeat content slightly outpaces neutral (${neut}%) and negative (${neg}%) posts.`,
      whyCare: 'A positive lean can improve mood during scrolling, though it may also filter out important but difficult topics.',
      meta,
    };
  } else {
    return {
      title: `Neutral tone leads your feed (${neut}%)`,
      meaning: `Balanced or informational content outpaces positive (${pos}%) and negative (${neg}%) posts.`,
      whyCare: 'A neutral lean means your feed is less emotionally activating, which can support more reflective consumption.',
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
        ? `Algorithm-suggested posts are ${Math.abs(negDiff)} points more negative than content from accounts you follow.`
        : `Content you follow is ${Math.abs(negDiff)} points more negative than algorithm suggestions.`;
    } else if (Math.abs(posDiff) >= 8) {
      toneDifference = posDiff > 0
        ? `Algorithm suggestions are ${Math.abs(posDiff)} points more positive than content you follow.`
        : `Content you follow is ${Math.abs(posDiff)} points more positive than algorithm suggestions.`;
    }
  }

  // Enhance whyCare with creator familiarity or ad comparison context
  let additionalContext = null;
  if (creatorFamiliarity?.hasData && creatorFamiliarity.noveltyPercent >= 50) {
    additionalContext = `${creatorFamiliarity.noveltyPercent}% of algorithm picks come from creators you don't follow.`;
  } else if (adComparison?.hasData && Math.abs(adComparison.adDelta) >= 5) {
    const more = adComparison.adDelta > 0 ? 'more' : 'less';
    additionalContext = `Suggested posts are ${Math.abs(adComparison.adDelta)} points ${more} commercial than followed posts.`;
  }

  if (suggested >= 60) {
    return {
      title: `The algorithm picks ${suggested}% of what you see`,
      meaning: `Only ${followed}% of your feed comes from accounts you chose to follow. The platform's algorithm decides the majority of your content.`,
      whyCare: toneDifference || additionalContext || 'Typical suggested content is 30–50%. At this level, the platform has more control over your attention than you do.',
      meta,
    };
  } else if (suggested >= 40) {
    return {
      title: `${suggested}% of your feed is algorithm-suggested`,
      meaning: `Nearly half of what you see was chosen by the platform, not by you. The other ${followed}% comes from accounts you follow.`,
      whyCare: toneDifference || additionalContext || "This falls within the typical range (30\u201350%). The algorithm plays a significant role but doesn't fully control your experience.",
      meta,
    };
  } else {
    return {
      title: `You control most of your feed (${followed}% from accounts you follow)`,
      meaning: `Only ${suggested}% of posts are algorithm recommendations. The majority of your feed reflects your own choices.`,
      whyCare: toneDifference || additionalContext || 'This is below the typical range (30–50%), meaning you have more direct control over what content reaches you.',
      meta,
    };
  }
}
