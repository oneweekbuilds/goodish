/**
 * useBroadcast — React hook for managing broadcast capture sessions.
 *
 * Wraps BroadcastSessionManager in a React-friendly interface with
 * state management, memoized callbacks, and automatic cleanup on unmount.
 *
 * Usage:
 * ```tsx
 * const {
 *   session, status, frameCount, isRecording,
 *   startSession, stopSession, cancelSession,
 *   openPlatformApp, collectFrames, cleanup,
 * } = useBroadcast();
 * ```
 *
 * The hook manages the full session lifecycle:
 * 1. startSession(platform) → prepares container + starts polling
 * 2. iOS: User taps RPSystemBroadcastPickerView (rendered in UI)
 *    Android: User taps button → requestScreenCapture() → system permission dialog
 * 3. Status auto-transitions: INITIALIZING → AWAITING → RECORDING → COMPLETE
 * 4. On COMPLETE: collectFrames() returns BroadcastFrame[] for analysis
 * 5. cleanup() clears shared container
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  BroadcastSessionManager,
  type BroadcastSessionCallbacks,
} from '../lib/broadcastSessionManager';
import type {
  BroadcastSession,
  BroadcastStatus,
  BroadcastFrame,
  BroadcastCaptureInfo,
  SupportedPlatform,
} from '../types/broadcast';

export interface UseBroadcastReturn {
  /** The current broadcast session, or null if no session is active. */
  session: BroadcastSession | null;
  /** Current session status for quick checks. */
  status: BroadcastStatus;
  /** Number of unique frames captured so far. */
  frameCount: number;
  /** Total frames captured (before dedup). */
  totalFrames: number;
  /** Whether a broadcast is currently recording. */
  isRecording: boolean;
  /** Whether the session is in a terminal state (COMPLETE, FAILED, CANCELLED). */
  isComplete: boolean;
  /** Whether broadcast capture is available on this device. */
  isAvailable: boolean;
  /** Human-readable elapsed time string (e.g., "2:35"). */
  elapsedTime: string;
  /** Starts a new broadcast session for the given platform. */
  startSession: (platform: SupportedPlatform) => Promise<void>;
  /** Requests screen capture permission (Android only). No-op on iOS. */
  requestScreenCapture: () => Promise<void>;
  /** Opens the target platform's native app. */
  openPlatformApp: (platform: SupportedPlatform) => Promise<boolean>;
  /** Stops the current session (waits for extension to finish). */
  stopSession: () => Promise<void>;
  /** Cancels the session without collecting frames. */
  cancelSession: () => Promise<void>;
  /** Collects all captured frames after session completes. */
  collectFrames: () => Promise<BroadcastFrame[]>;
  /** Gets a single frame as base64 JPEG. */
  getFrameBase64: (filename: string) => string | null;
  /** Builds capture info for UnifiedScanResult. */
  buildCaptureInfo: () => BroadcastCaptureInfo | null;
  /** Cleans up shared container after processing. */
  cleanup: () => Promise<void>;
  /** Storage used by captured frames in bytes. */
  storageUsed: number;
}

export function useBroadcast(): UseBroadcastReturn {
  const [session, setSession] = useState<BroadcastSession | null>(null);
  const [status, setStatus] = useState<BroadcastStatus>('IDLE');
  const [frameCount, setFrameCount] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);

  const [isAvailable, setIsAvailable] = useState(false);
  const managerRef = useRef<BroadcastSessionManager | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // A3: cache the post-cleanup unique-frame list snapshotted at session
  // COMPLETE. Both the broadcast-complete card and the analysis screen read
  // through this so they always agree on the count. Without it the live
  // counter, broadcast-complete card, and analysis screen each polled disk
  // at slightly different times and disagreed by 1-3 frames.
  const collectedFramesRef = useRef<BroadcastFrame[] | null>(null);

  // Initialize manager with callbacks
  useEffect(() => {
    const callbacks: BroadcastSessionCallbacks = {
      onStatusChange: (newStatus, updatedSession) => {
        setStatus(newStatus);
        setSession({ ...updatedSession });

        // Update elapsed time from session
        if (updatedSession.duration_seconds) {
          setElapsedSeconds(updatedSession.duration_seconds);
        }
      },
      onFrameCountUpdate: (unique, total) => {
        setFrameCount(unique);
        setTotalFrames(total);
      },
      onSessionComplete: (completedSession, frames) => {
        setSession({ ...completedSession });
        stopElapsedTimer();

        // A3: snapshot the canonical disk-collected frames at COMPLETE and
        // align frameCount with them so the broadcast-complete card shows
        // the same number the analysis screen will see.
        collectedFramesRef.current = frames;
        setFrameCount(frames.length);

        // Update storage used
        if (managerRef.current) {
          setStorageUsed(managerRef.current.getStorageUsed());
        }
      },
      onSessionError: (error, failedSession) => {
        setSession({ ...failedSession });
        stopElapsedTimer();
      },
    };

    managerRef.current = new BroadcastSessionManager(callbacks);
    setIsAvailable(managerRef.current.isAvailable());

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
      stopElapsedTimer();
    };
  }, []);

  // Elapsed time counter (runs during recording)
  // Max broadcast duration: 10 minutes (600 seconds)
  const MAX_BROADCAST_SECONDS = 600;

  const startElapsedTimer = useCallback(() => {
    stopElapsedTimer();
    setElapsedSeconds(0);
    const startTime = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);

      // Auto-stop at 10 minutes to prevent excessive resource usage
      if (elapsed >= MAX_BROADCAST_SECONDS && managerRef.current) {
        stopElapsedTimer();
        managerRef.current.stopSession().then(() => {
          Alert.alert(
            'Recording limit reached',
            'The broadcast automatically stopped after 10 minutes. This is usually enough to capture a good sample of your feed. Tap "View Results" to see your analysis.',
          );
        }).catch(() => {
          // Stop failed — non-critical, session will still complete
        });
      }
    }, 1000);

    // Return cleanup function to ensure interval is cleared when this callback is no longer needed
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, []);

  function stopElapsedTimer() {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }

  const startSession = useCallback(async (platform: SupportedPlatform) => {
    if (!managerRef.current) {
      Alert.alert('Not Available', 'Screen broadcast is not available on this device. Please ensure you are running the AlgorithmLens development build on iOS 12+.');
      return;
    }

    try {
      const newSession = await managerRef.current.startSession(platform);
      setSession({ ...newSession });
      setStatus(newSession.status);
      setFrameCount(0);
      setTotalFrames(0);
      setStorageUsed(0);
      startElapsedTimer();
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : '';
      if (__DEV__) {
        console.warn('Broadcast session start error:', rawMsg);
      }
      Alert.alert(
        'Couldn\'t Start Recording',
        'We ran into a problem setting up the recording. Please try again. If this keeps happening, restart the app.'
      );
    }
  }, [startElapsedTimer]);

  const requestScreenCapture = useCallback(async () => {
    if (!managerRef.current) return;
    try {
      await managerRef.current.requestScreenCapture();
    } catch (error) {
      if (__DEV__) {
        console.warn('Screen capture permission error:', error);
      }
      Alert.alert(
        'Permission Needed',
        'AlgorithmLens needs screen recording permission to capture your feed. Tap "Start Screen Capture" and allow the permission when prompted.'
      );
    }
  }, []);

  const openPlatformApp = useCallback(async (platform: SupportedPlatform): Promise<boolean> => {
    if (!managerRef.current) return false;
    return managerRef.current.openPlatformApp(platform);
  }, []);

  const stopSession = useCallback(async () => {
    if (!managerRef.current) return;
    await managerRef.current.stopSession();
    stopElapsedTimer();
  }, []);

  const cancelSession = useCallback(async () => {
    if (!managerRef.current) return;
    await managerRef.current.cancelSession();
    stopElapsedTimer();
    setStatus('CANCELLED');
  }, []);

  const collectFrames = useCallback(async (): Promise<BroadcastFrame[]> => {
    // A3: prefer the snapshot taken at COMPLETE so handleViewResults sees
    // the same list the broadcast-complete card was sized against. Falling
    // back to a fresh manager call covers callers that ask before COMPLETE
    // (e.g. partial-results recovery on FAILED).
    if (collectedFramesRef.current) return collectedFramesRef.current;
    if (!managerRef.current) return [];
    return managerRef.current.collectFrames();
  }, []);

  const getFrameBase64 = useCallback((filename: string): string | null => {
    if (!managerRef.current) return null;
    return managerRef.current.getFrameBase64(filename);
  }, []);

  const buildCaptureInfo = useCallback((): BroadcastCaptureInfo | null => {
    if (!managerRef.current) return null;
    const info = managerRef.current.buildCaptureInfo();
    if (!info) return null;
    // A3: align frames_unique / frames_captured / average interval with the
    // canonical disk snapshot. The native COMPLETE metadata occasionally
    // reports a value that drifts from the disk count by 1-2 frames; pinning
    // to the snapshot keeps the broadcast-complete card, analysis header,
    // and post-analysis "Scan Complete" summary in agreement.
    const cached = collectedFramesRef.current;
    if (!cached) return info;
    const unique = cached.length;
    return {
      ...info,
      frames_unique: unique,
      frames_captured: Math.max(info.frames_captured ?? 0, unique),
      average_frame_interval_seconds:
        unique > 1 && info.duration_seconds > 0
          ? info.duration_seconds / unique
          : 0,
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (!managerRef.current) return;
    await managerRef.current.cleanup();
    setSession(null);
    setStatus('IDLE');
    setFrameCount(0);
    setTotalFrames(0);
    setElapsedSeconds(0);
    setStorageUsed(0);
    collectedFramesRef.current = null;
  }, []);

  // Format elapsed time as "M:SS"
  const elapsedTime = formatElapsedTime(elapsedSeconds);

  const isRecording = status === 'RECORDING' || status === 'AWAITING_BROADCAST_START';
  const isComplete = status === 'COMPLETE' || status === 'FAILED' || status === 'CANCELLED';

  return {
    session,
    status,
    frameCount,
    totalFrames,
    isRecording,
    isComplete,
    isAvailable,
    elapsedTime,
    elapsedSeconds,
    startSession,
    requestScreenCapture,
    openPlatformApp,
    stopSession,
    cancelSession,
    collectFrames,
    getFrameBase64,
    buildCaptureInfo,
    cleanup,
    storageUsed,
  };
}

// ============================================
// Helpers
// ============================================

function formatElapsedTime(seconds: number): string {
  // Round first so fractional seconds from the native side don't leak into the
  // displayed "M:SS" string. The native bridge sometimes reports a duration
  // like 158.900000000000006 at session-complete, which previously surfaced
  // verbatim in the broadcast-complete card ("2:38.900000000000006").
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
