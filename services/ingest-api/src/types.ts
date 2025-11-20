/**
 * Backend types for AlgorithmLens ingest API
 * Centralized type definitions for requests, responses, and database rows
 */

// ============================================================================
// Request Types
// ============================================================================

export interface DeviceRegisterRequest {
  accountId: string;
}

export interface SessionStartRequest {
  accountId: string;
  deviceId: string;
  sessionId: string;
}

export interface SessionFinishRequest {
  accountId: string;
  deviceId: string;
  sessionId: string;
}

export interface EventBatchRequest {
  accountId: string;
  deviceId: string;
  sessionId: string;
  events: Array<{
    id: string;
    seenAt: number | string;
    payload: unknown;
  }>;
}

export interface AccountEraseRequest {
  accountId: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface DeviceRegisterResponse {
  deviceId: string;
  deviceToken: string;
  expiresAt: number;
}

export interface SessionStartResponse {
  success: boolean;
}

export interface SessionFinishResponse {
  success: boolean;
}

export interface EventBatchResponse {
  accepted: number;
  skipped: number;
}

export interface AccountEraseResponse {
  erasedEvents: number;
  erasedSessions: number;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: boolean;
}

// ============================================================================
// Database Row Types
// ============================================================================

export interface DeviceRow {
  deviceId: string;
  accountId: string;
  deviceToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface SessionRow {
  sessionId: string;
  accountId: string;
  deviceId: string;
  startedAt: number;
  finishedAt: number | null;
}

export interface EventRow {
  eventId: string;
  accountId: string;
  deviceId: string;
  sessionId: string;
  seenAt: number;
  payload: string; // JSON string
  createdAt: number;
}

// ============================================================================
// Normalized Event Type
// ============================================================================

export interface NormalizedEvent {
  eventId: string;
  accountId: string;
  deviceId: string;
  sessionId: string;
  ts: number; // Normalized timestamp (epoch ms)
  type: string; // Extracted from payload.platformGuess or 'event'
  payload: unknown;
}





