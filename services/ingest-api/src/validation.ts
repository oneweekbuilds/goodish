/**
 * Request validation utilities
 * Manual validation functions (Zod not available)
 */

import type {
  DeviceRegisterRequest,
  SessionStartRequest,
  SessionFinishRequest,
  EventBatchRequest,
  AccountEraseRequest,
} from './types';

// ============================================================================
// Validation Helpers
// ============================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isValidTimestamp(value: unknown): boolean {
  if (typeof value === 'number') {
    return value > 0 && value < Number.MAX_SAFE_INTEGER;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return !isNaN(parsed) && parsed > 0;
  }
  return false;
}

function normalizeTimestamp(value: number | string): number {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Date.parse(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return parsed;
}

// ============================================================================
// Validators
// ============================================================================

export function validateDeviceRegisterRequest(
  body: unknown
): { valid: true; data: DeviceRegisterRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = body as Record<string, unknown>;

  if (!isNonEmptyString(req.accountId)) {
    return { valid: false, error: 'Missing or invalid accountId (must be a non-empty string)' };
  }

  return { valid: true, data: { accountId: req.accountId.trim() } };
}

export function validateSessionStartRequest(
  body: unknown
): { valid: true; data: SessionStartRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = body as Record<string, unknown>;

  if (!isNonEmptyString(req.accountId)) {
    return { valid: false, error: 'Missing or invalid accountId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.deviceId)) {
    return { valid: false, error: 'Missing or invalid deviceId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.sessionId)) {
    return { valid: false, error: 'Missing or invalid sessionId (must be a non-empty string)' };
  }

  return {
    valid: true,
    data: {
      accountId: req.accountId.trim(),
      deviceId: req.deviceId.trim(),
      sessionId: req.sessionId.trim(),
    },
  };
}

export function validateSessionFinishRequest(
  body: unknown
): { valid: true; data: SessionFinishRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = body as Record<string, unknown>;

  if (!isNonEmptyString(req.accountId)) {
    return { valid: false, error: 'Missing or invalid accountId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.deviceId)) {
    return { valid: false, error: 'Missing or invalid deviceId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.sessionId)) {
    return { valid: false, error: 'Missing or invalid sessionId (must be a non-empty string)' };
  }

  return {
    valid: true,
    data: {
      accountId: req.accountId.trim(),
      deviceId: req.deviceId.trim(),
      sessionId: req.sessionId.trim(),
    },
  };
}

export function validateEventBatchRequest(
  body: unknown
): { valid: true; data: EventBatchRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = body as Record<string, unknown>;

  if (!isNonEmptyString(req.accountId)) {
    return { valid: false, error: 'Missing or invalid accountId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.deviceId)) {
    return { valid: false, error: 'Missing or invalid deviceId (must be a non-empty string)' };
  }

  if (!isNonEmptyString(req.sessionId)) {
    return { valid: false, error: 'Missing or invalid sessionId (must be a non-empty string)' };
  }

  if (!Array.isArray(req.events)) {
    return { valid: false, error: 'Missing or invalid events (must be an array)' };
  }

  if (req.events.length === 0) {
    return { valid: false, error: 'Events array cannot be empty' };
  }

  if (req.events.length > 10000) {
    return { valid: false, error: 'Events array cannot exceed 10000 items' };
  }

  // Validate each event
  const validatedEvents: Array<{ id: string; seenAt: number | string; payload: unknown }> = [];

  for (let i = 0; i < req.events.length; i++) {
    const event = req.events[i];

    if (!event || typeof event !== 'object') {
      return { valid: false, error: `Event at index ${i} must be an object` };
    }

    const evt = event as Record<string, unknown>;

    if (!isNonEmptyString(evt.id)) {
      return { valid: false, error: `Event at index ${i} missing or invalid id` };
    }

    if (!isValidTimestamp(evt.seenAt)) {
      return {
        valid: false,
        error: `Event at index ${i} missing or invalid seenAt (must be a valid timestamp)`,
      };
    }

    if (!evt.payload || typeof evt.payload !== 'object') {
      return { valid: false, error: `Event at index ${i} missing or invalid payload (must be an object)` };
    }

    validatedEvents.push({
      id: evt.id.trim(),
      seenAt: evt.seenAt,
      payload: evt.payload,
    });
  }

  return {
    valid: true,
    data: {
      accountId: req.accountId.trim(),
      deviceId: req.deviceId.trim(),
      sessionId: req.sessionId.trim(),
      events: validatedEvents,
    },
  };
}

export function validateAccountEraseRequest(
  body: unknown
): { valid: true; data: AccountEraseRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = body as Record<string, unknown>;

  if (!isNonEmptyString(req.accountId)) {
    return { valid: false, error: 'Missing or invalid accountId (must be a non-empty string)' };
  }

  return { valid: true, data: { accountId: req.accountId.trim() } };
}

// ============================================================================
// Timestamp Normalization
// ============================================================================

export function normalizeTimestamp(value: number | string): number {
  if (typeof value === 'number') {
    if (!isFinite(value) || value <= 0) {
      throw new Error(`Invalid timestamp: ${value}`);
    }
    return Math.floor(value);
  }

  const parsed = Date.parse(value);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid timestamp string: ${value}`);
  }

  return parsed;
}




