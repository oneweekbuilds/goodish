/**
 * Unified API wrapper for AlgorithmLens ingest API
 * Centralized types and functions for interacting with the backend
 */

import { getConnectedSettings } from "./connectedSettings";

// ============================================================================
// Types
// ============================================================================

export type SessionRow = {
  sessionId: string;
  startedAt: number;        // epoch ms
  finishedAt: number | null;
  deviceId: string;
  events: number;
};

export type EventRow = {
  id: string;
  sessionId: string;
  accountId: string;
  ts: number;               // epoch ms (mapped from seenAt)
  type: string;             // platformGuess or 'event' (fallback)
  payload: unknown;
};

type SessionsResponse = {
  sessions: SessionRow[];
};

type EventsResponse = {
  events: EventRow[];
  nextOffset: number | null;
};

// ============================================================================
// API Base URL Helper
// ============================================================================

function apiBase(): string {
  const { apiBaseUrl } = getConnectedSettings();
  if (!apiBaseUrl) {
    throw new Error("API Base URL is not set. Please configure it in Connected Sessions settings.");
  }
  return apiBaseUrl.replace(/\/$/, "");
}

// ============================================================================
// Fetch Helper
// ============================================================================

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${apiBase()}${path}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText;
    let message = `HTTP ${status}: ${statusText}`;

    // Try to extract error message from response body
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = `HTTP ${status}: ${errorBody.error}`;
      }
    } catch {
      // If we can't parse the error body, use the default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all sessions for an account
 */
export async function fetchSessions(accountId: string): Promise<SessionRow[]> {
  const response = await fetchJson<SessionsResponse>(
    `/v1/sessions?accountId=${encodeURIComponent(accountId)}`
  );
  return response.sessions;
}

/**
 * Fetch events for a session with pagination
 * Returns all events by automatically paginating through all pages
 */
export async function fetchSessionEvents(
  accountId: string,
  sessionId: string
): Promise<EventRow[]> {
  const allEvents: EventRow[] = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      accountId,
      sessionId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetchJson<{
      events: Array<{ eventId: string; seenAt: number; payload: any }>;
      nextOffset: number | null;
    }>(`/v1/events?${params.toString()}`);

    // Map API response to our internal EventRow format
    const events: EventRow[] = response.events.map(e => ({
      id: e.eventId,
      sessionId: sessionId,
      accountId: accountId,
      ts: e.seenAt,
      type: e.payload?.platformGuess || 'event',
      payload: e.payload,
    }));

    allEvents.push(...events);

    // Check if there are more events
    if (response.nextOffset !== null && events.length === limit) {
      offset = response.nextOffset;
    } else {
      hasMore = false;
    }
  }

  return allEvents;
}

/**
 * Fetch events for a session with manual pagination (for advanced use cases)
 */
export async function fetchSessionEventsPaginated(
  accountId: string,
  sessionId: string,
  limit: number = 1000,
  offset: number = 0
): Promise<EventsResponse> {
  const params = new URLSearchParams({
    accountId,
    sessionId,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetchJson<{
    events: Array<{ eventId: string; seenAt: number; payload: any }>;
    nextOffset: number | null;
  }>(`/v1/events?${params.toString()}`);

  // Map API response to our internal EventRow format
  const events: EventRow[] = response.events.map(e => ({
    id: e.eventId,
    sessionId: sessionId,
    accountId: accountId,
    ts: e.seenAt,
    type: e.payload?.platformGuess || 'unknown',
    payload: e.payload,
  }));

  return {
    events,
    nextOffset: response.nextOffset,
  };
}

