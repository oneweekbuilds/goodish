"""Tests for the Gemini proxy endpoint (POST /api/analyze).

The upstream HTTP call is always mocked (routes.analyze._post_generate_content)
so no test touches the network.
"""
import json
import os
import time
from unittest.mock import AsyncMock, patch

import httpx
import jwt
import pytest
from fastapi.testclient import TestClient

from routes import analyze as analyze_module


GEMINI_URL_PREFIX = "https://generativelanguage.googleapis.com/v1beta/models"


def _valid_body() -> dict:
    """Request body shaped exactly like the mobile unified client builds it."""
    return {
        "model": "gemini-2.0-flash",
        "contents": [{"role": "user", "parts": [{"text": "classify this feed item"}]}],
        "generationConfig": {
            "temperature": 0,
            "topP": 0.8,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }


def _upstream_success() -> dict:
    return {
        "candidates": [
            {
                "content": {"parts": [{"text": "{\"label\": \"neutral\"}"}]},
                "finishReason": "STOP",
            }
        ]
    }


def _make_token(sub: str) -> str:
    """Mint an HS256 token for an arbitrary user (matches conftest pinning)."""
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": f"{sub}@example.com",
        "iss": "https://example.supabase.co/auth/v1",
        "iat": now,
        "exp": now + 3600,
    }
    return jwt.encode(payload, os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")


@pytest.fixture(autouse=True)
def analyze_env(monkeypatch):
    """Configure the proxy and reset the rate limiter for each test."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.delenv("GEMINI_ALLOWED_MODELS", raising=False)
    monkeypatch.delenv("ANALYZE_RATE_LIMIT_PER_MINUTE", raising=False)
    monkeypatch.delenv("ANALYZE_MAX_BODY_BYTES", raising=False)
    monkeypatch.delenv("ANALYZE_UPSTREAM_TIMEOUT_SECONDS", raising=False)
    analyze_module._rate_limiter.reset()
    yield
    analyze_module._rate_limiter.reset()


@pytest.fixture
def auth_headers(valid_token: str) -> dict:
    return {"Authorization": f"Bearer {valid_token}"}


class TestAnalyzeAuth:
    """Authentication behavior (same dependency as all other endpoints)."""

    def test_missing_auth_header_rejected(self, client: TestClient):
        response = client.post("/api/analyze", json=_valid_body())
        # HTTPBearer rejects a missing Authorization header before our code
        # runs (matching every other authenticated endpoint).
        assert response.status_code == 401

    def test_invalid_token_rejected_401(self, client: TestClient):
        response = client.post(
            "/api/analyze",
            json=_valid_body(),
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert response.status_code == 401

    def test_wrong_issuer_token_rejected_401(self, client: TestClient):
        now = int(time.time())
        token = jwt.encode(
            {
                "sub": "attacker",
                "iss": "https://attacker.supabase.co/auth/v1",
                "iat": now,
                "exp": now + 3600,
            },
            os.environ["SUPABASE_JWT_SECRET"],
            algorithm="HS256",
        )
        response = client.post(
            "/api/analyze",
            json=_valid_body(),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401


class TestAnalyzeHappyPath:
    """Successful proxying of the mobile client's request shape."""

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_returns_upstream_json(self, mock_post, client: TestClient, auth_headers):
        mock_post.return_value = httpx.Response(200, json=_upstream_success())

        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == _upstream_success()

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_forwards_payload_verbatim_with_server_key(
        self, mock_post, client: TestClient, auth_headers
    ):
        mock_post.return_value = httpx.Response(200, json=_upstream_success())
        body = _valid_body()
        body["systemInstruction"] = {"parts": [{"text": "You are a classifier."}]}

        response = client.post("/api/analyze", json=body, headers=auth_headers)

        assert response.status_code == 200
        mock_post.assert_awaited_once()
        url, payload, api_key, timeout_seconds = mock_post.await_args.args
        assert url == f"{GEMINI_URL_PREFIX}/gemini-2.0-flash:generateContent"
        # contents/generationConfig/systemInstruction pass through verbatim;
        # model rides in the URL, not the payload.
        assert payload == {
            "contents": body["contents"],
            "generationConfig": body["generationConfig"],
            "systemInstruction": body["systemInstruction"],
        }
        assert api_key == "test-gemini-key"
        assert timeout_seconds == 60.0

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_generation_config_optional(self, mock_post, client: TestClient, auth_headers):
        mock_post.return_value = httpx.Response(200, json=_upstream_success())
        body = {
            "model": "gemini-2.0-flash",
            "contents": [{"role": "user", "parts": [{"text": "hello"}]}],
        }

        response = client.post("/api/analyze", json=body, headers=auth_headers)

        assert response.status_code == 200
        _, payload, _, _ = mock_post.await_args.args
        assert payload == {"contents": body["contents"]}


class TestAnalyzeValidation:
    """400/413 request validation."""

    def test_model_not_allowlisted(self, client: TestClient, auth_headers):
        body = _valid_body()
        body["model"] = "gemini-1.5-pro"
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 400
        assert "gemini-2.0-flash" in response.json()["detail"]

    def test_missing_model(self, client: TestClient, auth_headers):
        body = _valid_body()
        del body["model"]
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 400

    def test_env_extends_allowlist(self, client: TestClient, auth_headers, monkeypatch):
        monkeypatch.setenv("GEMINI_ALLOWED_MODELS", "gemini-2.0-flash,gemini-2.0-flash-lite")
        body = _valid_body()
        body["model"] = "gemini-2.0-flash-lite"
        with patch(
            "routes.analyze._post_generate_content", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = httpx.Response(200, json=_upstream_success())
            response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 200

    def test_empty_contents(self, client: TestClient, auth_headers):
        body = _valid_body()
        body["contents"] = []
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 400
        assert "contents" in response.json()["detail"]

    def test_contents_wrong_type(self, client: TestClient, auth_headers):
        body = _valid_body()
        body["contents"] = "not a list"
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 400

    def test_generation_config_wrong_type(self, client: TestClient, auth_headers):
        body = _valid_body()
        body["generationConfig"] = ["not", "a", "dict"]
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 400

    def test_invalid_json_body(self, client: TestClient, auth_headers):
        response = client.post(
            "/api/analyze",
            content=b"{not json",
            headers={**auth_headers, "Content-Type": "application/json"},
        )
        assert response.status_code == 400

    def test_oversized_body_413(self, client: TestClient, auth_headers, monkeypatch):
        monkeypatch.setenv("ANALYZE_MAX_BODY_BYTES", "200")
        body = _valid_body()
        body["contents"][0]["parts"][0]["text"] = "x" * 500
        response = client.post("/api/analyze", json=body, headers=auth_headers)
        assert response.status_code == 413


class TestAnalyzeServiceConfig:
    """503 when the server-side key is not configured."""

    def test_missing_api_key_returns_503(self, client: TestClient, auth_headers, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"]


class TestAnalyzeRateLimit:
    """Per-user sliding-window limit: 429 + Retry-After."""

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_429_after_limit_with_retry_after(
        self, mock_post, client: TestClient, auth_headers, monkeypatch
    ):
        monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "3")
        mock_post.return_value = httpx.Response(200, json=_upstream_success())

        for _ in range(3):
            response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
            assert response.status_code == 200

        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 429
        retry_after = int(response.headers["Retry-After"])
        assert 1 <= retry_after <= 60
        # The rate-limited request never reached upstream
        assert mock_post.await_count == 3

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_buckets_are_per_user(self, mock_post, client: TestClient, monkeypatch):
        monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "1")
        mock_post.return_value = httpx.Response(200, json=_upstream_success())

        headers_a = {"Authorization": f"Bearer {_make_token('user-a')}"}
        headers_b = {"Authorization": f"Bearer {_make_token('user-b')}"}

        assert client.post("/api/analyze", json=_valid_body(), headers=headers_a).status_code == 200
        # user-a exhausted their budget...
        assert client.post("/api/analyze", json=_valid_body(), headers=headers_a).status_code == 429
        # ...but user-b has their own bucket
        assert client.post("/api/analyze", json=_valid_body(), headers=headers_b).status_code == 200

    def test_sliding_window_frees_slots(self):
        limiter = analyze_module.SlidingWindowRateLimiter(window_seconds=60.0)
        assert limiter.check("u", 2, now=0.0) == (True, 0)
        assert limiter.check("u", 2, now=1.0) == (True, 0)
        allowed, retry_after = limiter.check("u", 2, now=2.0)
        assert allowed is False
        assert retry_after == 58
        # After the first hit ages out of the window, a slot frees up
        assert limiter.check("u", 2, now=61.0) == (True, 0)


class TestAnalyzeUpstreamErrors:
    """Consistent 502/504 mapping of upstream failures."""

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_upstream_400_maps_to_502(self, mock_post, client: TestClient, auth_headers):
        upstream_body = {"error": {"code": 400, "message": "Invalid argument"}}
        mock_post.return_value = httpx.Response(400, json=upstream_body)

        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)

        assert response.status_code == 502
        data = response.json()
        assert data["error"] == {"source": "upstream", "status": 400}
        assert data["detail"] == upstream_body

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_upstream_429_maps_to_502(self, mock_post, client: TestClient, auth_headers):
        mock_post.return_value = httpx.Response(
            429, json={"error": {"code": 429, "message": "Resource exhausted"}}
        )
        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 502
        assert response.json()["error"] == {"source": "upstream", "status": 429}

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_upstream_500_maps_to_502(self, mock_post, client: TestClient, auth_headers):
        mock_post.return_value = httpx.Response(500, text="internal error")
        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 502
        data = response.json()
        assert data["error"] == {"source": "upstream", "status": 500}
        assert "internal error" in json.dumps(data["detail"])

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_upstream_timeout_maps_to_504(self, mock_post, client: TestClient, auth_headers):
        mock_post.side_effect = httpx.ReadTimeout("timed out")
        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 504
        assert "timed out" in response.json()["detail"]

    @patch("routes.analyze._post_generate_content", new_callable=AsyncMock)
    def test_upstream_network_error_maps_to_502(self, mock_post, client: TestClient, auth_headers):
        mock_post.side_effect = httpx.ConnectError("connection refused")
        response = client.post("/api/analyze", json=_valid_body(), headers=auth_headers)
        assert response.status_code == 502
        data = response.json()
        assert data["error"] == {"source": "upstream", "status": None}
