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
  PoliticsEvidenceBundle,
  PoliticsAnalysisCopy,
  PoliticsEvidenceBundleResponse,
  PoliticsTalkResponse,
  PatternsEvidenceBundle,
  PatternsAnalysisCopy,
  PatternsEvidenceBundleResponse,
  PatternsTalkResponse,
  CreatorsEvidenceBundle,
  CreatorsAnalysisCopy,
  CreatorsEvidenceBundleResponse,
  CreatorsTalkResponse,
  InferencesEvidenceBundle,
  InferencesAnalysisCopy,
  InferencesEvidenceBundleResponse,
  InferencesTalkResponse,
  EvidenceBackedClaim,
  Explanations,
} from '../types/evidenceBundle';

// Base URL for API - matches dev server proxy
const API_BASE = '/api';

// Debug mode flag - checks for dev environment
const IS_DEV = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

export interface UseEvidenceBundleResult {
  bundle: AdsEvidenceBundle | null;
  analysis: AdsAnalysisCopy | null;
  claims: EvidenceBackedClaim[];
  explanations: Explanations | null;
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
  const [claims, setClaims] = useState<EvidenceBackedClaim[]>([]);
  const [explanations, setExplanations] = useState<Explanations | null>(null);
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

      const data = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);
      setClaims(data.claims || []);  // Prompt 6: Evidence-backed claims
      setExplanations(data.explanations || null);  // Prompt 7: Evidence explanations

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
    claims,
    explanations,
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

// =============================================================================
// Politics & Worldview Evidence Bundle Hooks
// =============================================================================

export interface UsePoliticsEvidenceBundleResult {
  bundle: PoliticsEvidenceBundle | null;
  analysis: PoliticsAnalysisCopy | null;
  claims: EvidenceBackedClaim[];
  explanations: Explanations | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: PoliticsEvidenceBundleResponse['_debug'] | null;
}

/**
 * Hook to fetch the Politics & Worldview Evidence Bundle for a scan.
 *
 * @param scanId - The scan ID to fetch the bundle for
 * @param enabled - Whether to enable fetching (default: true)
 */
export function usePoliticsEvidenceBundle(
  scanId: string | null,
  enabled: boolean = true
): UsePoliticsEvidenceBundleResult {
  const [bundle, setBundle] = useState<PoliticsEvidenceBundle | null>(null);
  const [analysis, setAnalysis] = useState<PoliticsAnalysisCopy | null>(null);
  const [claims, setClaims] = useState<EvidenceBackedClaim[]>([]);
  const [explanations, setExplanations] = useState<Explanations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PoliticsEvidenceBundleResponse['_debug'] | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!scanId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include debug info in dev mode
      const debugParam = IS_DEV ? '?debug=true' : '';
      const response = await fetch(`${API_BASE}/scans/${scanId}/evidence-bundle/politics${debugParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch politics evidence bundle: ${response.status}`);
      }

      const data = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);
      setClaims(data.claims || []);  // Prompt 6: Evidence-backed claims
      setExplanations(data.explanations || null);  // Prompt 7: Evidence explanations

      if (IS_DEV && data._debug) {
        setDebugInfo(data._debug);
        // Log to console for easy debugging
        console.log('[Evidence Bundle] Politics & Worldview:', data._debug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Evidence Bundle] Error fetching politics bundle:', err);
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
    claims,
    explanations,
    loading,
    error,
    refetch: fetchBundle,
    debugInfo,
  };
}

export interface UsePoliticsTalkToAlgorithmResult {
  sendQuestion: (question: string) => Promise<PoliticsTalkResponse | null>;
  lastResponse: TalkStructuredResponse | null;
  lastFormattedText: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the Talk-to-Algorithm feature in the Politics & Worldview tab.
 *
 * Responses are generated ONLY from the Evidence Bundle - never from
 * raw feed text or generic explanations.
 *
 * CRITICAL: Cannot infer political beliefs, preferences, or ideology
 *
 * @param scanId - The scan ID to use for Talk responses
 */
export function usePoliticsTalkToAlgorithm(scanId: string | null): UsePoliticsTalkToAlgorithmResult {
  const [lastResponse, setLastResponse] = useState<TalkStructuredResponse | null>(null);
  const [lastFormattedText, setLastFormattedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<PoliticsTalkResponse | null> => {
    if (!scanId) {
      setError('No scan ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);

      const response = await fetch(`${API_BASE}/scans/${scanId}/talk/politics`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Politics Talk response: ${response.status}`);
      }

      const data: PoliticsTalkResponse = await response.json();

      setLastResponse(data.response.structured);
      setLastFormattedText(data.response.formatted_text);

      if (IS_DEV) {
        console.log('[Talk to Algorithm] Politics Response:', data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Talk to Algorithm] Politics Error:', err);
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
 * Helper to check if politics chart should show data based on Evidence Bundle quality.
 */
export function checkPoliticsEvidenceBundleQuality(bundle: PoliticsEvidenceBundle | null): {
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

  // Minimum 10 items for reliable political analysis
  if (n_items < 10) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.sample_size_limitations[0] || 'Insufficient data for political analysis.',
    };
  }

  // Check for data quality warnings
  if (bundle.limits.data_quality_warnings && bundle.limits.data_quality_warnings.length > 0) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.data_quality_warnings[0],
    };
  }

  return {
    hasEnoughData: true,
    reason: null,
  };
}

// =============================================================================
// Patterns in Your Feed Evidence Bundle Hooks
// =============================================================================

export interface UsePatternsEvidenceBundleResult {
  bundle: PatternsEvidenceBundle | null;
  analysis: PatternsAnalysisCopy | null;
  claims: EvidenceBackedClaim[];
  explanations: Explanations | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: PatternsEvidenceBundleResponse['_debug'] | null;
}

/**
 * Hook to fetch the Patterns in Your Feed Evidence Bundle for a scan.
 *
 * @param scanId - The scan ID to fetch the bundle for
 * @param enabled - Whether to enable fetching (default: true)
 */
export function usePatternsEvidenceBundle(
  scanId: string | null,
  enabled: boolean = true
): UsePatternsEvidenceBundleResult {
  const [bundle, setBundle] = useState<PatternsEvidenceBundle | null>(null);
  const [analysis, setAnalysis] = useState<PatternsAnalysisCopy | null>(null);
  const [claims, setClaims] = useState<EvidenceBackedClaim[]>([]);
  const [explanations, setExplanations] = useState<Explanations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<PatternsEvidenceBundleResponse['_debug'] | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!scanId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include debug info in dev mode
      const debugParam = IS_DEV ? '?debug=true' : '';
      const response = await fetch(`${API_BASE}/scans/${scanId}/evidence-bundle/patterns${debugParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patterns evidence bundle: ${response.status}`);
      }

      const data = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);
      setClaims(data.claims || []);  // Prompt 6: Evidence-backed claims
      setExplanations(data.explanations || null);  // Prompt 7: Evidence explanations

      if (IS_DEV && data._debug) {
        setDebugInfo(data._debug);
        // Log to console for easy debugging
        console.log('[Evidence Bundle] Patterns:', data._debug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Evidence Bundle] Error fetching patterns bundle:', err);
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
    claims,
    explanations,
    loading,
    error,
    refetch: fetchBundle,
    debugInfo,
  };
}

export interface UsePatternsTalkToAlgorithmResult {
  sendQuestion: (question: string) => Promise<PatternsTalkResponse | null>;
  lastResponse: TalkStructuredResponse | null;
  lastFormattedText: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the Talk-to-Algorithm feature in the Patterns in Your Feed tab.
 *
 * Responses are generated ONLY from the Evidence Bundle - never from
 * raw feed text or generic explanations.
 *
 * CRITICAL: Cannot know why algorithm chose items, cannot infer user preferences
 *
 * @param scanId - The scan ID to use for Talk responses
 */
export function usePatternsTalkToAlgorithm(scanId: string | null): UsePatternsTalkToAlgorithmResult {
  const [lastResponse, setLastResponse] = useState<TalkStructuredResponse | null>(null);
  const [lastFormattedText, setLastFormattedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<PatternsTalkResponse | null> => {
    if (!scanId) {
      setError('No scan ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);

      const response = await fetch(`${API_BASE}/scans/${scanId}/talk/patterns`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Patterns Talk response: ${response.status}`);
      }

      const data: PatternsTalkResponse = await response.json();

      setLastResponse(data.response.structured);
      setLastFormattedText(data.response.formatted_text);

      if (IS_DEV) {
        console.log('[Talk to Algorithm] Patterns Response:', data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Talk to Algorithm] Patterns Error:', err);
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
 * Helper to check if patterns chart should show data based on Evidence Bundle quality.
 */
export function checkPatternsEvidenceBundleQuality(bundle: PatternsEvidenceBundle | null): {
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

  // Minimum 10 items for reliable patterns analysis
  if (n_items < 10) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.sample_size_limitations[0] || 'Insufficient data for patterns analysis.',
    };
  }

  // Check for data quality warnings
  if (bundle.limits.data_quality_warnings && bundle.limits.data_quality_warnings.length > 0) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.data_quality_warnings[0],
    };
  }

  return {
    hasEnoughData: true,
    reason: null,
  };
}

// =============================================================================
// Creators & Voices Evidence Bundle Hooks
// =============================================================================

export interface UseCreatorsEvidenceBundleResult {
  bundle: CreatorsEvidenceBundle | null;
  analysis: CreatorsAnalysisCopy | null;
  claims: EvidenceBackedClaim[];
  explanations: Explanations | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: CreatorsEvidenceBundleResponse['_debug'] | null;
}

/**
 * Hook to fetch the Creators & Voices Evidence Bundle for a scan.
 *
 * @param scanId - The scan ID to fetch the bundle for
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useCreatorsEvidenceBundle(
  scanId: string | null,
  enabled: boolean = true
): UseCreatorsEvidenceBundleResult {
  const [bundle, setBundle] = useState<CreatorsEvidenceBundle | null>(null);
  const [analysis, setAnalysis] = useState<CreatorsAnalysisCopy | null>(null);
  const [claims, setClaims] = useState<EvidenceBackedClaim[]>([]);
  const [explanations, setExplanations] = useState<Explanations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<CreatorsEvidenceBundleResponse['_debug'] | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!scanId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include debug info in dev mode
      const debugParam = IS_DEV ? '?debug=true' : '';
      const response = await fetch(`${API_BASE}/scans/${scanId}/evidence-bundle/creators${debugParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch creators evidence bundle: ${response.status}`);
      }

      const data = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);
      setClaims(data.claims || []);  // Prompt 6: Evidence-backed claims
      setExplanations(data.explanations || null);  // Prompt 7: Evidence explanations

      if (IS_DEV && data._debug) {
        setDebugInfo(data._debug);
        // Log to console for easy debugging
        console.log('[Evidence Bundle] Creators & Voices:', data._debug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Evidence Bundle] Error fetching creators bundle:', err);
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
    claims,
    explanations,
    loading,
    error,
    refetch: fetchBundle,
    debugInfo,
  };
}

export interface UseCreatorsTalkToAlgorithmResult {
  sendQuestion: (question: string) => Promise<CreatorsTalkResponse | null>;
  lastResponse: TalkStructuredResponse | null;
  lastFormattedText: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the Talk-to-Algorithm feature in the Creators & Voices tab.
 *
 * Responses are generated ONLY from the Evidence Bundle - never from
 * raw feed text or generic explanations.
 *
 * CRITICAL: Cannot infer what user trusts, follows, or agrees with.
 *           Cannot infer whether creator variety is "good" or "bad".
 *
 * @param scanId - The scan ID to use for Talk responses
 */
export function useCreatorsTalkToAlgorithm(scanId: string | null): UseCreatorsTalkToAlgorithmResult {
  const [lastResponse, setLastResponse] = useState<TalkStructuredResponse | null>(null);
  const [lastFormattedText, setLastFormattedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<CreatorsTalkResponse | null> => {
    if (!scanId) {
      setError('No scan ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);

      const response = await fetch(`${API_BASE}/scans/${scanId}/talk/creators`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Creators Talk response: ${response.status}`);
      }

      const data: CreatorsTalkResponse = await response.json();

      setLastResponse(data.response.structured);
      setLastFormattedText(data.response.formatted_text);

      if (IS_DEV) {
        console.log('[Talk to Algorithm] Creators Response:', data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Talk to Algorithm] Creators Error:', err);
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
 * Helper to check if creators chart should show data based on Evidence Bundle quality.
 */
export function checkCreatorsEvidenceBundleQuality(bundle: CreatorsEvidenceBundle | null): {
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

  // Minimum 10 items for reliable creators analysis
  if (n_items < 10) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.sample_size_limitations[0] || 'Insufficient data for creators analysis.',
    };
  }

  // Check for data quality warnings
  if (bundle.limits.data_quality_warnings && bundle.limits.data_quality_warnings.length > 0) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.data_quality_warnings[0],
    };
  }

  // Check for insufficient coverage
  const coverageQuality = bundle.observations?.creator_data_coverage?.coverage_quality;
  if (coverageQuality === 'insufficient') {
    return {
      hasEnoughData: false,
      reason: 'Creator data coverage is insufficient for reliable analysis.',
    };
  }

  return {
    hasEnoughData: true,
    reason: null,
  };
}

// =============================================================================
// Inferences Evidence Bundle Hooks ("What the Algorithm Thinks" tab)
// =============================================================================

export interface UseInferencesEvidenceBundleResult {
  bundle: InferencesEvidenceBundle | null;
  analysis: InferencesAnalysisCopy | null;
  claims: EvidenceBackedClaim[];
  explanations: Explanations | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: InferencesEvidenceBundleResponse['_debug'] | null;
}

/**
 * Hook to fetch the Inferences Evidence Bundle for a scan.
 *
 * This bundle aggregates inference candidates from all other bundles
 * and applies strict confidence thresholds.
 *
 * CRITICAL: This shows "signals in the content" not "who you are."
 * Cannot infer identity, beliefs, intent, or why content was shown.
 *
 * @param scanId - The scan ID to fetch the bundle for
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useInferencesEvidenceBundle(
  scanId: string | null,
  enabled: boolean = true
): UseInferencesEvidenceBundleResult {
  const [bundle, setBundle] = useState<InferencesEvidenceBundle | null>(null);
  const [analysis, setAnalysis] = useState<InferencesAnalysisCopy | null>(null);
  const [claims, setClaims] = useState<EvidenceBackedClaim[]>([]);
  const [explanations, setExplanations] = useState<Explanations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<InferencesEvidenceBundleResponse['_debug'] | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!scanId || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Include debug info in dev mode
      const debugParam = IS_DEV ? '?debug=true' : '';
      const response = await fetch(`${API_BASE}/scans/${scanId}/evidence-bundle/inferences${debugParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch inferences evidence bundle: ${response.status}`);
      }

      const data = await response.json();

      setBundle(data.bundle);
      setAnalysis(data.analysis);
      setClaims(data.claims || []);  // Prompt 6: Evidence-backed claims
      setExplanations(data.explanations || null);  // Prompt 7: Evidence explanations

      if (IS_DEV && data._debug) {
        setDebugInfo(data._debug);
        // Log to console for easy debugging
        console.log('[Evidence Bundle] Inferences:', data._debug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Evidence Bundle] Error fetching inferences bundle:', err);
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
    claims,
    explanations,
    loading,
    error,
    refetch: fetchBundle,
    debugInfo,
  };
}

export interface UseInferencesTalkToAlgorithmResult {
  sendQuestion: (question: string) => Promise<InferencesTalkResponse | null>;
  lastResponse: TalkStructuredResponse | null;
  lastFormattedText: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for the Talk-to-Algorithm feature in the Inferences tab.
 *
 * Responses are generated ONLY from the Evidence Bundle - never from
 * raw feed text or generic explanations.
 *
 * CRITICAL: Cannot infer user identity, beliefs, intent, or why content was shown.
 *           Cannot claim to know what the algorithm "thinks about you."
 *
 * @param scanId - The scan ID to use for Talk responses
 */
export function useInferencesTalkToAlgorithm(scanId: string | null): UseInferencesTalkToAlgorithmResult {
  const [lastResponse, setLastResponse] = useState<TalkStructuredResponse | null>(null);
  const [lastFormattedText, setLastFormattedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<InferencesTalkResponse | null> => {
    if (!scanId) {
      setError('No scan ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);

      const response = await fetch(`${API_BASE}/scans/${scanId}/talk/inferences`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to get Inferences Talk response: ${response.status}`);
      }

      const data: InferencesTalkResponse = await response.json();

      setLastResponse(data.response.structured);
      setLastFormattedText(data.response.formatted_text);

      if (IS_DEV) {
        console.log('[Talk to Algorithm] Inferences Response:', data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[Talk to Algorithm] Inferences Error:', err);
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
 * Helper to check if inferences should be shown based on Evidence Bundle quality.
 *
 * Key check: n_items >= 30 for reliable inference (minimum sample size)
 */
export function checkInferencesEvidenceBundleQuality(bundle: InferencesEvidenceBundle | null): {
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

  // Minimum 30 items for reliable inference analysis
  if (n_items < 30) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.sample_size_limitations[0] || 'Insufficient data for inference analysis. Minimum 30 posts required.',
    };
  }

  // Check for data quality warnings
  if (bundle.limits.data_quality_warnings && bundle.limits.data_quality_warnings.length > 0) {
    return {
      hasEnoughData: false,
      reason: bundle.limits.data_quality_warnings[0],
    };
  }

  return {
    hasEnoughData: true,
    reason: null,
  };
}
