# Phase 2: All Screens Migrated to Gluestack with Geist Font

**Date:** 2026-02-28
**Status:** Complete

---

## Summary

All screens and components have been migrated from the old `src/components/ui/` primitives to the new gluestack-based component library in `src/components/glue/`. Every text element now uses the Geist font via `GL_TYPOGRAPHY` from `src/lib/gluestackTheme.ts`, with the website-matching letter spacing system applied (-0.03em hero, -0.02em heading, -0.01em card).

---

## Screens Migrated

### 1. Settings — `app/(tabs)/settings.tsx`
- Replaced `TYPOGRAPHY` → `GL_TYPOGRAPHY`
- Replaced `Divider` → `Divider` (from glue)
- Replaced all `<Text>` → `<Text>` (from glue, with Geist font)
- All setting rows, info text, modals now use Geist typography

### 2. Login — `app/(auth)/login.tsx`
- Replaced `Button` → `Button` (from glue)
- Replaced `Divider` → `Divider` (from glue)
- Replaced all `<Text>` → `<Text>` (from glue)
- OAuth buttons, email form, error messages all use Geist

### 3. History — `app/(tabs)/history.tsx`
- Replaced `Skeleton` → `Skeleton` (from glue, with shimmer animation)
- Replaced all `<Text>` → `<Text>` (from glue)
- Preserved `ContentFadeIn` (moved to glue/)
- All scan cards, section headers, filter chips use Geist

### 4. Onboarding — `app/(auth)/onboarding.tsx`
- Replaced `Button` → `Button` (from glue)
- Replaced all `<Text>` → `<Text>` (from glue)
- All 3 onboarding screens, platform picker, CTAs use Geist
- Preserved all fade transition animations

### 5. Home — `app/(tabs)/index.tsx` + `src/components/home/*`
Files modified:
- `app/(tabs)/index.tsx`
- `src/components/home/CalmHomeScreen.tsx`
- `src/components/home/FeedScoreCard.tsx`
- `src/components/home/FeedScoreTrend.tsx`
- `src/components/home/PlatformPicker.tsx`
- `src/components/home/PlatformBottomSheet.tsx`
- `src/components/home/RecentScanCard.tsx`
- `src/components/home/SmartSuggestion.tsx`
- `src/components/home/StreakBadge.tsx`
- `src/components/home/WeeklySummaryCard.tsx`
- `src/components/home/DailyTipCard.tsx`
- `src/components/home/AchievementBadges.tsx`
- `src/components/home/ModeToggle.tsx`
- `src/components/home/FirstUseWalkthrough.tsx`
- `src/components/home/MilestoneModal.tsx`

All 15 home-related files migrated. StaggeredList moved to glue/.

### 6. Dashboard — `app/(tabs)/dashboard.tsx` + `src/components/dashboard/*`
Files modified:
- `app/(tabs)/dashboard.tsx`
- `src/components/dashboard/BigNumber.tsx`
- `src/components/dashboard/ComparisonView.tsx`
- `src/components/dashboard/DashboardTour.tsx`
- `src/components/dashboard/InsightHero.tsx`
- `src/components/dashboard/MetricCard.tsx`
- `src/components/dashboard/SectionHeader.tsx`
- `src/components/dashboard/BarChart.tsx` (typography only — chart SVG preserved)
- `src/components/dashboard/StackedBar100.tsx` (typography only — chart SVG preserved)

All 9 dashboard files migrated. Chart components kept their SVG rendering logic intact.

### 7. Scanner — `app/(tabs)/scan.tsx`, `app/scanner/[platform].tsx`, `src/components/scanner/*`
Files modified:
- `app/(tabs)/scan.tsx`
- `app/scanner/[platform].tsx`
- `src/components/scanner/ScanOverlay.tsx`
- `src/components/scanner/WebViewScanner.tsx`

### 8. Analysis Results — `app/analysis/[sessionId].tsx` + `src/components/analysis/*`
Files modified:
- `app/analysis/[sessionId].tsx`
- `src/components/analysis/AnalysisProgress.tsx`
- `src/components/analysis/BroadcastResultsSummary.tsx`

### 9. Broadcast — `app/broadcast/[platform].tsx` + `src/components/broadcast/*`
Files modified:
- `app/broadcast/[platform].tsx`
- `src/components/broadcast/BroadcastOverlay.tsx`
- `src/components/broadcast/BroadcastPickerButton.tsx`
- `src/components/broadcast/NativeBroadcastPicker.tsx` — No changes needed (no text/typography)

### 10. Checkout Callbacks
- `app/checkout/success.tsx` — Migrated
- `app/checkout/cancel.tsx` — Migrated

### 11. Plan/Paywall Components
- `src/components/plan/LockedOverlayCard.tsx` — Migrated
- `src/components/plan/UpgradeModal.tsx` — Migrated

### 12. Layouts & Shared Components
- `app/_layout.tsx` — Migrated TYPOGRAPHY → GL_TYPOGRAPHY
- `app/(tabs)/_layout.tsx` — Migrated TYPOGRAPHY → GL_TYPOGRAPHY
- `src/components/ErrorBoundary.tsx` — Migrated to GL_TYPOGRAPHY + Text from glue
- `src/components/icons/XPlatformIcon.tsx` — Migrated TYPOGRAPHY → GL_TYPOGRAPHY

---

## Cleanup Actions

### Deleted
- `src/components/ui/` — Entire old primitives directory (13 files: Badge, Button, Card, Chip, ContentFadeIn, Divider, EmptyState, ErrorState, ProgressBar, Skeleton, StaggeredList, Toast, index.ts)
- `src/screens/ComponentShowcase.tsx` — Development showcase screen
- `app/showcase.tsx` — Showcase route

### Moved to glue/
- `ContentFadeIn.tsx` — Animation wrapper (no GL* equivalent, preserved as-is)
- `StaggeredList.tsx` — Staggered animation wrapper (no GL* equivalent, preserved as-is)

### Renamed (GL* prefix removed)
All GL* components renamed to clean names:
- GLText → Text
- GLButton → Button
- GLCard → Card
- GLBadge → Badge
- GLChip → Chip
- GLDivider → Divider
- GLEmptyState → EmptyState
- GLErrorState → ErrorState
- GLProgressBar → ProgressBar
- GLSkeleton → Skeleton
- GLToast → Toast
- GLInput → Input

Backward-compatible aliases exported from `src/components/glue/index.ts`.

---

## Typography System

All text now flows through `GL_TYPOGRAPHY` from `src/lib/gluestackTheme.ts`:
- **Geist-Bold (700):** display, h1, heroTitle, bigNumber, scoreLarge, scoreSmall
- **Geist-SemiBold (600):** h2, h3, labelBold, overline, xsmall, buttonLg, buttonMd, buttonSm
- **Geist-Medium (500):** label
- **Geist-Regular (400):** body, bodyLarge, bodySmall, caption, captionSmall, small

Letter spacing system from DESIGN_UPGRADE_TARGET.md applied:
- Hero/display: -0.03em × fontSize
- Headings (h1, h2): -0.02em × fontSize
- Card titles (h3): -0.01em × fontSize
- Body: 0
- Captions: positive spacing for readability

---

## Functionality Preserved

- All button presses, navigation, and data display work identically
- All animations preserved: ContentFadeIn, StaggeredList, card entrance, tab transitions
- All lucide-react-native icons preserved (38+ files)
- All chart rendering preserved (BarChart, StackedBar100 SVG logic untouched)
- Dark mode theming preserved (all colors flow from ThemeContext)
- All accessibility labels and roles preserved

---

## Components That Could NOT Be Fully Migrated

None — all components were fully migrated.

---

## Remaining Hardcoded Styles

The following are intentional and semantic, not migration gaps:
- `'rgba(255, 255, 255, 0.8)'` in settings Plus card — matches theme overlay tokens
- `'rgba(0,0,0,0.5)'` in delete modal overlay — matches `overlayDimBg` token
- Platform brand colors in PLATFORMS config — these ARE the tokens
- Chart SVG colors reference theme tokens via the `colors` object from `useTheme()`

---

## DESIGN_UPGRADE_TARGET.md Layout Changes Applied

Layout changes from the design doc were NOT applied in this phase. Phase 2 focused exclusively on the component library migration (TYPOGRAPHY → GL_TYPOGRAPHY, old ui/ → glue components). Layout changes (ring charts, bottom sheet upgrades, segmented controls, etc.) are planned for Phase 3 (charts) and Phase 4 (RevenueCat).
