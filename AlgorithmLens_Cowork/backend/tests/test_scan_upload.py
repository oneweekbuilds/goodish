"""Tests for scan upload and desktop scan endpoints."""
import io
import json
import sys
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

import database


class TestScanUploadEndpoint:
    """Test the POST /api/scan/upload endpoint."""

    def test_valid_upload_with_video_file(self, client: TestClient, valid_token: str):
        """Test valid video upload returns scan_id and processing status."""
        with patch("routes.scans.process_video"):
            response = client.post(
                "/api/scan/upload",
                files={"file": ("test.mp4", b"fake video content", "video/mp4")},
                data={"platform": "tiktok"},
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "scan_id" in data
            assert data["status"] == "processing"
            assert "message" in data

    def test_invalid_content_type_text_plain(self, client: TestClient, valid_token: str):
        """Test upload with text/plain returns 400."""
        response = client.post(
            "/api/scan/upload",
            files={"file": ("test.txt", b"text content", "text/plain")},
            data={"platform": "tiktok"},
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_invalid_file_extension_txt(self, client: TestClient, valid_token: str):
        """Test upload with .txt extension returns 400."""
        response = client.post(
            "/api/scan/upload",
            files={"file": ("test.txt", b"fake content", "video/mp4")},
            data={"platform": "tiktok"},
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_missing_auth_returns_401_or_403(self, client: TestClient):
        """Test upload without auth returns 401 or 403 (FastAPI HTTPBearer returns 403)."""
        response = client.post(
            "/api/scan/upload",
            files={"file": ("test.mp4", b"fake video", "video/mp4")},
            data={"platform": "tiktok"}
        )

        assert response.status_code in (401, 403)

    def test_missing_file_parameter(self, client: TestClient, valid_token: str):
        """Test upload without file parameter returns 422."""
        response = client.post(
            "/api/scan/upload",
            data={"platform": "tiktok"},
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 422  # FastAPI validation error


class TestDesktopScanEndpoint:
    """Test the POST /api/scan/desktop endpoint."""

    def _make_payload(self, scan_id=None, platform="TIKTOK", user_id="test-user-123"):
        """Helper to create a valid desktop scan payload."""
        return {
            "scan_metadata": {
                "scan_id": scan_id or f"scan-{uuid.uuid4().hex[:8]}",
                "created_at": datetime.now().isoformat(),
                "platform": platform,
                "user_identifier": user_id,
                "source_type": "EXTENSION"
            },
            "aggregates": {
                "total_feed_items": 10,
                "total_ads": 2,
                "ad_percentage": 0.2,
            },
            "feed_items": [
                {
                    "item_id": "item-1",
                    "content_text": {"captions": ["Test post"]},
                    "account": {"account_handle": "testuser"},
                    "topics": {"primary_category": "general"}
                }
            ]
        }

    def test_valid_desktop_scan(self, client: TestClient, valid_token: str):
        """Test valid desktop scan returns success."""
        payload = self._make_payload()

        with patch("gemini_analyzer.analyze_scan") as mock_analyze:
            mock_analyze.return_value = (payload, False, "no_consent")

            response = client.post(
                "/api/scan/desktop",
                json=payload,
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "scan_id" in data
            assert "platform" in data
            assert "total_items" in data
            assert "total_ads" in data

    def test_missing_scan_metadata_returns_400(self, client: TestClient, valid_token: str):
        """Test desktop scan without scan_metadata returns 400."""
        payload = {
            "aggregates": {"total_feed_items": 10},
            "feed_items": []
        }

        response = client.post(
            "/api/scan/desktop",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "scan_metadata" in data["detail"].lower()

    def test_missing_scan_id_in_metadata_returns_400(self, client: TestClient, valid_token: str):
        """Test desktop scan with missing scan_id returns 400."""
        payload = {
            "scan_metadata": {
                "platform": "TIKTOK",
                "created_at": datetime.now().isoformat(),
            },
            "aggregates": {"total_feed_items": 10},
            "feed_items": []
        }

        response = client.post(
            "/api/scan/desktop",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "scan_id" in data["detail"].lower()

    def test_invalid_scan_id_format_returns_400(self, client: TestClient, valid_token: str):
        """Test desktop scan with invalid scan_id format returns 400."""
        payload = {
            "scan_metadata": {
                "scan_id": "!!invalid!!",
                "platform": "TIKTOK",
                "created_at": datetime.now().isoformat(),
            },
            "aggregates": {"total_feed_items": 10},
            "feed_items": []
        }

        response = client.post(
            "/api/scan/desktop",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "scan_id" in data["detail"].lower()

    def test_missing_auth_returns_401_or_403(self, client: TestClient):
        """Test desktop scan without auth returns 401 or 403."""
        payload = self._make_payload()

        response = client.post(
            "/api/scan/desktop",
            json=payload
        )

        assert response.status_code in (401, 403)

    def test_gemini_consent_false_sets_ai_analyzed_false(self, client: TestClient, valid_token: str):
        """Test that gemini_consent=false results in ai_analyzed=false."""
        payload = self._make_payload()
        payload["gemini_consent"] = False

        with patch("gemini_analyzer.analyze_scan") as mock_analyze:
            mock_analyze.return_value = (payload, False, "no_consent")

            response = client.post(
                "/api/scan/desktop",
                json=payload,
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["ai_analyzed"] is False
            # analyze_scan should NOT be called when consent=False
            mock_analyze.assert_not_called()

    def test_gemini_consent_true_attempts_analysis(self, client: TestClient, valid_token: str):
        """Test that gemini_consent=true attempts AI analysis."""
        payload = self._make_payload()
        payload["gemini_consent"] = True

        with patch("gemini_analyzer.analyze_scan") as mock_analyze:
            analyzed = payload.copy()
            mock_analyze.return_value = (analyzed, True, "success")

            response = client.post(
                "/api/scan/desktop",
                json=payload,
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            mock_analyze.assert_called_once()

    def test_user_id_from_auth_overrides_scan_metadata(self, client: TestClient, valid_token: str):
        """Test that authenticated user_id overrides user_identifier in metadata."""
        payload = self._make_payload(user_id="different-user-123")

        with patch("gemini_analyzer.analyze_scan") as mock_analyze:
            mock_analyze.return_value = (payload, False, "no_consent")

            response = client.post(
                "/api/scan/desktop",
                json=payload,
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            data = response.json()
            scan_id = data["scan_id"]
            # The saved scan should have the authenticated user_id (test-user-123)
            saved_scan = database.get_scan_by_id_for_user(scan_id, "test-user-123")
            assert saved_scan is not None

    def test_desktop_scan_creates_debug_fields(self, client: TestClient, valid_token: str):
        """Test that desktop scan creates debug fields for Gemini tracking."""
        payload = self._make_payload()
        payload["gemini_consent"] = True

        with patch("gemini_analyzer.analyze_scan") as mock_analyze:
            mock_analyze.return_value = (payload, True, "success")

            response = client.post(
                "/api/scan/desktop",
                json=payload,
                headers={"Authorization": f"Bearer {valid_token}"}
            )

            assert response.status_code == 200
            data = response.json()
            scan_id = data["scan_id"]
            saved_scan = database.get_scan_by_id_for_user(scan_id, "test-user-123")
            assert saved_scan is not None
            result = saved_scan.get("result", {})
            debug = result.get("debug", {})
            assert "gemini_consent" in debug
            assert "gemini_attempted" in debug
            assert "gemini_used" in debug
            assert "gemini_reason" in debug
