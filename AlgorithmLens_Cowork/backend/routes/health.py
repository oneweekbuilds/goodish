"""Health check and system status endpoints."""
import os
from fastapi import APIRouter
from ocr_utils import get_ocr_debug_enabled
from config import __version__, is_dev_environment

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check() -> dict:
    """Check if the API is running."""
    return {"status": "ok", "code_version": __version__}


@router.get("/gemini-status")
def gemini_status() -> dict:
    """
    Check Gemini AI analysis configuration.

    Note: Gemini is CORE to every scan - not a separate tier or limit.
    AI analysis runs on every scan where the user gives consent.

    Returns:
        Model info and feature list (availability is always assumed in production)
    """
    return {
        "model": "gemini-2.0-flash",
        "features": [
            "sentiment_analysis",
            "political_detection",
            "wellbeing_themes"
        ],
        "policy": "AI analysis is included with every scan when user consents"
    }


@router.get("/ocr-status")
def ocr_status() -> dict:
    """
    Check OCR system status and configuration.

    In production, returns only the debug-enabled flag.
    In dev mode, returns full configuration details for debugging.
    """
    is_dev = is_dev_environment()

    response = {
        "ocr_debug_enabled": get_ocr_debug_enabled(),
    }

    # Only expose internal configuration in dev mode
    if is_dev:
        response.update({
            "debug_env_var": "ALGO_OCR_DEBUG",
            "debug_output_dir": "backend/ocr_debug/",
            "preprocessing_pipeline": [
                "grayscale",
                "2x_upscale",
                "clahe_contrast",
                "adaptive_threshold"
            ],
        })

    # Ad disclosure tokens are part of the public classification methodology
    response["ad_disclosure_tokens"] = [
        "ad", "sponsored", "promoted", "advertisement",
        "paid partnership", "paid promotion", "#ad", "#sponsored"
    ]

    return response
