// Metric output types

import { Platform } from './content';

/**
 * Base structure for all metric outputs
 */
export interface MetricBase {
  metric: string; // e.g., "Echo Chamber"
  key: string; // stable key e.g., "echo_chamber"
  value: number | Record<string, number> | string | Record<string, any>;
  unit?: "%" | "index" | "score" | "label";
  confidence: number; // 0..1
  explanation: string; // 1-3 sentences
  topSignals: string[]; // keywords, sources, examples
  notes?: string[];
  examples?: string[]; // concrete posts/hashtags (no PII)
  status: "ok" | "warning" | "error";
  issues: string[];
}

/**
 * Complete bundle of all metrics
 */
export interface MetricBundle {
  echoChamber: MetricBase;
  politicalLean: MetricBase;
  emotionTone: MetricBase;
  productAffinity: MetricBase;
  topicDiversity: MetricBase;
  sentimentBalance: MetricBase;
  influenceBias: MetricBase;
  adIntent: MetricBase;
  misinfoRisk: MetricBase;
  platformContrast?: MetricBase; // only in overall, not per-platform
}

/**
 * Per-platform slice of metrics
 */
export interface PlatformSlice {
  platform: Platform;
  itemCount: number;
  metrics: MetricBundle;
}

/**
 * Calibration parameters per metric
 */
export interface CalibrationParams {
  metric: string;
  anchors: Array<{
    condition: string;
    minScore?: number;
    maxScore?: number;
  }>;
  transform?: (raw: number) => number;
}

/**
 * Weighting configuration
 */
export interface Weights {
  topicWeight: number;
  politicsWeight: number;
  emotionWeight: number;
  brandWeight: number;
  sentimentWeight: number;
  influenceWeight: number;
  adWeight: number;
}

/**
 * Default weights
 */
export const DEFAULT_WEIGHTS: Weights = {
  topicWeight: 1.0,
  politicsWeight: 1.0,
  emotionWeight: 0.8,
  brandWeight: 1.0,
  sentimentWeight: 0.7,
  influenceWeight: 0.9,
  adWeight: 1.1,
};
