"""
Reddit feed capture module.

Reads post data from the live Reddit DOM using Claude-in-Chrome browser tools.
Assumes the user is already logged into Reddit in their browser.

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


# JavaScript to extract all visible posts from the Reddit DOM
EXTRACT_POSTS_JS = """
(() => {
    const posts = [];

    // New Reddit uses shreddit-post web components
    const postElements = document.querySelectorAll('shreddit-post, article');

    postElements.forEach((post, index) => {
        try {
            // --- Author info ---
            let handle = '';
            let displayName = '';
            let subreddit = '';

            // Try shreddit-post attributes first
            if (post.tagName === 'SHREDDIT-POST') {
                handle = post.getAttribute('author') || '';
                subreddit = post.getAttribute('subreddit-prefixed-name') || '';
            }

            // Fallback to DOM queries
            if (!handle) {
                const authorLink = post.querySelector('a[data-testid="post_author_link"]');
                if (authorLink) {
                    handle = authorLink.textContent.trim().replace('u/', '');
                }
            }

            displayName = handle;

            // --- Post title ---
            let title = '';
            const titleEl = post.querySelector('a[slot="title"], h3');
            if (titleEl) title = titleEl.textContent.trim();

            // --- Post body text ---
            let bodyText = '';
            const bodyEl = post.querySelector('div[slot="text-body"], div[data-click-id="text"]');
            if (bodyEl) bodyText = bodyEl.textContent.trim().substring(0, 500);

            const contentText = bodyText ? `${title} ${bodyText}`.trim() : title;

            // --- Engagement ---
            let score = 0;
            if (post.tagName === 'SHREDDIT-POST') {
                score = parseInt(post.getAttribute('score') || '0', 10);
            }

            let commentCount = 0;
            if (post.tagName === 'SHREDDIT-POST') {
                commentCount = parseInt(post.getAttribute('comment-count') || '0', 10);
            }

            // --- Content type detection ---
            let contentType = 'text';
            if (post.querySelector('shreddit-player, video')) {
                contentType = 'video';
            } else if (post.querySelector('img[alt="Post image"], div[data-click-id="media"] img')) {
                contentType = 'image';
            } else if (post.querySelector('a[data-click-id="body"][href*="://"]')) {
                contentType = 'link';
            }

            // --- Ad/Promoted detection ---
            let isAd = false;
            if (post.tagName === 'SHREDDIT-POST' && post.hasAttribute('is-promoted')) {
                isAd = true;
            }
            if (!isAd) {
                const spans = post.querySelectorAll('span');
                for (const span of spans) {
                    if (span.textContent.trim().toLowerCase() === 'promoted') {
                        isAd = true;
                        break;
                    }
                }
            }

            posts.push({
                id: `reddit_${handle}_${index}_${Date.now()}`,
                author: handle,
                author_display_name: displayName || handle,
                content_text: contentText,
                content_type: contentType,
                media_urls: [],
                engagement: {
                    likes: score,
                    comments: commentCount,
                    shares: 0,
                    views: 0,
                    bookmarks: 0
                },
                timestamp: null,
                is_ad: isAd,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: [],
                metadata: { subreddit: subreddit }
            });
        } catch (e) {
            posts.push({
                id: `reddit_error_${index}`,
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
    const hasNav = document.querySelector('nav, header') !== null;
    const hasFeed = document.querySelector('shreddit-feed, div[data-testid="posts-list"]') !== null;
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
    feed_type: str = "home",
    screenshot_path: Optional[str] = None,
    scroll_depth: str = "unknown",
    capture_duration: Optional[float] = None,
) -> CaptureSnapshot:
    """Build a CaptureSnapshot from extracted posts."""
    now = datetime.now(timezone.utc).isoformat()

    return CaptureSnapshot(
        platform="reddit",
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
            "platform": "reddit",
            "feed_type": feed_type,
        },
    )
