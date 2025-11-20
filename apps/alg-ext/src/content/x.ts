/**
 * X (Twitter) content script
 *
 * Selector notes:
 * - Tweet containers: article[data-testid="tweet"]
 * - Author: div[data-testid="User-Name"] a
 * - Tweet text: div[data-testid="tweetText"]
 * - Time: time element
 * - Replies: div[data-testid="reply"]
 * - Retweets: div[data-testid="retweet"]
 * - Likes: div[data-testid="like"]
 */

import { createLensEvent, queueEvent, safeTextContent, ParsedPost } from './common';
import { parseAgeHint, parseNumberWithSuffix, debounce } from '../utils';
import type { Message } from '../types';

let isCapturing = false;
let sessionId = '';
let accountId = '';
let deviceId = '';
const processedTweets = new Set<string>();

/**
 * Parse an X/Twitter tweet element
 */
function parseXTweet(tweetEl: Element): ParsedPost | null {
  try {
    // Get author
    const userNameEl = tweetEl.querySelector('div[data-testid="User-Name"] a');
    const author = safeTextContent(userNameEl) || undefined;

    // Get tweet text
    const tweetTextEl = tweetEl.querySelector('div[data-testid="tweetText"]');
    const text = safeTextContent(tweetTextEl);

    if (!text) return null;

    // Get time
    const timeEl = tweetEl.querySelector('time');
    const ageHint = timeEl ? parseAgeHint(timeEl.getAttribute('datetime') || safeTextContent(timeEl)) : undefined;

    // Get metrics
    const metrics: ParsedPost['metrics'] = {};

    // Replies
    const replyBtn = tweetEl.querySelector('[data-testid="reply"]');
    if (replyBtn) {
      const replyText = safeTextContent(replyBtn);
      const replies = parseNumberWithSuffix(replyText);
      if (replies !== undefined) metrics.comments = replies;
    }

    // Retweets
    const retweetBtn = tweetEl.querySelector('[data-testid="retweet"]');
    if (retweetBtn) {
      const retweetText = safeTextContent(retweetBtn);
      const retweets = parseNumberWithSuffix(retweetText);
      if (retweets !== undefined) metrics.reposts = retweets;
    }

    // Likes
    const likeBtn = tweetEl.querySelector('[data-testid="like"]');
    if (likeBtn) {
      const likeText = safeTextContent(likeBtn);
      const likes = parseNumberWithSuffix(likeText);
      if (likes !== undefined) metrics.likes = likes;
    }

    return {
      author,
      text,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing X tweet:', error);
    return null;
  }
}

/**
 * Process visible tweets
 */
const processVisibleTweets = debounce(() => {
  if (!isCapturing) return;

  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach((tweetEl, index) => {
    // Try to get tweet ID from link, fallback to index
    const tweetLink = tweetEl.querySelector('a[href*="/status/"]');
    const tweetId = tweetLink?.getAttribute('href')?.split('/status/')[1] || `x-${index}`;

    if (processedTweets.has(tweetId)) return;

    const rect = tweetEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    const parsed = parseXTweet(tweetEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'x', parsed);
    queueEvent(event, accountId, deviceId, sessionId);
    processedTweets.add(tweetId);

    console.log('Queued X tweet:', event.id);
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
      processVisibleTweets();
    }
  }, { threshold: 0.5 });

  const observeTweets = () => {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(tweet => {
      observer.observe(tweet);
    });
  };

  observeTweets();

  const mutationObserver = new MutationObserver(() => {
    observeTweets();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener('scroll', processVisibleTweets, { passive: true });
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
    console.log('X capture started');
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    console.log('X capture stopped');
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

console.log('X content script loaded');
