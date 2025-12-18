"""
Commercial Intent Classification Pipeline

This module classifies each feed item's commercial intent with defensible,
evidence-based categorization. No speculation about user identity, platform
intent, or advertiser goals.

Classification Output:
    commercial_class: "non_commercial" | "labeled_ad" | "unlabeled_promotion" | "ambiguous"
    commercial_confidence: "high" | "medium" | "low"
    commercial_detection_method: "platform_label" | "ocr_disclosure" | "cta_pattern" | "entity_reference" | "keyword_heuristic" | "none"

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
    CTA_PATTERN = "cta_pattern"
    ENTITY_REFERENCE = "entity_reference"
    KEYWORD_HEURISTIC = "keyword_heuristic"
    NONE = "none"


@dataclass
class CommercialClassification:
    """Classification result for a single feed item."""
    commercial_class: CommercialClass
    confidence: CommercialConfidence
    detection_method: DetectionMethod
    evidence: List[str] = field(default_factory=list)
    matched_patterns: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "commercial_class": self.commercial_class.value,
            "commercial_confidence": self.confidence.value,
            "commercial_detection_method": self.detection_method.value,
            "evidence": self.evidence,
            "matched_patterns": self.matched_patterns,
        }


# =============================================================================
# Detection Patterns
# =============================================================================

# High-confidence ad disclosure tokens (case-insensitive)
# These are regulatory disclosure terms that strongly indicate paid content
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

# Medium-confidence promotional patterns
# These suggest promotional intent but aren't definitive disclosures
MEDIUM_PROMO_PATTERNS = [
    r"#partner\b",                # Partner hashtag
    r"#collab\b",                 # Collaboration
    r"#gifted\b",                 # Gifted product
    r"use\s+code\b",              # "Use code" + discount code
    r"discount\s+code\b",         # Discount code
    r"link\s+in\s+bio\b",         # Link in bio (common CTA)
    r"swipe\s+up\b",              # Swipe up CTA
    r"tap\s+to\s+shop\b",         # Shop CTA
    r"shop\s+now\b",              # Shop now CTA
    r"limited\s+time\b",          # Urgency signal
    r"while\s+supplies\s+last\b", # Scarcity signal
    r"exclusive\s+offer\b",       # Exclusive offer
]

# Low-confidence promotional keywords
# These are common in promotions but also in organic content
LOW_PROMO_KEYWORDS = [
    r"buy\b",
    r"purchase\b",
    r"sale\b",
    r"deal\b",
    r"off\b",                     # "X% off"
    r"save\b",
    r"free\b",
    r"giveaway\b",
    r"checkout\b",
]

# Known brand/company patterns (high-confidence entity references)
# These are clearly commercial entity mentions
BRAND_REFERENCE_PATTERNS = [
    r"@\w+\.com\b",               # @brand.com mentions
    r"\.com\b",                   # Domain references
    r"\.co\b",
    r"\.io\b",
]


# Compile all patterns
AD_PATTERNS_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_AD_TOKENS]
PROMO_PATTERNS_MEDIUM = [re.compile(p, re.IGNORECASE) for p in MEDIUM_PROMO_PATTERNS]
PROMO_PATTERNS_LOW = [re.compile(p, re.IGNORECASE) for p in LOW_PROMO_KEYWORDS]
BRAND_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BRAND_REFERENCE_PATTERNS]


# =============================================================================
# Core Classification Logic
# =============================================================================

def classify_feed_item(feed_item: Dict[str, Any]) -> CommercialClassification:
    """
    Classify a single feed item's commercial intent.

    Classification hierarchy (checked in order):
    1. Platform-labeled ads (is_ad=True from platform metadata)
    2. OCR-detected disclosures (high-confidence regulatory tokens)
    3. CTA patterns (medium-confidence promotional signals)
    4. Entity references (brand/company mentions)
    5. Keyword heuristics (low-confidence promotional words)

    Returns:
        CommercialClassification with class, confidence, method, and evidence
    """
    evidence = []
    matched_patterns = []

    # Extract relevant data from feed item
    is_ad = feed_item.get("is_ad", False)
    ad_metadata = feed_item.get("ad_metadata") or {}
    content_text = feed_item.get("content_text") or {}
    engagement_drivers = feed_item.get("engagement_drivers") or {}

    # Combine all text content for pattern matching
    all_text = _extract_all_text(content_text)

    # -----------------------------------------------------
    # 1. Check for platform-labeled ads
    # -----------------------------------------------------
    if is_ad:
        reason = ad_metadata.get("ad_detected_reason", "platform_label")
        evidence.append(f"is_ad=True (reason: {reason})")

        if ad_metadata.get("sponsored_label_text"):
            evidence.append(f"sponsored_label: '{ad_metadata['sponsored_label_text']}'")

        if ad_metadata.get("advertiser_name"):
            evidence.append(f"advertiser: '{ad_metadata['advertiser_name']}'")

        # Platform labels are HIGH confidence for LABELED_AD
        return CommercialClassification(
            commercial_class=CommercialClass.LABELED_AD,
            confidence=CommercialConfidence.HIGH,
            detection_method=(
                DetectionMethod.OCR_DISCLOSURE
                if reason == "ocr_disclosure_token"
                else DetectionMethod.PLATFORM_LABEL
            ),
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # -----------------------------------------------------
    # 2. Check for high-confidence disclosure tokens (not already flagged as ad)
    # -----------------------------------------------------
    high_matches = _find_pattern_matches(all_text, AD_PATTERNS_HIGH)
    if high_matches:
        matched_patterns.extend(high_matches)
        evidence.append(f"High-confidence disclosure tokens found: {high_matches}")

        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.HIGH,
            detection_method=DetectionMethod.OCR_DISCLOSURE,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # -----------------------------------------------------
    # 3. Check for medium-confidence promotional patterns
    # -----------------------------------------------------
    medium_matches = _find_pattern_matches(all_text, PROMO_PATTERNS_MEDIUM)
    cta_patterns = engagement_drivers.get("call_to_action_patterns", [])
    urgency_signals = engagement_drivers.get("urgency_or_scarcity_signals", [])

    # Combine evidence from multiple sources
    promo_signal_count = 0

    if medium_matches:
        matched_patterns.extend(medium_matches)
        evidence.append(f"Promotional patterns found: {medium_matches}")
        promo_signal_count += len(medium_matches)

    if cta_patterns:
        evidence.append(f"CTA patterns: {cta_patterns}")
        promo_signal_count += len(cta_patterns)

    if urgency_signals:
        evidence.append(f"Urgency/scarcity signals: {urgency_signals}")
        promo_signal_count += len(urgency_signals)

    # Multiple medium signals = higher confidence
    if promo_signal_count >= 3:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.HIGH,
            detection_method=DetectionMethod.CTA_PATTERN,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )
    elif promo_signal_count >= 2:
        return CommercialClassification(
            commercial_class=CommercialClass.UNLABELED_PROMOTION,
            confidence=CommercialConfidence.MEDIUM,
            detection_method=DetectionMethod.CTA_PATTERN,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )
    elif promo_signal_count == 1:
        # Single medium signal -> ambiguous
        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_method=DetectionMethod.CTA_PATTERN,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # -----------------------------------------------------
    # 4. Check for brand/entity references
    # -----------------------------------------------------
    brand_matches = _find_pattern_matches(all_text, BRAND_PATTERNS)
    if brand_matches:
        matched_patterns.extend(brand_matches)
        evidence.append(f"Brand/entity references: {brand_matches}")

        # Brand references alone are low confidence
        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_method=DetectionMethod.ENTITY_REFERENCE,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # -----------------------------------------------------
    # 5. Check for low-confidence promotional keywords
    # -----------------------------------------------------
    low_matches = _find_pattern_matches(all_text, PROMO_PATTERNS_LOW)
    if len(low_matches) >= 2:
        matched_patterns.extend(low_matches)
        evidence.append(f"Promotional keywords found: {low_matches}")

        return CommercialClassification(
            commercial_class=CommercialClass.AMBIGUOUS,
            confidence=CommercialConfidence.LOW,
            detection_method=DetectionMethod.KEYWORD_HEURISTIC,
            evidence=evidence,
            matched_patterns=matched_patterns,
        )

    # -----------------------------------------------------
    # 6. No promotional signals detected -> non-commercial
    # -----------------------------------------------------
    evidence.append("No commercial signals detected")
    return CommercialClassification(
        commercial_class=CommercialClass.NON_COMMERCIAL,
        confidence=CommercialConfidence.HIGH,
        detection_method=DetectionMethod.NONE,
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

# Common words and UI elements to filter out of brand extraction
BRAND_EXCLUSION_LIST = {
    # Common English words
    'THE', 'AND', 'FOR', 'YOU', 'ARE', 'THIS', 'THAT', 'WITH', 'YOUR', 'HAVE',
    'WILL', 'FROM', 'THEY', 'BEEN', 'SOME', 'WHAT', 'WHEN', 'MAKE', 'LIKE',
    'TIME', 'VERY', 'JUST', 'KNOW', 'TAKE', 'COME', 'MADE', 'LIVE', 'BACK',
    'ONLY', 'OVER', 'SUCH', 'MORE', 'ALSO', 'INTO', 'YEAR', 'GOOD', 'NEW',
    'NOW', 'WAY', 'MAY', 'DAY', 'TOO', 'ANY', 'GET', 'HAS', 'HIM', 'HIS',
    'HOW', 'MAN', 'OUT', 'NOT', 'BUT', 'ALL', 'CAN', 'HAD', 'HER', 'WAS',
    'ONE', 'OUR', 'SAY', 'SHE', 'USE', 'SHOP', 'FREE', 'SALE', 'BEST',
    # Social media UI elements
    'HOME', 'SEARCH', 'EXPLORE', 'PROFILE', 'MENU', 'SETTINGS', 'MORE',
    'SHARE', 'LIKE', 'COMMENT', 'FOLLOW', 'FOLLOWING', 'FOLLOWERS',
    'REPOST', 'QUOTE', 'REPLY', 'SEND', 'POST', 'POSTS', 'TWEET', 'TWEETS',
    'BOOKMARK', 'BOOKMARKS', 'MESSAGES', 'NOTIFICATIONS', 'VIEWS', 'VIEW',
    'LIKES', 'COMMENTS', 'SHARES', 'REPOSTS', 'REPLIES', 'TRENDING',
    # Common content words
    'VIDEO', 'PHOTO', 'IMAGE', 'NEWS', 'LIVE', 'WATCH', 'READ', 'SHOW',
    'CLICK', 'TAP', 'SWIPE', 'SCROLL', 'SEE', 'LINK', 'BIO', 'ABOUT',
    # Time-related
    'TODAY', 'NOW', 'MINUTES', 'HOURS', 'DAYS', 'AGO', 'YESTERDAY',
    # Numbers and short words
    'FOR', 'THE', 'WAR', 'TOP', 'HOT', 'NEW', 'OLD', 'BIG', 'FYP',
}

# Platform domains to exclude from brand detection (not actual advertisers)
PLATFORM_DOMAIN_EXCLUSIONS = {
    # Social media platforms
    'twitter', 'x', 'tiktok', 'instagram', 'youtube', 'facebook', 'meta',
    'reddit', 'snapchat', 'pinterest', 'linkedin', 'threads', 'mastodon',
    'tumblr', 'whatsapp', 'telegram', 'discord', 'twitch',
    # URL shorteners and link services
    'bit', 'bitly', 'linktr', 'linktree', 'tinyurl', 'goo', 'ow', 't',
    'lnkd', 'buff', 'rebrand', 'short', 'tiny', 'cutt',
    # Generic/tech domains
    'google', 'apple', 'microsoft', 'amazon', 'aws',  # only exclude if no clear product
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


def extract_brands(
    feed_item: Dict[str, Any],
    source_type: Optional[str] = None
) -> List[BrandEntity]:
    """
    Extract brand/company entities from a feed item.

    Sources (in order of confidence):
    1. ad_metadata.advertiser_name (HIGH confidence)
    2. ad_metadata.advertiser_domain (HIGH confidence)
    3. account.account_handle if promotional (MEDIUM confidence)
    4. OCR text patterns - domains, @handles (MEDIUM for MOBILE_VIDEO, LOW otherwise)
    5. Capitalized brand tokens from OCR (LOW confidence, conservative)

    For MOBILE_VIDEO scans, advertiser metadata is often missing, so OCR-based
    extraction is given higher confidence when patterns are clear.

    Returns:
        List of BrandEntity objects, deduplicated by normalized_name
    """
    brands = []
    seen_normalized = set()

    ad_metadata = feed_item.get("ad_metadata") or {}
    account = feed_item.get("account") or {}
    content_text = feed_item.get("content_text") or {}

    # 1. Advertiser name from ad metadata
    advertiser_name = ad_metadata.get("advertiser_name")
    if advertiser_name:
        normalized = normalize_brand_name(advertiser_name)
        if normalized and normalized not in seen_normalized:
            brands.append(BrandEntity(
                name=advertiser_name,
                normalized_name=normalized,
                source="ad_metadata",
                confidence=CommercialConfidence.HIGH,
            ))
            seen_normalized.add(normalized)

    # 2. Advertiser domain
    advertiser_domain = ad_metadata.get("advertiser_domain")
    if advertiser_domain:
        normalized = normalize_brand_name(advertiser_domain)
        if normalized and normalized not in seen_normalized:
            brands.append(BrandEntity(
                name=advertiser_domain,
                normalized_name=normalized,
                source="ad_metadata",
                confidence=CommercialConfidence.HIGH,
            ))
            seen_normalized.add(normalized)

    # 3. Account handle (only if this is a promotional item)
    is_promotional = feed_item.get("is_ad", False)
    account_handle = account.get("account_handle")
    if is_promotional and account_handle:
        normalized = normalize_brand_name(account_handle)
        if normalized and normalized not in seen_normalized:
            brands.append(BrandEntity(
                name=account_handle,
                normalized_name=normalized,
                source="handle",
                confidence=CommercialConfidence.MEDIUM,
            ))
            seen_normalized.add(normalized)

    # 4. Extract from text patterns (enhanced for MOBILE_VIDEO)
    all_text = _extract_all_text(content_text)
    is_mobile_video = source_type == "MOBILE_VIDEO"

    # For MOBILE_VIDEO, OCR-derived brands are MEDIUM confidence when clear patterns match
    ocr_brand_confidence = CommercialConfidence.MEDIUM if is_mobile_video else CommercialConfidence.LOW

    # 4a. Find domain patterns (brand.com, brand.co, brand.io)
    domain_pattern = re.compile(r'\b([a-zA-Z][a-zA-Z0-9-]{2,20})\.(com|co|io|net|org|app|shop)\b', re.IGNORECASE)
    domain_matches = domain_pattern.findall(all_text)
    for match in domain_matches:
        brand_name = match[0]  # Just the brand part, not the TLD
        brand_lower = brand_name.lower()
        # Filter out common UI words
        if brand_name.upper() in BRAND_EXCLUSION_LIST:
            continue
        # Filter out platform domains (twitter.com, tiktok.com, bit.ly, etc.)
        if brand_lower in PLATFORM_DOMAIN_EXCLUSIONS:
            continue
        normalized = normalize_brand_name(brand_name)
        if normalized and len(normalized) >= 3 and normalized not in seen_normalized:
            brands.append(BrandEntity(
                name=f"{brand_name}.{match[1]}",
                normalized_name=normalized,
                source="ocr_text",
                confidence=ocr_brand_confidence,
            ))
            seen_normalized.add(normalized)

    # 4b. Find @mentions that look like brands
    at_mentions = re.findall(r"@([a-zA-Z][a-zA-Z0-9_]{2,20})", all_text)
    for mention in at_mentions:
        # Filter out common UI words
        if mention.upper() in BRAND_EXCLUSION_LIST:
            continue
        normalized = normalize_brand_name(mention)
        if normalized and normalized not in seen_normalized:
            brands.append(BrandEntity(
                name=f"@{mention}",
                normalized_name=normalized,
                source="ocr_text",
                confidence=ocr_brand_confidence,
            ))
            seen_normalized.add(normalized)

    # 4c. For MOBILE_VIDEO with promotional content, extract capitalized brand tokens
    # This is VERY conservative: only clear brand patterns, filter out UI elements
    # DISABLED for now - too many false positives from UI elements
    # The advertiser metadata is the primary source; OCR-based brand extraction is unreliable
    # if is_mobile_video and is_promotional:
    #     pass  # Disabled - UI elements like HOME, SEARCH, EXPLORE are not brands

    return brands


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
class BrandAggregation:
    """Aggregated brand/entity presence data."""
    brands: Dict[str, int] = field(default_factory=dict)
    brand_confidences: Dict[str, Dict[str, int]] = field(default_factory=dict)
    brand_original_names: Dict[str, str] = field(default_factory=dict)

    # Thresholds
    MIN_COUNT_TO_SURFACE: int = 2

    def add_brand(self, brand: BrandEntity):
        """Add a brand to aggregation."""
        key = brand.normalized_name
        self.brands[key] = self.brands.get(key, 0) + 1

        # Store the best (highest confidence) original name
        if key not in self.brand_original_names:
            self.brand_original_names[key] = brand.name
        elif brand.confidence == CommercialConfidence.HIGH:
            self.brand_original_names[key] = brand.name

        if key not in self.brand_confidences:
            self.brand_confidences[key] = {"high": 0, "medium": 0, "low": 0}
        self.brand_confidences[key][brand.confidence.value] += 1

    def to_dict(self) -> Dict[str, Any]:
        # Only surface brands that meet STRICT threshold:
        # count >= 2 AND high_confidence >= 1
        surfaced = []
        below_threshold = []
        no_high_confidence = []

        for normalized, count in sorted(self.brands.items(), key=lambda x: -x[1]):
            conf = self.brand_confidences.get(normalized, {})
            high_count = conf.get("high", 0)
            display_name = self.brand_original_names.get(normalized, normalized)

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
            "surfaced_brands": surfaced,
            "below_threshold_count": len(below_threshold),
            "no_high_confidence_count": len(no_high_confidence),
            "total_unique_brands": len(self.brands),
            "threshold_rule": f"count >= {self.MIN_COUNT_TO_SURFACE} AND high_confidence >= 1",
            "exclusion_reasons": {
                "below_count_threshold": len(below_threshold),
                "no_high_confidence_evidence": len(no_high_confidence),
            },
        }


@dataclass
class CommercialAnalysisResult:
    """Complete commercial analysis result for a scan."""
    exposure_spectrum: CommercialExposureSpectrum
    topic_aggregation: TopicAggregation
    brand_aggregation: BrandAggregation
    item_classifications: List[Dict[str, Any]]

    # Validity
    is_valid_for_display: bool = True
    validity_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exposure_spectrum": self.exposure_spectrum.to_dict(),
            "topic_aggregation": self.topic_aggregation.to_dict(),
            "brand_aggregation": self.brand_aggregation.to_dict(),
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

    This is the main entry point for commercial classification.

    Args:
        feed_items: List of FeedItem dicts from a scan
        source_type: Optional source type (e.g., "MOBILE_VIDEO", "DESKTOP_EXTENSION")
                     Used to adjust extraction confidence for MOBILE_VIDEO scans.

    Returns:
        CommercialAnalysisResult with all aggregated data
    """
    exposure = CommercialExposureSpectrum()
    topics = TopicAggregation()
    brands = BrandAggregation()
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

        # Topic classification (only for promotional content)
        if classification.commercial_class in [
            CommercialClass.LABELED_AD,
            CommercialClass.UNLABELED_PROMOTION
        ]:
            topic = classify_promo_topic(item)
            if topic:
                topics.add_topic(topic.topic, topic.confidence)

            # Brand extraction (pass source_type for MOBILE_VIDEO awareness)
            item_brands = extract_brands(item, source_type=source_type)
            for brand in item_brands:
                brands.add_brand(brand)

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
        brand_aggregation=brands,
        item_classifications=classifications,
        is_valid_for_display=is_valid,
        validity_reason=validity_reason,
    )
