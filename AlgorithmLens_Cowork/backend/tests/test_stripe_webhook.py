"""Tests for Stripe webhook endpoint."""
import os
import time
from unittest.mock import patch, MagicMock

import pytest
import stripe
from fastapi.testclient import TestClient

import database


def _make_webhook_event(event_id: str, event_type: str, data_object: dict) -> dict:
    """Helper to create a mock Stripe webhook event."""
    return {
        "id": event_id,
        "type": event_type,
        "data": {"object": data_object}
    }


class TestStripeWebhookCheckoutCompleted:
    """Test checkout.session.completed webhook event."""

    @patch("routes.stripe_routes.stripe.Subscription.retrieve")
    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_checkout_completed_creates_subscription(self, mock_construct, mock_retrieve, client: TestClient, sample_subscription_data: dict):
        """Test checkout.session.completed creates subscription record."""
        event_id = "evt_checkout_complete_1"
        event = _make_webhook_event(event_id, "checkout.session.completed", {
            "client_reference_id": "test-user-123",
            "customer": "cus_test123",
            "subscription": "sub_test123",
        })

        mock_construct.return_value = event
        mock_retrieve.return_value = {
            "status": "trialing",
            "trial_end": 1735689600,
            "current_period_end": 1735689600,
            "items": {"data": [{"price": {"id": "price_test_monthly"}}]},
        }

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

        # Verify subscription was created
        subscription = database.get_subscription_by_user_id("test-user-123")
        assert subscription is not None
        assert subscription["stripe_subscription_id"] == "sub_test123"
        assert subscription["status"] == "trialing"

    @patch("routes.stripe_routes.stripe.Subscription.retrieve")
    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_checkout_completed_sets_plan_type_monthly(self, mock_construct, mock_retrieve, client: TestClient):
        """Test checkout.session.completed sets plan_type to monthly."""
        event_id = "evt_checkout_monthly_1"
        event = _make_webhook_event(event_id, "checkout.session.completed", {
            "client_reference_id": "test-user-456",
            "customer": "cus_test456",
            "subscription": "sub_test456",
        })

        mock_construct.return_value = event
        mock_retrieve.return_value = {
            "status": "active",
            "trial_end": None,
            "current_period_end": 1735689600,
            "items": {"data": [{"price": {"id": os.getenv("STRIPE_PRICE_MONTHLY")}}]},
        }

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-456")
        assert subscription is not None
        assert subscription["plan_type"] == "monthly"

    @patch("routes.stripe_routes.stripe.Subscription.retrieve")
    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_checkout_completed_sets_plan_type_annual(self, mock_construct, mock_retrieve, client: TestClient):
        """Test checkout.session.completed sets plan_type to annual."""
        event_id = "evt_checkout_annual_1"
        event = _make_webhook_event(event_id, "checkout.session.completed", {
            "client_reference_id": "test-user-789",
            "customer": "cus_test789",
            "subscription": "sub_test789",
        })

        mock_construct.return_value = event
        mock_retrieve.return_value = {
            "status": "active",
            "trial_end": None,
            "current_period_end": 1767225600,
            "items": {"data": [{"price": {"id": os.getenv("STRIPE_PRICE_ANNUAL")}}]},
        }

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-789")
        assert subscription is not None
        assert subscription["plan_type"] == "annual"


class TestStripeWebhookSubscriptionUpdated:
    """Test customer.subscription.updated webhook event."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_subscription_updated_updates_status(self, mock_construct, client: TestClient):
        """Test subscription.updated updates subscription status."""
        # First, create a subscription record
        database.upsert_subscription(
            user_id="test-user-update-1",
            stripe_customer_id="cus_update1",
            stripe_subscription_id="sub_update1",
            status="trialing"
        )

        event_id = "evt_subscription_updated_1"
        event = _make_webhook_event(event_id, "customer.subscription.updated", {
            "id": "sub_update1",
            "customer": "cus_update1",
            "status": "active",
            "trial_end": None,
            "current_period_end": 1735689600,
            "cancel_at_period_end": False,
            "items": {"data": [{"price": {"id": "price_test_monthly"}}]},
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-update-1")
        assert subscription["status"] == "active"

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_subscription_updated_sets_cancel_at_period_end(self, mock_construct, client: TestClient):
        """Test subscription.updated sets cancel_at_period_end."""
        database.upsert_subscription(
            user_id="test-user-cancel-1",
            stripe_customer_id="cus_cancel1",
            stripe_subscription_id="sub_cancel1",
            status="active"
        )

        event_id = "evt_subscription_cancel_1"
        event = _make_webhook_event(event_id, "customer.subscription.updated", {
            "id": "sub_cancel1",
            "customer": "cus_cancel1",
            "status": "active",
            "trial_end": None,
            "current_period_end": 1735689600,
            "cancel_at_period_end": True,
            "items": {"data": [{"price": {"id": "price_test_monthly"}}]},
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-cancel-1")
        assert subscription["cancel_at_period_end"] is True


class TestStripeWebhookSubscriptionDeleted:
    """Test customer.subscription.deleted webhook event."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_subscription_deleted_marks_canceled(self, mock_construct, client: TestClient):
        """Test subscription.deleted marks subscription as canceled."""
        database.upsert_subscription(
            user_id="test-user-delete-1",
            stripe_customer_id="cus_delete1",
            stripe_subscription_id="sub_delete1",
            status="active",
            current_period_end=1735689600
        )

        event_id = "evt_subscription_deleted_1"
        event = _make_webhook_event(event_id, "customer.subscription.deleted", {
            "id": "sub_delete1",
            "customer": "cus_delete1",
            "status": "canceled",
            "trial_end": None,
            "current_period_end": 1735689600,
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-delete-1")
        assert subscription["status"] == "canceled"

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_subscription_deleted_trial_immediate_revocation(self, mock_construct, client: TestClient):
        """Test trial subscription.deleted revokes access immediately."""
        now = int(time.time())
        future_trial_end = now + 86400  # Trial ends tomorrow

        database.upsert_subscription(
            user_id="test-user-trial-delete",
            stripe_customer_id="cus_trial_delete",
            stripe_subscription_id="sub_trial_delete",
            status="trialing",
            trial_end=future_trial_end,
            current_period_end=future_trial_end
        )

        event_id = "evt_trial_deleted_1"
        event = _make_webhook_event(event_id, "customer.subscription.deleted", {
            "id": "sub_trial_delete",
            "customer": "cus_trial_delete",
            "status": "canceled",
            "trial_end": future_trial_end,
            "current_period_end": future_trial_end,
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-trial-delete")
        assert subscription["status"] == "canceled"
        # Current period end should be set to now (immediate revocation)
        assert subscription["current_period_end"] < now + 60

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_subscription_deleted_paid_preserves_period_end(self, mock_construct, client: TestClient):
        """Test paid subscription.deleted preserves current_period_end."""
        period_end = 1735689600

        database.upsert_subscription(
            user_id="test-user-paid-delete",
            stripe_customer_id="cus_paid_delete",
            stripe_subscription_id="sub_paid_delete",
            status="active",
            trial_end=None,
            current_period_end=period_end
        )

        event_id = "evt_paid_deleted_1"
        event = _make_webhook_event(event_id, "customer.subscription.deleted", {
            "id": "sub_paid_delete",
            "customer": "cus_paid_delete",
            "status": "canceled",
            "trial_end": None,
            "current_period_end": period_end,
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-paid-delete")
        assert subscription["status"] == "canceled"
        # Period end should be preserved for paid cancellations
        assert subscription["current_period_end"] == period_end


class TestStripeWebhookPaymentEvents:
    """Test invoice.payment_succeeded and invoice.payment_failed webhook events."""

    @patch("routes.stripe_routes.stripe.Subscription.retrieve")
    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_payment_succeeded_sets_active(self, mock_construct, mock_retrieve, client: TestClient):
        """Test invoice.payment_succeeded sets status to active."""
        database.upsert_subscription(
            user_id="test-user-payment-1",
            stripe_customer_id="cus_payment1",
            stripe_subscription_id="sub_payment1",
            status="past_due"
        )

        event_id = "evt_payment_succeeded_1"
        event = _make_webhook_event(event_id, "invoice.payment_succeeded", {
            "customer": "cus_payment1",
            "subscription": "sub_payment1",
        })

        mock_construct.return_value = event
        mock_retrieve.return_value = {
            "status": "active",
            "current_period_end": 1735689600,
        }

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-payment-1")
        assert subscription["status"] == "active"

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_payment_failed_sets_past_due(self, mock_construct, client: TestClient):
        """Test invoice.payment_failed sets status to past_due."""
        database.upsert_subscription(
            user_id="test-user-payment-fail",
            stripe_customer_id="cus_payment_fail",
            stripe_subscription_id="sub_payment_fail",
            status="active"
        )

        event_id = "evt_payment_failed_1"
        event = _make_webhook_event(event_id, "invoice.payment_failed", {
            "customer": "cus_payment_fail",
            "subscription": "sub_payment_fail",
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-payment-fail")
        assert subscription["status"] == "past_due"


class TestStripeWebhookTrialWillEnd:
    """Test customer.subscription.trial_will_end webhook event."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_trial_will_end_logs_event(self, mock_construct, client: TestClient):
        """Test trial_will_end event is logged successfully."""
        database.upsert_subscription(
            user_id="test-user-trial-end",
            stripe_customer_id="cus_trial_end",
            stripe_subscription_id="sub_trial_end",
            status="trialing",
            trial_end=int(time.time()) + 259200  # 3 days from now
        )

        event_id = "evt_trial_will_end_1"
        event = _make_webhook_event(event_id, "customer.subscription.trial_will_end", {
            "id": "sub_trial_end",
            "customer": "cus_trial_end",
            "trial_end": int(time.time()) + 259200,
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200


class TestStripeWebhookErrors:
    """Test error handling in webhook endpoint."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_invalid_signature_returns_400(self, mock_construct, client: TestClient):
        """Test invalid signature raises SignatureVerificationError."""
        mock_construct.side_effect = stripe.error.SignatureVerificationError("bad sig", "test_sig")

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "bad_sig"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @patch.dict(os.environ, {"STRIPE_WEBHOOK_SECRET": ""})
    def test_missing_webhook_secret_returns_500(self, client: TestClient):
        """Test missing webhook secret returns 500."""
        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data


class TestStripeWebhookIdempotency:
    """Test idempotency of webhook events."""

    @patch("routes.stripe_routes.stripe.Subscription.retrieve")
    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_duplicate_event_ignored(self, mock_construct, mock_retrieve, client: TestClient):
        """Test duplicate events are ignored (idempotency)."""
        event_id = "evt_duplicate_test"
        event = _make_webhook_event(event_id, "checkout.session.completed", {
            "client_reference_id": "test-user-dup",
            "customer": "cus_dup",
            "subscription": "sub_dup",
        })

        mock_construct.return_value = event
        mock_retrieve.return_value = {
            "status": "active",
            "trial_end": None,
            "current_period_end": 1735689600,
            "items": {"data": [{"price": {"id": "price_test_monthly"}}]},
        }

        # First request
        response1 = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )
        assert response1.status_code == 200
        assert response1.json()["status"] == "success"

        # Second request with same event ID
        response2 = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )
        assert response2.status_code == 200
        assert response2.json()["status"] == "duplicate_ignored"

        # Verify subscription was only created once
        subscription = database.get_subscription_by_user_id("test-user-dup")
        assert subscription is not None


class TestStripeWebhookUnhandledEvent:
    """Test handling of unhandled event types."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_unhandled_event_type_returns_200(self, mock_construct, client: TestClient):
        """Test unknown event type is logged but doesn't error."""
        event_id = "evt_unknown_1"
        event = _make_webhook_event(event_id, "unknown.event.type", {
            "some": "data"
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"


class TestStripeWebhookChargeRefunded:
    """Test charge.refunded webhook event."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_charge_refunded_cancels_subscription(self, mock_construct, client: TestClient):
        """Test charge.refunded cancels the subscription."""
        database.upsert_subscription(
            user_id="test-user-refund",
            stripe_customer_id="cus_refund",
            stripe_subscription_id="sub_refund",
            status="active"
        )

        event_id = "evt_charge_refunded_1"
        event = _make_webhook_event(event_id, "charge.refunded", {
            "customer": "cus_refund",
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200

        subscription = database.get_subscription_by_user_id("test-user-refund")
        assert subscription["status"] == "canceled"


class TestStripeWebhookInvoicePaymentActionRequired:
    """Test invoice.payment_action_required webhook event."""

    @patch("routes.stripe_routes.stripe.Webhook.construct_event")
    def test_payment_action_required_logs_warning(self, mock_construct, client: TestClient):
        """Test payment_action_required event is logged."""
        database.upsert_subscription(
            user_id="test-user-action-req",
            stripe_customer_id="cus_action_req",
            stripe_subscription_id="sub_action_req",
            status="active"
        )

        event_id = "evt_payment_action_required_1"
        event = _make_webhook_event(event_id, "invoice.payment_action_required", {
            "customer": "cus_action_req",
            "subscription": "sub_action_req",
        })

        mock_construct.return_value = event

        response = client.post(
            "/api/stripe/webhook",
            content=b"raw payload",
            headers={"stripe-signature": "test_sig"}
        )

        assert response.status_code == 200
