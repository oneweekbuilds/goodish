"""
Creator Profile Inference Module

This module infers creator profile types from available metadata:
- Follower count tiers (micro, mid-tier, macro, celebrity)
- Account type (brand, influencer, news, personal)
- Commercial indicators

Epistemic boundaries (STRICTLY enforced):
- These are INFERENCES based on observable signals
- Cannot determine actual influence or reach
- Cannot determine authenticity or trustworthiness
- Account type inference is probabilistic, not definitive
"""

import re
from typing import Dict, Any, List, Optional
from enum import Enum


class FollowerTier(str, Enum):
    """Follower count tiers based on common influencer marketing definitions."""
    NANO = "nano"           # < 1K followers
    MICRO = "micro"         # 1K - 10K followers
    MID_TIER = "mid_tier"   # 10K - 100K followers
    MACRO = "macro"         # 100K - 1M followers
    MEGA = "mega"           # 1M+ followers
    UNKNOWN = "unknown"     # No follower data available


class AccountType(str, Enum):
    """Inferred account type based on handle and bio patterns."""
    BRAND = "brand"                 # Company/product accounts
    NEWS_MEDIA = "news_media"       # News outlets, journalists
    INFLUENCER = "influencer"       # Content creators, influencers
    CELEBRITY = "celebrity"         # Famous personalities
    PERSONAL = "personal"           # Regular personal accounts
    UNKNOWN = "unknown"             # Cannot determine


# Follower count thresholds
FOLLOWER_TIERS = {
    FollowerTier.NANO: (0, 1000),
    FollowerTier.MICRO: (1000, 10000),
    FollowerTier.MID_TIER: (10000, 100000),
    FollowerTier.MACRO: (100000, 1000000),
    FollowerTier.MEGA: (1000000, float('inf')),
}


# Handle patterns for account type inference
BRAND_HANDLE_PATTERNS = [
    r"official$",
    r"_official$",
    r"store$",
    r"_store$",
    r"shop$",
    r"_shop$",
    r"brand$",
    r"hq$",
    r"_hq$",
    r"inc$",
    r"corp$",
    r"co$",
    r"llc$",
    r"^the[a-z]+$",  # "thebrandname"
]

NEWS_HANDLE_PATTERNS = [
    r"news",
    r"breaking",
    r"report",
    r"times$",
    r"post$",
    r"tribune",
    r"journal",
    r"daily",
    r"herald",
    r"gazette",
    r"cnn",
    r"bbc",
    r"abc",
    r"nbc",
    r"cbs",
    r"fox",
    r"nyt",
    r"wsj",
    r"wapo",
    r"politico",
    r"reuters",
    r"ap$",
]

INFLUENCER_HANDLE_PATTERNS = [
    r"creator",
    r"vlog",
    r"tube$",
    r"gram$",
    r"tok$",
    r"life$",
    r"daily$",
    r"world$",
    r"tv$",
]

# Bio/description patterns for account type inference
BRAND_BIO_KEYWORDS = [
    "official account", "official page",
    "shop now", "shop our", "buy now",
    "store", "shop", "boutique",
    "brand", "company", "business",
    "customer service", "dm for",
    "worldwide shipping", "free shipping",
    "link in bio", "linktree",
    "use code", "discount", "promo",
]

NEWS_BIO_KEYWORDS = [
    "news", "breaking", "latest",
    "journalist", "reporter", "correspondent",
    "editor", "anchor", "host",
    "covering", "reporting on",
    "media", "press", "publication",
    "follow for updates", "stay informed",
]

INFLUENCER_BIO_KEYWORDS = [
    "content creator", "creator",
    "influencer", "blogger", "vlogger",
    "youtuber", "tiktoker", "streamer",
    "collab", "collaboration", "business inquiries",
    "dm for collab", "pr friendly",
    "ambassador", "partner",
]

CELEBRITY_BIO_KEYWORDS = [
    "actor", "actress", "singer", "artist",
    "musician", "athlete", "player",
    "model", "author", "writer",
    "tv host", "entertainer", "performer",
    "official", "verified",
]


def get_follower_tier(follower_count: Optional[int]) -> FollowerTier:
    """
    Determine follower tier from follower count.

    Args:
        follower_count: Number of followers, or None if unavailable

    Returns:
        FollowerTier enum value
    """
    if follower_count is None:
        return FollowerTier.UNKNOWN

    for tier, (min_count, max_count) in FOLLOWER_TIERS.items():
        if min_count <= follower_count < max_count:
            return tier

    return FollowerTier.UNKNOWN


def infer_account_type_from_handle(handle: str) -> tuple:
    """
    Infer account type from handle patterns.

    Args:
        handle: Account handle (with or without @)

    Returns:
        Tuple of (AccountType, matched_pattern or None)
    """
    if not handle:
        return AccountType.UNKNOWN, None

    # Normalize handle
    clean_handle = handle.lower().lstrip("@")

    # Check brand patterns
    for pattern in BRAND_HANDLE_PATTERNS:
        if re.search(pattern, clean_handle, re.IGNORECASE):
            return AccountType.BRAND, pattern

    # Check news patterns
    for pattern in NEWS_HANDLE_PATTERNS:
        if re.search(pattern, clean_handle, re.IGNORECASE):
            return AccountType.NEWS_MEDIA, pattern

    # Check influencer patterns
    for pattern in INFLUENCER_HANDLE_PATTERNS:
        if re.search(pattern, clean_handle, re.IGNORECASE):
            return AccountType.INFLUENCER, pattern

    return AccountType.UNKNOWN, None


def infer_account_type_from_bio(bio: str) -> tuple:
    """
    Infer account type from bio/description text.

    Args:
        bio: Account bio or description text

    Returns:
        Tuple of (AccountType, matched_keywords list)
    """
    if not bio:
        return AccountType.UNKNOWN, []

    bio_lower = bio.lower()
    matches = {
        AccountType.BRAND: [],
        AccountType.NEWS_MEDIA: [],
        AccountType.INFLUENCER: [],
        AccountType.CELEBRITY: [],
    }

    # Check brand keywords
    for keyword in BRAND_BIO_KEYWORDS:
        if keyword in bio_lower:
            matches[AccountType.BRAND].append(keyword)

    # Check news keywords
    for keyword in NEWS_BIO_KEYWORDS:
        if keyword in bio_lower:
            matches[AccountType.NEWS_MEDIA].append(keyword)

    # Check influencer keywords
    for keyword in INFLUENCER_BIO_KEYWORDS:
        if keyword in bio_lower:
            matches[AccountType.INFLUENCER].append(keyword)

    # Check celebrity keywords
    for keyword in CELEBRITY_BIO_KEYWORDS:
        if keyword in bio_lower:
            matches[AccountType.CELEBRITY].append(keyword)

    # Find account type with most matches
    best_type = AccountType.UNKNOWN
    best_matches = []

    for account_type, matched_keywords in matches.items():
        if len(matched_keywords) > len(best_matches):
            best_type = account_type
            best_matches = matched_keywords

    return best_type, best_matches


def infer_creator_profile(
    handle: str,
    follower_count: Optional[int] = None,
    bio: Optional[str] = None,
    is_verified: bool = False,
    is_ad_account: bool = False,
) -> Dict[str, Any]:
    """
    Infer a complete creator profile from available metadata.

    Args:
        handle: Account handle
        follower_count: Number of followers (if available)
        bio: Account bio/description (if available)
        is_verified: Whether account is verified
        is_ad_account: Whether this account appeared in ad content

    Returns:
        Dict with inferred profile:
            - follower_tier: FollowerTier enum value
            - account_type: AccountType enum value
            - is_commercial: bool (likely commercial/promotional account)
            - inference_confidence: HIGH/MEDIUM/LOW
            - inference_evidence: dict with evidence for inferences
    """
    result = {
        "follower_tier": FollowerTier.UNKNOWN.value,
        "account_type": AccountType.UNKNOWN.value,
        "is_commercial": False,
        "inference_confidence": "LOW",
        "inference_evidence": {
            "signals_used": [],
            "handle_pattern_match": None,
            "bio_keyword_matches": [],
        },
    }

    signals_count = 0

    # Follower tier inference
    tier = get_follower_tier(follower_count)
    result["follower_tier"] = tier.value
    if tier != FollowerTier.UNKNOWN:
        result["inference_evidence"]["signals_used"].append("follower_count")
        signals_count += 1

    # Account type inference - combine handle and bio signals
    handle_type, handle_pattern = infer_account_type_from_handle(handle)
    bio_type, bio_keywords = infer_account_type_from_bio(bio or "")

    result["inference_evidence"]["handle_pattern_match"] = handle_pattern
    result["inference_evidence"]["bio_keyword_matches"] = bio_keywords

    # Determine final account type (bio evidence takes precedence if strong)
    if len(bio_keywords) >= 2:
        result["account_type"] = bio_type.value
        result["inference_evidence"]["signals_used"].append("bio_keywords")
        signals_count += 1
    elif handle_type != AccountType.UNKNOWN:
        result["account_type"] = handle_type.value
        result["inference_evidence"]["signals_used"].append("handle_pattern")
        signals_count += 1
    elif len(bio_keywords) == 1:
        result["account_type"] = bio_type.value
        result["inference_evidence"]["signals_used"].append("bio_keywords")
        signals_count += 1

    # Commercial inference
    # An account is likely commercial if:
    # - It's a brand account
    # - It appeared in ad content
    # - Has brand/promotional keywords in bio
    # - Is verified + has high follower count (likely sponsored partnerships)
    is_commercial = False
    commercial_reasons = []

    if result["account_type"] == AccountType.BRAND.value:
        is_commercial = True
        commercial_reasons.append("brand_account_type")

    if is_ad_account:
        is_commercial = True
        commercial_reasons.append("appeared_in_ads")

    if any(kw in (bio or "").lower() for kw in ["shop", "buy", "store", "discount", "promo", "code"]):
        is_commercial = True
        commercial_reasons.append("promotional_bio_keywords")

    if is_verified and tier in [FollowerTier.MACRO, FollowerTier.MEGA]:
        commercial_reasons.append("verified_high_follower_likely_sponsored")

    result["is_commercial"] = is_commercial
    result["inference_evidence"]["commercial_reasons"] = commercial_reasons

    # Confidence assessment
    if signals_count >= 2:
        result["inference_confidence"] = "HIGH"
    elif signals_count == 1:
        result["inference_confidence"] = "MEDIUM"
    else:
        result["inference_confidence"] = "LOW"

    # Verification boosts confidence for certain inferences
    if is_verified:
        result["inference_evidence"]["signals_used"].append("verification_status")
        if result["inference_confidence"] == "MEDIUM":
            result["inference_confidence"] = "HIGH"

    return result


def batch_infer_creator_profiles(
    creator_profiles: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Infer profiles for a batch of creators.

    Args:
        creator_profiles: List of creator dicts with handle, follower_count, bio, etc.

    Returns:
        Dict with:
            - inferences: List of profile inferences
            - summary: Aggregate stats
    """
    inferences = []
    tier_counts = {tier.value: 0 for tier in FollowerTier}
    type_counts = {atype.value: 0 for atype in AccountType}
    n_commercial = 0

    for creator in creator_profiles:
        inference = infer_creator_profile(
            handle=creator.get("handle", ""),
            follower_count=creator.get("follower_count"),
            bio=creator.get("bio") or creator.get("description"),
            is_verified=creator.get("is_verified", False),
            is_ad_account=creator.get("is_ad_account", False),
        )
        inferences.append({
            "handle": creator.get("handle"),
            **inference,
        })

        tier_counts[inference["follower_tier"]] += 1
        type_counts[inference["account_type"]] += 1
        if inference["is_commercial"]:
            n_commercial += 1

    # Clean up zero counts
    tier_counts = {k: v for k, v in tier_counts.items() if v > 0}
    type_counts = {k: v for k, v in type_counts.items() if v > 0}

    return {
        "inferences": inferences,
        "summary": {
            "total_creators": len(creator_profiles),
            "tier_distribution": tier_counts,
            "type_distribution": type_counts,
            "n_commercial": n_commercial,
            "commercial_rate_percent": round(n_commercial / len(creator_profiles) * 100, 1) if creator_profiles else 0,
        },
    }
