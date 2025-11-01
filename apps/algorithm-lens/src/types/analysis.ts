// Analysis configuration and output types

import { Platform } from './content';
import { MetricBundle } from './metrics';

/**
 * Options for analyzer
 */
export interface AnalyzerOptions {
  seed: number;
  mode: "mock" | "fixtures" | "payload";
  minItems: number;
}

/**
 * Default analyzer options
 */
export const DEFAULT_ANALYZER_OPTIONS: AnalyzerOptions = {
  seed: 42,
  mode: "mock",
  minItems: 25,
};

/**
 * Final analysis report structure
 */
export interface AnalysisReport {
  version: "1.0.0";
  generatedAt: number;
  options: AnalyzerOptions;
  overall: MetricBundle;
  byPlatform: Record<Platform, MetricBundle>;
  narrative: {
    paragraphs: string[];
    citations: string[]; // metric keys used
  };
  status: "ok" | "warning" | "error";
  issues: string[];
  counts: {
    totalItems: number;
    byPlatform: Record<Platform, number>;
    timeRange: { min: number; max: number };
  };
}

/**
 * Intermediate analysis context
 */
export interface AnalysisContext {
  items: any[]; // NormalizedItem[]
  weights: number[];
  features: any; // AggregatedFeatures
  options: AnalyzerOptions;
}
