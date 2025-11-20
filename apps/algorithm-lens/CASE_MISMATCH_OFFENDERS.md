# Case-Mismatch Import Offenders Table

| Importing File Path | Imported Specifier/Path | Actual On-Disk File Path | Corrected Target Path |
|---------------------|------------------------|--------------------------|----------------------|
| src/components/DashboardPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/DashboardPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/figma-ui/pages/LandingPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/pages/LandingPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/components/DashboardTier.tsx | '../../ui/card' | src/figma-ui/ui/card.tsx | '../../ui/Card' |
| src/figma-ui/components/DashboardTier.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/export/components/ErrorPage.tsx | '../../ui/card' | src/figma-ui/ui/card.tsx | '../../ui/Card' |
| src/figma-ui/components/ErrorPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/pages/InsightDetailPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/pages/SignInPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/pages/AboutPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/figma-ui/export/LandingPage.tsx | '../ui/card' | src/figma-ui/ui/card.tsx | '../ui/Card' |
| src/components/SignInPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/LandingPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/InsightDetailPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/ErrorPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/DashboardTier.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/components/AboutPage.tsx | './ui/card' | src/components/ui/Card.tsx | './ui/Card' |
| src/figma-ui/export/components/DashboardTierDemo.tsx | '../../ui/button' | src/figma-ui/ui/button.tsx | '../../ui/Button' |
| src/figma-ui/components/DashboardTierDemo.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/components/DashboardTier.tsx | '../../ui/button' | src/figma-ui/ui/button.tsx | '../../ui/Button' |
| src/figma-ui/components/DashboardTier.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/components/PlanCard.tsx | '../../ui/button' | src/figma-ui/ui/button.tsx | '../../ui/Button' |
| src/figma-ui/components/PlanCard.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/components/ErrorPage.tsx | '../../ui/button' | src/figma-ui/ui/button.tsx | '../../ui/Button' |
| src/figma-ui/components/ErrorPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/components/PaywallBanner.tsx | '../../ui/button' | src/figma-ui/ui/button.tsx | '../../ui/Button' |
| src/figma-ui/components/PaywallBanner.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/pages/InsightDetailPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/pages/PrivacyTermsPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/pages/SignInPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/pages/AboutPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/figma-ui/export/LandingPage.tsx | '../ui/button' | src/figma-ui/ui/button.tsx | '../ui/Button' |
| src/components/UpgradeModal.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/SignInPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/PrivacyTermsPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/PlanCard.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/PaywallBanner.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/LandingPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/InsightDetailPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/ErrorPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/DashboardTierDemo.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/DashboardTier.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |
| src/components/AboutPage.tsx | './ui/button' | src/components/ui/Button.tsx | './ui/Button' |

## Files Needing Rename:
1. `src/figma-ui/ui/card.tsx` → `src/figma-ui/ui/Card.tsx`
2. `src/figma-ui/ui/button.tsx` → `src/figma-ui/ui/Button.tsx`

## Files Already Correct (no rename needed):
- `src/components/ui/Card.tsx` (already capitalized)
- `src/components/ui/Button.tsx` (already capitalized)






