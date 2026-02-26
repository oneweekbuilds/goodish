# Home Screen Redesign & Onboarding Flow — Changelog

## Overview

Redesigned the home screen and onboarding flow to get users excited about their first scan within 30 seconds of opening the app. Inspired by Oura Ring's calm, data-forward design.

## Home Screen Redesign

### Files Modified
- `src/components/home/CalmHomeScreen.tsx` — Complete layout redesign

### Files Created
- `src/components/home/PlatformBottomSheet.tsx` — Bottom sheet for platform selection
- `src/components/home/RecentScanCard.tsx` — Last scan preview card
- `src/components/home/DailyTipCard.tsx` — Rotating epistemically-restrained tip card

### Changes
1. **Single prominent CTA**: Replaced the platform grid on the home screen with a single "Scan Your Feed" button using `shadows.hero` and `RADIUS.xl` for visual prominence.
2. **Bottom sheet platform picker**: Tapping the CTA slides up a `PlatformBottomSheet` with platform icons and mode toggle, keeping the home screen clean and focused.
3. **Recent scan preview**: Added `RecentScanCard` showing last scan metadata (platform, time ago, post count, ad %) with relative time formatting.
4. **Daily tip card**: Added `DailyTipCard` with 8 epistemically-restrained rotating tips. Uses `TYPOGRAPHY.overline` for the "Did you know?" label. All tips describe observable patterns — none imply algorithmic intent.
5. **Updated index.tsx**: Now passes `recentScan` and `onRecentScanPress` props from `useDashboard().latestScan`.

### Layout Order (Top to Bottom)
1. Time-of-day greeting with contextual subheading
2. Streak badge (subtle, not aggressive)
3. Feed Score card (or inviting prompt for new users)
4. Primary CTA: "Scan Your Feed"
5. Recent scan preview (conditional)
6. Daily tip card

## Onboarding Flow Redesign

### Files Modified
- `app/(auth)/onboarding.tsx` — Complete rewrite

### Changes
1. **3 screens, 15 seconds max**: Stripped down from a verbose 3-screen flow with AI consent toggle to a focused 3-screen flow.
2. **Screen 1**: "See what's in your feed" — abstract concentric circle graphic (SVG-like) with Eye icon, one-line subtitle. Removed "Plus teaser" card — too much info for onboarding.
3. **Screen 2**: "How it works" — 3 steps with icons: Open → Scroll → Discover. Each step has a bold label and a single short detail line. Removed verbose paragraph.
4. **Screen 3**: "Start your first scan" — platform selection grid. Selecting a platform pre-loads it; tapping "Let's go" completes onboarding AND starts a scan if a platform was selected.
5. **Skip button**: Added on screens 1–2 so power users can jump directly to platform selection.
6. **AI consent simplified**: Defaults to true (can be changed in Settings). Removed the consent toggle from onboarding to reduce friction. The consent screen was adding 5+ seconds to the flow.

## Self-Review Cycles

### Cycle 1: First-Time User Clarity
- Home screen: Greeting → subheading explains the app → CTA is obvious. Pass.
- Onboarding: Screen 1 title immediately communicates value. Screen 2 explains the 3-step process. Screen 3 invites action. Pass.

### Cycle 2: Word Cutting
- Changed "See what's really in your feed" to "See what's in your feed" — "really" implied hidden content, violating epistemic restraint.
- Removed "AlgorithmLens gives you a clear picture of…" from onboarding subtitle; replaced with "A clear picture of what appears — sources, ads, tone, and more." (shorter, no app name needed).
- All screens scannable in under 2 seconds. Pass.

### Cycle 3: Design System Compliance
- All colors use `colors.*` tokens from `useTheme()`.
- All spacing uses `SPACING.*` constants (4pt grid).
- All typography uses `TYPOGRAPHY.*` presets.
- All radii use `RADIUS.*` constants.
- All shadows use `shadows.*` from `useTheme()`.
- DailyTipCard "Did you know?" label updated from custom `letterSpacing` to `TYPOGRAPHY.overline`.
- No hardcoded color values found.

### Cycle 4: Accessibility
- All interactive elements have `accessibilityRole="button"` and `accessibilityLabel`.
- All touch targets meet 44pt minimum (`minHeight: 44` or larger).
- Bottom sheet close button: 44×44pt touch target with `hitSlop`.
- Platform icons in grid: 88pt wide containers (exceed 44pt minimum).
- Onboarding page indicators have `accessibilityLabel` with page count.
- Greeting has `accessibilityRole="header"`.
- All onboarding screens have `accessibilityRole="header"` on titles.
- Steps in onboarding Screen 2 have combined `accessibilityLabel` ("Step 1: Open — Pick a platform").
- DailyTipCard wraps entire card with `accessibilityLabel` including full tip text.
- VoiceOver users can navigate all screens meaningfully.

### Cycle 5: TypeScript & Final Review
- `npx tsc --noEmit` — **zero errors**.
- Final read-through complete. All code follows design system, epistemic restraint standards, and accessibility requirements.
