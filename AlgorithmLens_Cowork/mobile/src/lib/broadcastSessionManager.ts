/**
 * BroadcastSessionManager — Orchestrates the full broadcast capture lifecycle.
 *
 * Cross-platform manager bridging React Native with the native
 * ExpoBroadcast module on both iOS (ReplayKit) and Android (MediaProjection).
 *
 * It handles:
 * 1. Session preparation (clean shared storage, set initial state)
 * 2. Platform app launch via URL scheme / Android intent
 * 3. Status polling via native module events
 * 4. Frame collection after broadcast completes
 * 5. Session data packaging for the analysis pipeline
 * 6. Cleanup after processing
 *
 * Platform differences:
 * - iOS: User taps RPSystemBroadcastPickerView to start. Capture runs
 *   in a separate broadcast extension process.
 * - Android: Manager calls requestScreenCapture() to trigger permission
 *   dialog. Capture runs in a foreground service (MediaProjectionService).
 *
 * State machine:
 * IDLE → INITIALIZING → AWAITING_BROADCAST_START → RECORDING → PROCESSING → COMPLETE
 *                                                            ↘ FAILED
 * CANCELLED can occur from any active state.
 */

import { Platform, Linking, AppState, NativeEventEmitter } from 'react-native';
import type {
  BroadcastSession,
  BroadcastStatus,
  BroadcastFrame,
  SupportedPlatform,
  BroadcastCaptureInfo,
} from '../types/broadcast';
import { DEFAULT_STREAM_CONFIG, PLATFORM_BROADCAST_CONFIGS } from '../types/broadcast';
import { generateUUID } from './utils';
import { captureMessage } from './sentry';

// ============================================
// Native Module Interface
// ============================================

/**
 * Type-safe interface to the native ExpoBroadcast module.
 * Maps to functions defined in BroadcastModule.swift (iOS) and
 * BroadcastModule.kt (Android). Both platforms expose the same
 * base API surface via the Expo Modules API.
 */
interface NativeBroadcastModule {
  isAvailable(): boolean;
  getStatus(): { status: string; [key: string]: unknown };
  getSharedContainerPath(): string | null;
  getFrameCount(): number;
  getFrameMetadata(): Array<Record<string, unknown>>;
  getFramePaths(): string[];
  getFrameBase64(filename: string): string | null;
  startStatusPolling(): void;
  stopStatusPolling(): void;
  prepareSession(): Promise<boolean>;
  cleanupFrames(): Promise<boolean>;
  getStorageUsed(): number;
  // Android-only: triggers MediaProjection permission dialog + starts service
  requestScreenCapture?(): Promise<boolean>;
  // Android-only: stops the MediaProjection foreground service
  stopCapture?(): void;
}

function getNativeModule(): NativeBroadcastModule | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require('expo-modules-core');
    return requireNativeModule('ExpoBroadcast') as NativeBroadcastModule;
  } catch (error) {
    captureMessage('[BroadcastSessionManager] Failed to load native module', 'warning', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function getNativeEventEmitter(): NativeEventEmitter | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EventEmitter: ExpoEventEmitter } = require('expo-modules-core');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      captureMessage(
        '[BroadcastSessionManager] Cannot create event emitter: native module unavailable',
        'warning'
      );
      return null;
    }
    return new ExpoEventEmitter(nativeModule);
  } catch (error) {
    captureMessage('[BroadcastSessionManager] Failed to create event emitter', 'warning', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ============================================
// Session Manager
// ============================================

export interface BroadcastSessionCallbacks {
  onStatusChange?: (status: BroadcastStatus, session: BroadcastSession) => void;
  onFrameCountUpdate?: (uniqueFrames: number, totalFrames: number) => void;
  onSessionComplete?: (session: BroadcastSession, frames: BroadcastFrame[]) => void;
  onSessionError?: (error: string, session: BroadcastSession) => void;
}

export class BroadcastSessionManager {
  private session: BroadcastSession | null = null;
  private callbacks: BroadcastSessionCallbacks = {};
  private nativeModule: NativeBroadcastModule | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private statusSubscription: { remove: () => void } | null = null;
  private frameCountSubscription: { remove: () => void } | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  constructor(callbacks?: BroadcastSessionCallbacks) {
    this.nativeModule = getNativeModule();
    this.eventEmitter = getNativeEventEmitter();
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  // MARK: - Public API

  /**
   * Returns whether broadcast capture is available on this device.
   * iOS: Requires iOS 12+ with ReplayKit broadcast extension configured.
   * Android: Requires API 21+ (Android 5.0 Lollipop).
   */
  isAvailable(): boolean {
    if (!this.nativeModule) return false;
    try {
      return this.nativeModule.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Returns the current session, or null if no session is active.
   */
  getSession(): BroadcastSession | null {
    return this.session;
  }

  /**
   * Prepares and starts a new broadcast session for the given platform.
   *
   * Steps:
   * 1. Validates that broadcast is available
   * 2. Cleans shared container from any previous session
   * 3. Creates session object with INITIALIZING status
   * 4. Starts native status polling
   * 5. Subscribes to native events
   *
   * After this, the UI should show the RPSystemBroadcastPickerView
   * for the user to tap. The session will transition to RECORDING
   * when the extension's broadcastStarted fires.
   */
  async startSession(platform: SupportedPlatform): Promise<BroadcastSession> {
    if (!this.nativeModule) {
      throw new Error('Broadcast module not available on this platform');
    }

    if (this.session && !this.isTerminalStatus(this.session.status)) {
      throw new Error(`Session already active with status: ${this.session.status}`);
    }

    // Create new session
    const sessionId = generateUUID();
    this.session = {
      session_id: sessionId,
      platform,
      status: 'INITIALIZING',
      started_at: new Date().toISOString(),
      ended_at: null,
      frames_captured: 0,
      frames_unique: 0,
      duration_seconds: 0,
      error_message: null,
      linked_scan_id: null,
    };

    this.notifyStatusChange('INITIALIZING');

    try {
      // Prepare shared container (clean stale data)
      await this.nativeModule.prepareSession();

      // Subscribe to native events
      this.subscribeToNativeEvents();

      // Start native status polling
      this.nativeModule.startStatusPolling();

      // Start elapsed time tracking
      this.startElapsedTimer();

      // Transition to awaiting broadcast start
      this.updateStatus('AWAITING_BROADCAST_START');

      return this.session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during session preparation';
      this.updateStatus('FAILED', message);
      throw error;
    }
  }

  /**
   * Opens the target platform's native app via URL scheme.
   * Called after the user taps the broadcast picker and recording starts.
   */
  async openPlatformApp(platform: SupportedPlatform): Promise<boolean> {
    const config = PLATFORM_BROADCAST_CONFIGS[platform];
    if (!config) return false;

    const scheme = Platform.OS === 'ios' ? config.ios_url_scheme : `intent://#Intent;package=${config.android_package};end`;

    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (!canOpen) {
        return false;
      }
      await Linking.openURL(scheme);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stops the current broadcast session.
   * iOS: The actual broadcast is stopped by the user via Control Center
   *   or by the extension reaching limits.
   * Android: Calls stopCapture() to terminate the foreground service.
   * This method handles cleanup on the React Native side.
   */
  async stopSession(): Promise<void> {
    if (!this.session) return;

    this.stopElapsedTimer();

    // Android: explicitly stop the MediaProjection foreground service
    if (Platform.OS === 'android' && this.nativeModule?.stopCapture) {
      this.nativeModule.stopCapture();
    }

    if (this.nativeModule) {
      this.nativeModule.stopStatusPolling();
    }

    this.unsubscribeFromNativeEvents();
  }

  /**
   * Requests screen capture permission on Android.
   * Triggers the system MediaProjection permission dialog.
   * On approval, the foreground service starts automatically.
   *
   * On iOS, this is a no-op — the user starts recording via
   * the RPSystemBroadcastPickerView in the UI.
   */
  async requestScreenCapture(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (!this.nativeModule?.requestScreenCapture) return false;

    try {
      return await this.nativeModule.requestScreenCapture();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Screen capture permission denied';
      this.updateStatus('FAILED', message);
      return false;
    }
  }

  /**
   * Cancels the current session without collecting frames.
   */
  async cancelSession(): Promise<void> {
    await this.stopSession();
    this.updateStatus('CANCELLED');
  }

  /**
   * Collects all captured frames after the broadcast session completes.
   * Returns an array of BroadcastFrame objects with metadata and file paths.
   *
   * Call this when status transitions to COMPLETE.
   */
  async collectFrames(): Promise<BroadcastFrame[]> {
    if (!this.nativeModule) return [];

    const rawMetadata = this.nativeModule.getFrameMetadata();
    const framePaths = this.nativeModule.getFramePaths();

    const frames: BroadcastFrame[] = rawMetadata.map((entry, index) => ({
      frame_id: String(entry.frame_id || `frame_${index}`),
      captured_at: String(entry.captured_at || new Date().toISOString()),
      perceptual_hash: '', // Hash is computed internally, not stored as hex
      local_path: framePaths[index] || '',
      size_bytes: Number(entry.size_bytes) || 0,
      width: Number(entry.width) || 0,
      height: Number(entry.height) || 0,
      ocr_text: String(entry.ocr_text || ''),
      ocr_confidence: Number(entry.ocr_confidence) || 0,
      is_unique: Boolean(entry.is_unique ?? true),
    }));

    // Filter out non-unique frames (perceptual duplicates detected by native layer)
    return frames.filter(f => f.is_unique);
  }

  /**
   * Reads a single frame as base64-encoded JPEG data.
   * Used for sending frames to the Gemini analysis pipeline.
   */
  getFrameBase64(filename: string): string | null {
    if (!this.nativeModule) return null;
    return this.nativeModule.getFrameBase64(filename);
  }

  /**
   * Builds a BroadcastCaptureInfo object from the completed session.
   * This gets attached to the UnifiedScanResult's environment field.
   */
  buildCaptureInfo(): BroadcastCaptureInfo | null {
    if (!this.session || this.session.status !== 'COMPLETE') return null;

    return {
      is_broadcast_based: true,
      broadcast_method: Platform.OS === 'ios' ? 'REPLAYKIT' : 'MEDIA_PROJECTION',
      frames_captured: this.session.frames_captured,
      frames_unique: this.session.frames_unique,
      duration_seconds: this.session.duration_seconds,
      average_frame_interval_seconds:
        this.session.frames_unique > 1
          ? this.session.duration_seconds / this.session.frames_unique
          : 0,
      on_device_ocr_used: DEFAULT_STREAM_CONFIG.enable_on_device_ocr,
    };
  }

  /**
   * Cleans up the shared container after frames have been processed.
   * Call this after the analysis pipeline has consumed all frames.
   */
  async cleanup(): Promise<void> {
    if (!this.nativeModule) return;

    try {
      await this.nativeModule.cleanupFrames();
    } catch (error) {
      // Cleanup failure is non-fatal. Stale data will be cleaned
      // on the next session's prepareSession() call.
      captureMessage('[BroadcastSessionManager] Non-fatal cleanup error', 'warning', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.session = null;
  }

  /**
   * Returns the total storage used by captured frames in bytes.
   */
  getStorageUsed(): number {
    if (!this.nativeModule) return 0;
    return this.nativeModule.getStorageUsed();
  }

  /**
   * Tears down all subscriptions and timers.
   * Call this when the component using the manager unmounts.
   */
  destroy(): void {
    this.stopElapsedTimer();
    this.unsubscribeFromNativeEvents();
    // Stop native capture if still running (Android MediaProjection cleanup)
    if (Platform.OS === 'android' && this.nativeModule?.stopCapture) {
      this.nativeModule.stopCapture();
    }
    if (this.nativeModule) {
      this.nativeModule.stopStatusPolling();
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // MARK: - Private

  private subscribeToNativeEvents(): void {
    if (!this.eventEmitter) return;

    this.statusSubscription = this.eventEmitter.addListener(
      'onStatusChange',
      (event: { status: string; metadata: Record<string, unknown> }) => {
        this.handleNativeStatusChange(event.status, event.metadata);
      }
    );

    this.frameCountSubscription = this.eventEmitter.addListener(
      'onFrameCountUpdate',
      (event: { frameCount: number; framesTotal: number }) => {
        if (this.session) {
          this.session.frames_unique = event.frameCount;
          this.session.frames_captured = event.framesTotal;
        }
        this.callbacks.onFrameCountUpdate?.(event.frameCount, event.framesTotal);
      }
    );

    // Listen for app returning to foreground (user comes back from social media app)
    this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && this.session?.status === 'RECORDING') {
        // User returned to AlgorithmLens. Check if broadcast is still running.
        this.syncStatusFromNative();
      }
    });
  }

  private unsubscribeFromNativeEvents(): void {
    this.statusSubscription?.remove();
    this.statusSubscription = null;
    this.frameCountSubscription?.remove();
    this.frameCountSubscription = null;
  }

  private handleNativeStatusChange(
    nativeStatus: string,
    metadata: Record<string, unknown>
  ): void {
    const statusMap: Record<string, BroadcastStatus> = {
      'AWAITING_BROADCAST_START': 'AWAITING_BROADCAST_START',
      'RECORDING': 'RECORDING',
      'PAUSED': 'RECORDING', // Map native PAUSED to RECORDING (temporary system pause)
      'COMPLETE': 'COMPLETE',
      'FAILED': 'FAILED',
    };

    const mappedStatus = statusMap[nativeStatus];
    if (!mappedStatus) return;

    if (mappedStatus === 'COMPLETE' && this.session) {
      // Populate session with final metadata from the extension
      this.session.frames_captured = Number(metadata.frames_captured) || 0;
      this.session.frames_unique = Number(metadata.frames_unique) || 0;
      this.session.duration_seconds = Number(metadata.duration_seconds) || 0;
      this.session.ended_at = String(metadata.ended_at || new Date().toISOString());
    }

    if (mappedStatus === 'FAILED' && this.session) {
      const errorMessage = String(metadata.error || 'Broadcast ended unexpectedly');
      this.session.error_message = errorMessage;
    }

    this.updateStatus(mappedStatus, this.session?.error_message || undefined);
  }

  private syncStatusFromNative(): void {
    if (!this.nativeModule) return;

    const nativeStatus = this.nativeModule.getStatus();
    if (nativeStatus.status) {
      this.handleNativeStatusChange(
        String(nativeStatus.status),
        nativeStatus as Record<string, unknown>
      );
    }
  }

  private updateStatus(status: BroadcastStatus, errorMessage?: string): void {
    if (!this.session) return;

    this.session.status = status;
    if (errorMessage) {
      this.session.error_message = errorMessage;
    }

    if (this.isTerminalStatus(status)) {
      this.stopElapsedTimer();
      if (this.nativeModule) {
        this.nativeModule.stopStatusPolling();
      }
      this.unsubscribeFromNativeEvents();

      if (!this.session.ended_at) {
        this.session.ended_at = new Date().toISOString();
      }
    }

    this.notifyStatusChange(status);

    // Fire specific callbacks for terminal states
    if (status === 'COMPLETE') {
      this.collectFrames().then((frames) => {
        this.callbacks.onSessionComplete?.(this.session!, frames);
      });
    } else if (status === 'FAILED') {
      this.callbacks.onSessionError?.(
        this.session.error_message || 'Unknown error',
        this.session
      );
    }
  }

  private notifyStatusChange(status: BroadcastStatus): void {
    if (!this.session) return;
    this.callbacks.onStatusChange?.(status, { ...this.session });
  }

  private startElapsedTimer(): void {
    this.stopElapsedTimer();
    const startTime = Date.now();
    this.elapsedTimer = setInterval(() => {
      if (this.session && !this.isTerminalStatus(this.session.status)) {
        this.session.duration_seconds = Math.round((Date.now() - startTime) / 1000);
      }
    }, 1000);
  }

  private stopElapsedTimer(): void {
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }

  private isTerminalStatus(status: BroadcastStatus): boolean {
    return status === 'COMPLETE' || status === 'FAILED' || status === 'CANCELLED';
  }
}

// generateUUID imported from ./utils
