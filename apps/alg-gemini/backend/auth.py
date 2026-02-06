"""
Authentication utilities for Supabase JWT verification.

Provides FastAPI dependencies to verify Supabase JWTs and extract user info.
"""
import os
import jwt
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

# Security scheme for Bearer token
security = HTTPBearer()

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


def verify_supabase_jwt(token: str) -> dict:
    """
    Verify and decode a Supabase JWT.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        secret = get_jwt_secret()

        # Decode and verify JWT
        # Supabase uses HS256 (HMAC with SHA-256)
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "verify_exp": True,  # Verify expiration
                "verify_iat": True,  # Verify issued at
            }
        )

        # Validate required claims
        if "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing 'sub' claim",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
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
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security, auto_error=False)
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
