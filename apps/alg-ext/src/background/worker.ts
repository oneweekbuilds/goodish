import { queueEvent, getQueueSize, initDB } from './db';
import { getOrCreateDevice, getStoredDevice } from './auth';
import { uploadBatch, startSession, finishSession } from './uploader';
import { broadcastToTabs, sendStateUpdate } from './messaging';
import type { CaptureState, SessionInfo, Message, ExtensionSettings, QueuedEvent } from '../types';

/**
 * Global state
 */
let state: CaptureState = {
  isCapturing: false,
  session: null,
  device: null,
  queueSize: 0,
  lastUpload: null
};

let uploadIntervalId: number | null = null;

/**
 * Initialize on startup
 */
async function initialize() {
  await initDB();

  // Load device if exists
  state.device = await getStoredDevice();

  // Load session if exists
  const stored = await chrome.storage.local.get('session');
  if (stored.session) {
    state.session = stored.session;
    state.isCapturing = stored.session.status === 'active';

    // Resume upload interval if capturing
    if (state.isCapturing) {
      startUploadInterval();
    }
  }

  // Update queue size
  state.queueSize = await getQueueSize();

  console.log('AlgorithmLens initialized:', state);
}

/**
 * Get default settings
 */
async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.sync.get('settings');

  return stored.settings || {
    accountId: 'test_user',
    apiBaseUrl: 'http://localhost:5050',
    enabledSites: {
      reddit: true,
      youtube: true,
      instagram: true,
      x: true,
      facebook: true
    }
  };
}

/**
 * Start capture session
 */
async function handleStartCapture() {
  const settings = await getSettings();

  if (!settings.accountId) {
    throw new Error('Account ID not set. Please configure in options.');
  }

  // Get or create device
  state.device = await getOrCreateDevice(settings);

  // Create session
  const sessionId = `S-${new Date().toISOString()}`;
  state.session = {
    sessionId,
    accountId: settings.accountId,
    deviceId: state.device.deviceId,
    startedAt: Date.now(),
    status: 'active'
  };

  // Call API to start session
  await startSession(
    state.session.accountId,
    state.session.deviceId,
    state.session.sessionId,
    state.device.deviceToken,
    settings.apiBaseUrl
  );

  // Save session
  await chrome.storage.local.set({ session: state.session });

  state.isCapturing = true;

  // Start upload interval
  startUploadInterval();

  // Broadcast to content scripts
  await broadcastToTabs({
    type: 'START_CAPTURE',
    session: state.session,
    device: state.device
  });

  sendStateUpdate(state);

  console.log('Capture started:', sessionId);
}

/**
 * Stop capture session
 */
async function handleStopCapture() {
  if (!state.session || !state.device) {
    return;
  }

  const settings = await getSettings();

  // Call API to finish session
  try {
    await finishSession(
      state.session.accountId,
      state.session.deviceId,
      state.session.sessionId,
      state.device.deviceToken,
      settings.apiBaseUrl
    );
  } catch (error) {
    console.error('Error finishing session:', error);
  }

  // Update session status
  state.session.status = 'finished';
  await chrome.storage.local.set({ session: state.session });

  state.isCapturing = false;

  // Stop upload interval
  stopUploadInterval();

  // Broadcast to content scripts
  await broadcastToTabs({ type: 'STOP_CAPTURE' });

  sendStateUpdate(state);

  console.log('Capture stopped');
}

/**
 * Toggle capture
 */
async function handleToggleCapture() {
  if (state.isCapturing) {
    await handleStopCapture();
  } else {
    await handleStartCapture();
  }
}

/**
 * Queue an event
 */
async function handleQueueEvent(
  event: QueuedEvent
) {
  await queueEvent(event);
  state.queueSize = await getQueueSize();
  sendStateUpdate(state);
}

/**
 * Upload batch now
 */
async function handleUploadBatch() {
  if (!state.session || !state.device || !state.isCapturing) {
    return;
  }

  const settings = await getSettings();

  const result = await uploadBatch(
    state.device,
    state.session.sessionId,
    settings.apiBaseUrl
  );

  if (result) {
    state.lastUpload = {
      timestamp: Date.now(),
      accepted: result.accepted,
      skipped: result.skipped
    };
    state.queueSize = await getQueueSize();
    sendStateUpdate(state);

    console.log('Uploaded batch:', result);
  }
}

/**
 * Start upload interval (every 3 seconds)
 */
function startUploadInterval() {
  if (uploadIntervalId !== null) {
    return;
  }

  uploadIntervalId = setInterval(() => {
    handleUploadBatch();
  }, 3000) as unknown as number;
}

/**
 * Stop upload interval
 */
function stopUploadInterval() {
  if (uploadIntervalId !== null) {
    clearInterval(uploadIntervalId);
    uploadIntervalId = null;
  }
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'START_CAPTURE':
          await handleStartCapture();
          sendResponse({ success: true });
          break;

        case 'STOP_CAPTURE':
          await handleStopCapture();
          sendResponse({ success: true });
          break;

        case 'TOGGLE_CAPTURE':
          await handleToggleCapture();
          sendResponse({ success: true });
          break;

        case 'GET_STATE':
          sendResponse({ state });
          break;

        case 'QUEUE_EVENT':
          const queuedEvent: QueuedEvent = {
            id: message.event.id,
            accountId: message.accountId,
            deviceId: message.deviceId,
            sessionId: message.sessionId,
            seenAt: message.event.seenAt,
            event: message.event,
            createdAt: Date.now()
          };
          await handleQueueEvent(queuedEvent);
          sendResponse({ success: true });
          break;

        case 'UPLOAD_BATCH':
          await handleUploadBatch();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: String(error) });
    }
  })();

  return true; // Keep channel open for async response
});

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(() => {
  initialize();
});

initialize();
