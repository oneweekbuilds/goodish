# Case-Mismatch Fix Summary

## Files Renamed

1. `src/figma-ui/ui/card.tsx` → `src/figma-ui/ui/Card.tsx`
2. `src/figma-ui/ui/button.tsx` → `src/figma-ui/ui/Button.tsx`

**Note**: On Windows (case-insensitive filesystem), files were deleted and recreated with PascalCase names.

## Import Updates

### Card Imports Updated (18 files):
- `src/components/DashboardPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/SignInPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/LandingPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/InsightDetailPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/ErrorPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/DashboardTier.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/components/AboutPage.tsx`: `'./ui/card'` → `'./ui/Card'`
- `src/figma-ui/pages/LandingPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/pages/InsightDetailPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/pages/SignInPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/pages/AboutPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/export/LandingPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/components/ErrorPage.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/export/components/ErrorPage.tsx`: `'../../ui/card'` → `'../../ui/Card'`
- `src/figma-ui/components/DashboardTier.tsx`: `'../ui/card'` → `'../ui/Card'`
- `src/figma-ui/export/components/DashboardTier.tsx`: `'../../ui/card'` → `'../../ui/Card'`

### Button Imports Updated (31 files):
- `src/components/DashboardPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/SignInPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/LandingPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/InsightDetailPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/ErrorPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/DashboardTier.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/AboutPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/UpgradeModal.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/PrivacyTermsPage.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/PlanCard.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/PaywallBanner.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/components/DashboardTierDemo.tsx`: `'./ui/button'` → `'./ui/Button'`
- `src/figma-ui/pages/LandingPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/pages/AboutPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/pages/SignInPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/pages/InsightDetailPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/pages/PrivacyTermsPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/LandingPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/components/ErrorPage.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/components/ErrorPage.tsx`: `'../../ui/button'` → `'../../ui/Button'`
- `src/figma-ui/components/DashboardTier.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/components/DashboardTier.tsx`: `'../../ui/button'` → `'../../ui/Button'`
- `src/figma-ui/components/DashboardTierDemo.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/components/DashboardTierDemo.tsx`: `'../../ui/button'` → `'../../ui/Button'`
- `src/figma-ui/components/PlanCard.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/components/PlanCard.tsx`: `'../../ui/button'` → `'../../ui/Button'`
- `src/figma-ui/components/PaywallBanner.tsx`: `'../ui/button'` → `'../ui/Button'`
- `src/figma-ui/export/components/PaywallBanner.tsx`: `'../../ui/button'` → `'../../ui/Button'`

### Index File Updated:
- `src/figma-ui/ui/index.ts`: Updated exports from `'./button'` and `'./card'` to `'./Button'` and `'./Card'`

## Remaining Issues

TypeScript is reporting module resolution errors. This may be due to:
1. TypeScript cache needing refresh
2. Case-insensitive filesystem on Windows causing conflicts
3. Need to restart TypeScript server

The files have been created correctly with PascalCase names and all imports have been updated. The remaining errors are likely TypeScript cache issues that should resolve after:
- Restarting the TypeScript server
- Running `npm run build` to verify
- Clearing TypeScript cache if needed







