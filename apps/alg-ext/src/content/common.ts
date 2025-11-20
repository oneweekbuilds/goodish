import type { LensEvent } from '../types';
import { generateEventId, normalizeText, extractHashtags, extractUrls } from '../utils';

/**
 * Common content script functionality
 */

export type ParsedPost = {
  author?: string;
  text: string;
  ageHint?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    reposts?: number;
    views?: number;
  };
  links?: string[];
  hashtags?: string[];
};

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/**
 * Create LensEvent from parsed post
 */
export function createLensEvent(
  sessionId: string,
  platform: 'reddit' | 'youtube' | 'instagram' | 'x' | 'facebook',
  post: ParsedPost
): LensEvent {
  const seenAt = Date.now();
  const normalizedText = normalizeText(post.text);

  // Build lines (simulate OCR format)
  const lines = normalizedText.split(/[.!?]+/).filter(s => s.trim()).map(line => ({
    t: line.trim(),
    conf: 1.0 // DOM text has perfect confidence
  }));

  // Extract features
  const hashtags = post.hashtags || extractHashtags(normalizedText);
  const links = post.links || extractUrls(normalizedText);

  const event: LensEvent = {
    id: generateEventId(sessionId, platform, normalizedText, seenAt),
    sessionId,
    platformGuess: platform,
    seenAt,
    block: {
      text: normalizedText,
      lines,
      lang: 'en' // Could use language detection if needed
    },
    features: {
      author: post.author,
      ageHint: post.ageHint,
      metrics: post.metrics,
      links: links.length > 0 ? links : undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined
    },
    quality: {
      ocrConfidenceAvg: undefined, // Not applicable for DOM capture
      frameQuality: 'high', // DOM text is always high quality
      dedupScore: undefined
    },
    source: 'dom_capture',
    schema: 2
  };

  return event;
}

/**
 * Send event to background for queueing
 */
export async function queueEvent(
  event: LensEvent,
  accountId: string,
  deviceId: string,
  sessionId: string
): Promise<void> {
  await chrome.runtime.sendMessage({
    type: 'QUEUE_EVENT',
    event,
    accountId,
    deviceId,
    sessionId
  });
}

/**
 * Get text content safely
 */
export function safeTextContent(element: Element | null): string {
  if (!element) return '';
  return element.textContent?.trim() || '';
}

/**
 * Get attribute safely
 */
export function safeAttribute(element: Element | null, attr: string): string | undefined {
  if (!element) return undefined;
  const value = element.getAttribute(attr);
  return value || undefined;
}
