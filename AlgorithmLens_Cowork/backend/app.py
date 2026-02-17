"""
AlgorithmLens Backend API

Main application entry point. Routes are organized in separate modules:
- routes/health.py: Health checks and system status
- routes/scans.py: Scan management (upload, list, retrieve, delete, status)
- routes/evidence_bundles.py: Evidence bundle endpoints for all tabs
- routes/stripe_routes.py: Stripe payment and subscription
- routes/entitlements.py: User entitlements

API Versioning Plan:
    Current: All routes at /api/ prefix
    Future: Will support /api/v1/ prefix for versioning while keeping /api/ for backward compatibility
    No breaking changes planned - new versions will be additive
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables from .env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# Import database initialization
from database import init_database
from auth import get_jwt_secret
from config import is_dev_environment

# Import route modules
from routes import health, scans, evidence_bundles, stripe_routes, entitlements, trends

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(name)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter — keyed by remote IP address
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    # Startup logic
    init_database()

    # Verify JWT secret is set (fail loudly in dev if missing)
    is_dev = is_dev_environment()
    if is_dev:
        try:
            get_jwt_secret()
            logger.info("SUPABASE_JWT_SECRET is set")
        except RuntimeError as e:
            logger.error(f"STARTUP ERROR: {e}")
            raise

        # Verify Stripe environment variables (fail loudly in dev if missing)
        required_stripe_vars = [
            "STRIPE_SECRET_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "STRIPE_PRICE_MONTHLY",
            "STRIPE_PRICE_ANNUAL",
        ]
        missing_vars = [var for var in required_stripe_vars if not os.getenv(var)]
        if missing_vars:
            error_msg = f"Missing required Stripe environment variables: {', '.join(missing_vars)}"
            logger.error(f"STARTUP ERROR: {error_msg}")
            raise RuntimeError(error_msg)

        # Initialize Stripe with secret key
        import stripe
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        logger.info("Stripe API configured")

    yield

    # Shutdown logic (if needed in the future)


# Create FastAPI app
app = FastAPI(title="AlgorithmLens Backend", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS configuration - restrictive by default, permissive only when ENV is explicitly set to dev
_is_dev = is_dev_environment()
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
] if _is_dev else [
    "https://algorithmlens.com",
    "https://www.algorithmlens.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    if not _is_dev:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.supabase.co"
    return response


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler that catches unhandled exceptions,
    logs them with proper context, and returns a consistent JSON error response.
    """
    is_dev = is_dev_environment()

    # Log the error with full context
    logger.exception(f"Unhandled exception in {request.method} {request.url.path}")

    # Return appropriate error response
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if is_dev else "An unexpected error occurred"
        }
    )


# Include route modules
app.include_router(health.router)
app.include_router(scans.router)
app.include_router(evidence_bundles.router)
app.include_router(stripe_routes.router)
app.include_router(entitlements.router)
app.include_router(trends.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
