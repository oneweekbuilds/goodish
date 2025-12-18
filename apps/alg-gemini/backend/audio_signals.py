"""
Audio Signal Detection and Excerpting

This module provides deterministic signal detection from audio transcripts.
Extracts evidence excerpts for:
    - Political language (keyword matching against versioned lexicon)
    - Promo language (pattern matching for commercial signals)
    - Creator mentions (@handle detection)

Key principles:
    - Deterministic: Same transcript always produces same excerpts
    - Versioned lexicons: Lexicon version stored for audit trail
    - Evidence-backed: Each excerpt includes matched_term and timestamps
    - Capped output: Max 10 excerpts per scan to limit storage

Excerpt format:
    {
        "start_ms": int,
        "end_ms": int,
        "text": str (max 200 chars),
        "signal_type": "political" | "promo" | "creator_mention",
        "matched_term": str
    }
"""

import re
from typing import Dict, Any, List, Optional


# =============================================================================
# Lexicon Versions (for audit trail)
# =============================================================================

LEXICON_VERSION = "1.0.0"

# Political lexicon - explicit keyword list
# Version 1.0.0: Initial release
POLITICAL_LEXICON = {
    # Elections and voting
    "vote", "voting", "election", "elections", "ballot", "polls",
    "candidate", "candidates", "campaign", "campaigns",
    # Political parties (US-focused for v1)
    "democrat", "democrats", "democratic", "republican", "republicans",
    "liberal", "liberals", "conservative", "conservatives",
    "left wing", "right wing", "leftist", "rightist",
    # Government and policy
    "congress", "senate", "legislation", "bill", "policy", "policies",
    "government", "federal", "politician", "politicians",
    "president", "presidential", "administration",
    # Political issues
    "immigration", "border", "abortion", "gun control", "gun rights",
    "climate change", "global warming", "healthcare", "medicare",
    "taxes", "tax policy", "economy", "inflation",
    # Political actions
    "protest", "protests", "rally", "rallies", "march", "marching",
    "activism", "activist", "activists", "petition",
    # Political commentary
    "political", "politics", "bipartisan", "partisan",
}

# Promo language patterns
# Version 1.0.0: Initial release
PROMO_PATTERNS = [
    # Direct promotional phrases
    r"\blink in bio\b",
    r"\blink in description\b",
    r"\bcheck (the )?link\b",
    r"\bswipe up\b",
    r"\buse (my |the )?code\b",
    r"\bdiscount code\b",
    r"\bpromo code\b",
    r"\baffiliate\b",
    r"\bsponsored\b",
    r"\b#ad\b",
    r"\b#sponsored\b",
    r"\b#partner\b",
    r"\b#gifted\b",
    r"\bpaid partnership\b",
    # Call-to-action patterns
    r"\bget yours\b",
    r"\bshop now\b",
    r"\bbuy now\b",
    r"\border now\b",
    r"\blimited time\b",
    r"\bexclusive offer\b",
    r"\bfree shipping\b",
    r"\b\d+% off\b",
    # Brand mentions with promotional context
    r"\bsent me\b",
    r"\bgifted me\b",
    r"\bthey sent\b",
    r"\bworking with\b",
    r"\bpartnered with\b",
    r"\bcollaboration with\b",
]

# Creator mention pattern
CREATOR_MENTION_PATTERN = r"@([a-zA-Z0-9_]{1,30})"


# =============================================================================
# Signal Detection Functions
# =============================================================================

def detect_political_signals(
    transcript: str,
    segments: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detect political language in transcript using lexicon matching.

    Args:
        transcript: Full transcript text
        segments: List of segment dicts with start_ms, end_ms, text

    Returns:
        List of excerpt dicts with signal_type="political"
    """
    excerpts = []
    transcript_lower = transcript.lower() if transcript else ""

    # Check each segment for political keywords
    for segment in segments:
        segment_text = segment.get("text", "")
        segment_lower = segment_text.lower()

        for keyword in POLITICAL_LEXICON:
            # Use word boundary matching
            pattern = r"\b" + re.escape(keyword) + r"\b"
            if re.search(pattern, segment_lower):
                # Extract context window (the segment itself)
                excerpt_text = segment_text[:200]  # Cap at 200 chars

                excerpts.append({
                    "start_ms": segment.get("start_ms", 0),
                    "end_ms": segment.get("end_ms", 0),
                    "text": excerpt_text,
                    "signal_type": "political",
                    "matched_term": keyword,
                })
                break  # One match per segment is enough

    return excerpts


def detect_promo_signals(
    transcript: str,
    segments: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detect promotional language in transcript using pattern matching.

    Args:
        transcript: Full transcript text
        segments: List of segment dicts with start_ms, end_ms, text

    Returns:
        List of excerpt dicts with signal_type="promo"
    """
    excerpts = []

    # Check each segment for promo patterns
    for segment in segments:
        segment_text = segment.get("text", "")
        segment_lower = segment_text.lower()

        for pattern in PROMO_PATTERNS:
            match = re.search(pattern, segment_lower, re.IGNORECASE)
            if match:
                excerpt_text = segment_text[:200]  # Cap at 200 chars

                excerpts.append({
                    "start_ms": segment.get("start_ms", 0),
                    "end_ms": segment.get("end_ms", 0),
                    "text": excerpt_text,
                    "signal_type": "promo",
                    "matched_term": match.group(0),
                })
                break  # One match per segment is enough

    return excerpts


def detect_creator_mentions(
    transcript: str,
    segments: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detect creator mentions (@handles) in transcript.

    Args:
        transcript: Full transcript text
        segments: List of segment dicts with start_ms, end_ms, text

    Returns:
        List of excerpt dicts with signal_type="creator_mention"
    """
    excerpts = []

    # Check each segment for @mentions
    for segment in segments:
        segment_text = segment.get("text", "")

        matches = re.findall(CREATOR_MENTION_PATTERN, segment_text)
        if matches:
            excerpt_text = segment_text[:200]  # Cap at 200 chars

            # Take first handle as the matched term
            excerpts.append({
                "start_ms": segment.get("start_ms", 0),
                "end_ms": segment.get("end_ms", 0),
                "text": excerpt_text,
                "signal_type": "creator_mention",
                "matched_term": f"@{matches[0]}",
            })

    return excerpts


# =============================================================================
# Main Excerpting Function
# =============================================================================

def extract_audio_excerpts(
    transcript: Optional[str],
    segments: Optional[List[Dict[str, Any]]],
    max_excerpts: int = 10
) -> Dict[str, Any]:
    """
    Extract evidence excerpts from audio transcript.

    Runs all signal detectors and returns prioritized, capped list.

    Priority order:
        1. Political signals (highest priority for transparency)
        2. Promo signals
        3. Creator mentions

    Args:
        transcript: Full transcript text (may be None)
        segments: List of segment dicts (may be None or empty)
        max_excerpts: Maximum number of excerpts to return

    Returns:
        Dict with:
            - excerpts: List of excerpt dicts (max 10)
            - signal_counts: Dict with count per signal type
            - lexicon_version: Version string for audit
    """
    result = {
        "excerpts": [],
        "signal_counts": {
            "political": 0,
            "promo": 0,
            "creator_mention": 0,
        },
        "lexicon_version": LEXICON_VERSION,
    }

    if not transcript or not segments:
        return result

    # Detect all signal types
    political_excerpts = detect_political_signals(transcript, segments)
    promo_excerpts = detect_promo_signals(transcript, segments)
    creator_excerpts = detect_creator_mentions(transcript, segments)

    # Update counts
    result["signal_counts"]["political"] = len(political_excerpts)
    result["signal_counts"]["promo"] = len(promo_excerpts)
    result["signal_counts"]["creator_mention"] = len(creator_excerpts)

    # Combine with priority ordering
    all_excerpts = []

    # Add political excerpts first (highest priority)
    all_excerpts.extend(political_excerpts)

    # Add promo excerpts
    all_excerpts.extend(promo_excerpts)

    # Add creator mentions last
    all_excerpts.extend(creator_excerpts)

    # Deduplicate by timestamp (same segment may match multiple patterns)
    seen_timestamps = set()
    unique_excerpts = []
    for exc in all_excerpts:
        key = (exc["start_ms"], exc["end_ms"])
        if key not in seen_timestamps:
            seen_timestamps.add(key)
            unique_excerpts.append(exc)

    # Cap at max_excerpts
    result["excerpts"] = unique_excerpts[:max_excerpts]

    return result


def get_signal_summary(excerpts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a summary of detected signals from excerpts.

    Args:
        excerpts: List of excerpt dicts

    Returns:
        Summary dict with counts and flags
    """
    if not excerpts:
        return {
            "has_political_signals": False,
            "has_promo_signals": False,
            "has_creator_mentions": False,
            "political_keywords": [],
            "promo_patterns": [],
            "mentioned_handles": [],
        }

    political_keywords = []
    promo_patterns = []
    mentioned_handles = []

    for exc in excerpts:
        signal_type = exc.get("signal_type")
        matched = exc.get("matched_term", "")

        if signal_type == "political":
            political_keywords.append(matched)
        elif signal_type == "promo":
            promo_patterns.append(matched)
        elif signal_type == "creator_mention":
            mentioned_handles.append(matched)

    return {
        "has_political_signals": len(political_keywords) > 0,
        "has_promo_signals": len(promo_patterns) > 0,
        "has_creator_mentions": len(mentioned_handles) > 0,
        "political_keywords": list(set(political_keywords)),
        "promo_patterns": list(set(promo_patterns)),
        "mentioned_handles": list(set(mentioned_handles)),
    }
