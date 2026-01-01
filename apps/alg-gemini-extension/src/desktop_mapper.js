/**
 * AlgorithmLens Desktop Mapper
 * 
 * Converts DesktopPostItem[] from DOM scanning into UnifiedScanResult format.
 * Step 11B-2: Schema mapping (no backend calls)
 */

// ============================================
// Constants & Heuristics
// ============================================

// Stop words to filter from topic extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'if', 'your', 'my', 'his', 'her', 'its',
  'our', 'their', 'me', 'him', 'us', 'them', 'get', 'got', 'like', 'new',
  'one', 'two', 'first', 'last', 'good', 'great', 'best', 'well', 'back',
  'even', 'still', 'way', 'much', 'many', 'need', 'want', 'see', 'look',
  'make', 'take', 'come', 'go', 'know', 'think', 'say', 'try', 'use', 'find'
]);

// NOTE: Keyword-based heuristics for sentiment, wellbeing, and political detection
// were removed because they produced inaccurate results (false positives from
// partial word matches, lack of context understanding).
// These fields now return null/empty to indicate "not analyzed" rather than
// showing inaccurate guesses. Accurate analysis requires AI/LLM processing.

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique scan ID
 */
function generateScanId() {
  return `desktop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract words from text, filtering stop words
 */
function extractKeywords(text) {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s#@]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  return words;
}

// NOTE: analyzeTone, detectWellbeingThemes, and isPolitical functions removed.
// Simple keyword matching produces too many false positives (e.g., "body" matching
// body_image for an NFL post, "left/right" matching political for sports content).
// Accurate sentiment/wellbeing/political detection requires LLM-based analysis.

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Classify topic from keywords
 */
function classifyTopic(keywords, hashtags) {
  const combined = [...keywords, ...hashtags.map(h => h.replace('#', '').toLowerCase())];
  
  const topicPatterns = {
    'entertainment': ['funny', 'comedy', 'meme', 'lol', 'humor', 'laugh', 'joke', 'entertainment'],
    'music': ['music', 'song', 'artist', 'album', 'concert', 'singer', 'band', 'spotify'],
    'fashion': ['fashion', 'style', 'outfit', 'clothing', 'dress', 'shoes', 'ootd', 'wear'],
    'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'hair', 'nails', 'glam', 'tutorial'],
    'food': ['food', 'recipe', 'cooking', 'eat', 'restaurant', 'delicious', 'yummy', 'foodie'],
    'fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'muscle', 'gains'],
    'travel': ['travel', 'vacation', 'trip', 'adventure', 'explore', 'destination', 'wanderlust'],
    'tech': ['tech', 'technology', 'gadget', 'phone', 'computer', 'app', 'software', 'ai'],
    'gaming': ['gaming', 'game', 'gamer', 'stream', 'twitch', 'esports', 'playstation', 'xbox'],
    'education': ['education', 'learn', 'tutorial', 'howto', 'tips', 'guide', 'study', 'school'],
    'news': ['news', 'breaking', 'update', 'report', 'headline', 'story', 'journalist'],
    'sports': ['sports', 'football', 'basketball', 'soccer', 'nfl', 'nba', 'game', 'team'],
    'lifestyle': ['lifestyle', 'life', 'daily', 'routine', 'vlog', 'day', 'morning'],
    'business': ['business', 'entrepreneur', 'startup', 'money', 'finance', 'investing', 'stock']
  };
  
  const topicCounts = {};
  
  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    for (const pattern of patterns) {
      if (combined.some(word => word.includes(pattern))) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }
  }
  
  // Get top topic
  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : 'general';
}

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
    console.warn('[AlgorithmLens][Mapper] posts is not an array, defaulting to empty');
    posts = [];
  }
  
  console.log('[AlgorithmLens][Mapper] ======== MAPPING START ========');
  console.log('[AlgorithmLens][Mapper] Input posts count:', posts.length);
  console.log('[AlgorithmLens][Mapper] Platform:', platform);
  
  // Log platform distribution of input posts
  const inputPlatformSummary = {};
  for (const post of posts) {
    const p = post.platform || 'unknown';
    inputPlatformSummary[p] = (inputPlatformSummary[p] || 0) + 1;
  }
  console.debug('[AlgorithmLens][Mapper] Posts by platform (input):', inputPlatformSummary);
  
  // ============================================
  // Process each post into FeedItem format
  // ============================================
  
  const feedItems = [];
  const topicCounts = {};
  const hashtagCounts = {};
  const ctaCounts = {};

  posts.forEach((post, index) => {
    // Extract keywords from caption
    const keywords = extractKeywords(post.caption);

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
      content_type: platform === 'youtube' ? 'VIDEO' : 'POST',
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
      }
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
  
  console.log('[AlgorithmLens][Mapper] ----------------------------------------');
  console.log('[AlgorithmLens][Mapper] AGGREGATES:');
  console.log('[AlgorithmLens][Mapper]   total_feed_items:', totalItems);
  console.log('[AlgorithmLens][Mapper]   total_ads:', totalAds);
  console.log('[AlgorithmLens][Mapper]   ad_percentage:', (adPercentage * 100).toFixed(1) + '%');
  
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
    totalCTAs: Object.values(ctaCounts).reduce((a, b) => a + b, 0)
  };

  console.log('[AlgorithmLens][Mapper] ----------------------------------------');
  console.log('[AlgorithmLens][Mapper] FINAL RESULT:');
  console.log('[AlgorithmLens][Mapper]   scan_id:', result.scan_metadata.scan_id);
  console.log('[AlgorithmLens][Mapper]   platform:', result.scan_metadata.platform);
  console.log('[AlgorithmLens][Mapper]   total_feed_items:', result.aggregates.total_feed_items);
  console.log('[AlgorithmLens][Mapper]   total_ads:', result.aggregates.total_ads);
  console.log('[AlgorithmLens][Mapper]   ad_percentage:', (result.aggregates.ad_percentage * 100).toFixed(1) + '%');
  console.log('[AlgorithmLens][Mapper]   political_items: (not analyzed - requires AI)');
  console.log('[AlgorithmLens][Mapper]   unique_creators:', result._computed.uniqueCreators.length);
  
  // Final platform summary for debugging (should match input summary)
  console.debug('[AlgorithmLens][Mapper] Posts after mapping, by platform:', inputPlatformSummary);
  console.log('[AlgorithmLens][Mapper] ======== MAPPING COMPLETE ========');
  
  return result;
}

/**
 * Detect operating system
 */
function detectOS() {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) return 'WINDOWS';
  if (userAgent.includes('mac')) return 'MACOS';
  if (userAgent.includes('linux')) return 'LINUX';
  if (userAgent.includes('cros')) return 'CHROMEOS';
  
  return 'UNKNOWN';
}

// Export for use in other modules
export default mapDesktopPostsToUnifiedResult;

