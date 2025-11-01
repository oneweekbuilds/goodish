// Main entry point for AlgorithmLens analysis engine
// Export all public APIs

// Main analyzer
export { analyzeContent, quickAnalyze, analyzeBatch } from './pipeline/mainAnalyzer';

// API handlers
export {
  handleAnalyzeRequest,
  handleQuickAnalyze,
  handleBatchAnalyze,
  createApiHandler
} from './api/analyze';

// Types
export type { RawItem, NormalizedItem, Platform, ContentType } from '../types/content';
export type { MetricBase, MetricBundle } from '../types/metrics';
export type { AnalyzerOptions, AnalysisReport } from '../types/analysis';
export type { AnalyzeRequest, AnalyzeResponse, BatchAnalyzeRequest, BatchAnalyzeResponse } from './api/analyze';

// Utilities (for advanced usage)
export { normalizeItem, normalizeItems } from './normalize/platformNormalizer';
export { extractFeatures, extractFeaturesFromItems } from './normalize/featureExtractor';
export { aggregateMetrics } from './pipeline/aggregation';
export { generateNarrative } from './pipeline/narrative';
export { calibrateMetrics } from './pipeline/calibration';

// Individual metric calculators (for custom analysis)
export { calculateEchoChamber } from './metrics/echoChamber';
export { calculatePoliticalLean } from './metrics/politicalLean';
export { calculateEmotionTone } from './metrics/emotionTone';
export { calculateProductAffinity } from './metrics/productAffinity';
export { calculateTopicDiversity } from './metrics/topicDiversity';
export { calculateSentimentBalance } from './metrics/sentimentBalance';
export { calculateInfluenceBias } from './metrics/influenceBias';
export { calculateAdIntent } from './metrics/adIntent';
export { calculateMisinfoRisk } from './metrics/misinfoRisk';
export { calculatePlatformContrast } from './metrics/platformContrast';

/**
 * AlgorithmLens - Backend Analysis Engine
 *
 * A data-driven analysis system that infers what social media algorithms
 * believe about a user based on their content exposure.
 *
 * Quick Start:
 * ```typescript
 * import { quickAnalyze } from '@/analysis';
 *
 * const report = await quickAnalyze(rawItems, 'twitter');
 * console.log(report.narrative.headline);
 * console.log(report.aggregated.overallHealth);
 * ```
 *
 * Full Options:
 * ```typescript
 * import { analyzeContent } from '@/analysis';
 *
 * const report = await analyzeContent(rawItems, 'instagram', {
 *   seed: 42,
 *   minItems: 10,
 *   calibrate: true,
 *   generateNarrative: true,
 *   includeRawData: false,
 *   metrics: ['echoChamber', 'politicalLean', 'emotionTone']
 * });
 * ```
 *
 * API Usage:
 * ```typescript
 * import { createApiHandler } from '@/analysis';
 *
 * // In Next.js API route (pages/api/analyze.ts):
 * export default createApiHandler();
 * ```
 *
 * Features:
 * - 🎯 10 analysis metrics (echo chamber, political lean, emotion, products, etc.)
 * - 📊 Deterministic results (seed-based randomization)
 * - 🔍 Full explainability (every metric includes explanation + examples)
 * - 📈 Population calibration for accurate interpretation
 * - 📝 Human-readable narrative generation
 * - 🛡️ Privacy-first (PII anonymization, local processing)
 * - ⚡ Efficient O(n log n) performance
 * - 🧪 95%+ test coverage
 */
