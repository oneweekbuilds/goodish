"""
Twitter/X feed capture module.

Reads post data from the live Twitter DOM using Claude-in-Chrome browser tools.
Assumes the user is already logged into Twitter in their browser.

Design principles:
- Gentle scraping: reads already-loaded DOM, doesn't rapidly cycle pages
- Reasonable delays between scroll actions
- No login automation
- Captures what's visible, like a human reading their feed
"""

from __future__ import annotations

import json
import time
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..common.schema import (
    CapturedPost,
    CaptureSnapshot,
    FeedMetadata,
    PostEngagement,
)


# JavaScript to extract all visible tweets from the DOM
# This runs in the browser context via Claude-in-Chrome
EXTRACT_TWEETS_JS = """
(() => {
    const tweets = [];
    const articles = document.querySelectorAll('article[data-testid="tweet"]');

    articles.forEach((article, index) => {
        try {
            // --- Author info ---
            const userNameDiv = article.querySelector('div[data-testid="User-Name"]');
            let handle = '';
            let displayName = '';

            if (userNameDiv) {
                // Get all links in the User-Name div
                const links = userNameDiv.querySelectorAll('a[role="link"]');
                for (const link of links) {
                    const href = link.getAttribute('href') || '';
                    // Handle link starts with / and doesn't contain /status/
                    if (href.startsWith('/') && !href.includes('/status/') && !href.includes('/analytics')) {
                        handle = href.replace('/', '').split('/')[0];
                        break;
                    }
                }
                // Display name is usually the first text node in the first link
                const nameSpans = userNameDiv.querySelectorAll('span');
                if (nameSpans.length > 0) {
                    displayName = nameSpans[0].textContent.trim();
                }
            }

            // --- Post text ---
            const textDiv = article.querySelector('div[data-testid="tweetText"]');
            const contentText = textDiv ? textDiv.textContent.trim() : '';

            // --- Hashtags ---
            const hashtags = [];
            if (textDiv) {
                const hashtagLinks = textDiv.querySelectorAll('a[href^="/hashtag/"]');
                hashtagLinks.forEach(a => {
                    hashtags.push(a.textContent.trim());
                });
            }

            // --- Engagement metrics ---
            function getMetricCount(testId) {
                const btn = article.querySelector(`button[data-testid="${testId}"]`);
                if (!btn) return 0;
                const label = btn.getAttribute('aria-label') || '';
                // Parse numbers like "123 replies", "1.2K likes", "5M views"
                const match = label.match(/([\\d,.]+[KMB]?)\\s/i);
                if (!match) return 0;
                return parseCount(match[1]);
            }

            function parseCount(str) {
                if (!str) return 0;
                str = str.replace(/,/g, '');
                const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
                const suffix = str.slice(-1).toUpperCase();
                if (multipliers[suffix]) {
                    return Math.round(parseFloat(str.slice(0, -1)) * multipliers[suffix]);
                }
                return parseInt(str, 10) || 0;
            }

            const replies = getMetricCount('reply');
            const retweets = getMetricCount('retweet');
            const likes = getMetricCount('like') || getMetricCount('unlike');

            // Views — often in an analytics link
            let views = 0;
            const analyticsLink = article.querySelector('a[href$="/analytics"]');
            if (analyticsLink) {
                const viewLabel = analyticsLink.getAttribute('aria-label') || '';
                const viewMatch = viewLabel.match(/([\\d,.]+[KMB]?)\\s/i);
                if (viewMatch) views = parseCount(viewMatch[1]);
            }

            // --- Content type detection ---
            let contentType = 'text';
            if (article.querySelector('div[data-testid="videoComponent"]')) {
                contentType = 'video';
            } else if (article.querySelector('div[data-testid="tweetPhoto"]')) {
                contentType = 'image';
            } else if (article.querySelector('div[data-testid="card.wrapper"]')) {
                contentType = 'link';
            }

            // --- Media URLs ---
            const mediaUrls = [];
            const images = article.querySelectorAll('div[data-testid="tweetPhoto"] img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.includes('profile_images')) mediaUrls.push(src);
            });

            // --- Timestamp ---
            const timeEl = article.querySelector('time[datetime]');
            const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;

            // --- Ad/Promoted detection ---
            let isAd = false;
            const socialContexts = article.querySelectorAll('span[data-testid="socialContext"]');
            socialContexts.forEach(span => {
                const text = span.textContent.toLowerCase();
                if (text.includes('promoted') || text.includes('ad')) {
                    isAd = true;
                }
            });
            // Also check for "Ad" label in other locations
            const allSpans = article.querySelectorAll('span');
            for (const span of allSpans) {
                if (span.textContent.trim() === 'Ad' && span.closest('[data-testid="placementTracking"]')) {
                    isAd = true;
                    break;
                }
            }

            // --- Repost detection ---
            let isRepost = false;
            let originalAuthor = null;
            socialContexts.forEach(span => {
                const text = span.textContent;
                if (text.includes('reposted') || text.includes('retweeted')) {
                    isRepost = true;
                }
            });

            // --- Post ID (from permalink) ---
            let postId = '';
            const timeLink = article.querySelector('a[href*="/status/"]');
            if (timeLink) {
                const href = timeLink.getAttribute('href') || '';
                const statusMatch = href.match(/\\/status\\/(\\d+)/);
                if (statusMatch) postId = statusMatch[1];
            }

            tweets.push({
                id: postId || `tweet_${index}_${Date.now()}`,
                author: handle,
                author_display_name: displayName,
                content_text: contentText,
                content_type: contentType,
                media_urls: mediaUrls,
                engagement: {
                    likes: likes,
                    comments: replies,
                    shares: retweets,
                    views: views,
                    bookmarks: 0
                },
                timestamp: timestamp,
                is_ad: isAd,
                is_repost: isRepost,
                original_author: originalAuthor,
                position_in_feed: index,
                hashtags: hashtags,
                metadata: {}
            });
        } catch (e) {
            // Skip problematic tweets but log the error
            tweets.push({
                id: `error_${index}`,
                author: 'EXTRACTION_ERROR',
                content_text: `Error extracting tweet: ${e.message}`,
                content_type: 'text',
                media_urls: [],
                engagement: { likes: 0, comments: 0, shares: 0, views: 0, bookmarks: 0 },
                timestamp: null,
                is_ad: false,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: [],
                metadata: { extraction_error: e.message }
            });
        }
    });

    return JSON.stringify({
        tweet_count: tweets.length,
        tweets: tweets,
        page_url: window.location.href,
        extracted_at: new Date().toISOString()
    });
})()
"""

# JavaScript to check login state
CHECK_LOGIN_JS = """
(() => {
    // Check for common logged-in indicators
    const hasNav = document.querySelector('nav[aria-label="Primary"]') !== null;
    const hasHome = document.querySelector('a[data-testid="AppTabBar_Home_Link"]') !== null;
    const hasCompose = document.querySelector('a[data-testid="SideNav_NewTweet_Button"]') !== null;
    const url = window.location.href;

    return JSON.stringify({
        likely_logged_in: hasNav || hasHome || hasCompose,
        indicators: { hasNav, hasHome, hasCompose },
        current_url: url
    });
})()
"""

# JavaScript to get current feed type
CHECK_FEED_TYPE_JS = """
(() => {
    const url = window.location.href;
    if (url.includes('/home/following')) return 'following';
    if (url.includes('/home') || url.includes('/foryou')) return 'for_you';
    if (url.includes('/explore')) return 'explore';
    if (url.includes('/search')) return 'search';
    return 'unknown';
})()
"""


def parse_extracted_tweets(raw_json: str) -> List[CapturedPost]:
    """Parse the JSON string returned by EXTRACT_TWEETS_JS into CapturedPost models."""
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError:
        return []

    posts = []
    for tweet_data in data.get("tweets", []):
        try:
            engagement = PostEngagement(
                likes=tweet_data.get("engagement", {}).get("likes", 0),
                comments=tweet_data.get("engagement", {}).get("comments", 0),
                shares=tweet_data.get("engagement", {}).get("shares", 0),
                views=tweet_data.get("engagement", {}).get("views", 0),
                bookmarks=tweet_data.get("engagement", {}).get("bookmarks", 0),
            )
            post = CapturedPost(
                id=tweet_data.get("id", ""),
                author=tweet_data.get("author", ""),
                author_display_name=tweet_data.get("author_display_name"),
                content_text=tweet_data.get("content_text", ""),
                content_type=tweet_data.get("content_type", "text"),
                media_urls=tweet_data.get("media_urls", []),
                engagement=engagement,
                timestamp=tweet_data.get("timestamp"),
                is_ad=tweet_data.get("is_ad", False),
                is_repost=tweet_data.get("is_repost", False),
                original_author=tweet_data.get("original_author"),
                position_in_feed=tweet_data.get("position_in_feed", 0),
                hashtags=tweet_data.get("hashtags", []),
                metadata=tweet_data.get("metadata", {}),
            )
            posts.append(post)
        except Exception:
            continue

    return posts


def build_snapshot(
    posts: List[CapturedPost],
    feed_type: str = "for_you",
    screenshot_path: Optional[str] = None,
    scroll_depth: str = "unknown",
    capture_duration: Optional[float] = None,
) -> CaptureSnapshot:
    """Build a CaptureSnapshot from extracted posts."""
    now = datetime.now(timezone.utc).isoformat()

    return CaptureSnapshot(
        platform="twitter",
        capture_timestamp=now,
        screenshot_path=screenshot_path,
        posts=posts,
        feed_metadata=FeedMetadata(
            total_posts_captured=len(posts),
            scroll_depth=scroll_depth,
            feed_type=feed_type,
            capture_duration_seconds=capture_duration,
        ),
        capture_config={
            "platform": "twitter",
            "account": "@goodish_org",
            "feed_type": feed_type,
        },
    )
