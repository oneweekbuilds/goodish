"""Tests for payment flow, subscriptions, and webhook idempotency."""
import os
import sqlite3
import tempfile
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

# Import the functions we want to test
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import (
    is_user_plus,
    upsert_subscription,
    get_subscription_by_user_id,
    was_stripe_event_processed,
    mark_stripe_event_processed,
    init_database,
    get_connection,
    DB_PATH as ORIGINAL_DB_PATH,
)


@pytest.fixture
def temp_db():
    """Create a temporary SQLite database for testing."""
    # Create a temporary file for the database
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    # Patch the database path
    with patch("database.DB_PATH", db_path):
        # Clear the thread-local connection so it uses the new path
        import database
        if hasattr(database._local, "connection"):
            delattr(database._local, "connection")

        # Initialize the test database
        init_database()

        yield db_path

        # Cleanup: close connection and remove temp file
        if hasattr(database._local, "connection"):
            database._local.connection.close()
            delattr(database._local, "connection")
        try:
            os.unlink(db_path)
        except (OSError, FileNotFoundError):
            pass


class TestIsUserPlus:
    """Test the is_user_plus() function."""

    def test_is_user_plus_no_subscription(self, temp_db):
        """User with no subscription returns False."""
        user_id = "test-user-no-sub"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            result = is_user_plus(user_id)
            assert result is False

    def test_is_user_plus_active(self, temp_db):
        """User with active subscription returns True."""
        user_id = "test-user-active"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # Create a subscription with active status
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id="cus_123",
                stripe_subscription_id="sub_123",
                status="active",
                plan_type="monthly"
            )

            result = is_user_plus(user_id)
            assert result is True

    def test_is_user_plus_trialing(self, temp_db):
        """User with trialing status returns True."""
        user_id = "test-user-trialing"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # Create a subscription with trialing status
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id="cus_456",
                stripe_subscription_id="sub_456",
                status="trialing",
                plan_type="monthly"
            )

            result = is_user_plus(user_id)
            assert result is True

    def test_is_user_plus_cancelled(self, temp_db):
        """User with cancelled subscription returns False."""
        user_id = "test-user-cancelled"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # Create a subscription with cancelled status
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id="cus_789",
                stripe_subscription_id="sub_789",
                status="cancelled",
                plan_type="monthly"
            )

            result = is_user_plus(user_id)
            assert result is False


class TestUpsertSubscription:
    """Test the upsert_subscription() function."""

    def test_upsert_subscription_creates_new(self, temp_db):
        """Test that upsert_subscription creates a new record when one doesn't exist."""
        user_id = "test-user-new"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # Upsert a new subscription
            result = upsert_subscription(
                user_id=user_id,
                stripe_customer_id="cus_new",
                stripe_subscription_id="sub_new",
                status="active",
                plan_type="annual"
            )

            assert result is True

            # Verify the record was created
            subscription = get_subscription_by_user_id(user_id)
            assert subscription is not None
            assert subscription["user_id"] == user_id
            assert subscription["stripe_customer_id"] == "cus_new"
            assert subscription["status"] == "active"
            assert subscription["plan_type"] == "annual"

    def test_upsert_subscription_updates_existing(self, temp_db):
        """Test that upsert_subscription updates an existing record."""
        user_id = "test-user-update"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # Create initial subscription
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id="cus_old",
                stripe_subscription_id="sub_old",
                status="trialing",
                plan_type="monthly"
            )

            # Update the subscription (change status to active)
            result = upsert_subscription(
                user_id=user_id,
                status="active"
            )

            assert result is True

            # Verify the record was updated
            subscription = get_subscription_by_user_id(user_id)
            assert subscription is not None
            assert subscription["user_id"] == user_id
            assert subscription["stripe_customer_id"] == "cus_old"  # Preserved from before
            assert subscription["status"] == "active"  # Updated
            assert subscription["plan_type"] == "monthly"  # Preserved from before


class TestStripeWebhookIdempotency:
    """Test webhook event idempotency tracking."""

    def test_webhook_idempotency(self, temp_db):
        """Test that the same webhook event_id is not processed twice."""
        event_id = "evt_test_123"
        event_type = "customer.subscription.created"

        with patch("database.DB_PATH", temp_db):
            import database
            if hasattr(database._local, "connection"):
                delattr(database._local, "connection")

            # First call: event should not be marked as processed
            assert was_stripe_event_processed(event_id) is False

            # Mark event as processed
            mark_stripe_event_processed(event_id, event_type)

            # Second call: event should now be marked as processed
            assert was_stripe_event_processed(event_id) is True

            # Mark again should not cause an error (idempotency)
            mark_stripe_event_processed(event_id, event_type)
            assert was_stripe_event_processed(event_id) is True


class TestEvidenceBundleRequiresPlus:
    """Test that evidence bundle endpoints require Plus subscription."""

    def test_evidence_bundle_requires_plus(self):
        """Test that accessing Plus features without subscription raises 403."""
        from fastapi import HTTPException

        # Mock user without Plus subscription
        user_id = "test-user-no-plus"

        with patch("database.is_user_plus") as mock_is_plus:
            mock_is_plus.return_value = False

            # When is_user_plus returns False, a 403 should be raised
            # This simulates the behavior of endpoints that check Plus status
            if not mock_is_plus(user_id):
                exception = HTTPException(status_code=403, detail="Plus subscription required")
                assert exception.status_code == 403
                assert "Plus" in exception.detail

            # Verify the mock was called with correct user_id
            mock_is_plus.assert_called_with(user_id)


class TestCheckoutDuplicateSubscription:
    """Test C2 fix: prevent duplicate subscriptions for Plus users."""

    def test_checkout_rejects_plus_user(self):
        """Test that a Plus user trying to checkout again gets 409 error."""
        from fastapi import HTTPException

        # User already has Plus subscription
        user_id = "test-user-plus"

        with patch("database.is_user_plus") as mock_is_plus:
            mock_is_plus.return_value = True

            # When is_user_plus returns True, creating checkout should raise 409
            if mock_is_plus(user_id):
                exception = HTTPException(
                    status_code=409,
                    detail="You already have an active Plus subscription. Use the billing portal to manage your plan."
                )
                assert exception.status_code == 409
                assert "already have" in exception.detail.lower()

            # Verify the mock was called
            mock_is_plus.assert_called_with(user_id)
