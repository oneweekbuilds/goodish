"""
Gemini Flash-based content analysis for AlgorithmLens.

PRODUCT POLICY:
- Gemini AI analysis is CORE to every scan - NOT a separate tier or upsell
- AI analysis runs on every scan where user gives consent
- There are no "Gemini credits" or "Gemini limits"
- The only limit is total scans, and Gemini is included with each scan

Analyzes social media posts for:
- Sentiment (positive/neutral/negative)
- Political content detection
- Wellbeing themes (body image, diet, mental health, etc.)

Uses Gemini 2.0 Flash for cost-effective batch analysis.
Estimated cost: ~$0.0004 per scan (25 posts).
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

# Lazy import to avoid startup errors if API key not set
_gemini_model = None

logger = logging.getLogger(__name__)


def _get_gemini_model():
    """Lazy initialization of Gemini model."""
    global _gemini_model
    if _gemini_model is None:
        try:
            import google.generativeai as genai

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                logger.warning("GEMINI_API_KEY not set - content analysis will be skipped")
                return None

            genai.configure(api_key=api_key)
            _gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("Gemini model initialized successfully")
        except ImportError:
            logger.error("google-generativeai not installed")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            return None

    return _gemini_model


# Analysis prompt - optimized for batch processing
ANALYSIS_PROMPT = """You are an Expert Algorithm Auditor analyzing social media content. Your role is to detect subtle cues, emotional subtext, and engagement bait that algorithms use to manipulate user attention and wellbeing.

For each post, determine:
1. **primary_topic**: The main content category. Choose ONE from this list:
   - "sports" - sports teams, games, athletes, scores, leagues (NFL, NBA, MLB, NHL, soccer, etc.)
   - "entertainment" - movies, TV shows, celebrities, comedy, memes, viral content
   - "music" - songs, artists, albums, concerts, music industry
   - "gaming" - video games, esports, streamers, gaming culture
   - "food" - recipes, restaurants, cooking, food reviews
   - "fitness" - workouts, gym, exercise, health routines
   - "beauty" - makeup, skincare, cosmetics, beauty tutorials
   - "fashion" - clothing, style, outfits, fashion trends
   - "travel" - destinations, vacations, trips, tourism
   - "tech" - technology, gadgets, software, AI, crypto
   - "business" - finance, investing, career, entrepreneurship
   - "politics" - elections, policy, government, political figures
   - "news" - current events, breaking news, journalism
   - "education" - learning, tutorials, academic content, educational videos for any age (including children's educational content)
   - "lifestyle" - daily life, wellness, home, pets, parenting
   - "general" - if none of the above clearly apply
2. **sentiment**: "POSITIVE", "NEUTRAL", or "NEGATIVE" based on overall emotional tone. Look for emotional subtext even in seemingly neutral content.
3. **is_political**: true/false - Does this post discuss politics, elections, government, policy, politicians, or political issues?
4. **political_topic**: If political, briefly describe the topic (e.g., "US election", "climate policy"). Null if not political.
5. **wellbeing_themes**: Array of relevant themes from this list (empty if none apply):
   - "fitness" - exercise, gym, workouts
   - "diet_weight" - dieting, weight loss, calories, eating habits
   - "body_image" - appearance, body shape, beauty standards, transformations, before/after posts, glow ups, physique checks, gym selfies, cosmetic procedures (botox, fillers, BBL), body comparisons, ideal body messaging, beach/bikini body content, thinspo, fitspiration
   - "mental_health" - anxiety, depression, therapy, stress
   - "motivation" - hustle culture, productivity, success mindset
   - "conflict" - arguments, drama, controversy, outrage
   - "comparison_envy" - social comparison, envy-inducing content, lifestyle comparisons
   - "political_polarization" - divisive political content designed to create us-vs-them dynamics
   - "hustle_culture" - extreme productivity messaging, burnout normalization, workaholic culture
   - "misinformation" - false or misleading claims, conspiracy theories, unverified information

Posts to analyze (JSON array):
{posts_json}

Return ONLY a JSON array with one object per post, in the same order. Example:
[
  {{"primary_topic": "fitness", "sentiment": "POSITIVE", "is_political": false, "political_topic": null, "wellbeing_themes": ["fitness", "motivation"]}},
  {{"primary_topic": "politics", "sentiment": "NEGATIVE", "is_political": true, "political_topic": "US election", "wellbeing_themes": ["political_polarization"]}}
]

Important:
- Be accurate and conservative. Only mark as political if clearly about politics.
- For primary_topic, choose the BEST single category. Sports content about NFL/NBA/etc. should be "sports", not "entertainment".
- Look for subtle cues, emotional subtext, and engagement bait. If you detect even slight evidence of a theme, classify it. Do not default to neutral if there is subtext.
- wellbeing_themes should include themes that are present, even if subtle. Look for engagement patterns, comparison triggers, and emotional manipulation tactics.
- Return ONLY the JSON array, no other text."""


def analyze_posts_batch(posts: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    """
    Analyze a batch of posts using Gemini Flash.

    Args:
        posts: List of post dictionaries with at least 'caption' or 'text' field

    Returns:
        List of analysis results, one per post, or None if analysis failed
    """
    model = _get_gemini_model()
    if model is None:
        return None

    if not posts:
        return []

    # Prepare minimal post data for analysis (reduce tokens)
    posts_for_analysis = []
    for i, post in enumerate(posts):
        text = post.get("caption") or post.get("text") or ""
        creator = post.get("creator") or post.get("account_handle") or ""
        hashtags = post.get("hashtags", [])

        # Truncate very long posts (Gemini Flash handles large context easily)
        if len(text) > 5000:
            text = text[:5000] + "..."

        posts_for_analysis.append({
            "index": i,
            "text": text,
            "creator": creator,
            "hashtags": hashtags if hashtags else []
        })

    try:
        # Build prompt
        posts_json = json.dumps(posts_for_analysis, ensure_ascii=False)
        prompt = ANALYSIS_PROMPT.format(posts_json=posts_json)

        # DEBUG: Log what we're sending to Gemini (with safe encoding for Windows console)
        print(f"[Gemini] Sending {len(posts_for_analysis)} posts for analysis:")
        for p in posts_for_analysis:
            # Encode to ASCII with replacement to avoid Windows console encoding errors
            safe_creator = (p['creator'] or '').encode('ascii', 'replace').decode('ascii')
            safe_text = (p['text'][:80] if p['text'] else '').encode('ascii', 'replace').decode('ascii')
            print(f"  [{p['index']}] @{safe_creator}: {safe_text}...")

        # Call Gemini
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,  # Low temperature for consistent classification
                "max_output_tokens": 8192,
            }
        )

        # Parse response
        response_text = response.text.strip()

        # DEBUG: Log raw Gemini response
        print(f"[Gemini] Raw response (first 500 chars): {response_text[:500]}")

        # Clean up response if wrapped in markdown code block
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (```json and ```)
            response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

        results = json.loads(response_text)

        # Validate we got the right number of results
        if len(results) != len(posts):
            logger.warning(f"Gemini returned {len(results)} results for {len(posts)} posts")
            # Pad with defaults if needed
            while len(results) < len(posts):
                results.append({
                    "primary_topic": "general",
                    "sentiment": "NEUTRAL",
                    "is_political": False,
                    "political_topic": None,
                    "wellbeing_themes": []
                })

        return results

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.debug(f"Response was: {response_text[:500] if 'response_text' in dir() else 'N/A'}")
        return None
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        return None


def merge_analysis_into_scan(scan_result: Dict[str, Any], analysis_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Merge Gemini analysis results into a scan result.

    Args:
        scan_result: The UnifiedScanResult dictionary
        analysis_results: List of analysis results from analyze_posts_batch

    Returns:
        Updated scan_result with AI analysis merged in
    """
    feed_items = scan_result.get("feed_items", [])

    if len(analysis_results) != len(feed_items):
        logger.warning(f"Analysis count ({len(analysis_results)}) doesn't match feed items ({len(feed_items)})")

    # Track aggregates
    valence_counts = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0}
    political_count = 0
    wellbeing_theme_counts = {}
    topic_counts = {}  # Track AI-classified topics for aggregates

    for i, item in enumerate(feed_items):
        if i < len(analysis_results):
            analysis = analysis_results[i]

            # Update topics with AI-classified primary_topic (overwrites keyword-based guess)
            primary_topic = analysis.get("primary_topic", "general")
            if "topics" not in item:
                item["topics"] = {}
            item["topics"]["primary_category"] = primary_topic
            topic_counts[primary_topic] = topic_counts.get(primary_topic, 0) + 1

            # Update wellbeing
            sentiment = analysis.get("sentiment", "NEUTRAL")
            themes = analysis.get("wellbeing_themes", [])

            item["wellbeing"] = {
                "wellbeing_relevance": "MEDIUM" if themes else "NONE",
                "valence": sentiment,
                "themes": themes,
                "potential_risk_flags": []
            }

            # Update political
            is_political = analysis.get("is_political", False)
            item["political"] = {
                "is_political": is_political,
                "political_subtype": analysis.get("political_topic"),
                "stance_or_alignment_guess": None,
                "policy_area": analysis.get("political_topic"),
                "geographic_focus": None
            }

            # Track aggregates
            valence_counts[sentiment] = valence_counts.get(sentiment, 0) + 1
            if is_political:
                political_count += 1
            for theme in themes:
                wellbeing_theme_counts[theme] = wellbeing_theme_counts.get(theme, 0) + 1

    # Update aggregates
    total_items = len(feed_items)
    total_valence = sum(valence_counts.values())

    scan_result["aggregates"]["wellbeing_summary"] = {
        "high_relevance_items": sum(1 for item in feed_items if item.get("wellbeing", {}).get("themes")),
        "potential_risk_items": 0,
        "valence_distribution": {
            "POSITIVE": valence_counts.get("POSITIVE", 0),
            "NEUTRAL": valence_counts.get("NEUTRAL", 0),
            "NEGATIVE": valence_counts.get("NEGATIVE", 0),
            "MIXED": 0
        }
    }

    scan_result["aggregates"]["political_content_summary"] = {
        "political_items": political_count,
        "political_percentage": political_count / total_items if total_items > 0 else 0
    }

    # Update topic_distribution with AI-classified topics (overwrites keyword-based distribution)
    if topic_counts:
        ai_topic_distribution = [
            {
                "category": category,
                "count": count,
                "percentage": count / total_items if total_items > 0 else 0
            }
            for category, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        scan_result["aggregates"]["topic_distribution"] = ai_topic_distribution

    # Update computed themes if present
    if "_computed" in scan_result:
        scan_result["_computed"]["wellbeingThemes"] = list(wellbeing_theme_counts.keys())
        # Also update topTopics with AI-classified topics
        if topic_counts:
            scan_result["_computed"]["topTopics"] = [
                {"category": cat, "count": cnt, "percentage": cnt / total_items if total_items > 0 else 0}
                for cat, cnt in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            ]

    return scan_result


def analyze_scan(scan_result: Dict[str, Any]) -> tuple[Dict[str, Any], bool, str]:
    """
    Analyze a complete scan result with Gemini and merge the results.

    This is the main entry point for AI-powered content analysis.

    Args:
        scan_result: The UnifiedScanResult dictionary

    Returns:
        Tuple of (scan_result, success, reason):
        - scan_result: Updated with AI analysis, or original if analysis failed
        - success: True if AI analysis was performed, False otherwise
        - reason: Explanation of success/failure (e.g., "success", "no_api_key", "no_feed_items", "api_error")
    """
    feed_items = scan_result.get("feed_items", [])

    if not feed_items:
        logger.info("No feed items to analyze")
        return scan_result, False, "no_feed_items"

    # Check if Gemini is available before preparing posts
    model = _get_gemini_model()
    if model is None:
        logger.warning("Gemini API key not configured - analysis skipped")
        return scan_result, False, "no_api_key"

    # Prepare posts for analysis
    posts = []
    for item in feed_items:
        captions = item.get("content_text", {}).get("captions", [])
        # Join all available captions into a single text block
        caption = " ".join(captions) if captions else ""

        posts.append({
            "caption": caption,
            "creator": item.get("account", {}).get("account_handle"),
            "hashtags": item.get("content_text", {}).get("hashtags", [])
        })

    # Run batch analysis
    analysis_results = analyze_posts_batch(posts)

    if analysis_results is None:
        logger.warning("Gemini analysis failed or unavailable, returning original scan")
        return scan_result, False, "api_error"

    # Merge results
    merged_scan = merge_analysis_into_scan(scan_result, analysis_results)
    return merged_scan, True, "success"


def is_gemini_available() -> bool:
    """
    Check if Gemini API key is configured.

    Note: This is kept for backwards compatibility but should NOT be used
    to gate Gemini usage. Per product policy, Gemini runs on every scan
    where user consents. If the key is missing in production, it's a
    configuration error, not a feature gate.
    """
    return os.environ.get("GEMINI_API_KEY") is not None
