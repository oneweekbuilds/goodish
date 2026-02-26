"""
TikTok feed capture module.

Reads video data from the live TikTok DOM using Claude-in-Chrome browser tools.
Assumes the user is already on TikTok in their browser.

Design principles:
- Gentle scraping: reads already-loaded DOM, doesn't rapidly cycle pages
- Reasonable delays between scroll actions
- No login automation
- Captures what's visible, like a human scrolling their feed
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


# JavaScript to extract all visible videos from the TikTok DOM
EXTRACT_VIDEOS_JS = """
(() => {
    const videos = [];

    // TikTok feed items use data-e2e attributes
    const items = document.querySelectorAll(
        'div[data-e2e="recommend-list-item-container"] > div, ' +
        'div[class*="DivItemContainer"]'
    );

    items.forEach((item, index) => {
        try {
            // --- Author info ---
            const authorLink = item.querySelector('a[data-e2e="video-author-uniqueid"], a[href^="/@"]');
            let handle = '';
            if (authorLink) {
                handle = (authorLink.textContent || authorLink.getAttribute('href') || '')
                    .replace(/^\\/@?/, '').trim();
            }

            const nameEl = item.querySelector('span[data-e2e="video-author-nickname"]');
            const displayName = nameEl ? nameEl.textContent.trim() : handle;

            // --- Video description ---
            const descEl = item.querySelector(
                'div[data-e2e="video-desc"], span[data-e2e="new-desc-span"]'
            );
            const contentText = descEl ? descEl.textContent.trim().substring(0, 500) : '';

            // --- Hashtags ---
            const hashtags = [];
            const hashtagLinks = item.querySelectorAll('a[data-e2e="search-common-link"]');
            hashtagLinks.forEach(a => {
                const text = a.textContent.trim();
                if (text.startsWith('#')) hashtags.push(text);
            });

            // --- Engagement metrics ---
            function getCount(selector) {
                const el = item.querySelector(selector);
                if (!el) return 0;
                return parseCount(el.textContent.trim());
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

            const likes = getCount('strong[data-e2e="like-count"]');
            const comments = getCount('strong[data-e2e="comment-count"]');
            const shares = getCount('strong[data-e2e="share-count"]');

            // --- Music info ---
            const musicEl = item.querySelector('a[data-e2e="video-music"]');
            const music = musicEl ? musicEl.textContent.trim() : '';

            // --- Ad/Sponsored detection ---
            let isAd = false;
            const badges = item.querySelectorAll('div[data-e2e="video-card-badge"], span');
            for (const badge of badges) {
                const text = badge.textContent.trim().toLowerCase();
                if (text === 'sponsored' || text === 'ad' || text === 'promoted') {
                    isAd = true;
                    break;
                }
            }

            // --- Video URL/ID ---
            const videoLink = item.querySelector('a[href*="/video/"]');
            let videoId = '';
            if (videoLink) {
                const href = videoLink.getAttribute('href') || '';
                const idMatch = href.match(/\\/video\\/(\\d+)/);
                if (idMatch) videoId = idMatch[1];
            }

            videos.push({
                id: videoId || `tt_${index}_${Date.now()}`,
                author: handle,
                author_display_name: displayName,
                content_text: contentText,
                content_type: 'video',  // TikTok is all video
                media_urls: [],
                engagement: {
                    likes: likes,
                    comments: comments,
                    shares: shares,
                    views: 0,
                    bookmarks: 0
                },
                timestamp: null,
                is_ad: isAd,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: hashtags,
                metadata: {
                    music: music
                }
            });
        } catch (e) {
            videos.push({
                id: `tt_error_${index}`,
                author: 'EXTRACTION_ERROR',
                content_text: `Error: ${e.message}`,
                content_type: 'video',
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
        video_count: videos.length,
        posts: videos,
        page_url: window.location.href,
        extracted_at: new Date().toISOString()
    });
})()
"""


CHECK_LOGIN_JS = """
(() => {
    const hasAvatar = document.querySelector('[data-e2e="profile-icon"]') !== null;
    const hasLogin = document.querySelector('button:has-text("Log in")') !== null;
    return JSON.stringify({
        likely_logged_in: hasAvatar,
        indicators: { hasAvatar, hasLogin },
        current_url: window.location.href
    });
})()
"""


def parse_extracted_videos(raw_json: str) -> List[CapturedPost]:
    """Parse the JSON string returned by EXTRACT_VIDEOS_JS into CapturedPost models."""
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
                content_type="video",  # TikTok is all video
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
    feed_type: str = "for_you",
    screenshot_path: Optional[str] = None,
    scroll_depth: str = "unknown",
    capture_duration: Optional[float] = None,
) -> CaptureSnapshot:
    """Build a CaptureSnapshot from extracted posts."""
    now = datetime.now(timezone.utc).isoformat()

    return CaptureSnapshot(
        platform="tiktok",
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
            "platform": "tiktok",
            "feed_type": feed_type,
        },
    )
