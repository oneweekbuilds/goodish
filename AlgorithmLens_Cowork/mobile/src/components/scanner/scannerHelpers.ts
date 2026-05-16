/**
 * Pure helpers used by WebViewScanner.tsx.
 *
 * Extracted into a sibling module so the unit tests can import them
 * without pulling in react / react-native (which Jest's transform
 * doesn't fully chase through .tsx → JSX runtime).
 */

/** Error info reported back from the injected script or timeout logic. */
export interface ScanError {
  reason: string;
  detail: string;
  errorMessage?: string;
  articlesFound?: number;
}

/**
 * Build the dedup key used to suppress duplicate FEED_ITEM messages.
 * Production code calls this from the message handler; tests call it directly.
 */
export function buildDedupKey(
  creator_handle: string | null | undefined,
  post_text: string | null | undefined,
): string {
  return `${creator_handle || ''}::${(post_text || '').substring(0, 80)}`;
}

/**
 * Map an injected-script error reason to a user-facing string.
 * `isMaxRetries=true` overrides every reason with the "out of retries" message.
 */
export function getErrorMessage(error: ScanError, isMaxRetries: boolean): string {
  if (isMaxRetries) {
    return "We couldn't capture posts from this page after multiple attempts. This can happen when a platform changes its layout or blocks automated access.";
  }

  switch (error.reason) {
    case 'PAGE_NOT_LOADED':
      return "The page hasn't fully loaded yet. Make sure you have a stable internet connection, then try again.";
    case 'BOT_DETECTION':
      return 'The platform may have detected automated access. Try scrolling the page manually for a few seconds, then tap Try Again.';
    case 'DOM_STRUCTURE_CHANGED':
      return "We couldn't read the feed layout. This can happen when a platform updates its design. Try again, or scan a different platform.";
    case 'CAPTURE_FAILED':
      return "We found posts on the page but couldn't capture them. Try scrolling the feed a bit first, then tap Try Again.";
    case 'BLOCKED_BY_PLATFORM':
      return 'The platform blocked the scan. Try scrolling the page manually, then tap Try Again.';
    case 'INJECTION_ERROR':
      return "Something went wrong while scanning. This can happen if the platform's layout has changed.";
    case 'TIMEOUT_NO_POSTS':
    default:
      return "We couldn't capture posts from this page. This can happen if the page hasn't fully loaded or if the platform's layout has changed.";
  }
}
