/**
 * AlgorithmLens Desktop Mapper Utilities
 *
 * Utility functions for keyword extraction, URL parsing, and OS detection.
 */

import { CAPTURE_DEBUG, debugLog } from './shared/debug.js';

// ============================================
// Constants & Heuristics
// ============================================

// Stop words to filter from topic extraction
export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'if', 'your', 'my', 'his', 'her', 'its',
  'our', 'their', 'me', 'him', 'us', 'them', 'get', 'got', 'like', 'new',
  'one', 'two', 'first', 'last', 'good', 'great', 'best', 'well', 'back',
  'even', 'still', 'way', 'much', 'many', 'need', 'want', 'see', 'look',
  'make', 'take', 'come', 'go', 'know', 'think', 'say', 'try', 'use', 'find'
]);

// ============================================
// Utility Functions
// ============================================

/**
 * Extract words from text, filtering stop words
 */
export function extractKeywords(text) {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s#@]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  return words;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Detect operating system
 */
export function detectOS() {
  if (typeof navigator === 'undefined') return 'UNKNOWN';

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('win')) return 'WINDOWS';
  if (userAgent.includes('mac')) return 'MACOS';
  if (userAgent.includes('linux')) return 'LINUX';
  if (userAgent.includes('cros')) return 'CHROMEOS';

  return 'UNKNOWN';
}
