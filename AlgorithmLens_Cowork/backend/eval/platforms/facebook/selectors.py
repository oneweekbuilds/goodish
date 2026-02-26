"""
CSS selectors and DOM patterns for Facebook.

Facebook's DOM changes frequently. All selectors are centralized here
so they can be updated in one place when breakage occurs.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main feed container
FEED_CONTAINER = 'div[role="feed"]'

# Individual post wrapper (Facebook uses data-pagelet for feed units)
POST_WRAPPER = 'div[data-pagelet^="FeedUnit"]'

# Post article role
POST_ARTICLE = 'div[role="article"]'

# --- Post content ---

# Post text content
POST_TEXT = 'div[data-ad-preview="message"]'
POST_TEXT_ALT = 'div[dir="auto"]'

# See More button for truncated posts
SEE_MORE_BUTTON = 'div[role="button"]:has-text("See more")'

# --- Author info ---

# Author name link (strong tag inside header area)
AUTHOR_LINK = 'strong a[role="link"]'

# Author profile image
AUTHOR_AVATAR = 'image, svg image'

# --- Engagement metrics ---

# Like/reaction count
REACTION_COUNT = 'span[aria-label*="reaction"]'

# Comment count
COMMENT_COUNT = 'span:has-text("comment")'

# Share count
SHARE_COUNT = 'span:has-text("share")'

# --- Media detection ---

# Photo posts
POST_PHOTO = 'div[data-pagelet] img[src*="scontent"]'

# Video posts
POST_VIDEO = 'div[data-pagelet] video'

# Link share previews
LINK_PREVIEW = 'a[href*="l.facebook.com"]'

# --- Ad/Sponsored detection ---

# Sponsored label
SPONSORED_LABEL = 'a[href*="/ads/about"] span, span:has-text("Sponsored")'

# "Paid partnership" label
PAID_PARTNERSHIP = 'span:has-text("Paid partnership")'

# --- Timestamp ---

# Time element for post
POST_TIME = 'a[href*="/posts/"] span, abbr[data-utime]'

# --- Navigation ---

# News Feed link
NEWS_FEED = 'a[href="/"]'

# Watch tab
WATCH_TAB = 'a[href="/watch/"]'

# Marketplace
MARKETPLACE_TAB = 'a[href="/marketplace/"]'
