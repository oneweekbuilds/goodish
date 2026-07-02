"""Gemini proxy endpoint (proxy-readiness for the mobile app).

POST /api/analyze lets the mobile app call Gemini generateContent through the
backend so the Gemini API key no longer ships inside the app bundle. The
endpoint is code-complete but not yet live (backend hosting pending); when it
is deployed, mobile cutover is a URL swap.

Request contract (mirrors the mobile unified client,
mobile/src/lib/analysis/geminiClient.ts):

    POST /api/analyze
    Authorization: Bearer <Supabase JWT>   (same auth as every other endpoint)
    Content-Type: application/json
    {
        "model": "gemini-2.0-flash",             # required, allowlisted
        "contents": [{"role": "user", "parts": [...]}],   # required, non-empty
        "generationConfig": {...},               # optional, dict, passed through
        "systemInstruction": {"parts": [...]}    # optional, dict, passed through
    }

The body pieces other than "model" are forwarded VERBATIM to
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
with the server-side GEMINI_API_KEY sent in the x-goog-api-key header (never in
the URL, so it cannot leak into access logs).

Response / error mapping (ONE consistent scheme):
    - Upstream 2xx  -> upstream status code and JSON body passed through as-is.
    - Upstream non-2xx (400/429/5xx/...) -> 502 with body:
          {"error": {"source": "upstream", "status": <upstream status>},
           "detail": <upstream response body, JSON if parseable else text>}
    - Upstream network failure (no HTTP response) -> 502 with
          {"error": {"source": "upstream", "status": null}, "detail": "..."}
    - Upstream timeout (ANALYZE_UPSTREAM_TIMEOUT_SECONDS, default 60s) -> 504.
    - GEMINI_API_KEY not configured -> 503 {"detail": "..."} (never a crash).
    - Missing Authorization header -> 403, invalid/expired token -> 401
      (identical to every other authenticated endpoint: HTTPBearer +
      get_current_user).
    - Per-user sliding-window rate limit exceeded -> 429 with Retry-After
      header (seconds).
    - Invalid body (bad JSON, unknown model, empty contents, wrong types)
      -> 400. Oversized body (> ANALYZE_MAX_BODY_BYTES, default 20MB) -> 413.

Rate limiting: the repo's existing slowapi limiters are keyed by remote IP and
do not emit Retry-After, so this module uses a small in-memory per-user
sliding-window limiter (no new dependencies, no redis) keyed on the VERIFIED
JWT user id: ANALYZE_RATE_LIMIT_PER_MINUTE requests (default 10) per rolling
60 seconds per user.

Privacy: request contents (user feed text / screenshots) are NEVER logged.
Logs carry only user id, model, byte sizes, upstream status, and latency.

Environment variables:
    GEMINI_API_KEY                   server-side Gemini key (required to serve;
                                     absent -> 503, never logged)
    GEMINI_ALLOWED_MODELS            comma-separated allowlist
                                     (default: "gemini-2.0-flash")
    ANALYZE_RATE_LIMIT_PER_MINUTE    per-user request budget (default: 10)
    ANALYZE_UPSTREAM_TIMEOUT_SECONDS upstream timeout (default: 60)
    ANALYZE_MAX_BODY_BYTES           max request body size (default: 20971520)
"""
import json
import logging
import math
import os
import threading
import time
from collections import deque
from typing import Any, Dict, Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analyze"])

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Defaults (each overridable via the env vars documented in the module docstring)
DEFAULT_ALLOWED_MODELS = "gemini-2.0-flash"  # mobile GEMINI_MODEL (geminiClient.ts)
DEFAULT_RATE_LIMIT_PER_MINUTE = 10
DEFAULT_UPSTREAM_TIMEOUT_SECONDS = 60.0
DEFAULT_MAX_BODY_BYTES = 20 * 1024 * 1024  # ~20MB, sized for Gemini image payloads

RATE_WINDOW_SECONDS = 60.0


def _get_allowed_models() -> set:
    """Allowlisted Gemini model names (comma-separated env override)."""
    raw = os.getenv("GEMINI_ALLOWED_MODELS", DEFAULT_ALLOWED_MODELS)
    return {m.strip() for m in raw.split(",") if m.strip()}


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
        return value if value > 0 else default
    except ValueError:
        logger.warning(f"[analyze] Invalid {name}={raw!r}; using default {default}")
        return default


def _get_rate_limit_per_minute() -> int:
    return _get_int_env("ANALYZE_RATE_LIMIT_PER_MINUTE", DEFAULT_RATE_LIMIT_PER_MINUTE)


def _get_max_body_bytes() -> int:
    return _get_int_env("ANALYZE_MAX_BODY_BYTES", DEFAULT_MAX_BODY_BYTES)


def _get_upstream_timeout_seconds() -> float:
    raw = os.getenv("ANALYZE_UPSTREAM_TIMEOUT_SECONDS")
    if raw is None:
        return DEFAULT_UPSTREAM_TIMEOUT_SECONDS
    try:
        value = float(raw)
        return value if value > 0 else DEFAULT_UPSTREAM_TIMEOUT_SECONDS
    except ValueError:
        logger.warning(
            f"[analyze] Invalid ANALYZE_UPSTREAM_TIMEOUT_SECONDS={raw!r}; "
            f"using default {DEFAULT_UPSTREAM_TIMEOUT_SECONDS}"
        )
        return DEFAULT_UPSTREAM_TIMEOUT_SECONDS


class SlidingWindowRateLimiter:
    """In-memory per-key sliding-window rate limiter.

    Keyed on the verified JWT user id (the repo's slowapi limiters key on
    remote IP, which collapses all users behind one proxy into a single
    bucket and cannot emit Retry-After). Thread-safe; suitable for a single
    process, which is how this backend runs.
    """

    def __init__(self, window_seconds: float = RATE_WINDOW_SECONDS):
        self._window_seconds = window_seconds
        self._lock = threading.Lock()
        self._hits: Dict[str, deque] = {}

    def check(self, key: str, limit: int, now: Optional[float] = None) -> Tuple[bool, int]:
        """Record a hit for `key` if under `limit`.

        Returns (allowed, retry_after_seconds). retry_after_seconds is 0 when
        allowed, otherwise the whole seconds until the oldest hit in the
        window expires (minimum 1).
        """
        if now is None:
            now = time.monotonic()
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            cutoff = now - self._window_seconds
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= limit:
                retry_after = max(1, math.ceil(self._window_seconds - (now - hits[0])))
                return False, retry_after
            hits.append(now)
            return True, 0

    def reset(self) -> None:
        """Clear all buckets (used by tests for isolation)."""
        with self._lock:
            self._hits.clear()


_rate_limiter = SlidingWindowRateLimiter()


async def _post_generate_content(
    url: str,
    payload: Dict[str, Any],
    api_key: str,
    timeout_seconds: float,
) -> httpx.Response:
    """Perform the upstream Gemini HTTP call (patched in tests)."""
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        return await client.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                # Key goes in a header, not the query string, so it never
                # appears in URLs, access logs, or tracebacks.
                "x-goog-api-key": api_key,
            },
        )


def _upstream_error_detail(response: httpx.Response) -> Any:
    """Extract the upstream error body as JSON when possible, else text."""
    try:
        return response.json()
    except Exception:
        # Cap pathological non-JSON bodies; Gemini error bodies are small JSON.
        return response.text[:4096]


@router.post("/analyze")
async def analyze(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> JSONResponse:
    """Proxy a Gemini generateContent call for the authenticated mobile user.

    See the module docstring for the full request/response contract, the
    error-mapping scheme, and the env vars involved. Request contents are
    never logged.
    """
    user_id = current_user["user_id"]

    # --- Per-user rate limit (429 + Retry-After) ---
    limit = _get_rate_limit_per_minute()
    allowed, retry_after = _rate_limiter.check(f"user:{user_id}", limit)
    if not allowed:
        logger.info(f"[analyze] rate limited user={user_id} limit={limit}/min")
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {limit} requests per minute",
            headers={"Retry-After": str(retry_after)},
        )

    # --- Body size (413) ---
    max_bytes = _get_max_body_bytes()
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > max_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=f"Request body too large (max {max_bytes} bytes)",
                )
        except ValueError:
            pass  # malformed header; fall through to the actual-size check
    raw_body = await request.body()
    if len(raw_body) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Request body too large (max {max_bytes} bytes)",
        )

    # --- Parse and validate (400) ---
    try:
        body = json.loads(raw_body)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Request body must be valid JSON")
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")

    model = body.get("model")
    allowed_models = _get_allowed_models()
    if not isinstance(model, str) or model not in allowed_models:
        raise HTTPException(
            status_code=400,
            detail=f"Model not allowed. Allowed models: {sorted(allowed_models)}",
        )

    contents = body.get("contents")
    if not isinstance(contents, list) or len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail="'contents' must be a non-empty list",
        )

    generation_config = body.get("generationConfig")
    if generation_config is not None and not isinstance(generation_config, dict):
        raise HTTPException(
            status_code=400,
            detail="'generationConfig' must be an object when provided",
        )

    system_instruction = body.get("systemInstruction")
    if system_instruction is not None and not isinstance(system_instruction, dict):
        raise HTTPException(
            status_code=400,
            detail="'systemInstruction' must be an object when provided",
        )

    # --- Server-side key (503 when not configured; value never logged) ---
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("[analyze] GEMINI_API_KEY is not configured; returning 503")
        raise HTTPException(
            status_code=503,
            detail="Analysis service is not configured (missing Gemini API key)",
        )

    # --- Forward verbatim (model rides in the URL, as Gemini expects) ---
    upstream_payload: Dict[str, Any] = {"contents": contents}
    if generation_config is not None:
        upstream_payload["generationConfig"] = generation_config
    if system_instruction is not None:
        upstream_payload["systemInstruction"] = system_instruction

    url = f"{GEMINI_API_BASE_URL}/{model}:generateContent"
    timeout_seconds = _get_upstream_timeout_seconds()
    started = time.monotonic()

    try:
        upstream = await _post_generate_content(url, upstream_payload, api_key, timeout_seconds)
    except httpx.TimeoutException:
        latency_ms = int((time.monotonic() - started) * 1000)
        logger.warning(
            f"[analyze] upstream timeout user={user_id} model={model} "
            f"req_bytes={len(raw_body)} timeout_s={timeout_seconds} latency_ms={latency_ms}"
        )
        raise HTTPException(status_code=504, detail="Upstream Gemini request timed out")
    except httpx.HTTPError as e:
        latency_ms = int((time.monotonic() - started) * 1000)
        logger.warning(
            f"[analyze] upstream network error user={user_id} model={model} "
            f"req_bytes={len(raw_body)} latency_ms={latency_ms} error={type(e).__name__}"
        )
        return JSONResponse(
            status_code=502,
            content={
                "error": {"source": "upstream", "status": None},
                "detail": f"Upstream request failed: {type(e).__name__}",
            },
        )

    latency_ms = int((time.monotonic() - started) * 1000)
    logger.info(
        f"[analyze] user={user_id} model={model} req_bytes={len(raw_body)} "
        f"upstream_status={upstream.status_code} resp_bytes={len(upstream.content)} "
        f"latency_ms={latency_ms}"
    )

    if 200 <= upstream.status_code < 300:
        try:
            return JSONResponse(status_code=upstream.status_code, content=upstream.json())
        except Exception:
            # A 2xx that is not JSON is malformed for generateContent; report
            # it with the same upstream-error scheme rather than crashing.
            return JSONResponse(
                status_code=502,
                content={
                    "error": {"source": "upstream", "status": upstream.status_code},
                    "detail": "Upstream returned a non-JSON success response",
                },
            )

    # Upstream 4xx/5xx: single consistent mapping to 502 (see module docstring).
    return JSONResponse(
        status_code=502,
        content={
            "error": {"source": "upstream", "status": upstream.status_code},
            "detail": _upstream_error_detail(upstream),
        },
    )
