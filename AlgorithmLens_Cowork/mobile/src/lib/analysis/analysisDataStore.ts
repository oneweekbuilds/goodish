/**
 * analysisDataStore.ts — Transient in-memory store for passing large
 * analysis data between the broadcast and analysis screens.
 *
 * Route params have strict URL size limits, so frame base64 data
 * (potentially 20MB+) cannot be serialized into navigation params.
 * Instead, the broadcast screen writes data here, and the analysis
 * screen reads it on mount.
 *
 * The store is automatically cleared after read to free memory.
 */

import type { BroadcastFrame, BroadcastCaptureInfo, SupportedPlatform } from '../../types/broadcast';

interface AnalysisData {
  sessionId: string;
  platform: SupportedPlatform;
  frames: BroadcastFrame[];
  captureInfo: BroadcastCaptureInfo;
  frameBase64Map: Record<string, string>;
  storedAt: number;
}

// Module-level singleton — shared across screens within the same JS runtime
let pendingAnalysis: AnalysisData | null = null;

/**
 * Stores analysis data for the analysis screen to consume.
 * Only one pending analysis can exist at a time.
 */
export function storeAnalysisData(data: AnalysisData): void {
  pendingAnalysis = data;
}

/**
 * Retrieves and clears the pending analysis data.
 * Returns null if no data is pending or if it's stale (>10 minutes old).
 */
export function consumeAnalysisData(): AnalysisData | null {
  if (!pendingAnalysis) return null;

  // Reject stale data (>10 minutes old)
  if (Date.now() - pendingAnalysis.storedAt > 10 * 60 * 1000) {
    pendingAnalysis = null;
    return null;
  }

  const data = pendingAnalysis;
  pendingAnalysis = null; // Clear after read to free memory
  return data;
}

/**
 * Checks if analysis data is pending (without consuming it).
 */
export function hasAnalysisData(): boolean {
  return pendingAnalysis !== null;
}

/**
 * Explicitly clears any pending analysis data.
 */
export function clearAnalysisData(): void {
  pendingAnalysis = null;
}
