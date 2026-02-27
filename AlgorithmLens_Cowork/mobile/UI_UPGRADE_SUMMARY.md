# UI Upgrade Summary — Mobile App

**Date:** 2026-02-27
**Scope:** AlgorithmLens React Native mobile app (`mobile/`)

## What Changed

### Phase 1: Design Token Consolidation
- **`src/lib/theme.ts`**: Updated `RADIUS.lg` from 14 → 16 to match website design tokens (small:6, medium:10, large:16)
- Added `MIN_TOUCH_TARGET = 44` constant for accessibility compliance
- Verified color palette alignment with website's `DESIGN_TOKENS.json` — already matched

### Phase 2: Core UI Primitives
- **`src/components/ui/Toast.tsx`**: Replaced 6 hardcoded values (margins, padding, borderRadius, fontSize, shadow) with SPACING, RADIUS, TYPOGRAPHY, shadows tokens
- **`src/components/ui/Skeleton.tsx`**: Replaced default `borderRadius = 8` with `RADIUS.sm`
- Other UI primitives (Card, Button, Badge, Chip, EmptyState, ErrorState, ProgressBar, Divider) were already well-themed — no changes needed

### Phase 3: High-Impact Screens

**Dashboard charts:**
- `BarChart.tsx`: 9 hardcoded gap/margin/borderRadius → SPACING/RADIUS tokens
- `StackedBar100.tsx`: 10 hardcoded values → SPACING/RADIUS tokens
- `SectionHeader.tsx`: 2 hardcoded gap/margin → SPACING tokens
- `ComparisonView.tsx`: 7 hardcoded spacing/fontSize → SPACING/TYPOGRAPHY tokens
- `BigNumber.tsx`: 1 hardcoded margin → SPACING token

**Dashboard tab file:**
- `app/(tabs)/dashboard.tsx`: Replaced all `fontSize: 28/22/18/14` with `TYPOGRAPHY.h1/h2/h3/labelBold`; `borderRadius: 4/10` → `RADIUS.xs/md`; `gap: 4` → `SPACING.xs`

**Home screen:**
- `FeedScoreCard.tsx`: 3 hardcoded `borderRadius: 14` → `RADIUS.lg`
- `FeedScoreTrend.tsx`: 2 hardcoded `borderRadius: 12` → `RADIUS.md`; `gap: 2` → `SPACING.xxs`

**Scanner/broadcast flow:**
- `ScanOverlay.tsx`: 2 inline shadow blocks → `shadows.lg`; `marginBottom: 4` → `SPACING.xs`
- `WebViewScanner.tsx`: `paddingVertical: 16` → `SPACING.lg`; `fontSize: 16` → `TYPOGRAPHY.label/body`; `#FFFFFF` → `COLORS.white`

**Analysis:**
- `AnalysisProgress.tsx`: 8+ hardcoded fontSize/padding/borderRadius/margin → TYPOGRAPHY/SPACING/RADIUS tokens

### Phase 4: Consistency Audit
- Generated `HARDCODED_STYLES_REMAINING.md` documenting 75+ remaining hardcoded values
- Classified each as LEGITIMATE (circular patterns, icon sizes) or SHOULD_FIX
- Identified 31 hardcoded fontSize values as highest-priority remaining work
- Identified 9 quick-win borderRadius fixes with exact token matches

## Files Modified (17 total)

1. `src/lib/theme.ts` — token updates
2. `src/components/ui/Toast.tsx` — full token migration
3. `src/components/ui/Skeleton.tsx` — borderRadius token
4. `src/components/dashboard/BarChart.tsx` — spacing/radius tokens
5. `src/components/dashboard/StackedBar100.tsx` — spacing/radius tokens
6. `src/components/dashboard/SectionHeader.tsx` — spacing tokens
7. `src/components/dashboard/ComparisonView.tsx` — spacing/typography tokens
8. `src/components/dashboard/BigNumber.tsx` — spacing token
9. `src/components/home/FeedScoreCard.tsx` — radius tokens
10. `src/components/home/FeedScoreTrend.tsx` — radius/spacing tokens
11. `src/components/scanner/ScanOverlay.tsx` — shadow/spacing tokens
12. `src/components/scanner/WebViewScanner.tsx` — spacing/typography/color tokens
13. `src/components/analysis/AnalysisProgress.tsx` — typography/spacing/radius tokens
14. `app/(tabs)/dashboard.tsx` — typography/radius/spacing tokens

## Safety Verification

- No analysis logic, API calls, data handling, broadcast modules, or native modules were modified
- No components were deleted
- All changes are style-only (visual presentation layer)
- Design token values remain backward-compatible

## Remaining Work

See `HARDCODED_STYLES_REMAINING.md` for the full audit of values still to address. Top priorities:
1. Replace 31 hardcoded fontSize values with TYPOGRAPHY tokens (accessibility impact)
2. Fix 9 quick-win borderRadius values with exact token matches
3. Consolidate 3 inline shadow definitions
4. Consider ESLint rule to prevent future regressions
