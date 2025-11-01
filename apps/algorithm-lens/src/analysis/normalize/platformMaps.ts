// Platform-specific field mappings and quirks
// Helps normalize data from different social platforms

import type { Platform } from '../../types/content';

/**
 * Field mapping configuration for each platform
 */
export interface PlatformFieldMap {
  platform: Platform;
  fields: {
    id: string[];
    timestamp: string[];
    text: string[];
    author: {
      id: string[];
      username: string[];
      displayName: string[];
      followers: string[];
      verified: string[];
      profileUrl: string[];
    };
    engagement: {
      likes: string[];
      comments: string[];
      shares: string[];
      views: string[];
    };
    media: {
      images: string[];
      videos: string[];
      thumbnail: string[];
    };
    metadata: {
      location: string[];
      language: string[];
      hashtags: string[];
      mentions: string[];
      urls: string[];
    };
  };
  quirks?: string[];
}

/**
 * Platform-specific field mappings
 */
export const PLATFORM_FIELD_MAPS: Record<Platform, PlatformFieldMap> = {
  twitter: {
    platform: 'twitter',
    fields: {
      id: ['id', 'id_str', 'tweet_id'],
      timestamp: ['created_at', 'timestamp'],
      text: ['full_text', 'text', 'extended_tweet.full_text'],
      author: {
        id: ['user.id', 'user.id_str', 'author_id'],
        username: ['user.screen_name', 'username'],
        displayName: ['user.name', 'author.name'],
        followers: ['user.followers_count', 'author.followers_count'],
        verified: ['user.verified', 'author.verified'],
        profileUrl: ['user.url', 'author.url']
      },
      engagement: {
        likes: ['favorite_count', 'like_count', 'favorites'],
        comments: ['reply_count', 'replies'],
        shares: ['retweet_count', 'retweets'],
        views: ['impression_count', 'impressions']
      },
      media: {
        images: ['entities.media', 'extended_entities.media'],
        videos: ['extended_entities.media', 'video_info'],
        thumbnail: ['entities.media[0].media_url', 'thumbnail_url']
      },
      metadata: {
        location: ['place', 'geo', 'coordinates'],
        language: ['lang', 'language'],
        hashtags: ['entities.hashtags', 'hashtags'],
        mentions: ['entities.user_mentions', 'mentions'],
        urls: ['entities.urls', 'urls']
      }
    },
    quirks: [
      'Text may be truncated if full_text not available',
      'Retweets have retweeted_status field',
      'Replies have in_reply_to_status_id field',
      'Timestamps are in Twitter format: "Wed Oct 10 20:19:24 +0000 2018"'
    ]
  },

  instagram: {
    platform: 'instagram',
    fields: {
      id: ['id', 'pk', 'code'],
      timestamp: ['taken_at', 'created_time', 'timestamp'],
      text: ['caption.text', 'caption', 'edge_media_to_caption.edges[0].node.text'],
      author: {
        id: ['user.pk', 'user.id', 'owner.id'],
        username: ['user.username', 'owner.username'],
        displayName: ['user.full_name', 'owner.full_name'],
        followers: ['user.follower_count', 'owner.edge_followed_by.count'],
        verified: ['user.is_verified', 'owner.is_verified'],
        profileUrl: ['user.profile_pic_url', 'owner.profile_pic_url']
      },
      engagement: {
        likes: ['like_count', 'edge_media_preview_like.count', 'edge_liked_by.count'],
        comments: ['comment_count', 'edge_media_to_comment.count'],
        shares: ['share_count'],
        views: ['view_count', 'video_view_count', 'play_count']
      },
      media: {
        images: ['image_versions2.candidates', 'display_url', 'thumbnail_resources'],
        videos: ['video_versions', 'video_url'],
        thumbnail: ['thumbnail_url', 'display_url']
      },
      metadata: {
        location: ['location'],
        language: ['language'],
        hashtags: ['caption_hashtags', 'hashtags'],
        mentions: ['usertags', 'mentions'],
        urls: ['urls']
      }
    },
    quirks: [
      'Media type: 1=image, 2=video, 8=carousel',
      'Carousel posts have carousel_media array',
      'Stories have different structure than posts',
      'Some fields only available via API vs scraping'
    ]
  },

  facebook: {
    platform: 'facebook',
    fields: {
      id: ['id', 'post_id'],
      timestamp: ['created_time', 'timestamp', 'updated_time'],
      text: ['message', 'story', 'description'],
      author: {
        id: ['from.id', 'user_id'],
        username: ['from.username', 'from.id'],
        displayName: ['from.name', 'user_name'],
        followers: ['from.followers_count', 'from.fan_count'],
        verified: ['from.verified', 'from.is_verified'],
        profileUrl: ['from.link', 'from.url']
      },
      engagement: {
        likes: ['likes.summary.total_count', 'reactions.summary.total_count', 'like_count'],
        comments: ['comments.summary.total_count', 'comment_count'],
        shares: ['shares.count', 'share_count'],
        views: ['views', 'video_views']
      },
      media: {
        images: ['attachments.data[0].media.image', 'full_picture', 'picture'],
        videos: ['attachments.data[0].media.source', 'source'],
        thumbnail: ['picture', 'thumbnail']
      },
      metadata: {
        location: ['place'],
        language: ['language'],
        hashtags: ['message_tags'],
        mentions: ['message_tags', 'to'],
        urls: ['link', 'attachments.data[0].url']
      }
    },
    quirks: [
      'Reactions (like, love, haha, wow, sad, angry) counted as likes',
      'Story vs message field (story for automated posts)',
      'Privacy settings affect data availability',
      'API access heavily restricted'
    ]
  },

  youtube: {
    platform: 'youtube',
    fields: {
      id: ['id', 'videoId', 'id.videoId'],
      timestamp: ['publishedAt', 'snippet.publishedAt', 'uploaded'],
      text: ['snippet.description', 'description', 'snippet.title'],
      author: {
        id: ['snippet.channelId', 'channelId'],
        username: ['snippet.channelTitle', 'channelTitle', 'author'],
        displayName: ['snippet.channelTitle', 'channelTitle'],
        followers: ['statistics.subscriberCount', 'subscriberCount'],
        verified: ['channelVerified', 'verified'],
        profileUrl: ['channelUrl']
      },
      engagement: {
        likes: ['statistics.likeCount', 'likeCount', 'likes'],
        comments: ['statistics.commentCount', 'commentCount', 'comments'],
        shares: ['statistics.shareCount', 'shareCount'],
        views: ['statistics.viewCount', 'viewCount', 'views']
      },
      media: {
        images: ['snippet.thumbnails', 'thumbnails'],
        videos: ['id', 'videoId'],
        thumbnail: ['snippet.thumbnails.default.url', 'thumbnail']
      },
      metadata: {
        location: ['recordingLocation'],
        language: ['snippet.defaultLanguage', 'defaultLanguage'],
        hashtags: ['snippet.tags', 'tags'],
        mentions: [],
        urls: ['contentDetails.videoUrl']
      }
    },
    quirks: [
      'All content is video',
      'Title and description are separate',
      'Tags are not hashtags but keywords',
      'Dislike count no longer publicly available'
    ]
  },

  tiktok: {
    platform: 'tiktok',
    fields: {
      id: ['id', 'itemId', 'video.id'],
      timestamp: ['createTime', 'video.createTime', 'created'],
      text: ['desc', 'description', 'video.desc'],
      author: {
        id: ['author.id', 'authorId', 'author.uniqueId'],
        username: ['author.uniqueId', 'author.username'],
        displayName: ['author.nickname', 'author.name'],
        followers: ['authorStats.followerCount', 'author.fans'],
        verified: ['author.verified'],
        profileUrl: ['author.url']
      },
      engagement: {
        likes: ['stats.diggCount', 'diggCount', 'likes'],
        comments: ['stats.commentCount', 'commentCount', 'comments'],
        shares: ['stats.shareCount', 'shareCount', 'shares'],
        views: ['stats.playCount', 'playCount', 'views']
      },
      media: {
        images: ['video.cover', 'video.dynamicCover'],
        videos: ['video.downloadAddr', 'video.playAddr'],
        thumbnail: ['video.cover', 'thumbnail']
      },
      metadata: {
        location: ['locationCreated'],
        language: ['language'],
        hashtags: ['challenges', 'textExtra'],
        mentions: ['textExtra', 'mentions'],
        urls: ['webVideoUrl', 'shareUrl']
      }
    },
    quirks: [
      'All content is video',
      'Hashtags may be in textExtra array',
      'Music/sound is important metadata',
      'Duets and stitches reference original videos'
    ]
  },

  reddit: {
    platform: 'reddit',
    fields: {
      id: ['id', 'name'],
      timestamp: ['created_utc', 'created'],
      text: ['selftext', 'body', 'title'],
      author: {
        id: ['author', 'author_fullname'],
        username: ['author'],
        displayName: ['author'],
        followers: ['author_flair_text'],
        verified: ['author_verified'],
        profileUrl: ['author_url']
      },
      engagement: {
        likes: ['ups', 'score', 'upvotes'],
        comments: ['num_comments', 'comment_count'],
        shares: ['num_crossposts', 'crosspost_count'],
        views: ['view_count']
      },
      media: {
        images: ['preview.images', 'thumbnail', 'url'],
        videos: ['media.reddit_video', 'secure_media.reddit_video'],
        thumbnail: ['thumbnail', 'preview.images[0].source.url']
      },
      metadata: {
        location: [],
        language: ['language'],
        hashtags: [],
        mentions: [],
        urls: ['url', 'url_overridden_by_dest']
      }
    },
    quirks: [
      'Score = upvotes - downvotes',
      'Selftext for text posts, url for links',
      'Subreddit is important context (subreddit field)',
      'Distinguished posts (mod/admin) have distinguished field',
      'Gilded/awarded posts have special metadata'
    ]
  },

  linkedin: {
    platform: 'linkedin',
    fields: {
      id: ['id', 'activity_id', 'urn'],
      timestamp: ['created.time', 'createdAt', 'timestamp'],
      text: ['commentary', 'text', 'specificContent.com.linkedin.ugc.ShareContent.shareCommentary.text'],
      author: {
        id: ['author', 'actor.urn'],
        username: ['author.username', 'actor.vanityName'],
        displayName: ['author.name', 'actor.name'],
        followers: ['author.followerCount'],
        verified: ['author.verified'],
        profileUrl: ['author.url']
      },
      engagement: {
        likes: ['numLikes', 'likesCount', 'socialDetail.totalSocialActivityCounts.numLikes'],
        comments: ['numComments', 'commentsCount', 'socialDetail.totalSocialActivityCounts.numComments'],
        shares: ['numShares', 'sharesCount', 'socialDetail.totalSocialActivityCounts.numShares'],
        views: ['numViews', 'viewsCount']
      },
      media: {
        images: ['content.media', 'images'],
        videos: ['content.media', 'videos'],
        thumbnail: ['content.media[0].thumbnail']
      },
      metadata: {
        location: ['location'],
        language: ['locale.language'],
        hashtags: ['hashtags'],
        mentions: ['mentions'],
        urls: ['content.url', 'articleUrl']
      }
    },
    quirks: [
      'Professional network context',
      'Articles vs posts have different structures',
      'Reactions (like, celebrate, support, love, insightful, curious)',
      'Company pages vs personal profiles'
    ]
  }
};

/**
 * Get field mapping for a platform
 */
export function getPlatformFieldMap(platform: Platform): PlatformFieldMap {
  return PLATFORM_FIELD_MAPS[platform];
}

/**
 * Get all possible field names for a specific data point
 */
export function getPossibleFieldNames(platform: Platform, fieldPath: string): string[] {
  const map = PLATFORM_FIELD_MAPS[platform];
  const parts = fieldPath.split('.');

  if (parts.length === 1) {
    // Top-level field
    const field = parts[0] as keyof typeof map.fields;
    const value = map.fields[field];
    return Array.isArray(value) ? value : [];
  }

  // Nested field (e.g., 'author.username')
  const [category, subfield] = parts;
  const categoryData = map.fields[category as keyof typeof map.fields];

  if (categoryData && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
    const subfieldValue = (categoryData as any)[subfield];
    return Array.isArray(subfieldValue) ? subfieldValue : [];
  }

  return [];
}

/**
 * Platform-specific URL patterns for content identification
 */
export const PLATFORM_URL_PATTERNS: Record<Platform, RegExp[]> = {
  twitter: [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /t\.co\//
  ],
  instagram: [
    /instagram\.com\/p\/([\w-]+)/,
    /instagram\.com\/reel\/([\w-]+)/,
    /instagr\.am\/p\/([\w-]+)/
  ],
  facebook: [
    /facebook\.com\/[\w.]+\/posts\/(\d+)/,
    /facebook\.com\/photo\.php\?fbid=(\d+)/,
    /fb\.watch\//,
    /fb\.me\//
  ],
  youtube: [
    /youtube\.com\/watch\?v=([\w-]+)/,
    /youtu\.be\/([\w-]+)/,
    /youtube\.com\/shorts\/([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/
  ],
  tiktok: [
    /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([\w]+)/,
    /vt\.tiktok\.com\/([\w]+)/
  ],
  reddit: [
    /reddit\.com\/r\/\w+\/comments\/([\w]+)/,
    /redd\.it\/([\w]+)/
  ],
  linkedin: [
    /linkedin\.com\/feed\/update\/urn:li:activity:(\d+)/,
    /linkedin\.com\/posts\//,
    /lnkd\.in\//
  ]
};

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): Platform | null {
  const lowerUrl = url.toLowerCase();

  for (const [platform, patterns] of Object.entries(PLATFORM_URL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerUrl)) {
        return platform as Platform;
      }
    }
  }

  return null;
}

/**
 * Extract content ID from platform URL
 */
export function extractIdFromUrl(url: string, platform: Platform): string | null {
  const patterns = PLATFORM_URL_PATTERNS[platform];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Platform-specific content type detection
 */
export const PLATFORM_CONTENT_TYPES: Record<Platform, string[]> = {
  twitter: ['tweet', 'retweet', 'reply', 'quote'],
  instagram: ['post', 'story', 'reel', 'igtv'],
  facebook: ['post', 'photo', 'video', 'link', 'status'],
  youtube: ['video', 'short', 'live'],
  tiktok: ['video', 'duet', 'stitch'],
  reddit: ['post', 'comment', 'link', 'crosspost'],
  linkedin: ['post', 'article', 'video', 'poll']
};

/**
 * Get typical content types for a platform
 */
export function getPlatformContentTypes(platform: Platform): string[] {
  return PLATFORM_CONTENT_TYPES[platform];
}
