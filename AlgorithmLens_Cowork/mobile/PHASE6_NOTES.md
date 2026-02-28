# Phase 6: Onboarding and Home Screen Polish

**Date:** 2026-02-28
**Status:** Complete (v2 — additional polish pass)

---

## Summary

Polished the onboarding flow and home screen to match the "Calm x Fintech" design direction from DESIGN_UPGRADE_TARGET.md. Upgraded animations to react-native-reanimated, improved visual hierarchy, added empty states, section headers, and an AI consent notice. All text follows epistemic restraint.

**v2 additions:** Smooth exit transition from onboarding, illustration entrance animation, "Skip for now" on last page, ModeToggle unhidden in PlatformBottomSheet, 64x64 platform cards with spring animations in bottom sheet, functional Upgrade card with Sparkles icon, polished empty state with card shadow and dashboard preview.

---

## Part A: Onboarding Polish

**File:** `app/(auth)/onboarding.tsx`

### 1. Animations -> react-native-reanimated

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
- **v2:** Illustration has spring entrance animation (scale 0.85->1, opacity 0->1) on mount

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

### 7. Smooth Exit Transition (v2)

- Screen-level exit animation: opacity 0->1 fade + scale 0.97->1 shrink over 250ms (Easing.out.quad)
- Navigation fires after animation completes (260ms delay)
- Creates smooth visual handoff to the home screen instead of a jarring jump
- `runOnJS` used to safely bridge from reanimated worklet to navigation

### 8. "Skip for now" on Last Page (v2)

- Last page now shows "Skip for now" text below the CTA when no platform is selected
- Subtle textSecondary color, bodySmall typography — accessible but not competing with CTA
- When a platform IS selected, the skip option hides (CTA says "Let's go" instead of "Get Started")
- On earlier pages, "Skip" ghost button jumps directly to platform selection

### 9. Component Architecture

- Extracted `PlatformCard` as separate component (per-card press animations, cleaner code)
- Extracted `AnimatedDot` as separate component (progress indicator logic)
- Both maintain accessibility labels and proper semantic structure

---

## Part B: Home Screen Polish

**Files:** `src/components/home/CalmHomeScreen.tsx`, `src/components/home/PlatformBottomSheet.tsx`

### 1. Visual Hierarchy Reordering

- **#1 action (Scan)**: Moved CTA to first position in StaggeredList (was after FeedScoreCard)
- **#2 (Results)**: FeedScoreCard stays prominent with "YOUR SCORE" section header
- **Everything else**: Streak, weekly summary, achievements, tips are tertiary and organized with section headers
- CTA text shortened: "Choose a Platform to Scan" -> "Scan Your Feed" (more direct)

### 2. Empty State (New User) — Polished (v2)

- When `feedScore === null && !recentScan` (new user), shows inviting empty state card
- **v2 upgrades:**
  - Icon pair now in a 72px tinted circle (brandTintBg) for visual weight
  - Title upgraded from h3 to h2 for better hierarchy
  - Body text uses `body` variant (not bodySmall) for readability
  - Card has `shadows.card` for depth
  - Preview mockup improved: ring outline (borderWidth 6) instead of filled circle, 2-column metric card placeholders, staggered skeleton widths for realism
  - Preview at 70% opacity for clear "preview" feel
  - Card corners use RADIUS.lg throughout

### 3. Section Headers

Added semantic section headers using GL_TYPOGRAPHY.overline with textTertiary color:

| Section | Header | Position |
|---------|--------|----------|
| Feed Score | "YOUR SCORE" | Above FeedScoreCard |
| Weekly Summary | "THIS WEEK" | Above WeeklySummaryCard |
| Achievements | "YOUR PROGRESS" | Above AchievementBadges |

Headers use SPACING.md bottom margin and SPACING.xl top margin for clear grouping.

### 4. Free vs Plus User Differentiation — Functional (v2)

- Added "Upgrade to Plus" card for free users with at least 1 scan
- Condition: `!isPlus && (streakData.total_scans > 0 || dbScanCount > 0)`
- **v2 upgrades:**
  - Now a full `Pressable` that navigates to Settings (upgrade flow)
  - Press feedback: border changes to primary blue, background tints to brandTintBg
  - Sparkles icon added next to title for visual appeal
  - Copy improved: "Get detailed charts, 7-day trends, and full 6-dimension analysis with Plus."
  - Proper accessibility label and role="button"

### 5. Mode Toggle (Broadcast vs Precision) — Unhidden (v2)

- **PlatformBottomSheet**: Removed `{false && ...}` guard on ModeToggle
- ModeToggle now appears when a platform is selected
- Clearly shows which mode (Screen Capture vs Quick Scan) is active with filled blue bg + checkmark
- Each mode has description text explaining what it does
- Screen Capture shows "COMING SOON" badge when native modules aren't available
- Spring animation config and haptic feedback preserved

### 6. PlatformBottomSheet Platform Cards — Upgraded (v2)

- Created `BottomSheetPlatformCard` sub-component matching Phase 5 PlatformPicker spec
- Icon containers upgraded from 56x56 to 64x64
- Icon size increased from 24px to 28px
- Spring press animation: scale to 0.93 on press, spring back to 1 (damping 12, stiffness 200)
- Selected state uses `shadows.card` elevation (upgraded from `shadows.soft`)
- Background opacity: 10% platform color when selected, 4% neutral when not
- Card width: 96px (up from 88px) for better touch targets

### 7. Spacing Consistency

- 24px (SPACING['2xl']) between cards within sections
- 32px (SPACING['3xl']) between sections (with section headers adding visual separation)
- SPACING.xl horizontal padding maintained for iPhone SE compatibility

---

## Verification Checklist

| Scenario | Status | Notes |
|----------|--------|-------|
| Onboarding: clear, smooth, professional | Pass | Reanimated transitions, entrance animation, smooth exit |
| Onboarding: "Skip" subtle but accessible | Pass | Ghost button on early pages, "Skip for now" text on last page |
| Onboarding: AI consent feels trustworthy | Pass | Small shield-icon notice, not a wall |
| Onboarding: smooth transition to home | Pass | 250ms fade+scale exit before navigation |
| Home (new user): inviting, clear CTA | Pass | Polished empty state with dashboard preview, prominent Scan CTA |
| Home (returning user): informative, well-organized | Pass | Section headers, reordered hierarchy |
| Home (free vs Plus): appropriate premium teasers | Pass | Functional Upgrade card with Sparkles icon |
| Mode toggle: clear which mode is selected | Pass | Blue fill + checkmark on selected mode |
| All text follows epistemic restraint | Pass | No algorithm accusations, describes patterns |
| Both light and dark mode look polished | Pass | All colors use theme tokens |

---

## Epistemic Restraint Compliance

All copy verified:
- "See what's in your feed" (observable statement)
- "A clear picture of what appears" (factual)
- "AlgorithmLens analyzes your feed locally using AI" (transparent about mechanism)
- "Your data stays on your device" (reassuring, accurate)
- "See what appeared in your feed" (observable)
- "Your feed insights will appear here" (neutral)
- "Scan your first feed to see what's in your content" (empowering)
- "Get detailed charts, 7-day trends, and full 6-dimension analysis with Plus" (feature description)
- "Record your real feed as you scroll" (describes mechanism)
- "Analyze content via built-in browser" (describes mechanism)
- No anthropomorphization of algorithms anywhere

---

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `app/(auth)/onboarding.tsx` | Modified | Exit animation, illustration entrance, skip-for-now, Pressable import |
| `src/components/home/CalmHomeScreen.tsx` | Modified | Upgrade card functional, polished empty state, Sparkles icon, router import |
| `src/components/home/PlatformBottomSheet.tsx` | Modified | ModeToggle unhidden, BottomSheetPlatformCard (64x64, spring), Info import |

---

## Dependencies on Prior Phases

- **Phase 1**: Geist fonts, GL_TYPOGRAPHY, gluestack theme bridge
- **Phase 2**: All screen migrations to glue components (Text, Button, etc.)
- **Phase 2.5**: Hardcoded style cleanup, card hierarchy, spacing
- **Phase 3**: ALScoreGauge (used by FeedScoreCard, unchanged)
- **Phase 4**: RevenueCat mock (isPlus entitlement check in AuthContext)
- **Phase 5**: @gorhom/bottom-sheet (PlatformBottomSheet, ModeToggle)
