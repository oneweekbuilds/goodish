/**
 * YouTube content script
 *
 * Selector notes:
 * - Video containers: ytd-rich-item-renderer (grid), ytd-video-renderer (list)
 * - Video title: #video-title
 * - Channel: #channel-name or ytd-channel-name a
 * - Metadata: #metadata-line span (views, time)
 * - Description: #description-text (watch page)
 * - Comments: ytd-comment-renderer
 */

import { createLensEvent, queueEvent, safeTextContent, ParsedPost } from './common';
import { parseAgeHint, parseNumberWithSuffix, debounce } from '../utils';
import type { Message } from '../types';

let isCapturing = false;
let sessionId = '';
let accountId = '';
let deviceId = '';
const processedItems = new Set<string>();

/**
 * Parse a YouTube video element
 */
function parseYouTubeVideo(videoEl: Element): ParsedPost | null {
  try {
    // Get title
    const titleEl = videoEl.querySelector('#video-title, #video-title-link');
    const title = safeTextContent(titleEl);

    if (!title) return null;

    // Get channel name
    const channelEl = videoEl.querySelector('#channel-name a, ytd-channel-name a');
    const author = safeTextContent(channelEl) || undefined;

    // Get metadata (views and time)
    const metadataSpans = videoEl.querySelectorAll('#metadata-line span');
    let ageHint: string | undefined;
    let views: number | undefined;

    metadataSpans.forEach(span => {
      const text = safeTextContent(span);
      if (text.includes('ago')) {
        ageHint = parseAgeHint(text);
      } else if (text.includes('view')) {
        const match = text.match(/([\d.,KMB]+)/);
        if (match) {
          views = parseNumberWithSuffix(match[1]);
        }
      }
    });

    const metrics: ParsedPost['metrics'] = {};
    if (views !== undefined) metrics.views = views;

    return {
      author,
      text: title,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing YouTube video:', error);
    return null;
  }
}

/**
 * Parse a YouTube comment
 */
function parseYouTubeComment(commentEl: Element): ParsedPost | null {
  try {
    const authorEl = commentEl.querySelector('#author-text');
    const author = safeTextContent(authorEl) || undefined;

    const contentEl = commentEl.querySelector('#content-text');
    const text = safeTextContent(contentEl);

    if (!text) return null;

    const timeEl = commentEl.querySelector('.published-time-text a');
    const ageHint = timeEl ? parseAgeHint(safeTextContent(timeEl)) : undefined;

    // Get likes
    const likeBtn = commentEl.querySelector('#vote-count-middle');
    const likesText = safeTextContent(likeBtn);
    let likes: number | undefined;
    if (likesText) {
      likes = parseNumberWithSuffix(likesText);
    }

    const metrics: ParsedPost['metrics'] = {};
    if (likes !== undefined) metrics.likes = likes;

    return {
      author,
      text,
      ageHint,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined
    };
  } catch (error) {
    console.error('Error parsing YouTube comment:', error);
    return null;
  }
}

/**
 * Process visible content
 */
const processVisibleContent = debounce(() => {
  if (!isCapturing) return;

  // Process videos
  const videos = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
  videos.forEach((videoEl) => {
    const videoId = videoEl.querySelector('a')?.getAttribute('href');
    if (!videoId || processedItems.has(videoId)) return;

    const rect = videoEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    const parsed = parseYouTubeVideo(videoEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'youtube', parsed);
    queueEvent(event, accountId, deviceId, sessionId);
    processedItems.add(videoId);

    console.log('Queued YouTube video:', event.id);
  });

  // Process comments
  const comments = document.querySelectorAll('ytd-comment-renderer');
  comments.forEach((commentEl) => {
    const commentId = (commentEl as any).data?.commentId;
    if (!commentId || processedItems.has(commentId)) return;

    const rect = commentEl.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;

    const parsed = parseYouTubeComment(commentEl);
    if (!parsed) return;

    const event = createLensEvent(sessionId, 'youtube', parsed);
    queueEvent(event, accountId, deviceId, sessionId);
    processedItems.add(commentId);

    console.log('Queued YouTube comment:', event.id);
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
      processVisibleContent();
    }
  }, { threshold: 0.3 });

  const observeContent = () => {
    document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-comment-renderer').forEach(item => {
      observer.observe(item);
    });
  };

  observeContent();

  const mutationObserver = new MutationObserver(() => {
    observeContent();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener('scroll', processVisibleContent, { passive: true });
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
    console.log('YouTube capture started');
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    console.log('YouTube capture stopped');
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

console.log('YouTube content script loaded');
