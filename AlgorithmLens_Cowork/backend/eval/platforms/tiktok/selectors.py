"""
CSS selectors and DOM patterns for TikTok.

TikTok's web DOM is heavily class-name obfuscated.
All selectors are centralized here for easy updates.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main feed container (For You page)
FEED_CONTAINER = 'div[data-e2e="recommend-list-item-container"]'

# Individual video item in the feed
VIDEO_ITEM = 'div[data-e2e="recommend-list-item-container"] > div'

# --- Video content ---

# Video description text
VIDEO_DESCRIPTION = 'div[data-e2e="video-desc"], span[data-e2e="new-desc-span"]'

# Video player
VIDEO_PLAYER = 'div[data-e2e="feed-video"]'

# --- Author info ---

# Author username link
AUTHOR_LINK = 'a[data-e2e="video-author-uniqueid"]'

# Author display name
AUTHOR_NAME = 'span[data-e2e="video-author-nickname"]'

# Author avatar
AUTHOR_AVATAR = 'span[data-e2e="video-author-avatar"]'

# --- Engagement metrics ---

# Like count
LIKE_COUNT = 'strong[data-e2e="like-count"]'

# Comment count
COMMENT_COUNT = 'strong[data-e2e="comment-count"]'

# Share count
SHARE_COUNT = 'strong[data-e2e="share-count"]'

# Bookmark/save count
BOOKMARK_COUNT = 'strong[data-e2e="undefined-count"]'

# --- Hashtag detection ---

# Hashtag links in description
HASHTAG_LINK = 'a[data-e2e="search-common-link"]'

# --- Sound/Music info ---

# Music/sound link
MUSIC_LINK = 'a[data-e2e="video-music"]'

# --- Ad/Promoted detection ---

# Sponsored label
SPONSORED_LABEL = 'div[data-e2e="video-card-badge"]'
AD_TEXT = 'span:has-text("Sponsored")'

# "Ad" disclosure text
AD_DISCLOSURE = 'span:has-text("Ad"), span:has-text("Promoted")'

# --- Navigation ---

# For You tab
FOR_YOU_TAB = 'a[data-e2e="nav-foryou"]'

# Following tab
FOLLOWING_TAB = 'a[data-e2e="nav-following"]'

# Explore tab
EXPLORE_TAB = 'a[data-e2e="nav-explore"]'
