# AlgorithmLens Mobile — Development Build Guide

## Why Development Build?

AlgorithmLens Mobile uses **Screen Capture mode** (iOS ReplayKit) as its primary feature. This requires native iOS APIs that are **not available in Expo Go**. The app must run as an **Expo development build** (custom dev client) to access:

- `ReplayKit` — iOS screen broadcast framework
- `Vision` — On-device OCR and perceptual hashing
- App Group shared container — Communication between main app and broadcast extension
- `RPSystemBroadcastPickerView` — System-controlled broadcast trigger UI

## Prerequisites

1. **macOS** with Xcode 15+ installed
2. **Node.js** 18+ and npm
3. **CocoaPods** (`sudo gem install cocoapods` or `brew install cocoapods`)
4. **Apple Developer account** (free tier works for development)
5. **Physical iOS device** (ReplayKit broadcast extensions don't work in Simulator)

## Setup Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Generate Native iOS Project

```bash
npx expo prebuild --platform ios --clean
```

This runs the Expo config plugins, including `withBroadcastExtension`, which:
- Creates the `BroadcastExtension` target in the Xcode project
- Copies `SampleHandler.swift`, `FrameProcessor.swift`, `SharedContainer.swift`
- Configures App Group entitlements on both targets
- Adds ReplayKit + Vision frameworks to the extension

### 3. Configure Signing in Xcode

Open the generated Xcode workspace:

```bash
open ios/AlgorithmLens.xcworkspace
```

For **both** targets (`AlgorithmLens` and `BroadcastExtension`):
1. Select the target in the project navigator
2. Go to **Signing & Capabilities**
3. Select your development team
4. Ensure the App Group `group.com.algorithmlens.broadcast` is checked

### 4. Build and Run

#### Option A: Using Expo CLI (recommended for development)
```bash
npx expo run:ios --device
```

#### Option B: Using EAS Build (for team distribution)
```bash
eas build --profile development --platform ios
```

#### Option C: Using Xcode directly
1. Open `ios/AlgorithmLens.xcworkspace`
2. Select your physical device
3. Press Cmd+R to build and run

### 5. Start the Dev Server

If using Option A or C, start the Metro bundler:
```bash
npx expo start --dev-client
```

The `--dev-client` flag tells Metro to expect a development build instead of Expo Go.

## How Screen Capture Works

1. User selects a platform (Instagram, YouTube, etc.) and chooses **Screen Capture** mode
2. App navigates to the broadcast screen and initializes a session
3. User taps **Start Screen Recording** → triggers `RPSystemBroadcastPickerView`
4. iOS system dialog appears → user confirms → broadcast extension starts
5. User switches to their social media app and scrolls their feed
6. The broadcast extension (`SampleHandler.swift`) captures frames at ~2.5s intervals
7. Each frame goes through: rate limiting → perceptual dedup → on-device OCR → JPEG compression
8. Frames are saved to the shared App Group container
9. User returns to AlgorithmLens and taps **Stop**
10. App collects frames → sends to Gemini Flash for analysis → populates dashboard

## Architecture

```
┌─────────────────────────────────┐
│   React Native (Main App)       │
│                                 │
│  useBroadcast hook              │
│    ↓                            │
│  BroadcastSessionManager        │
│    ↓                            │
│  ExpoBroadcast native module    │
│    ↓                            │
│  RPSystemBroadcastPickerView    │
│    ↓                            │
└──────┬──────────────────────────┘
       │ (shared App Group container)
       │ group.com.algorithmlens.broadcast
       │
┌──────▼──────────────────────────┐
│   Broadcast Extension           │
│   (Separate iOS Process)        │
│                                 │
│   SampleHandler.swift           │
│     → FrameProcessor.swift      │
│       → VNFeaturePrintRequest   │
│       → VNRecognizeTextRequest  │
│     → SharedContainer.swift     │
│       → frames/*.jpg            │
│       → frame_metadata.json     │
│       → session_metadata.json   │
└─────────────────────────────────┘
```

## Troubleshooting

### "Broadcast not available" on screen
- Ensure you're running a development build, not Expo Go
- Ensure the device is iOS 12+
- Run `npx expo prebuild --platform ios --clean` and rebuild

### Extension doesn't appear in broadcast picker
- Open Xcode → check that `BroadcastExtension` target exists
- Verify both targets have the same App Group entitlement
- Ensure the extension's bundle ID is `com.algorithmlens.app.BroadcastExtension`
- Try deleting the app from device and rebuilding

### Frames not captured
- Check the shared container path via the native module's `getSharedContainerPath()`
- Ensure the frames directory exists: `group.com.algorithmlens.broadcast/frames/`
- Check that the extension is running (it runs in a separate process)

### Build errors after changes
```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
npx expo run:ios --device
```
