/**
 * unifiedResultToScanDetail: synthesizes a "virtual" ScanDetail from
 * the in-memory UnifiedScanResult held by useAnalysis on the Results
 * screen, so the 2.x interpretation engine can run synchronously
 * without waiting for the Supabase persistence roundtrip.
 *
 * Under the hood the adapter delegates to buildScanRow — the same
 * helper persistScan uses to build the row it inserts into Supabase.
 * By construction the virtual ScanDetail produced here is byte-
 * identical to the row that will be persisted moments later (modulo
 * the timestamps, see below). This means the engine sees the same
 * shape pre- and post-persist: the Results screen and the Dashboard
 * are interpreting the same data structure.
 *
 * Timestamps: pinned to result.scan_metadata.created_at. The Results
 * screen may re-render many times while the engine runs; pinning to
 * the scan's own created_at keeps the virtual ScanDetail's
 * created_at and raw_data.scanned_at stable across renders so any
 * memoized engine output stays valid. The persisted row will have
 * slightly later timestamps (persistScan stamps with new Date() at
 * insert time) — irrelevant for the engine, which only orders scans
 * by date.
 *
 * scan_id: left undefined. The live Supabase 'scans' table has no
 * scan_id column, so useDashboard returns ScanDetail rows with
 * scan_id undefined. The engine's meta-line code reads
 * `scan_id ?? id` and falls back to id, so the virtual ScanDetail
 * matches the persisted shape exactly on this point too.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */

import type { UnifiedScanResult } from '../../../types';
import type { ScanDetail } from '../../../hooks/useDashboard';
import { buildScanRow } from '../../scanShape/buildScanRow';

export interface UnifiedResultToScanDetailOptions {
  scanId: string;
  userId: string;
  platform: string;
}

export function unifiedResultToScanDetail(
  result: UnifiedScanResult,
  opts: UnifiedResultToScanDetailOptions,
): ScanDetail {
  const now = new Date(result.scan_metadata.created_at);
  const row = buildScanRow(result, { ...opts, now });
  // Narrow cast: ScanRowRawData is a stricter type than ScanDetail's
  // Record<string, unknown> raw_data, but TS won't accept the
  // structural assignment without an index signature on the source.
  // The runtime value is a valid Record<string, unknown> (every
  // named key maps to an unknown-compatible value); the cast just
  // tells TS what we already know.
  return {
    ...row,
    raw_data: row.raw_data as unknown as Record<string, unknown>,
  };
}
