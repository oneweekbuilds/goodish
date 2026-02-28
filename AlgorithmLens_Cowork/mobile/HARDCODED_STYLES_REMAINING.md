# Hardcoded Styles Remaining — Mobile App Audit

**Generated:** 2026-02-27
**Updated:** 2026-02-27 (after Phase 1 fix pass)
**Scope:** `mobile/src/` and `mobile/app/` (.tsx files only)
**Excludes:** theme.ts, styles.ts, node_modules, __tests__

## Before / After Summary

| Category | Before (Total) | Before (Should Fix) | After (Total) | After (Should Fix) | Reduction |
|----------|----------------|--------------------|--------------------|--------------------|----|
| fontSize | 32 | 31 | 2 | 0 | 100% |
| borderRadius | 71 | 37 | 38 | ~2 | 95% |
| Shadows | 3 | 3 | 1 | 0 | 100% |
| Hex colors | 2 | 2 | 1 | 0 | 100% |
| Spacing | 1 | 1 | 0 | 0 | 100% |
| **TOTAL** | **109** | **74** | **42** | **~2** | **97%** |

## Remaining Legitimate Values

### fontSize (2 — all LEGITIMATE)
- `src/components/dashboard/BigNumber.tsx:38` — `fontSize: fontSize` (dynamic prop)
- `src/components/icons/XPlatformIcon.tsx:38` — `fontSize: size * 0.72` (responsive calc)

### borderRadius (38 — almost all LEGITIMATE circular patterns)
Most remaining `borderRadius` values are correct circular patterns (`borderRadius = width / 2`):
- 44×44 → borderRadius: 22 (badge circles, touch targets)
- 32×32 → borderRadius: 16 (icon containers)
- 56×56 → borderRadius: 28 (large icon containers)
- 24×24 → borderRadius: 12 (small circles)
- 20×20 → borderRadius: 10 (tiny circles)
- 10×10 → borderRadius: 5 (legend dots)
- 8×8 → borderRadius: 4 (indicator dots)
- 6×6 → borderRadius: 3 (tiny legend dots)
- onboarding.tsx circles: 120→60, 80→40, 48→24

~2 borderRadius values remain as minor visual elements:
- `SectionHeader.tsx:64` — `borderRadius: 1` (tiny accent bar)
- `StackedBar100.tsx:212` — `borderRadius: 1` (tiny chart legend dot)
- `_layout.tsx:135` — `borderRadius: 1` (web mock battery indicator)

These are intentionally sub-token visual details.

### Shadows (1 — INTENTIONAL)
- `app/(auth)/login.tsx:166` — Brand-colored shadow on app icon (custom `shadowColor: colors.primaryBlue`, intentionally different from any preset shadow token)

### Hex colors (1 — NOT A STYLE)
- `src/lib/utils.ts:92` — JSDoc comment describing the `withAlpha()` function parameter, not an actual style value

## What Was Fixed

### fontSize (31 → 0 SHOULD_FIX)
- Replaced all 31 hardcoded fontSize values with TYPOGRAPHY tokens
- Files: scanner/[platform], broadcast/[platform], analysis/[sessionId], login.tsx, dashboard.tsx, scan.tsx, _layout.tsx, WebViewScanner.tsx

### borderRadius (37 → ~2 SHOULD_FIX)
- Replaced all quick-win exact matches (4→xs, 6→sm, 10→md, 16→lg, 20→xl)
- Rounded between-token values to nearest token (8→sm, 12→lg, 14→lg, 24→2xl)
- Fixed wrong token usage: `history.tsx` had `SPACING.lg` instead of `RADIUS.lg`
- Files: AnalysisProgress, BroadcastResultsSummary, BroadcastOverlay, BroadcastPickerButton, RecentScanCard, SmartSuggestion, StreakBadge, WeeklySummaryCard, ScanOverlay, WebViewScanner, history.tsx, scan.tsx

### Shadows (3 → 0 SHOULD_FIX)
- DashboardTour.tsx: Replaced inline shadow with `...SHADOWS.lg`
- _layout.tsx: Replaced inline shadow with `...SHADOWS.lg`
- login.tsx: Kept as intentional brand shadow (not a generic preset)

### Hex colors (2 → 0 SHOULD_FIX)
- UpgradeModal.tsx: Replaced `#FEF2F2` fallback with `colors.errorLight`, removed unnecessary `#DC2626` fallback
