/**
 * useAnalysis — React hook for managing the broadcast analysis pipeline.
 *
 * Wraps BroadcastAnalysisPipeline in a React-friendly interface with
 * live progress state updates, abort control, and automatic cleanup.
 *
 * Usage:
 * ```tsx
 * const analysis = useAnalysis();
 *
 * // Start analysis after broadcast completes
 * await analysis.start(frames, platform, captureInfo, getFrameBase64);
 *
 * // Monitor progress
 * <AnalysisProgress progress={analysis.progress} />
 *
 * // Abort if needed
 * analysis.abort();
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BroadcastAnalysisPipeline,
  type PipelineProgress,
  type PipelineStage,
  type PipelineCallbacks,
  type PipelineConfig,
} from '../lib/analysis/broadcastAnalysisPipeline';
import type {
  BroadcastFrame,
  BroadcastCaptureInfo,
  SupportedPlatform,
} from '../types/broadcast';
import type { UnifiedScanResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserFriendlyNetworkError } from '../lib/networkUtils';

// ============================================
// Constants
// ============================================

/**
 * Gemini API key from environment.
 * In production, this should be fetched from a secure backend endpoint
 * rather than bundled in the app. For now, it's read from Expo env.
 *
 * ⚠️ SECURITY WARNING: Using EXPO_PUBLIC_ exposes this key in the client bundle.
 * This is a known security risk and should be migrated to a backend proxy as soon as possible.
 * The key will be visible in:
 * - JavaScript bundle source code
 * - Network requests made from the app
 * - Browser/app debug tools
 *
 * MIGRATION TRACKED IN BACKLOG:
 * - Create a backend endpoint that validates the user and returns a temporary token
 * - Update this hook to fetch the token from the backend instead
 * - Remove EXPO_PUBLIC_GEMINI_API_KEY from all build outputs
 * - Implement rate limiting and monitoring on the backend
 */
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// ============================================
// Types
// ============================================

export interface UseAnalysisReturn {
  /** Current pipeline progress. */
  progress: PipelineProgress;
  /** Whether analysis is currently running. */
  isRunning: boolean;
  /** Whether analysis completed successfully. */
  isComplete: boolean;
  /** Whether analysis failed. */
  isFailed: boolean;
  /** The scan result after successful completion. */
  result: UnifiedScanResult | null;
  /** The scan ID of the completed analysis. */
  scanId: string | null;
  /** Human-readable status message for the current stage. */
  statusMessage: string;
  /** Progress percentage (0-100). */
  progressPercent: number;
  /** Starts the analysis pipeline. */
  start: (
    frames: BroadcastFrame[],
    platform: SupportedPlatform,
    captureInfo: BroadcastCaptureInfo,
    getFrameBase64: (filename: string) => string | null,
  ) => Promise<void>;
  /** Aborts the running pipeline. */
  abort: () => void;
  /** Resets the hook state for a new analysis. */
  reset: () => void;
  /** Whether the Gemini API key is configured. */
  isConfigured: boolean;
}

const INITIAL_PROGRESS: PipelineProgress = {
  stage: 'PREPARING',
  currentFrame: 0,
  totalFrames: 0,
  itemsExtracted: 0,
  itemsDeduplicated: 0,
  elapsedMs: 0,
  errorMessage: null,
  scanId: null,
};

// ============================================
// Hook
// ============================================

export function useAnalysis(config?: Partial<PipelineConfig>): UseAnalysisReturn {
  const { user } = useAuth();
  const [progress, setProgress] = useState<PipelineProgress>(INITIAL_PROGRESS);
  const [result, setResult] = useState<UnifiedScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const pipelineRef = useRef<BroadcastAnalysisPipeline | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pipelineRef.current?.abort();
    };
  }, []);

  const start = useCallback(
    async (
      frames: BroadcastFrame[],
      platform: SupportedPlatform,
      captureInfo: BroadcastCaptureInfo,
      getFrameBase64: (filename: string) => string | null,
    ) => {
      if (!GEMINI_API_KEY) {
        setProgress({
          ...INITIAL_PROGRESS,
          stage: 'FAILED',
          errorMessage: 'The analysis service isn\'t set up yet. Please contact support if this persists.',
        });
        return;
      }

      if (!user?.id) {
        setProgress({
          ...INITIAL_PROGRESS,
          stage: 'FAILED',
          errorMessage: 'You need to be signed in to analyze your feed. Please sign in and try again.',
        });
        return;
      }

      setIsRunning(true);
      setResult(null);
      setScanId(null);
      setProgress(INITIAL_PROGRESS);

      const callbacks: PipelineCallbacks = {
        onProgress: (p) => setProgress({ ...p }),
        onComplete: (id, scanResult) => {
          setScanId(id);
          setResult(scanResult);
          setIsRunning(false);
        },
        onError: (error, partialResult) => {
          if (partialResult) {
            setResult(partialResult);
          }
          setIsRunning(false);
        },
      };

      const pipelineConfig: PipelineConfig = {
        apiKey: GEMINI_API_KEY,
        ...config,
      };

      const pipeline = new BroadcastAnalysisPipeline(pipelineConfig, callbacks);
      pipelineRef.current = pipeline;

      try {
        await pipeline.run(
          frames,
          platform,
          captureInfo,
          getFrameBase64,
          user.id,
        );
      } catch (error) {
        // Pipeline.run has its own error handling via callbacks,
        // but catch here too for safety (e.g., constructor errors)
        setIsRunning(false);
        setProgress((prev) => ({
          ...prev,
          stage: 'FAILED',
          errorMessage: getUserFriendlyNetworkError(error),
        }));
      }
    },
    [user?.id, config],
  );

  const abort = useCallback(() => {
    pipelineRef.current?.abort();
    setIsRunning(false);
    setProgress((prev) => ({
      ...prev,
      stage: 'FAILED',
      errorMessage: 'Analysis cancelled',
    }));
  }, []);

  const reset = useCallback(() => {
    pipelineRef.current?.abort();
    pipelineRef.current = null;
    setProgress(INITIAL_PROGRESS);
    setResult(null);
    setScanId(null);
    setIsRunning(false);
  }, []);

  // Derived state
  const isComplete = progress.stage === 'COMPLETE';
  const isFailed = progress.stage === 'FAILED';
  const statusMessage = getStatusMessage(progress);
  const progressPercent = getProgressPercent(progress);
  const isConfigured = Boolean(GEMINI_API_KEY);

  return {
    progress,
    isRunning,
    isComplete,
    isFailed,
    result,
    scanId,
    statusMessage,
    progressPercent,
    start,
    abort,
    reset,
    isConfigured,
  };
}

// ============================================
// Status Message Helpers
// ============================================

function getStatusMessage(progress: PipelineProgress): string {
  switch (progress.stage) {
    case 'PREPARING':
      return 'Preparing analysis...';
    case 'ANALYZING':
      if (progress.totalFrames > 0) {
        return `Analyzing frame ${progress.currentFrame} of ${progress.totalFrames}...`;
      }
      return 'Analyzing frames...';
    case 'DEDUPLICATING':
      return `Deduplicating ${progress.itemsExtracted} items...`;
    case 'BUILDING':
      return 'Building your feed report...';
    case 'SAVING':
      return 'Saving results...';
    case 'COMPLETE':
      return `Analysis complete, ${progress.itemsDeduplicated} feed items found`;
    case 'FAILED':
      return progress.errorMessage || 'Something went wrong during analysis. You can try again.';
    default:
      return 'Processing...';
  }
}

function getProgressPercent(progress: PipelineProgress): number {
  const stageWeights: Record<PipelineStage, { start: number; end: number }> = {
    PREPARING: { start: 0, end: 5 },
    ANALYZING: { start: 5, end: 75 },
    DEDUPLICATING: { start: 75, end: 85 },
    BUILDING: { start: 85, end: 90 },
    SAVING: { start: 90, end: 98 },
    COMPLETE: { start: 100, end: 100 },
    FAILED: { start: 0, end: 0 },
  };

  const weight = stageWeights[progress.stage];
  if (!weight) return 0;

  if (progress.stage === 'ANALYZING' && progress.totalFrames > 0) {
    const frameProgress = progress.currentFrame / progress.totalFrames;
    return Math.round(weight.start + frameProgress * (weight.end - weight.start));
  }

  return weight.end;
}
