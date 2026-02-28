# AlgorithmLens — Full Project Audit (Read-Only)

**Date:** 2026-02-28
**Scope:** Website, Chrome Extension, Mobile App (iOS/Android)
**Purpose:** Diagnostic only — no changes made

---

## 1. PROJECT STRUCTURE

### Top-Level Folder Layout

```
AlgorithmLens_ParentFolder/
├── AlgorithmLens_Cowork/        ← WEBSITE + BACKEND + MOBILE (monorepo)
│   ├── src/                     ← Website (Vite + React + Tailwind)
│   ├── backend/                 ← Python Flask API
│   ├── mobile/                  ← Expo React Native mobile app
│   ├── public/                  ← Static assets (logos, favicons, OG images)
│   ├── dist/                    ← Built website output
│   ├── docs/                    ← Documentation
│   ├── tests/                   ← Playwright E2E tests
│   ├── scripts/                 ← Build/deploy scripts
│   ├── index.html               ← Website entry point
│   ├── tailwind.config.js       ← Design tokens (colors, typography, spacing)
│   ├── vite.config.js           ← Vite bundler config
│   ├── package.json             ← Website dependencies
│   └── vercel.json              ← Deployment config
├── alg-gemini-extension/        ← CHROME EXTENSION (standalone)
│   ├── src/                     ← Extension source (background, content, popup, scanners)
│   ├── icons/                   ← Extension icons
│   ├── manifest.json            ← Chrome extension manifest v3
│   ├── dist/                    ← Built extension output
│   └── package.json             ← Extension dependencies
├── algorithm-lens-plugin-UPDATED/ ← Cowork plugin for AlgorithmLens
├── algorithmlens-mobile-polish/   ← Mobile polish Cowork plugin
├── Cowork Plugins/                ← Additional Cowork plugins
└── [Various audit/doc files]      ← Prior audit reports and fix prompts
```

### Where Things Live

| Component | Folder | Tech Stack |
|-----------|--------|------------|
| **Website** | `AlgorithmLens_Cowork/src/` | Vite + React (JSX) + Tailwind CSS + shadcn/ui |
| **Backend API** | `AlgorithmLens_Cowork/backend/` | Python (Flask), Supabase, Stripe, Google Gemini Flash |
| **Chrome Extension** | `alg-gemini-extension/src/` | Vanilla JS, Chrome Extension Manifest V3 |
| **Mobile App** | `AlgorithmLens_Cowork/mobile/` | Expo (SDK 54) + React Native 0.81 + TypeScript |

### Mobile App — Complete File Inventory

**Entry & Config:**
- `index.ts` — App entry point (registers root component)
- `app.config.ts` — Expo config (replaces app.json), includes broadcast extension plugin
- `babel.config.js` — Babel config with reanimated plugin
- `tsconfig.json` — TypeScript config extending Expo base
- `eas.json` — EAS Build profiles (development, preview, production)
- `jest.config.js` — Jest test configuration
- `package.json` — Dependencies and scripts
- `global.d.ts` — Global TypeScript declarations
- `.env` / `.env.example` — Environment variables (API URLs, Supabase keys, Gemini key)

**Expo Router Screens (`app/`):**
- `app/_layout.tsx` — Root layout: SafeAreaProvider → ThemeProvider → AuthProvider → ErrorBoundary → Stack navigator. Handles auth routing (login vs onboarding vs tabs).
- `app/(auth)/_layout.tsx` — Auth group layout (stack)
- `app/(auth)/login.tsx` — Login screen (Supabase OAuth: Google, Apple)
- `app/(auth)/onboarding.tsx` — Onboarding walkthrough (AI consent, platform selection)
- `app/(tabs)/_layout.tsx` — Tab bar layout: Home, Dashboard, History, Settings (Scan tab hidden, accessed from Home)
- `app/(tabs)/index.tsx` — Home screen (CalmHomeScreen: platform picker, streak badge, recent scans, smart suggestions)
- `app/(tabs)/dashboard.tsx` — Dashboard screen: 6-tab analysis (Overview, Sources, Ads, Politics, Tone, Suggested vs. Followed)
- `app/(tabs)/history.tsx` — Scan history list
- `app/(tabs)/settings.tsx` — Settings screen (theme, AI consent, subscription, sign out)
- `app/(tabs)/scan.tsx` — Precision Mode WebView scanner (hidden from tab bar)
- `app/scanner/[platform].tsx` — WebView scanner for specific platform
- `app/broadcast/[platform].tsx` — Broadcast mode screen (ReplayKit / MediaProjection)
- `app/analysis/[sessionId].tsx` — Analysis results screen (post-scan)
- `app/checkout/success.tsx` — Stripe checkout success callback
- `app/checkout/cancel.tsx` — Stripe checkout cancel callback

**Components (`src/components/`):**
- `ErrorBoundary.tsx` — Global error boundary with Sentry reporting
- `analysis/AnalysisProgress.tsx` — Multi-step analysis progress indicator
- `analysis/BroadcastResultsSummary.tsx` — Post-broadcast analysis summary
- `broadcast/BroadcastOverlay.tsx` — Floating overlay during screen broadcast
- `broadcast/BroadcastPickerButton.tsx` — Button to trigger RPSystemBroadcastPickerView
- `broadcast/NativeBroadcastPicker.tsx` — Native iOS broadcast picker wrapper
- `dashboard/BarChart.tsx` — Custom SVG bar chart component
- `dashboard/BigNumber.tsx` — Large metric display
- `dashboard/ComparisonView.tsx` — Side-by-side comparison layout
- `dashboard/DashboardTour.tsx` — First-use guided tour overlay
- `dashboard/InsightHero.tsx` — Hero insight card with gradient
- `dashboard/MetricCard.tsx` — Metric display card with icon
- `dashboard/SectionHeader.tsx` — Section header with label
- `dashboard/StackedBar100.tsx` — 100% stacked horizontal bar
- `home/AchievementBadges.tsx` — Gamification badges
- `home/CalmHomeScreen.tsx` — Main home screen layout
- `home/DailyTipCard.tsx` — Daily algorithmic literacy tip
- `home/FeedScoreCard.tsx` — Feed health score display
- `home/FeedScoreTrend.tsx` — Score trend over time
- `home/FirstUseWalkthrough.tsx` — First-use walkthrough modal
- `home/MilestoneModal.tsx` — Achievement milestone celebration
- `home/ModeToggle.tsx` — Toggle between Broadcast/Precision mode
- `home/PlatformBottomSheet.tsx` — Platform selection bottom sheet
- `home/PlatformPicker.tsx` — Platform grid picker (Instagram, X, YouTube, TikTok, Facebook, Reddit)
- `home/RecentScanCard.tsx` — Recent scan summary card
- `home/SmartSuggestion.tsx` — AI-driven scan suggestion
- `home/StreakBadge.tsx` — Scanning streak counter
- `home/WeeklySummaryCard.tsx` — Weekly digest card
- `icons/XPlatformIcon.tsx` — Custom X (Twitter) icon
- `plan/LockedOverlayCard.tsx` — Paywall locked content overlay
- `plan/UpgradeModal.tsx` — Plus upgrade prompt modal
- `scanner/ScanOverlay.tsx` — In-progress scan overlay
- `scanner/WebViewScanner.tsx` — WebView-based feed scanner
- **UI Primitives (`ui/`):**
  - `Badge.tsx` — Status badge (variants: default, primary, success, warning, error)
  - `Button.tsx` — Button component (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
  - `Card.tsx` — Card container with shadow and border
  - `Chip.tsx` — Compact tag/filter chip
  - `ContentFadeIn.tsx` — Animated fade-in wrapper (Reanimated)
  - `Divider.tsx` — Horizontal divider line
  - `EmptyState.tsx` — Empty state placeholder with icon and message
  - `ErrorState.tsx` — Error state with retry button
  - `ProgressBar.tsx` — Animated progress bar
  - `Skeleton.tsx` — Skeleton loading placeholder
  - `StaggeredList.tsx` — List with staggered entry animations
  - `Toast.tsx` — Toast notification
  - `index.ts` — Barrel export file

**Lib/Services (`src/lib/`):**
- `theme.ts` — Complete design token system (colors, typography, spacing, shadows, radius)
- `styles.ts` — Style utility (flattenStyle for web compat)
- `api.ts` — Authenticated API client with JWT injection and retry
- `supabase.ts` — Supabase client initialization
- `sentry.ts` — Sentry error tracking setup
- `haptics.ts` — Haptic feedback wrappers
- `utils.ts` — Utility functions
- `errorHandler.ts` — Global error handler
- `networkUtils.ts` — Network connectivity helpers
- `cookieManager.ts` — Cookie management for WebView sessions
- `broadcastSessionManager.ts` — Broadcast session lifecycle management
- `checkout.ts` — Stripe checkout flow
- `streakManager.ts` — Streak calculation and persistence
- `achievements.ts` — Achievement/badge definitions
- `computeDashboardData.ts` — Dashboard data computation from raw scans
- `insightBuilders.js` — Insight text generation
- `analysis/analysisDataStore.ts` — Analysis data persistence (AsyncStorage)
- `analysis/analysisPrompts.ts` — Gemini Flash prompt templates
- `analysis/broadcastAnalysisPipeline.ts` — End-to-end broadcast analysis pipeline
- `analysis/geminiFlashService.ts` — Google Gemini Flash API client
- `analysis/textClassificationService.ts` — Text-based content classification
- `analysis/index.ts` — Barrel export
- `platformScripts/*.ts` — Per-platform DOM scraping scripts (instagram, twitter, youtube, tiktok, facebook, reddit)

**Hooks (`src/hooks/`):**
- `useAnalysis.ts` — Analysis state management hook
- `useBroadcast.ts` — Broadcast session hook
- `useDashboard.ts` — Dashboard data loading hook
- `useEntitlements.ts` — Plus/subscription entitlements hook
- `useHabitFeatures.ts` — Gamification features hook
- `useStreak.ts` — Streak tracking hook

**Context (`src/context/`):**
- `AuthContext.tsx` — Authentication state (Supabase session, profile, entitlements)
- `ThemeContext.tsx` — Theme switching (light/dark/system)

**Types (`src/types/`):**
- `index.ts` — Core type definitions
- `broadcast.ts` — Broadcast-related types
- `streak.ts` — Streak types
- `achievements.ts` — Achievement types

**Config (`src/config/`):**
- `thresholds.ts` — Analysis thresholds and confidence levels

**Services (`src/services/`):**
- `notifications.ts` — Push notification management

**Native Modules (`modules/`):**
- `broadcast/` — Custom Expo module for screen recording
  - `ios/BroadcastModule.swift` — iOS ReplayKit integration
  - `ios/BroadcastPickerView.swift` — Native RPSystemBroadcastPickerView
  - `ios/FrameProcessor.swift` — Frame capture and processing
  - `ios/SharedContainer.swift` — App Group shared storage
  - `ios/BroadcastExtension/SampleHandler.swift` — Broadcast extension process
  - `android/BroadcastModule.kt` — Android MediaProjection integration
  - `android/MediaProjectionService.kt` — Foreground service for screen capture
  - `android/AndroidFrameProcessor.kt` — Android frame processing
  - `android/AndroidSharedStorage.kt` — Android shared storage
- `shortcuts/` — Custom Expo module for Siri Shortcuts
  - `ios/ShortcutsModule.swift` — Shortcuts bridge
  - `ios/ShortcutsProvider.swift` — App Intents provider
  - `ios/ScanFeedIntent.swift` — "Scan Feed" Siri intent

**Plugins (`plugins/`):**
- `withBroadcastExtension.js` — Expo config plugin to add iOS Broadcast Extension target

**Tests (`src/__tests__/`):**
- 17 test files covering analysis pipeline, data stores, services, and utilities

### Entry Point & Navigation

**Entry:** `index.ts` → `app/_layout.tsx`

**Navigation Hierarchy:**
```
Root Stack (app/_layout.tsx)
├── (auth) Stack
│   ├── login
│   └── onboarding
├── (tabs) Tab Navigator
│   ├── index (Home)        ← Default tab
│   ├── dashboard           ← 6-tab analysis dashboard
│   ├── history             ← Scan history list
│   ├── settings            ← User settings
│   └── scan (hidden)       ← Precision Mode scanner
├── scanner/[platform]      ← WebView scanner (stack screen)
├── broadcast/[platform]    ← Broadcast mode (fullscreen modal)
├── analysis/[sessionId]    ← Analysis results (fullscreen modal)
├── checkout/success        ← Stripe callback
└── checkout/cancel         ← Stripe callback
```

---

## 2. BRAND IDENTITY (Website + Extension)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-blue` | `#2563EB` | Primary brand color, 70% dominance, CTAs, active states |
| `accent-green` | `#10B981` | Secondary brand color, 30% dominance, success states |
| `bg-page` | `#F7F8FC` | Page background (cool off-white) |
| `surface-default` | `#FFFFFF` | Card/surface background |
| `text-main` | `#1E293B` | Primary text (slate-800) |
| `text-muted` | `#4B5563` | Secondary text (darkened for WCAG AA) |
| `border-light` | `rgba(30, 41, 59, 0.08)` | Subtle borders |
| `status-success` | `#059669` | Success green |
| `status-error` | `#DC2626` | Error red |
| `status-warning` | `#D97706` | Warning amber |
| `blue-50` → `blue-800` | `#EFF6FF` → `#1E40AF` | Extended blue scale |
| `green-50` → `green-700` | `#ECFDF5` → `#047857` | Extended green scale |

**Theme color (meta tag):** `#1B4F72`

### Typography

- **Primary Font:** `Geist` (loaded from Google Fonts, weights: 400, 500, 600, 700)
- **Fallback:** `Plus Jakarta Sans`, `sans-serif`
- **Letter Spacing System:**
  - Hero: `-0.03em`
  - Heading: `-0.02em`
  - Card: `-0.01em`
  - Label: `0.05em` → `0.1em`

### Visual Tone

**Minimal, calm, data-informed.** The design follows a "Calm × Fintech" aesthetic:
- Clean white surfaces with very subtle shadows
- Rounded corners (12px small → 28px large → pill)
- Low-opacity borders (6–12% opacity slate)
- Graduated shadow system (soft → medium → strong → glow)
- No decorative elements — all visual weight serves data
- shadcn/ui component library integrated with CSS variables
- Tailwind utility classes for all styling

### Brand Assets

| Asset | Path |
|-------|------|
| Logo (full) | `public/logo-full.png` |
| Favicon (PNG) | `public/favicon.png` |
| Apple Touch Icon | `public/apple-touch-icon.png` |
| OG Image | `public/og.png` |
| Android Chrome Icons | `public/android-chrome-{192,512}x512.png` |
| Extension Icons | `alg-gemini-extension/icons/icon{16,48,128}.png`, `logo.png` |
| Mobile App Icon | `mobile/assets/icon.png` |
| Mobile Splash | `mobile/assets/splash-icon.png` |
| Mobile Adaptive Icon | `mobile/assets/adaptive-icon.png` |

### Design System (Website)

The website uses **shadcn/ui** components integrated with Tailwind CSS:
- CSS variable-based theming (`:root` with HSL values)
- Components: `alert`, `badge`, `button-shadcn`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `separator`, `sheet`, `skeleton-shadcn`, `tabs`, `tooltip`
- Custom components built on top: `Button`, `ErrorBoundary`, `Skeleton`, `SkeletonCard`, `Toast`, `BackLink`
- Tailwind animate plugin for transitions
- Radix UI primitives under the hood

---

## 3. MOBILE APP — CURRENT DESIGN SYSTEM

### UI Library / Components

The mobile app uses **NO third-party UI component library** (no Paper, no Elements, no gluestack). Instead, it has a **custom-built UI component library** in `src/components/ui/`:

**Custom UI Primitives (12 components):**
- `Badge` — Multi-variant status badge
- `Button` — Full button system (primary/secondary/ghost/danger, sm/md/lg)
- `Card` — Card container
- `Chip` — Tag/filter chip
- `ContentFadeIn` — Animated entry wrapper
- `Divider` — Separator line
- `EmptyState` — Empty state with icon
- `ErrorState` — Error state with retry
- `ProgressBar` — Animated progress
- `Skeleton` — Loading placeholder
- `StaggeredList` — Staggered list animation
- `Toast` — Notification toast

**Icons:** `lucide-react-native` — used across **38 files** (heavily adopted)

### Colors — Where Defined

Colors are defined in a single centralized file:
**`src/lib/theme.ts`**

This file exports:
- `LIGHT_COLORS` — ~100+ color tokens for light mode
- `DARK_COLORS` — Matching set for dark mode
- `COLORS` — Alias for `LIGHT_COLORS` (backward compat)

Color tokens are organized by semantic purpose:
- Core Brand: primary `#2563EB`, secondary `#10B981`, accent `#8B5CF6`
- Status: success, warning, error (with light/border variants)
- Blue/Green scales (50–800)
- Text: primary `#1E293B`, secondary `#64748B`, tertiary `#708090`
- Backgrounds: bgPrimary `#F7F8FC`, bgCard `#FFFFFF`
- Borders: default, subtle, light, soft, medium (opacity-based)
- Charts: dedicated chart palette, tone colors, ads colors, ideology colors
- Streak: orange/deep-orange/blaze gradient
- Gradients: primary, accent, card, warm
- Platform colors: per-platform brand colors
- Tour accent colors: per-tab accent
- White overlays: 50%–90%

### Fonts

The mobile app uses **system fonts only** (no custom font loading). Typography is defined via the `TYPOGRAPHY` export in `theme.ts`, using `RFValue` from `react-native-responsive-fontsize` for accessibility-aware sizing.

**Typography Scale:**
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display` | RFValue(32) | 700 | Hero numbers |
| `h1` | RFValue(24) | 700 | Page titles |
| `heroTitle` | RFValue(26) | 700 | Special hero text |
| `h2` | RFValue(18) | 600 | Section headings |
| `h3` | RFValue(16) | 600 | Sub-headings |
| `bodyLarge` | RFValue(16) | 400 | Large body |
| `body` | RFValue(15) | 400 | Default body |
| `bodySmall` | RFValue(14) | 400 | Secondary text |
| `caption` | RFValue(12) | 400 | Captions |
| `captionSmall` | RFValue(11) | 400 | Tiny labels |
| `label` | RFValue(14) | 500 | Form labels |
| `labelBold` | RFValue(14) | 600 | Bold labels |
| `overline` | RFValue(11) | 600 | Uppercase overlines |
| `bigNumber` | RFValue(32) | 700 | Dashboard big numbers |
| `buttonLg/Md/Sm` | RFValue(16/15/14) | 600 | Button text |

### Spacing / Sizing Patterns

**4pt grid system** defined in `SPACING`:
```
xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, 3xl: 32, 4xl: 40, 5xl: 48, 6xl: 64
```

**Border Radius** (`RADIUS`):
```
xs: 4, sm: 6, md: 10, lg: 16, xl: 20, 2xl: 28, full/pill: 9999
```

**Shadow System** — 8 levels for both light and dark mode:
`sm` → `soft` → `md` → `card` → `lg` → `medium` → `xl` → `hero`

**Touch Targets:** `MIN_TOUCH_TARGET = 44` (Apple HIG compliant)

**Icon Sizes:** Named scale from `dot: 10` through `7xl: 80`

### Theme Provider

Yes — `src/context/ThemeContext.tsx` provides:
- `colors` — Active color set (light or dark)
- `shadows` — Active shadow set
- `platforms` — Platform config (adjusts TikTok icon color for dark mode)
- `isDark` — Boolean
- `mode` — Current preference: `'system' | 'light' | 'dark'`
- `setMode()` — Update preference
- `statusBarStyle` — For StatusBar component

Default mode is hardcoded to `'light'` (not `'system'`).

### Design System Maturity

**Well-organized and comprehensive.** The mobile design system is notably mature:
- ✅ Centralized token file with ~100+ semantic tokens
- ✅ Full light/dark mode support with WCAG AA contrast verification
- ✅ 4pt grid spacing system
- ✅ Responsive typography via RFValue
- ✅ Named shadow elevation system
- ✅ Custom UI component library with barrel exports
- ✅ Theme context with provider pattern
- ✅ Platform-aware color adjustments
- ✅ Chart-specific color palettes (colorblind-accessible)
- ⚠️ No custom font loading (system fonts only — website uses Geist)
- ⚠️ Some inline styles still present in screen files (not fully tokenized)

---

## 4. MOBILE APP — SCREENS & COMPONENTS

### Screens / Tabs

| Screen | File | Status | Description |
|--------|------|--------|-------------|
| **Home** | `app/(tabs)/index.tsx` | ✅ Fully functional | CalmHomeScreen with platform picker, streak, recent scans, smart suggestions, daily tips |
| **Dashboard** | `app/(tabs)/dashboard.tsx` | ✅ Fully functional | 6-tab feed analysis with charts, metrics, insights, pull-to-refresh |
| **History** | `app/(tabs)/history.tsx` | ✅ Fully functional | Scan history list with platform filtering |
| **Settings** | `app/(tabs)/settings.tsx` | ✅ Fully functional | Theme toggle, AI consent, subscription management, sign out |
| **Scan (hidden)** | `app/(tabs)/scan.tsx` | ✅ Functional | Precision Mode WebView scanner, hidden from tab bar |
| **Login** | `app/(auth)/login.tsx` | ✅ Functional | OAuth login (Google, Apple via Supabase) |
| **Onboarding** | `app/(auth)/onboarding.tsx` | ✅ Functional | Multi-step walkthrough with AI consent |
| **Scanner** | `app/scanner/[platform].tsx` | ✅ Functional | Per-platform WebView scanner |
| **Broadcast** | `app/broadcast/[platform].tsx` | ✅ Functional | Screen broadcast mode (ReplayKit/MediaProjection) |
| **Analysis Results** | `app/analysis/[sessionId].tsx` | ✅ Functional | Post-scan analysis results display |
| **Checkout Success** | `app/checkout/success.tsx` | ✅ Functional | Stripe success callback |
| **Checkout Cancel** | `app/checkout/cancel.tsx` | ✅ Functional | Stripe cancel callback |

### Navigation Pattern

**Hybrid: Tab Bar (bottom) + Stack navigation**

- **Tab Bar:** 4 visible tabs — Home, Dashboard, History, Settings
- **Hidden tab:** Scan (accessed from Home's platform picker)
- **Stack screens:** Scanner, Broadcast (fullscreen modal), Analysis (fullscreen modal), Checkout callbacks
- **Auth flow:** Separate (auth) stack group for login/onboarding

### The Six Analysis Dimensions

From both website (`dashboardCatalog.js`) and mobile (`dashboard.tsx`):

| # | Tab ID | Label | Description |
|---|--------|-------|-------------|
| 1 | `overview` | **Overview** | High-level feed summary across all dimensions |
| 2 | `sources` | **Who Shapes Your Feed** | Creator concentration, suggested vs. followed sources |
| 3 | `ads` | **Ads & Promotions** | Commercial content percentage, ad labeling, advertiser concentration |
| 4 | `politics` | **Political Exposure** | Political content percentage, ideological lean estimates |
| 5 | `tone` | **Emotional Tone** | Positive/neutral/negative sentiment distribution |
| 6 | `suggested_vs_followed` | **Suggested vs. Followed** | Algorithmic recommendations vs. user-chosen content |

### Reusable Components

**UI Primitives (12):** Badge, Button, Card, Chip, ContentFadeIn, Divider, EmptyState, ErrorState, ProgressBar, Skeleton, StaggeredList, Toast

**Dashboard Components (8):** BarChart, BigNumber, ComparisonView, DashboardTour, InsightHero, MetricCard, SectionHeader, StackedBar100

**Home Components (14):** AchievementBadges, CalmHomeScreen, DailyTipCard, FeedScoreCard, FeedScoreTrend, FirstUseWalkthrough, MilestoneModal, ModeToggle, PlatformBottomSheet, PlatformPicker, RecentScanCard, SmartSuggestion, StreakBadge, WeeklySummaryCard

**Broadcast Components (3):** BroadcastOverlay, BroadcastPickerButton, NativeBroadcastPicker

**Scanner Components (2):** ScanOverlay, WebViewScanner

**Plan/Paywall Components (2):** LockedOverlayCard, UpgradeModal

**Analysis Components (2):** AnalysisProgress, BroadcastResultsSummary

**Other (2):** ErrorBoundary, XPlatformIcon

---

## 5. MOBILE APP — DEPENDENCIES

### Full Dependency List

**Runtime Dependencies:**

| Package | Version | Notes |
|---------|---------|-------|
| `@expo/metro-runtime` | ~6.1.2 | Metro bundler runtime |
| `@react-native-async-storage/async-storage` | ^2.1.2 | Local key-value storage |
| `@sentry/react-native` | ^8.0.0 | Error tracking |
| `@supabase/supabase-js` | ^2.95.3 | Auth + database client |
| `expo` | ~54.0.33 | Expo SDK 54 |
| `expo-constants` | ~18.0.13 | App constants |
| `expo-dev-client` | ~6.0.3 | Dev client for native modules |
| `expo-haptics` | ^15.0.8 | Haptic feedback |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |
| `expo-linking` | ~7.1.5 | Deep linking |
| `expo-notifications` | ~0.32.16 | Push notifications |
| `expo-router` | ~6.0.23 | File-based routing |
| `expo-secure-store` | ~15.0.8 | Secure credential storage |
| `expo-splash-screen` | ~31.0.13 | Splash screen control |
| `expo-status-bar` | ~3.0.9 | Status bar styling |
| `lucide-react-native` | ^0.564.0 | Icon library |
| `react` | 19.1.0 | React |
| `react-dom` | 19.1.0 | React DOM (web) |
| `react-native` | 0.81.5 | React Native core |
| `react-native-gesture-handler` | ~2.25.0 | Gesture system |
| `react-native-reanimated` | ~3.16.1 | Animations |
| `react-native-responsive-fontsize` | ^0.5.1 | Responsive text sizing |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |
| `react-native-screens` | ~4.16.0 | Native screen containers |
| `react-native-svg` | ~15.12.1 | SVG rendering |
| `react-native-web` | ^0.21.0 | Web target support |
| `react-native-webview` | ^13.16.0 | WebView (for scanning) |

**Dev Dependencies:**

| Package | Version | Notes |
|---------|---------|-------|
| `@babel/core` | ^7.25.0 | Babel transpiler |
| `@types/jest` | ^29.5.0 | Jest type definitions |
| `@types/react` | ~19.1.0 | React type definitions |
| `babel-preset-expo` | ~54.0.10 | Expo Babel preset |
| `jest` | ^29.7.0 | Test runner |
| `ts-jest` | ^29.2.0 | TypeScript Jest transformer |
| `typescript` | ~5.9.2 | TypeScript compiler |

### Outdated / Deprecated Flags

- **`react-native-responsive-fontsize` (^0.5.1):** Last published 2020, no updates in 6 years. Still functional but unmaintained. Consider replacing with a custom RFValue function or `react-native-size-matters`.
- **`react-native-web` (^0.21.0):** May be behind latest. Check for React 19 compat.
- All Expo packages are at SDK 54-compatible versions (current as of Feb 2026).

### Conflict Analysis for Planned Additions

| Planned Package | Conflicts? | Notes |
|-----------------|-----------|-------|
| `react-native-gifted-charts` | ⚠️ Requires `react-native-svg` (already installed ✅) and `react-native-linear-gradient`. The app uses `expo-linear-gradient` instead. May need `react-native-linear-gradient` OR the gifted-charts Expo-compatible fork. |
| `react-native-purchases` (RevenueCat) | ✅ No conflicts. Compatible with Expo SDK 54 via config plugin. |
| `react-native-webview` | ✅ Already installed (^13.16.0). No conflict. |
| `@gorhom/bottom-sheet` | ⚠️ Requires `react-native-reanimated` (✅ installed) and `react-native-gesture-handler` (✅ installed). Should be compatible. Note: the app already has a custom `PlatformBottomSheet` component. |

### UI Library Import Counts

- **`lucide-react-native`** — imported in **38 files** (deeply adopted)
- **Custom `components/ui/`** — imported in **6 files** (moderate adoption)
- **No third-party UI library** (Paper: 0, gluestack: 0, Elements: 0)

---

## 6. MOBILE APP — DATA FLOW

### How Data Gets Into the App

1. **Screen Recording (Broadcast Mode):** iOS ReplayKit / Android MediaProjection captures screen frames → processed locally by `FrameProcessor` → frames sent to Google Gemini Flash API for content classification → results stored in AsyncStorage via `analysisDataStore.ts`

2. **WebView Scanning (Precision Mode):** WebView loads social media platform → injected platform-specific JavaScript (`platformScripts/*.ts`) scrapes feed DOM → extracted posts sent to Gemini Flash for analysis → results stored locally

3. **Backend API:** Authenticated REST calls via `api.ts` to Python Flask backend (`API_BASE_URL` from env). JWT from Supabase session injected automatically. Used for:
   - `/api/user/entitlements` — Plus subscription status
   - Scan data sync (when logged in)
   - Stripe checkout session creation

4. **Local Storage:** AsyncStorage for:
   - Analysis results
   - Scan history
   - Streak data
   - Onboarding completion flag
   - Theme preference

5. **Supabase Direct:** Supabase JS client for:
   - Authentication (OAuth: Google, Apple)
   - User profile CRUD (`user_profiles` table)
   - Session management

### State Management

- **React Context** for global state:
  - `AuthContext` — session, user, profile, entitlements, isPlus
  - `ThemeContext` — colors, shadows, isDark, mode
- **React `useState`/`useCallback`/`useMemo`** for local state
- **Custom hooks** for domain logic:
  - `useDashboard()` — loads and caches dashboard data
  - `useAnalysis()` — manages analysis pipeline state
  - `useBroadcast()` — broadcast session lifecycle
  - `useEntitlements()` — fetches subscription status from backend
  - `useStreak()` — streak tracking
  - `useHabitFeatures()` — gamification features
- **No Redux, Zustand, or external state library**

### Authentication

- **Supabase Auth** with OAuth providers (Google, Apple)
- Deep link redirect: `algorithmLens://auth/callback`
- Session tokens stored via Supabase's built-in persistence (AsyncStorage adapter)
- JWT automatically injected into backend API calls
- User profile stored in Supabase `user_profiles` table
- Belt-and-suspenders onboarding flag in AsyncStorage (backup for Supabase write failures)
- Entitlements (Plus status) fetched from backend (`/api/user/entitlements`), fail-closed to free

### Data Sync Between Mobile and Website/Extension

- **Shared backend:** Both mobile and website hit the same Flask API backend
- **Shared auth:** Both use Supabase Auth (same project)
- **Shared database:** User profiles and scan data in same Supabase instance
- **No real-time sync:** No WebSocket or Supabase Realtime channels
- **Extension → Backend → Mobile:** Extension scans upload to backend; mobile fetches from backend. Not a direct connection.

---

## 7. MOBILE APP — BUILD & CONFIG

### Workflow

**Expo managed workflow with custom dev client** (required for native modules).

The app uses `expo-dev-client` because of custom native modules (broadcast, shortcuts). This means:
- Development: `npx expo start --dev-client` (requires a development build)
- Cannot use Expo Go for testing
- Requires EAS Build for device builds

### Expo SDK Version

**SDK 54** (`expo: ~54.0.33`)

### app.config.ts Contents

- **Name:** AlgorithmLens
- **Slug:** algorithmlens
- **Version:** 1.0.0
- **Orientation:** Portrait only
- **Splash:** `#F7F8FC` background, contain mode
- **iOS:**
  - Bundle ID: `com.algorithmlens.app`
  - Tablet: not supported
  - Background modes: processing, fetch
  - App Groups: `group.com.algorithmlens.broadcast`
  - Privacy manifests: declared (empty — no tracking)
  - Entitlements for broadcast extension
- **Android:**
  - Package: `com.algorithmlens.app`
  - Permissions: foreground service, media projection, notifications
- **Web:** Metro bundler, single page output
- **Scheme:** `algorithmlens` (deep linking)
- **Plugins:** expo-router, expo-secure-store, expo-dev-client, `./plugins/withBroadcastExtension`
- **EAS Project ID:** empty (not yet configured)
- **Runtime version:** appVersion policy

### EAS Build Config

Three profiles defined in `eas.json`:
- **development:** Dev client, internal distribution, iOS simulator disabled
- **preview:** Release build, internal distribution, `preview` channel
- **production:** Release build, iOS auto-increment, `production` channel

Submit config points to `jwjwin0@gmail.com` Apple ID (team ID empty).

### Native Modules / Custom Native Code

Two custom Expo modules:

1. **`modules/broadcast/`** — Screen recording via ReplayKit (iOS) / MediaProjection (Android)
   - iOS: 5 Swift files (BroadcastModule, BroadcastPickerView, FrameProcessor, SharedContainer, SampleHandler)
   - Android: 5 Kotlin files (BroadcastModule, MediaProjectionService, AndroidFrameProcessor, AndroidSharedStorage, AndroidManifest)
   - Expo module config: `expo-module.config.json`

2. **`modules/shortcuts/`** — Siri Shortcuts integration
   - iOS only: 3 Swift files (ShortcutsModule, ShortcutsProvider, ScanFeedIntent)
   - Expo module config: `expo-module.config.json`

3. **`plugins/withBroadcastExtension.js`** — Config plugin that adds the iOS Broadcast Extension target to the Xcode project

### Build Status

The app **requires a development build** to run (cannot use Expo Go due to native modules). Running `npx expo start` would launch the Metro bundler, but the app needs to be installed via EAS Build first. The build config appears complete but EAS project ID and Apple team ID are empty, suggesting the first EAS build hasn't been submitted yet.

---

## 8. DESIGN SYSTEM RECOMMENDATION

### Assessment

The mobile app currently uses **NO third-party UI component library**. Instead, it has:

- A **custom-built UI component library** with 12 primitives (`src/components/ui/`)
- A **comprehensive design token system** (`src/lib/theme.ts`) with ~100+ tokens
- A **theme context** with full light/dark mode support
- **lucide-react-native** for icons (38 files)
- Total custom component imports across the app: ~6 files (moderate adoption)

### Recommendation: KEEP the Custom System, Do NOT Add gluestack-ui

**Reasoning:**

1. **The custom system is already well-built.** The `theme.ts` file is one of the most comprehensive mobile design token systems I've audited. It has semantic color tokens, WCAG AA verification, 4pt grid spacing, responsive typography, named shadow scales, icon sizing, and dark mode — all in a single file. Adding gluestack would duplicate this work.

2. **Low component library usage.** Only 12 custom UI components exist, and they're imported in ~6 files. This is too small to justify the complexity of migrating to gluestack's API surface. The custom components are simpler, lighter, and purpose-built for AlgorithmLens.

3. **Heavy icon dependency would conflict.** The app imports `lucide-react-native` in 38 files. gluestack has its own icon system. Running both would add bundle size and create inconsistency.

4. **Native modules create constraints.** The app already requires a dev client build. Adding gluestack (which sometimes requires native linking or specific RN versions) adds risk without clear benefit.

5. **What to do instead:**
   - **Expand the existing custom UI library** — add missing primitives as needed (e.g., BottomSheet wrapper, Select, TextInput, Modal)
   - **Load the Geist font** on mobile to match the website's typography
   - **Adopt `@gorhom/bottom-sheet`** as a standalone utility (already compatible with installed deps)
   - **Consider `react-native-gifted-charts`** for richer chart components (replaces custom BarChart/StackedBar100)
   - **Keep the design tokens in `theme.ts`** as the single source of truth

**Summary:** The mobile app's design system is mature enough that adding a full UI framework would be regression, not progress. The path forward is to refine and extend what exists, not replace it.

---

*Audit complete. No files were modified.*
