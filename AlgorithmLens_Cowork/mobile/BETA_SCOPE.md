# AlgorithmLens Mobile — Beta Scope

## Platform: iOS Only

The initial mobile beta is **iOS-only**. Android is not supported in this release.

## Reason

Android screen recording requires the **MediaProjection API**, which has not yet been implemented in the AlgorithmLens native module layer. The iOS implementation uses `RPSystemBroadcastPickerView` (ReplayKit), which is production-ready.

Without a working screen recording pipeline, the core "Broadcast Mode" scan flow — which captures frames from a user's social media feed — cannot function on Android. Rather than ship a broken experience, the beta is scoped to iOS where the full feature set works end to end.

## What Works on Android (Precision Mode Only)

Precision Mode (text-only WebView scanning) does work on Android. However, because Broadcast Mode is the primary and recommended scan method, and because the beta UX prominently features it, Android is excluded from the beta to avoid user confusion.

## Android Gating

The following UI gating is in place:

- `mobile/app/broadcast/[platform].tsx` — Shows a "Coming to Android Soon" message instead of the recording UI when `Platform.OS === 'android'`.
- The Home screen's platform picker shows a label on the Broadcast option indicating iOS-only availability when on Android.

## Path to Android Support

To enable Android in a future release:

1. Implement the `MediaProjection` screen capture module in `mobile/native/android/`
2. Handle the user permission flow for `android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION`
3. Wire up frame capture callbacks to match the iOS `RPSampleHandler` interface
4. Remove the Android platform gate in `broadcast/[platform].tsx`
5. QA the full broadcast → analysis pipeline on Android devices

Estimated effort: 2–3 weeks of native Android development.
