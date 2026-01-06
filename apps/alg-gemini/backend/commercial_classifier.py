"""
Commercial Intent Classification Pipeline (Gold Standard v3.0)

This module classifies each feed item's commercial intent with defensible,
evidence-based categorization. No speculation about user identity, platform
intent, or advertiser goals.

Classification Output:
    commercial_class: "non_commercial" | "labeled_ad" | "unlabeled_promotion" | "ambiguous"
    commercial_confidence: "high" | "medium" | "low"
    commercial_detection_methods: List of detection methods that fired

Key Definitions:

LABELED_AD (High-confidence only):
    - Platform ad label detected via OCR: "ad", "sponsored", "promoted", "advertisement"
    - Platform DOM metadata (desktop only)
    - Example: Nike official account promoting shoes with "Sponsored" label

UNLABELED_PROMOTION (High-confidence only):
    - Creator or third-party commercial persuasion WITHOUT formal ad label
    - Must include direct evidence:
        * Discount/referral codes: "use code", "my code", "promo code"
        * Explicit CTAs: "link in bio", "shop now", "get yours", "free trial"
        * Partnership language: "partnered with", "working with", "thanks to [brand]"
        * Purchase intent: price mentions, "best deal", "on sale"
    - Example: Influencer praising Nike shoes saying "use my code for 20% off"

NON_COMMERCIAL:
    - Everything else with no promotional signals

AMBIGUOUS:
    - Weak or single signals that don't meet high-confidence threshold

Accuracy Philosophy:
    - Only HIGH confidence items are counted in primary metrics
    - MEDIUM confidence items are documented but not aggregated into top-line numbers
    - LOW/AMBIGUOUS items are explicitly excluded and documented in limits
    - Every classification traces back to specific evidence
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import re
from collections import Counter


class CommercialClass(str, Enum):
    NON_COMMERCIAL = "non_commercial"
    LABELED_AD = "labeled_ad"
    UNLABELED_PROMOTION = "unlabeled_promotion"
    AMBIGUOUS = "ambiguous"


class CommercialConfidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DetectionMethod(str, Enum):
    PLATFORM_LABEL = "platform_label"
    OCR_DISCLOSURE = "ocr_disclosure"
    DISCOUNT_CODE = "discount_code"
    PARTNERSHIP_LANGUAGE = "partnership_language"
    CTA_PATTERN = "cta_pattern"
    ENTITY_REFERENCE = "entity_reference"
    KEYWORD_HEURISTIC = "keyword_heuristic"
    NONE = "none"


@dataclass
class CommercialClassification:
    """Classification result for a single feed item."""
    commercial_class: CommercialClass
    confidence: CommercialConfidence
    detection_methods: List[DetectionMethod] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)
    matched_patterns: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "commercial_class": self.commercial_class.value,
            "commercial_confidence": self.confidence.value,
            "commercial_detection_methods": [m.value for m in self.detection_methods],
            "evidence": self.evidence,
            "matched_patterns": self.matched_patterns,
        }


# =============================================================================
# Detection Patterns (Gold Standard v3.0)
# =============================================================================

# High-confidence ad disclosure tokens (case-insensitive)
# These are regulatory disclosure terms that strongly indicate LABELED ads
HIGH_CONFIDENCE_AD_TOKENS = [
    r"\bad\b",                    # "Ad" standalone
    r"sponsored",                 # "Sponsored"
    r"promoted",                  # "Promoted"
    r"advertisement",             # "Advertisement"
    r"paid\s*partnership",        # "Paid Partnership"
    r"paid\s*promotion",          # "Paid Promotion"
    r"#ad\b",                     # "#ad" hashtag
    r"#sponsored\b",              # "#sponsored" hashtag
    r"#paidpartnership\b",        # "#paidpartnership"
]

# =============================================================================
# UNLABELED PROMOTION PATTERNS (High Confidence)
# These indicate commercial intent WITHOUT platform disclosure labels
# =============================================================================

# Discount/referral code patterns - HIGH confidence for unlabeled promotion
HIGH_CONFIDENCE_DISCOUNT_CODES = [
    r"use\s+(my\s+)?code\b",           # "use code", "use my code"
    r"my\s+code\b",                    # "my code"
    r"promo\s+code\b",                 # "promo code"
    r"discount\s+code\b",              # "discount code"
    r"coupon\s+code\b",                # "coupon code"
    r"code\s*[:\-]?\s*[A-Z0-9]{3,15}\b",  # "code: SAVE20" or "code SUMMER"
    r"\d+%?\s*off\s+with\s+(code|my)",  # "20% off with code" / "20% off with my"
    r"(save|get)\s+\d+%?\s+(with|using)\s+(code|my)",  # "save 20% with code"
]

# Partnership/sponsorship language - HIGH confidence
HIGH_CONFIDENCE_PARTNERSHIP = [
    r"partnered\s+with\b",             # "partnered with"
    r"in\s+partnership\s+with\b",      # "in partnership with"
    r"working\s+with\b",               # "working with [brand]"
    r"thanks\s+to\b",                  # "thanks to [brand]"
    r"sponsored\s+content\b",          # "sponsored content" (without platform label)
    r"brand\s+partner\b",              # "brand partner"
    r"affiliate\s+link\b",             # "affiliate link"
    r"#partner\b",                     # "#partner"
    r"#gifted\b",                      # "#gifted"
    r"#collab\b",                      # "#collab"
]

# Explicit CTA patterns - HIGH confidence when combined with commerce signals
HIGH_CONFIDENCE_CTA = [
    r"link\s+in\s+(my\s+)?bio\b",      # "link in bio", "link in my bio"
    r"shop\s+now\b",                   # "shop now"
    r"get\s+yours\b",                  # "get yours"
    r"free\s+trial\b",                 # "free trial"
    r"sign\s+up\b",                    # "sign up"
    r"tap\s+(the\s+)?(link|to\s+shop)\b",  # "tap the link", "tap to shop"
    r"swipe\s+up\b",                   # "swipe up"
    r"click\s+(the\s+)?link\b",        # "click the link"
    r"check\s+(it\s+)?out\s+at\b",     # "check it out at"
    r"order\s+(now|yours|today)\b",    # "order now", "order yours"
]

# Purchase intent signals - MEDIUM confidence alone, HIGH with other signals
PURCHASE_INTENT_SIGNALS = [
    r"\$\d+",                          # Price mentions "$19.99"
    r"\d+%\s*off\b",                   # "20% off"
    r"on\s+sale\b",                    # "on sale"
    r"best\s+deal\b",                  # "best deal"
    r"limited\s+time\b",               # "limited time"
    r"while\s+supplies\s+last\b",      # "while supplies last"
    r"exclusive\s+offer\b",            # "exclusive offer"
    r"flash\s+sale\b",                 # "flash sale"
]

# Low-confidence promotional keywords
# These are common in promotions but also in organic content
LOW_PROMO_KEYWORDS = [
    r"buy\b",
    r"purchase\b",
    r"sale\b",
    r"deal\b",
    r"save\b",
    r"free\b",
    r"giveaway\b",
    r"checkout\b",
]

# Known brand/company patterns (for entity extraction, not classification)
BRAND_REFERENCE_PATTERNS = [
    r"@\w+\.com\b",               # @brand.com mentions
    r"\.com\b",                   # Domain references
    r"\.co\b",
    r"\.io\b",
]


# Compile all patterns
AD_PATTERNS_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_AD_TOKENS]
DISCOUNT_PATTERNS_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_DISCOUNT_CODES]
PARTNERSHIP_PATTERNS_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_PARTNERSHIP]
CTA_PATTERNS_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_CTA]
PURCHASE_PATTERNS_MEDIUM = [re.compile(p, re.IGNORECASE) for p in PURCHASE_INTENT_SIGNALS]
PROMO_PATTERNS_LOW = [re.compile(p, re.IGNORECASE) for p in LOW_PROMO_KEYWORDS]
BRAND_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BRAND_REFERENCE_PATTERNS]


# =============================================================================
# Core Classification Logic (Gold Standard v3.0)
# =============================================================================

def classify_feed_item(feed_item: Dict[str, Any]) -> CommercialClassification:
    """
    Classify a single feed item's commercial intent with high accuracy.

    Classification hierarchy:
    1. Platform-labeled ads (is_ad=True) -> LABELED_AD, HIGH
    2. OCR disclosure tokens (ad, sponsored, etc.) -> LABELED_AD, HIGH
    3. Discount codes -> UNLABELED_PROMOTION, HIGH
    4. Partnership language -> UNLABELED_PROMOTION, HIGH
    5. CTA + purchase signals (combined) -> UNLABELED_PROMOTION, HIGH/MEDIUM
    6. Single CTA or weak signals -> AMBIGUOUS
    7. No signals -> NON_COMMERCIAL, HIGH

    Returns:
        CommercialClassification with class, confidence, methods, and evidence
    """
    evidence = []
    matched_patterns = []
    detection_methods = []

    # Extract relevant data from feed item
    is_ad = feed_item.get("is_ad", False)
    ad_metadata = feed_item.get("ad_metadata") or {}
    content_text = feed_item.get("content_text") or {}
    engagement_drivers = feed_item.get("engagement_drivers") or {}

    # Combine all text content for pattern matching
    all_text = _extract_all_text(content_text)

    # =========================================================================
    # 1. LABELED AD: Platform metadata or disclosure tokens
    # =========================================================================
    # Phase 5C1: Platform-labeled ads (PLATFORM_LABEL method) can yield HIGH
    # confidence alone per accuracy-architecture-v3.1.md Section 4.1.
    # This is because PLATFORM_LABEL has reliability 0.999 (authoritative).
    if is_ad:
        reason = ad_metadata.get("ad_detected_reason", "platform_label")
        evidence.append(f"is_ad=True (reason: {reason})")

        if ad_metadata.get("sponsored_label_text"):
            evidence.append(f"sponsored_label: '{ad_metadata['sponsored_label_text']}'")

        if ad_metadata.get("advertiser_name"):
            evidence.append(f"advertiser: '{ad_metadata['advertiser_name']}'")

        detection_methods.append(
            DetectionMethod.OCR_DISCLOSURE
            if reason == "ocr_disclosure_token"
            else DetectionMethod.PLATFORM_LABEL
        )

        return CommercialClassification(
            commercial_class=CommercialClass.LABELED_AD,
            confidence=CommercialConfidence.HIGH,  # Single PLATFORM_LABEL method yields HIGH
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Check for OCR disclosure tokens (ad, sponsored, etc.) not caught by is_ad
    ad_disclosure_matches = _find_pattern_matches(all_text, AD_PATTERNS_HIGH)
    if ad_disclosure_matches:
        matched_patterns.extend(ad_disclosure_matches)
        evidence.append(f"Disclosure tokens found: {ad_disclosure_matches}")
        detection_methods.append(DetectionMethod.OCR_DISCLOSURE)

        # This should be LABELED_AD since it has explicit disclosure
        return CommercialClassification(
            commercial_class=CommercialClass.LABELED_AD,
            confidence=CommercialConfidence.HIGH,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # =========================================================================
    # 2. UNLABELED PROMOTION: Strong signals without disclosure
    # =========================================================================

    # Check for discount codes - HIGH confidence for unlabeled promotion
    discount_matches = _find_pattern_matches(all_text, DISCOUNT_PATTERNS_HIGH)
    if discount_matches:
        matched_patterns.extend(discount_matches)
        evidence.append(f"Discount/referral codes: {discount_matches}")
        detection_methods.append(DetectionMethod.DISCOUNT_CODE)

    # Check for partnership language - HIGH confidence for unlabeled promotion
    partnership_matches = _find_pattern_matches(all_text, PARTNERSHIP_PATTERNS_HIGH)
    if partnership_matches:
        matched_patterns.extend(partnership_matches)
        evidence.append(f"Partnership language: {partnership_matches}")
        detection_methods.append(DetectionMethod.PARTNERSHIP_LANGUAGE)

    # Check for CTA patterns
    cta_matches = _find_pattern_matches(all_text, CTA_PATTERNS_HIGH)
    if cta_matches:
        matched_patterns.extend(cta_matches)
        evidence.append(f"CTA patterns: {cta_matches}")
        detection_methods.append(DetectionMethod.CTA_PATTERN)

    # Check for purchase intent signals
    purchase_matches = _find_pattern_matches(all_text, PURCHASE_PATTERNS_MEDIUM)
    if purchase_matches:
        matched_patterns.extend(purchase_matches)
        evidence.append(f"Purchase signals: {purchase_matches}")

    # Also include engagement_drivers if present
    cta_from_drivers = engagement_drivers.get("call_to_action_patterns", [])
    urgency_from_drivers = engagement_drivers.get("urgency_or_scarcity_signals", [])
    if cta_from_drivers:
        evidence.append(f"CTA from analysis: {cta_from_drivers}")
    if urgency_from_drivers:
        evidence.append(f"Urgency signals: {urgency_from_drivers}")

    # =========================================================================
    # DECISION: Determine classification based on signal strength
    # =========================================================================

    # Count strong signals
    has_discount_code = len(discount_matches) > 0
    has_partnership = len(partnership_matches) > 0
    has_cta = len(cta_matches) > 0 or len(cta_from_drivers) > 0
    has_purchase_signal = len(purchase_matches) > 0 or len(urgency_from_drivers) > 0

    # Discount codes ALONE are HIGH confidence unlabeled promotion
    if has_discount_code:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.HIGH,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Partnership language ALONE is HIGH confidence unlabeled promotion
    if has_partnership:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.HIGH,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # CTA + purchase signal = HIGH confidence
    if has_cta and has_purchase_signal:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.HIGH,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Multiple CTAs = MEDIUM confidence
    cta_count = len(cta_matches) + len(cta_from_drivers)
    if cta_count >= 2:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.MEDIUM,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Single CTA = AMBIGUOUS (not enough evidence)
    if has_cta:
        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # =========================================================================
    # 3. Check for weak signals (low confidence)
    # =========================================================================

    # Brand/entity references alone
    brand_matches = _find_pattern_matches(all_text, BRAND_PATTERNS)
    if brand_matches:
        matched_patterns.extend(brand_matches)
        evidence.append(f"Brand/entity references: {brand_matches}")
        detection_methods.append(DetectionMethod.ENTITY_REFERENCE)

        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # Low-confidence promotional keywords
    low_matches = _find_pattern_matches(all_text, PROMO_PATTERNS_LOW)
    if len(low_matches) >= 2:
        matched_patterns.extend(low_matches)
        evidence.append(f"Promotional keywords: {low_matches}")
        detection_methods.append(DetectionMethod.KEYWORD_HEURISTIC)

        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_methods=detection_methods,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # =========================================================================
    # 4. No promotional signals -> NON_COMMERCIAL
    # =========================================================================
    evidence.append("No commercial signals detected")
    detection_methods.append(DetectionMethod.NONE)

    return CommercialClassification(
        commercial_class=CommercialClass.NON_COMMERCIAL,
        confidence=CommercialConfidence.HIGH,
        detection_methods=detection_methods,
        evidence=evidence,
        matched_patterns=matched_patterns,
    )


def _extract_all_text(content_text: Dict[str, Any]) -> str:
    """Extract and combine all text content from a feed item's content_text."""
    parts = []

    # Captions
    captions = content_text.get("captions", [])
    if captions:
        parts.extend(captions)

    # Hashtags
    hashtags = content_text.get("hashtags", [])
    if hashtags:
        parts.extend(hashtags)

    # On-screen labels (OCR text)
    labels = content_text.get("on_screen_labels", [])
    if labels:
        parts.extend(labels)

    return " ".join(str(p) for p in parts if p).lower()


def _find_pattern_matches(text: str, patterns: List[re.Pattern]) -> List[str]:
    """Find all matching patterns in text."""
    matches = []
    for pattern in patterns:
        found = pattern.findall(text)
        if found:
            matches.extend(found)
    return list(set(matches))  # Deduplicate


# =============================================================================
# Topic Classification for Promotional Content
# =============================================================================

# Topic categories with associated keywords
PROMO_TOPIC_KEYWORDS = {
    "fitness": [
        r"workout", r"fitness", r"gym", r"exercise", r"protein", r"muscle",
        r"training", r"athletic", r"sports", r"run", r"yoga", r"wellness"
    ],
    "beauty": [
        r"makeup", r"skincare", r"beauty", r"cosmetic", r"skin", r"hair",
        r"lipstick", r"mascara", r"foundation", r"serum", r"moisturizer"
    ],
    "fashion": [
        r"fashion", r"clothing", r"outfit", r"dress", r"style", r"wear",
        r"apparel", r"shoes", r"accessories", r"jewelry"
    ],
    "tech": [
        r"tech", r"software", r"app", r"device", r"phone", r"computer",
        r"gadget", r"ai", r"tool", r"platform", r"digital"
    ],
    "finance": [
        r"finance", r"invest", r"money", r"credit", r"bank", r"loan",
        r"trading", r"crypto", r"stock", r"savings", r"budget"
    ],
    "food_beverage": [
        r"food", r"drink", r"recipe", r"cooking", r"restaurant", r"coffee",
        r"snack", r"meal", r"beverage", r"nutrition", r"diet"
    ],
    "gaming": [
        r"game", r"gaming", r"play", r"esports", r"stream", r"console",
        r"mobile game", r"pc game", r"gamer"
    ],
    "lifestyle": [
        r"lifestyle", r"home", r"decor", r"living", r"travel", r"vacation",
        r"experience", r"luxury", r"premium"
    ],
    "health": [
        r"health", r"vitamin", r"supplement", r"medical", r"therapy",
        r"treatment", r"doctor", r"wellness", r"mental health"
    ],
    "education": [
        r"course", r"learn", r"education", r"training", r"class", r"tutorial",
        r"skill", r"certification", r"online course"
    ],
}

# Compile topic patterns
TOPIC_PATTERNS = {
    topic: [re.compile(r"\b" + kw + r"\b", re.IGNORECASE) for kw in keywords]
    for topic, keywords in PROMO_TOPIC_KEYWORDS.items()
}


@dataclass
class TopicClassification:
    """Topic classification result for promotional content."""
    topic: str
    confidence: CommercialConfidence
    match_count: int
    matched_keywords: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "confidence": self.confidence.value,
            "match_count": self.match_count,
            "matched_keywords": self.matched_keywords,
        }


def classify_promo_topic(feed_item: Dict[str, Any]) -> Optional[TopicClassification]:
    """
    Classify the topic/category of promotional content.

    Only classifies items that have been identified as promotional
    (labeled_ad or unlabeled_promotion).

    Returns:
        TopicClassification if a topic can be determined with sufficient confidence,
        None if topic cannot be determined.
    """
    content_text = feed_item.get("content_text") or {}
    ad_metadata = feed_item.get("ad_metadata") or {}

    # Use product_or_service from ad_metadata if available
    product = ad_metadata.get("product_or_service")
    if product:
        # Check if product matches any topic
        product_lower = product.lower()
        for topic, patterns in TOPIC_PATTERNS.items():
            for pattern in patterns:
                if pattern.search(product_lower):
                    return TopicClassification(
                        topic=topic,
                        confidence=CommercialConfidence.HIGH,
                        match_count=1,
                        matched_keywords=[pattern.pattern],
                    )

    # Extract all text for pattern matching
    all_text = _extract_all_text(content_text)

    # Count matches per topic
    topic_matches: Dict[str, List[str]] = {}
    for topic, patterns in TOPIC_PATTERNS.items():
        matches = _find_pattern_matches(all_text, patterns)
        if matches:
            topic_matches[topic] = matches

    if not topic_matches:
        return None

    # Find topic with most matches
    best_topic = max(topic_matches.keys(), key=lambda t: len(topic_matches[t]))
    match_count = len(topic_matches[best_topic])

    # Determine confidence based on match count
    if match_count >= 3:
        confidence = CommercialConfidence.HIGH
    elif match_count >= 2:
        confidence = CommercialConfidence.MEDIUM
    else:
        confidence = CommercialConfidence.LOW

    return TopicClassification(
        topic=best_topic,
        confidence=confidence,
        match_count=match_count,
        matched_keywords=topic_matches[best_topic],
    )


# =============================================================================
# Brand/Entity Extraction
# =============================================================================

# =============================================================================
# HARD EXCLUSIONS (Critical for accuracy)
# Never treat these as companies or brands
# =============================================================================

BRAND_EXCLUSION_LIST = {
    # Platform UI text from OCR (CRITICAL - these appear in every scan)
    'HOME', 'SEARCH', 'FOLLOWING', 'FOR YOU', 'FORYOU', 'FOR_YOU',
    'POSTS', 'PROFILE', 'EXPLORE', 'DISCOVER', 'INBOX', 'ACTIVITY',
    'MENU', 'SETTINGS', 'MORE', 'CREATE', 'UPLOAD', 'CAMERA',

    # Social media UI elements
    'SHARE', 'LIKE', 'COMMENT', 'FOLLOW', 'FOLLOWERS', 'SUBSCRIBE',
    'REPOST', 'QUOTE', 'REPLY', 'SEND', 'POST', 'TWEET', 'TWEETS',
    'BOOKMARK', 'BOOKMARKS', 'MESSAGES', 'NOTIFICATIONS', 'VIEWS', 'VIEW',
    'LIKES', 'COMMENTS', 'SHARES', 'REPOSTS', 'REPLIES', 'TRENDING',
    'LIVE', 'STORIES', 'REELS', 'SHORTS', 'DUET', 'STITCH',

    # Common video/content words
    'VIDEO', 'PHOTO', 'IMAGE', 'NEWS', 'WATCH', 'READ', 'SHOW',
    'CLICK', 'TAP', 'SWIPE', 'SCROLL', 'SEE', 'LINK', 'BIO', 'ABOUT',
    'PLAY', 'PAUSE', 'MUTE', 'UNMUTE', 'VOLUME', 'FULL', 'SCREEN',

    # Time-related
    'TODAY', 'NOW', 'MINUTES', 'HOURS', 'DAYS', 'AGO', 'YESTERDAY',
    'WEEK', 'MONTH', 'YEAR', 'JUST', 'RECENTLY',

    # Generic nouns that aren't brands
    'VIDEO', 'APP', 'SITE', 'POST', 'PAGE', 'ACCOUNT', 'USER', 'CONTENT',
    'CREATOR', 'CHANNEL', 'STREAM', 'FEED', 'STORY', 'REEL',

    # Common English words
    'THE', 'AND', 'FOR', 'YOU', 'ARE', 'THIS', 'THAT', 'WITH', 'YOUR', 'HAVE',
    'WILL', 'FROM', 'THEY', 'BEEN', 'SOME', 'WHAT', 'WHEN', 'MAKE', 'LIKE',
    'TIME', 'VERY', 'JUST', 'KNOW', 'TAKE', 'COME', 'MADE', 'BACK',
    'ONLY', 'OVER', 'SUCH', 'MORE', 'ALSO', 'INTO', 'GOOD', 'NEW',
    'WAY', 'MAY', 'DAY', 'TOO', 'ANY', 'GET', 'HAS', 'HIM', 'HIS',
    'HOW', 'MAN', 'OUT', 'NOT', 'BUT', 'ALL', 'CAN', 'HAD', 'HER', 'WAS',
    'ONE', 'OUR', 'SAY', 'SHE', 'USE', 'SHOP', 'FREE', 'SALE', 'BEST',
    'TOP', 'HOT', 'OLD', 'BIG', 'FYP',

    # Promotional words (not brands)
    'SPONSORED', 'AD', 'PROMOTED', 'ADVERTISEMENT', 'PROMO', 'DEAL',
}

# Platform names to exclude (NEVER treat as companies/advertisers)
PLATFORM_DOMAIN_EXCLUSIONS = {
    # Social media platforms (CRITICAL exclusions)
    'twitter', 'x', 'tiktok', 'instagram', 'youtube', 'facebook', 'meta',
    'reddit', 'snapchat', 'pinterest', 'linkedin', 'threads', 'mastodon',
    'tumblr', 'whatsapp', 'telegram', 'discord', 'twitch', 'vine',
    'periscope', 'clubhouse', 'tiktok', 'ig', 'fb', 'yt',

    # URL shorteners and link services (not actual advertisers)
    'bit', 'bitly', 'linktr', 'linktree', 'tinyurl', 'goo', 'ow', 't',
    'lnkd', 'buff', 'rebrand', 'short', 'tiny', 'cutt', 'is', 'ly',
    'adf', 'shorte', 'shrinkme', 'adfly', 'linkbucks', 'ouo',

    # Tech giants (exclude unless clear product context)
    'google', 'apple', 'microsoft', 'amazon', 'aws', 'azure',
}


@dataclass
class BrandEntity:
    """Extracted brand or company entity."""
    name: str
    normalized_name: str
    source: str  # "ad_metadata", "ocr_text", "handle"
    confidence: CommercialConfidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "normalized_name": self.normalized_name,
            "source": self.source,
            "confidence": self.confidence.value,
        }


def normalize_brand_name(name: str) -> str:
    """
    Normalize brand name for deduplication.

    Examples:
        "NIKE" -> "nike"
        "Nike, Inc." -> "nike"
        "nike.com" -> "nike"
        "@nike" -> "nike"
    """
    if not name:
        return ""

    # Lowercase
    normalized = name.lower().strip()

    # Remove common suffixes
    suffixes = [
        ", inc.", ", inc", " inc.", " inc",
        ", llc", " llc",
        ", ltd", " ltd",
        ".com", ".co", ".io", ".net", ".org",
    ]
    for suffix in suffixes:
        if normalized.endswith(suffix):
            normalized = normalized[:-len(suffix)]

    # Remove @ prefix (social handles)
    if normalized.startswith("@"):
        normalized = normalized[1:]

    # Remove non-alphanumeric characters except spaces
    normalized = re.sub(r"[^a-z0-9\s]", "", normalized)

    # Collapse whitespace
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def _is_all_caps(text: str) -> bool:
    """Check if text is ALL-CAPS (excluding numbers and symbols)."""
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return False
    return all(c.isupper() for c in letters)


def _has_commerce_language(text: str) -> bool:
    """Check if text contains explicit commerce language (required for @handles)."""
    commerce_patterns = [
        r"use\s+(my\s+)?code",
        r"link\s+in\s+bio",
        r"shop\s+now",
        r"partnered\s+with",
        r"thanks\s+to",
        r"\$\d+",
        r"\d+%\s*off",
        r"promo",
        r"discount",
        r"affiliate",
    ]
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in commerce_patterns)


def extract_companies(
    feed_item: Dict[str, Any],
    source_type: Optional[str] = None
) -> List[BrandEntity]:
    """
    Extract company/brand entities from a feed item.

    Gold Standard v3.0 Rules:
    - EXCLUDE ALL-CAPS tokens (OCR noise)
    - EXCLUDE platform names and UI words
    - EXCLUDE URL shorteners
    - @handles require paired commerce language

    Sources (in order of confidence):
    1. ad_metadata.advertiser_name (HIGH confidence)
    2. ad_metadata.advertiser_domain (HIGH confidence)
    3. OCR domain patterns with commerce context (MEDIUM for MOBILE_VIDEO)
    4. @handles ONLY when paired with commerce language (MEDIUM confidence)

    Returns:
        List of BrandEntity objects, deduplicated by normalized_name
    """
    companies = []
    seen_normalized = set()

    ad_metadata = feed_item.get("ad_metadata") or {}
    content_text = feed_item.get("content_text") or {}

    # Get all text for commerce language check
    all_text = _extract_all_text(content_text)
    has_commerce = _has_commerce_language(all_text)

    # 1. Advertiser name from ad metadata (HIGH confidence - always trust)
    advertiser_name = ad_metadata.get("advertiser_name")
    if advertiser_name:
        # Don't filter advertiser metadata - it's from the platform
        normalized = normalize_brand_name(advertiser_name)
        if normalized and normalized not in seen_normalized:
            companies.append(BrandEntity(
                name=advertiser_name,
                normalized_name=normalized,
                source="ad_metadata",
                confidence=CommercialConfidence.HIGH,
            ))
            seen_normalized.add(normalized)

    # 2. Advertiser domain (HIGH confidence)
    advertiser_domain = ad_metadata.get("advertiser_domain")
    if advertiser_domain:
        normalized = normalize_brand_name(advertiser_domain)
        if normalized and normalized not in seen_normalized:
            companies.append(BrandEntity(
                name=advertiser_domain,
                normalized_name=normalized,
                source="ad_metadata",
                confidence=CommercialConfidence.HIGH,
            ))
            seen_normalized.add(normalized)

    # 3. Extract from OCR text patterns (stricter for accuracy)
    is_mobile_video = source_type == "MOBILE_VIDEO"
    ocr_confidence = CommercialConfidence.MEDIUM if is_mobile_video else CommercialConfidence.LOW

    # 3a. Find domain patterns (brand.com, brand.co, brand.io)
    domain_pattern = re.compile(r'\b([a-zA-Z][a-zA-Z0-9-]{2,20})\.(com|co|io|net|org|app|shop)\b', re.IGNORECASE)
    domain_matches = domain_pattern.findall(all_text)

    for match in domain_matches:
        brand_name = match[0]
        brand_lower = brand_name.lower()

        # HARD EXCLUSION: ALL-CAPS tokens
        if _is_all_caps(brand_name) and len(brand_name) > 2:
            continue

        # Filter out common UI words
        if brand_name.upper() in BRAND_EXCLUSION_LIST:
            continue

        # Filter out platform domains
        if brand_lower in PLATFORM_DOMAIN_EXCLUSIONS:
            continue

        normalized = normalize_brand_name(brand_name)
        if normalized and len(normalized) >= 3 and normalized not in seen_normalized:
            companies.append(BrandEntity(
                name=f"{brand_name}.{match[1]}",
                normalized_name=normalized,
                source="ocr_text",
                confidence=ocr_confidence,
            ))
            seen_normalized.add(normalized)

    # 3b. @handles ONLY when paired with explicit commerce language
    # Per spec: "Handles alone (@username) unless paired with explicit commerce language"
    if has_commerce:
        at_mentions = re.findall(r"@([a-zA-Z][a-zA-Z0-9_]{2,20})", all_text)
        for mention in at_mentions:
            # HARD EXCLUSION: ALL-CAPS handles
            if _is_all_caps(mention):
                continue

            # Filter out common UI words
            if mention.upper() in BRAND_EXCLUSION_LIST:
                continue

            # Filter out platform names
            if mention.lower() in PLATFORM_DOMAIN_EXCLUSIONS:
                continue

            normalized = normalize_brand_name(mention)
            if normalized and len(normalized) >= 3 and normalized not in seen_normalized:
                companies.append(BrandEntity(
                    name=f"@{mention}",
                    normalized_name=normalized,
                    source="ocr_text",
                    confidence=ocr_confidence,
                ))
                seen_normalized.add(normalized)

    return companies


# Keep old function name as alias for backward compatibility
def extract_brands(
    feed_item: Dict[str, Any],
    source_type: Optional[str] = None
) -> List[BrandEntity]:
    """Alias for extract_companies (backward compatibility)."""
    return extract_companies(feed_item, source_type)


# =============================================================================
# Batch Classification & Aggregation
# =============================================================================

@dataclass
class CommercialExposureSpectrum:
    """
    Aggregated commercial exposure data for the 100% stacked bar.

    Only HIGH confidence items are included in the stacked bar.
    Ambiguous items are tracked separately in excluded_items.
    """
    non_commercial: int = 0
    labeled_ads: int = 0
    unlabeled_promotion_high: int = 0

    # Not in stacked bar, but tracked
    unlabeled_promotion_medium: int = 0
    ambiguous: int = 0

    # For transparency
    total_items: int = 0
    high_confidence_items: int = 0

    def to_dict(self) -> Dict[str, Any]:
        # Stacked bar data (only high confidence)
        stacked_bar_total = (
            self.non_commercial +
            self.labeled_ads +
            self.unlabeled_promotion_high
        )

        return {
            "stacked_bar": {
                "non_commercial": self.non_commercial,
                "labeled_ads": self.labeled_ads,
                "unlabeled_promotion": self.unlabeled_promotion_high,
                "total": stacked_bar_total,
            },
            "excluded_from_bar": {
                "unlabeled_promotion_medium_confidence": self.unlabeled_promotion_medium,
                "ambiguous": self.ambiguous,
            },
            "summary": {
                "total_items": self.total_items,
                "high_confidence_items": self.high_confidence_items,
                "coverage_percent": round(
                    (self.high_confidence_items / self.total_items * 100)
                    if self.total_items > 0 else 0, 1
                ),
            },
        }


@dataclass
class TopicAggregation:
    """Aggregated topic data for promotional content."""
    topics: Dict[str, int] = field(default_factory=dict)
    topic_confidences: Dict[str, Dict[str, int]] = field(default_factory=dict)

    # Thresholds
    MIN_COUNT_TO_SURFACE: int = 2

    def add_topic(self, topic: str, confidence: CommercialConfidence):
        """Add a topic classification to aggregation."""
        self.topics[topic] = self.topics.get(topic, 0) + 1

        if topic not in self.topic_confidences:
            self.topic_confidences[topic] = {"high": 0, "medium": 0, "low": 0}
        self.topic_confidences[topic][confidence.value] += 1

    def to_dict(self) -> Dict[str, Any]:
        # Only surface topics that meet threshold
        surfaced = []
        below_threshold = []

        for topic, count in sorted(self.topics.items(), key=lambda x: -x[1]):
            conf = self.topic_confidences.get(topic, {})
            high_count = conf.get("high", 0)

            entry = {
                "topic": topic,
                "count": count,
                "high_confidence_count": high_count,
                "confidence_breakdown": conf,
            }

            if count >= self.MIN_COUNT_TO_SURFACE and high_count >= 1:
                surfaced.append(entry)
            else:
                below_threshold.append(entry)

        return {
            "surfaced_topics": surfaced,
            "below_threshold": below_threshold,
            "threshold_rule": f"count >= {self.MIN_COUNT_TO_SURFACE} AND high_confidence >= 1",
        }


@dataclass
class CompanyAggregation:
    """Aggregated company/brand entity presence data (renamed from BrandAggregation)."""
    companies: Dict[str, int] = field(default_factory=dict)
    company_confidences: Dict[str, Dict[str, int]] = field(default_factory=dict)
    company_original_names: Dict[str, str] = field(default_factory=dict)

    # Thresholds per spec: count >= 2 AND high_confidence >= 1
    MIN_COUNT_TO_SURFACE: int = 2

    def add_company(self, entity: BrandEntity):
        """Add a company/brand entity to aggregation."""
        key = entity.normalized_name
        self.companies[key] = self.companies.get(key, 0) + 1

        # Store the best (highest confidence) original name
        if key not in self.company_original_names:
            self.company_original_names[key] = entity.name
        elif entity.confidence == CommercialConfidence.HIGH:
            self.company_original_names[key] = entity.name

        if key not in self.company_confidences:
            self.company_confidences[key] = {"high": 0, "medium": 0, "low": 0}
        self.company_confidences[key][entity.confidence.value] += 1

    # Backward compatibility alias
    def add_brand(self, brand: BrandEntity):
        """Alias for add_company (backward compatibility)."""
        self.add_company(brand)

    def to_dict(self) -> Dict[str, Any]:
        # Only surface companies that meet STRICT threshold:
        # count >= 2 AND high_confidence >= 1
        surfaced = []
        below_threshold = []
        no_high_confidence = []

        for normalized, count in sorted(self.companies.items(), key=lambda x: -x[1]):
            conf = self.company_confidences.get(normalized, {})
            high_count = conf.get("high", 0)
            display_name = self.company_original_names.get(normalized, normalized)

            entry = {
                "name": display_name,
                "normalized_name": normalized,
                "count": count,
                "high_confidence_count": high_count,
                "confidence_breakdown": conf,
            }

            # Strict surfacing rule: count >= 2 AND high_confidence >= 1
            if count >= self.MIN_COUNT_TO_SURFACE and high_count >= 1:
                surfaced.append(entry)
            elif count < self.MIN_COUNT_TO_SURFACE:
                below_threshold.append(entry)
            else:
                # count >= 2 but high_confidence == 0
                no_high_confidence.append(entry)

        return {
            # Use "companies" terminology per spec
            "surfaced_companies": surfaced,
            # Also include as "surfaced_brands" for backward compatibility
            "surfaced_brands": surfaced,
            "below_threshold_count": len(below_threshold),
            "no_high_confidence_count": len(no_high_confidence),
            "total_unique_companies": len(self.companies),
            "total_unique_brands": len(self.companies),  # backward compat
            "threshold_rule": f"count >= {self.MIN_COUNT_TO_SURFACE} AND high_confidence >= 1",
            "exclusion_reasons": {
                "below_count_threshold": len(below_threshold),
                "no_high_confidence_evidence": len(no_high_confidence),
            },
        }


# Backward compatibility alias
BrandAggregation = CompanyAggregation


@dataclass
class CommercialAnalysisResult:
    """Complete commercial analysis result for a scan."""
    exposure_spectrum: CommercialExposureSpectrum
    topic_aggregation: TopicAggregation
    company_aggregation: CompanyAggregation
    item_classifications: List[Dict[str, Any]]

    # Validity
    is_valid_for_display: bool = True
    validity_reason: Optional[str] = None

    # Backward compatibility property
    @property
    def brand_aggregation(self) -> CompanyAggregation:
        """Backward compatibility alias for company_aggregation."""
        return self.company_aggregation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exposure_spectrum": self.exposure_spectrum.to_dict(),
            "topic_aggregation": self.topic_aggregation.to_dict(),
            # Output both for backward compat
            "company_aggregation": self.company_aggregation.to_dict(),
            "brand_aggregation": self.company_aggregation.to_dict(),
            "validity": {
                "is_valid": self.is_valid_for_display,
                "reason": self.validity_reason,
            },
        }


def analyze_commercial_content(
    feed_items: List[Dict[str, Any]],
    source_type: Optional[str] = None
) -> CommercialAnalysisResult:
    """
    Perform complete commercial content analysis on feed items.

    This is the main entry point for commercial classification (Gold Standard v3.0).

    Args:
        feed_items: List of FeedItem dicts from a scan
        source_type: Optional source type (e.g., "MOBILE_VIDEO", "DESKTOP_EXTENSION")
                     Used to adjust extraction confidence for MOBILE_VIDEO scans.

    Returns:
        CommercialAnalysisResult with all aggregated data
    """
    exposure = CommercialExposureSpectrum()
    topics = TopicAggregation()
    companies = CompanyAggregation()
    classifications = []

    exposure.total_items = len(feed_items)

    for item in feed_items:
        # Classify commercial intent
        classification = classify_feed_item(item)
        classifications.append(classification.to_dict())

        # Update exposure spectrum
        if classification.confidence == CommercialConfidence.HIGH:
            exposure.high_confidence_items += 1

            if classification.commercial_class == CommercialClass.NON_COMMERCIAL:
                exposure.non_commercial += 1
            elif classification.commercial_class == CommercialClass.LABELED_AD:
                exposure.labeled_ads += 1
            elif classification.commercial_class == CommercialClass.UNLABELED_PROMOTION:
                exposure.unlabeled_promotion_high += 1

        elif classification.confidence == CommercialConfidence.MEDIUM:
            if classification.commercial_class == CommercialClass.UNLABELED_PROMOTION:
                exposure.unlabeled_promotion_medium += 1
            elif classification.commercial_class == CommercialClass.AMBIGUOUS:
                exposure.ambiguous += 1
        else:
            exposure.ambiguous += 1

        # Topic classification (only for promotional content - PROMO ONLY per spec)
        if classification.commercial_class in [
            CommercialClass.LABELED_AD,
            CommercialClass.UNLABELED_PROMOTION
        ]:
            topic = classify_promo_topic(item)
            if topic:
                topics.add_topic(topic.topic, topic.confidence)

            # Company extraction (PROMO ONLY per spec)
            item_companies = extract_companies(item, source_type=source_type)
            for company in item_companies:
                companies.add_company(company)

    # ==========================================================================
    # SANITY CHECK: stacked_bar.total must equal high_confidence_items
    # ==========================================================================
    stacked_bar_total = exposure.non_commercial + exposure.labeled_ads + exposure.unlabeled_promotion_high
    assert stacked_bar_total == exposure.high_confidence_items, (
        f"Sanity check failed: stacked_bar total ({stacked_bar_total}) != "
        f"high_confidence_items ({exposure.high_confidence_items})"
    )

    # Determine validity for display
    is_valid = True
    validity_reason = None

    if exposure.total_items < 10:
        is_valid = False
        validity_reason = f"Only {exposure.total_items} items in scan. Minimum 10 required for reliable commercial analysis."
    elif exposure.high_confidence_items < 5:
        is_valid = False
        validity_reason = f"Only {exposure.high_confidence_items} high-confidence classifications. Results may not be representative."

    return CommercialAnalysisResult(
        exposure_spectrum=exposure,
        topic_aggregation=topics,
        company_aggregation=companies,
        item_classifications=classifications,
        is_valid_for_display=is_valid,
        validity_reason=validity_reason,
    )
