# Habit-Forming Features Changelog

## Overview

Added five interconnected features designed to make AlgorithmLens a daily habit — inspired by Duolingo, Wordle, and Oura Ring. Every feature follows epistemic restraint: warm, factual, never manipulative.

## Features Implemented

### 1. Enhanced Streak System

**Files:** `src/lib/streakManager.ts`, `src/types/streak.ts`, `src/components/home/StreakBadge.tsx`

- **Streak Freeze:** Users get one free streak freeze per week (resets every Monday). If a user misses a day but has a freeze available, it auto-applies to save their streak (up to a 3-day gap). Visual snowflake indicator shows when a freeze is available.
- **Progressive Flame Visual:** The streak flame grows in size and color intensity as the streak lengthens:
  - Days 1–2: "Spark" — small, default orange (1.0x scale)
  - Days 3–6: "Glow" — slightly larger, warm orange (1.15x scale)
  - Days 7–13: "Flame" — larger, deep orange (1.3x scale)
  - Days 14–29: "Fire" — large, blazing (1.45x scale)
  - Days 30+: "Blaze" — full size, vivid (1.6x scale)
- **At-Risk Indicator:** If it's 6 PM or later and the user hasn't scanned today, a gentle clock icon and "Scan before midnight to keep your streak" message appears with a soft pulse animation. Never guilt-inducing.
- **Streak Freeze Integration:** `recordScanWithFreeze()` checks for available freezes before breaking a streak.

### 2. Weekly Summary Report

**File:** `src/components/home/WeeklySummaryCard.tsx`

A card displayed on the home screen showing:
- Number of scans this week
- Ad density change vs. last week (with directional arrows)
- Feed Score change vs. last week
- Top platform by scan count
- Total posts analyzed

Design: Calendar-accented card with green header. Comparison text uses neutral language ("shifted" instead of "declined"). Shows on home screen when scan data is available.

### 3. Achievement/Badge System

**Files:** `src/types/achievements.ts`, `src/lib/achievements.ts`, `src/components/home/AchievementBadges.tsx`

Eight achievements:
- **First Scan** — Completed your first feed scan
- **Multi-Platform** — Scanned 3+ different platforms
- **Streak Starter** — 3-day streak
- **Week Warrior** — 7-day streak
- **Feed Detective** — 50+ total posts scanned
- **Pattern Spotter** — Feed health score improved
- **Night Owl** — Scanned after 10 PM
- **Early Bird** — Scanned before 8 AM

Implementation:
- Achievements stored in AsyncStorage with `EarnedAchievement[]`
- Pure checker functions evaluate eligibility from context
- Horizontal scroll collection on home screen
- Earned badges are colored; unearned are ghosted
- New users see a teaser "Badges to earn" with first 4 ghosted badges
- Newly earned badges get a 3-cycle glow animation
- MAX_SCAN_HISTORY capped at 500 entries to prevent unbounded storage

### 4. Feed Health Score Trending

**Files:** `src/components/home/FeedScoreTrend.tsx`, `src/lib/achievements.ts` (score history functions)

- Tracks Feed Health Score over time (stored per day in AsyncStorage)
- Shows a 7-day bar sparkline on the home screen
- Color-coded direction: green arrow up (improving), orange arrow down (declining), gray dash (stable)
- Contextual summary: "Your feed health improved 8% this week"
- Minimum visualization range of 10 points prevents exaggerated display
- MAX_SCORE_HISTORY capped at 90 entries (~3 months)

### 5. Smart Scan Suggestions

**Files:** `src/components/home/SmartSuggestion.tsx`, `src/lib/achievements.ts` (suggestion functions)

Three contextual suggestion types:
- **Platform diversity:** After 3+ scans on one platform, suggests trying a different one
- **Time gap:** After 2+ days without scanning, shows "Your last scan was [day]. Feeds shift over time — want to see what's changed?"
- **Time-of-day variety:** If all recent scans are morning or evening, suggests scanning at a different time

Design: Compass/clock icon with soft card. Tapping the suggestion opens the scan flow.

### 6. Integration Layer

**File:** `src/hooks/useHabitFeatures.ts`

A unified hook that aggregates all habit feature data:
- Loads all data in parallel from AsyncStorage on mount
- Refreshes at-risk status when app comes to foreground
- Provides `recordHabitScan()` to track scan history + check achievements
- Handles achievement notification state (newly earned → seen)

**File:** `app/(tabs)/index.tsx`, `src/components/home/CalmHomeScreen.tsx`

Updated to pass all new data through props. New layout order:
1. Greeting → 2. Streak Badge → 3. Feed Score → 4. Score Trend → 5. Scan CTA → 6. Weekly Summary → 7. Achievements → 8. Smart Suggestion → 9. Recent Scan → 10. Daily Tip

## Design System Additions

**File:** `src/lib/theme.ts`

Added streak progression color tokens (light + dark mode):
- `streakDeepOrange` / `streakDeepOrangeBg` — for "hot" flame tier
- `streakBlaze` / `streakBlazeBg` — for "blazing" flame tier

## Self-Review Cycles

### Cycle 1: Quality & Care
- Added achievement teaser state (ghosted badges for new users)
- Fixed SmartSuggestion disabled state (was accepting touches when no action)
- Fixed WeeklySummaryCard accessibility role (removed non-standard "summary")

### Cycle 2: Epistemic Restraint
- All 40+ pieces of user-facing text reviewed — 100% compliant
- No banned words, no manipulative language, no guilt-tripping

### Cycle 3: Design System Compliance
- Replaced 2 hardcoded hex colors in StreakBadge with theme tokens
- Replaced 2 hardcoded font sizes with TYPOGRAPHY-derived values

### Cycle 4: Edge Cases
- Fixed FeedScoreTrend sparkline: enforced minimum range of 10 points to prevent exaggerated visualization when scores are identical
- Fixed DST-safe date calculation: using UTC timestamps in daysBetweenDates() to avoid timezone issues

### Cycle 5: Final TypeScript Check
- `npx tsc --noEmit` — zero errors
- All new files compile cleanly with strict mode
