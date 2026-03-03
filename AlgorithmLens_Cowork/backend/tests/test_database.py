"""Tests for the database module."""
import json
from datetime import datetime

import pytest

import database


class TestDatabaseInitialization:
    """Test database initialization and schema creation."""

    def test_init_db_creates_scans_table(self, setup_test_db):
        """Verify that init_database creates the scans table."""
        conn = database.get_connection()
        cursor = conn.cursor()

        # Check if scans table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='scans'
        """)
        assert cursor.fetchone() is not None, "scans table should exist"

    def test_init_db_creates_subscriptions_table(self, setup_test_db):
        """Verify that init_database creates the subscriptions table."""
        conn = database.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='subscriptions'
        """)
        assert cursor.fetchone() is not None, "subscriptions table should exist"

    def test_init_db_creates_webhook_events_table(self, setup_test_db):
        """Verify that init_database creates the stripe_webhook_events table."""
        conn = database.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='stripe_webhook_events'
        """)
        assert cursor.fetchone() is not None, "stripe_webhook_events table should exist"

    def test_init_db_creates_indexes(self, setup_test_db):
        """Verify that init_database creates required indexes."""
        conn = database.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='index' AND name='idx_scans_created_at'
        """)
        assert cursor.fetchone() is not None, "idx_scans_created_at index should exist"


class TestScanOperations:
    """Test scan CRUD operations."""

    def test_save_and_get_scan(self, setup_test_db, sample_scan_result):
        """Test saving a scan and retrieving it."""
        # Save the scan
        scan_id = database.save_scan(sample_scan_result)

        # Verify scan_id matches
        assert scan_id == "scan-123"

        # Retrieve the scan
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 1
        assert scans[0]["id"] == "scan-123"
        assert scans[0]["platform"] == "TIKTOK"
        assert scans[0]["total_items"] == 10
        assert scans[0]["total_ads"] == 2

    def test_save_scan_calculates_ad_percentage(self, setup_test_db):
        """Test that save_scan correctly calculates ad_percentage."""
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-scan",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "user-1"
            },
            "aggregates": {
                "total_feed_items": 100,
                "total_ads": 25,
                "ad_percentage": 0.25
            },
            "feed_items": []
        }

        database.save_scan(scan_result)

        # Retrieve and check the stored ad_percentage (should be 0-100 scale in DB)
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ad_percentage FROM scans WHERE id = ?", ("test-scan",))
        row = cursor.fetchone()
        assert row is not None
        # DB stores 0-100 scale
        assert row[0] == 25.0

    def test_get_scan_by_id_for_user(self, setup_test_db, sample_scan_result):
        """Test retrieving a scan by ID for a specific user."""
        database.save_scan(sample_scan_result)

        # Get scan for correct user
        scan = database.get_scan_by_id_for_user("scan-123", "test-user-123")
        assert scan is not None
        assert scan["id"] == "scan-123"

        # Get scan for wrong user should return None
        scan = database.get_scan_by_id_for_user("scan-123", "wrong-user")
        assert scan is None

    def test_get_scan_by_id_returns_full_result(self, setup_test_db, sample_scan_result):
        """Test that get_scan_by_id_for_user returns full result JSON."""
        database.save_scan(sample_scan_result)

        scan = database.get_scan_by_id_for_user("scan-123", "test-user-123")
        assert scan is not None
        assert "result" in scan
        assert scan["result"]["scan_metadata"]["scan_id"] == "scan-123"

    def test_delete_scan(self, setup_test_db, sample_scan_result):
        """Test deleting a scan."""
        database.save_scan(sample_scan_result)

        # Verify scan exists
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 1

        # Delete the scan
        deleted = database.delete_scan("scan-123", "test-user-123")
        assert deleted is True

        # Verify scan is gone
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 0

    def test_delete_scan_wrong_user(self, setup_test_db, sample_scan_result):
        """Test that delete_scan respects user ownership."""
        database.save_scan(sample_scan_result)

        # Try to delete with wrong user
        deleted = database.delete_scan("scan-123", "wrong-user")
        assert deleted is False

        # Verify scan still exists
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 1

    def test_delete_scan_nonexistent(self, setup_test_db):
        """Test deleting a non-existent scan."""
        deleted = database.delete_scan("nonexistent-id", "user-1")
        assert deleted is False


class TestPendingScans:
    """Test pending/processing scan operations."""

    def test_create_pending_scan(self, setup_test_db):
        """Test creating a pending scan."""
        scan_id = database.create_pending_scan("pending-1", "TIKTOK", "user-1")
        assert scan_id == "pending-1"

        # Verify scan exists with processing status
        scan = database.get_scan_status("pending-1")
        assert scan is not None
        assert scan["status"] == "processing"

    def test_update_scan_result(self, setup_test_db, sample_video_scan_result):
        """Test updating a scan from pending to completed."""
        # Create pending scan
        database.create_pending_scan("video-1", "INSTAGRAM", "user-1")

        # Update with results
        updated = database.update_scan_result(
            "video-1",
            sample_video_scan_result,
            status="completed"
        )
        assert updated is True

        # Verify status changed
        scan = database.get_scan_status("video-1")
        assert scan["status"] == "completed"
        assert scan["total_items"] == 15
        assert scan["total_ads"] == 3

    def test_update_scan_result_nonexistent(self, setup_test_db, sample_scan_result):
        """Test updating a non-existent scan."""
        updated = database.update_scan_result("nonexistent", sample_scan_result)
        assert updated is False

    def test_update_scan_error(self, setup_test_db):
        """Test updating a scan with error status."""
        database.create_pending_scan("error-1", "TIKTOK", "user-1")

        # Mark as failed
        updated = database.update_scan_error("error-1", "Processing failed: Invalid video")
        assert updated is True

        # Verify error status
        scan = database.get_scan_status("error-1")
        assert scan["status"] == "failed"
        assert scan["error_message"] == "Processing failed: Invalid video"

    def test_update_scan_error_nonexistent(self, setup_test_db):
        """Test updating error on non-existent scan."""
        updated = database.update_scan_error("nonexistent", "Error message")
        assert updated is False

    def test_get_scan_status(self, setup_test_db, sample_scan_result):
        """Test getting just the status of a scan."""
        database.save_scan(sample_scan_result)

        status = database.get_scan_status("scan-123")
        assert status is not None
        assert status["scan_id"] == "scan-123"
        assert status["status"] == "completed"
        assert status["total_items"] == 10


class TestScansByUser:
    """Test user-scoped scan queries."""

    def test_get_scans_by_user(self, setup_test_db):
        """Test retrieving scans for a specific user."""
        # Save scans for user 1
        scan1 = {
            "scan_metadata": {
                "scan_id": "scan-1",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "user-1"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        scan2 = {
            "scan_metadata": {
                "scan_id": "scan-2",
                "created_at": datetime.now().isoformat(),
                "platform": "INSTAGRAM",
                "user_identifier": "user-1"
            },
            "aggregates": {"total_feed_items": 10, "total_ads": 2, "ad_percentage": 0.2},
            "feed_items": []
        }

        database.save_scan(scan1)
        database.save_scan(scan2)

        # Save scan for user 2
        scan3 = {
            "scan_metadata": {
                "scan_id": "scan-3",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "user-2"
            },
            "aggregates": {"total_feed_items": 8, "total_ads": 1, "ad_percentage": 0.125},
            "feed_items": []
        }
        database.save_scan(scan3)

        # Get scans for user-1
        scans = database.get_scans_by_user("user-1")
        assert len(scans) == 2
        assert all(scan["user_id"] == "user-1" for scan in scans)

        # Get scans for user-2
        scans = database.get_scans_by_user("user-2")
        assert len(scans) == 1
        assert scans[0]["id"] == "scan-3"

    def test_get_scans_by_user_empty(self, setup_test_db):
        """Test getting scans for a user with no scans."""
        scans = database.get_scans_by_user("nonexistent-user")
        assert len(scans) == 0

    def test_scans_sorted_by_created_at(self, setup_test_db):
        """Test that scans are returned sorted by created_at descending."""
        import time

        # Create scans with delays to ensure different timestamps
        scan1 = {
            "scan_metadata": {
                "scan_id": "scan-first",
                "created_at": "2024-01-01T10:00:00",
                "platform": "TIKTOK",
                "user_identifier": "user-1"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        database.save_scan(scan1)

        scan2 = {
            "scan_metadata": {
                "scan_id": "scan-second",
                "created_at": "2024-01-02T10:00:00",
                "platform": "TIKTOK",
                "user_identifier": "user-1"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        database.save_scan(scan2)

        scans = database.get_scans_by_user("user-1")
        assert len(scans) == 2
        # Should be sorted newest first
        assert scans[0]["id"] == "scan-second"
        assert scans[1]["id"] == "scan-first"


class TestSubscriptions:
    """Test subscription operations."""

    def test_upsert_subscription_create(self, setup_test_db, sample_subscription_data):
        """Test creating a new subscription."""
        affected = database.upsert_subscription(
            user_id="user-1",
            stripe_customer_id="cus_123",
            stripe_subscription_id="sub_123",
            status="active",
            plan_type="monthly",
            current_period_end=1735689600.0
        )
        assert affected is True

        # Verify it was created
        sub = database.get_subscription_by_user_id("user-1")
        assert sub is not None
        assert sub["status"] == "active"
        assert sub["plan_type"] == "monthly"

    def test_upsert_subscription_update(self, setup_test_db):
        """Test updating an existing subscription."""
        # Create initial subscription
        database.upsert_subscription(
            user_id="user-1",
            stripe_customer_id="cus_123",
            status="trialing",
            plan_type="monthly"
        )

        # Update it
        database.upsert_subscription(
            user_id="user-1",
            status="active"
        )

        # Verify update
        sub = database.get_subscription_by_user_id("user-1")
        assert sub["status"] == "active"
        assert sub["stripe_customer_id"] == "cus_123"  # Preserved from original

    def test_get_subscription_by_user_id(self, setup_test_db):
        """Test retrieving subscription by user ID."""
        database.upsert_subscription(
            user_id="user-1",
            stripe_customer_id="cus_123",
            status="active",
            plan_type="annual"
        )

        sub = database.get_subscription_by_user_id("user-1")
        assert sub is not None
        assert sub["user_id"] == "user-1"
        assert sub["status"] == "active"

    def test_get_subscription_by_user_id_not_found(self, setup_test_db):
        """Test getting non-existent subscription."""
        sub = database.get_subscription_by_user_id("nonexistent")
        assert sub is None

    def test_get_subscription_by_customer_id(self, setup_test_db):
        """Test retrieving subscription by Stripe customer ID."""
        database.upsert_subscription(
            user_id="user-1",
            stripe_customer_id="cus_123",
            status="active"
        )

        sub = database.get_subscription_by_customer_id("cus_123")
        assert sub is not None
        assert sub["user_id"] == "user-1"
        assert sub["status"] == "active"

    def test_get_subscription_by_customer_id_not_found(self, setup_test_db):
        """Test getting subscription by non-existent customer ID."""
        sub = database.get_subscription_by_customer_id("cus_nonexistent")
        assert sub is None


class TestEntitlements:
    """Test subscription entitlement checking."""

    def test_is_user_plus_active(self, setup_test_db):
        """Test that active subscribers are Plus users."""
        database.upsert_subscription(
            user_id="user-1",
            status="active"
        )

        is_plus = database.is_user_plus("user-1")
        assert is_plus is True

    def test_is_user_plus_trialing(self, setup_test_db):
        """Test that users in trial are Plus users."""
        database.upsert_subscription(
            user_id="user-1",
            status="trialing"
        )

        is_plus = database.is_user_plus("user-1")
        assert is_plus is True

    def test_is_user_plus_past_due(self, setup_test_db):
        """Test that past_due subscribers keep access."""
        database.upsert_subscription(
            user_id="user-1",
            status="past_due"
        )

        is_plus = database.is_user_plus("user-1")
        assert is_plus is True

    def test_is_user_plus_no_subscription(self, setup_test_db):
        """Test that users without subscription are not Plus."""
        is_plus = database.is_user_plus("user-no-sub")
        assert is_plus is False

    def test_is_user_plus_canceled(self, setup_test_db):
        """Test that canceled subscribers are not Plus."""
        database.upsert_subscription(
            user_id="user-1",
            status="canceled"
        )

        is_plus = database.is_user_plus("user-1")
        assert is_plus is False


class TestWebhookIdempotency:
    """Test Stripe webhook event idempotency."""

    def test_mark_stripe_event_processed(self, setup_test_db):
        """Test marking a webhook event as processed."""
        database.mark_stripe_event_processed("evt_123", "customer.subscription.updated")

        exists = database.was_stripe_event_processed("evt_123")
        assert exists is True

    def test_was_stripe_event_processed_false(self, setup_test_db):
        """Test checking for unprocessed event."""
        exists = database.was_stripe_event_processed("evt_nonexistent")
        assert exists is False

    def test_webhook_idempotency_duplicate(self, setup_test_db):
        """Test that duplicate webhook events are detected."""
        event_id = "evt_123"

        # Mark as processed
        database.mark_stripe_event_processed(event_id, "customer.subscription.updated")
        assert database.was_stripe_event_processed(event_id) is True

        # Mark again (should not error)
        database.mark_stripe_event_processed(event_id, "customer.subscription.updated")
        assert database.was_stripe_event_processed(event_id) is True

    def test_get_recent_webhook_events(self, setup_test_db):
        """Test retrieving recent webhook events."""
        database.mark_stripe_event_processed("evt_1", "customer.subscription.created")
        database.mark_stripe_event_processed("evt_2", "customer.subscription.updated")
        database.mark_stripe_event_processed("evt_3", "customer.subscription.deleted")

        events = database.get_recent_webhook_events(limit=10)
        assert len(events) >= 3

        event_ids = [e["event_id"] for e in events]
        assert "evt_1" in event_ids
        assert "evt_2" in event_ids
        assert "evt_3" in event_ids

    def test_cleanup_old_webhook_events(self, setup_test_db):
        """Test cleaning up old webhook events."""
        # Mark some events
        database.mark_stripe_event_processed("evt_1", "customer.subscription.created")

        # Clean up events older than 0 days (should delete everything)
        deleted = database.cleanup_old_webhook_events(days_to_keep=0)

        # Verify event was deleted
        assert database.was_stripe_event_processed("evt_1") is False
