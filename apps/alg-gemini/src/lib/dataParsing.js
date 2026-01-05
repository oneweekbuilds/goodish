/**
 * Unified data parsing module for scan results
 * 
 * Extracts display data from unified scan schema, handling both
 * desktop extension and mobile video upload formats.
 * 
 * Phase 1A: Extracted from ResultsPage.jsx with no behavior changes.
 * Phase 1B: Added explicit source detection and schema normalization.
 */

/**
 * Detect scan source (desktop extension vs mobile upload)
 * 
 * Detection logic (in order of priority):
 * 1. source_type === "DESKTOP_EXTENSION" (top-level or in scan_metadata)
 * 2. scan.id starts with "desktop-" (fallback heuristic)
 * 3. environment.extension_capture exists
 * 4. Otherwise → 'mobile' (video upload)
 * 
 * @param {Object} data - Raw scan result data (may be nested)
 * @param {Object} scanData - Extracted scan data
 * @returns {string} - 'desktop' | 'mobile'
 */
function detectScanSource(data, scanData) {
  // Check top-level source_type
  if (data.source_type === 'DESKTOP_EXTENSION') {
    return 'desktop';
  }

  // Check nested scan_metadata
  const scanMeta = scanData.scan_metadata || data.scan_metadata;
  if (scanMeta?.source_type === 'DESKTOP_EXTENSION') {
    return 'desktop';
  }

  // Check ID prefix (fallback heuristic)
  const scanId = data.id || scanMeta?.scan_id || scanData.id;
  if (scanId?.startsWith('desktop-')) {
    return 'desktop';
  }

  // Check environment for extension capture
  const env = scanData.environment || data.environment;
  if (env?.extension_capture) {
    return 'desktop';
  }

  // Default to mobile upload for video-based scans
  return 'mobile';
}

/**
 * Extract display data from unified schema
 * 
 * @param {Object} data - Raw scan result data (may be nested)
 * @returns {Object|null} - Parsed display data or null if parsing fails
 */
export function getDisplayData(data) {
  if (!data) {
    console.log('getDisplayData: No data provided');
    return null;
  }

  try {
    console.log('getDisplayData: Processing data:', data);
    // Handle both direct result and nested result
    const scanData = data.result || data.scan || data;
    console.log('getDisplayData: Extracted scanData:', scanData);
    
    // Phase 1B: Explicit source detection (single source of truth)
    const source = detectScanSource(data, scanData);
    
    // Basic info
    const platform = scanData.scan_metadata?.platform || data.platform || 'Unknown';
    const timestamp = scanData.scan_metadata?.created_at || data.created_at || new Date().toISOString();
    
    // Aggregates
    const aggregates = scanData.aggregates || {};
    const totalPosts = aggregates.total_feed_items || 0;
    const adPercentage = Math.round((aggregates.ad_percentage || 0) * 100);
    const adsCount = Math.round(totalPosts * (aggregates.ad_percentage || 0));
    
    // Topics
    const topTopics = (aggregates.topic_distribution || []).slice(0, 6).map(t => ({
      topic: t.category,
      percentage: t.percentage
    }));
    const categoriesCount = topTopics.length;

    // Check if wellbeing/political analysis was done (null means NOT_ANALYZED for desktop scans)
    const isNotAnalyzed = aggregates.wellbeing_summary?.valence_distribution === null ||
                          aggregates.political_content_summary?.political_percentage === null;

    // Tone breakdown - show actual data only, no synthetic defaults
    const valence = aggregates.wellbeing_summary?.valence_distribution || {};
    const totalValence = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + (valence.NEGATIVE || 0);
    const toneBreakdown = {
      positive: totalValence > 0 ? (valence.POSITIVE || 0) / totalValence : 0,
      neutral: totalValence > 0 ? (valence.NEUTRAL || 0) / totalValence : 0,
      negative: totalValence > 0 ? (valence.NEGATIVE || 0) / totalValence : 0,
      hasData: totalValence > 0 && !isNotAnalyzed,
      isNotAnalyzed, // Flag to show "AI analysis required" message
    };

    // Political - null means not analyzed
    const politicalPercentage = aggregates.political_content_summary?.political_percentage ?? null;

    // Wellbeing - calculated from actual feed items only
    const feedItems = scanData.feed_items || [];
    let bodyImageCount = 0;
    let dietCount = 0;
    let conflictCount = 0;

    // Only count themes if analysis was done
    if (!isNotAnalyzed) {
      feedItems.forEach(item => {
        const themes = item.wellbeing?.themes || [];
        if (themes.includes('body_image')) bodyImageCount++;
        if (themes.includes('diet_weight_loss') || themes.includes('diet_weight')) dietCount++;
        if (themes.includes('conflict')) conflictCount++;
      });
    }

    const wellbeing = {
      bodyImage: feedItems.length > 0 && !isNotAnalyzed ? bodyImageCount / feedItems.length : 0,
      dietWeight: feedItems.length > 0 && !isNotAnalyzed ? dietCount / feedItems.length : 0,
      conflict: feedItems.length > 0 && !isNotAnalyzed ? conflictCount / feedItems.length : 0,
      hasData: feedItems.length > 0 && !isNotAnalyzed,
      isNotAnalyzed, // Flag to show "AI analysis required" message
    };

    // Feed items for post-by-post breakdown
    const parsedFeedItems = feedItems.map(item => {
      const badges = [];
      if (item.is_ad) badges.push('Sponsored');
      if (item.political?.is_political) badges.push('Political');

      // Support both mobile (creator.handle) and desktop (account.account_handle) schemas
      const creator = item.creator?.handle ||
                      item.creator?.name ||
                      item.account?.account_handle ||
                      item.account?.account_display_name ||
                      null;

      // Support both mobile (text_content.caption) and desktop (content_text.captions) schemas
      const captions = item.content_text?.captions || [];
      const caption = item.text_content?.caption ||
                      item.text_content?.ocr_text ||
                      (captions.length > 0 ? captions[0] : null) ||
                      'No caption';

      // Get post URL from desktop schema
      const postUrl = item.source_details?.dom_metadata?.post_url || null;

      return {
        thumbnail: item.thumbnail_url || null,
        creator,
        caption,
        postUrl,
        badges,
        categories: item.topics || [],
        details: {
          isAd: item.is_ad,
          valence: item.wellbeing?.valence,
          themes: item.wellbeing?.themes || [],
          product: item.ad_metadata?.product_or_service,
        },
      };
    });

    return {
      platform,
      timestamp,
      source, // Phase 1B: Explicit source detection
      totalPosts,
      adsCount,
      adPercentage,
      categoriesCount,
      topTopics,
      toneBreakdown,
      politicalPercentage,
      wellbeing,
      feedItems: parsedFeedItems,
    };
  } catch (err) {
    console.error('Error parsing display data:', err);
    return null;
  }
}

