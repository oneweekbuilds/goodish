"""
CSS selectors and DOM patterns for LinkedIn.

LinkedIn's DOM changes frequently. All selectors are centralized here
so they can be updated in one place when breakage occurs.

Last verified: February 2026
"""

# --- Feed and post containers ---

# Main feed container
FEED_CONTAINER = 'div.scaffold-finite-scroll__content'

# Individual feed update
POST_WRAPPER = 'div.feed-shared-update-v2'

# --- Post content ---

# Post text/commentary
POST_TEXT = 'div.feed-shared-update-v2__description'
POST_TEXT_ALT = 'span.break-words'

# See More button
SEE_MORE_BUTTON = 'button.feed-shared-inline-show-more-text__see-more-less-toggle'

# --- Author info ---

# Author name (actor name)
AUTHOR_NAME = 'span.feed-shared-actor__name'

# Author description/headline
AUTHOR_HEADLINE = 'span.feed-shared-actor__description'

# Author profile link
AUTHOR_LINK = 'a.feed-shared-actor__container-link'

# --- Engagement metrics ---

# Social counts bar (likes, comments)
SOCIAL_COUNTS = 'ul.social-details-social-counts'

# Reaction count
REACTION_COUNT = 'span.social-details-social-counts__reactions-count'

# Comment count
COMMENT_COUNT = 'button.social-details-social-counts__comments'

# Repost count
REPOST_COUNT = 'button.social-details-social-counts__reposts'

# --- Media detection ---

# Image posts
POST_IMAGE = 'div.feed-shared-image img'

# Video posts
POST_VIDEO = 'div.feed-shared-external-video, video'

# Article/link shares
ARTICLE_SHARE = 'article.feed-shared-article'
ARTICLE_LINK = 'a.feed-shared-article__link'

# Document/carousel posts (PDF shares)
DOCUMENT_POST = 'div.feed-shared-document'

# --- Ad/Promoted detection ---

# Promoted label
PROMOTED_LABEL = 'span.feed-shared-actor__sub-description:has-text("Promoted")'

# Sponsored content indicator
SPONSORED_INDICATOR = 'span:has-text("Promoted")'

# --- Timestamp ---

# Time element
POST_TIME = 'span.feed-shared-actor__sub-description time'

# --- Navigation ---

# Home tab
HOME_TAB = 'a[href="/feed/"]'

# My Network
NETWORK_TAB = 'a[href="/mynetwork/"]'

# Jobs
JOBS_TAB = 'a[href="/jobs/"]'
