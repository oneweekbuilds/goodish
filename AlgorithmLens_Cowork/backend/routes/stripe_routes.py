"""Stripe payment and subscription endpoints."""
import logging
import os

import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import (
    upsert_subscription, get_subscription_by_user_id, get_subscription_by_customer_id,
    is_user_plus, was_stripe_event_processed, mark_stripe_event_processed,
    get_recent_webhook_events
)
from auth import get_current_user
from config import is_dev_environment

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api", tags=["stripe"])


# Stripe API models and constants

ALLOWED_CHECKOUT_ORIGINS = [
    "http://localhost",
    "http://127.0.0.1",
    "https://algorithmlens.com",
    "https://www.algorithmlens.com",
]


class CreateCheckoutRequest(BaseModel):
    billingCycle: str  # 'monthly' | 'annual'
    successUrl: str
    cancelUrl: str


class CreatePortalSessionRequest(BaseModel):
    returnUrl: str


# Stripe helper functions

def get_or_create_stripe_customer(user_id: str, email: str) -> str:
    """
    Get existing Stripe customer ID for user, or create new customer.
    Returns Stripe customer ID.
    """
    # Check if user already has a Stripe customer
    subscription = get_subscription_by_user_id(user_id)
    if subscription and subscription.get("stripe_customer_id"):
        return subscription["stripe_customer_id"]

    # Create new Stripe customer
    customer = stripe.Customer.create(
        email=email,
        metadata={"supabase_user_id": user_id}
    )
    customer_id = customer.id

    # Store customer ID in database
    upsert_subscription(user_id=user_id, stripe_customer_id=customer_id)

    logger.info(f"Created new customer {customer_id} for user {user_id}")
    return customer_id


# Stripe endpoints

@router.post("/stripe/create-checkout")
@limiter.limit("5/minute")
def create_checkout_session(
    request: CreateCheckoutRequest,
    http_request: Request = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a Stripe Checkout session for Plus subscription.

    Requires: Authorization header with valid Supabase JWT
    """
    user_id = current_user["user_id"]
    email = current_user.get("email", "")

    # Validate redirect URLs against allowed origins
    for url in [request.successUrl, request.cancelUrl]:
        if not any(url.startswith(origin) for origin in ALLOWED_CHECKOUT_ORIGINS):
            raise HTTPException(status_code=400, detail="Invalid redirect URL")

    # Map billing cycle to price ID
    price_id = None
    if request.billingCycle == "monthly":
        price_id = os.getenv("STRIPE_PRICE_MONTHLY")
    elif request.billingCycle == "annual":
        price_id = os.getenv("STRIPE_PRICE_ANNUAL")
    else:
        raise HTTPException(status_code=400, detail="Invalid billingCycle. Must be 'monthly' or 'annual'.")

    if not price_id:
        raise HTTPException(status_code=500, detail="Stripe price ID not configured")

    # Get or create Stripe customer
    customer_id = get_or_create_stripe_customer(user_id, email)

    # Create Checkout Session
    # Use customer ID if available, otherwise use email (Stripe requires one, not both)
    session_params = {
        "mode": "subscription",
        "payment_method_types": ["card"],
        "line_items": [{
            "price": price_id,
            "quantity": 1,
        }],
        "subscription_data": {
            "trial_period_days": int(os.getenv("TRIAL_PERIOD_DAYS", "14")),
        },
        "success_url": request.successUrl,
        "cancel_url": request.cancelUrl,
        "client_reference_id": user_id,  # Critical: ties checkout to user
    }

    # Add either customer or customer_email (never both)
    if customer_id:
        session_params["customer"] = customer_id
        logger.info(f"Creating checkout with customer_id: present=True, using: customer")
    else:
        session_params["customer_email"] = email
        logger.info(f"Creating checkout with customer_id: present=False, using: customer_email")

    try:
        session = stripe.checkout.Session.create(**session_params)

        logger.info(f"Created checkout session {session.id} for user {user_id}")

        return {
            "sessionId": session.id,
        }

    except stripe.error.StripeError as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/stripe/create-portal-session")
def create_portal_session(
    request: CreatePortalSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a Stripe Billing Portal session so users can manage their subscription.

    Allows users to update payment methods, change plans, view invoices,
    and cancel their subscription through Stripe's hosted portal.

    Requires: Authorization header with valid Supabase JWT
    """
    user_id = current_user["user_id"]

    # Validate return_url against allowed origins
    return_url = request.returnUrl
    url_valid = any(return_url.startswith(origin) for origin in ALLOWED_CHECKOUT_ORIGINS)
    if not url_valid:
        raise HTTPException(status_code=400, detail="Invalid return URL")

    # Look up user's subscription to get Stripe customer ID
    subscription = get_subscription_by_user_id(user_id)

    if not subscription or not subscription.get("stripe_customer_id"):
        raise HTTPException(
            status_code=400,
            detail="No subscription found. Please subscribe to Plus first."
        )

    customer_id = subscription["stripe_customer_id"]

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )

        logger.info(f"Created portal session for user {user_id}, customer {customer_id}")

        return {
            "url": session.url,
        }

    except stripe.error.StripeError as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail="Failed to open subscription management")


@router.post("/stripe/verify-checkout")
def verify_checkout(current_user: dict = Depends(get_current_user)):
    """
    Verify and fulfill a completed Stripe checkout session.

    Called by the frontend after returning from Stripe checkout.
    Looks up the user's recent checkout sessions and creates the subscription
    record if payment succeeded. This acts as a webhook fallback — ensures
    the subscription is recorded even if the webhook was delayed or missed
    (common in local development).

    Requires: Authorization header with valid Supabase JWT
    """
    user_id = current_user["user_id"]

    # Check if user already has an active subscription
    if is_user_plus(user_id):
        return {"is_plus": True, "message": "Already subscribed"}

    # Look up user's Stripe customer ID from existing subscription record
    existing_sub = get_subscription_by_user_id(user_id)
    customer_id = existing_sub.get("stripe_customer_id") if existing_sub else None

    if not customer_id:
        # Try to find the customer by listing recent checkout sessions
        # Stripe allows listing sessions by client_reference_id
        try:
            sessions = stripe.checkout.Session.list(
                limit=5,
            )
            # Find sessions matching this user
            for sess in sessions.data:
                if sess.get("client_reference_id") == user_id and sess.get("status") == "complete":
                    customer_id = sess.get("customer")
                    break
        except stripe.error.StripeError as e:
            logger.error(f"Error listing checkout sessions: {e}")
            raise HTTPException(status_code=500, detail="Failed to verify checkout")

    if not customer_id:
        return {"is_plus": False, "message": "No completed checkout found"}

    # List the customer's subscriptions from Stripe
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status="all",
            limit=5,
        )
    except stripe.error.StripeError as e:
        logger.error(f"Error listing subscriptions for customer {customer_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify subscription")

    # Find an active or trialing subscription
    for sub in subscriptions.data:
        if sub["status"] in ("active", "trialing"):
            # Determine plan type
            plan_type = None
            if sub.get("items") and sub["items"]["data"]:
                price_id = sub["items"]["data"][0]["price"]["id"]
                monthly_price = os.getenv("STRIPE_PRICE_MONTHLY")
                annual_price = os.getenv("STRIPE_PRICE_ANNUAL")
                if price_id == monthly_price:
                    plan_type = "monthly"
                elif price_id == annual_price:
                    plan_type = "annual"

            # Create/update subscription record in our DB
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=sub["id"],
                status=sub["status"],
                plan_type=plan_type,
                trial_end=sub.get("trial_end"),
                current_period_end=sub.get("current_period_end"),
            )

            logger.info(f"verify-checkout: Created subscription for user {user_id}, sub {sub['id']}, status={sub['status']}")
            return {"is_plus": True, "message": "Subscription verified and activated"}

    return {"is_plus": False, "message": "No active subscription found"}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events with idempotency and robust status handling.

    Verifies webhook signature and processes subscription events.
    Deduplicates events, handles out-of-order delivery, and fetches real subscription status.
    No authentication required (signature verification instead).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        logger.error("Invalid webhook payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event["id"]
    event_type = event["type"]
    data = event["data"]["object"]

    # Check idempotency: if event already processed, return early
    if was_stripe_event_processed(event_id):
        logger.info(f"Duplicate event {event_id} ({event_type}) - already processed")
        return {"status": "duplicate_ignored"}

    logger.info(f"Received webhook: {event_type} ({event_id})")

    try:
        # Handle checkout.session.completed
        if event_type == "checkout.session.completed":
            session = data
            user_id = session.get("client_reference_id")
            customer_id = session.get("customer")
            subscription_id = session.get("subscription")

            if not user_id:
                logger.warning("checkout.session.completed missing client_reference_id")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            # Fetch real subscription status from Stripe API
            if subscription_id:
                try:
                    subscription_obj = stripe.Subscription.retrieve(subscription_id)
                    status = subscription_obj["status"]
                    trial_end = subscription_obj.get("trial_end")
                    current_period_end = subscription_obj.get("current_period_end")

                    # Determine plan type
                    plan_type = None
                    if subscription_obj.get("items") and subscription_obj["items"]["data"]:
                        price_id = subscription_obj["items"]["data"][0]["price"]["id"]
                        monthly_price = os.getenv("STRIPE_PRICE_MONTHLY")
                        annual_price = os.getenv("STRIPE_PRICE_ANNUAL")
                        if price_id == monthly_price:
                            plan_type = "monthly"
                        elif price_id == annual_price:
                            plan_type = "annual"

                    # Create subscription record with real status
                    upsert_subscription(
                        user_id=user_id,
                        stripe_customer_id=customer_id,
                        stripe_subscription_id=subscription_id,
                        status=status,
                        plan_type=plan_type,
                        trial_end=trial_end,
                        current_period_end=current_period_end,
                    )

                    logger.info(f"Checkout completed for user {user_id}, subscription {subscription_id}, status={status}")
                except stripe.error.StripeError as e:
                    logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
                    # Fallback: create with minimal data
                    upsert_subscription(
                        user_id=user_id,
                        stripe_customer_id=customer_id,
                        stripe_subscription_id=subscription_id,
                    )
            else:
                # No subscription ID (one-time payment or incomplete)
                upsert_subscription(
                    user_id=user_id,
                    stripe_customer_id=customer_id,
                )

        # Handle customer.subscription.updated
        elif event_type == "customer.subscription.updated":
            subscription = data
            subscription_id = subscription["id"]
            customer_id = subscription["customer"]
            status = subscription["status"]
            trial_end = subscription.get("trial_end")
            current_period_end = subscription.get("current_period_end")

            # Determine plan type from subscription items
            plan_type = None
            if subscription.get("items") and subscription["items"]["data"]:
                price_id = subscription["items"]["data"][0]["price"]["id"]
                monthly_price = os.getenv("STRIPE_PRICE_MONTHLY")
                annual_price = os.getenv("STRIPE_PRICE_ANNUAL")
                if price_id == monthly_price:
                    plan_type = "monthly"
                elif price_id == annual_price:
                    plan_type = "annual"

            # Lookup user by customer ID
            sub_record = get_subscription_by_customer_id(customer_id)
            if sub_record:
                user_id = sub_record["user_id"]
            else:
                # Out-of-order event: try to get user_id from metadata
                user_id = None
                try:
                    customer_obj = stripe.Customer.retrieve(customer_id)
                    user_id = customer_obj.get("metadata", {}).get("supabase_user_id")
                except stripe.error.StripeError:
                    pass

                if not user_id:
                    # Try subscription metadata
                    user_id = subscription.get("metadata", {}).get("supabase_user_id")

                if not user_id:
                    logger.warning(f"subscription.updated for unmapped customer {customer_id}")
                    mark_stripe_event_processed(event_id, event_type)
                    return {"status": "ignored_unmapped_customer"}

            # Upsert subscription record (creates if doesn't exist, updates if exists)
            upsert_subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                status=status,
                plan_type=plan_type,
                trial_end=trial_end,
                current_period_end=current_period_end,
            )

            logger.info(f"Subscription {subscription_id} updated: status={status}")

        # Handle customer.subscription.deleted
        elif event_type == "customer.subscription.deleted":
            subscription = data
            subscription_id = subscription["id"]
            customer_id = subscription["customer"]
            current_period_end = subscription.get("current_period_end")
            trial_end = subscription.get("trial_end")

            # Lookup user by customer ID
            sub_record = get_subscription_by_customer_id(customer_id)
            if not sub_record:
                logger.warning(f"subscription.deleted for unknown customer {customer_id}")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            user_id = sub_record["user_id"]

            # B1 fix: If the subscription was in a trial period, revoke access
            # immediately by setting current_period_end to now. For paid
            # cancellations, preserve the original period_end so access
            # continues until the end of the billing cycle.
            import time
            now = time.time()
            was_trial = trial_end is not None and trial_end > now

            if was_trial:
                # Trial cancellation: immediate revocation
                current_period_end = int(now)
                logger.info(f"Trial cancellation detected for user {user_id} — revoking access immediately")

            # Mark subscription as canceled
            upsert_subscription(
                user_id=user_id,
                stripe_subscription_id=subscription_id,
                status="canceled",
                current_period_end=current_period_end,
            )

            logger.info(f"Subscription {subscription_id} canceled for user {user_id}")

        # Handle invoice.payment_succeeded (B2 fix: confirms renewal, recovers from past_due)
        elif event_type == "invoice.payment_succeeded":
            invoice = data
            customer_id = invoice.get("customer")
            subscription_id = invoice.get("subscription")

            if not customer_id or not subscription_id:
                logger.info(f"invoice.payment_succeeded missing customer or subscription ID — skipping")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            # Lookup user by customer ID
            sub_record = get_subscription_by_customer_id(customer_id)
            if not sub_record:
                logger.warning(f"invoice.payment_succeeded for unknown customer {customer_id}")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            user_id = sub_record["user_id"]
            previous_status = sub_record.get("status")

            # Fetch fresh subscription details from Stripe for accurate period data
            try:
                subscription_obj = stripe.Subscription.retrieve(subscription_id)
                current_period_end = subscription_obj.get("current_period_end")
            except stripe.error.StripeError:
                current_period_end = None

            # Set status to active (this is the canonical event for "money was collected")
            upsert_subscription(
                user_id=user_id,
                stripe_subscription_id=subscription_id,
                status="active",
                current_period_end=current_period_end,
            )

            if previous_status == "past_due":
                logger.info(f"Payment succeeded for user {user_id} — recovered from past_due to active")
            else:
                logger.info(f"Payment succeeded for user {user_id}, subscription {subscription_id}")

        # Handle invoice.payment_failed
        elif event_type == "invoice.payment_failed":
            invoice = data
            customer_id = invoice.get("customer")
            subscription_id = invoice.get("subscription")

            if not customer_id or not subscription_id:
                logger.warning(f"invoice.payment_failed missing customer or subscription ID")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            # Lookup user by customer ID
            sub_record = get_subscription_by_customer_id(customer_id)
            if not sub_record:
                logger.warning(f"invoice.payment_failed for unknown customer {customer_id}")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            user_id = sub_record["user_id"]

            # Update subscription status to past_due
            upsert_subscription(
                user_id=user_id,
                stripe_subscription_id=subscription_id,
                status="past_due",
            )

            logger.info(f"Payment failed for user {user_id}, subscription {subscription_id} marked past_due")

        # Handle customer.subscription.trial_will_end (Stripe sends 3 days before trial expires)
        elif event_type == "customer.subscription.trial_will_end":
            subscription_obj = data
            customer_id = subscription_obj.get("customer")
            subscription_id = subscription_obj.get("id")
            trial_end = subscription_obj.get("trial_end")

            # Log the event for monitoring — email notification should be set up
            # via Stripe's built-in trial-ending emails or a transactional email service.
            # See MANUAL_ACTION_ITEMS.md for setup instructions.
            sub_record = get_subscription_by_customer_id(customer_id) if customer_id else None
            user_id = sub_record["user_id"] if sub_record else "unknown"
            logger.info(
                f"Trial ending soon for user {user_id}, "
                f"subscription {subscription_id}, trial_end={trial_end}"
            )

        # Handle invoice.payment_action_required (payment needs customer intervention)
        elif event_type == "invoice.payment_action_required":
            invoice = data
            customer_id = invoice.get("customer")
            subscription_id = invoice.get("subscription")

            sub_record = get_subscription_by_customer_id(customer_id) if customer_id else None
            user_id = sub_record["user_id"] if sub_record else "unknown"
            logger.warning(
                f"Payment action required for user {user_id}, "
                f"subscription {subscription_id}, customer {customer_id}"
            )

        # Handle charge.refunded — revoke Plus access when a refund is issued
        elif event_type == "charge.refunded":
            charge = data
            customer_id = charge.get("customer")

            if not customer_id:
                logger.info("charge.refunded missing customer ID — skipping")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            sub_record = get_subscription_by_customer_id(customer_id)
            if not sub_record:
                logger.warning(f"charge.refunded for unknown customer {customer_id}")
                mark_stripe_event_processed(event_id, event_type)
                return {"status": "ignored"}

            user_id = sub_record["user_id"]
            subscription_id = sub_record.get("stripe_subscription_id")

            # Revoke access — set subscription to canceled
            upsert_subscription(
                user_id=user_id,
                stripe_subscription_id=subscription_id,
                status="canceled",
            )

            logger.info(
                f"Refund processed for user {user_id}, "
                f"subscription {subscription_id} set to canceled"
            )

        else:
            # Unhandled event type — log but don't error
            logger.info(f"Unhandled webhook event type: {event_type}")

        # Mark event as processed after successful handling
        mark_stripe_event_processed(event_id, event_type)

    except Exception as e:
        logger.error(f"Error processing webhook {event_id} ({event_type}): {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "success"}


# Dev diagnostic endpoints
# SECURITY NOTE: These endpoints are gated by ENV. Empty string is NOT treated as dev,
# so if ENV is unset in production, these endpoints return 404. This is intentional.

@router.get("/dev/stripe/webhook-events")
def get_webhook_events(current_user: dict = Depends(get_current_user)):
    """
    Dev-only diagnostic endpoint: shows recent webhook events for debugging.
    Returns last 50 processed events.
    Only accessible when ENV is explicitly set to a dev value.
    Requires authentication to prevent data leaks.
    """
    if not is_dev_environment():
        raise HTTPException(status_code=404, detail="Not found")

    events = get_recent_webhook_events(limit=50)
    return {"events": events}


@router.get("/dev/subscription")
def get_dev_subscription(current_user: dict = Depends(get_current_user)):
    """
    Dev-only diagnostic endpoint: shows subscription details for authenticated user.
    Returns sanitized subscription fields (no Stripe IDs).
    Requires authentication.
    Only accessible when ENV is explicitly set to a dev value.
    """
    if not is_dev_environment():
        raise HTTPException(status_code=404, detail="Not found")

    user_id = current_user["user_id"]
    subscription = get_subscription_by_user_id(user_id)

    if not subscription:
        return {
            "status": None,
            "plan_type": None,
            "trial_end": None,
            "current_period_end": None
        }

    # Return sanitized data (no Stripe IDs)
    return {
        "status": subscription.get("status"),
        "plan_type": subscription.get("plan_type"),
        "trial_end": subscription.get("trial_end"),
        "current_period_end": subscription.get("current_period_end")
    }
