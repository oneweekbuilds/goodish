"""
Authentication utilities for Supabase JWT verification.

Provides FastAPI dependencies to verify Supabase JWTs and extract user info.
"""
import os
import logging
import jwt
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from jwt import PyJWKClient
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

# JWKS cache with TTL
_jwks_cache = {}
_jwks_cache_ttl = timedelta(minutes=10)

def get_jwt_secret() -> str:
    """
    Get JWT secret from environment.

    Raises:
        RuntimeError: If SUPABASE_JWT_SECRET is not set
    """
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise RuntimeError(
            "SUPABASE_JWT_SECRET environment variable is required but not set. "
            "Get this from: Supabase Dashboard → Project Settings → API → JWT Secret"
        )
    return secret


def get_jwks_client(issuer: str) -> PyJWKClient:
    """
    Get or create a PyJWKClient for the given issuer.

    Uses in-memory cache with TTL to avoid fetching JWKS on every request.

    Args:
        issuer: The token issuer URL (e.g., https://xyz.supabase.co/auth/v1)

    Returns:
        PyJWKClient instance for fetching signing keys
    """
    cache_key = issuer
    now = datetime.now(timezone.utc)

    # Check cache
    if cache_key in _jwks_cache:
        client, cached_at = _jwks_cache[cache_key]
        if now - cached_at < _jwks_cache_ttl:
            return client

    # Parse issuer to get JWKS URL
    # Supabase issuer format: https://<project-ref>.supabase.co/auth/v1
    parsed = urlparse(issuer)
    jwks_url = f"{parsed.scheme}://{parsed.netloc}/auth/v1/.well-known/jwks.json"

    # Create new client with caching
    client = PyJWKClient(jwks_url, cache_keys=True, max_cached_keys=10)
    _jwks_cache[cache_key] = (client, now)

    return client


def verify_supabase_jwt(token: str) -> dict:
    """
    Verify and decode a Supabase JWT using JWKS.

    Supports ES256 and RS256 algorithms (standard for Supabase).
    Falls back to HS256 with SUPABASE_JWT_SECRET if needed.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    # Variables for debug logging
    algorithm = None
    kid = None
    issuer = None
    jwks_attempted = False
    jwks_success = False

    try:
        # First, decode header to get algorithm and kid
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg")
        kid = unverified_header.get("kid")

        # Decode payload to get issuer (without verification yet)
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified_payload.get("iss")

        if not issuer:
            logger.warning(f"[AUTH VERIFY FAIL] Missing iss claim | alg={algorithm} kid={kid}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing 'iss' claim",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify using JWKS for ES256/RS256 (modern Supabase tokens)
        if algorithm in ["ES256", "RS256"] and kid:
            try:
                jwks_attempted = True
                jwks_client = get_jwks_client(issuer)
                jwks_success = True
                signing_key = jwks_client.get_signing_key_from_jwt(token)

                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    options={
                        "verify_exp": True,
                        "verify_iat": True,
                    },
                    # Verify issuer matches
                    issuer=issuer,
                    # Accept standard Supabase audiences
                    audience=["authenticated", "anon"],
                )
            except Exception as e:
                logger.warning(f"[AUTH VERIFY FAIL] JWKS verification error | alg={algorithm} kid={kid} iss={issuer} jwks_attempted={jwks_attempted} jwks_success={jwks_success} | {type(e).__name__}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"JWKS verification failed: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # Fallback to HS256 with shared secret (legacy/service role tokens)
        elif algorithm == "HS256":
            try:
                secret = get_jwt_secret()
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    options={
                        "verify_exp": True,
                        "verify_iat": True,
                    }
                )
            except Exception as e:
                logger.warning(f"[AUTH VERIFY FAIL] HS256 verification error | alg={algorithm} kid={kid} iss={issuer} | {type(e).__name__}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"HS256 verification failed: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        else:
            logger.warning(f"[AUTH VERIFY FAIL] Unsupported algorithm | alg={algorithm} kid={kid} iss={issuer}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unsupported algorithm: {algorithm}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Validate required claims
        if "sub" not in payload:
            logger.warning(f"[AUTH VERIFY FAIL] Missing sub claim | alg={algorithm} kid={kid} iss={issuer}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing 'sub' claim",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except jwt.ExpiredSignatureError as e:
        logger.warning(f"[AUTH VERIFY FAIL] Token expired | alg={algorithm} kid={kid} iss={issuer} | {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"[AUTH VERIFY FAIL] Invalid token | alg={algorithm} kid={kid} iss={issuer} | {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        # Re-raise HTTPExceptions as-is (already logged above)
        raise
    except Exception as e:
        logger.warning(f"[AUTH VERIFY FAIL] Unexpected error | alg={algorithm} kid={kid} iss={issuer} | {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    FastAPI dependency to get current authenticated user.

    Extracts and verifies JWT from Authorization header.

    Returns:
        dict with keys:
            - user_id: Supabase user UUID (from 'sub' claim)
            - email: User email (from 'email' claim, if present)

    Raises:
        HTTPException: 401 if token is missing or invalid

    Usage:
        @app.get("/api/scans")
        def list_scans(current_user: dict = Depends(get_current_user)):
            user_id = current_user["user_id"]
            ...
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_supabase_jwt(token)

    return {
        "user_id": payload["sub"],
        "email": payload.get("email"),
    }


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_optional)
) -> Optional[dict]:
    """
    FastAPI dependency to optionally get authenticated user.

    Like get_current_user but returns None instead of raising 401.
    Useful for endpoints that support both authenticated and anonymous access.

    Returns:
        dict with user_id and email, or None if no valid token
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = verify_supabase_jwt(token)
        return {
            "user_id": payload["sub"],
            "email": payload.get("email"),
        }
    except HTTPException:
        return None
