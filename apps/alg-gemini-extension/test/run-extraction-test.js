#!/usr/bin/env node
/**
 * HTML Snapshot Test Harness for AlgorithmLens Extension
 *
 * This script loads saved HTML snapshots and runs the extraction functions
 * against them, allowing rapid iteration on fixes without manual browser testing.
 *
 * Usage:
 *   node test/run-extraction-test.js snapshots/instagram_desktop.html instagram
 *   node test/run-extraction-test.js snapshots/twitter.html twitter
 *   node test/run-extraction-test.js  (runs all snapshots)
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const Colors = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  END: '\x1b[0m'
};

/**
 * Load and parse an HTML file using jsdom
 */
function loadHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html, {
    url: 'https://www.instagram.com/', // Default URL, will be overridden based on platform
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  return dom;
}

/**
 * Detect platform from HTML content or filename
 */
function detectPlatform(filePath, document) {
  const filename = path.basename(filePath).toLowerCase();

  if (filename.includes('instagram') || filename.includes('ig_')) {
    if (filename.includes('reel')) return 'instagram-reels';
    return 'instagram';
  }
  if (filename.includes('twitter') || filename.includes('x_')) return 'twitter';
  if (filename.includes('tiktok')) return 'tiktok';
  if (filename.includes('facebook') || filename.includes('fb_')) return 'facebook';
  if (filename.includes('youtube') || filename.includes('yt_')) return 'youtube';

  // Try to detect from HTML content
  const html = document.documentElement.outerHTML.toLowerCase();
  if (html.includes('instagram.com')) return 'instagram';
  if (html.includes('twitter.com') || html.includes('x.com')) return 'twitter';
  if (html.includes('tiktok.com')) return 'tiktok';
  if (html.includes('facebook.com')) return 'facebook';
  if (html.includes('youtube.com')) return 'youtube';

  return 'unknown';
}

// ============================================================================
// EXTRACTION FUNCTIONS (copied from content.js and adapted for Node.js)
// ============================================================================

function safeQuery(container, selector) {
  try {
    return container.querySelector(selector);
  } catch (e) {
    return null;
  }
}

function safeQueryAll(container, selector) {
  try {
    return Array.from(container.querySelectorAll(selector));
  } catch (e) {
    return [];
  }
}

function safeText(el) {
  if (!el) return null;
  return (el.textContent || el.innerText || '').trim();
}

function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
}

function isValidCreator(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();

  if (t.length === 0 || t.length >= 100) return false;
  if (t.includes('·') || t.includes(' hr') || t.includes(' min')) return false;
  if (/^\d+[hmd]?\s*(ago)?$/i.test(t)) return false;
  if (/^(just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;
  if (/^\d+\s*$/.test(t)) return false;
  if (/^(like|comment|share|reply|see more|sponsored|ad|suggested for you|follow|following|message)$/i.test(t)) return false;

  const invalidCreatorPrefixes = [
    'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'x ',
    'meta', 'reels', 'stories', 'explore', 'home', 'search',
    'notifications', 'messages', 'profile', 'settings',
    'original audio', 'original sound', 'audio',
    'see translation', 'translate', 'more',
    'verified', 'public figure', 'creator',
    'follow', 'suggested', 'sponsored'
  ];

  for (const prefix of invalidCreatorPrefixes) {
    if (tLower === prefix || tLower.startsWith(prefix + ' ') || tLower.startsWith(prefix + '•')) {
      return false;
    }
  }
  if (tLower === 'x') return false;
  if (/^(view|show|hide|load|open|close|expand|collapse)\s/i.test(t)) return false;

  return true;
}

function isValidCaption(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();

  if (t.length <= 10) return false;
  if (/^(\d+[hmd]?\s*(ago)?|just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;
  if (/^(like|comment|share|reply|see more|sponsored|ad|follow|message)$/i.test(t)) return false;
  if (/^(all reactions|comments|shares):/i.test(t)) return false;
  if (/^\d+\s*(likes?|comments?|shares?|views?)$/i.test(t)) return false;

  const reelsUIPatterns = [
    'audio is muted', 'click to unmute', 'tap to unmute', 'muted',
    'original audio', 'original sound', 'reels', 'send message',
    'view more comments', 'add a comment', 'view all', 'more posts from',
    'suggested for you', 'based on your activity', 'because you watched',
    'similar to posts you', 'posts you may like', 'show fewer posts like this',
    'not interested', 'why am i seeing this', 'save to collection',
    'copy link', 'share to'
  ];

  for (const pattern of reelsUIPatterns) {
    if (tLower === pattern || tLower.startsWith(pattern + ' ')) return false;
  }

  return true;
}

function isNonPostModule(container, platform) {
  const text = (container.textContent || "").toLowerCase();
  if (!text) return false;

  // Platform-agnostic exclusions
  if (
    text.includes("people you may know") ||
    text.includes("add friend") ||
    text.includes("mutual friends") ||
    (text.includes("suggested") && container.querySelector("button"))
  ) {
    return true;
  }

  if (platform === "instagram") {
    const hasPostPermalink = !!container.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
    const hasCreatorLink = !!container.querySelector('header a[href^="/"]');
    const hasTimeElement = !!container.querySelector('time[datetime]');
    const looksLikePost = hasPostPermalink || (hasCreatorLink && hasTimeElement);

    if (looksLikePost) {
      return false;
    }

    const headerEl = container.querySelector('header, nav, div[role="navigation"]');
    const headerText = headerEl ? (headerEl.textContent || '').toLowerCase() : '';

    if (
      headerText.includes("suggested for you") ||
      headerText.includes("accounts you might like") ||
      text.includes("try these reels") ||
      text.includes("top reels") ||
      text.includes("new for you") ||
      text.includes("posts you've liked") ||
      text.includes("based on your activity") ||
      (container.querySelectorAll('button').length >= 3 && text.includes("follow"))
    ) {
      return true;
    }
  }

  if (platform === "twitter") {
    if (
      text.includes("who to follow") ||
      text.includes("topics to follow") ||
      text.includes("you might like") ||
      text.includes("users to follow") ||
      text.includes("subscribe to") ||
      text.includes("get verified") ||
      text.includes("trending now") ||
      text.includes("what's happening") ||
      (text.includes("follow") && container.querySelectorAll('button').length >= 3 && !container.querySelector('[data-testid="tweetText"]'))
    ) {
      return true;
    }

    const hasMultipleAvatars = container.querySelectorAll('img[src*="profile_images"]').length >= 2;
    const hasTweetText = !!container.querySelector('[data-testid="tweetText"]');
    if (hasMultipleAvatars && !hasTweetText) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// INSTAGRAM EXTRACTION
// ============================================================================

function extractInstagramCreator(container) {
  const creatorSelectors = [
    'header a[href*="/"]',
    'a[class*="notranslate"]',
    'span[class*="_aap6"] a',
    'a[role="link"][tabindex="0"]',
    'header span a',
    'header a[href^="/"]'
  ];

  for (const sel of creatorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      let creator = safeText(el);
      if (!creator) {
        const href = el.getAttribute('href') || '';
        if (href.startsWith('/')) {
          creator = href.replace(/\//g, '').split('?')[0];
        }
      }
      if (creator && !creator.includes(' ') && creator.length > 0 && creator.length < 50) {
        if (isValidCreator(creator)) {
          return creator;
        }
      }
    }
  }

  return null;
}

function extractInstagramCaption(container) {
  const captionSelectors = [
    'div[class*="_a9zs"]',
    'span[class*="_aacl"]',
    'ul li span',
    'div[class*="x1i10hfl"]',
    'div[class*="x1vvkbs"]',
    'span[dir="auto"]'
  ];

  for (const sel of captionSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const caption = safeText(el);
      if (caption && caption.length > 10 && isValidCaption(caption)) {
        return caption;
      }
    }
  }

  return null;
}

function extractInstagramPost(container, index) {
  if (isNonPostModule(container, 'instagram')) {
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractInstagramCreator(container);
  const caption = extractInstagramCaption(container);

  // Extract hashtags
  let hashtags = [];
  const hashtagEls = safeQueryAll(container, 'a[href*="/explore/tags/"], a[href*="/tags/"]');
  for (const el of hashtagEls) {
    let tag = safeText(el);
    if (tag && tag.startsWith('#')) {
      hashtags.push(tag);
    } else {
      const href = el.getAttribute('href') || '';
      const match = href.match(/\/(?:explore\/)?tags\/([^/?]+)/);
      if (match && match[1]) {
        hashtags.push('#' + decodeURIComponent(match[1]));
      }
    }
  }
  if (hashtags.length === 0) {
    hashtags = extractHashtags(caption);
  }
  hashtags = [...new Set(hashtags)];

  // Check for sponsored
  const headerText = safeText(safeQuery(container, 'header')) || '';
  const isSponsored = headerText.toLowerCase().includes('sponsored') ||
                      headerText.toLowerCase().includes('paid partnership');

  // Extract link
  let link = null;
  const linkEl = safeQuery(container, 'a[href*="/p/"], a[href*="/reel/"]');
  if (linkEl) {
    link = linkEl.getAttribute('href');
    if (link && !link.startsWith('http')) {
      link = 'https://www.instagram.com' + link;
    }
  }

  return {
    platform: 'instagram',
    creator,
    caption: caption ? caption.slice(0, 200) : null,
    hashtags,
    isSponsored,
    link,
    _index: index
  };
}

function scanInstagramPosts(document) {
  const containerSelectors = [
    'article[role="presentation"]',
    'article',
    'div[class*="_aagv"]'
  ];

  let containers = [];
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    const filtered = found.filter(el => el.querySelector('img, video'));
    if (filtered.length > 0) {
      containers = filtered;
      break;
    }
  }

  const posts = [];
  const rejections = { NON_POST_MODULE: 0 };

  containers.forEach((container, index) => {
    const result = extractInstagramPost(container, index);
    if (result.rejected) {
      rejections[result.code] = (rejections[result.code] || 0) + 1;
    } else {
      posts.push(result);
    }
  });

  return { posts, rejections, totalContainers: containers.length };
}

// ============================================================================
// TWITTER EXTRACTION
// ============================================================================

function extractTwitterCreator(container) {
  const userNameEl = safeQuery(container, '[data-testid="User-Name"]');
  if (userNameEl) {
    const links = safeQueryAll(userNameEl, 'a[href^="/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/^\/([^/?]+)\/?$/);
      if (match && match[1] && !match[1].includes('status')) {
        if (isValidCreator(match[1])) {
          return match[1];
        }
      }
    }
  }
  return null;
}

function extractTwitterCaption(container) {
  const tweetTextEl = safeQuery(container, '[data-testid="tweetText"]');
  if (tweetTextEl) {
    const text = safeText(tweetTextEl);
    if (text && isValidCaption(text)) {
      return text;
    }
  }
  return null;
}

function extractTwitterPost(container, index) {
  if (isNonPostModule(container, 'twitter')) {
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractTwitterCreator(container);
  const caption = extractTwitterCaption(container);

  // Extract hashtags - multiple methods
  let hashtags = [];

  // Method 1: Links with /hashtag/
  const hashtagLinks = safeQueryAll(container, 'a[href*="/hashtag/"]');
  for (const el of hashtagLinks) {
    const href = el.getAttribute('href') || '';
    const match = href.match(/\/hashtag\/([^?/]+)/);
    if (match && match[1]) {
      hashtags.push('#' + decodeURIComponent(match[1]));
    }
  }

  // Method 2: Links starting with #
  if (hashtags.length === 0) {
    const allLinks = safeQueryAll(container, 'a');
    for (const el of allLinks) {
      const text = safeText(el) || '';
      if (text.startsWith('#') && text.length > 1 && text.length < 50 && !text.includes(' ')) {
        hashtags.push(text);
      }
    }
  }

  // Method 3: From caption
  if (hashtags.length === 0) {
    hashtags = extractHashtags(caption);
  }

  hashtags = [...new Set(hashtags)];

  // Check for sponsored (Ad label)
  const isSponsored = !!safeQuery(container, '[data-testid="placementTracking"]') ||
                      (container.textContent || '').toLowerCase().includes('promoted');

  // Extract link
  let link = null;
  const statusLink = safeQuery(container, 'a[href*="/status/"]');
  if (statusLink) {
    link = statusLink.getAttribute('href');
    if (link && !link.startsWith('http')) {
      link = 'https://twitter.com' + link;
    }
  }

  return {
    platform: 'twitter',
    creator,
    caption: caption ? caption.slice(0, 200) : null,
    hashtags,
    isSponsored,
    link,
    _index: index
  };
}

function scanTwitterPosts(document) {
  const containerSelectors = [
    'article[data-testid="tweet"]',
    'article[role="article"]'
  ];

  let containers = [];
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers = found;
      break;
    }
  }

  // Filter and dedupe
  containers = containers.filter(el => {
    const text = el.textContent || '';
    return text.length > 20;
  });

  const posts = [];
  const rejections = { NON_POST_MODULE: 0 };

  containers.forEach((container, index) => {
    const result = extractTwitterPost(container, index);
    if (result.rejected) {
      rejections[result.code] = (rejections[result.code] || 0) + 1;
    } else {
      posts.push(result);
    }
  });

  return { posts, rejections, totalContainers: containers.length };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

function runTest(filePath, forcePlatform = null) {
  console.log(`\n${Colors.BOLD}${'='.repeat(70)}${Colors.END}`);
  console.log(`${Colors.CYAN}Testing: ${path.basename(filePath)}${Colors.END}`);
  console.log(`${'='.repeat(70)}`);

  if (!fs.existsSync(filePath)) {
    console.log(`${Colors.RED}File not found: ${filePath}${Colors.END}`);
    return null;
  }

  const dom = loadHTML(filePath);
  const document = dom.window.document;

  let platform = forcePlatform || detectPlatform(filePath, document);
  console.log(`${Colors.DIM}Detected platform: ${platform}${Colors.END}\n`);

  let result;
  if (platform === 'instagram' || platform === 'instagram-reels') {
    result = scanInstagramPosts(document);
  } else if (platform === 'twitter') {
    result = scanTwitterPosts(document);
  } else {
    console.log(`${Colors.YELLOW}Unknown platform: ${platform}. Trying Instagram...${Colors.END}`);
    result = scanInstagramPosts(document);
  }

  // Print results
  console.log(`${Colors.BOLD}Results:${Colors.END}`);
  console.log(`  Total containers found: ${result.totalContainers}`);
  console.log(`  ${Colors.GREEN}Posts extracted: ${result.posts.length}${Colors.END}`);

  if (Object.keys(result.rejections).length > 0) {
    console.log(`  ${Colors.YELLOW}Rejections:${Colors.END}`);
    for (const [code, count] of Object.entries(result.rejections)) {
      if (count > 0) {
        console.log(`    ${code}: ${count}`);
      }
    }
  }

  console.log(`\n${Colors.BOLD}Extracted Posts:${Colors.END}`);
  result.posts.forEach((post, i) => {
    console.log(`\n  ${Colors.CYAN}Post ${i + 1}:${Colors.END}`);
    console.log(`    Creator: ${post.creator || '(none)'}`);
    console.log(`    Caption: ${post.caption ? post.caption.slice(0, 80) + '...' : '(none)'}`);
    console.log(`    Hashtags: ${post.hashtags.length > 0 ? post.hashtags.join(', ') : '(none)'}`);
    console.log(`    Sponsored: ${post.isSponsored ? 'YES' : 'no'}`);
    console.log(`    Link: ${post.link || '(none)'}`);
  });

  // Summary stats
  console.log(`\n${Colors.BOLD}Summary Stats:${Colors.END}`);
  const withCreator = result.posts.filter(p => p.creator).length;
  const withCaption = result.posts.filter(p => p.caption).length;
  const withHashtags = result.posts.filter(p => p.hashtags.length > 0).length;
  const sponsored = result.posts.filter(p => p.isSponsored).length;

  console.log(`  With creator: ${withCreator}/${result.posts.length} (${Math.round(withCreator/result.posts.length*100) || 0}%)`);
  console.log(`  With caption: ${withCaption}/${result.posts.length} (${Math.round(withCaption/result.posts.length*100) || 0}%)`);
  console.log(`  With hashtags: ${withHashtags}/${result.posts.length} (${Math.round(withHashtags/result.posts.length*100) || 0}%)`);
  console.log(`  Sponsored/ads: ${sponsored}/${result.posts.length}`);

  return result;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // Run all snapshots in the snapshots directory
  const snapshotsDir = path.join(__dirname, 'snapshots');
  if (!fs.existsSync(snapshotsDir)) {
    console.log(`${Colors.YELLOW}No snapshots directory found. Please create: ${snapshotsDir}${Colors.END}`);
    console.log(`\nThen add HTML files like:`);
    console.log(`  - instagram_desktop.html`);
    console.log(`  - instagram_reels.html`);
    console.log(`  - twitter.html`);
    process.exit(1);
  }

  const files = fs.readdirSync(snapshotsDir).filter(f => f.endsWith('.html'));
  if (files.length === 0) {
    console.log(`${Colors.YELLOW}No HTML files found in ${snapshotsDir}${Colors.END}`);
    console.log(`\nPlease add HTML snapshots to test.`);
    process.exit(1);
  }

  console.log(`${Colors.BOLD}Running tests on ${files.length} snapshot(s)...${Colors.END}`);
  for (const file of files) {
    runTest(path.join(snapshotsDir, file));
  }
} else {
  // Run specific file
  const filePath = args[0];
  const platform = args[1] || null;
  runTest(filePath, platform);
}
