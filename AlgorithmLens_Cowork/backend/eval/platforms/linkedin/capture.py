"""
LinkedIn feed capture module.

Reads post data from the live LinkedIn DOM using Claude-in-Chrome browser tools.
Assumes the user is already logged into LinkedIn in their browser.

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


# JavaScript to extract all visible posts from the LinkedIn DOM
EXTRACT_POSTS_JS = """
(() => {
    const posts = [];
    const updates = document.querySelectorAll('div.feed-shared-update-v2');

    updates.forEach((update, index) => {
        try {
            // --- Author info ---
            let handle = '';
            let displayName = '';
            const actorLink = update.querySelector('a.feed-shared-actor__container-link');
            if (actorLink) {
                const href = actorLink.getAttribute('href') || '';
                handle = href.replace('https://www.linkedin.com/in/', '')
                             .replace('https://www.linkedin.com/company/', '')
                             .replace(/\\/.*$/, '').replace(/\\?.*$/, '');
            }
            const nameEl = update.querySelector('span.feed-shared-actor__name');
            if (nameEl) displayName = nameEl.textContent.trim();

            // --- Post text ---
            let contentText = '';
            const textEl = update.querySelector('span.break-words');
            if (textEl) contentText = textEl.textContent.trim().substring(0, 500);

            // --- Hashtags ---
            const hashtags = [];
            const hashtagLinks = update.querySelectorAll('a[href*="/feed/hashtag/"]');
            hashtagLinks.forEach(a => hashtags.push(a.textContent.trim()));

            // --- Engagement ---
            let likes = 0;
            const reactionEl = update.querySelector('span.social-details-social-counts__reactions-count');
            if (reactionEl) {
                const text = reactionEl.textContent.trim();
                const match = text.match(/([\\d,]+)/);
                if (match) likes = parseInt(match[1].replace(/,/g, ''), 10) || 0;
            }

            // --- Content type detection ---
            let contentType = 'text';
            if (update.querySelector('video, div.feed-shared-external-video')) {
                contentType = 'video';
            } else if (update.querySelector('div.feed-shared-image img')) {
                contentType = 'image';
            } else if (update.querySelector('article.feed-shared-article')) {
                contentType = 'article';
            } else if (update.querySelector('div.feed-shared-document')) {
                contentType = 'document';
            }

            // --- Ad/Promoted detection ---
            let isAd = false;
            const subDesc = update.querySelector('span.feed-shared-actor__sub-description');
            if (subDesc && subDesc.textContent.toLowerCase().includes('promoted')) {
                isAd = true;
            }

            posts.push({
                id: `li_${handle}_${index}_${Date.now()}`,
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
                id: `li_error_${index}`,
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
    const hasNav = document.querySelector('nav') !== null;
    const hasFeed = document.querySelector('div.scaffold-finite-scroll__content') !== null;
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
    feed_type: str = "feed",
    screenshot_path: Optional[str] = None,
    scroll_depth: str = "unknown",
    capture_duration: Optional[float] = None,
) -> CaptureSnapshot:
    """Build a CaptureSnapshot from extracted posts."""
    now = datetime.now(timezone.utc).isoformat()

    return CaptureSnapshot(
        platform="linkedin",
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
            "platform": "linkedin",
            "feed_type": feed_type,
        },
    )
