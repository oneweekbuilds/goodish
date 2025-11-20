import { getQueuedEvents, deleteEvents } from './db';
import type { DeviceInfo, QueuedEvent } from '../types';

/**
 * Upload batch to API
 */
export async function uploadBatch(
  device: DeviceInfo,
  sessionId: string,
  apiBaseUrl: string
): Promise<{ accepted: number; skipped: number } | null> {
  // Get queued events
  const queued = await getQueuedEvents(200);

  if (queued.length === 0) {
    return null;
  }

  // Filter events for current session
  const sessionEvents = queued.filter(e => e.sessionId === sessionId);

  if (sessionEvents.length === 0) {
    return null;
  }

  // Prepare batch payload
  const events = sessionEvents.map(q => ({
    id: q.event.id,
    seenAt: q.seenAt,
    payload: q.event
  }));

  try {
    const response = await fetch(`${apiBaseUrl}/v1/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${device.deviceToken}`
      },
      body: JSON.stringify({
        accountId: device.accountId,
        deviceId: device.deviceId,
        sessionId,
        events
      })
    });

    if (!response.ok) {
      console.error('Upload failed:', response.statusText);
      return null;
    }

    const result = await response.json();

    // Delete uploaded events from queue
    const uploadedIds = sessionEvents.map(e => e.id);
    await deleteEvents(uploadedIds);

    return {
      accepted: result.accepted || 0,
      skipped: result.skipped || 0
    };
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Start session on API
 */
export async function startSession(
  accountId: string,
  deviceId: string,
  sessionId: string,
  deviceToken: string,
  apiBaseUrl: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/v1/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deviceToken}`
    },
    body: JSON.stringify({
      accountId,
      deviceId,
      sessionId
    })
  });

  if (!response.ok) {
    throw new Error(`Session start failed: ${response.statusText}`);
  }
}

/**
 * Finish session on API
 */
export async function finishSession(
  accountId: string,
  deviceId: string,
  sessionId: string,
  deviceToken: string,
  apiBaseUrl: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/v1/sessions/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deviceToken}`
    },
    body: JSON.stringify({
      accountId,
      deviceId,
      sessionId
    })
  });

  if (!response.ok) {
    throw new Error(`Session finish failed: ${response.statusText}`);
  }
}
