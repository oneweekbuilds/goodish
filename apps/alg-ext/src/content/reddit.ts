/**
 * Reddit content script
 *
 * Selector notes:
 * - Post containers: shreddit-post (new Reddit web component)
 * - Author: faceplate-tracker[noun="user"] slot, or author attribute
 * - Post content: div[slot="text-body"] for text posts
 * - Time: faceplate-timeago
 * - Upvotes: shreddit-post upvote-count or score attributes
 * - Comments: aria-label containing "comments"
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
 * Parse a Reddit post element
 */
function parseRedditPost(postEl: Element): ParsedPost | null {
  try {
    // Get author
    const authorEl = postEl.querySelector('faceplate-tracker[noun="user"]');
    const author = authorEl?.getAttribute('source') ||
                   (postEl as any).author ||
                   undefined;

    // Get post text
    const textBody = postEl.querySelector('div[slot="text-body"]');
    const title = postEl.querySelector('h1, [slot="title"]');

    let text = '';
    if (title) text += safeTextContent(title) + '\n';
    if (textBody) text += safeTextContent(textBody);

    text = text.trim();

    if (!text) return null;

    // Get age hint
    const timeago = postEl.querySelector('faceplate-timeago');
    const ageHint = timeago ? parseAgeHint(safeTextContent(timeago)) : undefined;

    // Get metrics
    const upvoteCount = (postEl as any).upvoteCount ||
                        postEl.getAttribute('score');
    const commentCount = (postEl as any).commentCount ||
                         postEl.querySelector('[aria-label*="comment"]')?.textContent;

    const metrics: ParsedPost['metrics'] = {};
    if (upvoteCount) {
      const parsed = parseNumberWithSuffix(String(upvoteCount));
      if (parsed !== undefined) metrics.likes = parsed;
    }
    if (commentCount) {
      const parsed = parseNumberWithSuffix(String(commentCount));
      if (parsed !== undefined) metrics.comments = parsed;
    }

    return {
      author,
      text,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing Reddit post:', error);
    return null;
  }
}

/**
 * Process visible posts
 */
const processVisiblePosts = debounce(() => {
  if (!isCapturing) return;

  const posts = document.querySelectorAll('shreddit-post');

  posts.forEach((postEl) => {
    const postId = (postEl as any).id || postEl.getAttribute('id');
    if (!postId || processedPosts.has(postId)) return;

    // Check if visible
    const rect = postEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (!isVisible) return;

    const parsed = parseRedditPost(postEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'reddit', parsed);

    queueEvent(event, accountId, deviceId, sessionId);
    processedPosts.add(postId);

    console.log('Queued Reddit post:', event.id);
  });
}, 500);

/**
 * Setup observers
 */
function setupObservers() {
  // Intersection observer for visibility
  const observer = new IntersectionObserver((entries) => {
    if (!isCapturing) return;

    const hasVisible = entries.some(e => e.isIntersecting);
    if (hasVisible) {
      processVisiblePosts();
    }
  }, { threshold: 0.5 });

  // Observe all posts
  const observePosts = () => {
    document.querySelectorAll('shreddit-post').forEach(post => {
      observer.observe(post);
    });
  };

  observePosts();

  // Watch for new posts
  const mutationObserver = new MutationObserver(() => {
    observePosts();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Scroll handler
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
    console.log('Reddit capture started');
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    console.log('Reddit capture stopped');
  }
});

// Check if already capturing
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: any) => {
  if (response?.state?.isCapturing && response.state.session && response.state.device) {
    isCapturing = true;
    sessionId = response.state.session.sessionId;
    accountId = response.state.session.accountId;
    deviceId = response.state.device.deviceId;
  }
});

// Setup observers
setupObservers();

console.log('Reddit content script loaded');
