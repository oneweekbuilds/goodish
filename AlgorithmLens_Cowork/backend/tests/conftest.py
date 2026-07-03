"""Pytest configuration and shared fixtures for AlgorithmLens backend tests."""
import json
import os
import sqlite3
import tempfile
import time
from datetime import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient

# Configure test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-tests-only"
# C1 fix: auth pins the accepted issuer to the configured Supabase project.
# Tests use this fake project; token fixtures must use the matching issuer
# https://example.supabase.co/auth/v1 or they are rejected with 401.
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_fake"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_fake"
os.environ["STRIPE_PRICE_MONTHLY"] = "price_test_monthly"
os.environ["STRIPE_PRICE_ANNUAL"] = "price_test_annual"


@pytest.fixture(scope="session")
def test_db_path() -> str:
    """Create a temporary database file for the test session."""
    _, db_path = tempfile.mkstemp(suffix=".db")
    return db_path


@pytest.fixture(autouse=True)
def setup_test_db(test_db_path: str) -> Generator[None, None, None]:
    """Set up test database before each test and clean up after."""
    # Set the database path for this test
    import database
    original_db_path = database.DB_PATH
    database.DB_PATH = test_db_path

    # Reset thread-local connection to force reconnection to test DB
    database._local.connection = None

    # Initialize the test database
    database.init_database()

    # Clean all tables for test isolation
    conn = database.get_connection()
    for table in ["scans", "subscriptions", "stripe_webhook_events"]:
        try:
            conn.execute(f"DELETE FROM {table}")
        except Exception:
            pass
    conn.commit()

    yield

    # Cleanup after test: close connections and reset
    try:
        if hasattr(database._local, "connection") and database._local.connection:
            database._local.connection.close()
    except Exception:
        pass
    finally:
        database._local.connection = None
        database.DB_PATH = original_db_path


@pytest.fixture
def client(setup_test_db) -> TestClient:
    """Create a FastAPI TestClient with test database."""
    from app import app
    return TestClient(app)


@pytest.fixture
def valid_token() -> str:
    """Create a valid test JWT token.

    Note: The HS256 path in auth.py does not pass audience= to jwt.decode,
    so including 'aud' in the payload would cause InvalidAudienceError.
    We omit 'aud' here. exp and iat are required (verify_exp/verify_iat=True).
    """
    import jwt
    now = int(time.time())
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "iss": "https://example.supabase.co/auth/v1",
        "iat": now,
        "exp": now + 3600,
    }
    secret = os.getenv("SUPABASE_JWT_SECRET", "test-secret")
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def sample_scan_result() -> dict:
    """Create a sample scan result for testing."""
    return {
        "scan_metadata": {
            "scan_id": "scan-123",
            "created_at": datetime.now().isoformat(),
            "platform": "TIKTOK",
            "user_identifier": "test-user-123",
            "source_type": "EXTENSION"
        },
        "aggregates": {
            "total_feed_items": 10,
            "total_ads": 2,
            "ad_percentage": 0.2,
            "duration_seconds": 60.5
        },
        "feed_items": [
            {
                "item_id": "item-1",
                "content_text": {"captions": ["Test post 1"]},
                "account": {"account_handle": "testuser"},
                "topics": {"primary_category": "general"}
            },
            {
                "item_id": "item-2",
                "content_text": {"captions": ["Test post 2"]},
                "account": {"account_handle": "testuser"},
                "topics": {"primary_category": "entertainment"}
            }
        ]
    }


@pytest.fixture
def sample_video_scan_result() -> dict:
    """Create a sample video scan result for testing."""
    return {
        "scan_metadata": {
            "scan_id": "video-scan-456",
            "created_at": datetime.now().isoformat(),
            "platform": "INSTAGRAM",
            "user_identifier": "test-user-123",
            "source_type": "MOBILE_VIDEO"
        },
        "environment": {
            "video_capture": {
                "duration_seconds": 120.0
            }
        },
        "aggregates": {
            "total_feed_items": 15,
            "total_ads": 3,
            "ad_percentage": 0.2
        },
        "feed_items": []
    }


@pytest.fixture
def sample_subscription_data() -> dict:
    """Create sample subscription data."""
    return {
        "user_id": "test-user-123",
        "stripe_customer_id": "cus_test123",
        "stripe_subscription_id": "sub_test123",
        "status": "active",
        "plan_type": "monthly",
        "trial_end": None,
        "current_period_end": 1735689600.0,
        "cancel_at_period_end": False
    }
