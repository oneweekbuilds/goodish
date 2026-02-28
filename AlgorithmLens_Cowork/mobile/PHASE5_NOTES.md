# Phase 5: Scanner UX Upgrade with Bottom Sheet and Improved Visuals

**Date:** 2026-02-28
**Status:** Complete

---

## Summary

Upgraded the entire browser scanner UX flow — from platform selection through scanning to results display. Replaced the custom modal-based PlatformBottomSheet with `@gorhom/bottom-sheet`, upgraded the PlatformPicker with card-based design and press animations, improved the scanner chrome bar with a smooth progress indicator, enhanced the scan overlay with premium animations, converted the success screen to a multi-snap-point bottom sheet with charts, and added Share CTA to the analysis results screen.

---

## Package Installed

| Package | Version | Purpose |
|---------|---------|---------|
| `@gorhom/bottom-sheet` | ^5.2.8 | Production-grade bottom sheet with snap points, gestures, backdrop |

Installed with `--legacy-peer-deps` (consistent with prior phases). No additional native dependencies required — leverages existing `react-native-reanimated` (v3.16) and `react-native-gesture-handler` already in the project.

---

## Step 1: PlatformBottomSheet → @gorhom/bottom-sheet

**File:** `src/components/home/PlatformBottomSheet.tsx`

### What changed
- Replaced `Modal` + `Animated.Value` slide/overlay animations with `BottomSheet` from @gorhom
- Added `BottomSheetBackdrop` (disappearsOnIndex={-1}, appearsOnIndex={0}, pressBehavior="close")
- Added `BottomSheetScrollView` replacing standard ScrollView
- Snap points: `['60%', '85%']`
- Spring animation config: `{ damping: 50, stiffness: 500 }`
- Ref-based open/close: when `visible=true`, expands to index 0; when `visible=false`, closes to -1

### What was preserved
- Same props interface: `{ visible, onClose, onScanStart, lastPlatform }`
- Same content: handle bar, "Choose a platform" header, close button, 3-column platform grid, ModeToggle (hidden), Start button
- Same haptic feedback, accessibility labels, theme colors
- React.memo wrapping

---

## Step 2: PlatformPicker Visual Upgrade

**File:** `src/components/home/PlatformPicker.tsx`

### What changed
- Replaced `TouchableOpacity` with `Pressable` for platform items
- Added press animation using react-native-reanimated: scale 0.95 on press (spring: damping 15, stiffness 150)
- Upgraded icon containers: 56x56 → 64x64
- Increased unselected background opacity from 6% to 10%
- Selected state: `shadows.card` instead of `shadows.soft`
- Wrapped each platform in a mini card: bgCard background, borderLight border, RADIUS.lg, SPACING.sm padding
- Extracted `PlatformItem` sub-component for better organization

### What was preserved
- Double-tap to start scan behavior
- ModeToggle (hidden)
- Start button
- All accessibility labels and hints

---

## Step 3: Scanner Chrome Bar Upgrade

**File:** `app/scanner/[platform].tsx`

### What changed
- Header toolbar: reduced vertical padding, removed border-bottom, added subtle shadow (shadows.sm)
- Added 98% opacity to header background for subtle transparency
- Back button: added bgSecondary background, RADIUS.md border radius
- Cancel button: transparent background (was cancelButtonBg)
- **New: Animated progress bar** below header:
  - 3px thin bar, primaryBlue color
  - Loading state: animates 0% → 80% over 3 seconds (Easing.out.quad)
  - Scanning state: snaps to 100% over 300ms
  - Hidden when not loading/scanning
  - Uses react-native-reanimated useSharedValue + useAnimatedStyle

---

## Step 4: Scan Overlay Premium Upgrade

**File:** `src/components/scanner/ScanOverlay.tsx`

### What changed
1. **Animated entrance**: Fade-in + slide-up (translateY 20→0, opacity 0→1) with spring (damping 20, stiffness 150)
2. **Animated progress bars**: Smooth width transitions with withTiming (300ms), added 2px bright highlight at leading edge
3. **Stats row**: Numbers upgraded to `scoreSmall` variant; replaced "|" text separator with visual 1px divider
4. **Save button pulse**: Scale 1→1.05→1 pulse animation when canSave first becomes true (using withSequence + withSpring)
5. **Minimized pill**: Dot indicator pulses opacity 1→0.4→1 on loop (withRepeat + withTiming, 2s cycle)

### What was preserved
- All threshold checks (MIN_POSTS_REQUIRED, MIN_SCAN_DURATION_SECS)
- Milestone messages, button labels, timer logic
- Auto-minimize after 8 seconds
- Haptic feedback on save

---

## Step 5: Results Bottom Sheet with Snap Points

**File:** `app/scanner/[platform].tsx`

### What changed
- Replaced full-screen success overlay with `@gorhom/bottom-sheet`
- Three snap points: `['12%', '50%', '90%']`
  - **Collapsed (12%)**: Handle + "Scan complete — pull up for results"
  - **Half (50%)**: Summary dashboard with quick stats, ALScoreGauge, ALPieChart breakdown, "View Dashboard" CTA
  - **Full (90%)**: Detailed view with quality warnings, all stats, dimension labels, navigation buttons
- WebView stays visible behind the sheet
- Sheet expands to index 1 (50%) when scan completes
- Spring animation: damping 50, stiffness 500
- Chart components imported: ALScoreGauge, ALPieChart from Phase 3

### What was preserved
- handleScanComplete logic (data processing, Supabase save, classification pipeline)
- Saving overlay (separate from results sheet)
- All scan quality indicators and warnings
- Navigation to dashboard and other screens

---

## Step 6: Analysis Results Screen Upgrade

**File:** `app/analysis/[sessionId].tsx`

### What changed
1. **Share Results button**: Share2 icon in header, 36x36 circle matching back button style, logs tap (placeholder)
2. **Step connector lines**: 2px vertical lines (borderLight) connecting the 3 progress step indicators
3. **Animated results entrance**: BroadcastResultsSummary wrapped in ContentFadeIn (250ms)
4. **Header styling**: Added bottom border (1px, borderLight) with proper padding

### What was preserved
- All analysis pipeline integration (useAnalysis hook, frame processing)
- AnalysisProgress and BroadcastResultsSummary components
- Error states (no frames, no API key)
- Back button with cancel confirmation during analysis
- Streak recording and Siri shortcut donation

---

## Testing Notes

### Expected Flow
1. **Home → Platform picker**: Bottom sheet slides up smoothly with @gorhom gestures. Platform cards have press animations.
2. **Select platform → Start**: Platform highlights with card elevation. "Start Scan" button activates.
3. **Scanner loads**: Chrome bar shows animated progress bar filling to 80%.
4. **Scanning**: Progress bar at 100%. Scan overlay slides up with fade-in. Progress bars animate smoothly.
5. **Scan complete**: Results bottom sheet expands to 50%. Shows score gauge and content breakdown.
6. **Pull up**: Sheet expands to 90% with full stats, quality indicators, and navigation.
7. **View Dashboard**: Navigates to dashboard tab.

### Error States
- Scan failure: WebViewScanner error overlay still works (not modified)
- No data: Analysis screen shows "No frames to analyze" (not modified)
- Network failure: Local backup path still functions

### Known Limitations
- Share Results button is a placeholder (logs to console, no sharing implementation)
- Analysis dimension tabs in results sheet show labels only (no chart data available from scan context)
- Full-screen analysis results (/analysis/[sessionId]) is for broadcast mode — Precision mode scan goes through the bottom sheet flow

---

## Dependencies on Prior Phases

- **Phase 1**: Geist fonts, GL_TYPOGRAPHY, gluestack theme bridge
- **Phase 2**: All screen migrations to glue components
- **Phase 2.5**: Hardcoded style cleanup, card hierarchy
- **Phase 3**: ALScoreGauge, ALPieChart chart components (used in results bottom sheet)
- **Phase 4**: RevenueCat mock (not directly used in scanner, but entitlements unchanged)
