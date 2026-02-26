# App Store Metadata — AlgorithmLens

## App Name
AlgorithmLens

## Subtitle
See what's really in your feed

## Description

Your social media feed is curated by algorithms you can't see. AlgorithmLens changes that.

Open any social media app, tap record, and scroll your feed as you normally would. AlgorithmLens captures a snapshot of what you see and breaks it down into a clear, visual dashboard — showing you the composition of your feed at that moment in time.

Here's what you'll learn from each scan:

Overview — A feed health score and headline insights that summarize what your algorithm served you. See at a glance how much of your feed was ads, political content, suggested posts, or content from accounts you actually follow.

Sources — Which accounts dominated your feed? See your top sources ranked by volume and discover whether a handful of voices are shaping most of what you see.

Ads — How much of your feed was advertising? AlgorithmLens identifies both clearly labeled ads and promotional content that blends into your feed, so you can see the full picture.

Politics — Get a neutral breakdown of political content in your feed. No judgment, no bias scores — just a factual look at how much political content appeared and from which perspectives.

Tone — Understand the emotional texture of your feed. Is it mostly positive, neutral, or negative? Tone analysis helps you notice patterns you might not feel consciously.

Suggested vs. Followed — Perhaps the most revealing tab. See exactly how much of your feed came from accounts you chose to follow versus content the algorithm suggested. Many users are surprised by this ratio.

Track changes over time. Each scan is saved to your history, so you can compare your feed across days, weeks, and platforms. See how your feed evolves and whether changes you make — like unfollowing accounts or adjusting platform settings — actually shift what you see.

AlgorithmLens never asks for your login credentials. It never accesses your account data. It only sees what you see — the pixels on your screen during a recording — and processes that snapshot securely.

Built as part of the Goodish Initiative, AlgorithmLens is grounded in a simple belief: you deserve to know what your algorithm is showing you. Visibility comes first. Agency follows.

Download AlgorithmLens and take your first scan today.

## Keywords
feed analyzer,algorithm,social media,screen time,digital wellness,ad tracker,feed detox,transparency

## Category
- Primary: Utilities
- Secondary: Social Networking

## Age Rating
4+ (No objectionable content)

## Review Notes for Apple

AlgorithmLens uses Apple's ReplayKit Broadcast Extension to capture the user's screen while they scroll through social media apps like Instagram, TikTok, Twitter/X, YouTube, Facebook, or Reddit.

**How it works:**

1. The user opens AlgorithmLens and taps "Start Scan."
2. The system presents the standard iOS broadcast picker, which the user must explicitly confirm.
3. Once the user approves, the Broadcast Upload Extension (running in a separate process) receives screen frames via RPBroadcastSampleHandler.
4. Frames are saved as images to an App Group shared container (group.com.algorithmlens.broadcast).
5. When the user stops the broadcast (via the system status bar indicator or the in-app stop button), the main app reads the captured frames from the shared container.
6. Frames are sent to a server-side AI classification API (Google Gemini Flash) which categorizes visible social media content into structured categories: sources, ads, political content, tone, and suggested vs. followed.
7. The classified results are rendered into a six-tab dashboard inside the app.

**Why screen recording is necessary:**

There is no public API for retrieving a user's personalized social media feed content. The only way to analyze what a specific user actually sees is to capture the screen while they scroll. AlgorithmLens processes the visual content of the feed — post text, images, account names, ad labels — to produce its analysis. This is the core and only function of the app.

**User consent and control:**

Every recording session is user-initiated. The user must: (1) tap the "Start Scan" button in the app, (2) confirm via the system-provided RPBroadcastActivityViewController picker, and (3) explicitly select AlgorithmLens as the broadcast target. The user can stop recording at any time via the iOS status bar indicator or the in-app stop button. No recording ever starts automatically or in the background.

**Data retention:**

Captured frames (sampled at intervals, not continuous video) are held only in the App Group container during analysis. Once the AI classification API returns results, all raw frame images are deleted from the device. Only the structured classification results (category counts, source names, percentages) are persisted in the app's local storage and optionally synced to the user's account via Supabase. No raw imagery is ever retained long-term.

**What we do NOT do:**

- We never capture audio (microphone permission is required by ReplayKit but we do not record or process audio).
- We never capture content from other apps unless the user is actively broadcasting and scrolling through a social media feed.
- We never access the device camera (camera permission is required by ReplayKit but we do not use the camera).
- We never store raw screen recordings beyond the current analysis session. Frames are deleted after classification is complete.
- We never transmit raw screen frames to any third party. Only structured, anonymized classification requests are sent to the AI API.
- We do not access any user account credentials, tokens, or login sessions for any social media platform.

**App Group usage:** group.com.algorithmlens.broadcast — used exclusively to transfer captured frames between the Broadcast Upload Extension and the main app process.

**Background modes:** We use `processing` and `fetch` background modes to complete frame analysis when the app returns from the broadcast session. No persistent background activity occurs.

**Test account:** This app does not require a test account. To test, simply start a broadcast from the app, open any social media app (e.g., Instagram), scroll for 15–30 seconds, then stop the broadcast. The analysis dashboard will populate with results.
