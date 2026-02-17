"""
Facebook feed capture module.

Reads post data from the live Facebook DOM using Claude-in-Chrome browser tools.
Assumes the user is already logged into Facebook in their browser.

Design principles:
- Gentle scraping: reads already-loaded DOM, doesn't rapidly cycle pages
- Reasonable delays between scroll actions
- No login automation
- Captures what's visible, like a human reading their feed
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional

from ..common.schema import (
    CapturedPost,
    CaptureSnapshot,
    FeedMetadata,
    PostEngagement,
)


# JavaScript to extract all visible posts from the Facebook DOM
EXTRACT_POSTS_JS = """
(() => {
    const posts = [];
    const articles = document.querySelectorAll('div[role="article"]');

    articles.forEach((article, index) => {
        try {
            // --- Author info ---
            let handle = '';
            let displayName = '';
            const authorLink = article.querySelector('strong a[role="link"]');
            if (authorLink) {
                displayName = authorLink.textContent.trim();
                const href = authorLink.getAttribute('href') || '';
                handle = href.replace('https://www.facebook.com/', '').replace(/\\/.*$/, '');
            }

            // --- Post text ---
            let contentText = '';
            const textDivs = article.querySelectorAll('div[dir="auto"]');
            for (const div of textDivs) {
                const text = div.textContent.trim();
                if (text.length > 20) {
                    contentText = text.substring(0, 500);
                    break;
                }
            }

            // --- Hashtags ---
            const hashtags = [];
            const hashtagLinks = article.querySelectorAll('a[href*="hashtag"]');
            hashtagLinks.forEach(a => hashtags.push(a.textContent.trim()));

            // --- Engagement ---
            let likes = 0;
            const reactionSpan = article.querySelector('span[aria-label*="reaction"]');
            if (reactionSpan) {
                const text = reactionSpan.getAttribute('aria-label') || '';
                const match = text.match(/([\d,]+)/);
                if (match) likes = parseInt(match[1].replace(/,/g, ''), 10) || 0;
            }

            // --- Content type detection ---
            let contentType = 'text';
            if (article.querySelector('video')) {
                contentType = 'video';
            } else if (article.querySelector('img[src*="scontent"]')) {
                contentType = 'image';
            }

            // Check for link shares
            if (article.querySelector('a[href*="l.facebook.com"]')) {
                if (contentType === 'text') contentType = 'link';
            }

            // --- Ad/Sponsored detection ---
            let isAd = false;
            const spans = article.querySelectorAll('span, a');
            for (const el of spans) {
                const text = el.textContent.trim().toLowerCase();
                if (text === 'sponsored' || text === 'paid partnership') {
                    isAd = true;
                    break;
                }
            }

            posts.push({
                id: `fb_${handle}_${index}_${Date.now()}`,
                author: handle,
                author_display_name: displayName || handle,
                content_text: contentText,
                content_type: contentType,
                media_urls: [],
                engagement: {
                    likes: likes,
                    comments: 0,
                    shares: 0,
                    views: 0,
                    bookmarks: 0
                },
                timestamp: null,
                is_ad: isAd,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: hashtags,
                metadata: {}
            });
        } catch (e) {
            posts.push({
                id: `fb_error_${index}`,
                author: 'EXTRACTION_ERROR',
                content_text: `Error: ${e.message}`,
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
        post_count: posts.length,
        posts: posts,
        page_url: window.location.href,
        extracted_at: new Date().toISOString()
    });
})()
"""


CHECK_LOGIN_JS = """
(() => {
    const hasNav = document.querySelector('div[role="navigation"]') !== null;
    const hasFeed = document.querySelector('div[role="feed"]') !== null;
    return JSON.stringify({
        likely_logged_in: hasNav && hasFeed,
        indicators: { hasNav, hasFeed },
        current_url: window.location.href
    });
})()
"""


def parse_extracted_posts(raw_json: str) -> List[CapturedPost]:
    """Parse the JSON string returned by EXTRACT_POSTS_JS into CapturedPost models."""
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError:
        return []

    posts = []
    for post_data in data.get("posts", []):
        try:
            engagement = PostEngagement(
                likes=post_data.get("engagement", {}).get("likes", 0),
                comments=post_data.get("engagement", {}).get("comments", 0),
                shares=post_data.get("engagement", {}).get("shares", 0),
                views=post_data.get("engagement", {}).get("views", 0),
                bookmarks=post_data.get("engagement", {}).get("bookmarks", 0),
            )
            post = CapturedPost(
                id=post_data.get("id", ""),
                author=post_data.get("author", ""),
                author_display_name=post_data.get("author_display_name"),
                content_text=post_data.get("content_text", ""),
                content_type=post_data.get("content_type", "text"),
                media_urls=post_data.get("media_urls", []),
                engagement=engagement,
                timestamp=post_data.get("timestamp"),
                is_ad=post_data.get("is_ad", False),
                is_repost=post_data.get("is_repost", False),
                original_author=post_data.get("original_author"),
                position_in_feed=post_data.get("position_in_feed", 0),
                hashtags=post_data.get("hashtags", []),
                metadata=post_data.get("metadata", {}),
            )
            posts.append(post)
        except Exception:
            continue

    return posts


def build_snapshot(
    posts: List[CapturedPost],
    feed_type: str = "news_feed",
    screenshot_path: Optional[str] = None,
    scroll_depth: str = "unknown",
    capture_duration: Optional[float] = None,
) -> CaptureSnapshot:
    """Build a CaptureSnapshot from extracted posts."""
    now = datetime.now(timezone.utc).isoformat()

    return CaptureSnapshot(
        platform="facebook",
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
            "platform": "facebook",
            "feed_type": feed_type,
        },
    )
