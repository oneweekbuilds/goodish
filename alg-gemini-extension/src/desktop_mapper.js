/**
 * AlgorithmLens Desktop Mapper
 *
 * Converts DesktopPostItem[] from DOM scanning into UnifiedScanResult format.
 * Step 11B-2: Schema mapping (no backend calls)
 */

import { generateScanId } from './shared/generate-scan-id.js';
import { CAPTURE_DEBUG, debugLog } from './shared/debug.js';
import { extractKeywords, extractDomain, detectOS } from './desktop_mapper_utils.js';
import { classifyTopic } from './desktop_mapper_topics.js';

// ============================================
// Main Mapper Function
// ============================================

/**
 * Map DesktopPostItem[] to UnifiedScanResult
 * @param {Array} posts - Array of DesktopPostItem from DOM scanner
 * @param {string} platform - Platform name (tiktok, instagram, youtube, facebook, twitter, reddit)
 * @param {Object} options - Optional configuration
 * @param {string} options.scanId - Pre-generated scanId (from session start). If not provided, generates new one.
 * @param {string} options.createdAt - ISO timestamp when scan started. If not provided, uses current time.
 * @returns {Object} UnifiedScanResult
 */
export function mapDesktopPostsToUnifiedResult(posts = [], platform = 'unknown', options = {}) {
  const startTime = Date.now();
  // Use provided scanId from session state, or generate new one as fallback
  const scanId = options.scanId || generateScanId();
  const timestamp = options.createdAt || new Date().toISOString();

  // Ensure posts is an array
  if (!Array.isArray(posts)) {
    if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] posts is not an array, defaulting to empty');
    posts = [];
  }

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ======== MAPPING START ========');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Input posts count:', posts.length);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Platform:', platform);

  // Log platform distribution of input posts
  const inputPlatformSummary = {};
  for (const post of posts) {
    const p = post.platform || 'unknown';
    inputPlatformSummary[p] = (inputPlatformSummary[p] || 0) + 1;
  }
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Posts by platform (input):', inputPlatformSummary);

  // ============================================
  // Process each post into FeedItem format
  // ============================================

  const feedItems = [];
  const topicCounts = {};
  const hashtagCounts = {};
  const ctaCounts = {};

  posts.forEach((post, index) => {
    // Extract keywords from caption AND creator name
    // Creator name helps classify posts from known accounts (e.g., giallozafferano → food)
    const captionKeywords = extractKeywords(post.caption);
    const creatorKeywords = extractKeywords(post.creator);
    const keywords = [...captionKeywords, ...creatorKeywords];

    // Classify topic
    const primaryTopic = classifyTopic(keywords, post.hashtags || []);
    topicCounts[primaryTopic] = (topicCounts[primaryTopic] || 0) + 1;

    // Count hashtags
    (post.hashtags || []).forEach(tag => {
      const normalizedTag = tag.toLowerCase();
      hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
    });

    // Count CTAs
    if (post.ctaText) {
      const normalizedCta = post.ctaText.toLowerCase();
      ctaCounts[normalizedCta] = (ctaCounts[normalizedCta] || 0) + 1;
    }

    // Build FeedItem
    // NOTE: political, wellbeing, and valence fields are set to null/NOT_ANALYZED
    // because accurate detection requires AI/LLM analysis, not keyword matching.
    const feedItem = {
      position_in_feed: index + 1,
      approx_timestamp_offset_sec: null,
      content_type: post.mediaType || (platform === 'youtube' ? 'VIDEO' : 'POST'),
      is_ad: post.isSponsored || false,

      ad_metadata: post.isSponsored ? {
        ad_detected_reason: 'sponsored_label',
        sponsored_label_text: post.sponsoredEvidence?.matchedText || 'Sponsored',
        advertiser_name: post.creator || null,
        advertiser_domain: extractDomain(post.link),
        product_or_service: post.ctaText || null,
        detection_evidence: post.sponsoredEvidence || null
      } : null,

      account: {
        account_handle: post.creator || null,
        account_display_name: post.creator || null,
        account_category_guess: null
      },

      content_text: {
        captions: post.caption ? [post.caption] : [],
        hashtags: post.hashtags || [],
        on_screen_labels: []
      },

      topics: {
        primary_category: primaryTopic,
        secondary_categories: [],
        freeform_tags: keywords.slice(0, 10)
      },

      // Political detection requires AI analysis - keyword matching is too inaccurate
      political: {
        is_political: null, // null = not analyzed (requires AI)
        political_subtype: null,
        stance_or_alignment_guess: null,
        policy_area: null,
        geographic_focus: null
      },

      // Wellbeing detection requires AI analysis - keyword matching is too inaccurate
      wellbeing: {
        wellbeing_relevance: 'NOT_ANALYZED', // Indicates AI analysis needed
        valence: null, // null = not analyzed (requires AI)
        themes: [],
        potential_risk_flags: []
      },

      engagement_drivers: {
        hooks_detected: [],
        call_to_action_patterns: post.ctaText ? [post.ctaText] : [],
        urgency_or_scarcity_signals: []
      },

      repetition: {
        similar_to_previous_items: false,
        repetition_reasons: [],
        repetition_cluster_id: null
      },

      algorithm_inferences: {
        suggested_interests: keywords.slice(0, 5),
        suggested_audience_segments: []
      },

      source_details: {
        capture_source_type: 'DOM_SCRAPE',
        dom_metadata: {
          post_id: post.id || null,
          post_url: post.link || null,
          account_id: null
        },
        ocr_metadata: null
      },

      engagement: post.engagement ? {
        likes: post.engagement.likes ?? null,
        comments: post.engagement.comments ?? null,
        shares: post.engagement.shares ?? null,
        views: post.engagement.views ?? null
      } : null,

      source_type: post.sourceType || 'unknown',
      is_algorithmic: post.isAlgorithmic || false
    };

    feedItems.push(feedItem);
  });

  // ============================================
  // Build Aggregates
  // ============================================

  const totalItems = posts.length;

  // Count ads - ensure isSponsored is treated as boolean
  const totalAds = posts.filter(p => p.isSponsored === true).length;
  const adPercentage = totalItems > 0 ? totalAds / totalItems : 0;

  // Suggested vs. Followed counts
  const suggestedCount = posts.filter(p => p.sourceType === 'suggested').length;
  const followedCount = posts.filter(p => p.sourceType === 'followed').length;
  const adCount = posts.filter(p => p.sourceType === 'ad').length;
  const unknownSourceCount = posts.filter(p => !p.sourceType || p.sourceType === 'unknown').length;
  const suggestedPercentage = totalItems > 0 ? suggestedCount / totalItems : 0;
  const followedPercentage = totalItems > 0 ? followedCount / totalItems : 0;

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ----------------------------------------');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] AGGREGATES:');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_feed_items:', totalItems);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_ads:', totalAds);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   ad_percentage:', (adPercentage * 100).toFixed(1) + '%');

  // Topic distribution
  const topicDistribution = Object.entries(topicCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalItems > 0 ? count / totalItems : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Top hooks/CTAs
  const topHooks = Object.entries(ctaCounts)
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate processing time
  const processingTime = (Date.now() - startTime) / 1000;

  // ============================================
  // Build UnifiedScanResult
  // ============================================

  const result = {
    schema_version: '1.0.0',

    scan_metadata: {
      scan_id: scanId,
      created_at: timestamp,
      source_type: 'DESKTOP_EXTENSION',
      platform: platform.toUpperCase(),
      user_identifier: null,
      app_scan_version: '0.1.0',
      insights_engine_version: '1.0.0-desktop'
    },

    environment: {
      device_type: 'DESKTOP',
      device_os: detectOS(),
      device_os_version: null,
      browser_name: 'Chrome',
      browser_version: null,
      screen_resolution: {
        width: typeof window !== 'undefined' ? window.screen?.width || 1920 : 1920,
        height: typeof window !== 'undefined' ? window.screen?.height || 1080 : 1080
      },
      video_capture: null,
      extension_capture: {
        is_dom_based: true,
        dom_capture_strategy: 'VISIBLE_FEED_ITEMS'
      }
    },

    feed_items: feedItems,

    aggregates: {
      total_feed_items: totalItems,
      total_ads: totalAds,
      ad_percentage: adPercentage,
      topic_distribution: topicDistribution,
      // NOTE: Wellbeing and political summaries show null/NOT_ANALYZED
      // because accurate detection requires AI/LLM analysis
      wellbeing_summary: {
        high_relevance_items: null, // Not analyzed - requires AI
        potential_risk_items: null, // Not analyzed - requires AI
        valence_distribution: null  // Not analyzed - requires AI
      },
      political_content_summary: {
        political_items: null, // Not analyzed - requires AI
        political_percentage: null // Not analyzed - requires AI
      },
      repetition_summary: {
        items_in_repetition_clusters: 0,
        largest_cluster_size: 0
      },
      engagement_pattern_summary: {
        top_hooks: topHooks
      },
      suggested_vs_followed: {
        suggested_count: suggestedCount,
        followed_count: followedCount,
        ad_count: adCount,
        unknown_count: unknownSourceCount,
        suggested_percentage: suggestedPercentage,
        followed_percentage: followedPercentage
      },
      engagement_summary: {
        total_likes: posts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0),
        total_comments: posts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0),
        total_shares: posts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0),
        total_views: posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0),
        posts_with_engagement: posts.filter(p => p.engagement && (p.engagement.likes || p.engagement.comments || p.engagement.shares || p.engagement.views)).length
      }
    },

    privacy: {
      user_identifiers_stored: false,
      profile_photos_stored: false,
      raw_text_stored: true,
      retention_policy_key: 'SHORT',
      redacted_fields: []
    },

    debug: {
      processing_time_seconds: processingTime,
      frames_extracted: null,
      frames_sampled_for_ocr: null,
      errors: [],
      warnings: [],
      raw_backend_payload: null
    }
  };

  // Add computed insights for easy access
  result._computed = {
    topHashtags: Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
    topTopics: topicDistribution.slice(0, 5),
    uniqueCreators: [...new Set(posts.map(p => p.creator).filter(Boolean))],
    wellbeingThemes: [], // Not analyzed - requires AI
    totalCTAs: Object.values(ctaCounts).reduce((a, b) => a + b, 0),
    suggestedPercent: Math.round(suggestedPercentage * 100),
    followedPercent: Math.round(followedPercentage * 100)
  };

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ----------------------------------------');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] FINAL RESULT:');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   scan_id:', result.scan_metadata.scan_id);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   platform:', result.scan_metadata.platform);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_feed_items:', result.aggregates.total_feed_items);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_ads:', result.aggregates.total_ads);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   ad_percentage:', (result.aggregates.ad_percentage * 100).toFixed(1) + '%');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   suggested_count:', suggestedCount);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   followed_count:', followedCount);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   suggested_percentage:', (suggestedPercentage * 100).toFixed(1) + '%');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   political_items: (not analyzed - requires AI)');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   unique_creators:', result._computed.uniqueCreators.length);

  // Final platform summary for debugging (should match input summary)
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Posts after mapping, by platform:', inputPlatformSummary);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ======== MAPPING COMPLETE ========');

  return result;
}

export default mapDesktopPostsToUnifiedResult;
