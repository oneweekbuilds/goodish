# Phase 6: Onboarding and Home Screen Polish

**Date:** 2026-02-28
**Status:** Complete

---

## Summary

Polished the onboarding flow and home screen to match the "Calm × Fintech" design direction from DESIGN_UPGRADE_TARGET.md. Upgraded animations to react-native-reanimated, improved visual hierarchy, added empty states, section headers, and an AI consent notice. All text follows epistemic restraint.

---

## Part A: Onboarding Polish

**File:** `app/(auth)/onboarding.tsx`

### 1. Animations → react-native-reanimated

- Replaced `Animated.timing()` (RN Animated) with `useSharedValue` + `useAnimatedStyle` + `withTiming` from react-native-reanimated v3.16
- Page transitions: 200ms cross-fade with 4px translateY slide (subtle "replacement" feel)
- Progress dots: smooth 300ms width animation via `AnimatedDot` component
- Platform cards: spring-based press scale (0.95) and selection scale (1.02) via `PlatformCard` component

### 2. Screen 1: Value Prop (Visual Upgrade)

- Replaced abstract concentric circles with a polished "phone frame" illustration
- Three layered blue circles (140px, 110px, 80px) creating depth
- Overlapping analysis icons on the primary blue circle:
  - **Eye** (center, 32px) — core insight capability
  - **BarChart3** (bottom-right, in 44px rounded badge) — analytics
  - **Shield** (top-right, in 44px green badge) — privacy/trust
- All icons use `textInverse` on colored backgrounds for contrast

### 3. Screen 2: How It Works (Timeline Upgrade)

- Added 2px vertical connector line (borderLight) between steps, creating a timeline visual
- Replaced blue50 icon containers with primary blue circles containing step numbers (1, 2, 3)
- Increased icon containers from 40px to 48px per design doc
- Step numbers in Geist h3 white text on primary blue background

### 4. Screen 3: Platform Selection (Upgraded Picker)

- Increased icon containers from 56x56 to 64x64
- Background opacity increased from 9% to 10%
- Icon size increased from 24px to 28px to fill larger container
- Added `PlatformCard` sub-component with spring press animation
- Card wrapping with proper spacing and shadows
- Added marginBottom to grid for visual separation from consent notice

### 5. AI Consent Notice (New)

- Small, trustworthy notice below platform grid on screen 3
- Text: "AlgorithmLens analyzes your feed locally using AI. Your data stays on your device."
- Design: Light blue50 background at 40% opacity, Shield icon, bodySmall text
- NOT a terms wall — a single reassuring sentence
- Passes epistemic restraint: transparent about mechanism, no overpromising

### 6. Progress Indicator

- Extracted `AnimatedDot` component for reusable animated progress dots
- Active dot: 24px pill shape, primary blue
- Inactive dots: 8px circles, borderSlate300
- Smooth 300ms `withTiming` width transition when changing pages

### 7. Component Architecture

- Extracted `PlatformCard` as separate component (per-card press animations, cleaner code)
- Extracted `AnimatedDot` as separate component (progress indicator logic)
- Both maintain accessibility labels and proper semantic structure

---

## Part B: Home Screen Polish

**File:** `src/components/home/CalmHomeScreen.tsx`

### 1. Visual Hierarchy Reordering

- **#1 action (Scan)**: Moved CTA to first position in StaggeredList (was after FeedScoreCard)
- **#2 (Results)**: FeedScoreCard stays prominent with "YOUR SCORE" section header
- **Everything else**: Streak, weekly summary, achievements, tips are tertiary and organized with section headers
- CTA text shortened: "Choose a Platform to Scan" → "Scan Your Feed" (more direct)

### 2. Empty State (New User)

- When `feedScore === null && !recentScan` (new user), shows inviting empty state card
- Card contents:
  - Eye + BarChart3 icon pair (primary blue, 32px)
  - Title: "Your feed insights will appear here"
  - Subtitle: "Scan your first feed to see what's really in your content"
  - Preview mockup: muted circle (placeholder score ring) + skeleton bars (placeholder metrics)
- Uses bgCard background, borderSubtle border, bgSecondary for preview area
- Feels INVITING, not empty

### 3. Section Headers

Added semantic section headers using GL_TYPOGRAPHY.overline with textTertiary color:

| Section | Header | Position |
|---------|--------|----------|
| Feed Score | "YOUR SCORE" | Above FeedScoreCard |
| Weekly Summary | "THIS WEEK" | Above WeeklySummaryCard |
| Achievements | "YOUR PROGRESS" | Above AchievementBadges |

Headers use SPACING.md bottom margin and SPACING.xl top margin for clear grouping.

### 4. Free vs Plus User Differentiation

- Added "Upgrade to Plus" card for free users with at least 1 scan
- Condition: `!isPlus && (streakData.total_scans > 0 || dbScanCount > 0)`
- Card design: bordered (no background fill), transparent bg, borderDefault border
- Content: "Unlock detailed insights" title, "Unlock detailed charts, 7-day trends, and full analysis" description, "Learn More" link-style button in primary blue
- Imported `isPlus` from `useAuth()` hook

### 5. Spacing Consistency

- 24px (SPACING['2xl']) between cards within sections
- 32px (SPACING['3xl']) between sections (with section headers adding visual separation)
- SPACING.xl horizontal padding maintained for iPhone SE compatibility

---

## Verification Checklist

| Scenario | Status | Notes |
|----------|--------|-------|
| Onboarding: clear, smooth, professional | ✓ | Reanimated transitions, polished visuals |
| Home (new user): inviting, clear CTA | ✓ | Empty state card with preview mockup |
| Home (returning user): informative, well-organized | ✓ | Section headers, reordered hierarchy |
| Home (free vs Plus): appropriate premium teasers | ✓ | "Upgrade to Plus" card for free users |
| All text follows epistemic restraint | ✓ | No algorithm accusations, describes patterns |
| Both light and dark mode look polished | ✓ | All colors use theme tokens |

---

## Epistemic Restraint Compliance

All copy verified:
- "See what's in your feed" ✓ (observable statement)
- "A clear picture of what appears" ✓ (factual)
- "AlgorithmLens analyzes your feed locally using AI" ✓ (transparent about mechanism)
- "Your data stays on your device" ✓ (reassuring, accurate)
- "See what appeared in your feed" ✓ (observable)
- "Your feed insights will appear here" ✓ (neutral)
- "Scan your first feed to see what's really in your content" ✓ (empowering)
- "Unlock detailed charts, 7-day trends, and full analysis" ✓ (feature description)
- No anthropomorphization of algorithms anywhere

---

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `app/(auth)/onboarding.tsx` | Modified | Full rewrite: reanimated, new visuals, AI consent, animated dots, PlatformCard |
| `src/components/home/CalmHomeScreen.tsx` | Modified | Reordered hierarchy, empty state, section headers, upgrade card, CTA text |

---

## Dependencies on Prior Phases

- **Phase 1**: Geist fonts, GL_TYPOGRAPHY, gluestack theme bridge
- **Phase 2**: All screen migrations to glue components (Text, Button, etc.)
- **Phase 2.5**: Hardcoded style cleanup, card hierarchy, spacing
- **Phase 3**: ALScoreGauge (used by FeedScoreCard, unchanged)
- **Phase 4**: RevenueCat mock (isPlus entitlement check in AuthContext)
- **Phase 5**: @gorhom/bottom-sheet (PlatformBottomSheet, unchanged)
