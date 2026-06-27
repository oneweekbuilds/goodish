"""Tests for FastAPI endpoints."""
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

import database


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_health_endpoint(self, client: TestClient):
        """Test that /api/health returns 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "code_version" in data

    def test_gemini_status_endpoint(self, client: TestClient):
        """Test that /api/gemini-status returns model info."""
        response = client.get("/api/gemini-status")
        assert response.status_code == 200
        data = response.json()
        assert "model" in data
        assert data["model"] == "gemini-2.0-flash"
        assert "features" in data

    def test_ocr_status_endpoint(self, client: TestClient):
        """Test that /api/ocr-status returns OCR configuration."""
        response = client.get("/api/ocr-status")
        assert response.status_code == 200
        data = response.json()
        assert "ocr_debug_enabled" in data
        assert "ad_disclosure_tokens" in data


class TestScansListEndpoint:
    """Test the /api/scans list endpoint."""

    def test_scans_list_requires_auth(self, client: TestClient):
        """Test that /api/scans returns 401 without token."""
        response = client.get("/api/scans")
        assert response.status_code in (401, 403)

    def test_scans_list_with_valid_token(self, client: TestClient, valid_token: str):
        """Test that /api/scans returns 200 with valid token."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # API returns {"scans": [...]}
        assert "scans" in data
        assert isinstance(data["scans"], list)

    def test_scans_list_returns_user_scans(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """Test that /api/scans returns only user's scans."""
        # Save a scan for this user
        database.save_scan(sample_scan_result)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code == 200
        scans = response.json()["scans"]

        assert len(scans) == 1
        assert scans[0]["id"] == "scan-123"
        assert scans[0]["platform"] == "TIKTOK"

    def test_scans_list_excludes_other_user_scans(self, client: TestClient, valid_token: str):
        """Test that scans from other users are not returned."""
        # Save a scan for a different user
        other_scan = {
            "scan_metadata": {
                "scan_id": "other-scan",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "other-user"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        database.save_scan(other_scan)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code == 200
        scans = response.json()["scans"]

        # Should not include the other user's scan
        assert len(scans) == 0

    def test_scans_list_returns_pagination(self, client: TestClient, valid_token: str):
        """Test that scans list endpoint works with pagination parameters."""
        # Save multiple scans
        for i in range(5):
            scan = {
                "scan_metadata": {
                    "scan_id": f"scan-{i}",
                    "created_at": datetime.now().isoformat(),
                    "platform": "TIKTOK",
                    "user_identifier": "test-user-123"
                },
                "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
                "feed_items": []
            }
            database.save_scan(scan)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans?limit=2", headers=headers)
        assert response.status_code == 200


class TestScanDetailEndpoint:
    """Test the /api/scans/{id} detail endpoint."""

    def test_scan_detail_requires_auth(self, client: TestClient, sample_scan_result: dict):
        """Test that getting scan details requires authentication."""
        database.save_scan(sample_scan_result)

        response = client.get("/api/scans/scan-123")
        assert response.status_code in (401, 403)

    def test_scan_detail_with_auth(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """Test that scan details are returned with valid token."""
        database.save_scan(sample_scan_result)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/scan-123", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["id"] == "scan-123"
        assert data["platform"] == "TIKTOK"
        assert "result" in data

    def test_scan_detail_not_found(self, client: TestClient, valid_token: str):
        """Test that non-existent scan returns 404."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/nonexistent-id", headers=headers)
        assert response.status_code == 404

    def test_scan_detail_wrong_user(self, client: TestClient, valid_token: str):
        """Test that users cannot access other users' scans."""
        # Save scan for different user
        other_scan = {
            "scan_metadata": {
                "scan_id": "other-scan",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "other-user"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        database.save_scan(other_scan)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/other-scan", headers=headers)
        assert response.status_code == 404


class TestScanDeleteEndpoint:
    """Test the DELETE /api/scans/{id} endpoint."""

    def test_delete_scan_requires_auth(self, client: TestClient, sample_scan_result: dict):
        """Test that deleting scan requires authentication."""
        database.save_scan(sample_scan_result)

        response = client.delete("/api/scans/scan-123")
        assert response.status_code in (401, 403)

    def test_delete_scan_with_auth(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """Test that authenticated user can delete their scan."""
        database.save_scan(sample_scan_result)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.delete("/api/scans/scan-123", headers=headers)
        assert response.status_code == 200

        # Verify scan was deleted
        response = client.get("/api/scans/scan-123", headers=headers)
        assert response.status_code == 404

    def test_delete_scan_not_found(self, client: TestClient, valid_token: str):
        """Test deleting non-existent scan."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.delete("/api/scans/nonexistent", headers=headers)
        assert response.status_code == 404

    def test_delete_scan_wrong_user(self, client: TestClient, valid_token: str):
        """Test that users cannot delete other users' scans."""
        # Save scan for different user
        other_scan = {
            "scan_metadata": {
                "scan_id": "other-scan",
                "created_at": datetime.now().isoformat(),
                "platform": "TIKTOK",
                "user_identifier": "other-user"
            },
            "aggregates": {"total_feed_items": 5, "total_ads": 1, "ad_percentage": 0.2},
            "feed_items": []
        }
        database.save_scan(other_scan)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.delete("/api/scans/other-scan", headers=headers)
        assert response.status_code == 404


class TestScanStatusEndpoint:
    """Test the /api/scans/{id}/status endpoint."""

    def test_scan_status_requires_auth(self, client: TestClient):
        """Test that scan status endpoint requires authentication."""
        response = client.get("/api/scans/scan-123/status")
        assert response.status_code in (401, 403)

    def test_scan_status_processing(self, client: TestClient, valid_token: str):
        """Test checking status of processing scan."""
        # Create pending scan
        database.create_pending_scan("pending-1", "TIKTOK", "test-user-123")

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/pending-1/status", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "processing"

    def test_scan_status_completed(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """Test checking status of completed scan."""
        database.save_scan(sample_scan_result)

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/scan-123/status", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "completed"

    def test_scan_status_not_found(self, client: TestClient, valid_token: str):
        """Test checking status of non-existent scan."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/scans/nonexistent-id/status", headers=headers)
        assert response.status_code == 404


class TestEntitlementsEndpoint:
    """Test the /api/user/entitlements endpoint."""

    def test_entitlements_requires_auth(self, client: TestClient):
        """Test that entitlements endpoint requires authentication."""
        response = client.get("/api/user/entitlements")
        assert response.status_code in (401, 403)

    def test_entitlements_free_tier(self, client: TestClient, valid_token: str):
        """Test that users without subscription get free tier."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/user/entitlements", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["is_plus"] is False
        assert data["subscription"]["status"] is None
        assert data["subscription"]["plan_type"] is None

    def test_entitlements_with_subscription(self, client: TestClient, valid_token: str):
        """Test that Plus subscribers get correct entitlements."""
        # Create subscription
        database.upsert_subscription(
            user_id="test-user-123",
            stripe_customer_id="cus_123",
            status="active",
            plan_type="monthly",
            current_period_end=1735689600.0
        )

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/user/entitlements", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["is_plus"] is True
        assert data["subscription"]["status"] == "active"
        assert data["subscription"]["plan_type"] == "monthly"

    def test_entitlements_trial(self, client: TestClient, valid_token: str):
        """Test that users in trial get Plus access."""
        database.upsert_subscription(
            user_id="test-user-123",
            status="trialing",
            trial_end=1735689600.0
        )

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/user/entitlements", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["is_plus"] is True
        assert data["subscription"]["status"] == "trialing"

    def test_entitlements_cancel_at_period_end(self, client: TestClient, valid_token: str):
        """Test that cancellation state is included in entitlements."""
        database.upsert_subscription(
            user_id="test-user-123",
            status="active",
            cancel_at_period_end=True
        )

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.get("/api/user/entitlements", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["subscription"]["cancel_at_period_end"] is True


class TestDataDeletionEndpoint:
    """Test the DELETE /api/user/data endpoint."""

    def test_delete_user_data_requires_auth(self, client: TestClient):
        """Test that data deletion requires authentication."""
        response = client.delete("/api/user/data")
        assert response.status_code in (401, 403)

    def test_delete_user_data(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """Test that user can delete their own data."""
        # Create some data
        database.save_scan(sample_scan_result)
        database.upsert_subscription(
            user_id="test-user-123",
            status="active"
        )

        # Verify data exists
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) > 0

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.delete("/api/user/data", headers=headers)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "deleted"
        assert "details" in data

        # Verify data was deleted
        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 0

    def test_delete_user_data_respects_rate_limit(self, client: TestClient, valid_token: str):
        """Test that data deletion endpoint is rate limited."""
        headers = {"Authorization": f"Bearer {valid_token}"}

        # Make 3 requests (should succeed)
        for i in range(3):
            response = client.delete("/api/user/data", headers=headers)
            # After the last successful request, the next one should be rate limited
            if i < 2:
                assert response.status_code in [200, 400]  # May fail with 400 if no data
            else:
                # 3rd request should still work (limit is 3/hour)
                pass

        # 4th request should hit rate limit (429)
        response = client.delete("/api/user/data", headers=headers)
        assert response.status_code == 429


class TestAccountDeletionEndpoint:
    """Test the DELETE /api/user/account endpoint (full account deletion)."""

    def test_delete_user_account_requires_auth(self, client: TestClient):
        """Account deletion must require authentication."""
        response = client.delete("/api/user/account")
        assert response.status_code in (401, 403)

    def test_delete_user_account(self, client: TestClient, valid_token: str, sample_scan_result: dict):
        """A user can delete their own account; their scans are removed.

        In the SQLite test database there is no Supabase auth schema, so the
        user_profiles and auth.users deletes are skipped, but scans and
        subscriptions are still removed and the endpoint reports success.
        """
        database.save_scan(sample_scan_result)
        database.upsert_subscription(user_id="test-user-123", status="active")

        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) > 0

        headers = {"Authorization": f"Bearer {valid_token}"}
        response = client.delete("/api/user/account", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "deleted"
        assert "details" in data
        assert data["details"]["scans_deleted"] >= 1

        scans = database.get_scans_by_user("test-user-123")
        assert len(scans) == 0


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_invalid_token(self, client: TestClient):
        """Test that invalid tokens are rejected."""
        headers = {"Authorization": "Bearer invalid-token-xyz"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code in (401, 403)

    def test_malformed_auth_header(self, client: TestClient):
        """Test that malformed Authorization header is rejected."""
        headers = {"Authorization": "InvalidFormat"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code in (401, 403)

    def test_missing_bearer_prefix(self, client: TestClient):
        """Test that missing Bearer prefix is rejected."""
        headers = {"Authorization": "token-without-bearer"}
        response = client.get("/api/scans", headers=headers)
        assert response.status_code in (401, 403)
