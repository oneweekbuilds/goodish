/**
 * Instagram content script
 *
 * Selector notes:
 * - Post containers: article (feed posts)
 * - Author: article a[role="link"] (usually first link in header)
 * - Caption: h1 (inside article)
 * - Time: time element
 * - Likes: section button (contains "like" in aria-label)
 * - Comments: look for "View all" or comment count text
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
 * Parse an Instagram post element
 */
function parseInstagramPost(postEl: Element): ParsedPost | null {
  try {
    // Get author (first link in article, usually the profile link)
    const authorLink = postEl.querySelector('header a[role="link"]');
    const author = safeTextContent(authorLink) || undefined;

    // Get caption (h1 or spans in caption area)
    const captionEl = postEl.querySelector('h1') ||
                      postEl.querySelector('span[dir="auto"]');
    const text = safeTextContent(captionEl);

    if (!text) return null;

    // Get time
    const timeEl = postEl.querySelector('time');
    const ageHint = timeEl ? parseAgeHint(timeEl.getAttribute('datetime') || safeTextContent(timeEl)) : undefined;

    // Get likes (button with "like" in text/aria-label)
    const likeBtn = postEl.querySelector('section button, section span');
    const likesText = likeBtn?.textContent;
    let likes: number | undefined;
    if (likesText && /\d/.test(likesText)) {
      const match = likesText.match(/[\d,KMB]+/);
      if (match) {
        likes = parseNumberWithSuffix(match[0]);
      }
    }

    // Get comments (look for "View all" text or comment count)
    const commentLinks = postEl.querySelectorAll('a');
    let comments: number | undefined;
    commentLinks.forEach(link => {
      const text = safeTextContent(link);
      if (text.includes('comment')) {
        const match = text.match(/[\d,KMB]+/);
        if (match) {
          comments = parseNumberWithSuffix(match[0]);
        }
      }
    });

    const metrics: ParsedPost['metrics'] = {};
    if (likes !== undefined) metrics.likes = likes;
    if (comments !== undefined) metrics.comments = comments;

    return {
      author,
      text,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing Instagram post:', error);
    return null;
  }
}

/**
 * Process visible posts
 */
const processVisiblePosts = debounce(() => {
  if (!isCapturing) return;

  const posts = document.querySelectorAll('article[role="presentation"], article');

  posts.forEach((postEl, index) => {
    // Use index as ID since Instagram doesn't expose post IDs easily
    const postId = `ig-${index}`;
    if (processedPosts.has(postId)) return;

    const rect = postEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    const parsed = parseInstagramPost(postEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'instagram', parsed);
    queueEvent(event, accountId, deviceId, sessionId);
    processedPosts.add(postId);

    console.log('Queued Instagram post:', event.id);
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
    document.querySelectorAll('article').forEach(post => {
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
    console.log('Instagram capture started');
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    console.log('Instagram capture stopped');
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

console.log('Instagram content script loaded');
