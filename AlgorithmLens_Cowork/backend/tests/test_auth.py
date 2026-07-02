"""Tests for JWT issuer pinning in auth.verify_supabase_jwt (C1 fix).

The backend must only accept tokens whose 'iss' claim exactly matches the
configured Supabase project, and must never derive the JWKS fetch URL from
token contents. conftest.py sets SUPABASE_URL=https://example.supabase.co,
so the pinned issuer in tests is https://example.supabase.co/auth/v1.
"""
import base64
import importlib.util
import json
import os
import time

import jwt as pyjwt
import pytest
from fastapi import HTTPException

import auth as auth_module
from auth import get_expected_issuer, verify_supabase_jwt

SECRET = "test-secret-key-for-tests-only"
PINNED_ISSUER = "https://example.supabase.co/auth/v1"

# Endpoint-level tests need the full app (slowapi, stripe). Skip them cleanly
# when those deps are absent so the pure auth tests still run.
_FULL_APP_DEPS = all(
    importlib.util.find_spec(mod) is not None for mod in ("slowapi", "stripe", "httpx")
)


def _make_hs256_token(iss, sub="test-user-123", secret=SECRET):
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": "test@example.com",
        "iat": now,
        "exp": now + 3600,
    }
    if iss is not None:
        payload["iss"] = iss
    return pyjwt.encode(payload, secret, algorithm="HS256")


def _b64url(obj) -> str:
    raw = json.dumps(obj).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _make_fake_es256_token(iss):
    """Build an ES256-header token with a garbage signature. The issuer check
    must reject it before any JWKS fetch is even attempted, so the signature
    never gets looked at."""
    now = int(time.time())
    header = {"alg": "ES256", "typ": "JWT", "kid": "attacker-key-id"}
    payload = {
        "sub": "victim-user-uuid",
        "iss": iss,
        "iat": now,
        "exp": now + 3600,
        "aud": "authenticated",
    }
    return f"{_b64url(header)}.{_b64url(payload)}.AAAA"


def test_expected_issuer_is_pinned_from_env():
    assert get_expected_issuer() == PINNED_ISSUER


def test_expected_issuer_defaults_to_production_project(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ISSUER", raising=False)
    assert get_expected_issuer() == (
        "https://czrehjybsqzmudtgneqy.supabase.co/auth/v1"
    )


def test_right_issuer_hs256_accepted():
    token = _make_hs256_token(PINNED_ISSUER)
    payload = verify_supabase_jwt(token)
    assert payload["sub"] == "test-user-123"


def test_wrong_issuer_hs256_rejected():
    token = _make_hs256_token("https://attacker.supabase.co/auth/v1")
    with pytest.raises(HTTPException) as exc:
        verify_supabase_jwt(token)
    assert exc.value.status_code == 401
    assert "issuer" in exc.value.detail.lower()


def test_missing_issuer_rejected():
    token = _make_hs256_token(None)
    with pytest.raises(HTTPException) as exc:
        verify_supabase_jwt(token)
    assert exc.value.status_code == 401


def test_wrong_issuer_es256_rejected_before_jwks_fetch(monkeypatch):
    """The attack from the audit: attacker-issued ES256 token pointing at the
    attacker's own issuer/JWKS with a victim sub. Must be rejected by the
    issuer pin BEFORE any JWKS client is created or fetched."""

    def _fail(*args, **kwargs):
        raise AssertionError("JWKS client must not be created for a foreign issuer")

    monkeypatch.setattr(auth_module, "get_jwks_client", _fail)

    token = _make_fake_es256_token("https://attacker-project.supabase.co/auth/v1")
    with pytest.raises(HTTPException) as exc:
        verify_supabase_jwt(token)
    assert exc.value.status_code == 401
    assert "issuer" in exc.value.detail.lower()


def test_issuer_with_trailing_difference_rejected():
    # Exact match required: prefix or suffix variants must not pass.
    for iss in (
        PINNED_ISSUER + "/",
        PINNED_ISSUER + ".attacker.com/auth/v1",
        "https://example.supabase.co.evil.com/auth/v1",
    ):
        token = _make_hs256_token(iss)
        with pytest.raises(HTTPException) as exc:
            verify_supabase_jwt(token)
        assert exc.value.status_code == 401


@pytest.mark.skipif(not _FULL_APP_DEPS, reason="full app deps not installed")
def test_endpoint_rejects_wrong_issuer_token(client):
    token = _make_hs256_token("https://attacker.supabase.co/auth/v1")
    response = client.get(
        "/api/user/entitlements",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


@pytest.mark.skipif(not _FULL_APP_DEPS, reason="full app deps not installed")
def test_endpoint_accepts_right_issuer_token(client):
    token = _make_hs256_token(PINNED_ISSUER)
    response = client.get(
        "/api/user/entitlements",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
