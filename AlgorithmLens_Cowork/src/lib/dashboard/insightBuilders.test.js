/**
 * Tests for insightBuilders.js — hero insight generation for all 6 dashboard tabs.
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

// ─── helpers ──────────────────────────────────────────────
function heroShape(result) {
  expect(result).toHaveProperty('title');
  expect(result).toHaveProperty('meaning');
  expect(result).toHaveProperty('whyCare');
  expect(result).toHaveProperty('meta');
  expect(typeof result.title).toBe('string');
  expect(typeof result.meaning).toBe('string');
}

// ─── buildOverviewHero ────────────────────────────────────
describe('buildOverviewHero', () => {
  test('returns no-data message when hasData is false', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: false }, totalPosts: 0, platformCount: 1 });
    heroShape(r);
    expect(r.title).toContain('Not enough data');
    expect(r.whyCare).toBeNull();
    expect(r.meta).toBeNull();
  });

  test('meta shows post count for single platform', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: true, top5Percent: 50 }, totalPosts: 25, platformCount: 1 });
    expect(r.meta).toBe('Based on 25 posts');
  });

  test('meta shows post count across multiple platforms', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: true, top5Percent: 50 }, totalPosts: 100, platformCount: 3 });
    expect(r.meta).toBe('Based on 100 posts across 3 platforms');
  });

  test('high concentration (>=60) returns warning insight', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: true, top5Percent: 70 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('70%');
    expect(r.title).toContain('5 accounts');
    expect(r.whyCare.toLowerCase()).toContain('above the typical');
  });

  test('moderate concentration (40-59) returns balanced insight', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: true, top5Percent: 50 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('50%');
    expect(r.whyCare.toLowerCase()).toContain('typical range');
  });

  test('low concentration (<40) returns diverse insight', () => {
    const r = buildOverviewHero({ sourceConcentration: { hasData: true, top5Percent: 30 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('many voices');
    expect(r.whyCare.toLowerCase()).toContain('below the typical');
  });
});

// ─── buildSourcesHero ─────────────────────────────────────
describe('buildSourcesHero', () => {
  test('returns no-data message when hasData is false', () => {
    const r = buildSourcesHero({ top5Percent: 0, totalPosts: 0, platformCount: 1, hasData: false });
    heroShape(r);
    expect(r.title).toContain('Not enough data');
  });

  test('very high (>=75) returns dominant-source warning', () => {
    const r = buildSourcesHero({ top5Percent: 80, totalPosts: 50, platformCount: 1, hasData: true });
    expect(r.title).toContain('80%');
    expect(r.whyCare.toLowerCase()).toContain('well above typical');
  });

  test('high (60-74) returns recurring voices insight', () => {
    const r = buildSourcesHero({ top5Percent: 65, totalPosts: 50, platformCount: 1, hasData: true });
    expect(r.title).toContain('recurring voices');
  });

  test('moderate (40-59) returns balanced insight', () => {
    const r = buildSourcesHero({ top5Percent: 45, totalPosts: 50, platformCount: 1, hasData: true });
    expect(r.title).toContain('balances familiar and new');
  });

  test('low (<40) returns wide range insight', () => {
    const r = buildSourcesHero({ top5Percent: 25, totalPosts: 50, platformCount: 1, hasData: true });
    expect(r.title).toContain('wide range');
  });
});

// ─── buildAdsHero ─────────────────────────────────────────
describe('buildAdsHero', () => {
  const noDataComp = { hasData: false, segments: [] };

  test('returns no-data message when hasData is false', () => {
    const r = buildAdsHero({ commercialComposition: noDataComp, totalPosts: 0, platformCount: 1 });
    heroShape(r);
    expect(r.title).toContain('Not enough data');
  });

  test('high unlabeled promos (>=10) triggers promos warning', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Labeled ads', percentage: 15 },
        { label: 'Unlabeled promos', percentage: 12 },
        { label: 'Not commercial', percentage: 73 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 100, platformCount: 1 });
    expect(r.title).toContain("12%");
    expect(r.title).toContain("isn't labeled");
  });

  test('high total commercial (>=40) triggers heavy-ads warning', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Labeled ads', percentage: 35 },
        { label: 'Unlabeled promos', percentage: 8 },
        { label: 'Not commercial', percentage: 57 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 100, platformCount: 1 });
    expect(r.title).toContain('43%');
    expect(r.whyCare.toLowerCase()).toContain('above the typical range');
  });

  test('moderate commercial (25-39) returns 1-in-4 insight', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Labeled ads', percentage: 20 },
        { label: 'Unlabeled promos', percentage: 8 },
        { label: 'Not commercial', percentage: 72 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 100, platformCount: 1 });
    expect(r.title).toContain('1 in 4');
  });

  test('low-moderate commercial (10-24) returns typical insight', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Labeled ads', percentage: 12 },
        { label: 'Unlabeled promos', percentage: 3 },
        { label: 'Not commercial', percentage: 85 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 100, platformCount: 1 });
    expect(r.title).toContain('15%');
    expect(r.whyCare.toLowerCase()).toContain('typical range');
  });

  test('minimal commercial (<10) returns minimal insight', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Labeled ads', percentage: 3 },
        { label: 'Unlabeled promos', percentage: 2 },
        { label: 'Not commercial', percentage: 95 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 100, platformCount: 1 });
    expect(r.title).toContain('minimal');
  });

  test('handles fallback labels during transition', () => {
    const comp = {
      hasData: true,
      segments: [
        { label: 'Ads clearly labeled as ads', percentage: 20 },
        { label: 'Likely selling, not labeled as an ad', percentage: 5 },
        { label: 'Not commercial', percentage: 75 },
      ],
    };
    const r = buildAdsHero({ commercialComposition: comp, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('25%');
  });
});

// ─── buildPoliticsHero ────────────────────────────────────
describe('buildPoliticsHero', () => {
  test('returns no-data message when hasData is false', () => {
    const r = buildPoliticsHero({ politicalShare: { hasData: false }, totalPosts: 0, platformCount: 1 });
    heroShape(r);
    expect(r.title).toContain('minimal or absent');
  });

  test('high political (>=25) returns prominent warning', () => {
    const r = buildPoliticsHero({ politicalShare: { hasData: true, politicalPercent: 30 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('30%');
    expect(r.whyCare.toLowerCase()).toContain('above the typical range');
  });

  test('moderate political (10-24) returns typical insight', () => {
    const r = buildPoliticsHero({ politicalShare: { hasData: true, politicalPercent: 15 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('15%');
    expect(r.whyCare.toLowerCase()).toContain('typical range');
  });

  test('low political (<10) returns small-slice insight', () => {
    const r = buildPoliticsHero({ politicalShare: { hasData: true, politicalPercent: 5 }, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('small slice');
    expect(r.whyCare.toLowerCase()).toContain('below the typical range');
  });
});

// ─── buildToneHero ────────────────────────────────────────
describe('buildToneHero', () => {
  const makeTone = (pos, neut, neg) => ({
    hasData: true,
    segments: [
      { label: 'Positive', percentage: pos },
      { label: 'Neutral', percentage: neut },
      { label: 'Negative', percentage: neg },
    ],
  });

  test('returns no-data message when hasData is false', () => {
    const r = buildToneHero({ toneDistribution: { hasData: false, segments: [] }, totalPosts: 0, platformCount: 1 });
    heroShape(r);
    expect(r.title).toContain('Not enough data');
  });

  test('balanced spread (<15 difference) returns balanced insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(35, 33, 32), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('balanced');
  });

  test('high negative (>=35 and max) returns negativity warning', () => {
    const r = buildToneHero({ toneDistribution: makeTone(20, 25, 55), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('55%');
    expect(r.title).toContain('negative');
  });

  test('high positive (>=35 and max) returns positivity insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(55, 25, 20), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('positive');
    expect(r.title).toContain('55%');
  });

  test('high neutral (>=35 and max) returns informational insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(20, 55, 25), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('informational');
    expect(r.title).toContain('55%');
  });

  test('fallback when neg is max but <35 returns neg-leads insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(15, 20, 34), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('Negative tone appears most often');
  });

  test('fallback when pos is max but <35 returns pos-leads insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(34, 15, 20), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('Positive tone leads');
  });

  test('fallback when neut is max but <35 returns neutral-leads insight', () => {
    const r = buildToneHero({ toneDistribution: makeTone(15, 34, 20), totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('Neutral tone leads');
  });

  test('handles alternative label format', () => {
    const tone = {
      hasData: true,
      segments: [
        { label: 'Positive or happy tone', percentage: 50 },
        { label: 'Neutral or balanced tone', percentage: 30 },
        { label: 'Negative or conflict-focused tone', percentage: 20 },
      ],
    };
    const r = buildToneHero({ toneDistribution: tone, totalPosts: 50, platformCount: 1 });
    expect(r.title).toContain('positive');
  });
});

// ─── buildSuggestedVsFollowedHero ─────────────────────────
describe('buildSuggestedVsFollowedHero', () => {
  const base = {
    toneBySourceOrigin: { hasData: false },
    totalPosts: 50,
    platformCount: 1,
    creatorFamiliarity: { hasData: false },
    adComparison: { hasData: false },
  };

  test('returns no-data message when hasData is false', () => {
    const r = buildSuggestedVsFollowedHero({ ...base, sourceData: { hasData: false } });
    heroShape(r);
    expect(r.title).toContain('Not enough data');
  });

  test('high suggested (>=60) returns majority-suggested warning', () => {
    const r = buildSuggestedVsFollowedHero({ ...base, sourceData: { hasData: true, suggestedPercentage: 70 } });
    expect(r.title).toContain('70%');
    expect(r.meaning.toLowerCase()).toContain('suggested');
  });

  test('moderate suggested (40-59) returns balanced insight', () => {
    const r = buildSuggestedVsFollowedHero({ ...base, sourceData: { hasData: true, suggestedPercentage: 45 } });
    expect(r.title).toContain('45%');
  });

  test('low suggested (<40) returns user-in-control insight', () => {
    const r = buildSuggestedVsFollowedHero({ ...base, sourceData: { hasData: true, suggestedPercentage: 25 } });
    expect(r.title).toContain('You control most');
    expect(r.title).toContain('75%');
  });

  test('includes tone difference when neg diff >=8', () => {
    const toneData = {
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
    };
    const r = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      toneBySourceOrigin: toneData,
    });
    expect(r.whyCare).toContain('more negative');
  });

  test('includes creator familiarity when noveltyPercent >= 50', () => {
    const r = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      creatorFamiliarity: { hasData: true, noveltyPercent: 75 },
    });
    expect(r.whyCare).toContain('75%');
    expect(r.whyCare).toContain("don't follow");
  });

  test('includes ad comparison when adDelta >= 5', () => {
    const r = buildSuggestedVsFollowedHero({
      ...base,
      sourceData: { hasData: true, suggestedPercentage: 60 },
      adComparison: { hasData: true, adDelta: 10 },
    });
    expect(r.whyCare).toContain('more commercial');
  });
});
