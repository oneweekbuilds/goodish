"""
Instagram feed capture module.

Reads post data from the live Instagram DOM using Claude-in-Chrome browser tools.
Assumes the user is already logged into Instagram in their browser.

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


# JavaScript to extract all visible posts from the Instagram DOM
EXTRACT_POSTS_JS = """
(() => {
    const posts = [];
    const articles = document.querySelectorAll('article');

    articles.forEach((article, index) => {
        try {
            // --- Author info ---
            const header = article.querySelector('header');
            let handle = '';
            let displayName = '';

            if (header) {
                const authorLinks = header.querySelectorAll('a[href^="/"]');
                for (const link of authorLinks) {
                    const href = link.getAttribute('href') || '';
                    if (href.match(/^\\/[A-Za-z0-9_.]+\\/$/) || href.match(/^\\/[A-Za-z0-9_.]+$/)) {
                        handle = href.replace(/\\//g, '');
                        const nameSpan = link.querySelector('span');
                        if (nameSpan) displayName = nameSpan.textContent.trim();
                        break;
                    }
                }
            }

            // --- Post text/caption ---
            let contentText = '';
            const captionSpans = article.querySelectorAll('span');
            for (const span of captionSpans) {
                const text = span.textContent.trim();
                if (text.length > 20 && !text.includes('liked by') && !text.includes('View all')) {
                    contentText = text.substring(0, 500);
                    break;
                }
            }

            // --- Hashtags ---
            const hashtags = [];
            const hashtagLinks = article.querySelectorAll('a[href*="/explore/tags/"]');
            hashtagLinks.forEach(a => hashtags.push(a.textContent.trim()));

            // --- Engagement (likes) ---
            let likes = 0;
            const likeSections = article.querySelectorAll('section');
            for (const section of likeSections) {
                const text = section.textContent || '';
                const likeMatch = text.match(/([\\d,]+)\\s*likes?/i);
                if (likeMatch) {
                    likes = parseInt(likeMatch[1].replace(/,/g, ''), 10) || 0;
                    break;
                }
            }

            // --- Content type detection ---
            let contentType = 'image';
            if (article.querySelector('video')) {
                contentType = 'video';
            }
            const carouselDots = article.querySelectorAll('[class*="Dot"], [class*="carousel"]');
            if (carouselDots.length > 0) {
                contentType = 'carousel';
            }

            // --- Media URLs ---
            const mediaUrls = [];
            const images = article.querySelectorAll('img[style*="object-fit"]');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.includes('profile_pic')) mediaUrls.push(src);
            });

            // --- Timestamp ---
            const timeEl = article.querySelector('time[datetime]');
            const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;

            // --- Ad/Sponsored detection ---
            let isAd = false;
            const spans = article.querySelectorAll('span');
            for (const span of spans) {
                if (span.textContent.trim() === 'Sponsored' || span.textContent.trim() === 'Paid partnership') {
                    isAd = true;
                    break;
                }
            }

            posts.push({
                id: `ig_${handle}_${index}_${Date.now()}`,
                author: handle,
                author_display_name: displayName || handle,
                content_text: contentText,
                content_type: contentType,
                media_urls: mediaUrls,
                engagement: {
                    likes: likes,
                    comments: 0,
                    shares: 0,
                    views: 0,
                    bookmarks: 0
                },
                timestamp: timestamp,
                is_ad: isAd,
                is_repost: false,
                original_author: null,
                position_in_feed: index,
                hashtags: hashtags,
                metadata: {}
            });
        } catch (e) {
            posts.push({
                id: `ig_error_${index}`,
                author: 'EXTRACTION_ERROR',
                content_text: `Error: ${e.message}`,
                content_type: 'image',
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
    const hasHome = document.querySelector('a[href="/"]') !== null;
    const hasProfile = document.querySelector('img[data-testid="user-avatar"]') !== null;
    return JSON.stringify({
        likely_logged_in: hasNav && hasHome,
        indicators: { hasNav, hasHome, hasProfile },
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
                content_type=post_data.get("content_type", "image"),
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
        platform="instagram",
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
            "platform": "instagram",
            "feed_type": feed_type,
        },
    )
