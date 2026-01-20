"""
Deterministic Promotion Signal Extraction for Feed Items

This module extracts promotional signals from feed item text content
using deterministic pattern matching. No LLM calls, no speculation.

Signal Types (deterministic):
    - sponsorship_word: "ad", "sponsored", "paid partnership", "partner", "promo"
    - discount_code: "% off", "use code", "code XYZ"
    - affiliate_link: "link in bio", "linktr.ee", "bit.ly", "shop", "amazon", "ltk"
    - price_mention: $xx.xx patterns
    - cta_verb: "buy", "shop", "order", "subscribe", "sign up" near brand/domain

Confidence Rules:
    - HIGH: Multiple strong signals (2+) OR one very strong signal (paid partnership label)
    - MEDIUM: Single strong signal OR multiple weak signals
    - LOW: Single weak signal

Returns per item:
    - signals[]: List of {type, evidence_substring, source}
    - confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE"
    - is_unlabeled_promo: bool (True only for HIGH confidence)
"""

import re
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum
from text_signals import extract_text_signals


class PromoConfidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class SignalType(str, Enum):
    SPONSORSHIP_WORD = "sponsorship_word"
    DISCOUNT_CODE = "discount_code"
    AFFILIATE_LINK = "affiliate_link"
    PRICE_MENTION = "price_mention"
    CTA_VERB = "cta_verb"
    PARTNERSHIP_LABEL = "partnership_label"


@dataclass
class PromoSignal:
    """A single promotional signal detection."""
    signal_type: SignalType
    evidence_substring: str
    source: str  # which text field it came from
    strength: str  # "strong" or "weak"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.signal_type.value,
            "evidence": self.evidence_substring,
            "source": self.source,
            "strength": self.strength,
        }


@dataclass
class PromoExtractionResult:
    """Result of promo signal extraction for a single feed item."""
    signals: List[PromoSignal] = field(default_factory=list)
    confidence: PromoConfidence = PromoConfidence.NONE
    is_unlabeled_promo: bool = False
    text_available: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signals": [s.to_dict() for s in self.signals],
            "confidence": self.confidence.value,
            "is_unlabeled_promo": self.is_unlabeled_promo,
            "text_available": self.text_available,
            "signal_count": len(self.signals),
            "signal_types": list(set(s.signal_type.value for s in self.signals)),
        }


# =============================================================================
# STRONG Signal Patterns (HIGH confidence contributors)
# =============================================================================

# Very strong: explicit partnership disclosure (HIGH confidence alone)
PARTNERSHIP_PATTERNS = [
    (r"paid\s*partnership", "partnership_label"),
    (r"paid\s*promotion", "partnership_label"),
    (r"sponsored\s*content", "partnership_label"),
    (r"#ad\b", "partnership_label"),
    (r"#sponsored\b", "partnership_label"),
    (r"#paidpartnership", "partnership_label"),
    (r"#partner\b", "partnership_label"),
    (r"#gifted\b", "partnership_label"),
]

# Strong: discount/referral codes
DISCOUNT_CODE_PATTERNS = [
    (r"use\s+(my\s+)?code\b", "discount_code"),
    (r"my\s+code\b", "discount_code"),
    (r"promo\s+code\b", "discount_code"),
    (r"discount\s+code\b", "discount_code"),
    (r"coupon\s+code\b", "discount_code"),
    (r"code\s*[:\-]?\s*[A-Z0-9]{3,15}\b", "discount_code"),
    (r"\d+%?\s*off\s+with\s+(code|my)", "discount_code"),
    (r"(save|get)\s+\d+%?\s+(with|using)\s+(code|my)", "discount_code"),
]

# Strong: affiliate/commerce links
AFFILIATE_LINK_PATTERNS = [
    (r"link\s+in\s+(my\s+)?bio\b", "affiliate_link"),
    (r"linktr\.ee", "affiliate_link"),
    (r"bit\.ly", "affiliate_link"),
    (r"amazon\.to", "affiliate_link"),
    (r"amzn\.to", "affiliate_link"),
    (r"ltk\.app", "affiliate_link"),
    (r"shopmy\.app", "affiliate_link"),
    (r"affiliate\s+link", "affiliate_link"),
    (r"shop\s+now\b", "affiliate_link"),
    (r"swipe\s+up\b", "affiliate_link"),
    (r"tap\s+(the\s+)?link\b", "affiliate_link"),
]

# Strong: partnership language
PARTNERSHIP_LANG_PATTERNS = [
    (r"partnered\s+with\b", "sponsorship_word"),
    (r"in\s+partnership\s+with\b", "sponsorship_word"),
    (r"working\s+with\b", "sponsorship_word"),
    (r"thanks\s+to\b", "sponsorship_word"),
    (r"brand\s+partner\b", "sponsorship_word"),
    (r"#collab\b", "sponsorship_word"),
]

# Strong: influencer-specific promotional patterns
INFLUENCER_PROMO_PATTERNS = [
    # Gifted/PR content
    (r"sent\s+me\b", "sponsorship_word"),
    (r"they\s+sent\b", "sponsorship_word"),
    (r"gifted\s+(by|from)\b", "sponsorship_word"),
    (r"pr\s+package\b", "sponsorship_word"),
    (r"pr\s+haul\b", "sponsorship_word"),
    (r"unboxing\b", "sponsorship_word"),
    (r"brand\s+deal\b", "sponsorship_word"),
    (r"brand\s+trip\b", "sponsorship_word"),
    # Affiliate disclosures
    (r"affiliate\s+link\b", "affiliate_link"),
    (r"affiliate\s+code\b", "affiliate_link"),
    (r"i\s+(may\s+)?earn\s+(a\s+)?(small\s+)?commission\b", "affiliate_link"),
    (r"commission\s+if\s+you\b", "affiliate_link"),
    (r"at\s+no\s+extra\s+cost\b", "affiliate_link"),  # common FTC disclosure
    # Brand ambassador signals
    (r"brand\s+ambassador\b", "sponsorship_word"),
    (r"ambassador\s+for\b", "sponsorship_word"),
    (r"rep(ping)?\s+for\b", "sponsorship_word"),
    (r"proud\s+to\s+partner\b", "sponsorship_word"),
    # Product placement signals
    (r"obsessed\s+with\s+this\b", "cta_verb"),  # common paid promotion phrase
    (r"you\s+need\s+this\b", "cta_verb"),
    (r"game\s+changer\b", "cta_verb"),
    (r"holy\s+grail\b", "cta_verb"),
    # Discount/referral language
    (r"exclusive\s+discount\b", "discount_code"),
    (r"special\s+discount\b", "discount_code"),
    (r"save\s+\d+\b", "discount_code"),
    (r"my\s+link\b", "affiliate_link"),
    (r"my\s+affiliate\b", "affiliate_link"),
]

# =============================================================================
# MEDIUM Signal Patterns (contribute to HIGH when combined)
# =============================================================================

# Price mentions
PRICE_PATTERNS = [
    (r"\$\d+(\.\d{2})?", "price_mention"),
    (r"\d+%\s*off\b", "price_mention"),
    (r"on\s+sale\b", "price_mention"),
    (r"best\s+deal\b", "price_mention"),
    (r"limited\s+time\b", "price_mention"),
    (r"flash\s+sale\b", "price_mention"),
    (r"exclusive\s+offer\b", "price_mention"),
]

# CTA verbs (weaker signal)
CTA_PATTERNS = [
    (r"\bbuy\s+(now|this|it|yours)\b", "cta_verb"),
    (r"\bshop\s+(now|this|here)\b", "cta_verb"),
    (r"\border\s+(now|yours|today)\b", "cta_verb"),
    (r"\bsubscribe\b", "cta_verb"),
    (r"\bsign\s+up\b", "cta_verb"),
    (r"\bget\s+yours\b", "cta_verb"),
    (r"\bfree\s+trial\b", "cta_verb"),
    (r"\bclick\s+(the\s+)?link\b", "cta_verb"),
    (r"\bcheck\s+(it\s+)?out\b", "cta_verb"),
]

# Compile all patterns
STRONG_PATTERNS = []
for pattern, signal_type in PARTNERSHIP_PATTERNS:
    STRONG_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "very_strong"))
for pattern, signal_type in DISCOUNT_CODE_PATTERNS:
    STRONG_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "strong"))
for pattern, signal_type in AFFILIATE_LINK_PATTERNS:
    STRONG_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "strong"))
for pattern, signal_type in PARTNERSHIP_LANG_PATTERNS:
    STRONG_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "strong"))
for pattern, signal_type in INFLUENCER_PROMO_PATTERNS:
    STRONG_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "strong"))

MEDIUM_PATTERNS = []
for pattern, signal_type in PRICE_PATTERNS:
    MEDIUM_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "medium"))
for pattern, signal_type in CTA_PATTERNS:
    MEDIUM_PATTERNS.append((re.compile(pattern, re.IGNORECASE), signal_type, "weak"))


def extract_promo_signals(feed_item: Dict[str, Any]) -> PromoExtractionResult:
    """
    Extract promotional signals from a feed item.

    Uses text_signals.py for canonical text extraction, then applies
    deterministic pattern matching to identify promotional content.

    Args:
        feed_item: A feed item dict from the scan result

    Returns:
        PromoExtractionResult with signals, confidence, and flags
    """
    result = PromoExtractionResult()

    # Get canonical text using text_signals utility
    text_result = extract_text_signals(feed_item)
    content_text = text_result["content_text"]
    sources = text_result["sources"]

    if not content_text:
        result.text_available = False
        return result

    result.text_available = True
    signals: List[PromoSignal] = []

    # Determine primary source for attribution
    primary_source = sources[0] if sources else "unknown"

    # Check strong patterns
    very_strong_count = 0
    strong_count = 0

    for pattern, signal_type, strength in STRONG_PATTERNS:
        matches = pattern.findall(content_text)
        if matches:
            # Get evidence substring (first match, max 50 chars with context)
            match = pattern.search(content_text)
            if match:
                start = max(0, match.start() - 10)
                end = min(len(content_text), match.end() + 10)
                evidence = content_text[start:end].strip()

                signal = PromoSignal(
                    signal_type=SignalType(signal_type),
                    evidence_substring=evidence[:60],  # Truncate for display
                    source=primary_source,
                    strength=strength,
                )
                signals.append(signal)

                if strength == "very_strong":
                    very_strong_count += 1
                elif strength == "strong":
                    strong_count += 1

    # Check medium/weak patterns
    medium_count = 0
    weak_count = 0

    for pattern, signal_type, strength in MEDIUM_PATTERNS:
        matches = pattern.findall(content_text)
        if matches:
            match = pattern.search(content_text)
            if match:
                start = max(0, match.start() - 10)
                end = min(len(content_text), match.end() + 10)
                evidence = content_text[start:end].strip()

                signal = PromoSignal(
                    signal_type=SignalType(signal_type),
                    evidence_substring=evidence[:60],
                    source=primary_source,
                    strength=strength,
                )
                signals.append(signal)

                if strength == "medium":
                    medium_count += 1
                elif strength == "weak":
                    weak_count += 1

    result.signals = signals

    # Determine confidence level
    # HIGH: very_strong (1+) OR strong (2+) OR strong (1+) + medium (2+)
    # MEDIUM: strong (1) OR medium (2+) OR weak (3+)
    # LOW: medium (1) OR weak (1-2)
    # NONE: no signals

    if very_strong_count >= 1:
        result.confidence = PromoConfidence.HIGH
    elif strong_count >= 2:
        result.confidence = PromoConfidence.HIGH
    elif strong_count >= 1 and medium_count >= 2:
        result.confidence = PromoConfidence.HIGH
    elif strong_count >= 1:
        result.confidence = PromoConfidence.MEDIUM
    elif medium_count >= 2:
        result.confidence = PromoConfidence.MEDIUM
    elif weak_count >= 3:
        result.confidence = PromoConfidence.MEDIUM
    elif medium_count >= 1:
        result.confidence = PromoConfidence.LOW
    elif weak_count >= 1:
        result.confidence = PromoConfidence.LOW
    else:
        result.confidence = PromoConfidence.NONE

    # Only flag as unlabeled promo at HIGH confidence
    result.is_unlabeled_promo = result.confidence == PromoConfidence.HIGH

    return result


def batch_extract_promo_signals(feed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extract promo signals from all feed items with aggregate stats.

    Args:
        feed_items: List of feed item dicts

    Returns:
        Dict with extractions and summary statistics
    """
    extractions = []
    n_high = 0
    n_medium = 0
    n_low = 0
    n_unlabeled_promo = 0
    n_with_text = 0
    signal_type_counts: Dict[str, int] = {}

    for item in feed_items:
        result = extract_promo_signals(item)
        extractions.append(result.to_dict())

        if result.text_available:
            n_with_text += 1

        if result.confidence == PromoConfidence.HIGH:
            n_high += 1
        elif result.confidence == PromoConfidence.MEDIUM:
            n_medium += 1
        elif result.confidence == PromoConfidence.LOW:
            n_low += 1

        if result.is_unlabeled_promo:
            n_unlabeled_promo += 1

        for signal in result.signals:
            signal_type_counts[signal.signal_type.value] = \
                signal_type_counts.get(signal.signal_type.value, 0) + 1

    n_total = len(feed_items)
    return {
        "extractions": extractions,
        "summary": {
            "n_total": n_total,
            "n_with_text": n_with_text,
            "n_high_confidence": n_high,
            "n_medium_confidence": n_medium,
            "n_low_confidence": n_low,
            "n_unlabeled_promo": n_unlabeled_promo,
            "unlabeled_promo_percent": round(n_unlabeled_promo / n_total * 100, 1) if n_total > 0 else 0,
            "signal_type_counts": signal_type_counts,
        }
    }


def get_promo_evidence_summary(result: PromoExtractionResult) -> List[str]:
    """
    Get a list of evidence snippets for an item flagged as promotional.

    Args:
        result: PromoExtractionResult from extraction

    Returns:
        List of evidence snippet strings for display
    """
    if not result.signals:
        return []

    snippets = []
    seen_evidence = set()

    for signal in result.signals:
        if signal.evidence_substring not in seen_evidence:
            snippet = f"[{signal.signal_type.value}] \"{signal.evidence_substring}\""
            snippets.append(snippet)
            seen_evidence.add(signal.evidence_substring)

    return snippets[:5]  # Max 5 evidence snippets
