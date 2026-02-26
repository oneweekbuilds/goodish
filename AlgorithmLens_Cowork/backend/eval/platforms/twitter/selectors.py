"""
CSS selectors and DOM patterns for Twitter/X.

Twitter's DOM changes frequently. All selectors are centralized here
so they can be updated in one place when breakage occurs.

Last verified: February 2026
"""

# --- Feed and post containers ---

# The main timeline feed container
FEED_CONTAINER = 'div[aria-label="Timeline: Your Home Timeline"]'

# Individual tweet/post articles
TWEET_ARTICLE = 'article[data-testid="tweet"]'

# --- Post content ---

# The main text content of a tweet
TWEET_TEXT = 'div[data-testid="tweetText"]'

# --- Author info ---

# The author's display name (within the tweet article)
AUTHOR_DISPLAY_NAME = 'div[data-testid="User-Name"]'

# Individual link that contains @handle (within User-Name div)
AUTHOR_HANDLE_LINK = 'div[data-testid="User-Name"] a[role="link"][href^="/"]'

# --- Engagement metrics ---

# Reply count button
REPLY_BUTTON = 'button[data-testid="reply"]'

# Retweet count button
RETWEET_BUTTON = 'button[data-testid="retweet"]'

# Like count button
LIKE_BUTTON = 'button[data-testid="like"]'
UNLIKE_BUTTON = 'button[data-testid="unlike"]'

# Bookmark button
BOOKMARK_BUTTON = 'button[data-testid="bookmark"]'

# View count (analytics) — often in aria-label of a link
VIEW_COUNT = 'a[href$="/analytics"]'

# --- Media detection ---

# Image container
IMAGE_CONTAINER = 'div[data-testid="tweetPhoto"]'

# Video container
VIDEO_CONTAINER = 'div[data-testid="videoComponent"]'

# Card/link preview
CARD_CONTAINER = 'div[data-testid="card.wrapper"]'

# --- Ad/promoted detection ---

# Promoted label (appears as a span within the tweet)
PROMOTED_LABEL = 'span[data-testid="socialContext"]'

# Alternative promoted indicators
AD_DISCLOSURE_TEXT = 'Ad'
PROMOTED_TEXT = 'Promoted'

# --- Retweet/repost detection ---

# Social context showing "X reposted" or "X retweeted"
SOCIAL_CONTEXT = 'span[data-testid="socialContext"]'

# --- Timestamp ---

# Time element within tweets
TWEET_TIME = 'time[datetime]'

# --- Navigation ---

# "For You" tab
FOR_YOU_TAB = 'a[href="/home"][role="tab"]'

# "Following" tab
FOLLOWING_TAB = 'a[href="/home/following"][role="tab"]'
