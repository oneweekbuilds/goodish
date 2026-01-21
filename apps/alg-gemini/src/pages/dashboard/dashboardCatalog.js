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

import {
  FALLBACK_MIX_TOPICS_HEADLINE,
  isHeadlineExcludedLabel,
  pickHeadlineSafeLabels,
} from '../../lib/dashboard/headlineSafety';

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

// Tab-level trust sentences - grounded in observation, not identity
export const TAB_TRUST_SENTENCES = {
  ads: "Promotional content observed during this window — not what you buy or want.",
  politics: "Political keywords observed during this window — measures exposure, not your beliefs.",
  patterns: "Topics observed during this window — what surfaced, not what you seek.",
  creators: "Accounts observed during this window — what appeared, not who you are.",
  algorithm: "Patterns observed during this window — system interpretation, not your identity.",
};

export const TABS = [
  { id: 'ads', label: 'Ads & Influence' },
  { id: 'politics', label: 'Politics & Worldview' },
  { id: 'patterns', label: 'Patterns in Your Feed' },
  { id: 'creators', label: 'Creators & Voices' },
  { id: 'algorithm', label: 'What the Algorithm Thinks' },
  { id: 'talk', label: 'Talk to Your Algorithm' },
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
    title: 'Where your feed is steering you to spend',
    description: 'Looks at labeled promotions across this window to see how hard the feed is selling to you.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'These are posts the platform explicitly labeled as ads or sponsored.',
    counterfactual: 'This may not match your perception — some ads blend in with regular content.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      const smallSample = total > 0 && total < 20;

      if (pct === 0) {
        return smallSample
          ? 'During this small window, the feed wasn’t actively selling to you.'
          : 'During this window, we saw no visible selling pressure.';
      }

      if (pct < 8) {
        return smallSample
          ? 'Early signal: light sponsored touches surfaced during this window.'
          : 'Selling pressure is light — promotions appear but don’t drive the feed.';
      }

      if (pct < 18) {
        return 'Your feed appears to be steering you toward sponsored offers as a steady background.';
      }

      return 'Advertising is a main storyline here — the feed is actively steering you toward paid content.';
    },
    action: null,
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Who is driving the selling',
    description: 'Shows whether a handful of repeat advertisers are steering what you’re being sold in this window.',
    outputType: 'text',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted unique advertisers in labeled ads during this window.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => {
      const label = data?.qualitativeLabel;
      const top5Count = data?.top5Count || 0;
      if (!label) return null;
      if (label.toLowerCase().includes('small number')) {
        return top5Count > 0 
          ? `Most ads come from ${top5Count} repeat advertisers.`
          : 'Most ads come from a small group of repeat advertisers.';
      }
      if (label.toLowerCase().includes('mix')) {
        return 'Ads come from a diverse set of sources.';
      }
      return label;
    },
    action: null,
  },
  {
    tab: 'ads',
    id: 'ads-by-platform',
    title: 'Where the selling pressure sits',
    description: 'Which platform has the highest ad rate in this window.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Counted labeled ads per platform during this window.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const sorted = [...data].sort((a, b) => (b?.value || 0) - (a?.value || 0));
      const [top, second] = sorted;
      if (!top) return null;

      if (!second) {
        return `${top.label} is doing most of the selling right now.`;
      }

      const gap = (top.value || 0) - (second.value || 0);
      const ratio = (second.value || 0) === 0 ? Infinity : (top.value || 0) / (second.value || 0);

      if (ratio >= 1.5 && gap >= 5) {
        return `${top.label} is driving most sponsored posts; other platforms are quieter.`;
      }

      if (Math.abs(gap) <= 3) {
        return `Selling pressure is similar on ${top.label} and ${second.label}.`;
      }

      return `${top.label} carries more of the selling than ${second.label} right now.`;
    },
    action: null,
  },

  // --- COLLAPSED BY DEFAULT: Lower priority supporting details ---
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Possibly Promotional (Unlabeled, Recent Scans)',
    description: 'Content that matched promotional patterns but lacked ad labels in this window.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Detected via patterns like discount codes or affiliate links in this window. This is a rough estimate with significant uncertainty.',
    takeaway: (data) => data?.possibleInfluencePercent !== undefined
      ? `During this window, approximately ${data.possibleInfluencePercent}% of content matched promotional patterns but lacked ad labels. (Low confidence estimate.)`
      : null,
    action: null,
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'What the ads are pitching',
    description: 'Top product themes in your ads during this window so you can see what’s being emphasized.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Matched keywords in labeled ads. Does not indicate your interests.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const totalMatches = data.reduce((sum, item) => sum + (item.value || 0), 0);
      const [first, second] = data;
      if (totalMatches < 10) return `Low signal: only ${totalMatches} keyword matches across all ads.`;
      
      if (first && second) {
        return `${first.label} (${first.value} ads) and ${second.label} (${second.value} ads) lead.`;
      }
      if (first) {
        return `${first.label} dominates (${first.value} ads).`;
      }
      return 'A few product themes recur.';
    },
    action: null,
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
    title: 'Recurring Ad Categories (Recent Scans)',
    description: 'Product categories that appeared multiple times in this window.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Based on product keywords in ads during this window. We cannot know why these were shown to you.',
    takeaway: (data) => data?.interests?.length > 0
      ? `During this window, ${data.interests[0]} appeared most frequently in ads${data.interests.length > 1 ? `, followed by ${data.interests.slice(1).join(' and ')}` : ''}.`
      : null,
    action: null,
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
    title: 'How much political exposure you got',
    description: 'Whether political keywords appeared as isolated touches or formed a sustained presence in this window.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Matched keywords related to elections, policy, and political figures. Keyword matching has limitations.',
    counterfactual: 'This measures exposure, not belief formation. Political content may be more memorable than other topics.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      const smallSample = total > 0 && total < 20;

      if (pct === 0) {
        return smallSample
          ? 'Political exposure was absent during this small window.'
          : 'Political exposure was absent during this window — your feed had no detectable political keywords.';
      }

      if (pct < 5) {
        return 'Political exposure was light — scattered keywords surfaced but didn\'t form a sustained theme.';
      }

      if (pct < 15) {
        return 'Political exposure was moderate — keywords appeared in clusters but not continuously.';
      }

      if (pct < 30) {
        return 'Political exposure was substantial — recurring keywords formed a visible layer in your feed.';
      }

      return 'Political exposure was heavy — keywords ran as a sustained thread throughout your feed.';
    },
    action: null,
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'politics',
    id: 'politics-balance',
    title: 'Viewpoint distribution',
    description: 'Whether political keywords skewed toward one perspective or appeared more evenly.',
    outputType: 'status',
    dataFn: 'getPoliticalBalanceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Counts keywords associated with different political perspectives. This is a rough distributional signal, not a measure of truth or persuasion.',
    takeaway: (data) => {
      if (!data?.message) return 'Keyword distribution skewed during this window (low confidence).';
      return `${data.message} Measures exposure asymmetry, not content accuracy or your beliefs.`;
    },
    action: null,
  },

  {
    tab: 'politics',
    id: 'politics-creators',
    title: 'Where political exposure concentrated',
    description: 'Whether political keywords came from many sources or clustered around a few repeat accounts.',
    outputType: 'table',
    dataFn: 'getPoliticalCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Counted political keyword matches per account during this window.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const [top] = data;
      const totalAccounts = data.length;
      if (totalAccounts === 1) {
        return `Political exposure came almost entirely from one source: ${top.creator}.`;
      }
      if (totalAccounts <= 3) {
        return `Most political exposure traced to a tight cluster of ${totalAccounts} accounts.`;
      }
      return `Political keywords spread across ${totalAccounts} sources, but clustered heavily at the top.`;
    },
    action: null,
  },
  {
    tab: 'politics',
    id: 'politics-by-platform',
    title: 'Platform asymmetry',
    description: 'Whether political exposure was evenly distributed across platforms or concentrated on one.',
    outputType: 'bar',
    dataFn: 'getCrossPlatformPoliticalData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compared political keyword rates on each platform during this window.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const sorted = [...data].sort((a, b) => (b?.value || 0) - (a?.value || 0));
      const [top, second] = sorted;
      if (!top) return null;

      if (!second) {
        return `Political keywords concentrated entirely on ${top.label}.`;
      }

      const gap = (top.value || 0) - (second.value || 0);
      if (gap >= 10) {
        return `Political exposure clustered heavily on ${top.label}, with much lighter presence on ${second.label}.`;
      }

      if (Math.abs(gap) <= 3) {
        return `Political keywords appeared evenly between ${top.label} and ${second.label}.`;
      }

      return `Political exposure leaned toward ${top.label} over ${second.label}.`;
    },
    action: null,
  },

  // --- COLLAPSED BY DEFAULT: Low confidence, opt-in required ---
  {
    tab: 'politics',
    id: 'politics-leaning',
    title: 'Keyword skew (low confidence)',
    description: 'Rough estimate of whether keywords leaned more toward one perspective.',
    outputType: 'text',
    dataFn: 'getPoliticalLeaningData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Simple keyword matching. Cannot detect nuance, irony, or context. Measures exposure distribution, not content quality or your beliefs.',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => {
      if (!data?.qualitativeLabel) return null;
      return `${data.qualitativeLabel} (Low confidence — keyword distribution only.)`;
    },
    action: null,
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Absent keyword categories (low confidence)',
    description: 'Keyword categories that did not appear during this window.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Detected by absence of certain keywords during this window. Very rough — absence here does not prove absence elsewhere in your feed.',
    takeaway: (data) => {
      if (!data?.message) return 'Some keyword categories were absent during this window.';
      return `${data.message} (Window-specific only.)`;
    },
    action: null,
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
    title: 'Political Exposure Pattern',
    description: 'Summary of where political keywords came from and how they concentrated.',
    outputType: 'text',
    dataFn: 'getPoliticalProfileData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on political keywords during this window. This measures exposure patterns, not your beliefs.',
    takeaway: (data) => {
      if (data?.politicalPercent === undefined) return null;
      const pct = data.politicalPercent;
      
      // Instead of repeating hero, provide synthesis
      if (pct === 0) {
        return 'No political exposure detected during this window.';
      }
      if (pct < 10) {
        return `Light political exposure from a few sources — not a major theme in your feed.`;
      }
      if (pct < 25) {
        return `Moderate political exposure — present in your feed but not dominating what you saw.`;
      }
      return `Heavy political exposure — a recurring presence from concentrated sources throughout your feed.`;
    },
    action: null,
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
    title: 'How topic variety shifted',
    description: 'Whether your feed narrowed to repeat themes or broadened across different topics during this window.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Grouped posts by detected topic (fitness, news, entertainment, etc.). Classification is approximate.',
    counterfactual: 'This is what showed up in this scan — may not represent your typical feed.',
    takeaway: (data) => {
      if (!data) return null;

      const { labels } = pickHeadlineSafeLabels(data.topTopics, {
        getLabel: (t) => t?.label,
        limit: 2,
      });
      const [top, second] = labels;

      // Slice 6: If everything is Unclassified/Other, do not surface it in top-line copy.
      if (!data.topicCount || data.topicCount <= 0) {
        return FALLBACK_MIX_TOPICS_HEADLINE;
      }

      if (data.topicCount <= 3) {
        if (top && second) {
          return `Topics narrowed during this window — ${top} and ${second} dominated, with little else surfacing.`;
        } else if (top) {
          return `Topics narrowed during this window — ${top} dominated, with minimal rotation to other themes.`;
        }
        return `Topics narrowed during this window — content concentrated around a small set of repeated themes.`;
      }
      if (data.topicCount <= 7) {
        if (top && second) {
          return `Topic mix stayed concentrated during this window — ${top} and ${second} led a moderate rotation.`;
        } else if (top) {
          return `Topic mix stayed concentrated during this window — ${top} led with moderate rotation to other themes.`;
        }
        return `Topic mix stayed concentrated during this window — content cycled through familiar themes.`;
      }
      if (top && second) {
        return `Topics broadened during this window — ${top} and ${second} appeared among a wide rotating mix.`;
      } else if (top) {
        return `Topics broadened during this window — ${top} appeared among a wide rotating mix of themes.`;
      }
      return `Topics broadened during this window — content spread across a wide rotating mix.`;
    },
    action: () => 'You could try searching for new topics to see if variety changes.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'How concentrated the top themes were',
    description: 'Whether a few topics dominated or content spread evenly across many themes.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Measured topic distribution in this scan. Does not indicate a pattern over time.',
    takeaway: (data) => {
      if (!data?.riskLevel) return null;
      const level = data.riskLevel.toLowerCase();

      if (level.includes('high') || level.includes('concentrated') || level.includes('narrow')) {
        return 'A few topics dominated — most content reinforced the same narrow themes.';
      }
      if (level.includes('moderate') || level.includes('medium')) {
        return 'Several topics recurred — content cycled through a moderate set of familiar themes.';
      }
      if (level.includes('low') || level.includes('diverse') || level.includes('broad')) {
        return 'Topics spread broadly — content covered many different themes without heavy concentration.';
      }
      return `In this scan: ${data.riskLevel}`;
    },
    action: null,
  },

  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Which themes recurred most',
    description: 'Topics that appeared consistently throughout this window, forming the core of what you saw.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    hidden: true,
    whyExplanation: 'Measured what percentage of this scan fell into the top 3 detected topics.',
    takeaway: (data) => {
      if (data?.top3Percent === undefined) return null;
      const pct = data.top3Percent;

      if (pct >= 70) {
        return 'A small set of themes recycled throughout this window — content concentrated heavily around familiar topics.';
      }
      if (pct >= 50) {
        return 'Several themes recurred consistently during this window — content returned to familiar topics regularly.';
      }
      if (pct >= 30) {
        return 'Themes showed moderate recurrence during this window — some repetition but with rotation to other topics.';
      }
      return 'Themes rotated broadly during this window — content spread across many topics without heavy repetition.';
    },
    action: null,
  },
  {
    tab: 'patterns',
    id: 'patterns-stability',
    title: 'How your feed is evolving',
    description: 'Whether the same topics keep reappearing or new themes are emerging across scans.',
    outputType: 'status',
    dataFn: 'getFeedStabilityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Compares topics and creators between scans. Requires multiple scans to measure.',
    takeaway: (data) => {
      if (!data?.stability) return 'Insufficient scans to measure evolution.';
      const stability = data.stability.toLowerCase();

      if (stability.includes('stable') || stability.includes('consistent')) {
        return 'Topics stabilized across scans — the same themes keep reappearing with little rotation.';
      }
      if (stability.includes('variable') || stability.includes('changing') || stability.includes('shifting')) {
        return 'Topics shifted across scans — new themes are emerging and rotating through your feed.';
      }
      return `Across your scans, feed content appeared ${stability}.`;
    },
    action: () => 'You could try following new creators to see if variety increases.',
  },

  // --- COLLAPSED BY DEFAULT: Still available but de-emphasized ---
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional Tone (Estimate)',
    description: 'Estimated emotional tone of content in this scan.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Estimated using keyword patterns. Very rough signal — sentiment analysis has significant limitations.',
    takeaway: (data) => data?.intensity
      ? `In this scan, content appeared to lean ${data.intensity.toLowerCase()} (rough estimate).`
      : null,
    action: () => 'You could try reducing engagement with intense content to see if tone shifts.',
  },
  {
    tab: 'patterns',
    id: 'manipulative-patterns',
    title: 'How often attention tactics appeared',
    description: 'Posts that used urgency language, engagement hooks, or other patterns designed to capture attention.',
    outputType: 'number_line',
    dataFn: 'getManipulativePatternsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Based on patterns we detected, these posts contained wellbeing themes or engagement hooks. Context matters — not all urgency is manipulative.',
    takeaway: (data) => {
      if (!data) return null;
      const pct = data.currentPercent || 0;
      const total = data.totalPosts || 0;

      if (pct === 0) {
        return 'Attention-grabbing patterns were absent during this window.';
      }
      if (pct < 10) {
        return 'Attention-grabbing patterns appeared lightly during this window — present but not pervasive.';
      }
      if (pct < 25) {
        return 'Attention-grabbing patterns surfaced regularly during this window — a noticeable presence.';
      }
      if (total < 20) {
        return 'Attention-grabbing patterns appeared frequently during this window (limited sample).';
      }
      return 'Attention-grabbing patterns recurred heavily during this window — a consistent thread throughout.';
    },
    action: () => 'You could try reducing engagement with content that uses urgency language or engagement hooks.',
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
    title: 'Topic Pattern Summary',
    description: 'Whether your feed is narrowing to familiar themes or broadening with new topics.',
    outputType: 'text',
    dataFn: 'getPatternSummaryData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'A summary of topics detected in this scan. Does not indicate patterns over time.',
    takeaway: (data) => {
      if (!data?.insights?.length) return null;
      const insights = data.insights.join(' ');
      return insights || 'Topic patterns observed during this window.';
    },
    action: null,
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
    title: 'Where influence concentrated',
    description: 'Whether many voices shaped what you saw, or a small set of accounts dominated your feed during this window.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Counted how often each account appeared in this scan.',
    counterfactual: 'This may not match who you follow or expect — it is what appeared in this specific scroll session.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return 'Influence was distributed across multiple voices during this window.';

      const top = data[0]?.creator;
      const topCount = data[0]?.postCount || 0;
      const secondCount = data[1]?.postCount || 0;
      const totalAccounts = data.length;

      if (!top) return 'Influence was distributed across multiple voices during this window.';

      // If top account has significantly more posts than second, it's dominating
      if (totalAccounts === 1 || (secondCount > 0 && topCount >= secondCount * 2)) {
        return `${top} dominated what you saw during this window — a single voice had outsized influence.`;
      }

      // If top few accounts are close in count, it's concentrated
      if (totalAccounts <= 3) {
        return `A tight cluster of familiar accounts shaped most of what you saw during this window.`;
      }

      // If many accounts but top still stands out
      if (topCount >= 3) {
        return `${top} appeared most during this window, but influence spread across ${totalAccounts} different voices.`;
      }

      return `Influence distributed across ${totalAccounts} voices during this window — no single account dominated.`;
    },
    action: () => 'You could try following new accounts to see if the mix changes.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'creators',
    id: 'creators-concentration',
    title: 'How concentrated influence was',
    description: 'Whether a few accounts dominated your feed or influence spread evenly across many sources.',
    outputType: 'text',
    dataFn: 'getCreatorConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    whyExplanation: 'Measured how much of this scan came from the top few accounts.',
    takeaway: (data) => {
      if (!data?.primaryInsight) return null;
      const insight = data.primaryInsight.toLowerCase();

      if (insight.includes('dominated') || insight.includes('majority')) {
        return data.primaryInsight;
      }

      if (insight.includes('top') && (insight.includes('account') || insight.includes('creator'))) {
        return data.primaryInsight.replace(/(\d+)%/, (match, pct) => {
          const p = parseInt(pct);
          if (p >= 60) return 'Most content';
          if (p >= 40) return 'Much of the content';
          return match;
        });
      }

      return data.primaryInsight;
    },
    action: null,
  },

  {
    tab: 'creators',
    id: 'creators-voice-diversity',
    title: 'How diverse the voices were',
    description: 'Whether your feed cycled through familiar accounts or surfaced a wide range of different voices.',
    outputType: 'status',
    dataFn: 'getVoiceDiversityData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    whyExplanation: 'Counted unique accounts in this scan.',
    takeaway: (data) => {
      if (!data?.diversity) return null;
      const d = data.diversity.toLowerCase();
      if (d === 'low') return "Your feed leaned on a familiar set of accounts during this window — few new voices surfaced.";
      if (d === 'high') return "Your feed surfaced a wide range of voices during this window — diverse sources shaped what you saw.";
      return "Your feed mixed familiar accounts with some newer voices during this window — moderate diversity.";
    },
    action: null,
  },
  {
    tab: 'creators',
    id: 'creators-cross-platform',
    title: 'Voices that appeared everywhere',
    description: 'Accounts that surfaced across multiple platforms, potentially having outsized influence on your overall exposure.',
    outputType: 'table',
    dataFn: 'getCrossplatformCreatorData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Matched handles across scanned platforms.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return 'No accounts appeared across multiple platforms in your scans.';
      if (data.length === 1) return 'One account appeared across multiple platforms — a recurring voice in different spaces.';
      if (data.length <= 3) return `A small set of accounts (${data.length}) appeared across platforms — recurring voices with broad reach.`;
      return `${data.length} accounts appeared across multiple platforms — a recurring set of voices shaping what you saw in different spaces.`;
    },
    action: () => 'Accounts appearing on multiple platforms may have outsized influence on what you see.',
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
    title: 'Creator Influence Summary',
    description: 'Which voices shaped most of what you saw and whether they appeared across platforms.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on appearance frequency in your scans. Does not indicate your preferences.',
    takeaway: (data) => {
      if (data?.creators && Array.isArray(data.creators)) {
        const count = data.creators.length;
        if (count <= 3) return 'A small set of familiar accounts shaped most of what you saw — concentrated influence.';
        if (count <= 8) return 'Several recurring accounts shaped what you saw — moderate influence concentration.';
        return 'Many different voices contributed to what you saw — distributed influence.';
      }
      return 'Summary of which accounts had the most influence on your feed during this window.';
    },
    action: null,
  },

  // ==========================================
  // TAB 5: OBSERVED PATTERNS
  // Core question: "What patterns appeared in this scan?"
  // NOTE: We CANNOT know what the algorithm "thinks" - only what appeared
  // Primary (1): Topics observed - the single clearest answer
  // Secondary (2): Topic breadth, Recurring themes
  // Collapsed (1): Possible future content
  // Summary (1): Possible experiments
  // ==========================================

  // --- PRIMARY: The single most important pattern metric ---
  {
    tab: 'algorithm',
    id: 'algo-topics-liked',
    title: 'How the system is reading your signals',
    description: 'Based on what surfaced repeatedly, the algorithm appears to be interpreting your interests in specific ways.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Counted topic occurrences in this scan. Does not indicate what the platform "thinks" about you.',
    counterfactual: 'This reflects what appeared, not who you are. The system interprets signals, but those signals may not match your actual interests.',
    takeaway: (data) => {
      const { labels, hadExcluded } = pickHeadlineSafeLabels(data, {
        getLabel: (t) => t?.topic,
        limit: 2,
      });
      const [top, second] = labels;

      if (!top) {
        return hadExcluded ? FALLBACK_MIX_TOPICS_HEADLINE : 'Based on what surfaced, the system appears to be reading your signals across multiple themes.';
      }

      if (second) {
        return `Based on what surfaced repeatedly, the system appears to be associating you primarily with ${top} and ${second}.`;
      }

      return `Based on what surfaced repeatedly, the system appears to be associating you primarily with ${top}.`;
    },
    action: () => 'You could try engaging with different content to see if topics shift.',
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'How compressed the inferred profile is',
    description: 'Whether the system appears to be categorizing you narrowly around a few themes or reading your signals more broadly.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    whyExplanation: 'Counted distinct topics in this scan. Does not indicate how the platform categorizes you.',
    takeaway: (data) => {
      if (!data?.breadth) return null;
      const b = data.breadth.toLowerCase();
      if (b === 'narrow') return "The system appears to have compressed your profile into a narrow set of categories during this window.";
      if (b === 'broad') return "The system appears to be reading your signals across a wide range of categories during this window.";
      return "The system appears to be categorizing you moderately during this window — neither highly compressed nor fully open.";
    },
    action: null,
  },

  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'What the system keeps reinforcing',
    description: 'Themes that recurred across scans, suggesting the algorithm has formed persistent associations.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Compared topics across scans. Requires multiple scans to identify recurring themes.',
    takeaway: (data) => {
      if (!data?.insights?.length) return 'Requires multiple scans to identify what the system is reinforcing.';

      // Reframe insights to emphasize system reinforcement
      const insights = data.insights.join(' ');
      if (insights.toLowerCase().includes('appeared') || insights.toLowerCase().includes('recurred')) {
        return insights.replace(/appeared/gi, 'the system reinforced').replace(/recurred/gi, 'the system kept surfacing');
      }

      return insights;
    },
    action: () => 'Themes the system keeps reinforcing may be harder to shift — changing them may take sustained effort.',
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'Extrapolated future associations (speculation)',
    description: 'If current patterns continue, the system might begin associating you with these themes. Pure speculation — not guaranteed.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Based on topic trends across scans. This is speculation — we cannot predict what platforms will show.',
    takeaway: (data) => {
      if (!data?.predictions?.length) return null;
      return `Speculation based on current trends: The system might begin associating you with ${data.predictions.join(', ')}. This is extrapolation only.`;
    },
    action: () => 'You could try changing what you engage with to see if content shifts.',
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
    title: 'Algorithmic Association Summary',
    description: 'What the system appears to associate with your profile based on recurring themes.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Based on observed patterns across scans. This reflects system interpretation, not your actual interests or identity.',
    takeaway: (data) => {
      if (data?.experiments?.length > 0) {
        return 'The system has formed persistent associations based on what keeps surfacing in your feed.';
      }
      return 'The system appears to be interpreting your signals based on recurring exposure patterns.';
    },
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


