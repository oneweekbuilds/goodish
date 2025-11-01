// Strict type definitions for content normalization

export type Platform = "instagram" | "tiktok" | "youtube" | "reddit" | "x" | "facebook";

export type ContentType = "post" | "reel" | "story" | "video" | "short" | "thread" | "comment" | "ad";

/**
 * Raw item from various platforms - accepts superset of fields
 */
export interface RawItem {
  // Core fields
  id?: string;
  platform?: Platform;
  type?: ContentType;
  text?: string;
  content?: string; // fallback
  caption?: string; // fallback
  body?: string; // fallback for reddit
  title?: string; // youtube, reddit

  // Author/Source
  author?: string;
  author_id?: string;
  username?: string;
  user_id?: string;
  author_followers?: number;
  followers_count?: number;
  verified?: boolean;
  is_verified?: boolean;

  // Engagement
  likes?: number;
  like_count?: number;
  comments?: number;
  comment_count?: number;
  shares?: number;
  share_count?: number;
  retweets?: number;
  views?: number;
  view_count?: number;

  // Metadata
  timestamp?: number;
  created_at?: number;
  posted_at?: string;
  hashtags?: string[];
  mentions?: string[];
  links?: string[];
  url?: string;

  // Ad indicators
  is_ad?: boolean;
  sponsored?: boolean;
  promoted?: boolean;

  // Language
  language?: string;
  lang?: string;

  // Allow unknown fields
  [key: string]: unknown;
}

/**
 * Normalized item post-processing
 */
export interface NormalizedItem {
  id: string; // hash of platform + source id + timestamp
  platform: Platform;
  type: ContentType;
  text: string;
  hashtags: string[];
  mentions: string[];
  links: string[];
  topics: string[]; // from taxonomy mapper
  authorFollowers: number;
  authorVerified: boolean;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  timestamp: number; // ms
  isAd: boolean;
  language: "en"; // for now
  meta: Record<string, unknown>;
}

/**
 * Feature vector for an item
 */
export interface ItemFeatures {
  tokenCount: number;
  hasQuestion: boolean;
  hasEmoji: boolean;
  allCapsRate: number;
  exclaimCount: number;
  linkCount: number;
  hasPrice: boolean;
  hasDiscount: boolean;
  brandHits: Record<string, number>;
  emotionHits: Record<string, number>;
  politicalHits: Record<string, number>;
  topicVector: Record<string, number>;
}

/**
 * Aggregated features across all items
 */
export interface AggregatedFeatures {
  totalTokens: number;
  avgTokensPerItem: number;
  questionRate: number;
  emojiRate: number;
  avgAllCapsRate: number;
  avgExclaimCount: number;
  avgLinkCount: number;
  priceRate: number;
  discountRate: number;
  brandDistribution: Record<string, number>;
  emotionDistribution: Record<string, number>;
  politicalDistribution: Record<string, number>;
  topicDistribution: Record<string, number>;
}
