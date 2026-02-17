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
