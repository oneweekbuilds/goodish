"""
YouTube feed capture module.

Reads video data from the live YouTube DOM using Claude-in-Chrome browser tools.
Assumes the user is already on YouTube in their browser.

Design principles:
- Gentle scraping: reads already-loaded DOM, doesn't rapidly cycle pages
- Reasonable delays between scroll actions
- No login automation
- Captures what's visible, like a human browsing their feed
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


# JavaScript to extract all visible videos from the YouTube DOM
EXTRACT_VIDEOS_JS = """
(() => {
    const videos = [];

    // Home page video renderers
    const renderers = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer');

    renderers.forEach((renderer, index) => {
        try {
            // --- Video title ---
            const titleEl = renderer.querySelector('#video-title, h3 a#video-title-link, a#video-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            // --- Channel name ---
            const channelEl = renderer.querySelector('#channel-name a, ytd-channel-name a');
            const channelName = channelEl ? channelEl.textContent.trim() : '';
            const channelHandle = channelEl ? (channelEl.getAttribute('href') || '').replace(/^\\/@?/, '').replace(/\\/.*/, '') : '';

            // --- Metadata line (views + time) ---
            const metaLine = renderer.querySelector('#metadata-line');
            let views = 0;
            let publishedTime = '';

            if (metaLine) {
                const spans = metaLine.querySelectorAll('span');
                spans.forEach(span => {
                    const text = span.textContent.trim();
                    const viewMatch = text.match(/([\\d,.]+[KMB]?)\\s*views?/i);
                    if (viewMatch) {
                        views = parseCount(viewMatch[1]);
                    }
                    if (text.match(/ago|hours?|days?|weeks?|months?|years?/i)) {
                        publishedTime = text;
                    }
                });
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

            // --- Duration ---
            const durationEl = renderer.querySelector('span.ytd-thumbnail-overlay-time-status-renderer');
            const duration = durationEl ? durationEl.textContent.trim() : '';

            // --- Content type ---
            let contentType = 'video';
            const shortsIndicator = renderer.querySelector('[overlay-style="SHORTS"]') ||
                                     renderer.hasAttribute('is-shorts');
            if (shortsIndicator || (duration && duration.length <= 4)) {
                contentType = 'video';  // Shorts are still video type
            }

            const liveBadge = renderer.querySelector('[badge-style*="LIVE"]');
            if (liveBadge) {
                contentType = 'video';  // Live streams are still video type
            }

            // --- Thumbnail URL ---
            const thumbEl = renderer.querySelector('a#thumbnail img');
            const thumbUrl = thumbEl ? thumbEl.getAttribute('src') : '';

            // --- Ad detection ---
            let isAd = false;
            if (renderer.tagName === 'YTD-AD-SLOT-RENDERER' ||
                renderer.closest('ytd-ad-slot-renderer') ||
                renderer.querySelector('.ytd-promoted-sparkles-web-renderer')) {
                isAd = true;
            }
            const badges = renderer.querySelectorAll('span.ytd-badge-supported-renderer');
            badges.forEach(badge => {
                if (badge.textContent.trim().toLowerCase() === 'ad') isAd = true;
            });

            // --- Video ID from link ---
            const videoLink = renderer.querySelector('a#thumbnail, a#video-title');
            const href = videoLink ? videoLink.getAttribute('href') : '';
            let videoId = '';
            const idMatch = (href || '').match(/\\/watch\\?v=([\\w-]+)/);
            if (idMatch) videoId = idMatch[1];
            const shortsMatch = (href || '').match(/\\/shorts\\/([\\w-]+)/);
            if (shortsMatch) videoId = shortsMatch[1];

            videos.push({
                id: videoId || `yt_${index}_${Date.now()}`,
                author: channelHandle || channelName,
                author_display_name: channelName,
                content_text: title,
                content_type: contentType,
                media_urls: thumbUrl ? [thumbUrl] : [],
                engagement: {
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    views: views,
                    bookmarks: 0
                },
                timestamp: null,
                is_ad: isAd,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: [],
                metadata: {
                    duration: duration,
                    published_time: publishedTime,
                    video_url: href ? `https://www.youtube.com${href}` : null
                }
            });
        } catch (e) {
            videos.push({
                id: `yt_error_${index}`,
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
    const hasAvatar = document.querySelector('button#avatar-btn') !== null;
    const hasSignIn = document.querySelector('a[href*="accounts.google.com"]') !== null;
    return JSON.stringify({
        likely_logged_in: hasAvatar && !hasSignIn,
        indicators: { hasAvatar, hasSignIn },
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
                content_type=post_data.get("content_type", "video"),
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
        platform="youtube",
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
            "platform": "youtube",
            "feed_type": feed_type,
        },
    )
