# Phase 4: RevenueCat Native IAP Integration (Replaces Stripe Web Checkout)

**Date:** 2026-02-28
**Status:** Complete (Mock Mode)

---

## Summary

Replaced the Stripe web checkout flow with a RevenueCat-compatible native IAP architecture. Since no RevenueCat API keys are configured in `.env`, the implementation uses a **mock mode** backed by AsyncStorage that provides the same interface as the real RevenueCat SDK. When `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and/or `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` are added to `.env`, the mock implementation should be swapped for `react-native-purchases`.

---

## Mode Used

**Mock mode** — No RevenueCat API keys found in `mobile/.env`.

The mock service (`src/services/revenueCat.ts`) uses AsyncStorage to simulate:
- Plus status checks
- Purchase simulation (dev "Simulate Purchase" button)
- Restore purchases
- Subscription source detection

---

## How Entitlement Checking Now Works

### Priority Chain (RevenueCat → Backend Fallback)

```
1. RevenueCat checkPlusStatus()
   ├── If TRUE → User is Plus (source: 'revenuecat')
   │   └── No backend call needed
   └── If FALSE or FAILS → Fall through to step 2

2. Backend /api/user/entitlements (Stripe source of truth)
   ├── If is_plus: true → User is Plus (source: 'backend')
   └── If is_plus: false or FAILS → Free tier (fail closed)
```

This preserves backward compatibility:
- **Existing Stripe web subscribers** → detected via backend API
- **New mobile IAP subscribers** → detected via RevenueCat (or mock)
- **Both fail** → defaults to free tier (security default)

### New `entitlementSource` Field

The AuthContext now exposes `entitlementSource: 'revenuecat' | 'backend' | null` so components can make source-aware decisions (e.g., routing "Manage Subscription" to App Store vs. Stripe billing portal).

---

## Files Changed

### New Files
- `src/services/revenueCat.ts` — Mock RevenueCat service with full interface:
  - `initRevenueCat(userId?)` — SDK initialization
  - `checkPlusStatus()` — AsyncStorage-backed entitlement check
  - `presentPaywall()` — Paywall trigger (mock: defers to UpgradeModal)
  - `simulatePurchase(purchased)` — Dev-only purchase simulation
  - `restorePurchases()` — Restore flow
  - `getOfferings()` — Static offerings matching Stripe pricing
  - `getSubscriptionSource()` — Returns 'app_store' | 'stripe' | 'none'
  - `resetMockState()` — Dev utility to clear mock state
  - `IS_MOCK_MODE` — Constant flag for conditional UI

### Modified Files
- `src/hooks/useEntitlements.ts` — Now checks RevenueCat FIRST, falls back to backend. Added `source` field to state.
- `src/context/AuthContext.tsx` — Passes through `entitlementSource` from entitlements hook. Updated interface and default context.
- `src/components/plan/UpgradeModal.tsx` — Replaced Stripe `startCheckout()` with RevenueCat `simulatePurchase()`. Added:
  - "Simulate Purchase" dev button with beaker icon (mock mode)
  - Purchase success animation ("Welcome to Plus!")
  - Auto-refresh of entitlements after purchase
  - Mock mode indicator text
- `app/_layout.tsx` — Added RevenueCat initialization after auth (sets user ID for cross-platform identity)
- `app/(tabs)/settings.tsx` — Updated subscription management:
  - Detects subscription source (`revenuecat` → App Store, `backend` → Stripe)
  - Routes "Manage Subscription" to appropriate destination
  - Added "Restore Purchases" row for non-Plus users

### Preserved Files (Not Deleted — Stripe Fallback)
- `src/lib/checkout.ts` — Kept intact for web Stripe subscribers
- `app/checkout/success.tsx` — Kept for Stripe deep-link callbacks
- `app/checkout/cancel.tsx` — Kept for Stripe deep-link callbacks

---

## Stripe Preserved as Fallback

The Stripe checkout flow is fully preserved:
- `src/lib/checkout.ts` still exports `startCheckout()` and `PlanType`
- Checkout callback screens (`app/checkout/success.tsx`, `app/checkout/cancel.tsx`) are unchanged
- Backend `/api/user/entitlements` endpoint is still called as fallback
- Existing Stripe subscribers continue to get their entitlements via the backend API

---

## Migration from Stripe Flow

| Aspect | Before (Phase 3) | After (Phase 4) |
|--------|-------------------|------------------|
| Purchase trigger | Stripe web checkout (browser redirect) | RevenueCat native paywall (mock: AsyncStorage) |
| Entitlement check | Backend API only | RevenueCat → Backend API fallback |
| Manage subscription | Stripe billing portal | App Store / Google Play (IAP) or Stripe (web) |
| Purchase restoration | N/A | "Restore Purchases" in Settings |
| Entitlement source tracking | None | `entitlementSource` in AuthContext |

---

## Testing in Mock Mode

1. **Tap locked feature** → UpgradeModal appears with "Simulate Purchase" button
2. **Tap "Simulate Purchase"** → AsyncStorage sets Plus status → entitlements refresh → "Welcome to Plus!" animation → modal closes
3. **After unlocking** → Locked features become accessible (entitlements hook returns `isPlus: true`)
4. **Settings "Manage Subscription"** → Shows App Store link (since mock simulates app_store source)
5. **"Restore Purchases"** → Reads current mock status from AsyncStorage
6. **Backend fallback** → If mock is cleared, backend API is still checked

---

## Switching to Real RevenueCat

When ready to integrate the real SDK:

1. Add to `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxx
   ```

2. Install packages:
   ```bash
   npm install react-native-purchases react-native-purchases-ui --legacy-peer-deps
   ```

3. Replace `src/services/revenueCat.ts` mock implementation with real SDK calls:
   - `initRevenueCat()` → `Purchases.configure({ apiKey })`
   - `checkPlusStatus()` → `Purchases.getCustomerInfo()` → check `entitlements.active["plus"]`
   - `presentPaywall()` → `RevenueCatUI.presentPaywall()`
   - `restorePurchases()` → `Purchases.restorePurchases()`
   - Set `IS_MOCK_MODE = false`

4. No other files need to change — the interface is identical.

---

## Known Issues / Future Work

- **No real IAP testing** — Mock mode only; needs TestFlight/internal testing with real RevenueCat keys
- **Webhook sync** — RevenueCat webhooks should sync purchase status to the backend (update `is_user_plus` in Supabase)
- **Grace period handling** — Need to handle billing retry periods and grace periods
- **Family sharing** — Not currently supported
- **Promotional offers** — Not implemented in mock; RevenueCat supports these natively
