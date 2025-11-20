/**
 * Utility functions
 */

/**
 * Generate a simple hash from a string
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate event ID: ${sessionId}:${platform}:${hashOfText}:${seenAt}
 */
export function generateEventId(
  sessionId: string,
  platform: string,
  text: string,
  seenAt: number
): string {
  const textHash = hashString(text);
  return `${sessionId}:${platform}:${textHash}:${seenAt}`;
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlPattern);
  return matches || [];
}

/**
 * Normalize whitespace in text
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Parse age hint (e.g., "2 hours ago" -> "2h")
 */
export function parseAgeHint(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Match patterns like "2 hours ago", "3h", "1 day ago", "5m"
  const patterns = [
    { regex: /(\d+)\s*(?:second|sec|s)(?:s)?(?:\s+ago)?/, unit: 's' },
    { regex: /(\d+)\s*(?:minute|min|m)(?:s)?(?:\s+ago)?/, unit: 'm' },
    { regex: /(\d+)\s*(?:hour|hr|h)(?:s)?(?:\s+ago)?/, unit: 'h' },
    { regex: /(\d+)\s*(?:day|d)(?:s)?(?:\s+ago)?/, unit: 'd' },
    { regex: /(\d+)\s*(?:week|wk|w)(?:s)?(?:\s+ago)?/, unit: 'w' },
    { regex: /(\d+)\s*(?:month|mo)(?:s)?(?:\s+ago)?/, unit: 'mo' },
    { regex: /(\d+)\s*(?:year|yr|y)(?:s)?(?:\s+ago)?/, unit: 'y' }
  ];

  for (const { regex, unit } of patterns) {
    const match = lower.match(regex);
    if (match) {
      return `${match[1]}${unit}`;
    }
  }

  return undefined;
}

/**
 * Parse number with K/M suffix
 */
export function parseNumberWithSuffix(text: string): number | undefined {
  const cleaned = text.replace(/,/g, '').trim();
  const match = cleaned.match(/^([\d.]+)([KkMmBb])?$/);

  if (!match) return undefined;

  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  switch (suffix) {
    case 'K': return Math.floor(num * 1000);
    case 'M': return Math.floor(num * 1000000);
    case 'B': return Math.floor(num * 1000000000);
    default: return Math.floor(num);
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return function(...args: Parameters<T>) {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
