/**
 * Shared utility functions for AlgorithmLens mobile app.
 */

/**
 * Generates a cryptographically random UUID v4.
 * Uses expo-crypto when available, falls back to
 * getRandomValues for environments where expo-crypto
 * is not installed.
 */
export function generateUUID(): string {
  try {
    // Prefer crypto.randomUUID if available (modern runtimes)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to manual generation
  }

  // Fallback: use crypto.getRandomValues for secure random bytes
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version 4 (0100) and variant 10xx bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    // Fall through to Math.random fallback
  }

  // Last resort fallback (should not happen in React Native)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Maximum allowed size for JSON.parse input to prevent
 * memory exhaustion from maliciously large API responses.
 */
const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Safe JSON.parse with size limit to prevent memory exhaustion
 * from unexpectedly large responses.
 *
 * @param text - The JSON string to parse
 * @param maxSize - Maximum allowed string length (default 5 MB)
 * @throws {Error} If text exceeds maxSize
 */
export function safeJsonParse<T = unknown>(text: string, maxSize: number = MAX_JSON_SIZE): T {
  if (text.length > maxSize) {
    throw new Error(`JSON response too large: ${text.length} bytes exceeds ${maxSize} byte limit`);
  }
  return JSON.parse(text) as T;
}

/**
 * Converts a hex color to rgba with the specified alpha.
 * Handles 3-char, 6-char, and 8-char hex values.
 *
 * @param hex - Hex color string (e.g., '#FF0000' or 'FF0000')
 * @param alpha - Alpha value between 0 and 1
 * @returns rgba color string (e.g., 'rgba(255, 0, 0, 0.5)')
 */
export function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
