/**
 * Unit tests for unifiedResultToScanDetail (Phase 4.4.2 of the 2.x
 * interpretation engine MVP).
 *
 * The adapter is a thin wrapper over buildScanRow that pins
 * timestamps to result.scan_metadata.created_at and re-types the
 * result as ScanDetail. The tests verify exactly that contract:
 *
 *   - all required ScanDetail top-level fields are populated
 *   - raw_data shape matches what buildScanRow produces
 *   - timestamps are pinned (not "now")
 *   - scan_id is undefined (matches Supabase shape — see adapter
 *     JSDoc for why)
 *
 * buildScanRow's own correctness is the pipeline's concern (verified
 * indirectly by broadcastAnalysisPipeline.test.ts on the persistScan
 * path). These tests assert the adapter's wiring, not the transform.
 */

import type { UnifiedScanResult, FeedItem } from '../../../../types';
import { buildScanRow } from '../../../scanShape/buildScanRow';
import { unifiedResultToScanDetail } from '../unifiedResultToScanDetail';

// ============================================
// Fixture helpers
// ============================================

function makeFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    position_in_feed: 1,
    content_type: 'VIDEO',
    is_ad: false,
    account: {
      account_handle: '@creator',
      account_display_name: 'Creator',
    },
    content_text: {
      captions: 'caption',
      hashtags: ['#tag'],
    },
    topics: {
      primary_category: 'TECH',
    },
    political: {
      is_political: false,
    },
    emotions: {
      valence: 'NEUTRAL',
    },
    source_origin: 'followed',
    ...overrides,
  };
}

function makeUnifiedResult(
  overrides: Partial<UnifiedScanResult> = {},
): UnifiedScanResult {
  return {
    schema_version: '1.0.0',
    scan_metadata: {
      scan_id: 'scan-fixture-id',
      created_at: '2026-05-15T10:00:00.000Z',
      source_type: 'MOBILE_BROADCAST',
      platform: 'youtube',
    },
    environment: {
      device_type: 'MOBILE',
      broadcast_capture: {
        is_broadcast_based: true,
        broadcast_method: 'REPLAYKIT',
        frames_captured: 30,
        frames_unique: 25,
        duration_seconds: 60,
        average_frame_interval_seconds: 2,
        on_device_ocr_used: false,
      },
    },
    feed_items: [
      makeFeedItem({ position_in_feed: 1 }),
      makeFeedItem({ position_in_feed: 2, is_ad: true }),
      makeFeedItem({ position_in_feed: 3, source_origin: 'suggested' }),
    ],
    aggregates: {
      total_feed_items: 3,
      total_ads: 1,
      ad_percentage: 33,
      political_content_summary: {
        political_items: 0,
        political_percentage: 0,
      },
    },
    privacy: {
      user_identifiers_stored: false,
      profile_photos_stored: false,
      raw_text_stored: false,
      retention_policy_key: 'default',
      redacted_fields: [],
    },
    debug: {
      processing_time_seconds: 5,
      errors: [],
      warnings: [],
    },
    ...overrides,
  };
}

const DEFAULT_OPTS = {
  scanId: 'scan-fixture-id',
  userId: 'user-fixture-id',
  platform: 'YouTube',
};

// ============================================
// Tests
// ============================================

describe('unifiedResultToScanDetail', () => {
  describe('top-level fields', () => {
    test('returns a ScanDetail with all required top-level fields populated', () => {
      const result = makeUnifiedResult();
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);

      expect(scan.id).toBe(DEFAULT_OPTS.scanId);
      expect(scan.user_id).toBe(DEFAULT_OPTS.userId);
      // buildScanRow lowercases platform — this is the persisted shape.
      expect(scan.platform).toBe('youtube');
      expect(scan.post_count).toBe(3);
      expect(scan.ad_count).toBe(1);
      expect(scan.ad_percentage).toBe(33);
      expect(scan.suggested_count).toBe(1);
      expect(scan.suggested_percentage).toBe(33);
      expect(typeof scan.created_at).toBe('string');
      expect(scan.raw_data).toBeDefined();
    });

    test('platform input is lowercased (delegated to buildScanRow)', () => {
      const scan = unifiedResultToScanDetail(makeUnifiedResult(), {
        ...DEFAULT_OPTS,
        platform: 'TikTok',
      });
      expect(scan.platform).toBe('tiktok');
    });

    test('suggested_percentage is 0 when there are no feed items', () => {
      const result = makeUnifiedResult({
        feed_items: [],
        aggregates: {
          total_feed_items: 0,
          total_ads: 0,
          ad_percentage: 0,
        },
      });
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      expect(scan.suggested_percentage).toBe(0);
      expect(scan.post_count).toBe(0);
    });
  });

  describe('raw_data shape', () => {
    test('raw_data shape matches what buildScanRow produces', () => {
      const result = makeUnifiedResult();
      const now = new Date(result.scan_metadata.created_at);

      const row = buildScanRow(result, { ...DEFAULT_OPTS, now });
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);

      // The adapter must mirror buildScanRow's output exactly (modulo
      // the type-only re-cast on raw_data).
      expect(scan.raw_data).toEqual(row.raw_data);
    });

    test('raw_data.posts is flattened from feed_items', () => {
      const result = makeUnifiedResult();
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      const posts = (scan.raw_data as Record<string, unknown>).posts as Array<
        Record<string, unknown>
      >;

      expect(posts).toHaveLength(3);
      expect(posts[0]).toMatchObject({
        creator_handle: '@creator',
        creator_display_name: 'Creator',
        is_ad: false,
        is_suggested: false,
        position_in_feed: 1,
      });
      expect(posts[1]!.is_ad).toBe(true);
      expect(posts[2]!.is_suggested).toBe(true);
    });

    test('raw_data.analysis carries political and tone classifications', () => {
      const result = makeUnifiedResult({
        feed_items: [
          makeFeedItem({
            political: { is_political: true, stance_or_alignment_guess: 'LEFT' },
            emotions: { valence: 'NEGATIVE' },
          }),
        ],
        aggregates: {
          total_feed_items: 1,
          total_ads: 0,
          ad_percentage: 0,
          political_content_summary: {
            political_items: 1,
            political_percentage: 100,
          },
        },
      });
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      const analysis = (scan.raw_data as Record<string, unknown>)
        .analysis as Record<string, unknown>;

      expect(analysis.ai_analyzed).toBe(true);
      expect(analysis.political_content_summary).toEqual({
        political_items: 1,
        political_percentage: 100,
      });
      const feedItems = analysis.feed_items as Array<Record<string, unknown>>;
      expect(feedItems[0]!.political).toEqual({
        is_political: true,
        stance_or_alignment: 'LEFT',
      });
      expect(feedItems[0]!.emotions).toEqual({ valence: 'NEGATIVE' });
    });

    test('raw_data.source_type is MOBILE_BROADCAST', () => {
      const scan = unifiedResultToScanDetail(makeUnifiedResult(), DEFAULT_OPTS);
      expect((scan.raw_data as Record<string, unknown>).source_type).toBe(
        'MOBILE_BROADCAST',
      );
    });
  });

  describe('timestamps', () => {
    test('created_at is pinned to result.scan_metadata.created_at', () => {
      const result = makeUnifiedResult({
        scan_metadata: {
          scan_id: 'scan-fixture-id',
          created_at: '2026-01-02T03:04:05.000Z',
          source_type: 'MOBILE_BROADCAST',
          platform: 'youtube',
        },
      });
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      expect(scan.created_at).toBe('2026-01-02T03:04:05.000Z');
    });

    test('raw_data.scanned_at matches created_at (single nowIso)', () => {
      const result = makeUnifiedResult({
        scan_metadata: {
          scan_id: 'scan-fixture-id',
          created_at: '2026-01-02T03:04:05.000Z',
          source_type: 'MOBILE_BROADCAST',
          platform: 'youtube',
        },
      });
      const scan = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      const scannedAt = (scan.raw_data as Record<string, unknown>).scanned_at;
      expect(scannedAt).toBe(scan.created_at);
    });

    test('timestamps are stable across repeated adapter calls (no Date.now drift)', () => {
      const result = makeUnifiedResult();
      const a = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      const b = unifiedResultToScanDetail(result, DEFAULT_OPTS);
      expect(a.created_at).toBe(b.created_at);
      expect((a.raw_data as Record<string, unknown>).scanned_at).toBe(
        (b.raw_data as Record<string, unknown>).scanned_at,
      );
    });
  });

  describe('Supabase-shape parity', () => {
    test('scan_id is undefined (matches live Supabase scans table)', () => {
      const scan = unifiedResultToScanDetail(makeUnifiedResult(), DEFAULT_OPTS);
      // The live 'scans' table has no scan_id column. ScanDetail
      // declares scan_id?: string and useDashboard returns rows
      // with scan_id undefined. The adapter mirrors that exactly so
      // the engine's `scan_id ?? id` fallback behaves identically
      // on virtual vs persisted ScanDetails.
      expect(scan.scan_id).toBeUndefined();
    });

    test('source_type and duration_seconds are NOT top-level (moved into raw_data in Build #44)', () => {
      const scan = unifiedResultToScanDetail(makeUnifiedResult(), DEFAULT_OPTS);
      expect(scan.source_type).toBeUndefined();
      expect(scan.duration_seconds).toBeUndefined();
    });
  });
});
