"""Input validation utilities for AlgorithmLens backend."""
import re
from fastapi import HTTPException

# Scan IDs are UUIDs or structured IDs like "scan-YYYYMMDD-HHMMSS-XXXX"
SCAN_ID_PATTERN = re.compile(
    r'^[a-zA-Z0-9][a-zA-Z0-9_\-]{4,128}$'
)

def validate_scan_id(scan_id: str) -> str:
    """Validate scan_id format to prevent injection attacks.

    Accepts UUID format and structured scan IDs.
    Raises HTTPException 400 if invalid.
    """
    if not scan_id or not SCAN_ID_PATTERN.match(scan_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid scan ID format"
        )
    return scan_id


# Maximum length for user question input in Talk-to-Algorithm
MAX_QUESTION_LENGTH = 1000

def validate_question(question: str) -> str:
    """Validate and sanitize user question input.

    Limits length and strips potentially dangerous content.
    Raises HTTPException 400 if invalid.
    """
    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    question = question.strip()

    if len(question) > MAX_QUESTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Question too long. Maximum {MAX_QUESTION_LENGTH} characters."
        )

    return question
