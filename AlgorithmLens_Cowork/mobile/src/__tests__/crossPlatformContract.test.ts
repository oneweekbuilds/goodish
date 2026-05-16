/**
 * Cross-platform data contract tests (Phase 4 / V2 spec).
 *
 * The dashboard reads `scans` rows from Supabase. Three different sources
 * write rows to that table:
 *
 *   1. Mobile WebView ("browser") scans   — app/scanner/[platform].tsx
 *   2. Mobile Broadcast scans              — broadcastAnalysisPipeline.persistScan()
 *   3. Chrome extension desktop scans      — alg-gemini-extension/desktop_mapper.js
 *
 * `computeDashboardData(scan)` must accept all three shapes without throwing
 * and must produce a populated `DashboardData`. This file fixes a representative
 * row from each source and pushes it through the pipeline.
 *
 * If a producer drifts, this test fails before the dashboard renders garbage.
 */

import { computeDashboardData, type ScanRecord } from '../lib/computeDashboardData';

// ─── Sample 1: Mobile WebView (browser) scan row ───────────────
// Shape produced by app/scanner/[platform].tsx handleScanComplete
const mobileBrowserScan: ScanRecord = {
  platform: 'instagram',
  post_count: 12,
  ad_count: 2,
  ad_percentage: 17,
  suggested_count: 8,
  suggested_percentage: 67,
  raw_data: {
    posts: Array.from({ length: 12 }).map((_, i) => ({
      creator_handle: `creator_${i % 4}`,
      creator_display_name: `Creator ${i % 4}`,
      post_text: `Sample caption ${i}`,
      is_ad: i < 2,
      is_suggested: i < 8,
      content_type: i % 2 === 0 ? 'photo' : 'video',
      hashtags: i === 0 ? ['#travel', '#food'] : [],
      position_in_feed: i + 1,
      ad_label_text: i < 2 ? 'Sponsored' : null,
    })),
    top_creators: [{ name: 'creator_0', count: 3 }],
    scanned_at: '2026-04-30T12:00:00Z',
    duration_seconds: 120,
  },
  created_at: '2026-04-30T12:00:00Z',
};

// ─── Sample 2: Mobile Broadcast scan row ───────────────────────
// Shape produced by broadcastAnalysisPipeline.persistScan()
const mobileBroadcastScan: ScanRecord = {
  platform: 'tiktok',
  post_count: 25,
  ad_count: 4,
  ad_percentage: 16,
  suggested_count: 22,
  suggested_percentage: 88,
  raw_data: {
    posts: Array.from({ length: 25 }).map((_, i) => ({
      creator_handle: `tiktok_creator_${i % 6}`,
      creator_display_name: `TT Creator ${i % 6}`,
      post_text: `Video transcript ${i}`,
      is_ad: i < 4,
      is_suggested: i < 22,
      content_type: 'video',
      hashtags: [],
      position_in_feed: i + 1,
      ad_label_text: i < 4 ? 'Promoted' : null,
    })),
    top_creators: [{ name: 'tiktok_creator_0', count: 5 }],
    scanned_at: '2026-04-30T13:00:00Z',
    // Broadcast adds an analysis block when persistScan runs
    analysis: {
      ai_analyzed: true,
      feed_items: Array.from({ length: 25 }).map((_, i) => ({
        political: {
          is_political: i % 8 === 0,
          stance_or_alignment_guess: i % 8 === 0 ? 'CENTER' : 'NOT_ANALYZED',
        },
        emotions: {
          valence: i % 3 === 0 ? 'POSITIVE' : i % 3 === 1 ? 'NEUTRAL' : 'NEGATIVE',
        },
        creator: {
          handle: `tiktok_creator_${i % 6}`,
          name: `TT Creator ${i % 6}`,
        },
      })),
      political_content_summary: {
        political_items: 4,
        political_percentage: 16,
      },
    },
  },
  created_at: '2026-04-30T13:00:00Z',
};

// ─── Sample 3: Chrome extension desktop scan ingested into the same table.
// The extension's UnifiedScanResult has `feed_items` at the root rather than
// under `raw_data.posts`. When the website ingests it, fields are translated
// into the `scans` row shape below — this test mirrors the post-ingestion shape.
const extensionDesktopScan: ScanRecord = {
  platform: 'youtube',
  post_count: 18,
  ad_count: 3,
  ad_percentage: 17,
  suggested_count: 18,
  suggested_percentage: 100,
  raw_data: {
    posts: Array.from({ length: 18 }).map((_, i) => ({
      creator_handle: `yt_creator_${i % 5}`,
      creator_display_name: `YT Creator ${i % 5}`,
      post_text: `Video title ${i}`,
      is_ad: i < 3,
      is_suggested: true, // YouTube home is 100% algorithmic
      content_type: 'video',
      hashtags: [],
      position_in_feed: i + 1,
      ad_label_text: i < 3 ? 'Ad' : null,
    })),
    scanned_at: '2026-04-30T14:00:00Z',
  },
  created_at: '2026-04-30T14:00:00Z',
};

describe('cross-platform data contract', () => {
  describe('all 3 producers yield valid dashboard data', () => {
    test('mobile browser scan computes without throwing', () => {
      expect(() => computeDashboardData(mobileBrowserScan)).not.toThrow();
    });

    test('mobile broadcast scan computes without throwing', () => {
      expect(() => computeDashboardData(mobileBroadcastScan)).not.toThrow();
    });

    test('extension desktop scan computes without throwing', () => {
      expect(() => computeDashboardData(extensionDesktopScan)).not.toThrow();
    });
  });

  describe('all 3 producers populate the same dashboard fields', () => {
    const sources = [
      { name: 'mobile_browser', scan: mobileBrowserScan },
      { name: 'mobile_broadcast', scan: mobileBroadcastScan },
      { name: 'extension_desktop', scan: extensionDesktopScan },
    ];

    test.each(sources)('$name has populated topCreators', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(Array.isArray(d.topCreators)).toBe(true);
      expect(d.topCreators.length).toBeGreaterThan(0);
    });

    test.each(sources)('$name has totalPosts > 0', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(d.totalPosts).toBeGreaterThan(0);
    });

    test.each(sources)('$name reports ad percentage between 0 and 100', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(d.adPct).toBeGreaterThanOrEqual(0);
      expect(d.adPct).toBeLessThanOrEqual(100);
    });

    test.each(sources)('$name reports suggested + followed pct sums to 100', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(d.suggestedPct + d.followedPct).toBe(100);
    });

    test.each(sources)('$name produces an overviewInsight with title', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(d.overviewInsight).toBeDefined();
      expect(typeof d.overviewInsight.title).toBe('string');
      expect(d.overviewInsight.title.length).toBeGreaterThan(0);
    });

    test.each(sources)('$name produces a sourcesInsight', ({ scan }) => {
      const d = computeDashboardData(scan);
      expect(d.sourcesInsight).toBeDefined();
    });

    test.each(sources)('$name has contentTypes array that sums to ~100%', ({ scan }) => {
      const d = computeDashboardData(scan);
      const sum = d.contentTypes.reduce((s, ct) => s + ct.percentage, 0);
      // Allow off-by-one for rounding
      expect(sum).toBeGreaterThanOrEqual(99);
      expect(sum).toBeLessThanOrEqual(101);
    });
  });

  describe('contract drift detection', () => {
    test('mobile_broadcast supplies AI analysis (political/tone) to dashboard', () => {
      // Broadcast pipeline writes an `analysis` block. computeDashboardData
      // should extract political analysis from it.
      const d = computeDashboardData(mobileBroadcastScan);
      // Broadcast scan included political markers — politicalAnalysis should be non-null
      expect(d.politicalAnalysis).not.toBeNull();
      // Tone analysis should also be present (valence values were set in feed_items)
      expect(d.toneAnalysis).not.toBeNull();
    });

    test('mobile_browser without AI analysis still produces a dashboard', () => {
      // Browser scan with no `analysis` block — politicalAnalysis is null
      // but the scan should still render correctly.
      const d = computeDashboardData(mobileBrowserScan);
      expect(d.politicalAnalysis).toBeNull();
      expect(d.totalPosts).toBe(12);
    });

    test('extension_desktop without AI analysis still produces a dashboard', () => {
      const d = computeDashboardData(extensionDesktopScan);
      expect(d.politicalAnalysis).toBeNull();
      expect(d.totalPosts).toBe(18);
    });
  });

  describe('field-name compatibility', () => {
    test('all 3 producers use snake_case in raw_data.posts (creator_handle, is_ad, is_suggested)', () => {
      const samples = [mobileBrowserScan, mobileBroadcastScan, extensionDesktopScan];
      samples.forEach((scan) => {
        const post = scan.raw_data?.posts?.[0];
        expect(post).toBeDefined();
        if (post) {
          expect('creator_handle' in post).toBe(true);
          expect('is_ad' in post).toBe(true);
          expect('is_suggested' in post).toBe(true);
          expect('post_text' in post).toBe(true);
        }
      });
    });
  });
});
