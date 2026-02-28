# Stripe Integration Patterns Reference

## Webhook Idempotency

Stripe may send the same event multiple times. The webhook handler must be safe to run repeatedly.

### Pattern: Check-Before-Update
```
1. Receive webhook event
2. Verify signature
3. Extract event ID
4. Check if this event ID has already been processed (store processed event IDs)
5. If already processed, return 200 OK without taking action
6. If new, process the event and store the event ID
7. Return 200 OK
```

### Pattern: State-Based Updates
```
Instead of: "increment subscription count"
Use: "set subscription status to active"

State-based updates are naturally idempotent — setting `is_user_plus = true`
twice has the same result as setting it once.
```

## Error Scenarios to Handle

### Payment Fails at Renewal
- Stripe sends `invoice.payment_failed`
- Do NOT immediately revoke access (Stripe retries)
- After all retries fail, Stripe sends `customer.subscription.deleted`
- THEN revoke access by setting `is_user_plus = false`

### User Cancels Mid-Cycle
- Stripe sends `customer.subscription.updated` with `cancel_at_period_end = true`
- User keeps access until period end
- At period end, Stripe sends `customer.subscription.deleted`
- Then revoke access

### Trial Expires Without Payment
- Stripe sends `customer.subscription.deleted` when trial ends without conversion
- Set `is_user_plus = false`
- User sees free tier experience

### Duplicate Webhook Events
- Return 200 OK for already-processed events
- Never charge twice or create duplicate subscription records
- Log duplicate events for monitoring

### Webhook Signature Validation Fails
- Return 400 Bad Request
- Log the attempt for security monitoring
- Never process unverified webhooks

## Stripe Checkout Session Configuration

### Monthly Plan
```
- price: $10.00
- interval: month
- trial_period_days: 14 (first subscription only)
- success_url: redirect to dashboard with success message
- cancel_url: redirect to pricing page
```

### Annual Plan
```
- price: $96.00
- interval: year
- trial_period_days: 14 (first subscription only)
- success_url: redirect to dashboard with success message
- cancel_url: redirect to pricing page
```

## Environment Variables Required

- `STRIPE_SECRET_KEY` — Stripe API secret key (different for test vs. live)
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret
- `STRIPE_MONTHLY_PRICE_ID` — Price ID for $10/month plan
- `STRIPE_ANNUAL_PRICE_ID` — Price ID for $96/year plan
- `STRIPE_PUBLISHABLE_KEY` — Client-side Stripe key (frontend)

## Testing Checklist

- [ ] Test with Stripe CLI in test mode before going live
- [ ] Verify webhook signatures work with production signing secret
- [ ] Test all webhook events using Stripe's event simulator
- [ ] Verify idempotency by sending same event twice
- [ ] Test trial flow: start → use → expire → downgrade
- [ ] Test cancellation: subscribe → cancel → verify access revoked at period end
- [ ] Test failed payment: subscribe → simulate payment failure → verify retry → verify eventual revocation
- [ ] Test annual vs. monthly plan switching
