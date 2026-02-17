"""Shared configuration utilities for AlgorithmLens backend."""
import os

__version__ = "2026-02-17a"

def is_dev_environment() -> bool:
    """Check if the current environment is development.

    Checks the ENV environment variable against known dev values.
    Empty string or missing variable defaults to NOT dev (fail-safe).
    """
    env = os.getenv("ENV", "").strip().lower()
    return env in ("dev", "development", "local")
