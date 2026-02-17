"""
Analysis pipeline bridge.

Takes captured data (in common schema), normalizes it to UnifiedScanResult,
runs through the AlgorithmLens analysis pipeline, and generates evidence bundles.

This is the glue between capture and grading.
"""

from __future__ import annotations

import sys
import os
import json
import logging
import importlib
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from ..common.schema import CaptureSnapshot

logger = logging.getLogger(__name__)

# Add backend to path so we can import AlgorithmLens modules
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def run_analysis(
    snapshot: CaptureSnapshot,
    normalize_fn,
) -> Tuple[Dict[str, Any], bool, str]:
    """
    Run the full AlgorithmLens analysis pipeline on captured data.

    Args:
        snapshot: The captured ground truth data
        normalize_fn: Platform-specific function to convert snapshot → UnifiedScanResult dict

    Returns:
        Tuple of (analysis_result, success, reason)
    """
    # Step 1: Normalize capture to UnifiedScanResult format
    scan_result = normalize_fn(snapshot)
    logger.info(f"Normalized {len(snapshot.posts)} posts to UnifiedScanResult")

    # Step 2: Run Gemini analysis
    try:
        from gemini_analyzer import analyze_scan
        scan_result, success, reason = analyze_scan(scan_result)
        if not success:
            logger.warning(f"Gemini analysis did not complete: {reason}")
            return scan_result, False, f"gemini_{reason}"
        logger.info("Gemini analysis complete")
    except ImportError as e:
        logger.error(f"Could not import gemini_analyzer: {e}")
        return scan_result, False, "import_error"
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        return scan_result, False, f"gemini_error: {str(e)}"

    return scan_result, True, "success"


def build_evidence_bundles(
    scan_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate all six evidence bundles from an analyzed scan result.

    Returns:
        Dict mapping tab name → evidence bundle dict
    """
    bundles: Dict[str, Any] = {}

    # Import each evidence bundle builder
    bundle_builders = {
        "ads": ("evidence_bundle", "build_ads_evidence_bundle"),
        "politics": ("politics_evidence_bundle", "build_politics_evidence_bundle"),
        "patterns": ("patterns_evidence_bundle", "build_patterns_evidence_bundle"),
        "sources": ("creators_evidence_bundle", "build_creators_evidence_bundle"),
        "tone": ("evidence_bundle", "build_ads_evidence_bundle"),  # Tone uses wellbeing from scan
        "suggested-vs-followed": ("inferences_evidence_bundle", "build_inferences_evidence_bundle"),
    }

    for tab_name, (module_name, fn_name) in bundle_builders.items():
        try:
            module = importlib.import_module(module_name)
            build_fn = getattr(module, fn_name)
            bundle = build_fn(scan_result)
            bundles[tab_name] = bundle
            logger.info(f"Built evidence bundle for '{tab_name}'")
        except ImportError as e:
            logger.warning(f"Could not import {module_name}: {e}")
            bundles[tab_name] = {"_status": "ERROR", "_error": f"Import error: {e}"}
        except Exception as e:
            logger.warning(f"Error building {tab_name} bundle: {e}")
            bundles[tab_name] = {"_status": "ERROR", "_error": str(e)}

    # Build tone bundle from wellbeing data in the scan result
    try:
        bundles["tone"] = _build_tone_bundle(scan_result)
    except Exception as e:
        bundles["tone"] = {"_status": "ERROR", "_error": str(e)}

    return bundles


def _build_tone_bundle(scan_result: Dict[str, Any]) -> Dict[str, Any]:
    """Build a simple tone/wellbeing evidence bundle from scan aggregates."""
    aggregates = scan_result.get("aggregates", {})
    wellbeing = aggregates.get("wellbeing_summary", {})
    valence = wellbeing.get("valence_distribution", {})

    feed_items = scan_result.get("feed_items", [])
    theme_counts: Dict[str, int] = {}
    for item in feed_items:
        themes = item.get("wellbeing", {}).get("themes", [])
        for theme in themes:
            theme_counts[theme] = theme_counts.get(theme, 0) + 1

    return {
        "meta": {
            "scan_id": scan_result.get("scan_metadata", {}).get("scan_id"),
            "platform": scan_result.get("scan_metadata", {}).get("platform"),
            "n_items": len(feed_items),
            "generated_at": None,
        },
        "observations": {
            "valence_distribution": valence,
            "theme_counts": theme_counts,
            "high_relevance_items": wellbeing.get("high_relevance_items", 0),
        },
        "measurements": {
            "themes": theme_counts,
        },
        "limits": {
            "description": "Tone analysis reflects observable content themes, not user emotional state.",
        },
    }


def save_outputs(
    snapshot: CaptureSnapshot,
    analysis_result: Dict[str, Any],
    evidence_bundles: Dict[str, Any],
    output_dir: Path,
) -> Dict[str, str]:
    """
    Save all eval outputs to disk.

    Returns:
        Dict of output type → file path
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {}

    # Save snapshot (ground truth)
    snapshot_path = output_dir / "ground_truth.json"
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(snapshot.model_dump(), f, indent=2, default=str)
    paths["snapshot"] = str(snapshot_path)

    # Save analysis result
    analysis_path = output_dir / "analysis_result.json"
    with open(analysis_path, "w", encoding="utf-8") as f:
        json.dump(analysis_result, f, indent=2, default=str)
    paths["analysis"] = str(analysis_path)

    # Save evidence bundles
    bundles_path = output_dir / "evidence_bundles.json"
    with open(bundles_path, "w", encoding="utf-8") as f:
        json.dump(evidence_bundles, f, indent=2, default=str)
    paths["bundles"] = str(bundles_path)

    return paths
