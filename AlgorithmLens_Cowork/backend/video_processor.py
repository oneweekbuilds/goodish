import logging

logger = logging.getLogger(__name__)

try:
    import cv2  # type: ignore
except ModuleNotFoundError:
    cv2 = None
import pytesseract
from PIL import Image
import numpy as np
import os
import re
import uuid
from datetime import datetime
import time
from unified_scan_models import (
    UnifiedScanResult, ScanMetadata, Environment, VideoCaptureInfo,
    FeedItem, AdMetadata, ContentText, TopicsInfo, PoliticalInfo,
    WellbeingInfo, EngagementDrivers, RepetitionInfo, SourceDetails,
    Aggregates, TopicDistributionEntry, WellbeingSummary, ValenceDistribution,
    PoliticalContentSummary, RepetitionSummary, EngagementPatternSummary, HookCount,
    PrivacyInfo, DebugInfo, ScreenResolution, OcrMetadata
)
from ocr_utils import (
    extract_text_with_preprocessing,
    detect_ad_from_ocr,
    OCRDebugger,
    get_ocr_debug_enabled
)

# Ensure Tesseract is available.
# On Windows, you might need to set the path explicitly if it's not in PATH.
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ============================================
# Wellbeing Theme Detection Keywords
# ============================================

# Body image keywords - expanded list for better detection
# Includes hashtags (without #), phrases, and single words
BODY_IMAGE_KEYWORDS = [
    # Direct body terms
    "body", "weight", "waist", "thigh", "stomach", "belly", "abs",
    "hips", "arms", "legs", "physique", "figure",
    # Body descriptors
    "thin", "skinny", "fat", "slim", "curvy", "thick", "lean",
    "toned", "shredded", "bulky", "petite", "plus size",
    # Transformation/progress terms
    "transformation", "beforeandafter", "before and after",
    "glow up", "glowup", "progress", "journey",
    "gains", "cut", "bulk", "recomp",
    # Fitness appearance terms
    "fitcheck", "fit check", "physique check", "mirror selfie",
    "gym selfie", "flexing", "posing",
    # Hashtags (without #)
    "bodypositivity", "bodygoals", "bodyimage", "bodycheck",
    "fitspo", "fitspiration", "gymshark", "gymmotivation",
    "weightloss", "weightlossjourney", "fatloss",
    # Harmful content markers (for awareness, not endorsement)
    "thinspo", "thinspiration", "proana",
    # Beauty standards
    "beauty standard", "pretty privilege", "attractive",
    "glow", "skin", "acne", "clear skin", "perfect body",
    # Cosmetic procedures
    "bbl", "botox", "filler", "lip filler", "plastic surgery",
    "nose job", "rhinoplasty", "facelift", "lipo", "liposuction",
    "coolsculpting", "tummy tuck",
    # Comparison triggers
    "body type", "ideal body", "dream body", "goal body",
    "body goals", "summer body", "beach body", "bikini body",
]

# Diet/weight loss keywords - expanded
DIET_KEYWORDS = [
    # Diet terms
    "diet", "calorie", "calories", "deficit", "surplus",
    "macro", "macros", "carb", "carbs", "protein",
    # Diet types
    "keto", "paleo", "vegan", "intermittent fasting", "fasting",
    "low carb", "no carb", "clean eating", "meal prep",
    # Weight loss terms
    "weight loss", "weightloss", "fat loss", "fatloss",
    "lose weight", "losing weight", "shed pounds", "drop weight",
    # Food/eating patterns
    "what i eat", "what i ate", "full day of eating",
    "cheat meal", "cheat day", "binge", "restrict",
    "food diary", "calorie counting",
    # Hashtags
    "weightlossjourney", "caloriedeficit", "mealprep",
    "eatclean", "cleaneating", "healthyeating",
]

# Conflict/drama keywords
CONFLICT_KEYWORDS = [
    "conflict", "drama", "fight", "argument", "beef",
    "exposed", "cancelled", "canceled", "call out", "callout",
    "toxic", "problematic", "controversy", "scandal",
    "feud", "clap back", "shade", "tea", "spill",
]

# Ad/promotional detection keywords for video OCR
# These supplement the OCR disclosure token detection
AD_PROMO_KEYWORDS = [
    # Call to action
    "shop now", "link in bio", "swipe up", "tap link",
    "click link", "buy now", "order now", "get yours",
    # Discount/code signals
    "use code", "use my code", "promo code", "discount code",
    "% off", "save now", "exclusive discount",
    # Affiliate signals
    "affiliate", "commission", "linktr.ee", "bit.ly",
    "amazon.to", "amzn.to", "shopmy", "ltk.app",
    # Influencer/brand signals
    "sent me", "gifted", "pr package", "brand deal",
    "partnered with", "in partnership", "ambassador",
    "thanks to", "#ad", "#sponsored", "#partner",
]

# ============================================
# Hashtag-to-Topic Dictionary
# ============================================
# Maps common hashtags/keywords to topic categories
# Categories align with Gemini analyzer topics

TOPIC_HASHTAGS = {
    "fitness": [
        # Exercise types
        "workout", "gym", "fitness", "exercise", "training",
        "cardio", "hiit", "crossfit", "pilates", "yoga",
        "weightlifting", "powerlifting", "bodybuilding",
        # Fitness hashtags
        "fitfam", "fitspo", "gymlife", "gymmotivation",
        "workoutmotivation", "fitnessmotivation", "getfit",
        "strongnotskinny", "legday", "armday", "chestday",
        "personaltrainer", "pt", "homeworkout", "hiitworkout",
        # Running/sports
        "running", "runner", "marathon", "5k", "10k",
        "cycling", "swimmer", "triathlon",
    ],
    "beauty": [
        # Makeup
        "makeup", "mua", "makeupartist", "makeuptutorial",
        "eyeshadow", "lipstick", "foundation", "mascara",
        "contour", "highlight", "blush", "concealer",
        # Skincare
        "skincare", "skincareroutine", "skincaretips",
        "cleanser", "moisturizer", "serum", "spf", "sunscreen",
        "acne", "antiaging", "glowingskin", "clearskin",
        # Hair
        "hair", "hairstyle", "haircare", "haircolor",
        "balayage", "blowout", "curls", "straighthair",
        # Nails
        "nails", "nailart", "manicure", "pedicure", "gelnails",
        # Beauty hashtags
        "beauty", "beautytips", "beautyhacks", "grwm",
        "getreadywithme", "beautyinfluencer", "beautyblogger",
    ],
    "fashion": [
        # Clothing
        "fashion", "style", "outfit", "ootd", "outfitoftheday",
        "streetstyle", "streetwear", "mensfashion", "womensfashion",
        # Fashion terms
        "trendy", "fashionista", "fashionblogger", "stylist",
        "lookbook", "haul", "tryonhaul", "shein", "zara",
        # Accessories
        "shoes", "sneakers", "bags", "jewelry", "watches",
        "sunglasses", "accessories",
        # Seasons
        "summeroutfit", "winterfashion", "falloutfit", "springfashion",
    ],
    "food": [
        # Cooking
        "food", "foodie", "cooking", "recipe", "recipes",
        "homemade", "homecooking", "chef", "baking",
        # Food types
        "breakfast", "lunch", "dinner", "brunch", "dessert",
        "snack", "appetizer", "meal", "mealprep",
        # Cuisines
        "italian", "mexican", "asian", "indian", "japanese",
        "chinese", "thai", "korean", "mediterranean",
        # Food hashtags
        "foodporn", "foodstagram", "instafood", "yummy",
        "delicious", "tasty", "foodphotography", "foodblogger",
        "mukbang", "asmr", "whatieatinaday",
        # Restaurants
        "restaurant", "cafe", "brunch", "foodreview",
    ],
    "travel": [
        # Travel terms
        "travel", "traveling", "traveler", "wanderlust",
        "vacation", "holiday", "trip", "adventure",
        "explore", "explorer", "backpacking", "roadtrip",
        # Travel hashtags
        "travelgram", "instatravel", "travelphotography",
        "travelblogger", "travellife", "traveladdict",
        # Destinations
        "beach", "mountains", "city", "nature", "island",
        "europe", "asia", "bali", "paris", "tokyo", "nyc",
        # Accommodation
        "hotel", "resort", "airbnb", "hostel",
    ],
    "gaming": [
        # Gaming general
        "gaming", "gamer", "videogames", "game", "games",
        "esports", "streamer", "twitch", "youtube gaming",
        # Platforms
        "playstation", "xbox", "nintendo", "pc gaming",
        "ps5", "ps4", "switch", "steam",
        # Game types
        "fps", "rpg", "mmorpg", "battle royale",
        # Popular games
        "fortnite", "minecraft", "valorant", "cod",
        "apex", "league", "lol", "overwatch", "gta",
        "zelda", "pokemon", "fifa", "nba2k",
        # Gaming hashtags
        "gaminglife", "gamingcommunity", "gamersofinstagram",
    ],
    "entertainment": [
        # Movies/TV
        "movie", "movies", "film", "cinema", "tv",
        "netflix", "hulu", "disney", "hbo", "streaming",
        "tvshow", "series", "binge", "bingewatching",
        # Music
        "music", "song", "singer", "artist", "concert",
        "playlist", "spotify", "newmusic", "musicvideo",
        # Celebrities
        "celebrity", "celeb", "hollywood", "redcarpet",
        "famous", "star", "idol", "kpop", "pop",
        # Entertainment hashtags
        "moviereview", "filmreview", "entertainment",
        "popculture", "viral", "trending",
    ],
    "sports": [
        # Sports general
        "sports", "sport", "athlete", "team",
        # Major sports
        "football", "nfl", "basketball", "nba",
        "soccer", "baseball", "mlb", "hockey", "nhl",
        "tennis", "golf", "boxing", "mma", "ufc",
        # Sports hashtags
        "gameday", "sportsnews", "espn", "highlights",
        "touchdown", "goal", "slam dunk", "homerun",
        # Teams/Leagues
        "premier league", "champions league", "world cup",
    ],
    "technology": [
        # Tech general
        "tech", "technology", "gadget", "gadgets",
        "innovation", "digital", "techreview",
        # Devices
        "smartphone", "iphone", "android", "samsung",
        "laptop", "computer", "tablet", "ipad",
        # Tech topics
        "ai", "artificial intelligence", "machine learning",
        "coding", "programming", "developer", "software",
        "startup", "app", "crypto", "blockchain", "nft",
        # Tech brands
        "apple", "google", "microsoft", "tesla",
    ],
    "politics": [
        # Political terms
        "politics", "political", "government", "policy",
        "election", "vote", "voting", "democracy",
        "liberal", "conservative", "democrat", "republican",
        # Political topics
        "congress", "senate", "president", "campaign",
        "debate", "legislation", "bill", "law",
        # Social issues
        "rights", "protest", "activism", "activist",
        "justice", "equality", "climate", "immigration",
    ],
    "news": [
        # News terms
        "news", "breaking", "breakingnews", "headline",
        "current events", "journalism", "journalist",
        "reporter", "media", "press",
        # News sources
        "cnn", "bbc", "fox", "nytimes", "washington post",
    ],
    "education": [
        # Education terms
        "education", "learning", "study", "studying",
        "school", "college", "university", "student",
        "teacher", "professor", "lecture",
        # Learning content
        "tutorial", "howto", "tips", "tricks", "hack",
        "diy", "learn", "course", "class", "lesson",
        # Educational hashtags
        "studygram", "studytips", "learnsomething",
        "educationmatters", "knowledge",
    ],
    "lifestyle": [
        # Lifestyle general
        "lifestyle", "life", "daily", "routine",
        "dayinmylife", "vlog", "vlogger",
        # Home
        "home", "homedecor", "interior", "apartment",
        "house", "room", "bedroom", "livingroom",
        "organization", "cleaning", "minimalist",
        # Wellness
        "wellness", "selfcare", "mentalhealth", "mindfulness",
        "meditation", "relaxation", "motivation",
        # Family/Pets
        "family", "parenting", "mom", "dad", "baby",
        "kids", "pet", "dog", "cat", "puppy", "kitten",
        # Relationships
        "couple", "relationship", "dating", "love",
    ],
    "business": [
        # Business terms
        "business", "entrepreneur", "startup", "ceo",
        "hustle", "grind", "success", "money",
        # Finance
        "finance", "investing", "investment", "stocks",
        "trading", "crypto", "wealth", "passive income",
        # Career
        "career", "job", "work", "office", "professional",
        "networking", "linkedin", "resume",
        # Business hashtags
        "entrepreneurlife", "smallbusiness", "businessowner",
        "sidehustle", "millionaire", "financialfreedom",
    ],
}


def _normalize_text_for_matching(text: str) -> str:
    """Normalize text for keyword matching (lowercase, collapse whitespace)."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.lower().strip())


def _detect_topic_from_hashtags(text: str) -> tuple:
    """
    Detect content topic from text using hashtag/keyword dictionary.

    Returns:
        tuple of (primary_topic: str or None, matched_keywords: list)
    """
    normalized = _normalize_text_for_matching(text)
    if not normalized:
        return None, []

    # Count matches per topic
    topic_matches = {}
    matched_keywords = []

    for topic, keywords in TOPIC_HASHTAGS.items():
        matches = []
        for keyword in keywords:
            if keyword in normalized:
                matches.append(keyword)
        if matches:
            topic_matches[topic] = len(matches)
            matched_keywords.extend(matches)

    if not topic_matches:
        return None, []

    # Return topic with most matches
    primary_topic = max(topic_matches, key=topic_matches.get)
    return primary_topic, matched_keywords


def _detect_ad_from_keywords(text: str) -> tuple:
    """
    Detect promotional/ad content from text using keyword matching.

    Returns:
        tuple of (is_ad: bool, matched_keyword: str or None)
    """
    normalized = _normalize_text_for_matching(text)
    if not normalized:
        return False, None

    for keyword in AD_PROMO_KEYWORDS:
        if keyword in normalized:
            return True, keyword

    return False, None


def _detect_ai_disclosure(text: str, platform: str = None) -> tuple:
    """
    Detect platform AI disclosure labels from OCR text.

    This detects EXPLICIT platform-provided labels indicating AI-generated content,
    NOT inference of AI generation from visual analysis.

    Platform AI labels include:
    - Instagram: "Made with AI" badge
    - TikTok: "AI generated" label
    - X/Twitter: "Synthetic and manipulated media" badge
    - YouTube: "Altered or synthetic content" disclosure
    - Meta platforms: "Imagined with AI" label

    Uses strict exact phrase matching (case-insensitive, normalized whitespace).
    Does NOT match partial substrings like just "AI" alone.

    IMPORTANT: Phrase allowlist is gated by platform to prevent cross-platform false positives.
    If platform is unknown or missing, detection is skipped.

    Args:
        text: OCR-extracted text to analyze
        platform: Platform identifier (e.g., "TIKTOK", "INSTAGRAM", "YOUTUBE")

    Returns:
        tuple of (label: str, matched_text: str or None)
        - label: "LABELED_AI" if platform AI disclosure label detected, "NOT_LABELED" otherwise
        - matched_text: Exact phrase that was matched, or None if no match
    """
    normalized = _normalize_text_for_matching(text)
    if not normalized:
        return ("NOT_LABELED", None)

    # If platform is unknown/missing, skip detection to avoid false positives
    if not platform:
        return ("NOT_LABELED", None)

    platform_normalized = platform.upper() if platform else ""

    # Platform-specific AI disclosure phrases (gated by platform)
    # Only phrases that the specified platform actually uses
    ai_label_keywords = []

    if "INSTAGRAM" in platform_normalized or "META" in platform_normalized or "FACEBOOK" in platform_normalized:
        # Instagram/Meta family phrases
        ai_label_keywords.extend([
            "made with ai",
            "imagined with ai",
            "created with ai",
        ])
    elif "TIKTOK" in platform_normalized:
        # TikTok-specific phrases
        ai_label_keywords.extend([
            "ai generated",
            "ai-generated content",
            "generated by ai",
        ])
    elif "TWITTER" in platform_normalized or platform_normalized == "X":
        # X/Twitter phrases
        ai_label_keywords.extend([
            "synthetic and manipulated media",
            "synthetic media",
            "manipulated media",
        ])
    elif "YOUTUBE" in platform_normalized:
        # YouTube phrases
        ai_label_keywords.extend([
            "altered or synthetic content",
            "altered content",
            "synthetic content",
        ])
    elif "LINKEDIN" in platform_normalized:
        # LinkedIn phrases
        ai_label_keywords.extend([
            "ai-generated content",
            "ai generated",
            "created with ai",
        ])
    elif "REDDIT" in platform_normalized:
        # Reddit phrases
        ai_label_keywords.extend([
            "ai generated",
            "ai-generated content",
            "synthetic content",
        ])
    else:
        # Unknown platform - skip detection to avoid false positives
        return ("NOT_LABELED", None)

    # Match exact phrases only (not partial substrings)
    for keyword in ai_label_keywords:
        # Use word boundary matching: phrase must be surrounded by spaces or be at start/end
        if f" {keyword} " in f" {normalized} " or normalized.startswith(keyword + " ") or normalized.endswith(" " + keyword) or normalized == keyword:
            return ("LABELED_AI", keyword)

    return ("NOT_LABELED", None)


def _detect_c2pa_disclosure(text: str) -> tuple:
    """
    Detect C2PA / Content Credentials indicators from OCR text.

    C2PA (Coalition for Content Provenance and Authenticity) is an industry standard
    for content authenticity and provenance. When present, it provides cryptographic
    proof of content origin and editing history.

    Note: This detects on-screen TEXT mentioning C2PA/Content Credentials. It does NOT
    verify cryptographic signatures or parse actual C2PA metadata - it only reports
    visible text that suggests C2PA may be present.

    Uses strict exact phrase matching (case-insensitive, normalized whitespace).

    Returns:
        tuple of (label: str, matched_text: str or None)
        - label: "HAS_C2PA" if C2PA indicator text detected, "NO_C2PA" otherwise
        - matched_text: Exact phrase that was matched, or None if no match
    """
    normalized = _normalize_text_for_matching(text)
    if not normalized:
        return ("NO_C2PA", None)

    # C2PA indicator keywords (strict exact phrases for visible badges or labels)
    c2pa_keywords = [
        "content credentials",
        "content credential",
        "c2pa",
        "cr:",  # C2PA badge shorthand used by some platforms
        "provenance",
    ]

    # Match exact phrases only (not partial substrings)
    for keyword in c2pa_keywords:
        # Use word boundary matching for most phrases
        # Special handling for "cr:" which may appear standalone
        if keyword == "cr:":
            if "cr:" in normalized:
                return ("HAS_C2PA", keyword)
        elif f" {keyword} " in f" {normalized} " or normalized.startswith(keyword + " ") or normalized.endswith(" " + keyword) or normalized == keyword:
            return ("HAS_C2PA", keyword)

    return ("NO_C2PA", None)


def _detect_wellbeing_themes(text: str) -> list:
    """
    Detect wellbeing themes from text using keyword matching.

    Returns list of detected themes: ["body_image", "diet_weight_loss", "conflict"]
    """
    themes = []
    normalized = _normalize_text_for_matching(text)

    if not normalized:
        return themes

    # Check body image keywords
    for keyword in BODY_IMAGE_KEYWORDS:
        if keyword in normalized:
            if "body_image" not in themes:
                themes.append("body_image")
            break  # Found one match, no need to continue

    # Check diet/weight loss keywords
    for keyword in DIET_KEYWORDS:
        if keyword in normalized:
            if "diet_weight_loss" not in themes:
                themes.append("diet_weight_loss")
            break

    # Check conflict keywords
    for keyword in CONFLICT_KEYWORDS:
        if keyword in normalized:
            if "conflict" not in themes:
                themes.append("conflict")
            break

    return themes


def process_video(file_path: str, user_id: str = "demo-user", platform: str = "tiktok") -> UnifiedScanResult:
    if cv2 is None:
        raise RuntimeError("OpenCV (cv2) is not installed. Video processing is unavailable on this machine.")

    start_time = time.time()
    scan_id = str(uuid.uuid4())

    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    # Sample every ~400ms
    sample_rate_ms = 400
    frame_interval = int(fps * (sample_rate_ms / 1000)) if fps > 0 else 10
    if frame_interval < 1:
        frame_interval = 1

    frames_analyzed = 0
    feed_items = []

    # Initialize OCR debugger for tracking OCR quality
    ocr_debugger = OCRDebugger(scan_id)

    # Track OCR metrics for aggregates
    ocr_total_chars = 0
    ocr_non_empty_frames = 0
    ocr_ad_detections = 0  # Ads detected via OCR disclosure tokens

    # Accumulators for aggregates
    # Initialize topic counts dynamically from hashtag dictionary
    # Plus legacy categories for backward compatibility
    topic_counts = {topic: 0 for topic in TOPIC_HASHTAGS.keys()}
    topic_counts["shopping/beauty"] = 0  # Legacy alias for beauty
    topic_counts["funny/memes"] = 0  # Legacy category

    positive_score = 0
    neutral_score = 0
    negative_score = 0

    political_items_count = 0
    ad_items_count = 0

    hook_counts = {}

    current_frame = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if current_frame % frame_interval == 0:
            frames_analyzed += 1

            # OCR with preprocessing for better accuracy on mobile video frames
            # Uses grayscale, CLAHE contrast enhancement, adaptive thresholding, and 2x upscale
            try:
                text, preprocessed_frame = extract_text_with_preprocessing(frame)
            except Exception as e:
                logger.error(f"Error in OCR text extraction for frame {frame_idx}: {e}", exc_info=True)
                text = ""
                preprocessed_frame = None

            # Track OCR metrics
            if text:
                ocr_total_chars += len(text)
                ocr_non_empty_frames += 1

            # Record frame for debug output (if ALGO_OCR_DEBUG=1)
            if preprocessed_frame is not None:
                ocr_debugger.record_frame(preprocessed_frame, text, current_frame)

            # Calculate OCR confidence estimate based on text quality
            # Simple heuristic: ratio of alphanumeric chars to total chars
            ocr_confidence = 0.0
            if text:
                alpha_ratio = sum(c.isalnum() or c.isspace() for c in text) / len(text)
                ocr_confidence = min(alpha_ratio, 1.0)

            # Create FeedItem for this frame/segment
            item = FeedItem(
                position_in_feed=frames_analyzed,
                approx_timestamp_offset_sec=(current_frame / fps) if fps > 0 else 0,
                content_type="VIDEO",
                source_details=SourceDetails(
                    capture_source_type="MOBILE_VIDEO_FRAME",
                    ocr_metadata=OcrMetadata(
                        frames_sampled=1,
                        average_ocr_confidence=round(ocr_confidence, 2) if ocr_confidence > 0 else None
                    )
                )
            )

            # Store OCR text (truncated for storage efficiency)
            item.content_text.on_screen_labels.append(text[:200] if text else "")

            # Ad detection: First check for OCR-based disclosure tokens
            # This is the PRIMARY method for mobile video since platform labels aren't available
            is_ad = False
            ad_detected_reason = None
            ad_disclosure_match = None

            # Check for ad disclosure tokens in OCR text (e.g., "Ad", "Sponsored", "Promoted")
            ocr_ad_detected, matched_token = detect_ad_from_ocr(text)
            if ocr_ad_detected:
                is_ad = True
                ad_detected_reason = "ocr_disclosure_token"
                ad_disclosure_match = matched_token
                ocr_ad_detections += 1

            # Fallback: expanded keyword heuristics for influencer promos
            if not is_ad:
                keyword_ad, matched_keyword = _detect_ad_from_keywords(text)
                if keyword_ad:
                    is_ad = True
                    ad_detected_reason = "keyword_match"
                    ad_disclosure_match = matched_keyword

            if is_ad:
                item.is_ad = True
                item.ad_metadata = AdMetadata(
                    ad_detected_reason=ad_detected_reason,
                    sponsored_label_text=ad_disclosure_match
                )
                ad_items_count += 1

            # AI Disclosure Detection (platform AI labels from OCR text)
            # For mobile video scans, all items are VIDEO frames, so check all
            # Note: OCR confidence threshold would ideally be checked here, but
            # per-frame confidence is not currently tracked in this pipeline.
            # We rely on the preprocessing pipeline (CLAHE, adaptive threshold)
            # to improve OCR quality. Future enhancement: add per-frame confidence tracking.
            # Platform-gated detection: only matches phrases appropriate for this platform
            ai_disclosure_label, ai_disclosure_matched_text = _detect_ai_disclosure(text, platform=platform)
            item.ai_disclosure = ai_disclosure_label
            if ai_disclosure_matched_text:
                item.ai_disclosure_source = "ocr_text"
                item.ai_disclosure_text = ai_disclosure_matched_text

            # C2PA / Content Credentials Detection (from OCR text)
            c2pa_disclosure_label, c2pa_disclosure_matched_text = _detect_c2pa_disclosure(text)
            item.c2pa_disclosure = c2pa_disclosure_label
            # Store matched text in ai_disclosure_text if C2PA detected and no AI label was found
            if c2pa_disclosure_matched_text and not ai_disclosure_matched_text:
                item.ai_disclosure_source = "ocr_text"
                item.ai_disclosure_text = c2pa_disclosure_matched_text

            # Topics - use comprehensive hashtag dictionary
            detected_topic, topic_keywords = _detect_topic_from_hashtags(text)
            if detected_topic:
                # Normalize topic name for counting (handle legacy names)
                topic_key = detected_topic
                if topic_key == "beauty":
                    topic_key = "shopping/beauty"  # Match legacy category name
                if topic_key not in topic_counts:
                    topic_counts[topic_key] = 0
                topic_counts[topic_key] += 1
                item.topics.primary_category = detected_topic
                if detected_topic not in item.topics.secondary_categories:
                    item.topics.secondary_categories.append(detected_topic)

            # Products (very simple extraction)
            if "drink" in text:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand A Energy Drink"
            if "leggings" in text:
                if item.ad_metadata is None: item.ad_metadata = AdMetadata()
                item.ad_metadata.product_or_service = "Brand B Leggings"
                
            # Engagement Drivers
            if "challenge" in text:
                hook = "fitness challenges"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1
            if "routine" in text:
                hook = "beauty routines"
                item.engagement_drivers.hooks_detected.append(hook)
                hook_counts[hook] = hook_counts.get(hook, 0) + 1
            
            # Tone — KNOWN LIMITATION: This is a naive keyword fallback only.
            # Gemini AI analysis overwrites these values when available (see gemini_analyzer.py).
            # When Gemini is unavailable, tone classification relies solely on whether
            # "good"/"love" or "bad"/"hate" appear in OCR text, which is unreliable.
            # Accuracy Audit Feb 2026: flagged as Important issue #14.
            if "good" in text or "love" in text:
                positive_score += 1
                item.wellbeing.valence = "POSITIVE"
            elif "bad" in text or "hate" in text:
                negative_score += 1
                item.wellbeing.valence = "NEGATIVE"
            else:
                neutral_score += 1
                item.wellbeing.valence = "NEUTRAL"

            # Wellbeing Themes - use expanded keyword detection
            detected_themes = _detect_wellbeing_themes(text)
            for theme in detected_themes:
                if theme not in item.wellbeing.themes:
                    item.wellbeing.themes.append(theme)

            # Political
            if detected_topic == "politics":
                item.political.is_political = True
                political_items_count += 1
                # Note: stance_or_alignment_guess left as None - we don't have enough signal to infer this

            feed_items.append(item)

        current_frame += 1
        
    cap.release()

    # Finalize OCR debugger (saves frames and logs summary if ALGO_OCR_DEBUG=1)
    ocr_summary = ocr_debugger.finalize()

    # Delete file
    try:
        os.remove(file_path)
        deleted_raw_video = True
    except OSError:
        deleted_raw_video = False

    # Aggregate results
    total_samples = frames_analyzed if frames_analyzed > 0 else 1

    ad_percentage = ad_items_count / total_samples

    logger.info(f"OCR Summary: {ocr_non_empty_frames}/{frames_analyzed} frames with text, "
                f"{ocr_ad_detections} ads detected via OCR, "
                f"avg chars: {ocr_total_chars / max(ocr_non_empty_frames, 1):.0f}")
    
    # Normalize topics
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    topic_distribution = [
        TopicDistributionEntry(category=t, count=c, percentage=c/total_samples) 
        for t, c in sorted_topics if c > 0
    ]
    
    # Engagement Hooks
    top_hooks = [
        HookCount(hook=k, count=v) for k, v in hook_counts.items()
    ]

    processing_time = time.time() - start_time

    # Construct Unified Result
    return UnifiedScanResult(
        scan_metadata=ScanMetadata(
            scan_id=scan_id,
            created_at=datetime.now(),
            source_type="MOBILE_VIDEO",
            platform=platform.upper(),
            user_identifier=user_id
        ),
        environment=Environment(
            device_type="MOBILE",
            screen_resolution=ScreenResolution(width=width, height=height),
            video_capture=VideoCaptureInfo(
                is_video_based=True,
                duration_seconds=duration,
                frame_rate_fps=fps,
                approx_feed_items_visible=frames_analyzed # Treating samples as items for MVP
            )
        ),
        feed_items=feed_items,
        aggregates=Aggregates(
            total_feed_items=frames_analyzed,
            total_ads=ad_items_count,
            ad_percentage=ad_percentage,
            topic_distribution=topic_distribution,
            wellbeing_summary=WellbeingSummary(
                high_relevance_items=0, # Placeholder
                valence_distribution=ValenceDistribution(
                    POSITIVE=positive_score,
                    NEUTRAL=neutral_score,
                    NEGATIVE=negative_score
                )
            ),
            political_content_summary=PoliticalContentSummary(
                political_items=political_items_count,
                political_percentage=political_items_count/total_samples
            ),
            repetition_summary=RepetitionSummary(
                items_in_repetition_clusters=0,  # Real repetition detection not implemented yet
                largest_cluster_size=0
            ),
            engagement_pattern_summary=EngagementPatternSummary(
                top_hooks=top_hooks
            )
        ),
        debug=DebugInfo(
            processing_time_seconds=processing_time,
            frames_extracted=frames_analyzed,
            frames_sampled_for_ocr=frames_analyzed,
            raw_backend_payload={
                "ocr_summary": {
                    "frames_with_text": ocr_non_empty_frames,
                    "ocr_ad_detections": ocr_ad_detections,
                    "avg_text_length": ocr_summary.get("avg_text_length", 0),
                    "max_text_length": ocr_summary.get("max_text_length", 0),
                    "non_empty_rate_percent": ocr_summary.get("non_empty_rate", 0),
                    "debug_enabled": get_ocr_debug_enabled(),
                }
            }
        )
    )
