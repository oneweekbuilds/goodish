/**
 * Tests for BroadcastSessionManager — broadcast capture lifecycle.
 *
 * Tests cover the exported class behavior with a mocked native module.
 * The native module (ExpoBroadcast) is mocked since it requires iOS/Android runtime.
 */
import { BroadcastSessionManager, BroadcastSessionCallbacks } from '../lib/broadcastSessionManager';

// ─── Mocks ──────────────────────────────────────

// Mock sentry
jest.mock('../lib/sentry', () => ({
  captureMessage: jest.fn(),
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const mockNativeModule = {
  isAvailable: jest.fn(() => true),
  getStatus: jest.fn(() => ({ status: 'idle' })),
  getSharedContainerPath: jest.fn(() => '/path/to/shared'),
  getFrameCount: jest.fn(() => 0),
  getFrameMetadata: jest.fn(() => []),
  getFramePaths: jest.fn(() => []),
  getFrameBase64: jest.fn(() => null),
  startStatusPolling: jest.fn(),
  stopStatusPolling: jest.fn(),
  prepareSession: jest.fn(() => Promise.resolve(true)),
  cleanupFrames: jest.fn(() => Promise.resolve(true)),
  getStorageUsed: jest.fn(() => 0),
};

// Mock expo-modules-core to return our mock native module
jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn(() => mockNativeModule),
  EventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
}));

// ─── Tests ──────────────────────────────────────

describe('BroadcastSessionManager', () => {
  let manager: BroadcastSessionManager;
  let callbacks: BroadcastSessionCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    callbacks = {
      onStatusChange: jest.fn(),
      onFrameCountUpdate: jest.fn(),
      onSessionComplete: jest.fn(),
      onSessionError: jest.fn(),
    };
    manager = new BroadcastSessionManager(callbacks);
  });

  describe('construction', () => {
    test('creates manager without errors', () => {
      expect(manager).toBeDefined();
    });

    test('creates manager without callbacks', () => {
      const noCallbackManager = new BroadcastSessionManager();
      expect(noCallbackManager).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    test('returns true when native module is available', () => {
      mockNativeModule.isAvailable.mockReturnValue(true);
      expect(manager.isAvailable()).toBe(true);
    });

    test('returns false when native module returns false', () => {
      mockNativeModule.isAvailable.mockReturnValue(false);
      expect(manager.isAvailable()).toBe(false);
    });

    test('returns false when native module throws', () => {
      mockNativeModule.isAvailable.mockImplementation(() => { throw new Error('crash'); });
      expect(manager.isAvailable()).toBe(false);
    });
  });

  describe('getSession', () => {
    test('returns null before session starts', () => {
      expect(manager.getSession()).toBeNull();
    });
  });

  describe('startSession', () => {
    test('creates a new session with correct initial state', async () => {
      const session = await manager.startSession('instagram');

      expect(session.platform).toBe('instagram');
      expect(session.status).toBe('AWAITING_BROADCAST_START');
      expect(session.session_id).toBeTruthy();
      expect(session.started_at).toBeTruthy();
      expect(session.ended_at).toBeNull();
      expect(session.frames_captured).toBe(0);
      expect(session.frames_unique).toBe(0);
      expect(session.duration_seconds).toBe(0);
      expect(session.error_message).toBeNull();
    });

    test('calls prepareSession on native module', async () => {
      await manager.startSession('twitter');
      expect(mockNativeModule.prepareSession).toHaveBeenCalledTimes(1);
    });

    test('starts status polling', async () => {
      await manager.startSession('youtube');
      expect(mockNativeModule.startStatusPolling).toHaveBeenCalledTimes(1);
    });

    test('fires onStatusChange callback', async () => {
      await manager.startSession('instagram');
      // Should fire at least twice: INITIALIZING and AWAITING_BROADCAST_START
      expect(callbacks.onStatusChange).toHaveBeenCalled();
    });

    test('generates unique session IDs', async () => {
      const session1 = await manager.startSession('instagram');
      // Complete session so we can start another
      manager.destroy();

      const manager2 = new BroadcastSessionManager(callbacks);
      const session2 = await manager2.startSession('twitter');

      expect(session1.session_id).not.toBe(session2.session_id);
      manager2.destroy();
    });

    test('throws if session already active', async () => {
      await manager.startSession('instagram');

      await expect(
        manager.startSession('twitter'),
      ).rejects.toThrow('Session already active');
    });

    test('handles prepareSession failure', async () => {
      mockNativeModule.prepareSession.mockRejectedValueOnce(new Error('Native failure'));

      await expect(
        manager.startSession('instagram'),
      ).rejects.toThrow();
    });
  });

  describe('cancelSession', () => {
    test('sets status to CANCELLED', async () => {
      await manager.startSession('instagram');
      await manager.cancelSession();

      const session = manager.getSession();
      expect(session?.status).toBe('CANCELLED');
    });
  });

  describe('destroy', () => {
    test('cleans up without error', async () => {
      await manager.startSession('instagram');
      manager.destroy();
      // Should not throw
    });

    test('cleans up without active session', () => {
      manager.destroy();
      // Should not throw
    });
  });

  describe('session ID uniqueness', () => {
    test('generates UUID-format session IDs', async () => {
      const session = await manager.startSession('instagram');
      // UUID format: 8-4-4-4-12 hex chars
      expect(session.session_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });
});
