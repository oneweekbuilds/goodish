# Phase 2.5: Visual Foundation Fixes

**Date:** 2026-02-28
**Status:** Complete

---

## Section 1: Geist Font Verification

**Was Geist actually loading before this fix?** Yes — Geist was properly loading.

The font infrastructure was solid:
- Font files present: `Geist_400Regular.ttf`, `Geist_500Medium.ttf`, `Geist_600SemiBold.ttf`, `Geist_700Bold.ttf` in `assets/fonts/`
- `useFonts()` called in `app/_layout.tsx` with correct paths
- `SplashScreen.preventAutoHideAsync()` called before load, app waits until fonts ready
- `GL_TYPOGRAPHY` in `gluestackTheme.ts` adds `fontFamily` to every typography variant via `geistFontForWeight()`
- All 53 screen/component files import `GL_TYPOGRAPHY` from `gluestackTheme.ts` (not `TYPOGRAPHY` from `theme.ts`)

**One fix made:** `XPlatformIcon.tsx` was using `fontWeight: GL_TYPOGRAPHY.labelBold.fontWeight` without setting `fontFamily`. Added `fontFamily: GL_TYPOGRAPHY.labelBold.fontFamily`.

---

## Section 2: Hardcoded Style Cleanup

**Total hardcoded values replaced: ~37**

### Breakdown by category:

| Category | Count | Details |
|----------|-------|---------|
| Hex colors (`#FFFFFF`) | 3 | dashboard.tsx upsell banner — replaced with `colors.textInverse` |
| Font sizes (raw px) | 3 | dashboard.tsx tab labels + AI badge — replaced with `RFValue()` |
| Padding values | 3 | _layout.tsx tab bar — replaced with `SPACING.sm`, `SPACING.xs` |
| Margin values | 1 | _layout.tsx — replaced with `SPACING.xxs` |
| Border radius | ~25 | Across 12 files — most replaced with `RADIUS.full` (circles), `RADIUS.md`, `RADIUS.xs`, `RADIUS['2xl']` |

### Files modified:
- `app/(tabs)/dashboard.tsx` — colors, fontSize, borderRadius, padding
- `app/(tabs)/_layout.tsx` — padding, margin
- `app/scanner/[platform].tsx` — borderRadius
- `app/checkout/success.tsx` — borderRadius
- `app/(tabs)/settings.tsx` — borderRadius
- `app/(tabs)/history.tsx` — borderRadius (4 instances)
- `app/(auth)/onboarding.tsx` — borderRadius (2 instances)
- `src/components/plan/UpgradeModal.tsx` — borderRadius
- `src/components/home/FirstUseWalkthrough.tsx` — borderRadius
- `src/components/home/FeedScoreTrend.tsx` — borderRadius (2 instances)

### Intentionally left as-is:
- `borderRadius: 1` in StackedBar100.tsx, SectionHeader.tsx, _layout.tsx — decorative sub-pixel rounding
- `marginTop: 1` in analysis/[sessionId].tsx — sub-pixel adjustment
- `paddingVertical: 1` in dashboard.tsx AI badge — tiny badge constraint
- Platform brand colors in PLATFORMS config — these ARE the tokens
- Chart SVG colors that reference theme via `colors` object

---

## Section 3: Card Visual Hierarchy

### FeedScoreCard (Visual Anchor)
- Added score-tinted gradient background: green50 for scores ≥70, blue50 for ≥50, bgCard for lower
- Elevated shadow from `shadows.lg` to `shadows.hero` for prominence
- Score number uses `GL_TYPOGRAPHY.bigNumber` for maximum visual weight

### StreakBadge
- PAUSED state: muted background (`bgSecondary` instead of `bgCard`), reduced shadow (`shadows.sm`)
- ACTIVE state: kept warm accent colors unchanged — already well-differentiated

### RecentScanCard
- No changes needed — already appropriately subtle/secondary

### Dashboard Dimension Tabs
- Added accent color property to each tab in the TABS array
- Active tab pills now use dimension-specific colors:
  - Overview: blue (#2563EB / #3B82F6)
  - Sources: indigo (#6366F1 / #818CF8)
  - Ads: amber (#D97706 / #F59E0B)
  - Politics: violet (#7C3AED / #A78BFA)
  - Tone: teal (#0D9488 / #2DD4BF)
  - Suggested: rose (#E11D48 / #FB7185)
- Each tab now feels visually distinct when scrolling between dimensions

---

## Section 4: Spacing & Breathing Room

- Card spacing increased from `SPACING.lg` (16px) to `SPACING['2xl']` (24px) between cards
- Section separator before weekly summary increased to `SPACING['3xl']` (32px)
- Greeting section reduced from `SPACING['3xl']` to `SPACING['2xl']` — less gap before first card
- Horizontal padding kept at `SPACING.xl` (20px) — appropriate for mobile

---

## Section 5: Typography Weight Hierarchy

Fixed 7 instances where `fontSize: GL_TYPOGRAPHY.xxx.fontSize` was used without spreading the full token (missing fontFamily, fontWeight, lineHeight, letterSpacing):

| File | Instances | Fix |
|------|-----------|-----|
| StreakBadge.tsx | 4 | Spread full GL_TYPOGRAPHY.caption / captionSmall |
| FeedScoreCard.tsx | 1 | Spread full GL_TYPOGRAPHY.captionSmall |
| FeedScoreTrend.tsx | 1 | Spread full GL_TYPOGRAPHY.captionSmall |
| PlatformPicker.tsx | 1 | Spread full GL_TYPOGRAPHY.captionSmall |

These components were rendering at the correct font size but without Geist fontFamily — they would have fallen back to system font (San Francisco on iOS).

---

## Section 6: Dark Mode Spot Check

**Zero dark mode issues found.**

Verified:
- No hardcoded white/light backgrounds — all use `colors.bgCard`, `colors.bgElevated`
- No hardcoded dark text colors — all use `colors.textPrimary`, `colors.textMain`
- No hardcoded light border colors — all use theme tokens
- Score-tinted backgrounds (green50, blue50) properly defined in DARK_COLORS as subtle rgba tints (10% opacity)
- Dashboard tour accent colors properly defined in DARK_COLORS as bright variants suitable for dark backgrounds
- LinearGradient colors (gradientPrimaryStart/End) properly defined for dark mode
- All card shadows use DARK_SHADOWS with appropriate opacity levels

---

## Remaining Issues

1. **BigNumber.tsx** uses `fontSize: fontSize` prop passthrough — this is intentional (dynamic sizing), not a hardcoded value
2. **XPlatformIcon.tsx** uses calculated `fontSize: size * X_GLYPH_SCALE` — intentional for dynamic icon sizing
3. Chart SVG internals (BarChart, StackedBar100) use theme colors via the `colors` object at render time — correctly themed
4. Some `borderRadius: 1` values left intentionally for decorative sub-pixel rounding on accent bars and legend shapes
