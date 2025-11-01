// Comprehensive tests for all metric modules
import { describe, it, expect } from 'vitest';

// Import all metric calculators
import { calculateEchoChamber } from '../metrics/echoChamber';
import { calculatePoliticalLean } from '../metrics/politicalLean';
import { calculateEmotionTone } from '../metrics/emotionTone';
import { calculateProductAffinity } from '../metrics/productAffinity';
import { calculateTopicDiversity } from '../metrics/topicDiversity';
import { calculateSentimentBalance } from '../metrics/sentimentBalance';
import { calculateInfluenceBias } from '../metrics/influenceBias';
import { calculateAdIntent } from '../metrics/adIntent';
import { calculateMisinfoRisk } from '../metrics/misinfoRisk';
import { calculatePlatformContrast } from '../metrics/platformContrast';

// Import mock data generators
import {
  generateMockTwitterData,
  generateMockInstagramData,
  generatePoliticallyDiverseData,
  generateEchoChamberData,
  generateManipulativeData,
  generateCommercialData,
  generateHealthyData,
  generateMultiPlatformData
} from '../data/mockData';

// Import normalization and feature extraction
import { normalizeItems } from '../normalizers/platform';
import { extractFeatures } from '../features/extractor';

describe('Echo Chamber Metric', () => {
  it('should detect high echo chamber with same-source data', () => {
    const rawItems = generateEchoChamberData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEchoChamber(items, 42);

    expect(result.metric).toBe('echo_chamber');
    expect(result.value.score).toBeGreaterThan(70); // High echo chamber score
    expect(result.value.sourceConcentration).toBeGreaterThan(0.8); // Very concentrated
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.status).toBe('error'); // Critical issue
    expect(result.topSignals.length).toBeGreaterThan(0);
  });

  it('should detect low echo chamber with diverse data', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEchoChamber(items, 42);

    expect(result.value.score).toBeLessThan(40); // Low echo chamber
    expect(result.value.diversityScore).toBeGreaterThan(60);
    expect(result.status).toBe('ok');
  });

  it('should have lower confidence with small samples', () => {
    const rawItems = generateEchoChamberData().slice(0, 8);
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEchoChamber(items, 42);

    expect(result.confidence).toBeLessThan(0.7); // Lower confidence
    expect(result.topSignals.some(s => s.includes('small sample'))).toBe(true);
  });
});

describe('Political Lean Metric', () => {
  it('should detect balanced political content', () => {
    const rawItems = generatePoliticallyDiverseData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculatePoliticalLean(items, 42);

    expect(result.metric).toBe('political_lean');
    expect(Math.abs(result.value.leanScore)).toBeLessThan(30); // Close to center
    expect(result.value.distribution.center).toBeGreaterThan(0);
    expect(result.status).toBe('ok');
  });

  it('should have low confidence with non-political content', () => {
    const rawItems = generateMockInstagramData(); // Lifestyle content
    const normalized = normalizeItems(rawItems, 'instagram');
    const items = extractFeatures(normalized, 42);

    const result = calculatePoliticalLean(items, 42);

    expect(result.confidence).toBeLessThan(0.5); // Low confidence
    expect(result.topSignals.some(s => s.includes('non-political'))).toBe(true);
  });

  it('should include partisan terms in topSignals', () => {
    const rawItems = generatePoliticallyDiverseData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculatePoliticalLean(items, 42);

    expect(result.topSignals.length).toBeGreaterThan(0);
    expect(result.examples.length).toBeGreaterThan(0);
  });
});

describe('Emotion Tone Metric', () => {
  it('should detect high manipulation in outrage content', () => {
    const rawItems = generateManipulativeData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEmotionTone(items, 42);

    expect(result.metric).toBe('emotion_tone');
    expect(result.value.manipulationScore).toBeGreaterThan(60); // High manipulation
    expect(result.value.avgValence).toBeLessThan(0); // Negative valence
    expect(result.status).toBe('error'); // Critical issue
  });

  it('should detect balanced emotions in healthy content', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEmotionTone(items, 42);

    expect(result.value.manipulationScore).toBeLessThan(40);
    expect(result.status).toBe('ok');
  });

  it('should identify dominant emotion', () => {
    const rawItems = generateManipulativeData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateEmotionTone(items, 42);

    expect(result.value.dominantEmotion).toBeTruthy();
    expect(['anger', 'fear', 'sadness', 'disgust']).toContain(result.value.dominantEmotion);
  });
});

describe('Product Affinity Metric', () => {
  it('should detect heavy commercialization', () => {
    const rawItems = generateCommercialData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateProductAffinity(items, 42);

    expect(result.metric).toBe('product_affinity');
    expect(result.value.adRatio).toBeGreaterThan(0.8); // Most content is ads
    expect(result.value.targetingIntensity).toBeGreaterThan(60);
    expect(result.status).toBe('error');
  });

  it('should detect minimal commercialization in healthy feed', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateProductAffinity(items, 42);

    expect(result.value.adRatio).toBeLessThan(0.2);
    expect(result.value.targetingIntensity).toBeLessThan(30);
    expect(result.status).toBe('ok');
  });

  it('should identify consumer profile categories', () => {
    const rawItems = generateCommercialData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateProductAffinity(items, 42);

    expect(result.value.consumerProfile.length).toBeGreaterThan(0);
    expect(result.topSignals.length).toBeGreaterThan(0);
  });
});

describe('Topic Diversity Metric', () => {
  it('should detect low diversity in echo chamber', () => {
    const rawItems = generateEchoChamberData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateTopicDiversity(items, 42);

    expect(result.metric).toBe('topic_diversity');
    expect(result.value.diversityScore).toBeLessThan(40); // Low diversity
    expect(result.value.uniqueTopics).toBeLessThan(5);
    expect(result.status).toBe('error');
  });

  it('should detect high diversity in healthy feed', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateTopicDiversity(items, 42);

    expect(result.value.diversityScore).toBeGreaterThan(60);
    expect(result.value.uniqueTopics).toBeGreaterThan(8);
    expect(result.status).toBe('ok');
  });

  it('should calculate entropy correctly', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateTopicDiversity(items, 42);

    expect(result.value.entropy).toBeGreaterThan(0);
    expect(result.value.entropy).toBeLessThanOrEqual(result.value.uniqueTopics);
  });
});

describe('Sentiment Balance Metric', () => {
  it('should detect negative bias in manipulative content', () => {
    const rawItems = generateManipulativeData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateSentimentBalance(items, 42);

    expect(result.metric).toBe('sentiment_balance');
    expect(result.value.avgSentiment).toBeLessThan(-0.2); // Negative
    expect(result.value.negativityBias).toBeGreaterThan(50);
    expect(result.status).not.toBe('ok');
  });

  it('should detect balanced sentiment in healthy feed', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateSentimentBalance(items, 42);

    expect(result.value.avgSentiment).toBeGreaterThan(-0.3);
    expect(result.value.avgSentiment).toBeLessThan(0.3);
    expect(result.status).toBe('ok');
  });

  it('should report sentiment distribution', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateSentimentBalance(items, 42);

    expect(result.value.positiveRatio).toBeGreaterThanOrEqual(0);
    expect(result.value.negativeRatio).toBeGreaterThanOrEqual(0);
    expect(result.value.neutralRatio).toBeGreaterThanOrEqual(0);
    expect(
      result.value.positiveRatio + result.value.negativeRatio + result.value.neutralRatio
    ).toBeCloseTo(1, 1);
  });
});

describe('Influence Bias Metric', () => {
  it('should detect amplification of high-follower accounts', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateInfluenceBias(items, 42);

    expect(result.metric).toBe('influence_bias');
    expect(result.value.avgFollowers).toBeGreaterThan(0);
    expect(result.value.medianFollowers).toBeGreaterThan(0);
    expect(result.value.topAccountRatio).toBeGreaterThanOrEqual(0);
    expect(result.value.amplificationScore).toBeGreaterThanOrEqual(0);
  });

  it('should calculate follower inequality', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateInfluenceBias(items, 42);

    expect(result.value.avgFollowers).toBeDefined();
    expect(result.value.medianFollowers).toBeDefined();
  });

  it('should handle missing follower data gracefully', () => {
    const rawItems = generateHealthyData().map(item => ({
      ...item,
      user: { ...item.user, followers_count: undefined }
    }));
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateInfluenceBias(items, 42);

    expect(result.confidence).toBeLessThan(0.5);
    expect(result.topSignals.some(s => s.includes('insufficient'))).toBe(true);
  });
});

describe('Ad Intent Metric', () => {
  it('should detect undisclosed sponsorships', () => {
    const rawItems = generateCommercialData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateAdIntent(items, 42);

    expect(result.metric).toBe('ad_intent');
    expect(result.value.explicitAdRatio).toBeGreaterThan(0.5);
    expect(result.value.undisclosedSponsorshipScore).toBeGreaterThan(0);
  });

  it('should detect affiliate links', () => {
    const rawItems = generateCommercialData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateAdIntent(items, 42);

    expect(result.value.affiliateLinkRatio).toBeGreaterThan(0);
  });

  it('should be low for non-commercial content', () => {
    const rawItems = generateHealthyData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateAdIntent(items, 42);

    expect(result.value.explicitAdRatio).toBeLessThan(0.2);
    expect(result.value.undisclosedSponsorshipScore).toBeLessThan(30);
    expect(result.status).toBe('ok');
  });
});

describe('Misinfo Risk Metric', () => {
  it('should calculate risk score', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateMisinfoRisk(items, 42);

    expect(result.metric).toBe('misinfo_risk');
    expect(result.value.avgRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.value.avgRiskScore).toBeLessThanOrEqual(100);
    expect(result.value.highRiskRatio).toBeGreaterThanOrEqual(0);
    expect(result.value.highRiskRatio).toBeLessThanOrEqual(1);
  });

  it('should identify flagged sources', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateMisinfoRisk(items, 42);

    expect(result.value.flaggedSourcesCount).toBeGreaterThanOrEqual(0);
    expect(result.topSignals.length).toBeGreaterThan(0);
  });

  it('should have lower confidence with few external links', () => {
    const rawItems = generateHealthyData().map(item => ({
      ...item,
      entities: { ...item.entities, urls: [] }
    }));
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculateMisinfoRisk(items, 42);

    expect(result.confidence).toBeLessThan(0.6);
  });
});

describe('Platform Contrast Metric', () => {
  it('should compare multiple platforms', () => {
    const multiPlatformData = generateMultiPlatformData();
    const allItems: any[] = [];

    multiPlatformData.forEach((items, platform) => {
      const normalized = normalizeItems(items, platform);
      const extracted = extractFeatures(normalized, 42);
      allItems.push(...extracted);
    });

    const result = calculatePlatformContrast(allItems, 42);

    expect(result.metric).toBe('platform_contrast');
    expect(result.value.topicDivergence).toBeGreaterThanOrEqual(0);
    expect(result.value.sentimentDivergence).toBeGreaterThanOrEqual(0);
    expect(result.value.platformProfiles.length).toBeGreaterThan(0);
  });

  it('should detect when only one platform is present', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const result = calculatePlatformContrast(items, 42);

    expect(result.confidence).toBeLessThan(0.4);
    expect(result.topSignals.some(s => s.includes('single platform'))).toBe(true);
  });

  it('should identify platform characteristics', () => {
    const multiPlatformData = generateMultiPlatformData();
    const allItems: any[] = [];

    multiPlatformData.forEach((items, platform) => {
      const normalized = normalizeItems(items, platform);
      const extracted = extractFeatures(normalized, 42);
      allItems.push(...extracted);
    });

    const result = calculatePlatformContrast(allItems, 42);

    expect(result.value.platformProfiles.length).toBeGreaterThan(0);
    result.value.platformProfiles.forEach(profile => {
      expect(profile.platform).toBeTruthy();
      expect(profile.itemCount).toBeGreaterThan(0);
      expect(profile.topTopics).toBeDefined();
    });
  });
});

describe('All Metrics - General Properties', () => {
  it('all metrics should return consistent structure', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const metrics = [
      calculateEchoChamber(items, 42),
      calculatePoliticalLean(items, 42),
      calculateEmotionTone(items, 42),
      calculateProductAffinity(items, 42),
      calculateTopicDiversity(items, 42),
      calculateSentimentBalance(items, 42),
      calculateInfluenceBias(items, 42),
      calculateAdIntent(items, 42),
      calculateMisinfoRisk(items, 42),
      calculatePlatformContrast(items, 42)
    ];

    metrics.forEach(metric => {
      expect(metric.metric).toBeTruthy();
      expect(metric.value).toBeDefined();
      expect(metric.explanation).toBeTruthy();
      expect(metric.topSignals).toBeInstanceOf(Array);
      expect(metric.examples).toBeInstanceOf(Array);
      expect(metric.confidence).toBeGreaterThanOrEqual(0);
      expect(metric.confidence).toBeLessThanOrEqual(1);
      expect(['ok', 'warning', 'error']).toContain(metric.status);
    });
  });

  it('all metrics should be deterministic with same seed', () => {
    const rawItems = generateMockTwitterData();
    const normalized = normalizeItems(rawItems, 'twitter');
    const items1 = extractFeatures(normalized, 42);
    const items2 = extractFeatures(normalized, 42);

    const result1 = calculateEchoChamber(items1, 42);
    const result2 = calculateEchoChamber(items2, 42);

    expect(result1.value).toEqual(result2.value);
    expect(result1.confidence).toBe(result2.confidence);
  });

  it('all metrics should handle minimum sample sizes', () => {
    const rawItems = generateMockTwitterData(5); // Very small sample
    const normalized = normalizeItems(rawItems, 'twitter');
    const items = extractFeatures(normalized, 42);

    const metrics = [
      calculateEchoChamber(items, 42),
      calculatePoliticalLean(items, 42),
      calculateEmotionTone(items, 42),
      calculateProductAffinity(items, 42),
      calculateTopicDiversity(items, 42),
      calculateSentimentBalance(items, 42),
      calculateInfluenceBias(items, 42),
      calculateAdIntent(items, 42),
      calculateMisinfoRisk(items, 42),
      calculatePlatformContrast(items, 42)
    ];

    metrics.forEach(metric => {
      expect(metric.confidence).toBeLessThan(0.8); // Lower confidence with small samples
    });
  });
});
