"""
Public Figure Signals Detector (Prompt 5)

Detects public figure signals from text, audio, visual (OCR), and metadata cues
WITHOUT identifying anyone. No face recognition. No names-to-identity guessing.

STRICT SAFETY RULES:
- No face recognition allowed
- No "this is X" claims
- No guesses - if evidence is weak or missing modalities: output unknown/low confidence
- Do NOT claim absence when coverage is insufficient
- Explicitly include "what this does not mean" boundaries

Key distinction:
- "Public figure signals present" != "Political content"
- Public figure signals may exist in non-political contexts (e.g., celebrity appearances)

Signal categories (NO IDENTITY):
- Text/audio: Public office titles (with negative-context filtering)
- Visual: OCR text for institutional cues
- Metadata: Verified badge (weak signal only)

Output structure:
{
    "present": "yes" | "no" | "unknown",
    "confidence": "low" | "medium" | "high",
    "signals_fired": [...],
    "signals_not_evaluated": [...],
    "signals_not_found": [...],
    "confidence_drivers": [...],
    "what_this_does_not_mean": [...]
}
"""

import re
from typing import Dict, Any, List, Optional, Tuple


# =============================================================================
# Lexicon Version (for audit trail)
# =============================================================================

LEXICON_VERSION = "1.0.0"


# =============================================================================
# Public Office Titles Lexicon
# =============================================================================

# NOTE: These detect TITLES, not identities. The presence of these words
# indicates possible public figure context, not identity of any individual.

PUBLIC_OFFICE_TITLES = {
    # US Federal
    "senator", "senators",
    "representative", "representatives", "rep.",
    "congressman", "congresswoman", "congressmen", "congresswomen",
    "governor", "governors",
    "president", "presidents",
    "secretary of state",
    "attorney general",
    "speaker of the house",
    "majority leader", "minority leader",

    # US State/Local
    "mayor", "mayors",
    "councilmember", "councilmembers", "council member",
    "city council",
    "county commissioner",
    "state representative", "state senator",
    "lieutenant governor",
    "district attorney",

    # International
    "prime minister", "prime ministers",
    "minister", "ministers",
    "parliament", "parliamentary",
    "mp",  # Member of Parliament
    "chancellor",
    "ambassador",

    # Generic government
    "elected official", "elected officials",
    "public official", "public officials",
    "government official", "government officials",
}

# =============================================================================
# Negative Context Filters (False Positive Prevention)
# =============================================================================

# Contexts where "president" or similar titles are NOT public figure signals
NEGATIVE_CONTEXT_PATTERNS = [
    # School/University contexts
    r"\bclass president\b",
    r"\bstudent (body )?president\b",
    r"\bstudent council\b",
    r"\bschool president\b",
    r"\buniversity president\b",  # Could be public figure, but often not political
    r"\bcollege president\b",
    r"\bsorority president\b",
    r"\bfraternity president\b",

    # Club/Organization contexts
    r"\bclub president\b",
    r"\bteam (captain|president)\b",
    r"\bsociety president\b",
    r"\bchapter president\b",
    r"\bfan club\b",

    # Business contexts (not public figures in government sense)
    r"\bvice president of (marketing|sales|engineering|operations|hr|finance|product)\b",
    r"\bvp of (marketing|sales|engineering|operations|hr|finance|product)\b",
    r"\bcompany president\b",
    r"\bceo\b",
    r"\bcfo\b",
    r"\bcoo\b",
    r"\bcto\b",
    r"\bpresident and ceo\b",
    r"\bpresident of (the )?company\b",
    r"\bpresident of (the )?board\b",
    r"\bregional president\b",
    r"\bdivision president\b",
]

NEGATIVE_CONTEXT_REGEXES = [re.compile(p, re.IGNORECASE) for p in NEGATIVE_CONTEXT_PATTERNS]


# =============================================================================
# Visual (OCR) Cue Patterns
# =============================================================================

# OCR text patterns that suggest institutional/official context
# These are PLACES and INSTITUTIONS, not identities

OCR_INSTITUTIONAL_CUES = [
    r"\boffice of the\b",
    r"\bcity hall\b",
    r"\bthe white house\b",
    r"\bcapitol\b",  # US Capitol, State Capitol
    r"\bpress briefing\b",
    r"\bpress conference\b",
    r"\bdepartment of\b",
    r"\bministry of\b",
    r"\bgovernment house\b",
    r"\bstate house\b",
    r"\bcourt house\b",
    r"\bfederal building\b",
    r"\bsenate chamber\b",
    r"\bhouse chamber\b",
    r"\bparliament house\b",
    r"\bcongress\b",
    r"\blegislature\b",
]

OCR_INSTITUTIONAL_REGEXES = [re.compile(p, re.IGNORECASE) for p in OCR_INSTITUTIONAL_CUES]


# =============================================================================
# Detection Functions
# =============================================================================

def _check_negative_context(text: str) -> bool:
    """
    Check if text contains negative context that should suppress public figure signal.

    Returns True if negative context found (should suppress signal).
    """
    text_lower = text.lower()
    for regex in NEGATIVE_CONTEXT_REGEXES:
        if regex.search(text_lower):
            return True
    return False


def _find_title_matches(text: str) -> List[Dict[str, Any]]:
    """
    Find public office title matches in text, filtering out false positives.

    Returns list of match dicts with term and context.
    """
    matches = []
    text_lower = text.lower()

    # First check if entire text has negative context
    if _check_negative_context(text_lower):
        return []

    for title in PUBLIC_OFFICE_TITLES:
        # Word boundary matching
        pattern = r"\b" + re.escape(title) + r"\b"
        for match in re.finditer(pattern, text_lower):
            # Get context window around match
            start = max(0, match.start() - 50)
            end = min(len(text_lower), match.end() + 50)
            context = text_lower[start:end]

            # Check if this specific context is negative
            if not _check_negative_context(context):
                matches.append({
                    "term": title,
                    "position": match.start(),
                    "context_snippet": text[start:end].strip(),
                })

    return matches


def detect_text_public_figure_signals(
    text_content: str,
    source: str = "text"
) -> Dict[str, Any]:
    """
    Detect public figure signals in text content.

    Args:
        text_content: The text to analyze
        source: Source type for evidence_ref ("text", "caption", "ocr")

    Returns:
        Dict with matches and confidence assessment
    """
    if not text_content:
        return {
            "detected": False,
            "matches": [],
            "confidence": "unknown",
            "reason": "no_text_content",
        }

    matches = _find_title_matches(text_content)

    if matches:
        # Multiple distinct titles = higher confidence
        unique_titles = set(m["term"] for m in matches)
        confidence = "medium" if len(unique_titles) >= 2 else "low"

        return {
            "detected": True,
            "matches": matches,
            "confidence": confidence,
            "unique_titles_count": len(unique_titles),
        }

    return {
        "detected": False,
        "matches": [],
        "confidence": "low",  # Can't claim high confidence in absence
        "reason": "no_matches",
    }


def detect_audio_public_figure_signals(
    transcript: str,
    segments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Detect public figure signals in audio transcript.

    Args:
        transcript: Full transcript text
        segments: Optional list of segment dicts with start_ms, end_ms, text

    Returns:
        Dict with matches, excerpts, and confidence assessment
    """
    if not transcript:
        return {
            "detected": False,
            "matches": [],
            "excerpts": [],
            "confidence": "unknown",
            "reason": "no_transcript",
        }

    # Overall transcript analysis
    matches = _find_title_matches(transcript)

    # Segment-level excerpts if available
    excerpts = []
    if segments and matches:
        for segment in segments:
            segment_text = segment.get("text", "")
            segment_matches = _find_title_matches(segment_text)

            if segment_matches:
                excerpts.append({
                    "start_ms": segment.get("start_ms", 0),
                    "end_ms": segment.get("end_ms", 0),
                    "text": segment_text[:200],
                    "signal_type": "public_figure_title",
                    "matched_terms": [m["term"] for m in segment_matches],
                })

                if len(excerpts) >= 5:  # Cap excerpts
                    break

    if matches:
        unique_titles = set(m["term"] for m in matches)
        # Audio matches with segment timestamps = higher confidence
        confidence = "medium" if (len(unique_titles) >= 2 or excerpts) else "low"

        return {
            "detected": True,
            "matches": matches,
            "excerpts": excerpts,
            "confidence": confidence,
            "unique_titles_count": len(unique_titles),
        }

    return {
        "detected": False,
        "matches": [],
        "excerpts": [],
        "confidence": "low",
        "reason": "no_matches",
    }


def detect_ocr_institutional_cues(
    ocr_text: str
) -> Dict[str, Any]:
    """
    Detect institutional/official visual cues in OCR text.

    Args:
        ocr_text: OCR-extracted text from video frames

    Returns:
        Dict with detected cues and confidence
    """
    if not ocr_text:
        return {
            "detected": False,
            "cues": [],
            "confidence": "unknown",
            "reason": "no_ocr_text",
        }

    ocr_lower = ocr_text.lower()
    detected_cues = []

    for regex in OCR_INSTITUTIONAL_REGEXES:
        match = regex.search(ocr_lower)
        if match:
            detected_cues.append({
                "pattern": match.group(0),
                "position": match.start(),
            })

    # Also check for title matches in OCR
    title_matches = _find_title_matches(ocr_text)

    if detected_cues or title_matches:
        # Institutional cues from OCR are strong signals
        confidence = "medium" if (len(detected_cues) >= 2 or title_matches) else "low"

        return {
            "detected": True,
            "cues": detected_cues,
            "title_matches": title_matches,
            "confidence": confidence,
        }

    return {
        "detected": False,
        "cues": [],
        "confidence": "low",
        "reason": "no_matches",
    }


def detect_metadata_verified_signal(
    metadata_features: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Detect verified badge in metadata (weak signal).

    IMPORTANT: Verified badge alone is NEVER sufficient for high confidence.
    It's a weak supporting signal only.

    Args:
        metadata_features: Metadata features dict with account info

    Returns:
        Dict with verification status and caveats
    """
    if not metadata_features:
        return {
            "detected": False,
            "is_verified": None,
            "confidence": "unknown",
            "reason": "no_metadata",
        }

    account = metadata_features.get("account") or {}
    is_verified = account.get("is_verified")

    if is_verified is None:
        return {
            "detected": False,
            "is_verified": None,
            "confidence": "unknown",
            "reason": "verification_status_unknown",
        }

    if is_verified:
        return {
            "detected": True,
            "is_verified": True,
            "confidence": "low",  # ALWAYS low - verified badge is not enough alone
            "caveat": "Verified badge indicates platform-verified account but does not identify public figures.",
        }

    return {
        "detected": False,
        "is_verified": False,
        "confidence": "low",
        "reason": "not_verified",
    }


# =============================================================================
# Main Detection Function
# =============================================================================

def detect_public_figure_signals(
    text_content: Optional[str] = None,
    transcript: Optional[str] = None,
    transcript_segments: Optional[List[Dict[str, Any]]] = None,
    ocr_text: Optional[str] = None,
    metadata_features: Optional[Dict[str, Any]] = None,
    coverage_status: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Detect public figure signals from all available modalities.

    SAFETY BOUNDARIES ENFORCED:
    - No face recognition
    - No identity claims
    - Weak signals remain weak
    - Missing modalities are explicitly noted

    Args:
        text_content: Caption/post text
        transcript: Audio transcript
        transcript_segments: Audio segments with timestamps
        ocr_text: OCR-extracted text from video
        metadata_features: Metadata dict with account info
        coverage_status: Coverage info for modality availability

    Returns:
        Structured result with signals and boundaries
    """
    signals_fired = []
    signals_not_evaluated = []
    signals_not_found = []
    confidence_drivers = []

    # Track which modalities were available
    text_available = bool(text_content)
    audio_available = bool(transcript)
    ocr_available = bool(ocr_text)
    metadata_available = bool(metadata_features and metadata_features.get("account"))

    # Use coverage_status if provided for more accurate availability
    if coverage_status:
        audio_analyzed = coverage_status.get("audio_analyzed", audio_available)
        ocr_sufficient = coverage_status.get("ocr_coverage_sufficient", ocr_available)
    else:
        audio_analyzed = audio_available
        ocr_sufficient = ocr_available

    # ---------------------------------------------------------------------
    # Text Detection
    # ---------------------------------------------------------------------
    if text_available:
        text_result = detect_text_public_figure_signals(text_content, "text")

        if text_result["detected"]:
            for match in text_result.get("matches", [])[:3]:  # Cap at 3
                signals_fired.append({
                    "id": f"public_figure_text_{match['term'].replace(' ', '_')}",
                    "label": f"Public office title in text: '{match['term']}'",
                    "why": f"The term '{match['term']}' was found in the text content.",
                    "evidence_ref": ["text_content"],
                    "modality": "text",
                    "snippet": match.get("context_snippet", ""),
                })

            if text_result.get("unique_titles_count", 0) >= 2:
                confidence_drivers.append({
                    "direction": "up",
                    "label": "Multiple title references",
                    "detail": f"{text_result['unique_titles_count']} distinct public office titles found in text.",
                })
        else:
            signals_not_found.append({
                "id": "public_figure_text",
                "label": "Public office titles in text",
                "why": "No public office title keywords were detected in the text content.",
                "evidence_ref": ["text_content"],
                "modality": "text",
            })
    else:
        signals_not_evaluated.append({
            "id": "public_figure_text",
            "label": "Public office titles in text",
            "why": "Text content was not available for analysis.",
            "evidence_ref": [],
            "modality": "text",
        })

    # ---------------------------------------------------------------------
    # Audio Detection
    # ---------------------------------------------------------------------
    if audio_analyzed and transcript:
        audio_result = detect_audio_public_figure_signals(transcript, transcript_segments)

        if audio_result["detected"]:
            for excerpt in audio_result.get("excerpts", [])[:2]:  # Cap at 2
                signals_fired.append({
                    "id": f"public_figure_audio_{excerpt['start_ms']}",
                    "label": "Public office title mentioned in audio",
                    "why": f"Terms like '{', '.join(excerpt['matched_terms'])}' were spoken.",
                    "evidence_ref": ["audio_transcript"],
                    "modality": "audio",
                    "snippet": excerpt.get("text", ""),
                    "timestamp_ms": excerpt.get("start_ms"),
                })

            confidence_drivers.append({
                "direction": "up",
                "label": "Audio confirmation",
                "detail": "Public figure signals were detected in spoken content.",
            })
        else:
            signals_not_found.append({
                "id": "public_figure_audio",
                "label": "Public office titles in audio",
                "why": "No public office title keywords were detected in the audio transcript.",
                "evidence_ref": ["audio_transcript"],
                "modality": "audio",
            })
    elif not audio_analyzed:
        signals_not_evaluated.append({
            "id": "public_figure_audio",
            "label": "Public office titles in audio",
            "why": "Audio was not analyzed for this scan.",
            "evidence_ref": [],
            "modality": "audio",
        })

    # ---------------------------------------------------------------------
    # OCR (Visual) Detection
    # ---------------------------------------------------------------------
    if ocr_sufficient and ocr_text:
        ocr_result = detect_ocr_institutional_cues(ocr_text)

        if ocr_result["detected"]:
            cue_labels = [c["pattern"] for c in ocr_result.get("cues", [])][:3]
            title_labels = [m["term"] for m in ocr_result.get("title_matches", [])][:2]
            combined_labels = cue_labels + title_labels

            if combined_labels:
                signals_fired.append({
                    "id": "public_figure_ocr",
                    "label": "Institutional visual cues on screen",
                    "why": f"Visual text included: {', '.join(combined_labels[:3])}.",
                    "evidence_ref": ["ocr_text", "vision_features"],
                    "modality": "visual",
                })

            confidence_drivers.append({
                "direction": "up",
                "label": "Visual institutional cues",
                "detail": "On-screen text showed institutional or official context.",
            })
        else:
            signals_not_found.append({
                "id": "public_figure_ocr",
                "label": "Institutional visual cues",
                "why": "No institutional visual cues (e.g., 'Office of the...', 'Capitol') were detected in on-screen text.",
                "evidence_ref": ["ocr_text"],
                "modality": "visual",
            })
    elif not ocr_available:
        signals_not_evaluated.append({
            "id": "public_figure_ocr",
            "label": "Institutional visual cues",
            "why": "On-screen text (OCR) was not available for analysis.",
            "evidence_ref": [],
            "modality": "visual",
        })
    elif not ocr_sufficient and coverage_status:
        ocr_pct = coverage_status.get("ocr_coverage_percent", 0)
        signals_not_evaluated.append({
            "id": "public_figure_ocr",
            "label": "Institutional visual cues",
            "why": f"On-screen text coverage was limited ({ocr_pct:.0f}%). Visual cues may have been missed.",
            "evidence_ref": [],
            "modality": "visual",
        })

    # ---------------------------------------------------------------------
    # Metadata (Verified Badge) Detection
    # ---------------------------------------------------------------------
    if metadata_available:
        meta_result = detect_metadata_verified_signal(metadata_features)

        if meta_result["detected"]:
            signals_fired.append({
                "id": "public_figure_verified",
                "label": "Verified account badge present",
                "why": "The account has a platform-verified badge. Note: This does not confirm public figure status.",
                "evidence_ref": ["metadata_features.account.is_verified"],
                "modality": "metadata",
            })

            # Verified badge is weak - note it explicitly
            confidence_drivers.append({
                "direction": "up",
                "label": "Verified account",
                "detail": "Account has verification badge, but this alone does not indicate public figure status.",
            })
        elif meta_result.get("is_verified") is False:
            signals_not_found.append({
                "id": "public_figure_verified",
                "label": "Verified account badge",
                "why": "The account does not have a verified badge.",
                "evidence_ref": ["metadata_features.account.is_verified"],
                "modality": "metadata",
            })
    else:
        signals_not_evaluated.append({
            "id": "public_figure_verified",
            "label": "Account verification status",
            "why": "Account metadata was not available for analysis.",
            "evidence_ref": [],
            "modality": "metadata",
        })

    # ---------------------------------------------------------------------
    # Compute Overall Result
    # ---------------------------------------------------------------------
    n_signals_fired = len(signals_fired)
    n_not_evaluated = len(signals_not_evaluated)

    # Determine presence
    if n_signals_fired > 0:
        present = "yes"
    elif n_not_evaluated >= 2:
        # Too many missing modalities to claim absence
        present = "unknown"
    else:
        present = "no"

    # Determine confidence
    if n_signals_fired >= 3:
        confidence = "high"
    elif n_signals_fired >= 2:
        confidence = "medium"
    elif n_signals_fired == 1:
        # Single signal = low confidence (could be false positive)
        confidence = "low"
    elif n_not_evaluated >= 2:
        confidence = "unknown"
    else:
        confidence = "low"

    # Downgrade confidence if coverage is poor
    if coverage_status:
        if not coverage_status.get("audio_analyzed") and not coverage_status.get("ocr_coverage_sufficient"):
            if confidence == "high":
                confidence = "medium"
            confidence_drivers.append({
                "direction": "down",
                "label": "Limited modality coverage",
                "detail": "Neither audio nor adequate visual text was available. Some signals may have been missed.",
            })

    # If signals found but all are metadata-only (verified badge), keep confidence low
    if n_signals_fired == 1 and signals_fired[0].get("id") == "public_figure_verified":
        confidence = "low"
        confidence_drivers.append({
            "direction": "down",
            "label": "Weak signal only",
            "detail": "Only a verified badge was detected, which alone does not indicate public figure presence.",
        })

    # ---------------------------------------------------------------------
    # Epistemic Boundaries (CRITICAL)
    # ---------------------------------------------------------------------
    what_this_does_not_mean = [
        "This does not identify any specific individual.",
        "This does not mean the content is political or partisan.",
        "This does not mean the person shown is a politician.",
        "We are not using face recognition to identify anyone.",
        "Presence of public office titles does not confirm who is speaking or shown.",
        "A verified badge does not indicate government or public official status.",
    ]

    # Add coverage-specific boundaries
    if n_not_evaluated > 0:
        what_this_does_not_mean.append(
            f"Some signal types ({n_not_evaluated}) could not be checked due to missing data."
        )

    return {
        "present": present,
        "confidence": confidence,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "lexicon_version": LEXICON_VERSION,
        "modality_coverage": {
            "text_available": text_available,
            "audio_analyzed": audio_analyzed,
            "ocr_available": ocr_available,
            "metadata_available": metadata_available,
        },
    }


# =============================================================================
# Batch Processing for Scan Items
# =============================================================================

def detect_public_figure_signals_for_scan(
    feature_collection: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Detect public figure signals across all items in a scan.

    Aggregates signals from individual items and produces a scan-level summary.

    Args:
        feature_collection: FeatureBundleCollection from feature_bundle.py
        feed_items: List of feed item dicts

    Returns:
        Scan-level public figure signals result
    """
    from text_signals import extract_text_signals

    # Get coverage status
    coverage = feature_collection.get("coverage", {})
    audio_coverage = coverage.get("audio", {})
    vision_coverage = coverage.get("vision", {})

    coverage_status = {
        "audio_analyzed": audio_coverage.get("audio_analyzed", False),
        "ocr_coverage_percent": vision_coverage.get("ocr_coverage_percent", 0),
        "ocr_coverage_sufficient": vision_coverage.get("ocr_coverage_percent", 0) >= 60,
    }

    # Aggregate text and OCR from all items
    all_text = []
    all_ocr = []

    items = feature_collection.get("items", [])
    for fb in items:
        # Get text
        text_features = fb.get("text_features", {})
        content_text = text_features.get("content_text", "")
        if content_text:
            all_text.append(content_text)

        # Get OCR
        vision_features = fb.get("vision_features", {})
        if vision_features.get("ocr_text_available"):
            ocr_text = vision_features.get("ocr_text", "")
            if ocr_text:
                all_ocr.append(ocr_text)

    # Get audio transcript (scan-level)
    audio = coverage.get("audio", {})
    transcript = None
    segments = None
    if audio.get("audio_analyzed"):
        # Audio transcript is at scan level
        if feed_items and len(feed_items) > 0:
            first_item = feed_items[0]
            audio_features = first_item.get("audio_features", {})
            if audio_features:
                transcript = audio_features.get("transcript_text", "")
                segments = audio_features.get("segments", [])

    # Get metadata from first item (representative)
    metadata_features = None
    if items and len(items) > 0:
        metadata_features = items[0].get("metadata_features")

    # Combine text
    combined_text = " ".join(all_text) if all_text else None
    combined_ocr = " ".join(all_ocr) if all_ocr else None

    # Run detection
    result = detect_public_figure_signals(
        text_content=combined_text,
        transcript=transcript,
        transcript_segments=segments,
        ocr_text=combined_ocr,
        metadata_features=metadata_features,
        coverage_status=coverage_status,
    )

    # Add scan-level stats
    result["scan_stats"] = {
        "items_with_text": len(all_text),
        "items_with_ocr": len(all_ocr),
        "audio_available": bool(transcript),
    }

    return result
