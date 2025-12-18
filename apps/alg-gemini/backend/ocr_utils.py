"""
OCR Utilities for Mobile Video Processing

This module provides image preprocessing for improved OCR accuracy on mobile
video frames, especially for detecting small UI labels like "Ad", "Sponsored", etc.

Debug Mode:
    Set ALGO_OCR_DEBUG=1 environment variable to enable debug output.
    When enabled:
    - Saves preprocessed frames to backend/ocr_debug/
    - Logs OCR summary statistics (frames processed, non-empty results, etc.)

Usage:
    from ocr_utils import preprocess_frame_for_ocr, extract_text_with_preprocessing, OCRDebugger
"""

import cv2
import numpy as np
from PIL import Image
import pytesseract
import os
import re
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any

# Debug mode controlled by environment variable
OCR_DEBUG_ENABLED = os.environ.get("ALGO_OCR_DEBUG", "").lower() in ("1", "true", "yes")
OCR_DEBUG_DIR = os.path.join(os.path.dirname(__file__), "ocr_debug")

# Common ad disclosure tokens (case-insensitive)
AD_DISCLOSURE_TOKENS = [
    r"\bad\b",           # standalone "ad"
    r"sponsored",
    r"promoted",
    r"advertisement",
    r"paid\s*partnership",
    r"paid\s*promotion",
    r"#ad\b",
    r"#sponsored",
]

# Compile regex patterns for ad detection
AD_DISCLOSURE_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in AD_DISCLOSURE_TOKENS]


def preprocess_frame_for_ocr(
    frame: np.ndarray,
    scale_factor: float = 2.0,
    use_adaptive_threshold: bool = True
) -> np.ndarray:
    """
    Apply image preprocessing to improve OCR accuracy for mobile video frames.

    Pipeline:
    1. Convert to grayscale
    2. Upscale (2x by default) to help with small text
    3. Apply contrast enhancement (CLAHE)
    4. Apply thresholding (Otsu or adaptive)

    Args:
        frame: Input BGR frame from OpenCV
        scale_factor: Upscaling factor (default 2.0 for small text)
        use_adaptive_threshold: Use adaptive thresholding (better for varied backgrounds)

    Returns:
        Preprocessed grayscale image ready for OCR
    """
    # 1. Convert to grayscale
    if len(frame.shape) == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    else:
        gray = frame.copy()

    # 2. Upscale for small text (especially ad labels)
    if scale_factor > 1.0:
        height, width = gray.shape[:2]
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)

    # 3. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    # This improves contrast locally, helping with varied lighting
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # 4. Apply thresholding
    if use_adaptive_threshold:
        # Adaptive thresholding works better for UI elements with varied backgrounds
        processed = cv2.adaptiveThreshold(
            enhanced,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,  # Neighborhood size
            C=2            # Constant subtracted from mean
        )
    else:
        # Otsu's method for automatic threshold selection
        _, processed = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return processed


def extract_text_with_preprocessing(
    frame: np.ndarray,
    scale_factor: float = 2.0,
    use_adaptive_threshold: bool = True,
    tesseract_config: str = "--psm 11 --oem 3"
) -> Tuple[str, np.ndarray]:
    """
    Extract text from a frame with preprocessing.

    Args:
        frame: Input BGR frame from OpenCV
        scale_factor: Upscaling factor
        use_adaptive_threshold: Use adaptive vs Otsu thresholding
        tesseract_config: Tesseract configuration string
            --psm 11: Sparse text (good for UI elements scattered across screen)
            --oem 3: Default LSTM engine

    Returns:
        Tuple of (extracted_text, preprocessed_frame)
    """
    # Preprocess the frame
    preprocessed = preprocess_frame_for_ocr(
        frame,
        scale_factor=scale_factor,
        use_adaptive_threshold=use_adaptive_threshold
    )

    # Convert to PIL Image for pytesseract
    pil_image = Image.fromarray(preprocessed)

    # Extract text
    try:
        text = pytesseract.image_to_string(pil_image, config=tesseract_config)
        text = text.lower().strip()
    except Exception as e:
        text = ""

    return text, preprocessed


def detect_ad_from_ocr(text: str) -> Tuple[bool, Optional[str]]:
    """
    Detect if OCR text contains common ad disclosure tokens.

    This is a conservative heuristic - it may have false positives/negatives:
    - False positives: Posts discussing ads, "add" vs "ad", etc.
    - False negatives: Unusual disclosure formats, non-English, etc.

    Args:
        text: OCR-extracted text (should be lowercase)

    Returns:
        Tuple of (is_likely_ad, matched_token)
    """
    if not text:
        return False, None

    for pattern in AD_DISCLOSURE_PATTERNS:
        match = pattern.search(text)
        if match:
            return True, match.group()

    return False, None


class OCRDebugger:
    """
    Debug utility for OCR processing.

    When enabled (ALGO_OCR_DEBUG=1), tracks and saves debug information:
    - Preprocessed frames (first 3 + 3 with longest OCR text)
    - Summary statistics

    Usage:
        debugger = OCRDebugger(scan_id="abc123")
        for frame in frames:
            text, preprocessed = extract_text_with_preprocessing(frame)
            debugger.record_frame(preprocessed, text, frame_num)
        debugger.finalize()  # Saves frames and logs summary
    """

    def __init__(self, scan_id: str):
        self.scan_id = scan_id
        self.enabled = OCR_DEBUG_ENABLED
        self.frames_processed = 0
        self.non_empty_results = 0
        self.max_text_length = 0
        self.longest_text_snippet = ""

        # Track frames to save
        self.first_frames: List[Dict[str, Any]] = []  # First 3 frames
        self.longest_frames: List[Dict[str, Any]] = []  # 3 frames with longest OCR

        # OCR text lengths for all frames (for stats)
        self.all_text_lengths: List[int] = []

        # Create debug directory if enabled
        if self.enabled:
            self.debug_dir = os.path.join(OCR_DEBUG_DIR, f"scan_{scan_id[:8]}")
            os.makedirs(self.debug_dir, exist_ok=True)

    def record_frame(
        self,
        preprocessed_frame: np.ndarray,
        ocr_text: str,
        frame_number: int
    ):
        """Record a processed frame for potential debug output."""
        self.frames_processed += 1
        text_len = len(ocr_text)
        self.all_text_lengths.append(text_len)

        if text_len > 0:
            self.non_empty_results += 1

        if text_len > self.max_text_length:
            self.max_text_length = text_len
            self.longest_text_snippet = ocr_text[:120]

        if not self.enabled:
            return

        frame_data = {
            "frame": preprocessed_frame.copy(),
            "text": ocr_text,
            "text_len": text_len,
            "frame_number": frame_number
        }

        # Save first 3 frames
        if len(self.first_frames) < 3:
            self.first_frames.append(frame_data)

        # Track 3 frames with longest OCR text
        if len(self.longest_frames) < 3:
            self.longest_frames.append(frame_data)
            self.longest_frames.sort(key=lambda x: x["text_len"], reverse=True)
        elif text_len > self.longest_frames[-1]["text_len"]:
            self.longest_frames[-1] = frame_data
            self.longest_frames.sort(key=lambda x: x["text_len"], reverse=True)

    def finalize(self) -> Dict[str, Any]:
        """
        Finalize debug output: save frames and log summary.

        Returns:
            Summary statistics dict
        """
        summary = {
            "scan_id": self.scan_id,
            "frames_processed": self.frames_processed,
            "non_empty_results": self.non_empty_results,
            "non_empty_rate": round(self.non_empty_results / max(self.frames_processed, 1) * 100, 1),
            "max_text_length": self.max_text_length,
            "longest_text_snippet": self.longest_text_snippet,
        }

        # Calculate average text length for non-empty results
        non_empty_lengths = [l for l in self.all_text_lengths if l > 0]
        if non_empty_lengths:
            summary["avg_text_length"] = round(sum(non_empty_lengths) / len(non_empty_lengths), 1)
        else:
            summary["avg_text_length"] = 0

        if self.enabled:
            self._save_debug_frames()
            self._log_summary(summary)

        return summary

    def _save_debug_frames(self):
        """Save debug frames to disk."""
        if not self.enabled:
            return

        # Save first frames
        for i, frame_data in enumerate(self.first_frames):
            filename = f"first_{i+1}_frame{frame_data['frame_number']}.png"
            filepath = os.path.join(self.debug_dir, filename)
            cv2.imwrite(filepath, frame_data["frame"])

            # Save OCR text alongside
            txt_path = filepath.replace(".png", "_ocr.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"Frame: {frame_data['frame_number']}\n")
                f.write(f"Text length: {frame_data['text_len']}\n")
                f.write(f"OCR text:\n{frame_data['text']}\n")

        # Save longest text frames
        for i, frame_data in enumerate(self.longest_frames):
            filename = f"longest_{i+1}_frame{frame_data['frame_number']}.png"
            filepath = os.path.join(self.debug_dir, filename)
            cv2.imwrite(filepath, frame_data["frame"])

            txt_path = filepath.replace(".png", "_ocr.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"Frame: {frame_data['frame_number']}\n")
                f.write(f"Text length: {frame_data['text_len']}\n")
                f.write(f"OCR text:\n{frame_data['text']}\n")

    def _log_summary(self, summary: Dict[str, Any]):
        """Log OCR summary to console."""
        print("\n" + "=" * 60)
        print("[OCR DEBUG] Summary for scan:", summary["scan_id"][:8])
        print("=" * 60)
        print(f"  Frames processed:    {summary['frames_processed']}")
        print(f"  Non-empty OCR:       {summary['non_empty_results']} ({summary['non_empty_rate']}%)")
        print(f"  Max text length:     {summary['max_text_length']} chars")
        print(f"  Avg text length:     {summary['avg_text_length']} chars")
        print(f"  Longest OCR snippet: {summary['longest_text_snippet'][:80]}...")
        print(f"  Debug frames saved:  {self.debug_dir}")
        print("=" * 60 + "\n")


def get_ocr_debug_enabled() -> bool:
    """Check if OCR debug mode is enabled."""
    return OCR_DEBUG_ENABLED


# =============================================================================
# MULTI-PASS OCR EXTRACTION (Task A)
# =============================================================================

# OCR pass configurations: {name: {psm, scale, adaptive_threshold}}
OCR_PASS_CONFIGS = {
    "sparse": {"psm": 11, "scale": 2.0, "adaptive_threshold": True},
    "block": {"psm": 6, "scale": 2.5, "adaptive_threshold": False},
    "single_line": {"psm": 7, "scale": 3.0, "adaptive_threshold": True},
}

# Platform-specific ROI definitions as (x_start%, y_start%, width%, height%)
# These are relative to frame dimensions (0.0 to 1.0)
PLATFORM_ROI_CONFIGS: Dict[str, Dict[str, Tuple[float, float, float, float]]] = {
    "instagram": {
        "top_left": (0.0, 0.0, 0.4, 0.12),       # "Sponsored" label area
        "top_center": (0.2, 0.0, 0.6, 0.1),      # Alternate disclosure area
        "bottom_left": (0.0, 0.88, 0.5, 0.12),   # Username / handle area
        "bottom_center": (0.1, 0.85, 0.8, 0.15), # CTA / promo overlay area
    },
    "tiktok": {
        "top_left": (0.0, 0.0, 0.35, 0.1),       # "Ad" badge area
        "top_right": (0.65, 0.0, 0.35, 0.1),     # "Sponsored" label (TT variant)
        "bottom_left": (0.0, 0.75, 0.7, 0.18),   # Handle / caption overlay
        "bottom_center": (0.1, 0.80, 0.8, 0.18), # CTA buttons
    },
    "youtube": {
        "top_left": (0.0, 0.0, 0.25, 0.1),       # "Ad" badge
        "bottom_left": (0.0, 0.85, 0.3, 0.12),   # Ad duration overlay
        "bottom_center": (0.2, 0.88, 0.6, 0.1),  # "Visit advertiser" overlay
        "top_right": (0.75, 0.0, 0.25, 0.08),    # Skip button area
    },
    "x": {
        "top_left": (0.0, 0.0, 0.3, 0.12),       # "Ad" / "Promoted" label
        "top_center": (0.15, 0.0, 0.7, 0.1),     # Handle area
        "bottom_left": (0.0, 0.85, 0.6, 0.15),   # Username overlay
        "bottom_center": (0.0, 0.80, 1.0, 0.2),  # Full bottom for CTAs
    },
    "twitter": {
        # Same as X
        "top_left": (0.0, 0.0, 0.3, 0.12),
        "top_center": (0.15, 0.0, 0.7, 0.1),
        "bottom_left": (0.0, 0.85, 0.6, 0.15),
        "bottom_center": (0.0, 0.80, 1.0, 0.2),
    },
}

# High-signal tokens that indicate ROI text should be preferred
HIGH_SIGNAL_TOKENS = [
    # Ad disclosures
    r"\bad\b", r"sponsored", r"promoted", r"paid\s*partnership",
    r"#ad\b", r"#sponsored",
    # Creator handles
    r"@\w{2,}",
    # Promo signals
    r"use\s+code", r"discount", r"promo", r"%\s*off",
    r"link\s+in\s+bio", r"shop\s+now", r"swipe\s+up",
    # Domain patterns
    r"\b\w+\.(com|co|io|app|ly)\b",
]

HIGH_SIGNAL_PATTERNS = [re.compile(p, re.IGNORECASE) for p in HIGH_SIGNAL_TOKENS]


def _crop_roi(frame: np.ndarray, roi: Tuple[float, float, float, float]) -> np.ndarray:
    """
    Crop a region of interest from a frame.

    Args:
        frame: Input BGR frame
        roi: (x_start%, y_start%, width%, height%) as fractions 0.0-1.0

    Returns:
        Cropped frame region
    """
    h, w = frame.shape[:2]
    x_start, y_start, roi_w, roi_h = roi

    x1 = int(w * x_start)
    y1 = int(h * y_start)
    x2 = int(w * (x_start + roi_w))
    y2 = int(h * (y_start + roi_h))

    # Clamp to frame bounds
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)

    return frame[y1:y2, x1:x2]


def _text_has_high_signal(text: str) -> bool:
    """Check if text contains high-signal tokens."""
    if not text:
        return False
    for pattern in HIGH_SIGNAL_PATTERNS:
        if pattern.search(text):
            return True
    return False


def _extract_handles(text: str) -> List[str]:
    """Extract @handles from text."""
    if not text:
        return []
    return re.findall(r"@(\w{2,30})", text, re.IGNORECASE)


def _compute_text_quality(text: str) -> float:
    """
    Compute a quality score for OCR text.

    Combines:
    - Alphanumeric ratio (higher = better)
    - Text length (longer = better, up to a point)
    - Word structure (has recognizable words = better)
    """
    if not text:
        return 0.0

    # Alphanumeric ratio
    alnum_ratio = sum(c.isalnum() or c.isspace() for c in text) / len(text)

    # Length factor (normalize to 0-1, cap at 200 chars)
    length_factor = min(len(text.strip()) / 200.0, 1.0)

    # Word structure: count words with 3+ chars
    words = [w for w in text.split() if len(w) >= 3]
    word_factor = min(len(words) / 20.0, 1.0) if len(text) > 5 else 0.0

    # Combined score
    quality = (alnum_ratio * 0.4) + (length_factor * 0.3) + (word_factor * 0.3)
    return round(quality, 3)


def _run_ocr_pass(
    frame: np.ndarray,
    pass_name: str,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Run a single OCR pass with specific configuration.

    Returns:
        Dict with: text, text_len, quality, config
    """
    psm = config.get("psm", 11)
    scale = config.get("scale", 2.0)
    adaptive = config.get("adaptive_threshold", True)

    tesseract_config = f"--psm {psm} --oem 3"

    try:
        text, _ = extract_text_with_preprocessing(
            frame,
            scale_factor=scale,
            use_adaptive_threshold=adaptive,
            tesseract_config=tesseract_config
        )
    except Exception:
        text = ""

    return {
        "text": text,
        "text_len": len(text),
        "quality": _compute_text_quality(text),
        "config": {"psm": psm, "scale": scale, "adaptive": adaptive},
    }


def extract_text_multi_pass(
    frame: np.ndarray,
    platform: str
) -> Dict[str, Any]:
    """
    Extract OCR text using multiple passes and ROI crops.

    This function improves OCR reliability for MOBILE_VIDEO by:
    1. Running multiple OCR configurations (sparse, block, single-line)
    2. Cropping platform-specific ROIs and running targeted OCR
    3. Intelligently combining results, preferring high-signal text

    Args:
        frame: Input BGR frame from OpenCV
        platform: Platform name (instagram, tiktok, youtube, x, twitter)

    Returns:
        Dict with:
            - full_text: str - best combined OCR text, normalized lowercase
            - roi_texts: Dict[str, str] - text extracted per ROI
            - pass_stats: Dict - statistics for each OCR pass
            - best_text_source: str - which source produced the best text
            - quality_flags: Dict[str, int] - quality issues detected
            - handles_detected: List[str] - @handles found
            - ad_disclosure_snippet: Optional[str] - ad-related text if found
    """
    platform_lower = platform.lower() if platform else "instagram"

    result = {
        "full_text": "",
        "roi_texts": {},
        "pass_stats": {},
        "best_text_source": "none",
        "quality_flags": {},
        "handles_detected": [],
        "ad_disclosure_snippet": None,
    }

    # Track best results
    best_text = ""
    best_quality = 0.0
    best_source = "none"

    # High-signal text collector (ROI or pass with ad/handle tokens)
    high_signal_texts: List[str] = []

    # ==========================================================================
    # Pass 1 & 2: Full-frame OCR with different configurations
    # ==========================================================================
    for pass_name, config in OCR_PASS_CONFIGS.items():
        pass_result = _run_ocr_pass(frame, pass_name, config)
        result["pass_stats"][pass_name] = {
            "text_len": pass_result["text_len"],
            "quality": pass_result["quality"],
            "config": pass_result["config"],
            "used": False,
        }

        text = pass_result["text"]
        quality = pass_result["quality"]

        # Check for high-signal tokens
        if _text_has_high_signal(text):
            high_signal_texts.append(text)
            result["pass_stats"][pass_name]["has_high_signal"] = True

        # Track best quality full-frame text
        if quality > best_quality:
            best_quality = quality
            best_text = text
            best_source = f"pass_{pass_name}"

    # ==========================================================================
    # Pass 3: ROI-based OCR
    # ==========================================================================
    roi_config = PLATFORM_ROI_CONFIGS.get(platform_lower, PLATFORM_ROI_CONFIGS.get("instagram", {}))

    for roi_name, roi_bounds in roi_config.items():
        try:
            roi_frame = _crop_roi(frame, roi_bounds)

            # Skip if ROI is too small
            if roi_frame.size == 0 or roi_frame.shape[0] < 10 or roi_frame.shape[1] < 10:
                continue

            # Use single_line config for small ROIs, sparse for larger
            roi_pass_config = OCR_PASS_CONFIGS["single_line"]
            roi_result = _run_ocr_pass(roi_frame, f"roi_{roi_name}", roi_pass_config)

            roi_text = roi_result["text"].strip()

            if roi_text and len(roi_text) >= 2:
                result["roi_texts"][roi_name] = roi_text

                # Check for high-signal tokens in ROI
                if _text_has_high_signal(roi_text):
                    high_signal_texts.append(roi_text)

                    # ROI high-signal text is preferred over full-frame
                    if roi_result["quality"] > best_quality * 0.8:  # Allow slightly lower quality
                        best_text = roi_text
                        best_source = f"roi_{roi_name}"
                        best_quality = roi_result["quality"]

        except Exception:
            continue

    # ==========================================================================
    # Combine results intelligently
    # ==========================================================================

    # If we have high-signal texts, prefer them
    if high_signal_texts:
        # Deduplicate and join high-signal texts
        seen = set()
        unique_high_signal = []
        for t in high_signal_texts:
            normalized = t.strip().lower()
            if normalized not in seen:
                seen.add(normalized)
                unique_high_signal.append(t)

        # Use the longest high-signal text as primary
        high_signal_best = max(unique_high_signal, key=len)
        if len(high_signal_best) >= len(best_text) * 0.5:  # Reasonable length
            best_text = high_signal_best
            best_source = "high_signal_combined"

    result["full_text"] = best_text.strip().lower() if best_text else ""
    result["best_text_source"] = best_source

    # Mark which pass was used
    for pass_name in result["pass_stats"]:
        if best_source == f"pass_{pass_name}":
            result["pass_stats"][pass_name]["used"] = True

    # ==========================================================================
    # Extract handles and ad disclosure snippets
    # ==========================================================================
    all_text = best_text
    for roi_text in result["roi_texts"].values():
        all_text += " " + roi_text

    result["handles_detected"] = _extract_handles(all_text)

    # Check for ad disclosure
    is_ad, matched_token = detect_ad_from_ocr(all_text.lower())
    if is_ad and matched_token:
        result["ad_disclosure_snippet"] = matched_token

    # ==========================================================================
    # Quality flags
    # ==========================================================================
    if not result["full_text"]:
        result["quality_flags"]["no_text_extracted"] = 1
    elif len(result["full_text"]) < 10:
        result["quality_flags"]["low_text_len"] = 1

    total_roi_chars = sum(len(t) for t in result["roi_texts"].values())
    if total_roi_chars > 0 and total_roi_chars < 20:
        result["quality_flags"]["sparse_roi_text"] = 1

    # Check for noise-heavy results
    if best_text:
        noise_ratio = sum(1 for c in best_text if not c.isalnum() and not c.isspace()) / len(best_text)
        if noise_ratio > 0.3:
            result["quality_flags"]["high_noise"] = 1

    return result


def compute_average_ocr_confidence_v2(multi_pass_result: Dict[str, Any]) -> float:
    """
    Compute improved OCR confidence from multi-pass result.

    Incorporates:
    - Text quality score from passes
    - Text length
    - Whether high-signal tokens were found
    - Whether ROI extraction succeeded

    Args:
        multi_pass_result: Result dict from extract_text_multi_pass

    Returns:
        Confidence score 0.0-1.0
    """
    full_text = multi_pass_result.get("full_text", "")
    roi_texts = multi_pass_result.get("roi_texts", {})
    pass_stats = multi_pass_result.get("pass_stats", {})
    quality_flags = multi_pass_result.get("quality_flags", {})

    if not full_text:
        return 0.0

    # Base: text quality
    base_quality = _compute_text_quality(full_text)

    # Boost for ROI text
    roi_boost = 0.0
    if roi_texts:
        roi_chars = sum(len(t) for t in roi_texts.values())
        if roi_chars > 10:
            roi_boost = 0.1
        if roi_chars > 50:
            roi_boost = 0.2

    # Boost for high-signal detection
    high_signal_boost = 0.0
    if multi_pass_result.get("ad_disclosure_snippet"):
        high_signal_boost += 0.15
    if multi_pass_result.get("handles_detected"):
        high_signal_boost += 0.1

    # Penalty for quality flags
    penalty = 0.0
    if quality_flags.get("high_noise"):
        penalty += 0.2
    if quality_flags.get("low_text_len"):
        penalty += 0.1

    confidence = base_quality + roi_boost + high_signal_boost - penalty
    return round(min(max(confidence, 0.0), 1.0), 2)
