# Changelog: App Store Preparation (Audit #15)

**Date:** 2026-02-22
**Scope:** App Store assets, metadata, EAS build configuration

---

## New Files Created

### assets/icon.svg
- SVG app icon using the primary blue gradient (#2563EB → #1D4ED8)
- Lens/prism design representing clarity and insight
- Rounded square background (224px radius at 1024×1024)
- Elements: outer lens ring, inner lens body, refraction lines, data point dots, subtle highlight
- Designed to remain legible at 60×60px (no fine details)

### assets/splash.svg
- SVG splash screen at 1284×2778 (iPhone 6.5" dimensions)
- Background color matches bgPrimary (#F7F8FC → #F1F5F9 gradient)
- Centered app icon (scaled down) with "AlgorithmLens" name below
- Tagline "See what's really in your feed" in secondary text color

### APP_STORE_METADATA.md
- App Name: AlgorithmLens (13 chars, within 30-char limit)
- Subtitle: "See what's really in your feed" (30 chars, at limit)
- Description: 2,227 chars (within 4,000-char limit)
  - Hook opening, feature-by-feature breakdown of all 6 dashboard tabs
  - Privacy assurances, Goodish Initiative context, clear CTA
- Keywords: 100 chars exactly, optimized for feed analysis / algorithm awareness / digital wellness searches
- Category: Utilities (primary), Social Networking (secondary)
- Age Rating: 4+
- Apple Review Notes: Comprehensive explanation of ReplayKit broadcast usage
  - Step-by-step flow (7 steps)
  - Why screen recording is necessary
  - User consent and control section
  - Data retention policy
  - Explicit "What we do NOT do" list (6 items)
  - App Group usage explanation
  - Background modes justification
  - Test instructions (no test account needed)

### SCREENSHOT_SPEC.md
- 5 screenshot specifications with detailed app state descriptions
- Screen 1: Home screen with streak and feed score
- Screen 2: Broadcast recording in progress
- Screen 3: Analysis results summary
- Screen 4: Dashboard overview tab
- Screen 5: History with comparison mode
- General guidelines for text overlays, device frames, data realism

### eas.json
- EAS CLI version >= 13.0.0
- Three build profiles:
  - `development`: Debug build, development client, internal distribution
  - `preview`: Release build, internal distribution, preview channel (TestFlight)
  - `production`: Release build, auto-increment build number, production channel
- Submit configuration for iOS with appleId placeholder

## Modified Files

### app.json
- Added `buildNumber: "1"` for iOS
- Added `config.usesNonExemptEncryption: false` (avoids export compliance prompt)
- Added `ITSAppUsesNonExemptEncryption: false` to infoPlist
- Added `privacyManifests` with empty arrays and tracking: false
- Added `versionCode: 1` for Android
- Changed `userInterfaceStyle` from "light" to "automatic" (supports dark mode)
- Added `extra.eas.projectId` placeholder
- Added `owner` field
- Added `runtimeVersion` with appVersion policy
- Added `updates.url` placeholder

## Self-Review Summary

### Cycle 1 — Description Quality
- Removed "locally and" from "locally and securely" (frames do go to server-side API)
- Verified character count within 4,000-char limit
- Confirmed subtitle is exactly 30 chars

### Cycle 2 — Apple Review Notes
- Added "User consent and control" section emphasizing user-initiated recordings
- Added "Data retention" section clarifying frame lifecycle and deletion policy
- Strengthened transparency around what happens to captured data

### Cycle 3 — Config Completeness
- Verified all required Apple fields present in app.json
- Confirmed EAS profiles match standard development → TestFlight → production workflow
- Empty fields (projectId, ascAppId, appleTeamId) are expected pre-`eas init`

### Cycle 4 — Keyword Optimization
- Changed "feed analysis" → "feed analyzer" (noun form matches search behavior)
- Replaced "feed health" with "feed detox" (higher search intent)
- Replaced "content audit" with "transparency" (broader match)
- Changed "digital wellbeing" → "digital wellness" (more common US spelling)
- Final: exactly 100 characters

### Cycle 5 — Final Verification
- All 6 new files confirmed present and populated
- TypeScript check: 1 pre-existing error (missing @types/react-native, unrelated to changes — RN 0.81+ bundles its own types, tsconfig references outdated package)
- No new errors introduced

## Notes

- The `@types/react-native` TSC error predates this work. React Native 0.81+ ships its own TypeScript definitions. Fix: remove `"types": ["react-native"]` from tsconfig.json (separate task).
- Empty `projectId`, `ascAppId`, and `appleTeamId` in configs need to be filled after running `eas init` and configuring Apple Developer account credentials.
- Icon and splash SVGs reference the app's actual design system colors from `src/lib/theme.ts`.
