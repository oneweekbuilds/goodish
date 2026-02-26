/**
 * Canonical Scan Aggregation Layer - Phase 5
 *
 * This module provides the single source of truth for aggregating scan data.
 * NO UI LOGIC IN THIS FILE.
 */

import type { ScanListItem } from '../../types/api';
import type { ScanDetailsMap } from './aggregators/aggregatorUtils';

// ============================================
// RE-EXPORTS FROM AGGREGATOR MODULES
// ============================================

export {
  CONFUSING_TOPICS,
  UNCLASSIFIED_TOPIC,
  getScanData,
  getAggregates,
  getFeedItems,
  roundPercentagesToSum100,
  getScanMeta,
  normalizeCreatorId,
  normalizeTopicLabel,
  generatePostKey,
  formatDateLabel,
} from './aggregators/aggregatorUtils';

export type { ScanDetail, ScanDetailsMap, CreatorInfo } from './aggregators/aggregatorUtils';

export {
  aggregateTopics,
  aggregateCreators,
  aggregateAiDisclosures,
} from './aggregators/aggregateOverview.js';

export {
  buildTopicUniverse,
  deriveRareTopics,
  aggregateCreatorTopics,
} from './aggregators/aggregateTopicUniverse.js';

export {
  aggregateAds,
  aggregateProducts,
  aggregateAdThemes,
} from './aggregators/aggregateAds.js';

export {
  detectLabeledAds,
  detectPossibleInfluence,
  summarizeInfluence,
  classifyPromoThemes,
  DISCLOSURE_KEYWORDS,
  AFFILIATE_SIGNALS,
  AFFILIATE_URL_PATTERNS,
  PROMO_THEME_KEYWORDS,
} from './aggregators/aggregatePromotion.js';

export {
  aggregatePolitics,
  classifyPoliticalLeaningHeuristic,
  aggregatePoliticalLeaning,
} from './aggregators/aggregatePolitics.js';

export {
  aggregateEmotions,
  aggregateCreatorTones,
} from './aggregators/aggregateTone.js';

export {
  aggregateSourceOrigin,
  aggregateTopicsBySourceOrigin,
  aggregateAdsBySourceOrigin,
  aggregateCreatorFamiliarityBySourceOrigin,
  aggregateContentTypeBySourceOrigin,
} from './aggregators/aggregateSources.js';

export {
  calculateStability,
  calculateDiscoveryRate,
  calculateEchoRisk,
} from './aggregators/aggregateDerived.js';

// Import aggregator functions for the combined aggregateAllScanData entry point
import { aggregateAds, aggregateProducts } from './aggregators/aggregateAds.js';
import { aggregatePolitics } from './aggregators/aggregatePolitics.js';
import { aggregateTopics, aggregateCreators } from './aggregators/aggregateOverview.js';
import { aggregateEmotions } from './aggregators/aggregateTone.js';
import { calculateStability, calculateDiscoveryRate, calculateEchoRisk } from './aggregators/aggregateDerived.js';

/** Metadata about the aggregation run */
export interface AggregationMeta {
  totalScans: number;
  totalScanDetails: number;
  platforms: string[];
  dateRange: { oldest: string; newest: string } | null;
}

/**
 * Perform all aggregations at once.
 * This is the primary entry point for the dashboard.
 */
export function aggregateAllScanData(scans: ScanListItem[], scanDetails: ScanDetailsMap) {
  const ads = aggregateAds(scans, scanDetails);
  const politics = aggregatePolitics(scans, scanDetails);
  const topics = aggregateTopics(scans, scanDetails);
  const creators = aggregateCreators(scans, scanDetails);
  const emotions = aggregateEmotions(scans, scanDetails);
  const products = aggregateProducts(scans, scanDetails);

  const stability = calculateStability(topics, scans, scanDetails);
  const discovery = calculateDiscoveryRate(creators, scans, scanDetails);
  const echoRisk = calculateEchoRisk(topics, stability);

  const meta: AggregationMeta = {
    totalScans: scans.length,
    totalScanDetails: Object.keys(scanDetails).length,
    platforms: [...new Set(scans.map(s => (s.platform || 'unknown').toLowerCase()))],
    dateRange: scans.length > 0 ? {
      oldest: scans[scans.length - 1]?.created_at,
      newest: scans[0]?.created_at,
    } : null,
  };

  return {
    ads,
    politics,
    topics,
    creators,
    emotions,
    products,
    stability,
    discovery,
    echoRisk,
    meta,
  };
}
