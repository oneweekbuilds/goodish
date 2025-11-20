/**
 * Facebook content script
 *
 * Selector notes:
 * - Post containers: div[role="article"]
 * - Author: h2, h3, h4 inside article (usually profile name)
 * - Post content: div[data-ad-preview="message"] or divs with text content
 * - Time: time element or a[role="link"] with time text
 * - Reactions: span with aria-label containing "reaction"
 * - Comments: look for text containing "comment"
 * - Shares: text containing "share"
 */

import { createLensEvent, queueEvent, safeTextContent, ParsedPost } from './common';
import { parseAgeHint, parseNumberWithSuffix, debounce } from '../utils';
import type { Message } from '../types';

let isCapturing = false;
let sessionId = '';
let accountId = '';
let deviceId = '';
const processedPosts = new Set<string>();

/**
 * Parse a Facebook post element
 */
function parseFacebookPost(postEl: Element): ParsedPost | null {
  try {
    // Get author (from h2, h3, h4 elements)
    const authorEl = postEl.querySelector('h2 a, h3 a, h4 a');
    const author = safeTextContent(authorEl) || undefined;

    // Get post text (look for div with text content)
    const textDivs = postEl.querySelectorAll('div[data-ad-preview="message"], div[dir="auto"]');
    let text = '';

    textDivs.forEach(div => {
      const content = safeTextContent(div);
      if (content && content.length > text.length) {
        text = content;
      }
    });

    if (!text) return null;

    // Get time
    const timeEl = postEl.querySelector('time');
    const ageHint = timeEl ? parseAgeHint(timeEl.getAttribute('datetime') || safeTextContent(timeEl)) : undefined;

    // Get metrics
    const metrics: ParsedPost['metrics'] = {};

    // Look for reaction counts
    const spans = postEl.querySelectorAll('span');
    spans.forEach(span => {
      const ariaLabel = span.getAttribute('aria-label') || '';
      const text = safeTextContent(span);

      if (ariaLabel.toLowerCase().includes('reaction') || text.toLowerCase().includes('like')) {
        const match = text.match(/[\d,KMB]+/);
        if (match) {
          const likes = parseNumberWithSuffix(match[0]);
          if (likes !== undefined) metrics.likes = likes;
        }
      }

      if (text.toLowerCase().includes('comment')) {
        const match = text.match(/[\d,KMB]+/);
        if (match) {
          const comments = parseNumberWithSuffix(match[0]);
          if (comments !== undefined) metrics.comments = comments;
        }
      }

      if (text.toLowerCase().includes('share')) {
        const match = text.match(/[\d,KMB]+/);
        if (match) {
          const shares = parseNumberWithSuffix(match[0]);
          if (shares !== undefined) metrics.reposts = shares;
        }
      }
    });

    return {
      author,
      text,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing Facebook post:', error);
    return null;
  }
}

/**
 * Process visible posts
 */
const processVisiblePosts = debounce(() => {
  if (!isCapturing) return;

  const posts = document.querySelectorAll('div[role="article"]');

  posts.forEach((postEl, index) => {
    // Use index as ID since Facebook doesn't expose post IDs easily
    const postId = `fb-${index}`;
    if (processedPosts.has(postId)) return;

    const rect = postEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    const parsed = parseFacebookPost(postEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'facebook', parsed);
    queueEvent(event, accountId, deviceId, sessionId);
    processedPosts.add(postId);

    console.log('Queued Facebook post:', event.id);
  });
}, 500);

/**
 * Setup observers
 */
function setupObservers() {
  const observer = new IntersectionObserver((entries) => {
    if (!isCapturing) return;

    const hasVisible = entries.some(e => e.isIntersecting);
    if (hasVisible) {
      processVisiblePosts();
    }
  }, { threshold: 0.5 });

  const observePosts = () => {
    document.querySelectorAll('div[role="article"]').forEach(post => {
      observer.observe(post);
    });
  };

  observePosts();

  const mutationObserver = new MutationObserver(() => {
    observePosts();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener('scroll', processVisiblePosts, { passive: true });
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === 'START_CAPTURE') {
    isCapturing = true;
    sessionId = message.session.sessionId;
    accountId = message.session.accountId;
    deviceId = message.device.deviceId;
    console.log('Facebook capture started');
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    console.log('Facebook capture stopped');
  }
});

chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: any) => {
  if (response?.state?.isCapturing && response.state.session && response.state.device) {
    isCapturing = true;
    sessionId = response.state.session.sessionId;
    accountId = response.state.session.accountId;
    deviceId = response.state.device.deviceId;
  }
});

setupObservers();

console.log('Facebook content script loaded');
