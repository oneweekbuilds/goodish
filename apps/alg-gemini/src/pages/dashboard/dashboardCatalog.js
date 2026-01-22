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
  pickHeadlineSafeLabels,
} from '../../lib/dashboard/headlineSafety';

// Empty state type constants
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

// Tab-level trust sentences - grounded in observation, not identity
// FIX X2, P1, C1: Use consistent observational language without implying single vs multiple scans
export const TAB_TRUST_SENTENCES = {
  ads: "Promotional content observed here — not what you buy or want.",
  politics: "Political keywords observed here — measures exposure, not your beliefs.",
  patterns: "Topics observed here — what surfaced, not what you seek.",
  creators: "Accounts observed here — what appeared, not who you are.",
  algorithm: "Patterns observed here — system interpretation, not your identity.",
};

export const TABS = [
  { id: 'ads', label: 'Ads & Influence' },
  { id: 'politics', label: 'Politics & Worldview' },
  { id: 'patterns', label: 'Patterns in Your Feed' },
  { id: 'creators', label: 'Creators & Voices' },
  { id: 'algorithm', label: 'Observed Patterns' },
  { id: 'talk', label: 'Talk' },
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
    description: 'Looks at labeled promotions to see how hard the feed is selling to you.',
    outputType: 'number_line',
    dataFn: 'getAdPercentageData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Platform-labeled ads and sponsored posts.',
    counterfactual: 'Some ads blend in with regular content.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      const smallSample = total > 0 && total < 20;

      if (pct === 0) {
        return smallSample
          ? 'The feed wasn\'t selling in this sample.'
          : 'No selling pressure detected here.';
      }

      if (pct < 8) {
        return smallSample
          ? 'Early signal: light sponsored touches surfaced.'
          : 'Selling pressure is light — promotions appear but don\'t drive the feed.';
      }

      if (pct < 18) {
        // FIX A3: Soften interpretive language - be clearer about what we're measuring
        return 'Sponsored content appears regularly — promotions are present but not dominant.';
      }

      return 'Advertising is a main storyline here — paid promotions make up a substantial portion of what you see.';
    },
    action: null,
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'ads',
    id: 'ads-concentration',
    title: 'Who is driving the selling',
    description: 'Shows whether a handful of repeat advertisers are steering what you\'re being sold in this window.',
    outputType: 'text',
    dataFn: 'getAdConcentrationData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Unique advertisers in labeled ads.',
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
    description: 'Which platform has the highest ad rate in your scans.',
    outputType: 'bar',
    dataFn: 'getPlatformPromoData',
    emptyStateType: 'needs_broader_behavior',
    sortOrder: 'supporting',
    whyExplanation: 'Labeled ads per platform.',
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
  // FIX A7: Reduced repetition and shortened copy for clarity
  {
    tab: 'ads',
    id: 'ads-likely-promo',
    title: 'Unlabeled Promotional Content',
    description: 'Content that matched promotional patterns but lacked platform ad labels.',
    outputType: 'number',
    dataFn: 'getLikelyPromoData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Discount codes and affiliate link patterns.',
    takeaway: (data) => {
      if (data?.possibleInfluencePercent === undefined) return null;
      const pct = data.possibleInfluencePercent;
      if (pct === 0) return 'No obvious unlabeled promotional signals detected.';
      return `Approximately ${pct}% showed promotional patterns without ad labels.`;
    },
    action: null,
  },
  {
    tab: 'ads',
    id: 'ads-products',
    title: 'What the ads are pitching',
    description: 'Top product themes in your ads during this window so you can see what\'s being emphasized.',
    outputType: 'bar',
    dataFn: 'getProductMentionsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Keywords in labeled ads.',
    takeaway: (data) => {
      // FIX A9: Add context to low-signal copy
      if (!Array.isArray(data) || data.length === 0) return null;
      const totalMatches = data.reduce((sum, item) => sum + (item.value || 0), 0);
      const [first, second] = data;
      if (totalMatches < 10) {
        // Provide calm context about what low signal means
        // R2-W10 FIX: Remove hedging "may mean", use concrete observation
        return `Low signal: Found ${totalMatches} product keyword matches. Ads may have been subtle, or few appeared.`;
      }
      
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
    description: 'Track how ad percentage has changed during this window.',
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
    title: 'Recurring Ad Categories',
    description: 'Product categories that appeared multiple times in your scans.',
    outputType: 'text',
    dataFn: 'getAdvertiserInsightsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    confidenceDisclaimer: true,
    isSummaryCard: true,
    whyExplanation: 'Product keywords in ads during this window.',
    // R2-PA10 FIX: Make summary more comparative and less list-like
    takeaway: (data) => {
      if (!data?.interests?.length) return null;
      if (data.interests.length === 1) {
        return `${data.interests[0]} dominated ad categories during this window.`;
      }
      if (data.interests.length === 2) {
        return `${data.interests[0]} and ${data.interests[1]} dominated ad categories.`;
      }
      return `${data.interests[0]} appeared most frequently in ads, followed by ${data.interests.slice(1, 3).join(' and ')}.`;
    },
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
    description: 'Whether political keywords appeared as isolated touches or formed a sustained presence.',
    outputType: 'number_line',
    dataFn: 'getPoliticalShareData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Keywords related to elections, policy, and political figures.',
    counterfactual: 'Political content may be more memorable than other topics.',
    takeaway: (data) => {
      if (data?.currentPercent === undefined) return null;
      const pct = data.currentPercent;
      const total = data.totalPosts || 0;
      const smallSample = total > 0 && total < 20;

      if (pct === 0) {
        return smallSample
          ? 'No political keywords surfaced in this sample.'
          : 'Political exposure was absent — your feed had no detectable political keywords.';
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
    whyExplanation: 'Keywords associated with different political perspectives.',
    takeaway: (data) => {
      // R2-W10 FIX: Remove repetitive disclaimer, use concrete comparative language
      if (!data?.message) {
        return 'Political keyword exposure concentrated in one direction during this window.';
      }
      // Remove repetitive "not which is correct" disclaimer - trust sentence covers this
      return data.message;
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
    whyExplanation: 'Counted political keyword matches per account in your scans.',
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
  // FIX P7: Improved platform asymmetry phrasing when comparator is near-zero
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
    whyExplanation: 'Political keyword rates per platform.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      const sorted = [...data].sort((a, b) => (b?.value || 0) - (a?.value || 0));
      const [top, second] = sorted;
      if (!top) return null;

      if (!second) {
        return `Political keywords concentrated entirely on ${top.label}.`;
      }

      const topValue = top.value || 0;
      const secondValue = second.value || 0;
      const gap = topValue - secondValue;

      // R2-P7 FIX: Use concrete comparative language, avoid templated "over [platform]" phrasing
      if (secondValue < 2) {
        return `Political keywords appeared primarily on ${top.label} during this window.`;
      }

      if (gap >= 10) {
        return `Political exposure clustered heavily on ${top.label}, with much lighter presence on ${second.label}.`;
      }

      if (Math.abs(gap) <= 3) {
        return `Political keywords appeared evenly between ${top.label} and ${second.label}.`;
      }

      // R2-P7: Use relative framing instead of templated comparison
      return `Political exposure was more concentrated on ${top.label} than ${second.label} during this window.`;
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
    whyExplanation: 'Keyword matching (cannot detect nuance or context).',
    // PHASE 9: Qualitative labels only
    takeaway: (data) => {
      if (!data?.qualitativeLabel) return null;
      // R2-W10 FIX: Remove parenthetical disclaimer, use cleaner phrasing
      return `${data.qualitativeLabel}`;
    },
    action: null,
  },
  {
    tab: 'politics',
    id: 'politics-blind-spots',
    title: 'Absent keyword categories (low confidence)',
    description: 'Keyword categories that did not appear in your scans.',
    outputType: 'list',
    dataFn: 'getPoliticalBlindSpotsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    requiresOptIn: true,
    confidenceDisclaimer: true,
    collapsedByDefault: true,
    whyExplanation: 'Detected by absence of certain keywords in your scans. Very rough — absence here does not prove absence elsewhere in your feed.',
    takeaway: (data) => {
      if (!data?.message) return 'Some keyword categories were absent in your scans.';
      return `${data.message} (Scan-specific only.)`;
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
    // R2-W10 FIX: Replace templated phrasing with concrete relative framing
    takeaway: (data) => {
      if (!data?.direction) return null;
      const direction = data.direction.toLowerCase();
      if (direction === 'increasing') {
        return 'Political keyword exposure increased across scans.';
      }
      if (direction === 'decreasing') {
        return 'Political keyword exposure decreased across scans.';
      }
      return 'Political keyword exposure remained stable across scans.';
    },
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
    whyExplanation: 'Political keywords during this window.',
    takeaway: (data) => {
      // FIX P10: Instead of repeating hero's percentage assessment, provide distinct insight
      // NOTE: getPoliticalProfileData only returns politicalPercent, not source details
      // So we provide a synthesis that doesn't repeat the hero's light/moderate/heavy labels
      if (data?.politicalPercent === undefined) return null;
      const pct = data.politicalPercent;
      
      if (pct === 0) {
        return 'No political exposure detected during this window.';
      }
      
      // Provide synthesis about what political content means, not repeating percentage ranges
      if (pct < 10) {
        return 'Political keywords appeared occasionally but weren\'t a dominant theme.';
      }
      
      if (pct < 25) {
        return 'Political keywords formed a visible but not overwhelming presence in your feed.';
      }
      
      return 'Political keywords were a sustained and recurring element throughout your feed.';
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
    title: 'Feed breadth: narrow or wide',
    description: 'Whether your feed narrowed to repeat themes or broadened across different topics.',
    outputType: 'number_bar',
    dataFn: 'getTopicVarietyData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Posts grouped by detected topic.',
    counterfactual: 'This window may differ from your typical feed.',
    takeaway: (data) => {
      // FIX PA1: Don't make confident claims when data is insufficient
      // Check if we have meaningful data before claiming broadened/narrowed
      if (!data || !data.topTopics || data.topTopics.length === 0) {
        return null;
      }

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
          return `Your feed narrowed to ${top} and ${second} — almost nothing else surfaced.`;
        } else if (top) {
          return `Your feed narrowed to ${top} — minimal rotation to other topics.`;
        }
        return `Your feed narrowed to a few repeated themes.`;
      }
      if (data.topicCount <= 7) {
        if (top && second) {
          return `${top} and ${second} led a moderate rotation — your feed stayed concentrated.`;
        } else if (top) {
          return `${top} led with moderate rotation — your feed stayed concentrated.`;
        }
        return `Your feed cycled through familiar themes — concentration stayed high.`;
      }
      if (top && second) {
        return `Your feed broadened — ${top} and ${second} among a wide rotating mix.`;
      } else if (top) {
        return `Your feed broadened — ${top} among a wide rotating mix of themes.`;
      }
      return `Your feed broadened — content spread across many themes.`;
    },
    action: null, // FIX X3, PA9: Removed generic advice
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'patterns',
    id: 'patterns-echo-risk',
    title: 'Repetition vs. rotation',
    description: 'Whether a few topics dominated or content spread evenly across many themes.',
    outputType: 'status',
    dataFn: 'getEchoRiskData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Topic distribution during this window.',
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
      return `During this window: ${data.riskLevel}`;
    },
    action: null,
  },

  {
    tab: 'patterns',
    id: 'patterns-repeated-themes',
    title: 'Which themes recurred most',
    description: 'Topics that appeared consistently, forming the core of what you saw.',
    outputType: 'number',
    dataFn: 'getRepeatedThemesData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    hidden: true,
    whyExplanation: 'Percentage that fell into top 3 topics.',
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
    whyExplanation: 'Compares topics between scans.',
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
    action: null, // FIX X3, PA9: Removed generic advice
  },

  // --- COLLAPSED BY DEFAULT: Still available but de-emphasized ---
  // FIX PA6: Softened copy and removed action to reduce judgmental feel
  {
    tab: 'patterns',
    id: 'patterns-emotional-weight',
    title: 'Emotional tone balance',
    description: 'Broad estimate of emotional tone patterns during this window.',
    outputType: 'stacked100',
    dataFn: 'getEmotionalWeightData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    whyExplanation: 'Keyword patterns (cannot capture context or nuance).',
    // R2-W10 FIX: Replace generic templated phrasing with concrete observation
    takeaway: (data) => {
      if (!data?.intensity) return null;
      const intensity = data.intensity.toLowerCase();
      if (intensity === 'intense' || intensity === 'high') {
        return 'Content showed more intense emotional language during this window.';
      }
      if (intensity === 'calm' || intensity === 'low') {
        return 'Content showed calmer emotional language during this window.';
      }
      return 'Content showed mixed emotional tone during this window.';
    },
    action: null,
  },
  {
    tab: 'patterns',
    id: 'manipulative-patterns',
    title: 'Engagement hook frequency',
    description: 'Posts that used urgency language, engagement hooks, or other attention-grabbing patterns.',
    outputType: 'number_line',
    dataFn: 'getManipulativePatternsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Urgency language and engagement hooks.',
    takeaway: (data) => {
      // FIX PA5: Lead with interpretation, make low-signal clearer
      if (!data) return null;
      const pct = data.currentPercent || 0;
      const total = data.totalPosts || 0;

      if (total < 20) {
        return 'Limited sample — need more posts to assess attention tactics reliably.';
      }
      if (pct === 0) {
        return 'Attention-grabbing patterns were absent during this window.';
      }
      if (pct < 10) {
        return 'Attention tactics appeared lightly — present but not a dominant pattern.';
      }
      if (pct < 25) {
        return 'Attention tactics surfaced regularly — a noticeable presence in the feed.';
      }
      return 'Attention tactics recurred heavily — a consistent thread throughout.';
    },
    action: null, // FIX X3, PA9: Removed generic advice
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
    whyExplanation: 'A summary of topics detected during this window.',
    takeaway: (data) => {
      // R2-PA10 FIX: Synthesize distinct insight instead of concatenating placeholder-like statements
      if (!data?.insights?.length) return null;
      
      // Extract key signals from insights array
      const insightText = data.insights.join(' ').toLowerCase();
      const hasTopicCount = insightText.includes('topics');
      const hasTone = insightText.includes('tone');
      const hasStability = insightText.includes('stable') || insightText.includes('changing');
      
      // Synthesize: focus on what the combination tells us, not repeating individual metrics
      if (hasTopicCount && hasStability) {
        if (insightText.includes('narrow') && insightText.includes('stable')) {
          return 'Feed stayed focused on familiar themes with little variation.';
        }
        if (insightText.includes('diverse') && insightText.includes('stable')) {
          return 'Feed maintained broad topic coverage across scans.';
        }
        if (insightText.includes('changing')) {
          return 'Topic mix shifted between scans — feed rotation increased.';
        }
      }
      
      if (hasTopicCount && hasTone) {
        if (insightText.includes('narrow')) {
          return 'Feed concentrated on fewer topics with consistent tone patterns.';
        }
        return 'Feed showed varied topic coverage with mixed emotional tone.';
      }
      
      // Fallback: if we can't synthesize, at least make it more concise than concatenation
      if (data.insights.length === 1) {
        return data.insights[0];
      }
      
      // For multiple insights, provide synthesis rather than list
      return 'Patterns suggest feed structure remained consistent during this window.';
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
    description: 'Whether many voices shaped what you saw, or a small set of accounts dominated your feed.',
    outputType: 'table',
    dataFn: 'getTopCreatorsData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    maxItems: 5,
    whyExplanation: 'Posts per account during this window.',
    counterfactual: 'Reflects what appeared, not who you follow.',
    takeaway: (data) => {
      if (!Array.isArray(data) || data.length === 0) return 'Influence spread across multiple voices.';

      const top = data[0]?.creator;
      const topCount = data[0]?.postCount || 0;
      const secondCount = data[1]?.postCount || 0;
      const totalAccounts = data.length;

      if (!top) return 'Influence spread across multiple voices.';

      // FIX C4: Use softer language without claiming "dominated"
      // If top account has significantly more posts than second
      if (totalAccounts === 1 || (secondCount > 0 && topCount >= secondCount * 2)) {
        return `${top} appeared very frequently — one voice with strong presence.`;
      }

      // If top few accounts are close in count, it's concentrated
      if (totalAccounts <= 3) {
        return `A small set of familiar accounts shaped most of your feed.`;
      }

      // If many accounts but top still stands out
      if (topCount >= 3) {
        return `${top} appeared most often, but content came from ${totalAccounts} voices.`;
      }

      return `Content came from ${totalAccounts} different voices — distributed influence.`;
    },
    action: null, // FIX X3, C6: Removed generic advice (already fixed in 2C)
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
    whyExplanation: 'Share of posts from top accounts.',
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
    whyExplanation: 'Counted unique accounts during this window.',
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
    whyExplanation: 'Matched handles across platforms.',
    takeaway: (data) => {
      // FIX C8: Make empty state educational, not a dead end
      if (!Array.isArray(data) || data.length === 0) {
        return 'No accounts appeared on multiple platforms during this window. If they did, we\'d show voices that reached you in different spaces.';
      }
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
  // FIX C10: Clarified summary to focus on pattern observation, not creator labeling
  {
    tab: 'creators',
    id: 'creators-influential',
    title: 'Influence Pattern',
    description: 'Whether influence concentrated around a few accounts or distributed across many voices.',
    outputType: 'text',
    dataFn: 'getInfluentialCreatorsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Appearance frequency during this window.',
    takeaway: (data) => {
      if (data?.creators && Array.isArray(data.creators)) {
        const count = data.creators.length;
        if (count <= 3) return 'Influence concentrated — a few familiar accounts appeared repeatedly.';
        if (count <= 8) return 'Influence moderately distributed — several accounts appeared regularly.';
        return 'Influence broadly distributed — many different accounts contributed.';
      }
      // R2-W10 FIX: Replace generic fallback with concrete observation
      return 'Influence distribution pattern observed during this window.';
    },
    action: null,
  },

  // ==========================================
  // TAB 5: OBSERVED PATTERNS
  // Core question: "What patterns appeared in my scans?"
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
    title: 'Topics that appeared most',
    description: 'Based on what surfaced repeatedly in your scans.',
    outputType: 'list',
    dataFn: 'getAlgoTopicsLikedData',
    emptyStateType: 'needs_more_scans',
    hero: true,
    isPrimary: true,
    sortOrder: 'primary',
    whyExplanation: 'Topic occurrences during this window.',
    counterfactual: 'Observations only, not predictions or classifications.',
    takeaway: (data) => {
      // FIX W2: Use "surfaced" language to avoid identity labeling
      const { labels, hadExcluded } = pickHeadlineSafeLabels(data, {
        getLabel: (t) => t?.topic,
        limit: 2,
      });
      const [top, second] = labels;

      if (!top) {
        return hadExcluded ? FALLBACK_MIX_TOPICS_HEADLINE : 'Multiple themes surfaced in your feed.';
      }

      if (second) {
        return `${top} and ${second} surfaced most often in your feed.`;
      }

      return `${top} surfaced most often in your feed.`;
    },
    action: null, // FIX X3, W8: Removed generic advice
  },

  // --- SECONDARY: Supporting details ---
  {
    tab: 'algorithm',
    id: 'algo-profile-breadth',
    title: 'Topic range in your scans',
    description: 'Whether topics concentrated narrowly around a few themes or spread more broadly.',
    outputType: 'status',
    dataFn: 'getProfileBreadthData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    hidden: true,
    whyExplanation: 'Distinct topics observed.',
    takeaway: (data) => {
      if (!data?.breadth) return null;
      const b = data.breadth.toLowerCase();
      if (b === 'narrow') return "Topics concentrated in a narrow set of categories in your scans.";
      if (b === 'broad') return "Topics spread across a wide range of categories in your scans.";
      return "Topics showed moderate range in your scans — neither highly concentrated nor fully dispersed.";
    },
    action: null,
  },

  // FIX W5: Removed redundancy with hero by focusing on persistence, not re-listing
  {
    tab: 'algorithm',
    id: 'algo-confident',
    title: 'Recurring themes across scans',
    description: 'Themes that appeared consistently across multiple scans.',
    outputType: 'text',
    dataFn: 'getAlgoConfidentData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    whyExplanation: 'Topics compared over time.',
    takeaway: (data) => {
      // R2-W10 FIX: Synthesize insights instead of concatenating, use observational tone
      if (!data?.insights?.length) return null;

      const insights = data.insights.join(' ').toLowerCase();
      const hasConsistent = insights.includes('consistent');
      const hasStrongAssociation = insights.includes('strong association');
      
      // Synthesize: focus on what the combination tells us
      if (hasConsistent && hasStrongAssociation) {
        // Extract topic if present
        const topicMatch = data.insights.find(i => i.includes('"'))?.match(/"([^"]+)"/);
        if (topicMatch) {
          return `Themes around ${topicMatch[1]} appeared consistently across scans.`;
        }
        return 'Certain themes appeared consistently across multiple scans.';
      }
      
      if (hasConsistent) {
        return 'Topic patterns remained stable across scans.';
      }
      
      if (hasStrongAssociation) {
        const topicMatch = data.insights.find(i => i.includes('"'))?.match(/"([^"]+)"/);
        if (topicMatch) {
          return `${topicMatch[1]} content appeared most frequently during this window.`;
        }
      }
      
      // Fallback: synthesize rather than concatenate
      return 'Patterns suggest consistent topic associations during this window.';
    },
    action: null,
  },
  {
    tab: 'algorithm',
    id: 'algo-future',
    title: 'If current trends continued (speculation)',
    description: 'Extrapolation based on recent patterns — not a prediction or recommendation.',
    outputType: 'text',
    dataFn: 'getFutureRecommendationsData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'supporting',
    collapsedByDefault: true,
    confidenceDisclaimer: true,
    whyExplanation: 'Extrapolation from recent trends (cannot predict future).',
    takeaway: (data) => {
      // R2-W6 FIX: Tighten speculation language, remove repetitive disclaimers
      if (!data?.predictions?.length) return null;
      const topics = data.predictions.join(', ');
      // Use concrete relative framing instead of hedging
      return `If recent patterns continued, ${topics} would likely appear more often. (Speculation only — not a prediction.)`;
    },
    action: null,
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
    description: 'Areas with high variance during this window.',
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
  // FIX W9: Improved header to match actual content (list of observed patterns)
  {
    tab: 'algorithm',
    id: 'algo-change-advice',
    title: 'Observed Pattern Summary',
    description: 'Themes that appeared consistently during this window.',
    outputType: 'list',
    dataFn: 'getAlgoChangeAdviceData',
    emptyStateType: 'needs_more_scans',
    sortOrder: 'summary',
    isSummaryCard: true,
    whyExplanation: 'Observed patterns during this window.',
    takeaway: (data) => {
      // R2-W10 FIX: Replace generic placeholder with concrete relative framing
      if (data?.experiments?.length > 0) {
        const count = data.experiments.length;
        if (count === 1) {
          return 'One theme appeared repeatedly across scans.';
        }
        if (count <= 3) {
          return `${count} themes appeared repeatedly across scans.`;
        }
        return 'Multiple themes appeared repeatedly across scans.';
      }
      return null;
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




