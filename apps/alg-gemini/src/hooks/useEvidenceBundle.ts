/**
 * useEvidenceBundle - Hook for fetching and managing Evidence Bundles
 *
 * The Evidence Bundle is the single source of truth for all analysis copy
 * and Talk-to-Algorithm responses in the Ads & Influence tab.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  AdsEvidenceBundle,
  AdsAnalysisCopy,
  AdsEvidenceBundleResponse,
  TalkResponse,
  TalkStructuredResponse,
} from '../types/evidenceBundle';

// Base URL for API - matches dev server proxy
const API_BASE = '/api';

// Debug mode flag - checks for dev environment
const IS_DEV = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

export interface UseEvidenceBundleResult {
  bundle: AdsEvidenceBundle | null;
  analysis: AdsAnalysisCopy | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: AdsEvidenceBundleResponse['_debug'] | null;
}

/**
 * Hook to fetch the Ads & Influence Evidence Bundle for a scan.
 *
 * @param scanId - The scan ID to fetch the bundle for
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useAdsEvidenceBundle(
  scanId: string | null,
  enabled: boolean = true
): UseEvidenceBundleResult {
  const [bundle, setBundle] = useState<AdsEvidenceBundle | null>(null);
  const [analysis, setAnalysis] = useState<AdsAnalysisCopy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<AdsEvidenceBundleResponse['_debug'] | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!scanId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include debug info in dev mode
      const debugParam = IS_DEV ? '?debug=true' : '';
      const response = await fetch(`${API_BASE}/scans/${scanId}/evidence-bundle/ads${debugParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch evidence bundle: ${response.status}`);
      }

      const data: AdsEvidenceBundleResponse = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);

      if (IS_DEV && data._debug) {
        setDebugInfo(data._debug);
        // Log to console for easy debugging
        console.log('[Evidence Bundle] Ads & Influence:', data._debug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Evidence Bundle] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, [scanId, enabled]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  return {
    bundle,
    analysis,
    loading,
    error,
    refetch: fetchBundle,
    debugInfo,
  };
}

export interface UseTalkToAlgorithmResult {
  sendQuestion: (question: string) => Promise<TalkResponse | null>;
  lastResponse: TalkStructuredResponse | null;
  lastFormattedText: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the Talk-to-Algorithm feature in the Ads & Influence tab.
 *
 * Responses are generated ONLY from the Evidence Bundle - never from
 * raw feed text or generic explanations.
 *
 * @param scanId - The scan ID to use for Talk responses
 */
export function useAdsTalkToAlgorithm(scanId: string | null): UseTalkToAlgorithmResult {
  const [lastResponse, setLastResponse] = useState<TalkStructuredResponse | null>(null);
  const [lastFormattedText, setLastFormattedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<TalkResponse | null> => {
    if (!scanId) {
      setError('No scan ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);

      const response = await fetch(`${API_BASE}/scans/${scanId}/talk/ads`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Talk response: ${response.status}`);
      }

      const data: TalkResponse = await response.json();

      setLastResponse(data.response.structured);
      setLastFormattedText(data.response.formatted_text);

      if (IS_DEV) {
        console.log('[Talk to Algorithm] Response:', data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Talk to Algorithm] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  return {
    sendQuestion,
    lastResponse,
    lastFormattedText,
    loading,
    error,
  };
}

/**
 * Helper to check if a chart should show data based on Evidence Bundle quality.
 * Ensures consistency with chartQuality system.
 */
export function checkEvidenceBundleQuality(bundle: AdsEvidenceBundle | null): {
  hasEnoughData: boolean;
  reason: string | null;
} {
  if (!bundle) {
    return {
      hasEnoughData: false,
      reason: 'Evidence bundle not loaded.',
    };
  }

  const n_items = bundle.meta.n_items;

  // Match CHART_THRESHOLDS.AD_SHARE.minItems = 10
  if (n_items < 10) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.sample_size_limitations[0] || 'Insufficient data.',
    };
  }

  return {
    hasEnoughData: true,
    reason: null,
  };
}
