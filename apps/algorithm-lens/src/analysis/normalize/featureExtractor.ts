// Feature extractor - analyzes normalized items to extract meaningful features
// Includes token analysis, sentiment proxies, brand detection, topic classification

import type { NormalizedItem, ItemFeatures, AggregatedFeatures } from '../../types/content';
import { detectBrands } from '../rules/brands.dictionary';
import { detectPoliticalTerms, calculatePoliticalLean } from '../rules/politics.lexicon';
import { detectEmotions, calculateEmotionalState } from '../rules/emotions.lexicon';
import { detectTopics, detectTopicsFromHashtags } from '../rules/topics.taxonomy';
import { getTopicsFromHashtags } from '../rules/hashtags.map';
import { calculateMisinfoRisk } from '../rules/misinformation.sources';

/**
 * Extract features from a normalized item
 * @param item - Normalized item to analyze
 * @returns ItemFeatures with extracted signals
 */
export function extractFeatures(item: NormalizedItem): ItemFeatures {
  const text = item.text;
  const combinedText = [item.text, ...item.hashtags.map(h => `#${h}`)].join(' ');

  // Token analysis
  const tokens = tokenizeText(text);
  const wordCount = tokens.length;
  const uniqueWords = new Set(tokens.map(t => t.toLowerCase())).size;
  const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;

  // Sentence analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Character analysis
  const charCount = text.length;
  const avgCharsPerWord = wordCount > 0 ? charCount / wordCount : 0;

  // Readability proxy (Flesch-Kincaid grade level approximation)
  const readabilityScore = 0.39 * avgWordsPerSentence + 11.8 * (countSyllables(text) / wordCount) - 15.59;

  // Sentiment proxies
  const sentimentProxies = extractSentimentProxies(text);

  // Brand detection
  const brands = detectBrands(combinedText);
  const brandNames = brands.map(b => b.canonical);
  const brandCategories = [...new Set(brands.map(b => b.category))];

  // Political analysis
  const politicalTerms = detectPoliticalTerms(combinedText);
  const politicalLean = calculatePoliticalLean(politicalTerms);
  const hasPoliticalContent = politicalTerms.length > 0;

  // Emotion analysis
  const emotions = detectEmotions(combinedText);
  const emotionalState = calculateEmotionalState(emotions);

  // Topic detection
  const topicsFromText = detectTopics(combinedText);
  const topicsFromHashtags = getTopicsFromHashtags(item.hashtags);
  const topics = [...new Set([...topicsFromText, ...topicsFromHashtags])];

  // Misinformation risk
  const misinfoRisk = calculateMisinfoRisk(
    item.urls[0], // Check first URL
    text
  );

  // Content characteristics
  const hasQuestion = /\?/.test(text);
  const hasExclamation = /!/.test(text);
  const hasAllCaps = /\b[A-Z]{4,}\b/.test(text);
  const hasEmojis = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u.test(text);
  const hasNumbers = /\d/.test(text);
  const hasUrl = item.urls.length > 0;

  // Engagement signals
  const engagementRate = calculateEngagementRate(item);
  const viralityScore = calculateViralityScore(item);

  // Time features
  const hourOfDay = new Date(item.timestamp).getHours();
  const dayOfWeek = new Date(item.timestamp).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    // Text statistics
    wordCount,
    charCount,
    sentenceCount,
    avgWordsPerSentence,
    avgCharsPerWord,
    lexicalDiversity,
    readabilityScore,

    // Sentiment proxies
    sentimentProxies,

    // Detected entities
    brands: brandNames,
    brandCategories,
    topics,
    emotions: emotions.map(e => e.family),
    emotionalValence: emotionalState.valence,
    emotionalArousal: emotionalState.arousal,

    // Political signals
    politicalLean,
    hasPoliticalContent,

    // Content characteristics
    hasQuestion,
    hasExclamation,
    hasAllCaps,
    hasEmojis,
    hasNumbers,
    hasUrl,
    hasHashtags: item.hashtags.length > 0,
    hasMentions: item.mentions.length > 0,
    hasMedia: item.media.hasImage || item.media.hasVideo,

    // Engagement
    engagementRate,
    viralityScore,

    // Temporal
    hourOfDay,
    dayOfWeek,
    isWeekend,

    // Quality signals
    misinfoRiskScore: misinfoRisk.overallRisk,
    misinfoPatterns: misinfoRisk.patterns,
    isVerified: item.isVerified,
    isPromoted: item.isPromoted,

    // Counts
    hashtagCount: item.hashtags.length,
    mentionCount: item.mentions.length,
    urlCount: item.urls.length
  };
}

/**
 * Simple tokenization (split on whitespace and punctuation)
 */
function tokenizeText(text: string): string[] {
  return text
    .split(/[\s\.,;:!?()\[\]{}""''\-—]+/)
    .filter(token => token.length > 0)
    .filter(token => !/^[@#]/.test(token)); // Remove mentions and hashtags
}

/**
 * Approximate syllable count for readability calculation
 */
function countSyllables(text: string): number {
  const words = tokenizeText(text);
  let syllableCount = 0;

  for (const word of words) {
    const lowerWord = word.toLowerCase();
    // Simple syllable counting heuristic
    const vowels = lowerWord.match(/[aeiouy]+/g);
    if (vowels) {
      syllableCount += vowels.length;
      // Adjust for silent e
      if (lowerWord.endsWith('e')) {
        syllableCount--;
      }
    } else {
      syllableCount++; // At least one syllable per word
    }
  }

  return Math.max(syllableCount, words.length); // At least one syllable per word
}

/**
 * Extract sentiment proxies from text
 */
function extractSentimentProxies(text: string): {
  positiveWordCount: number;
  negativeWordCount: number;
  sentimentScore: number;
} {
  const lowerText = text.toLowerCase();

  // Simple positive words
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
    'love', 'like', 'enjoy', 'happy', 'glad', 'pleased', 'excited',
    'best', 'perfect', 'beautiful', 'brilliant', 'outstanding',
    'thank', 'thanks', 'grateful', 'appreciate'
  ];

  // Simple negative words
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
    'angry', 'mad', 'upset', 'sad', 'disappointed', 'frustrated',
    'wrong', 'fail', 'failed', 'failure', 'problem', 'issue',
    'never', 'no', 'not', 'cannot', 'cant', 'dont', 'wont'
  ];

  let positiveWordCount = 0;
  let negativeWordCount = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveWordCount += matches.length;
    }
  }

  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeWordCount += matches.length;
    }
  }

  // Calculate sentiment score (-1 to +1)
  const total = positiveWordCount + negativeWordCount;
  const sentimentScore = total > 0
    ? (positiveWordCount - negativeWordCount) / total
    : 0;

  return {
    positiveWordCount,
    negativeWordCount,
    sentimentScore
  };
}

/**
 * Calculate engagement rate
 */
function calculateEngagementRate(item: NormalizedItem): number {
  const { likes, comments, shares, views } = item.engagement;
  const totalEngagement = likes + comments + shares;

  if (views > 0) {
    return totalEngagement / views;
  }

  // If no views, use author followers as denominator
  if (item.author.followers && item.author.followers > 0) {
    return totalEngagement / item.author.followers;
  }

  // Fallback: return raw engagement count
  return totalEngagement;
}

/**
 * Calculate virality score (0-100)
 */
function calculateViralityScore(item: NormalizedItem): number {
  const { likes, comments, shares, views } = item.engagement;

  // Shares are strongest virality signal
  let score = shares * 10;

  // Comments indicate discussion/controversy
  score += comments * 5;

  // Likes are weakest signal
  score += likes * 1;

  // Views provide context
  if (views > 0) {
    const engagementRate = (likes + comments + shares) / views;
    score *= (1 + engagementRate * 10); // Boost if high engagement rate
  }

  // Normalize to 0-100 scale (logarithmic)
  const normalizedScore = Math.min(100, Math.log10(score + 1) * 20);

  return Math.round(normalizedScore);
}

/**
 * Batch extract features from multiple items
 * @param items - Array of normalized items
 * @returns Array of item features
 */
export function extractFeaturesFromItems(items: NormalizedItem[]): Array<{
  item: NormalizedItem;
  features: ItemFeatures;
}> {
  return items.map(item => ({
    item,
    features: extractFeatures(item)
  }));
}

/**
 * Aggregate features across multiple items
 * @param items - Array of normalized items with features
 * @returns Aggregated statistics
 */
export function aggregateFeatures(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): AggregatedFeatures {
  if (items.length === 0) {
    return createEmptyAggregatedFeatures();
  }

  // Aggregate text statistics
  const avgWordCount = mean(items.map(i => i.features.wordCount));
  const avgSentenceCount = mean(items.map(i => i.features.sentenceCount));
  const avgLexicalDiversity = mean(items.map(i => i.features.lexicalDiversity));
  const avgReadability = mean(items.map(i => i.features.readabilityScore));

  // Aggregate sentiment
  const avgSentiment = mean(items.map(i => i.features.sentimentProxies.sentimentScore));
  const avgValence = mean(items.map(i => i.features.emotionalValence));
  const avgArousal = mean(items.map(i => i.features.emotionalArousal));

  // Aggregate political lean
  const avgPoliticalLean = mean(items.map(i => i.features.politicalLean));
  const politicalContentRatio = items.filter(i => i.features.hasPoliticalContent).length / items.length;

  // Count features
  const brandFrequency = countFrequency(items.flatMap(i => i.features.brands));
  const topicFrequency = countFrequency(items.flatMap(i => i.features.topics));
  const emotionFrequency = countFrequency(items.flatMap(i => i.features.emotions));

  // Content characteristics
  const hasQuestionRatio = items.filter(i => i.features.hasQuestion).length / items.length;
  const hasUrlRatio = items.filter(i => i.features.hasUrl).length / items.length;
  const hasMediaRatio = items.filter(i => i.features.hasMedia).length / items.length;
  const verifiedRatio = items.filter(i => i.features.isVerified).length / items.length;
  const promotedRatio = items.filter(i => i.features.isPromoted).length / items.length;

  // Engagement
  const avgEngagementRate = mean(items.map(i => i.features.engagementRate));
  const avgViralityScore = mean(items.map(i => i.features.viralityScore));

  // Quality
  const avgMisinfoRisk = mean(items.map(i => i.features.misinfoRiskScore));

  // Temporal patterns
  const hourDistribution = countFrequency(items.map(i => i.features.hourOfDay));
  const dayDistribution = countFrequency(items.map(i => i.features.dayOfWeek));
  const weekendRatio = items.filter(i => i.features.isWeekend).length / items.length;

  // Platform distribution
  const platformDistribution = countFrequency(items.map(i => i.item.platform));

  return {
    totalItems: items.length,
    avgWordCount,
    avgSentenceCount,
    avgLexicalDiversity,
    avgReadability,
    avgSentiment,
    avgValence,
    avgArousal,
    avgPoliticalLean,
    politicalContentRatio,
    brandFrequency,
    topicFrequency,
    emotionFrequency,
    hasQuestionRatio,
    hasUrlRatio,
    hasMediaRatio,
    verifiedRatio,
    promotedRatio,
    avgEngagementRate,
    avgViralityScore,
    avgMisinfoRisk,
    hourDistribution,
    dayDistribution,
    weekendRatio,
    platformDistribution
  };
}

/**
 * Helper: calculate mean of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Helper: count frequency of items
 */
function countFrequency<T extends string | number>(items: T[]): Record<string, number> {
  const frequency: Record<string, number> = {};
  for (const item of items) {
    const key = String(item);
    frequency[key] = (frequency[key] || 0) + 1;
  }
  return frequency;
}

/**
 * Helper: create empty aggregated features
 */
function createEmptyAggregatedFeatures(): AggregatedFeatures {
  return {
    totalItems: 0,
    avgWordCount: 0,
    avgSentenceCount: 0,
    avgLexicalDiversity: 0,
    avgReadability: 0,
    avgSentiment: 0,
    avgValence: 0,
    avgArousal: 0,
    avgPoliticalLean: 0,
    politicalContentRatio: 0,
    brandFrequency: {},
    topicFrequency: {},
    emotionFrequency: {},
    hasQuestionRatio: 0,
    hasUrlRatio: 0,
    hasMediaRatio: 0,
    verifiedRatio: 0,
    promotedRatio: 0,
    avgEngagementRate: 0,
    avgViralityScore: 0,
    avgMisinfoRisk: 0,
    hourDistribution: {},
    dayDistribution: {},
    weekendRatio: 0,
    platformDistribution: {}
  };
}

/**
 * Filter items by feature criteria
 * @param items - Array of items with features
 * @param criteria - Filter criteria
 * @returns Filtered items
 */
export function filterByFeatures(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>,
  criteria: {
    minWordCount?: number;
    maxWordCount?: number;
    hasPoliticalContent?: boolean;
    topics?: string[];
    brands?: string[];
    minEngagementRate?: number;
    maxMisinfoRisk?: number;
  }
): Array<{ item: NormalizedItem; features: ItemFeatures }> {
  return items.filter(({ features }) => {
    if (criteria.minWordCount !== undefined && features.wordCount < criteria.minWordCount) {
      return false;
    }
    if (criteria.maxWordCount !== undefined && features.wordCount > criteria.maxWordCount) {
      return false;
    }
    if (criteria.hasPoliticalContent !== undefined && features.hasPoliticalContent !== criteria.hasPoliticalContent) {
      return false;
    }
    if (criteria.topics && !criteria.topics.some(t => features.topics.includes(t))) {
      return false;
    }
    if (criteria.brands && !criteria.brands.some(b => features.brands.includes(b))) {
      return false;
    }
    if (criteria.minEngagementRate !== undefined && features.engagementRate < criteria.minEngagementRate) {
      return false;
    }
    if (criteria.maxMisinfoRisk !== undefined && features.misinfoRiskScore > criteria.maxMisinfoRisk) {
      return false;
    }
    return true;
  });
}
