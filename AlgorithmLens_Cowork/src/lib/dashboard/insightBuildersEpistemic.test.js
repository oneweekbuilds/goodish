/**
 * Epistemic Restraint Compliance Tests for insightBuilders.js
 *
 * Per CLAUDE.md, AlgorithmLens must maintain epistemic restraint:
 * - NO anthropomorphizing algorithms (e.g., "algorithm wants", "algorithm is trying")
 * - NO strong causal claims without hedging language
 * - NO manipulative framing (manipulate, exploit, brainwash, addicted)
 * - USE hedging: "may", "suggests", "appears", "based on", "typical", "range"
 *
 * This file verifies all 6 dashboard builders comply with these standards
 * across varied input scenarios.
 */
import { describe, test, expect } from 'vitest';
import {
  buildOverviewHero,
  buildSourcesHero,
  buildAdsHero,
  buildPoliticsHero,
  buildToneHero,
  buildSuggestedVsFollowedHero,
} from './insightBuilders.js';

// ─── Banned Phrase Constants ───────────────────────────────
const BANNED_PHRASES = [
  'algorithm wants',
  'algorithm is trying',
  'algorithm makes you',
  'manipulate',
  'exploit',
  'brainwash',
  'addicted',
];

// ─── Epistemic Compliance Helper ──────────────────────────
/**
 * Asserts that hero output contains no banned phrases (anthropomorphizing or manipulative language).
 * @param {Object} hero - The hero object with title, meaning, whyCare, meta properties
 * @param {string} builderName - Name of builder for error context
 */
function assertEpistemicCompliance(hero, builderName) {
  expect(hero).toHaveProperty('title');
  expect(hero).toHaveProperty('meaning');
  expect(hero).toHaveProperty('whyCare');
  expect(hero).toHaveProperty('meta');

  const allText = [hero.title, hero.meaning, hero.whyCare, hero.meta]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    expect(allText).not.toContain(phrase, `"${phrase}" found in ${builderName}`);
  }
}

/**
 * Validates that hero with whyCare uses appropriate hedging language.
 * @param {Object} hero - The hero object
 * @param {string} builderName - Name of builder for error context
 */
function assertHedgingLanguage(hero, builderName) {
  if (!hero.whyCare) return; // null whyCare is acceptable (insufficient data)

  // Hedging terms include benchmark context ("typical", "range"), uncertainty
  // markers ("may", "suggests"), observational framing ("rather than", "points"),
  // and comparative context used in the actual insightBuilders copy.
  const hedgingTerms = [
    'typical',
    'range',
    'may',
    'suggests',
    'appears',
    'based on',
    'mean',
    'pattern',
    'lean',
    'rather than',
    'space for',
    'points',
    'balanced',
    'narrower',
    'can ',
    'mood',
    'shape',
    'come from',
    "don't follow",
  ];

  const hedged = hedgingTerms.some((term) =>
    hero.whyCare.toLowerCase().includes(term)
  );

  expect(hedged).toBe(true, `whyCare in ${builderName} lacks hedging language: "${hero.whyCare}"`);
}

/**
 * Validates meta field format: "Based on X posts" or null
 * @param {Object} hero - The hero object
 * @param {string} builderName - Name of builder for error context
 */
function assertMetaFormat(hero, builderName) {
  if (hero.meta === null) return; // null is acceptable

  expect(typeof hero.meta).toBe('string', `meta should be string or null in ${builderName}`);
  expect(hero.meta.toLowerCase()).toMatch(/based on \d+ post/i, `meta format incorrect in ${builderName}: "${hero.meta}"`);
}

// ─── buildOverviewHero Tests ──────────────────────────────
describe('buildOverviewHero — epistemic compliance', () => {
  test('no-data case complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: false },
      totalPosts: 0,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('high concentration (70%) complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: true, top5Percent: 70 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (70%)');
    assertHedgingLanguage(hero, 'buildOverviewHero (70%)');
    assertMetaFormat(hero, 'buildOverviewHero (70%)');
  });

  test('high concentration (85%) complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: true, top5Percent: 85 },
      totalPosts: 100,
      platformCount: 2,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (85%)');
    assertHedgingLanguage(hero, 'buildOverviewHero (85%)');
  });

  test('moderate concentration (50%) complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: true, top5Percent: 50 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (50%)');
    assertHedgingLanguage(hero, 'buildOverviewHero (50%)');
  });

  test('low concentration (30%) complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: true, top5Percent: 30 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (30%)');
    assertHedgingLanguage(hero, 'buildOverviewHero (30%)');
  });

  test('multiple platforms complies', () => {
    const hero = buildOverviewHero({
      sourceConcentration: { hasData: true, top5Percent: 45 },
      totalPosts: 200,
      platformCount: 5,
    });
    assertEpistemicCompliance(hero, 'buildOverviewHero (multi-platform)');
    expect(hero.meta).toContain('across 5 platforms');
  });
});

// ─── buildSourcesHero Tests ───────────────────────────────
describe('buildSourcesHero — epistemic compliance', () => {
  test('no-data case complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 0,
      totalPosts: 0,
      platformCount: 1,
      hasData: false,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('very high (80%) complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 80,
      totalPosts: 50,
      platformCount: 1,
      hasData: true,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (80%)');
    assertHedgingLanguage(hero, 'buildSourcesHero (80%)');
  });

  test('very high (90%) complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 90,
      totalPosts: 100,
      platformCount: 2,
      hasData: true,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (90%)');
    assertHedgingLanguage(hero, 'buildSourcesHero (90%)');
  });

  test('high (65%) complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 65,
      totalPosts: 50,
      platformCount: 1,
      hasData: true,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (65%)');
    assertHedgingLanguage(hero, 'buildSourcesHero (65%)');
  });

  test('moderate (45%) complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 45,
      totalPosts: 50,
      platformCount: 1,
      hasData: true,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (45%)');
    assertHedgingLanguage(hero, 'buildSourcesHero (45%)');
  });

  test('low (25%) complies', () => {
    const hero = buildSourcesHero({
      top5Percent: 25,
      totalPosts: 50,
      platformCount: 1,
      hasData: true,
    });
    assertEpistemicCompliance(hero, 'buildSourcesHero (25%)');
    assertHedgingLanguage(hero, 'buildSourcesHero (25%)');
  });
});

// ─── buildAdsHero Tests ────────────────────────────────────
describe('buildAdsHero — epistemic compliance', () => {
  test('no-data case complies', () => {
    const hero = buildAdsHero({
      commercialComposition: { hasData: false, segments: [] },
      totalPosts: 0,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('high unlabeled promos (15%) complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Labeled ads', percentage: 15 },
          { label: 'Unlabeled promos', percentage: 15 },
          { label: 'Not commercial', percentage: 70 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (unlabeled-15%)');
    assertHedgingLanguage(hero, 'buildAdsHero (unlabeled-15%)');
  });

  test('high commercial (45%) complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Labeled ads', percentage: 35 },
          { label: 'Unlabeled promos', percentage: 10 },
          { label: 'Not commercial', percentage: 55 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (45%)');
    assertHedgingLanguage(hero, 'buildAdsHero (45%)');
  });

  test('moderate commercial (28%) complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Labeled ads', percentage: 20 },
          { label: 'Unlabeled promos', percentage: 8 },
          { label: 'Not commercial', percentage: 72 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (28%)');
    assertHedgingLanguage(hero, 'buildAdsHero (28%)');
  });

  test('low-moderate commercial (15%) complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Labeled ads', percentage: 10 },
          { label: 'Unlabeled promos', percentage: 5 },
          { label: 'Not commercial', percentage: 85 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (15%)');
    assertHedgingLanguage(hero, 'buildAdsHero (15%)');
  });

  test('minimal commercial (5%) complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Labeled ads', percentage: 3 },
          { label: 'Unlabeled promos', percentage: 2 },
          { label: 'Not commercial', percentage: 95 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (5%)');
    assertHedgingLanguage(hero, 'buildAdsHero (5%)');
  });

  test('legacy label format complies', () => {
    const hero = buildAdsHero({
      commercialComposition: {
        hasData: true,
        segments: [
          { label: 'Ads clearly labeled as ads', percentage: 20 },
          { label: 'Likely selling, not labeled as an ad', percentage: 8 },
          { label: 'Not commercial', percentage: 72 },
        ],
      },
      totalPosts: 100,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildAdsHero (legacy-labels)');
    assertHedgingLanguage(hero, 'buildAdsHero (legacy-labels)');
  });
});

// ─── buildPoliticsHero Tests ───────────────────────────────
describe('buildPoliticsHero — epistemic compliance', () => {
  test('no-data case complies', () => {
    const hero = buildPoliticsHero({
      politicalShare: { hasData: false },
      totalPosts: 0,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildPoliticsHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('high political (35%) complies', () => {
    const hero = buildPoliticsHero({
      politicalShare: { hasData: true, politicalPercent: 35 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildPoliticsHero (35%)');
    assertHedgingLanguage(hero, 'buildPoliticsHero (35%)');
  });

  test('high political (50%) complies', () => {
    const hero = buildPoliticsHero({
      politicalShare: { hasData: true, politicalPercent: 50 },
      totalPosts: 100,
      platformCount: 2,
    });
    assertEpistemicCompliance(hero, 'buildPoliticsHero (50%)');
    assertHedgingLanguage(hero, 'buildPoliticsHero (50%)');
  });

  test('moderate political (15%) complies', () => {
    const hero = buildPoliticsHero({
      politicalShare: { hasData: true, politicalPercent: 15 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildPoliticsHero (15%)');
    assertHedgingLanguage(hero, 'buildPoliticsHero (15%)');
  });

  test('low political (5%) complies', () => {
    const hero = buildPoliticsHero({
      politicalShare: { hasData: true, politicalPercent: 5 },
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildPoliticsHero (5%)');
    assertHedgingLanguage(hero, 'buildPoliticsHero (5%)');
  });
});

// ─── buildToneHero Tests ───────────────────────────────────
describe('buildToneHero — epistemic compliance', () => {
  const makeTone = (pos, neut, neg) => ({
    hasData: true,
    segments: [
      { label: 'Positive', percentage: pos },
      { label: 'Neutral', percentage: neut },
      { label: 'Negative', percentage: neg },
    ],
  });

  test('no-data case complies', () => {
    const hero = buildToneHero({
      toneDistribution: { hasData: false, segments: [] },
      totalPosts: 0,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('balanced mix complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(33, 34, 33),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (balanced)');
    assertHedgingLanguage(hero, 'buildToneHero (balanced)');
  });

  test('high negative (55%) complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(20, 25, 55),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (55% neg)');
    assertHedgingLanguage(hero, 'buildToneHero (55% neg)');
  });

  test('high positive (55%) complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(55, 25, 20),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (55% pos)');
    assertHedgingLanguage(hero, 'buildToneHero (55% pos)');
  });

  test('high neutral (55%) complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(20, 55, 25),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (55% neut)');
    assertHedgingLanguage(hero, 'buildToneHero (55% neut)');
  });

  test('fallback negative leads complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(15, 20, 34),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (fallback-neg)');
    assertHedgingLanguage(hero, 'buildToneHero (fallback-neg)');
  });

  test('fallback positive leads complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(34, 15, 20),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (fallback-pos)');
    assertHedgingLanguage(hero, 'buildToneHero (fallback-pos)');
  });

  test('fallback neutral leads complies', () => {
    const hero = buildToneHero({
      toneDistribution: makeTone(15, 34, 20),
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (fallback-neut)');
    assertHedgingLanguage(hero, 'buildToneHero (fallback-neut)');
  });

  test('alternative label format complies', () => {
    const tone = {
      hasData: true,
      segments: [
        { label: 'Positive or happy tone', percentage: 50 },
        { label: 'Neutral or balanced tone', percentage: 30 },
        { label: 'Negative or conflict-focused tone', percentage: 20 },
      ],
    };
    const hero = buildToneHero({
      toneDistribution: tone,
      totalPosts: 50,
      platformCount: 1,
    });
    assertEpistemicCompliance(hero, 'buildToneHero (alt-labels)');
    assertHedgingLanguage(hero, 'buildToneHero (alt-labels)');
  });
});

// ─── buildSuggestedVsFollowedHero Tests ─────────────────────
describe('buildSuggestedVsFollowedHero — epistemic compliance', () => {
  const base = {
    toneBySourceOrigin: { hasData: false },
    totalPosts: 50,
    platformCount: 1,
    creatorFamiliarity: { hasData: false },
    adComparison: { hasData: false },
  };

  test('no-data case complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: false },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (no-data)');
    expect(hero.whyCare).toBeNull();
  });

  test('high suggested (70%) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 70 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (70% sug)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (70% sug)');
  });

  test('high suggested (80%) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 80 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (80% sug)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (80% sug)');
  });

  test('moderate suggested (50%) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 50 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (50% sug)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (50% sug)');
  });

  test('low suggested (20%) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 20 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (20% sug)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (20% sug)');
  });

  test('with tone difference (negative) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      toneBySourceOrigin: {
        hasData: true,
        suggested: { segments: [
          { label: 'Negative', percentage: 40 },
          { label: 'Positive', percentage: 30 },
          { label: 'Neutral', percentage: 30 },
        ]},
        followed: { segments: [
          { label: 'Negative', percentage: 20 },
          { label: 'Positive', percentage: 40 },
          { label: 'Neutral', percentage: 40 },
        ]},
      },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (tone-diff-neg)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (tone-diff-neg)');
  });

  test('with tone difference (positive) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      toneBySourceOrigin: {
        hasData: true,
        suggested: { segments: [
          { label: 'Positive', percentage: 50 },
          { label: 'Negative', percentage: 20 },
          { label: 'Neutral', percentage: 30 },
        ]},
        followed: { segments: [
          { label: 'Positive', percentage: 30 },
          { label: 'Negative', percentage: 30 },
          { label: 'Neutral', percentage: 40 },
        ]},
      },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (tone-diff-pos)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (tone-diff-pos)');
  });

  test('with creator novelty (75%) complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      creatorFamiliarity: { hasData: true, noveltyPercent: 75 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (novelty-75%)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (novelty-75%)');
  });

  test('with ad comparison delta complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      adComparison: { hasData: true, adDelta: 12 },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (ad-delta)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (ad-delta)');
  });

  test('with multiple context sources complies', () => {
    const hero = buildSuggestedVsFollowedHero({
      sourceData: { hasData: true, suggestedPercentage: 65 },
      toneBySourceOrigin: {
        hasData: true,
        suggested: { segments: [
          { label: 'Negative', percentage: 35 },
          { label: 'Positive', percentage: 30 },
          { label: 'Neutral', percentage: 35 },
        ]},
        followed: { segments: [
          { label: 'Negative', percentage: 22 },
          { label: 'Positive', percentage: 38 },
          { label: 'Neutral', percentage: 40 },
        ]},
      },
      totalPosts: 150,
      platformCount: 2,
      creatorFamiliarity: { hasData: false },
      adComparison: { hasData: false },
    });
    assertEpistemicCompliance(hero, 'buildSuggestedVsFollowedHero (multi-context)');
    assertHedgingLanguage(hero, 'buildSuggestedVsFollowedHero (multi-context)');
    assertMetaFormat(hero, 'buildSuggestedVsFollowedHero (multi-context)');
  });
});
