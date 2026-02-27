# Hardcoded Styles Remaining — Mobile App Audit

**Generated:** 2026-02-27
**Scope:** `mobile/src/` and `mobile/app/` (.tsx files only)
**Excludes:** theme.ts, styles.ts, node_modules, __tests__

## Summary

| Category | Total Found | Legitimate | Should Fix |
|----------|------------|------------|------------|
| fontSize | 32 | 1 | 31 |
| borderRadius | 71 | 34 | 37 |
| Shadows | 3 | 0 | 3 |
| Hex colors | 2 | 0 | 2 |
| Spacing (gap/margin/padding) | 1 | 0 | 1 |

## Classification Legend

- **LEGITIMATE**: Circular patterns (borderRadius = width/2), icon sizes, responsive calculations
- **SHOULD_FIX**: Values that should reference SPACING, RADIUS, TYPOGRAPHY, or SHADOWS tokens

---

## 1. Hardcoded fontSize (31 SHOULD_FIX)

These bypass RFValue() and TYPOGRAPHY tokens, breaking accessibility/Dynamic Type support.

### `app/scanner/[platform].tsx` (8 instances)
- fontSize: 16, 14, 13 in button/status text → use TYPOGRAPHY.body, .label, .caption

### `app/broadcast/[platform].tsx` (5 instances)
- fontSize: 16, 14, 13 in broadcast UI text → use TYPOGRAPHY tokens

### `app/analysis/[sessionId].tsx` (5 instances)
- fontSize: 16, 14 in results UI → use TYPOGRAPHY tokens

### `app/(auth)/login.tsx` (3 instances)
- fontSize values in login screen text → use TYPOGRAPHY tokens

### `app/(tabs)/dashboard.tsx` (3 remaining instances)
- fontSize: 10 in small indicator text → use TYPOGRAPHY.captionSmall

### Other files (7 instances scattered)
- Various fontSize values in settings, history, scan tabs

### Legitimate Exception
- `src/components/icons/XPlatformIcon.tsx:38` — `fontSize: size * 0.72` (responsive calc, OK)

---

## 2. Hardcoded borderRadius (37 SHOULD_FIX)

### Quick wins — exact token matches (9 instances)
- `borderRadius: 4` → `RADIUS.xs` (2 occurrences)
- `borderRadius: 10` → `RADIUS.md` (2 occurrences)
- `borderRadius: 16` → `RADIUS.lg` (1 occurrence)
- `borderRadius: 6` → `RADIUS.sm` (2 occurrences)
- `borderRadius: 20` → `RADIUS.xl` (2 occurrences)

### Between-token values (18 instances)
These use values not in the current token set. Options: add new tokens or round to nearest.
- `borderRadius: 8` — between sm(6) and md(10)
- `borderRadius: 12` — between md(10) and lg(16)
- `borderRadius: 14` — just below lg(16)
- `borderRadius: 24` — between xl(20) and 2xl(28)

### Chart/indicator patterns (10 instances)
- `borderRadius: 2`, `borderRadius: 3`, `borderRadius: 5` — very small radii used in mini-charts, progress bars, and legend dots. Consider `RADIUS.xs` (4) as approximation.

### Legitimate — circular patterns (34 instances)
These are correct: borderRadius = width / 2 for circles.
- 44×44 → borderRadius: 22 (badge circles, touch targets)
- 32×32 → borderRadius: 16 (icon containers)
- 28×28 → borderRadius: 14 (small icon containers)
- 56×56 → borderRadius: 28 (large icon containers)
- 24×24 → borderRadius: 12 (small circles)
- 20×20 → borderRadius: 10 (tiny circles)
- 10×10 → borderRadius: 5 (legend dots)
- 8×8 → borderRadius: 4 (indicator dots)

---

## 3. Inline Shadow Definitions (3 SHOULD_FIX)

### `src/components/dashboard/DashboardTour.tsx`
- Inline shadowColor/shadowOffset/shadowOpacity/shadowRadius → use `shadows.lg` or `shadows.card`

### `app/(auth)/login.tsx`
- Brand-colored shadow on CTA button → use `shadows.hero` or themed shadow

### `app/_layout.tsx`
- Status bar shadow → use `shadows.sm`

---

## 4. Hardcoded Hex Colors (2 SHOULD_FIX)

### `src/components/plan/UpgradeModal.tsx:319`
- `#FEF2F2` and `#DC2626` as fallback colors → use `colors.errorLight` and `colors.errorBright`

---

## 5. Top Priority Files

1. `app/scanner/[platform].tsx` — 12 violations (fontSize + borderRadius)
2. `app/analysis/[sessionId].tsx` — 9 violations
3. `app/broadcast/[platform].tsx` — 7 violations
4. `app/(auth)/login.tsx` — 6 violations (fontSize + shadow)
5. `src/components/dashboard/DashboardTour.tsx` — 3 violations (shadow)

---

## Recommendation

**Immediate (Phase 5):** Fix the 9 quick-win borderRadius values that have exact token matches.

**Short-term:** Replace 31 hardcoded fontSize values with TYPOGRAPHY tokens — this is the highest-impact change for accessibility compliance.

**Medium-term:** Consolidate inline shadows and hex color fallbacks. Consider adding `RADIUS.sm2 = 8` token if the between-token borderRadius values are frequent enough.

**Long-term:** Add ESLint rule (e.g., `no-restricted-syntax`) to flag new hardcoded style values in PRs.
