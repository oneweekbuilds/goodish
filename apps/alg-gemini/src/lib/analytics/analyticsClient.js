/**
 * Analytics client
 * Internal event tracking with bounded localStorage storage
 */

const STORAGE_KEY = 'alg_events_v1';
const MAX_EVENTS = 200;

// In-memory event store (per session)
let inMemoryEvents = [];

/**
 * Generate a simple unique ID for events
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get email domain from full email address
 * Example: user@gmail.com → gmail.com
 */
export function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Load events from localStorage
 */
function loadEventsFromStorage() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    // localStorage unavailable or invalid JSON
    return [];
  }
}

/**
 * Save events to localStorage (bounded to MAX_EVENTS)
 */
function saveEventsToStorage(events) {
  if (typeof window === 'undefined') return;

  try {
    // Keep only most recent MAX_EVENTS
    const bounded = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch (err) {
    // localStorage unavailable or quota exceeded - fail silently
  }
}

/**
 * Track an analytics event
 * Stores in memory and localStorage
 *
 * @param {string} eventName - Event name constant
 * @param {object} payload - Event data (no PII except email domain and user id)
 */
export function track(eventName, payload = {}) {
  // SSR guard
  if (typeof window === 'undefined') return;

  const event = {
    id: generateEventId(),
    ts: new Date().toISOString(),
    event: eventName,
    payload,
  };

  // Add to in-memory store
  inMemoryEvents.push(event);
  if (inMemoryEvents.length > MAX_EVENTS) {
    inMemoryEvents = inMemoryEvents.slice(-MAX_EVENTS);
  }

  // Load existing events from storage
  const storedEvents = loadEventsFromStorage();

  // Add new event and save
  storedEvents.push(event);
  saveEventsToStorage(storedEvents);
}

/**
 * Get all tracked events (from localStorage)
 * Used by dev viewer
 */
export function getAllEvents() {
  return loadEventsFromStorage();
}

/**
 * Clear all tracked events
 * Used by dev viewer
 */
export function clearAllEvents() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    inMemoryEvents = [];
  } catch (err) {
    // localStorage unavailable - fail silently
  }
}
