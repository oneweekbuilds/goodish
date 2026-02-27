# Animation Infrastructure Audit — Mobile App

**Date:** 2026-02-27
**Scope:** AlgorithmLens React Native mobile app (`mobile/`)

## Animation Libraries Installed

| Library | Version | Status |
|---------|---------|--------|
| `react-native-reanimated` | ~3.16.1 | Installed (used in ProgressBar) |
| `expo-haptics` | ^15.0.8 | Installed (used via `src/lib/haptics.ts`) |
| `expo-linear-gradient` | ~15.0.8 | Installed (used in dashboard) |
| React Native `Animated` API | built-in | Primary animation approach across codebase |
| `moti` | — | NOT installed |

## Existing Animation Usage (Before)

### UI Components
| Component | Animation Type | Details |
|-----------|---------------|---------|
| `ui/Skeleton.tsx` | `Animated.loop` + `Animated.sequence` | Opacity pulse 0.3↔0.7, 1000ms per direction. Has cleanup. Respects reduced motion. |
| `ui/Toast.tsx` | `Animated.timing` | Slide in from bottom (translateY 300→0), auto-dismiss after 3s with slide out. 300ms duration. |
| `ui/ProgressBar.tsx` | `react-native-reanimated` | `useSharedValue` + `withTiming` for smooth progress width. Uses native driver. |
| `ui/Button.tsx` | None | Uses Pressable opacity only (no animation) |
| `ui/Card.tsx` | None | Static, no entrance animation |

### Home Components
| Component | Animation Type | Details |
|-----------|---------------|---------|
| `home/StreakBadge.tsx` | `Animated.loop` + pulse | Scale pulse 1.0↔1.08 on streak glow, 1500ms. |
| `home/MilestoneModal.tsx` | `Animated.parallel` | Fade + spring scale on open, timing fade on close. |
| `home/FirstUseWalkthrough.tsx` | `Animated.timing` | Step transitions with opacity fade 200ms. |
| `home/AchievementBadges.tsx` | `Animated.loop` | Glow animation on newly earned badges. |
| `home/PlatformBottomSheet.tsx` | `Animated.parallel` | Slide up + overlay fade for bottom sheet. Uses spring. |
| `home/FeedScoreCard.tsx` | None | Static score display — no count-up animation |

### Dashboard Components
| Component | Animation Type | Details |
|-----------|---------------|---------|
| `dashboard/BarChart.tsx` | `Animated.timing` + `Animated.stagger` | Bar width grows from 0 to full. 400ms + 100ms stagger. |
| `dashboard/StackedBar100.tsx` | `Animated.timing` + `Animated.stagger` | Segment widths animate in. 300ms + 80ms stagger. |
| `dashboard/InsightHero.tsx` | `Animated.timing` | Fade in + chevron rotation. |
| `dashboard/DashboardTour.tsx` | `Animated.parallel` | Fade + slide for tour overlay steps. |

### Other Components
| Component | Animation Type | Details |
|-----------|---------------|---------|
| `broadcast/BroadcastOverlay.tsx` | `Animated.loop` | Recording pulse animation. |
| `analysis/AnalysisProgress.tsx` | `Animated.loop` + `Animated.timing` | Spinner rotation + progress bar + fade. |
| `plan/UpgradeModal.tsx` | `Animated.parallel` | Slide + overlay for upgrade modal. |

### Screen-Level Animations
| Screen | Animation | Details |
|--------|-----------|---------|
| `(tabs)/_layout.tsx` | `animation: 'fade'` | Tab transitions use fade. Already configured. |
| `(tabs)/dashboard.tsx` | Tab content fade | 80ms fade out / 150ms fade in between dashboard sub-tabs. |

## Existing Haptic Usage

### Haptics Library (`src/lib/haptics.ts`)
Functions available (all platform-safe with try/catch):
- `triggerSelection()` — selection feedback
- `triggerImpactLight()` — light impact
- `triggerImpactMedium()` — medium impact
- `triggerImpactHeavy()` — heavy impact
- `triggerNotificationSuccess()` — success notification
- `triggerNotificationWarning()` — warning notification
- `triggerNotificationError()` — error notification

### Current Haptic Callers
| Component | Haptic Functions Used |
|-----------|---------------------|
| `home/PlatformPicker.tsx` | `triggerImpactLight`, `triggerImpactMedium` |
| `home/PlatformBottomSheet.tsx` | `triggerImpactLight`, `triggerImpactMedium`, `triggerSelection` |
| `home/ModeToggle.tsx` | `triggerSelection` |
| `home/MilestoneModal.tsx` | `triggerNotificationSuccess`, `triggerSelection` |
| `home/CalmHomeScreen.tsx` | `triggerImpactMedium` |
| `broadcast/BroadcastPickerButton.tsx` | `triggerImpactMedium` |
| `broadcast/BroadcastOverlay.tsx` | `triggerImpactMedium` |
| `scanner/ScanOverlay.tsx` | `triggerNotificationSuccess` |
| `analysis/AnalysisProgress.tsx` | `triggerNotificationSuccess`, `triggerNotificationError` |
| `plan/UpgradeModal.tsx` | `triggerImpactLight`, `triggerImpactMedium` |
| `(tabs)/dashboard.tsx` | `triggerSelection` |

## Gaps Identified (Planned Additions)

### Phase 2: Component-Level
1. **Button press feedback** — scale 0.97 on press, spring back
2. **Card entrance animation** — fade-in + translateY(8→0) on mount only
3. **FeedScoreCard count-up** — animated number from 0 to score on first display
4. **Skeleton shimmer** — currently opacity pulse (acceptable), could upgrade to gradient shimmer
5. **Toast** — already animated (slide from bottom), adequate
6. **StaggeredList** — new reusable wrapper for list item stagger

### Phase 3: Screen Transitions
1. **Tab nav transitions** — already have fade, adequate
2. **Screen content fade-in** — opacity animation on data load completion

### Phase 4: Haptic Feedback
1. **Button presses** — `triggerImpactLight` (not yet connected)
2. **Tab switches** — `triggerImpactLight` (not yet connected)
3. **Scan completion** — already has `triggerNotificationSuccess`
4. **Checkout success** — needs `triggerNotificationSuccess`
