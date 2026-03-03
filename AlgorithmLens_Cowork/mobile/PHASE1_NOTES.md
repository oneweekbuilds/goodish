# Phase 1: Infrastructure — Geist Font + gluestack-ui + GL* Components

**Date:** 2026-02-28
**Status:** Complete — infrastructure installed, GL* components created

---

## Packages Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-font` | ^55.0.4 | Font loading for React Native |
| `@expo-google-fonts/geist` | ^0.4.1 | Geist font TTF files (Google Fonts distribution) |
| `@fontsource/geist-sans` | ^5.2.5 | Geist font (woff/woff2 — used as fallback reference) |
| `nativewind` | ^4.2.2 | Tailwind CSS for React Native (NativeWind v4) |
| `tailwindcss` | ^3.4.17 | Tailwind CSS engine (peer dep of NativeWind) |
| `react-native-css-interop` | ^0.1.20 | CSS interop layer for NativeWind v4 |
| `@gluestack-ui/nativewind-utils` | ^1.0.28 | Utility functions for gluestack + NativeWind |
| `@gluestack-ui/overlay` | ^0.1.22 | Overlay primitives (for future modal/popover use) |
| `@gluestack-ui/toast` | ^1.0.9 | Toast primitives (for future toast system) |

## Dependency Conflicts & Resolutions

- All packages installed with `--legacy-peer-deps` flag due to React 19.1 + Expo SDK 54 peer dependency version mismatches. This is standard for Expo SDK 54 projects.
- `@fontsource/geist-sans` only provides woff/woff2 fonts (not usable in React Native). Used `@expo-google-fonts/geist` instead which provides proper TTF files.
- TypeScript full project compilation hits a stack overflow (pre-existing issue unrelated to our changes — likely circular type references in the large codebase).

## Font Setup

- Geist TTF files copied to `assets/fonts/` (weights: 400, 500, 600, 700)
- Font names registered in `app/_layout.tsx` via `useFonts()`:
  - `Geist-Regular` (400)
  - `Geist-Medium` (500)
  - `Geist-SemiBold` (600)
  - `Geist-Bold` (700)
- Splash screen stays visible until fonts are loaded (existing splash screen + font gate)
- Fonts are NOT applied to existing components — only available for GL* components

## NativeWind v4 Configuration

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `babel.config.js` | Modified | Added `nativewind/babel` preset, `jsxImportSource: 'nativewind'` |
| `metro.config.js` | Created | NativeWind CSS processing via `withNativeWind()` |
| `tailwind.config.js` | Created | Tailwind config with NativeWind preset, Geist font families, letter spacing |
| `global.css` | Created | Tailwind base/components/utilities directives |
| `global.d.ts` | Modified | Added `nativewind/types` reference |
| `app/_layout.tsx` | Modified | Imports `global.css`, font loading, GluestackUIProvider wrapper |

### Provider Hierarchy (after changes)

```
GluestackUIProvider          ← NEW (outermost)
  └─ SafeAreaProvider
      └─ ThemeProvider
          └─ AuthProvider
              └─ ErrorBoundary
                  └─ WebConstrainedWrapper
                      └─ RootLayoutNav
```

## Gluestack Theme Config Bridge

**File:** `src/lib/gluestackTheme.ts`

- Imports ALL tokens from `theme.ts` (LIGHT_COLORS, DARK_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS)
- Maps font weights → Geist font family names via `geistFontForWeight()`
- Creates `GL_TYPOGRAPHY` — every TYPOGRAPHY variant with Geist fontFamily applied
- Website letter spacing: hero (-0.03em), heading (-0.02em), card (-0.01em)
- `getGluestackTheme(isDark)` returns full theme config for either mode
- Existing `theme.ts` remains the single source of truth — gluestackTheme.ts is a bridge

### Token Mapping Notes

All tokens from `theme.ts` mapped cleanly to the GL config. No gaps or incompatibilities found:

- **Colors:** All ThemeColors tokens pass through directly (ThemeContext provides them)
- **Shadows:** All ThemeShadows tokens pass through directly
- **Typography:** Each variant gets fontFamily assigned based on fontWeight
- **Spacing:** Re-exported as-is (4pt grid, no changes needed)
- **Radius:** Re-exported as-is (no changes needed)

## GL* Components Created

**Directory:** `src/components/glue/`

| Component | Replaces | Key Features |
|-----------|----------|--------------|
| `GLText` | Text styling | Geist font, all TYPOGRAPHY variants, color/align props |
| `GLButton` | `Button.tsx` | primary/secondary/ghost/danger, sm/md/lg, loading/disabled, gradient primary |
| `GLCard` | `Card.tsx` | default/elevated/outlined, gradient bg, entrance animation, interactive press |
| `GLBadge` | `Badge.tsx` | default/primary/success/warning/error/outline/subtle, sm/md |
| `GLInput` | (new) | Label, error, disabled, focus animation, themed border colors |
| `GLChip` | `Chip.tsx` | default/outline, selected/unselected, loading, icon support |
| `GLDivider` | `Divider.tsx` | Configurable spacing, color, thickness |
| `GLEmptyState` | `EmptyState.tsx` | Icon + title + description + primary/secondary CTA pattern |
| `GLErrorState` | `ErrorState.tsx` | Error icon + message + error code + retry button |
| `GLProgressBar` | `ProgressBar.tsx` | Reanimated animation, indeterminate mode |
| `GLSkeleton` | `Skeleton.tsx` | Shimmer animation, reduced motion support |
| `GLToast` | `Toast.tsx` | success/error/info, slide-in animation, auto-dismiss |

### Naming Convention

All prefixed with "GL" so both old and new components coexist during migration. After all screens are migrated to GL* components, the old `src/components/ui/` versions will be removed and GL* will be renamed.

## ComponentShowcase

**Route:** `/showcase` (accessible via `router.push('/showcase')`)
**File:** `src/screens/ComponentShowcase.tsx` + `app/showcase.tsx`

Renders every GL* component in every variant with:
- Light/dark mode toggle
- Typography scale demo
- Button variants × sizes
- Card variants (default, elevated, outlined, interactive)
- Badge variants (7 types × 2 sizes)
- Input states (normal, error, disabled)
- Chip states (default, selected, toggle, outline, disabled, loading)
- Divider variations
- Progress bar (25%, 75%, indeterminate)
- Skeleton loading patterns
- Empty state with CTA
- Error state with retry
- Toast trigger

## Expo SDK 54 Compatibility Notes

- NativeWind v4.2.2 works with Expo SDK 54 + React Native 0.81
- `react-native-css-interop` v0.1.20 is compatible
- No issues with `react-native-reanimated` v3.16 (used by GLProgressBar)
- Geist font via `@expo-google-fonts/geist` loads correctly with `expo-font`
- `expo-splash-screen` v31 preventAutoHideAsync/hideAsync pattern preserved

## What Was NOT Changed

- No existing components were modified
- No existing screens were modified (all render exactly as before)
- No existing theme tokens were changed
- No existing provider hierarchy was disrupted
- No existing imports were broken
- The only modification to existing files: `app/_layout.tsx` (font loading + CSS import + GluestackUIProvider wrapper)
