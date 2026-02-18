"""User entitlements endpoint."""
import logging
import time
import math

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import is_user_plus, get_subscription_by_user_id, delete_user_data
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["entitlements"])
limiter = Limiter(key_func=get_remote_address)


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
            "trial_days_remaining": None,
            "period_days_remaining": None,
        }

    return {
        "is_plus": is_plus,
        "subscription": subscription_data,
    }


@router.delete("/user/data")
@limiter.limit("3/hour")
def delete_all_user_data(
    request: Request,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Delete all user data (GDPR/CCPA data erasure).

    Removes all scans and subscription records for the authenticated user.
    This action is irreversible.

    Requires: Authorization header with valid Supabase JWT
    Rate limited to 3 requests per hour to prevent abuse.
    """
    user_id = current_user["user_id"]

    result = delete_user_data(user_id)

    logger.info(f"User {user_id} requested data deletion: {result}")

    return {
        "status": "deleted",
        "details": result
    }
