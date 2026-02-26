"""
CSS selectors and DOM patterns for Reddit (new Reddit).

Reddit's new design uses web components and data-* attributes.
All selectors are centralized here so they can be updated in one place.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main feed container
FEED_CONTAINER = 'div[data-testid="posts-list"], shreddit-feed'

# Individual post (new Reddit uses shreddit-post web component)
POST_ELEMENT = 'shreddit-post, article'

# Post wrapper with data attributes
POST_WRAPPER = 'div[data-testid="post-container"]'

# --- Post content ---

# Post title
POST_TITLE = 'a[slot="title"], h3'

# Post body text
POST_BODY = 'div[data-click-id="text"], div[slot="text-body"]'

# --- Author info ---

# Author link
AUTHOR_LINK = 'a[data-testid="post_author_link"]'

# Subreddit link
SUBREDDIT_LINK = 'a[data-click-id="subreddit"]'

# Author name from shreddit-post attribute
AUTHOR_ATTR = 'shreddit-post[author]'

# --- Engagement metrics ---

# Score/upvote count
SCORE = 'shreddit-post[score], div[data-click-id="upvote"] + div'

# Comment count
COMMENT_COUNT = 'a[data-click-id="comments"] span, shreddit-post[comment-count]'

# --- Media detection ---

# Image posts
POST_IMAGE = 'img[alt="Post image"], div[data-click-id="media"] img'

# Video posts
POST_VIDEO = 'shreddit-player, video, div[data-click-id="media"] video'

# External link posts
EXTERNAL_LINK = 'a[data-click-id="body"][href*="://"]'

# --- Ad/Promoted detection ---

# Promoted tag
PROMOTED_TAG = 'span:has-text("promoted"), span:has-text("Promoted")'

# Sponsored indicator
SPONSORED_INDICATOR = 'shreddit-post[is-promoted]'

# --- Timestamp ---

# Time element
POST_TIME = 'time, faceplate-timeago'

# --- Navigation ---

# Home feed
HOME_FEED = 'a[href="/"]'

# Popular feed
POPULAR_FEED = 'a[href="/r/popular/"]'

# All feed
ALL_FEED = 'a[href="/r/all/"]'
