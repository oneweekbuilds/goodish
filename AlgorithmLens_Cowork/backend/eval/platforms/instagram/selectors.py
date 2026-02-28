"""
CSS selectors and DOM patterns for Instagram.

Instagram's DOM changes frequently. All selectors are centralized here
so they can be updated in one place when breakage occurs.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main feed container on the home page
FEED_CONTAINER = 'main[role="main"]'

# Individual post article in the feed
POST_ARTICLE = 'article'

# --- Post content ---

# Post caption/text area
POST_CAPTION = 'div._a9zs span'

# Hashtag links within captions
HASHTAG_LINK = 'a[href^="/explore/tags/"]'

# --- Author info ---

# Author header within a post
AUTHOR_HEADER = 'header'

# Author username link
AUTHOR_LINK = 'a[href^="/"][role="link"] span'

# --- Engagement metrics ---

# Like button (heart icon)
LIKE_BUTTON = 'span[class*="Like"] button, svg[aria-label="Like"]'
UNLIKE_BUTTON = 'svg[aria-label="Unlike"]'

# Comment button
COMMENT_BUTTON = 'svg[aria-label="Comment"]'

# Share button
SHARE_BUTTON = 'svg[aria-label="Share Post"]'

# Save/bookmark button
SAVE_BUTTON = 'svg[aria-label="Save"]'

# Likes count text (e.g., "1,234 likes")
LIKES_COUNT = 'section a[href$="/liked_by/"] span, section button span'

# --- Media detection ---

# Image in a post
POST_IMAGE = 'article img[style*="object-fit"]'

# Video in a post
POST_VIDEO = 'article video'

# Carousel indicator dots
CAROUSEL_INDICATOR = 'div[class*="Carousel"] div[class*="Dot"]'

# Reel indicator
REEL_INDICATOR = 'svg[aria-label="Reel"]'

# --- Ad/Sponsored detection ---

# Sponsored label
SPONSORED_LABEL = 'span:has-text("Sponsored")'
AD_LINK = 'a[href*="instagram.com/ads"]'

# "Paid partnership" label
PAID_PARTNERSHIP = 'span:has-text("Paid partnership")'

# --- Timestamp ---

# Time element
POST_TIME = 'time[datetime]'

# --- Navigation ---

# Home feed tab
HOME_TAB = 'a[href="/"]'

# Explore tab
EXPLORE_TAB = 'a[href="/explore/"]'

# Reels tab
REELS_TAB = 'a[href="/reels/"]'
