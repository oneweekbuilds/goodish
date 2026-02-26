"""
CSS selectors and DOM patterns for YouTube.

YouTube's DOM uses web components (custom elements) extensively.
All selectors are centralized here for easy updates.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main content area (home page)
FEED_CONTAINER = 'div#contents.ytd-rich-grid-renderer'

# Individual video renderer in the feed
VIDEO_RENDERER = 'ytd-rich-item-renderer'

# Video info container
VIDEO_INFO = '#details, #meta'

# --- Video content ---

# Video title
VIDEO_TITLE = '#video-title, h3 a#video-title-link'

# Video thumbnail
VIDEO_THUMBNAIL = 'a#thumbnail img'

# Video duration overlay
VIDEO_DURATION = 'span.ytd-thumbnail-overlay-time-status-renderer'

# --- Channel/Author info ---

# Channel name link
CHANNEL_NAME = '#channel-name a, ytd-channel-name a'

# Channel avatar
CHANNEL_AVATAR = '#avatar-link img'

# Channel badge (verified, etc.)
CHANNEL_BADGE = 'ytd-badge-supported-renderer'

# --- Engagement metrics ---

# View count text (e.g., "1.2M views")
VIEW_COUNT = '#metadata-line span:first-child, span.ytd-video-meta-block'

# Published time (e.g., "2 hours ago")
PUBLISHED_TIME = '#metadata-line span:nth-child(2)'

# --- Media detection ---

# Shorts indicator
SHORTS_INDICATOR = 'ytd-rich-item-renderer[is-shorts]'
SHORTS_BADGE = 'ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]'

# Live stream indicator
LIVE_BADGE = 'ytd-badge-supported-renderer[badge-style="BADGE_STYLE_TYPE_LIVE_NOW"]'

# --- Ad/Promoted detection ---

# Ad badge in feed
AD_BADGE = 'ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer'

# "Ad" text indicator
AD_TEXT = 'span.ytd-badge-supported-renderer:has-text("Ad")'

# Promoted video indicator
PROMOTED_INDICATOR = 'div.ytd-promoted-sparkles-web-renderer'

# --- Navigation ---

# Home tab
HOME_TAB = 'a[href="/"]'

# Shorts tab
SHORTS_TAB = 'a[title="Shorts"]'

# Subscriptions tab
SUBSCRIPTIONS_TAB = 'a[title="Subscriptions"]'

# Trending tab
TRENDING_TAB = 'a[href="/feed/trending"]'
