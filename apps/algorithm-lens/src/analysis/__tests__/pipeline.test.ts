// Pipeline orchestration tests
import { describe, it, expect } from 'vitest';

// Pipeline functions
import { analyzeContent, quickAnalyze, analyzeBatch } from '../pipeline/mainAnalyzer';
import { calibrateMetrics } from '../pipeline/calibration';
import { aggregateMetrics } from '../pipeline/aggregation';
import { generateNarrative } from '../pipeline/narrative';

// Mock data
import {
  generateMockTwitterData,
  generateMockInstagramData,
  generateEchoChamberData,
  generateManipulativeData,
  generateCommercialData,
  generateHealthyData,
  generateMultiPlatformData
} from '../data/mockData';

// Types
import type { MetricBundle } from '../types';

describe('Main Analyzer', () => {
  it('should run full analysis pipeline', async () => {
    const rawItems = generateMockTwitterData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result).toBeDefined();
    expect(result.meta).toBeDefined();
    expect(result.meta.platform).toBe('twitter');
    expect(result.meta.itemCount).toBe(rawItems.length);
    expect(result.meta.seed).toBe(42);

    expect(result.metrics).toBeDefined();
    expect(Object.keys(result.metrics)).toHaveLength(10); // All 10 metrics

    expect(result.summary).toBeDefined();
    expect(result.summary.overallHealth).toBeGreaterThanOrEqual(0);
    expect(result.summary.overallHealth).toBeLessThanOrEqual(100);

    expect(result.narrative).toBeDefined();
    expect(result.narrative.headline).toBeTruthy();
    expect(result.narrative.summary).toBeTruthy();
    expect(result.narrative.sections.length).toBeGreaterThan(0);
  });

  it('should handle custom seed', async () => {
    const rawItems = generateMockTwitterData();
    const result1 = await analyzeContent(rawItems, 'twitter', { seed: 123 });
    const result2 = await analyzeContent(rawItems, 'twitter', { seed: 123 });

    expect(result1.meta.seed).toBe(123);
    expect(result2.meta.seed).toBe(123);
    expect(result1.metrics).toEqual(result2.metrics); // Deterministic
  });

  it('should respect includeExamples option', async () => {
    const rawItems = generateMockTwitterData();
    const withExamples = await analyzeContent(rawItems, 'twitter', {
      includeExamples: true
    });
    const withoutExamples = await analyzeContent(rawItems, 'twitter', {
      includeExamples: false
    });

    expect(withExamples.metrics.echoChamber.examples.length).toBeGreaterThan(0);
    expect(withoutExamples.metrics.echoChamber.examples.length).toBe(0);
  });

  it('should respect skipCalibration option', async () => {
    const rawItems = generateEchoChamberData(); // Should trigger high scores
    const calibrated = await analyzeContent(rawItems, 'twitter', {
      skipCalibration: false
    });
    const uncalibrated = await analyzeContent(rawItems, 'twitter', {
      skipCalibration: true
    });

    expect(calibrated.meta.calibrated).toBe(true);
    expect(uncalibrated.meta.calibrated).toBe(false);

    // Calibrated scores should be slightly pulled toward baseline
    expect(calibrated.metrics.echoChamber.value.score).toBeLessThanOrEqual(
      uncalibrated.metrics.echoChamber.value.score
    );
  });

  it('should handle validation errors gracefully', async () => {
    const emptyItems: any[] = [];

    await expect(
      analyzeContent(emptyItems, 'twitter')
    ).rejects.toThrow();
  });

  it('should accept valid platforms', async () => {
    const rawItems = generateMockTwitterData();
    const platforms = ['twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'reddit', 'linkedin'] as const;

    for (const platform of platforms) {
      const result = await analyzeContent(rawItems, platform);
      expect(result.meta.platform).toBe(platform);
    }
  });
});

describe('Quick Analyze', () => {
  it('should run quick analysis with defaults', async () => {
    const rawItems = generateMockTwitterData();
    const result = await quickAnalyze(rawItems, 'twitter');

    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.narrative).toBeDefined();
    expect(result.meta.seed).toBe(42); // Default seed
  });

  it('should complete faster than full analysis', async () => {
    const rawItems = generateMockTwitterData(50);

    const quickStart = Date.now();
    await quickAnalyze(rawItems, 'twitter');
    const quickTime = Date.now() - quickStart;

    const fullStart = Date.now();
    await analyzeContent(rawItems, 'twitter', {
      includeExamples: true,
      skipCalibration: false
    });
    const fullTime = Date.now() - fullStart;

    // Quick should be equal or faster
    expect(quickTime).toBeLessThanOrEqual(fullTime * 1.5);
  });
});

describe('Batch Analyze', () => {
  it('should analyze multiple platforms', async () => {
    const multiPlatformData = generateMultiPlatformData();

    const batch = [
      { items: multiPlatformData.get('twitter')!, platform: 'twitter' as const },
      { items: multiPlatformData.get('instagram')!, platform: 'instagram' as const }
    ];

    const results = await analyzeBatch(batch);

    expect(results.length).toBe(2);
    expect(results[0].meta.platform).toBe('twitter');
    expect(results[1].meta.platform).toBe('instagram');
  });

  it('should handle errors in batch gracefully', async () => {
    const batch = [
      { items: generateMockTwitterData(), platform: 'twitter' as const },
      { items: [], platform: 'instagram' as const } // Invalid
    ];

    await expect(analyzeBatch(batch)).rejects.toThrow();
  });

  it('should use same seed across batch', async () => {
    const multiPlatformData = generateMultiPlatformData();

    const batch = [
      { items: multiPlatformData.get('twitter')!, platform: 'twitter' as const },
      { items: multiPlatformData.get('instagram')!, platform: 'instagram' as const }
    ];

    const results = await analyzeBatch(batch, { seed: 999 });

    expect(results[0].meta.seed).toBe(999);
    expect(results[1].meta.seed).toBe(999);
  });
});

describe('Calibration', () => {
  it('should calibrate metrics to population baseline', () => {
    const rawItems = generateEchoChamberData();
    const mockMetrics: Partial<MetricBundle> = {
      echoChamber: {
        metric: 'echo_chamber',
        value: {
          score: 95, // Extremely high
          sourceConcentration: 1.0,
          topicConcentration: 0.95,
          authorConcentration: 1.0,
          diversityScore: 5
        },
        explanation: 'Test',
        topSignals: [],
        examples: [],
        confidence: 0.9,
        status: 'error'
      }
    };

    const calibrated = calibrateMetrics(mockMetrics as MetricBundle);

    // Should pull extreme score slightly toward baseline (55)
    expect(calibrated.echoChamber.value.score).toBeLessThan(95);
    expect(calibrated.echoChamber.value.score).toBeGreaterThan(85);
  });

  it('should not over-calibrate moderate scores', () => {
    const mockMetrics: Partial<MetricBundle> = {
      echoChamber: {
        metric: 'echo_chamber',
        value: {
          score: 55, // At baseline
          sourceConcentration: 0.5,
          topicConcentration: 0.5,
          authorConcentration: 0.5,
          diversityScore: 50
        },
        explanation: 'Test',
        topSignals: [],
        examples: [],
        confidence: 0.8,
        status: 'ok'
      }
    };

    const calibrated = calibrateMetrics(mockMetrics as MetricBundle);

    // Should barely change
    expect(Math.abs(calibrated.echoChamber.value.score - 55)).toBeLessThan(5);
  });

  it('should calibrate all metrics', () => {
    const rawItems = generateManipulativeData();
    const mockMetrics: Partial<MetricBundle> = {
      emotionTone: {
        metric: 'emotion_tone',
        value: {
          avgValence: -0.8,
          avgArousal: 0.9,
          dominantEmotion: 'anger',
          distribution: { anger: 0.7, fear: 0.3 },
          manipulationScore: 90
        },
        explanation: 'Test',
        topSignals: [],
        examples: [],
        confidence: 0.9,
        status: 'error'
      }
    };

    const calibrated = calibrateMetrics(mockMetrics as MetricBundle);

    expect(calibrated.emotionTone.value.manipulationScore).toBeLessThan(90);
  });
});

describe('Aggregation', () => {
  it('should calculate overall health score', async () => {
    const rawItems = generateHealthyData();
    const result = await analyzeContent(rawItems, 'twitter');

    const summary = result.summary;

    expect(summary.overallHealth).toBeGreaterThanOrEqual(0);
    expect(summary.overallHealth).toBeLessThanOrEqual(100);
    expect(summary.overallHealth).toBeGreaterThan(60); // Healthy data should score well
  });

  it('should detect critical issues', async () => {
    const rawItems = generateManipulativeData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.summary.criticalIssues.length).toBeGreaterThan(0);
  });

  it('should detect warnings', async () => {
    const rawItems = generateEchoChamberData();
    const result = await analyzeContent(rawItems, 'twitter');

    const hasWarningOrError =
      result.summary.warnings.length > 0 ||
      result.summary.criticalIssues.length > 0;

    expect(hasWarningOrError).toBe(true);
  });

  it('should calculate category scores', async () => {
    const rawItems = generateMockTwitterData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.summary.categoryScores.informationDiet).toBeGreaterThanOrEqual(0);
    expect(result.summary.categoryScores.informationDiet).toBeLessThanOrEqual(100);
    expect(result.summary.categoryScores.emotionalWellbeing).toBeGreaterThanOrEqual(0);
    expect(result.summary.categoryScores.commercialExposure).toBeGreaterThanOrEqual(0);
    expect(result.summary.categoryScores.sourceCredibility).toBeGreaterThanOrEqual(0);
  });

  it('should penalize health score for critical issues', async () => {
    const healthy = await analyzeContent(generateHealthyData(), 'twitter');
    const unhealthy = await analyzeContent(generateManipulativeData(), 'twitter');

    expect(healthy.summary.overallHealth).toBeGreaterThan(
      unhealthy.summary.overallHealth
    );
  });
});

describe('Narrative Generation', () => {
  it('should generate appropriate headline', async () => {
    const rawItems = generateHealthyData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.narrative.headline).toBeTruthy();
    expect(result.narrative.headline.length).toBeGreaterThan(10);
  });

  it('should generate critical headline for problems', async () => {
    const rawItems = generateManipulativeData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.narrative.headline).toContain('⚠️');
  });

  it('should generate positive headline for healthy feed', async () => {
    const rawItems = generateHealthyData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.narrative.headline).toContain('✅');
  });

  it('should include narrative sections', async () => {
    const rawItems = generateMockTwitterData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.narrative.sections.length).toBeGreaterThan(0);
    result.narrative.sections.forEach(section => {
      expect(section.title).toBeTruthy();
      expect(section.content).toBeTruthy();
      expect(['info', 'warning', 'critical']).toContain(section.severity);
    });
  });

  it('should prioritize critical issues in narrative', async () => {
    const rawItems = generateManipulativeData();
    const result = await analyzeContent(rawItems, 'twitter');

    const criticalSections = result.narrative.sections.filter(
      s => s.severity === 'critical'
    );

    expect(criticalSections.length).toBeGreaterThan(0);
  });

  it('should generate actionable conclusion', async () => {
    const rawItems = generateMockTwitterData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.narrative.conclusion).toBeTruthy();
    expect(result.narrative.conclusion.length).toBeGreaterThan(20);
  });

  it('should vary narrative based on feed health', async () => {
    const healthy = await analyzeContent(generateHealthyData(), 'twitter');
    const unhealthy = await analyzeContent(generateManipulativeData(), 'twitter');

    expect(healthy.narrative.headline).not.toBe(unhealthy.narrative.headline);
    expect(healthy.narrative.conclusion).not.toBe(unhealthy.narrative.conclusion);
  });
});

describe('End-to-End Pipeline', () => {
  it('should handle echo chamber scenario', async () => {
    const rawItems = generateEchoChamberData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.metrics.echoChamber.value.score).toBeGreaterThan(70);
    expect(result.metrics.topicDiversity.value.diversityScore).toBeLessThan(40);
    expect(result.summary.overallHealth).toBeLessThan(60);
    expect(result.narrative.headline).toContain('⚠️');
  });

  it('should handle manipulative content scenario', async () => {
    const rawItems = generateManipulativeData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.metrics.emotionTone.value.manipulationScore).toBeGreaterThan(60);
    expect(result.summary.criticalIssues.length).toBeGreaterThan(0);
    expect(result.summary.overallHealth).toBeLessThan(50);
  });

  it('should handle commercial content scenario', async () => {
    const rawItems = generateCommercialData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.metrics.productAffinity.value.adRatio).toBeGreaterThan(0.7);
    expect(result.metrics.adIntent.value.explicitAdRatio).toBeGreaterThan(0.5);
    expect(result.summary.categoryScores.commercialExposure).toBeLessThan(50);
  });

  it('should handle healthy feed scenario', async () => {
    const rawItems = generateHealthyData();
    const result = await analyzeContent(rawItems, 'twitter');

    expect(result.metrics.topicDiversity.value.diversityScore).toBeGreaterThan(60);
    expect(result.summary.overallHealth).toBeGreaterThan(65);
    expect(result.summary.criticalIssues.length).toBe(0);
  });

  it('should be fully deterministic', async () => {
    const rawItems = generateMockTwitterData();

    const result1 = await analyzeContent(rawItems, 'twitter', { seed: 42 });
    const result2 = await analyzeContent(rawItems, 'twitter', { seed: 42 });

    expect(result1.metrics).toEqual(result2.metrics);
    expect(result1.summary).toEqual(result2.summary);
    expect(result1.narrative).toEqual(result2.narrative);
  });

  it('should complete within reasonable time', async () => {
    const rawItems = generateMockTwitterData(100);

    const start = Date.now();
    await analyzeContent(rawItems, 'twitter');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
