"""Shared configuration utilities for AlgorithmLens backend."""
import os
import logging

import stripe

__version__ = "2026-02-17a"

logger = logging.getLogger(__name__)


def init_stripe() -> None:
    """Initialize the Stripe API key from environment variables.

    This is the single source of truth for Stripe configuration.
    Called during app lifespan startup. All modules should import
    stripe directly — the api_key is set globally on the module.
    """
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY environment variable is not set")
    stripe.api_key = key
    logger.info("Stripe API configured")


def is_dev_environment() -> bool:
    """Check if the current environment is development.

    Checks the ENV environment variable against known dev values.
    Empty string or missing variable defaults to NOT dev (fail-safe).
    """
    env = os.getenv("ENV", "").strip().lower()
    return env in ("dev", "development", "local")
