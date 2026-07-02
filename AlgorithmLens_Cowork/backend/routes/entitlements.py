"""User entitlements endpoint."""
import logging
import os
import time
import math

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import (
    is_user_plus,
    get_subscription_by_user_id,
    delete_user_data,
    delete_user_account,
    AuthUserDeletionError,
)
from auth import get_current_user, verify_supabase_jwt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["entitlements"])
limiter = Limiter(key_func=get_remote_address)


def _deletion_rate_limit_key(request: Request) -> str:
    """Rate-limit key for the deletion endpoints.

    H6 fix: keying on the raw remote IP breaks behind any TLS proxy / load
    balancer, where every user shares the proxy's IP and therefore one 3/hour
    bucket. Key on the authenticated JWT user id instead; the token is fully
    verified (issuer-pinned) before it is trusted for keying. Only when no
    valid token is present do we fall back to the client IP, honoring the
    proxy-set X-Forwarded-For header (first entry, as written by the proxy)
    over the raw socket address. Unauthenticated calls to these endpoints are
    rejected with 401 by the auth dependency anyway.
    """
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        try:
            payload = verify_supabase_jwt(token)
            return f"user:{payload['sub']}"
        except Exception:
            pass  # invalid token: fall through to IP keying; auth returns 401

    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return f"ip:{client_ip}"
    return f"ip:{get_remote_address(request)}"


def _cancel_active_stripe_subscription(user_id: str) -> bool:
    """Cancel the user's active Stripe subscription, if any, to stop future
    charges before their records are removed.

    Returns True if a cancellation was issued (or the subscription was already
    canceled in Stripe), False if there was nothing to cancel or Stripe errored.
    Never raises: a Stripe failure is logged but must not block data deletion,
    since the local record is removed and webhooks reconcile the rest.
    """
    subscription = get_subscription_by_user_id(user_id)
    if not (subscription and subscription.get("stripe_subscription_id")):
        return False

    sub_id = subscription["stripe_subscription_id"]
    try:
        # Stripe API key initialized centrally in config.init_stripe()
        stripe.Subscription.cancel(sub_id)
        logger.info(f"Canceled Stripe subscription {sub_id} for user {user_id}")
        return True
    except stripe.error.InvalidRequestError as e:
        # Subscription may already be canceled in Stripe — not an error.
        logger.info(f"Stripe subscription {sub_id} already canceled or invalid: {e}")
        return True
    except stripe.error.StripeError as e:
        logger.error(f"Failed to cancel Stripe subscription {sub_id} for user {user_id}: {e}")
        return False


@router.get("/user/entitlements")
def get_user_entitlements(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Get current user's subscription entitlements.

    Returns Plus subscription status and subscription details.
    This is the backend source of truth for entitlements.

    Requires: Authorization header with valid Supabase JWT

    Returns:
        {
            "is_plus": boolean,
            "subscription": {
                "status": string | null,
                "plan_type": "monthly" | "annual" | null,
                "trial_end": number | null,
                "current_period_end": number | null
            }
        }
    """
    user_id = current_user["user_id"]

    # Check if user has Plus subscription
    is_plus = is_user_plus(user_id)

    # Get subscription details
    subscription = get_subscription_by_user_id(user_id)

    # Build response (omit Stripe IDs for privacy)
    now = time.time()
    if subscription:
        trial_end = subscription.get("trial_end")
        period_end = subscription.get("current_period_end")
        subscription_data = {
            "status": subscription.get("status"),
            "plan_type": subscription.get("plan_type"),
            "trial_end": trial_end,
            "current_period_end": period_end,
            # H3 fix: Include cancel_at_period_end so frontend can show cancellation state
            "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            # Computed convenience fields so the frontend doesn't need to do timestamp math
            "trial_days_remaining": max(0, math.ceil((trial_end - now) / 86400)) if trial_end else None,
            "period_days_remaining": max(0, math.ceil((period_end - now) / 86400)) if period_end else None,
        }
    else:
        # No subscription record exists
        subscription_data = {
            "status": None,
            "plan_type": None,
            "trial_end": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
            "trial_days_remaining": None,
            "period_days_remaining": None,
        }

    return {
        "is_plus": is_plus,
        "subscription": subscription_data,
    }


@router.delete("/user/data")
@limiter.limit("3/hour", key_func=_deletion_rate_limit_key)
def delete_all_user_data(
    request: Request,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Delete all user data (GDPR/CCPA data erasure).

    Removes all scans and subscription records for the authenticated user.
    Also cancels any active Stripe subscription to stop future charges.
    This action is irreversible. All deletes run in one transaction and roll
    back together on failure, so data is never partially erased.

    Requires: Authorization header with valid Supabase JWT
    Rate limited to 3 requests per hour per user to prevent abuse.
    """
    user_id = current_user["user_id"]

    # C1 fix: Cancel active Stripe subscription before deleting local data.
    # Without this, the user continues to be billed after data erasure.
    stripe_canceled = _cancel_active_stripe_subscription(user_id)

    try:
        result = delete_user_data(user_id)
    except Exception as e:
        # M12 fix: the transaction rolled back, so no data was removed.
        # Surface an honest server error instead of a raw 500.
        logger.error(f"Data deletion failed for {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Data deletion failed and no data was removed. Please try again later.",
        )

    result["stripe_subscription_canceled"] = stripe_canceled

    logger.info(f"User {user_id} requested data deletion: {result}")

    return {
        "status": "deleted",
        "details": result
    }


@router.delete("/user/account")
@limiter.limit("3/hour", key_func=_deletion_rate_limit_key)
def delete_user_account_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Permanently delete the authenticated user's entire account.

    Removes the user's scans, subscriptions, and profile, then deletes the
    Supabase auth user so the account can no longer sign in (Apple Guideline
    5.1.1(v)). Cancels any active Stripe subscription first. All database
    deletes run in a single transaction and roll back together on failure, so
    an account is never partially deleted.

    The account deleted is ALWAYS the caller's own: the user_id comes only from
    the verified JWT (current_user), never from request input.

    Requires: Authorization header with valid Supabase JWT.
    Rate limited to 3 requests per hour per user to prevent abuse.
    """
    user_id = current_user["user_id"]

    # Cancel billing first so a rolled-back deletion never leaves an active
    # charge against a still-present account.
    stripe_canceled = _cancel_active_stripe_subscription(user_id)

    try:
        result = delete_user_account(user_id)
    except AuthUserDeletionError as e:
        # The DB role could not delete the auth user. The transaction rolled
        # back, so no data was removed. Surface a clear server error.
        logger.error(f"Account deletion failed at auth-user step for {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Account deletion failed and no data was removed. Please try again later.",
        )
    except Exception as e:
        logger.error(f"Account deletion failed for {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Account deletion failed and no data was removed. Please try again later.",
        )

    result["stripe_subscription_canceled"] = stripe_canceled
    logger.info(f"User {user_id} deleted their account: {result}")

    return {
        "status": "deleted",
        "details": result
    }
