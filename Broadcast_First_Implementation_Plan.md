# AlgorithmLens Broadcast-First Mobile Architecture — Implementation Plan

## Context

AlgorithmLens currently uses WebView-based scrolling to capture social media feeds on mobile. A 26-issue audit revealed fundamental limitations: auth fragility, video content gaps, platform detection, and an experience that feels like "using social media through a dirty window." Through extensive research comparing 12 alternative approaches, we determined that an **onesec-style broadcast architecture** — where iOS Shortcuts intercepts social media app launches and triggers a ReplayKit screen broadcast — should be the **primary** data collection method. This reverses the earlier recommendation because:

- It lets users scroll their **real** native apps (no WebView jank, full feature parity)
- The onesec mechanism (iOS Shortcuts "App Opened" trigger) solves the biggest UX problem: remembering to start recording
- Gemini 2.0 Flash makes vision analysis economically viable at ~$0.006/session
- 41% of Americans are actively trying to reduce screen time — the "friction" is actually a value prop
- The red recording indicator is minimal on Face ID iPhones, and the broadcast confirmation tap becomes muscle memory

WebView is retained as **"Precision Mode"** for power users who want zero-cost, text-only analysis.

**Architecture:** Broadcast (primary) → Gemini Flash vision pipeline → UnifiedScanResult → existing dashboard. WebView (secondary) → existing JS extraction → UnifiedScanResult → existing dashboard. Both paths converge on the same backend and dashboard.

---

## Phase 0: Foundation & Project Setup (2–3 days)

**Goal:** Install native module dependencies, extend type system, set up broadcast module scaffolding.

### Files to create:
- `mobile/src/types/broadcast.ts` — New types: `BroadcastSession`, `BroadcastStatus`, `BroadcastFrame`, `FrameAnalysisResult`, `StreamConfig`
- `mobile/src/types/streak.ts` — New types: `StreakData`, `StreakMilestone`, `GraceDay`, `StreakConfig`
- `mobile/modules/broadcast/` — Expo native module directory (iOS + Android)
- `mobile/modules/broadcast/expo-module.config.json`
- `mobile/modules/broadcast/ios/` — Swift source files
- `mobile/modules/broadcast/android/` — Kotlin source files

### Files to modify:
- `mobile/src/types/index.ts` — Add `source_type: 'MOBILE_BROADCAST'` to ScanMetadata union, add broadcast-related fields to FeedItem
- `mobile/package.json` — Add deps: `expo-screen-capture`, `expo-file-system`, `expo-task-manager`
- `mobile/app.json` — Add background mode entitlements, broadcast extension target (iOS)
- `backend/unified_scan_models.py` — Add `'MOBILE_BROADCAST'` to source_type enum, add `vision_confidence` field to FeedItem

### Key decisions:
- Use Expo Modules API (not bare native modules) for the broadcast extension — maintains Expo compatibility
- `UnifiedScanResult` remains the single contract between mobile and backend — broadcast sessions output the same shape
- `ScanMetadata.source_type` distinguishes broadcast vs WebView scans for analytics

---

## Phase 1: Calm Home Screen + Streak System (3–4 days)

**Goal:** Replace the current platform-picker grid with an intentional, calm home screen that positions AlgorithmLens as the social media hub.

### New files:
- `mobile/app/(tabs)/index.tsx` — Refactor: calm home becomes default, dashboard moves to sub-route
- `mobile/src/components/home/CalmHomeScreen.tsx` — Main hub: greeting, streak display, platform picker, Feed Score
- `mobile/src/components/home/StreakBadge.tsx` — Visual streak counter with flame icon, milestone celebrations
- `mobile/src/components/home/PlatformPicker.tsx` — Circular platform icons with scan-mode toggle (Broadcast / Precision)
- `mobile/src/components/home/FeedScoreCard.tsx` — Weekly feed health summary card
- `mobile/src/components/home/ModeToggle.tsx` — Toggle between Broadcast (primary) and Precision Mode (WebView)
- `mobile/src/hooks/useStreak.ts` — Streak calculation logic with grace days, recovery, milestones
- `mobile/src/lib/streakManager.ts` — AsyncStorage persistence, streak rules engine

### Files to modify:
- `mobile/app/(tabs)/_layout.tsx` — Update tab config: Home (calm screen) replaces current scan tab as primary
- `mobile/app/(tabs)/scan.tsx` — Becomes the "Precision Mode" entry point (existing WebView flow)
- `mobile/src/config/thresholds.ts` — Add streak thresholds: `STREAK_GRACE_DAYS = 1`, `STREAK_MILESTONE_DAYS = [3, 7, 14, 30]`

### Streak rules (from research):
1. **Sessions not minutes** — scanning once = streak maintained (no pressure to scroll longer)
2. **1 grace day** — miss one day, streak pauses but doesn't break
3. **Milestone celebrations** at 3, 7, 14, 30 days (not every day)
4. **Recovery mechanic** — after break, show "Welcome back" not "You lost your streak"
5. **No guilt** — never show "streak lost" language, frame as "streak paused"

### UX flow:
1. Open app → Calm Home Screen with greeting ("Good morning, Justin")
2. See streak badge (subtle, not aggressive) + weekly Feed Score
3. Tap platform icon → mode toggle appears (Broadcast recommended, Precision available)
4. Broadcast: triggers iOS Shortcuts flow → native app opens → recording starts
5. Precision: opens existing WebView scanner

---

## Phase 2: iOS ReplayKit Broadcast Extension (5–7 days)

**Goal:** Build the native iOS broadcast upload extension that captures screen frames while users scroll their real social media apps.

### New files (iOS native):
- `mobile/modules/broadcast/ios/BroadcastModule.swift` — Expo module bridge: start/stop/status
- `mobile/modules/broadcast/ios/BroadcastExtension/SampleHandler.swift` — `RPBroadcastSampleHandler` subclass: receives CMSampleBuffer frames
- `mobile/modules/broadcast/ios/BroadcastExtension/Info.plist` — Extension target config
- `mobile/modules/broadcast/ios/BroadcastExtension/BroadcastExtension.entitlements` — App group entitlement for shared container
- `mobile/modules/broadcast/ios/FrameProcessor.swift` — Frame deduplication using perceptual hashing (Apple Vision VNGenerateImageFeaturePrintRequest)
- `mobile/modules/broadcast/ios/SharedContainer.swift` — App group shared UserDefaults + file directory for frame exchange

### Key technical details:
- **RPBroadcastSampleHandler** receives raw `CMSampleBuffer` at screen refresh rate
- **Frame sampling:** Process 1 frame per 2-3 seconds (not every frame) — sufficient for feed content
- **Perceptual dedup:** Use `VNGenerateImageFeaturePrintRequest` to compute frame fingerprints, skip frames with <15% visual difference from previous
- **On-device OCR:** Run `VNRecognizeTextRequest` on each unique frame immediately (zero API cost, ~20-30ms per frame)
- **Frame storage:** Save deduplicated frames as compressed JPEGs in shared app group container
- **Session lifecycle:** Start → capture frames → user taps "Done" in AlgorithmLens → stop broadcast → process frames → upload

### App Group setup:
- Shared container: `group.com.algorithmlens.broadcast`
- Main app and broadcast extension share frame data via this container
- Frames stored as `{timestamp}_{hash}.jpg` files
- Session metadata in shared UserDefaults

---

## Phase 3: Android MediaProjection (4–6 days)

**Goal:** Build equivalent screen capture for Android using MediaProjection API.

### New files (Android native):
- `mobile/modules/broadcast/android/BroadcastModule.kt` — Expo module bridge
- `mobile/modules/broadcast/android/MediaProjectionService.kt` — Foreground service with `MediaProjection` + `VirtualDisplay`
- `mobile/modules/broadcast/android/FrameProcessor.kt` — Frame dedup + on-device OCR via ML Kit
- `mobile/modules/broadcast/android/NotificationHelper.kt` — Required foreground service notification

### Key technical details:
- **MediaProjection** requires user consent dialog (one-time per session)
- **Foreground Service** with persistent notification (Android requirement — similar to the iOS red bar)
- **ML Kit Text Recognition** for on-device OCR (equivalent to iOS VNRecognizeTextRequest)
- **Frame sampling:** Same 1-per-2-3-seconds strategy
- **ImageReader** surface to capture frames from VirtualDisplay

---

## Phase 4: Broadcast Flow UI & Integration (3–4 days)

**Goal:** Build the React Native UI that orchestrates the broadcast lifecycle and integrates with iOS Shortcuts.

### New files:
- `mobile/src/components/broadcast/BroadcastFlowScreen.tsx` — Full-screen broadcast control: start, recording indicator, timer, done button
- `mobile/src/components/broadcast/BroadcastSetupGuide.tsx` — Step-by-step iOS Shortcuts setup wizard (one-time)
- `mobile/src/components/broadcast/BroadcastOverlay.tsx` — Floating overlay when user returns to AlgorithmLens mid-session
- `mobile/src/components/broadcast/SessionSummary.tsx` — Post-session: frame count, estimated posts, processing status
- `mobile/src/hooks/useBroadcast.ts` — Broadcast lifecycle hook: init → recording → processing → complete
- `mobile/src/lib/broadcastManager.ts` — Frame collection, session state, cleanup
- `mobile/app/broadcast/[platform].tsx` — Dynamic route for broadcast sessions (parallel to `scanner/[platform].tsx`)

### Files to modify:
- `mobile/src/hooks/useScan.ts` — Add broadcast session save path (frames → backend instead of FeedItemCapture[])
- `mobile/src/lib/scanBuilder.ts` — Add `buildFromBroadcast()` alongside existing `buildFromCaptures()`

### iOS Shortcuts integration:
- On first use: `BroadcastSetupGuide` walks user through adding Shortcut automations for each platform
- Each automation: "When [Instagram] is opened" → "Run Shortcut" → opens AlgorithmLens via deep link → triggers broadcast
- Deep link format: `algorithmlens://broadcast/start?platform=instagram`
- User selects all platforms at once during setup (can't batch the Shortcuts creation, but guided wizard makes it fast)

### Broadcast confirmation UX mitigations:
- Pre-broadcast screen with large, obvious "Start Broadcasting" button
- Haptic feedback on tap
- Immediate transition to native app after broadcast starts
- "Done Scrolling" notification action to stop without switching apps

---

## Phase 5: Hybrid Accuracy Pipeline — Gemini Flash Vision (3–4 days)

**Goal:** Build the backend pipeline that processes broadcast frames into structured FeedItem data using on-device OCR + Gemini 2.0 Flash.

### New files:
- `backend/broadcast_processor.py` — Main orchestrator: receives frames → OCR text + images → Gemini Flash → UnifiedScanResult
- `backend/frame_analyzer.py` — Per-frame analysis: send frame image + OCR text to Gemini Flash with platform-specific few-shot prompts
- `backend/prompts/broadcast/` — Directory of platform-specific few-shot prompt templates
  - `instagram_broadcast.txt`
  - `twitter_broadcast.txt`
  - `youtube_broadcast.txt`
  - `tiktok_broadcast.txt`
  - `facebook_broadcast.txt`
  - `reddit_broadcast.txt`
- `backend/confidence_scorer.py` — Assigns confidence scores per field; flags low-confidence items for GPT-4o re-analysis
- `backend/frame_dedup_server.py` — Server-side dedup verification (catches any frames that slipped through on-device dedup)

### Files to modify:
- `backend/routes/scans.py` — Add `POST /api/scans/broadcast` endpoint for frame uploads (multipart: frames[] + OCR text + session metadata)
- `backend/gemini_analyzer.py` — Add `analyze_broadcast_frame()` method alongside existing `analyze_items()`
- `backend/unified_scan_models.py` — Add `vision_confidence: Optional[float]` to FeedItem, add `BroadcastCaptureInfo` to Environment

### Hybrid accuracy pipeline (target: 88–93%):
1. **On-device OCR** extracts all visible text from each frame (free, fast)
2. **Gemini 2.0 Flash** receives frame image + OCR text + platform-specific few-shot prompt
3. **Few-shot prompts** include 3-5 annotated example frames per platform showing expected extraction
4. **Confidence scoring** per field (creator_handle, is_ad, content_type, etc.)
5. **Selective re-analysis** — items with confidence <0.7 get re-analyzed with GPT-4o for higher accuracy
6. **Post-dedup** — merge items that appear across multiple frames (same post scrolled slowly)

### Cost estimate per session:
- On-device OCR: $0.00 (runs locally)
- Gemini Flash (15-20 unique frames): ~$0.006
- GPT-4o re-analysis (2-3 low-confidence items): ~$0.02
- **Total: ~$0.03/session** (vs. $3.60 with GPT-4V for every frame)

---

## Phase 6: Database Schema Extensions (1–2 days)

**Goal:** Extend Supabase schema to support broadcast sessions, streaks, and user preferences.

### New tables:
- `broadcast_sessions` — Links to scans table, stores frame count, duration, platform, processing status
- `user_streaks` — Current streak, longest streak, grace days used, last scan date
- `user_preferences` — Default scan mode (broadcast/precision), onboarded platforms, notification settings
- `streak_milestones` — Tracks which milestones have been celebrated (prevents re-showing)

### Files to modify:
- `backend/routes/scans.py` — Query broadcast_sessions alongside existing scans
- Backend database helper functions — Add CRUD for new tables

### Schema notes:
- `broadcast_sessions.scan_id` FK → `scans.id` (broadcast is just another scan source)
- `user_streaks` uses server timestamps to prevent client-side manipulation
- `user_preferences.onboarded_platforms` is a JSONB array of platforms with Shortcuts configured

---

## Phase 7: Onboarding Flow Update (2–3 days)

**Goal:** Update first-run experience to introduce broadcast mode, guide Shortcuts setup, and set expectations.

### New files:
- `mobile/src/components/onboarding/BroadcastIntroSlide.tsx` — Explains broadcast concept with animation
- `mobile/src/components/onboarding/ShortcutsSetupSlide.tsx` — Guided iOS Shortcuts automation setup
- `mobile/src/components/onboarding/ModeExplainerSlide.tsx` — Explains Broadcast vs Precision with clear comparison
- `mobile/src/components/onboarding/DigitalWellbeingSlide.tsx` — Frames the value prop: "See what's really in your feed + be more intentional"

### Files to modify:
- `mobile/app/(auth)/onboarding.tsx` — Add new slides to onboarding flow, reorder to put broadcast first
- `mobile/src/context/AuthContext.tsx` — Track onboarding completion state including Shortcuts setup

### Onboarding flow:
1. Welcome → What AlgorithmLens does (existing)
2. **NEW:** Broadcast intro — "Scroll your real apps, we analyze in the background"
3. **NEW:** Shortcuts setup — guided wizard for 1-6 platforms
4. **NEW:** Mode explainer — "Broadcast is recommended. Precision Mode available for text-only analysis"
5. **NEW:** Digital wellbeing framing — "Join 41% of Americans being more intentional about social media"
6. Gemini AI consent (existing)
7. Done → Calm Home Screen

---

## Phase 8: Feature Flags & Gradual Rollout (2 days)

**Goal:** Gate broadcast features behind feature flags for safe rollout and A/B testing.

### New files:
- `mobile/src/lib/featureFlags.ts` — Feature flag definitions and evaluation
- `backend/feature_flags.py` — Server-side flag evaluation

### Flags:
- `broadcast_enabled` — Master toggle for broadcast mode
- `broadcast_ios_shortcuts` — iOS Shortcuts integration specifically
- `broadcast_android` — Android MediaProjection
- `calm_home_screen` — New home screen vs existing
- `streak_system` — Streak tracking and display
- `hybrid_accuracy_pipeline` — Gemini Flash vision pipeline (vs. OCR-only fallback)

### Files to modify:
- `mobile/src/components/home/CalmHomeScreen.tsx` — Conditionally show broadcast option based on flags
- `mobile/app/(tabs)/_layout.tsx` — Conditionally use new tab structure

---

## Phase 9: Testing & QA (5–7 days)

**Goal:** Comprehensive testing across all new functionality.

### Test categories:

**Unit tests:**
- Streak calculation logic (grace days, recovery, milestones)
- Frame deduplication algorithm (perceptual hash threshold)
- Confidence scoring logic
- Broadcast session state machine
- Few-shot prompt template rendering

**Integration tests:**
- Broadcast frame → Gemini Flash → FeedItem conversion
- Broadcast session → UnifiedScanResult → dashboard display
- iOS Shortcuts deep link → broadcast start → frame capture → session end
- Streak persistence across app restarts
- Feature flag gating behavior

**Manual QA (per platform × per OS):**
- Instagram, Twitter, YouTube, TikTok, Facebook, Reddit × iOS, Android
- Verify frame quality, OCR accuracy, Gemini extraction accuracy
- Measure end-to-end latency (frame capture → dashboard update)
- Test edge cases: notifications during broadcast, phone calls, app switches, low battery

**Accuracy benchmarking:**
- 50 manually-annotated broadcast sessions (ground truth)
- Measure per-field accuracy: creator_handle, is_ad, content_type, topic, sentiment
- Target: 88-93% overall, 95%+ for is_ad detection
- Compare broadcast vs WebView accuracy for same sessions

### Files to create:
- `mobile/__tests__/streak.test.ts`
- `mobile/__tests__/broadcast.test.ts`
- `backend/tests/test_broadcast_processor.py`
- `backend/tests/test_frame_analyzer.py`
- `backend/tests/test_confidence_scorer.py`

---

## Phase 10: Production Deployment (3–4 days)

**Goal:** Ship to production with monitoring, error tracking, and rollback plan.

### Deployment steps:
1. Deploy backend changes (new endpoints, Gemini Flash pipeline, DB migrations)
2. Submit iOS app update with broadcast extension to App Store review (allow extra time — broadcast extensions get scrutiny)
3. Submit Android update to Google Play
4. Enable feature flags for internal testing (1-2 days)
5. Gradual rollout: 10% → 25% → 50% → 100% over 1 week
6. Monitor error rates, accuracy metrics, user retention

### Monitoring:
- Sentry error tracking for broadcast extension crashes
- Accuracy dashboard: compare broadcast vs WebView scan quality over time
- Streak engagement metrics: daily active scanners, streak length distribution
- Cost monitoring: Gemini Flash + GPT-4o spend per session

### App Store considerations:
- Broadcast extension requires NSExtension declaration in Info.plist
- Must explain screen recording use in App Store description and privacy nutrition label
- Camera & microphone permission descriptions (even though we only capture screen, not camera/mic)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 0: Foundation | 2–3 days | None |
| Phase 1: Calm Home + Streaks | 3–4 days | Phase 0 |
| Phase 2: iOS ReplayKit | 5–7 days | Phase 0 |
| Phase 3: Android MediaProjection | 4–6 days | Phase 0 |
| Phase 4: Broadcast UI | 3–4 days | Phases 2, 3 |
| Phase 5: Gemini Flash Pipeline | 3–4 days | Phase 0 |
| Phase 6: Database Schema | 1–2 days | Phase 0 |
| Phase 7: Onboarding | 2–3 days | Phases 1, 4 |
| Phase 8: Feature Flags | 2 days | All above |
| Phase 9: Testing & QA | 5–7 days | All above |
| Phase 10: Deployment | 3–4 days | Phase 9 |

**Critical path:** Phases 0 → 2 → 4 → 9 → 10 (iOS broadcast is the longest chain)
**Parallelizable:** Phases 1, 2, 3, 5, 6 can all run in parallel after Phase 0

**Total estimate:** 5–7 weeks with parallelization, ~70+ new files, 15k+ lines across TypeScript, Swift, Kotlin, Python.

---

## Recommendation: New Cowork Session

**Start a new Cowork session** for implementation. Reasons:

1. **Scope:** ~70 new files, 15k+ lines across 3 languages (TypeScript, Swift, Kotlin) plus Python backend changes. This dwarfs any single Cowork session's reasonable scope.
2. **Context:** This session's context is consumed by research and analysis. A fresh session starts with full context budget for implementation.
3. **Focus:** Implementation requires deep focus on one phase at a time. A new session can load the plan and execute methodically.
4. **Traceability:** Clean separation between "research & planning" (this session) and "implementation" (next session).

### Suggested prompt for new session:

> I'm implementing a broadcast-first mobile architecture for AlgorithmLens. Read the implementation plan at [plan location] and the three research documents in the workspace folder (Mobile_Data_Collection_Options_Analysis.docx, Replace_The_Scroll_Deep_Dive.docx, WebView_vs_ScreenRecording_Comparison.docx).
>
> The core idea: users open AlgorithmLens, see a calm home screen, tap a platform, iOS Shortcuts triggers a ReplayKit broadcast, they scroll their real native social media app, frames are captured and analyzed by Gemini 2.0 Flash, and results flow into the existing dashboard via UnifiedScanResult.
>
> Start with Phase 0 (Foundation) and Phase 1 (Calm Home Screen + Streaks). Focus on quality, accuracy, and usability — cost of compute is irrelevant. Read the algorithm-lens skills (product-context, architecture-rules, ui-ux-philosophy, code-quality) before writing any code.

---

## Verification Plan

After implementation, verify end-to-end:

1. **Calm Home Screen:** Open app → see greeting, streak, platform picker, mode toggle
2. **Broadcast flow (iOS):** Tap Instagram → Shortcuts fires → broadcast starts → scroll in real Instagram → tap Done → frames processed → scan appears in history
3. **Broadcast flow (Android):** Same flow with MediaProjection consent dialog
4. **Accuracy check:** Compare 10 broadcast scans against manual annotation → verify 88%+ accuracy
5. **WebView precision mode:** Toggle to Precision → existing WebView flow works unchanged
6. **Streak system:** Scan today → streak = 1 → scan tomorrow → streak = 2 → skip a day (grace) → streak preserved → skip 2 days → streak paused (not "lost")
7. **Dashboard:** Both broadcast and WebView scans render identically in all 6 dashboard tabs
8. **Feature flags:** Disable broadcast_enabled → app falls back to WebView-only (existing behavior)
