// Platform normalizer - converts platform-specific items to unified NormalizedItem format
// Accepts superset of fields with fallbacks for missing data

import type { RawItem, NormalizedItem, Platform } from '../../types/content';
import { generateItemId } from '../utils/hashSeed';

/**
 * Normalize a raw item from any platform into unified format
 * @param rawItem - Platform-specific raw item
 * @param platform - Source platform
 * @returns Normalized item with consistent structure
 */
export function normalizeItem(rawItem: RawItem, platform: Platform): NormalizedItem {
  // Generate deterministic ID from content and timestamp
  const contentForId = rawItem.text || rawItem.title || rawItem.id || '';
  const timestampForId = rawItem.timestamp || rawItem.created_at || rawItem.date || Date.now();
  const itemId = generateItemId(contentForId, timestampForId);

  // Extract timestamp (try multiple field names)
  const timestamp = extractTimestamp(rawItem);

  // Extract text content (combine multiple text fields)
  const text = extractText(rawItem);

  // Extract author information
  const author = extractAuthor(rawItem, platform);

  // Extract engagement metrics
  const engagement = extractEngagement(rawItem, platform);

  // Extract media information
  const media = extractMedia(rawItem);

  // Extract hashtags and mentions
  const { hashtags, mentions } = extractSocialElements(rawItem);

  // Extract URLs
  const urls = extractUrls(rawItem);

  // Determine content type
  const contentType = determineContentType(rawItem, platform);

  // Extract location if available
  const location = rawItem.location || rawItem.geo || undefined;

  // Extract language if available
  const language = rawItem.language || rawItem.lang || undefined;

  // Check if verified content
  const isVerified = rawItem.verified || rawItem.author?.verified || false;

  // Check if promoted/sponsored
  const isPromoted = rawItem.promoted || rawItem.sponsored || rawItem.is_ad || false;

  return {
    id: itemId,
    platform,
    contentType,
    timestamp,
    text,
    author,
    engagement,
    hashtags,
    mentions,
    urls,
    media,
    location,
    language,
    isVerified,
    isPromoted,
    raw: rawItem // Keep original for reference
  };
}

/**
 * Extract timestamp from various field formats
 */
function extractTimestamp(item: RawItem): number {
  // Try common timestamp fields
  const timeValue =
    item.timestamp ||
    item.created_at ||
    item.date ||
    item.createdAt ||
    item.published_at ||
    item.publishedAt ||
    item.time;

  if (!timeValue) {
    return Date.now(); // Fallback to current time
  }

  // Handle different formats
  if (typeof timeValue === 'number') {
    // Check if milliseconds or seconds
    return timeValue > 10000000000 ? timeValue : timeValue * 1000;
  }

  if (typeof timeValue === 'string') {
    const parsed = Date.parse(timeValue);
    return isNaN(parsed) ? Date.now() : parsed;
  }

  return Date.now();
}

/**
 * Extract text content from item
 */
function extractText(item: RawItem): string {
  const parts: string[] = [];

  // Title
  if (item.title) {
    parts.push(item.title);
  }

  // Main text content
  const mainText =
    item.text ||
    item.content ||
    item.body ||
    item.description ||
    item.caption ||
    item.selftext || // Reddit
    item.full_text || // Twitter
    '';

  if (mainText) {
    parts.push(mainText);
  }

  // Subtitle/excerpt
  if (item.subtitle || item.excerpt) {
    parts.push(item.subtitle || item.excerpt);
  }

  return parts.join('\n\n').trim();
}

/**
 * Extract author information
 */
function extractAuthor(item: RawItem, platform: Platform): NormalizedItem['author'] {
  // Handle nested author object
  if (item.author && typeof item.author === 'object') {
    return {
      id: item.author.id || item.author.username || item.author.name || 'unknown',
      username: item.author.username || item.author.name || undefined,
      displayName: item.author.displayName || item.author.display_name || item.author.name || undefined,
      followers: item.author.followers || item.author.follower_count || item.author.subscribers || undefined,
      isVerified: item.author.verified || item.author.is_verified || false,
      profileUrl: item.author.url || item.author.profile_url || undefined
    };
  }

  // Handle flat structure
  return {
    id:
      item.author_id ||
      item.userId ||
      item.user_id ||
      item.username ||
      item.author ||
      'unknown',
    username:
      item.username ||
      item.user ||
      item.author_username ||
      (typeof item.author === 'string' ? item.author : undefined),
    displayName:
      item.author_name ||
      item.display_name ||
      item.name ||
      undefined,
    followers:
      item.followers ||
      item.follower_count ||
      item.subscribers ||
      undefined,
    isVerified:
      item.verified ||
      item.author_verified ||
      false,
    profileUrl:
      item.author_url ||
      item.profile_url ||
      undefined
  };
}

/**
 * Extract engagement metrics
 */
function extractEngagement(item: RawItem, platform: Platform): NormalizedItem['engagement'] {
  const engagement: NormalizedItem['engagement'] = {
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0
  };

  // Likes (various names across platforms)
  engagement.likes =
    item.likes ||
    item.like_count ||
    item.favorite_count ||
    item.favorites ||
    item.upvotes ||
    item.ups || // Reddit
    item.reactions ||
    0;

  // Comments
  engagement.comments =
    item.comments ||
    item.comment_count ||
    item.num_comments ||
    item.reply_count ||
    item.replies ||
    0;

  // Shares/Retweets/Reposts
  engagement.shares =
    item.shares ||
    item.share_count ||
    item.retweet_count ||
    item.retweets ||
    item.reposts ||
    item.crosspost_count || // Reddit
    0;

  // Views
  engagement.views =
    item.views ||
    item.view_count ||
    item.impressions ||
    item.play_count ||
    0;

  // Platform-specific adjustments
  if (platform === 'reddit') {
    // Reddit also has downvotes
    const downvotes = item.downvotes || item.downs || 0;
    engagement.likes = Math.max(0, engagement.likes - downvotes); // Net score
  }

  return engagement;
}

/**
 * Extract media information
 */
function extractMedia(item: RawItem): NormalizedItem['media'] {
  const media: NormalizedItem['media'] = {
    hasImage: false,
    hasVideo: false,
    hasLink: false,
    thumbnailUrl: undefined,
    mediaUrls: []
  };

  // Check for images
  if (item.image || item.images || item.thumbnail || item.photo) {
    media.hasImage = true;
  }

  // Check for video
  if (item.video || item.videos || item.is_video) {
    media.hasVideo = true;
  }

  // Check for link
  if (item.url || item.link || item.external_url) {
    media.hasLink = true;
  }

  // Extract thumbnail
  media.thumbnailUrl =
    item.thumbnail ||
    item.thumbnail_url ||
    item.preview_url ||
    (typeof item.image === 'string' ? item.image : undefined);

  // Extract media URLs
  const mediaUrls: string[] = [];

  // Single media URL
  if (item.media_url && typeof item.media_url === 'string') {
    mediaUrls.push(item.media_url);
  }

  // Array of media URLs
  if (Array.isArray(item.media_urls)) {
    mediaUrls.push(...item.media_urls.filter(url => typeof url === 'string'));
  }

  // Images array
  if (Array.isArray(item.images)) {
    mediaUrls.push(...item.images.filter(url => typeof url === 'string'));
  }

  // Videos array
  if (Array.isArray(item.videos)) {
    mediaUrls.push(...item.videos.filter(url => typeof url === 'string'));
  }

  media.mediaUrls = mediaUrls;

  return media;
}

/**
 * Extract hashtags and mentions from text and metadata
 */
function extractSocialElements(item: RawItem): { hashtags: string[]; mentions: string[] } {
  const hashtags = new Set<string>();
  const mentions = new Set<string>();

  // From explicit fields
  if (Array.isArray(item.hashtags)) {
    item.hashtags.forEach(tag => {
      if (typeof tag === 'string') {
        hashtags.add(tag.replace(/^#/, '').toLowerCase());
      } else if (tag && typeof tag === 'object' && tag.text) {
        hashtags.add(tag.text.replace(/^#/, '').toLowerCase());
      }
    });
  }

  if (Array.isArray(item.mentions)) {
    item.mentions.forEach(mention => {
      if (typeof mention === 'string') {
        mentions.add(mention.replace(/^@/, '').toLowerCase());
      } else if (mention && typeof mention === 'object' && mention.username) {
        mentions.add(mention.username.replace(/^@/, '').toLowerCase());
      }
    });
  }

  // Extract from text
  const text = extractText(item);
  if (text) {
    // Hashtags pattern: #word
    const hashtagMatches = text.match(/#[\w]+/g);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => {
        hashtags.add(tag.replace(/^#/, '').toLowerCase());
      });
    }

    // Mentions pattern: @username
    const mentionMatches = text.match(/@[\w]+/g);
    if (mentionMatches) {
      mentionMatches.forEach(mention => {
        mentions.add(mention.replace(/^@/, '').toLowerCase());
      });
    }
  }

  return {
    hashtags: Array.from(hashtags),
    mentions: Array.from(mentions)
  };
}

/**
 * Extract URLs from text and metadata
 */
function extractUrls(item: RawItem): string[] {
  const urls = new Set<string>();

  // From explicit URL fields
  if (item.url && typeof item.url === 'string') {
    urls.add(item.url);
  }

  if (item.link && typeof item.link === 'string') {
    urls.add(item.link);
  }

  if (item.external_url && typeof item.external_url === 'string') {
    urls.add(item.external_url);
  }

  // From URLs array
  if (Array.isArray(item.urls)) {
    item.urls.forEach(url => {
      if (typeof url === 'string') {
        urls.add(url);
      } else if (url && typeof url === 'object' && url.expanded_url) {
        urls.add(url.expanded_url);
      } else if (url && typeof url === 'object' && url.url) {
        urls.add(url.url);
      }
    });
  }

  // Extract from text
  const text = extractText(item);
  if (text) {
    // URL pattern
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urlMatches = text.match(urlPattern);
    if (urlMatches) {
      urlMatches.forEach(url => {
        // Remove trailing punctuation
        const cleaned = url.replace(/[.,;:!?)\]]+$/, '');
        urls.add(cleaned);
      });
    }
  }

  return Array.from(urls);
}

/**
 * Determine content type based on item characteristics
 */
function determineContentType(item: RawItem, platform: Platform): NormalizedItem['contentType'] {
  // Explicit type field
  if (item.type) {
    const type = item.type.toLowerCase();
    if (type === 'post' || type === 'status') return 'post';
    if (type === 'article' || type === 'link') return 'article';
    if (type === 'video') return 'video';
    if (type === 'image' || type === 'photo') return 'image';
    if (type === 'ad' || type === 'sponsored') return 'ad';
    if (type === 'story') return 'story';
  }

  // Check if it's an ad
  if (item.promoted || item.sponsored || item.is_ad) {
    return 'ad';
  }

  // Platform-specific detection
  if (platform === 'youtube' || platform === 'tiktok') {
    return 'video';
  }

  if (platform === 'instagram') {
    if (item.is_video || item.video) return 'video';
    if (item.carousel_media || item.media_type === 8) return 'image'; // carousel
    if (item.media_type === 2) return 'video';
    if (item.media_type === 1) return 'image';
  }

  // Content-based detection
  if (item.video || item.is_video) return 'video';
  if (item.image || item.images || (item.media_type === 'photo')) return 'image';

  // Article indicators
  if (item.title && item.url && (item.text || '').length > 500) {
    return 'article';
  }

  // Default to post
  return 'post';
}

/**
 * Batch normalize multiple items
 * @param rawItems - Array of raw items
 * @param platform - Source platform
 * @returns Array of normalized items
 */
export function normalizeItems(rawItems: RawItem[], platform: Platform): NormalizedItem[] {
  return rawItems.map(item => normalizeItem(item, platform));
}

/**
 * Validate normalized item has minimum required data
 * @param item - Normalized item to validate
 * @returns True if item has sufficient data for analysis
 */
export function isValidNormalizedItem(item: NormalizedItem): boolean {
  // Must have text or media
  const hasContent = item.text.length > 0 || item.media.hasImage || item.media.hasVideo;

  // Must have valid timestamp
  const hasValidTimestamp = item.timestamp > 0 && item.timestamp <= Date.now();

  // Must have author
  const hasAuthor = item.author.id.length > 0;

  return hasContent && hasValidTimestamp && hasAuthor;
}

/**
 * Filter normalized items to only valid ones
 * @param items - Array of normalized items
 * @returns Filtered array of valid items
 */
export function filterValidItems(items: NormalizedItem[]): NormalizedItem[] {
  return items.filter(isValidNormalizedItem);
}
