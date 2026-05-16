# Checkpoint — iOS BroadcastExtension build status (2026-04-30)

## TL;DR
The path-doubling fix you asked about **is in**, but I found **a separate bug** in the same Ruby script that will silently leave two of the three Swift files out of the BroadcastExtension target. The build will almost certainly fail compilation as-is. One small change to the script fixes it. **Do not run an EAS build until that's patched.**

---

## What's in the codebase right now

### 1. The path-doubling fix — DONE
The Ruby script (`mobile/scripts/add-broadcast-extension.rb`) and the JS plugin (`mobile/plugins/withBroadcastExtension.js`) now write the BroadcastExtension files **flat** into `ios/BroadcastExtension/` and reference them by filename only. The Xcode project no longer asks for `ios/ios/...` or a nested `modules/...` path. Build settings use clean paths:
- `INFOPLIST_FILE = BroadcastExtension/Info.plist`
- `CODE_SIGN_ENTITLEMENTS = BroadcastExtension/BroadcastExtension.entitlements`

This part is correct.

### 2. The blocker I found — Ruby script source path is wrong for two of three Swift files
The Ruby script copies its source files from a single directory:
```
src_dir = "modules/broadcast/ios/BroadcastExtension"
```
…and tries to copy `SampleHandler.swift`, `FrameProcessor.swift`, and `SharedContainer.swift` from there.

But the actual layout on disk is:

```
mobile/modules/broadcast/ios/
├── BroadcastModule.swift
├── BroadcastPickerView.swift
├── FrameProcessor.swift           ← lives HERE
├── SharedContainer.swift          ← lives HERE
└── BroadcastExtension/
    ├── BroadcastExtension.entitlements
    ├── Info.plist
    └── SampleHandler.swift        ← only this one is in the subfolder
```

**Result:** the script copies `SampleHandler.swift` (found), then logs `WARNING: ... not found` for `FrameProcessor.swift` and `SharedContainer.swift` and skips them. The Xcode target ends up with only one source file. `SampleHandler.swift` references `FrameProcessor` (line 37 and elsewhere), so Swift compilation will fail with "Cannot find type 'FrameProcessor' in scope."

### 3. Why the green CI run is misleading
`.github/workflows/diagnose-broadcast.yml` step 7 ("Try building BroadcastExtension target only") has `continue-on-error: true`. The xcodebuild step can fail silently and the workflow still reports success. The inline Ruby in that workflow has the **same path bug**, so the green run almost certainly compiled only `SampleHandler.swift` and exit-1'd inside a continue-on-error step.

### 4. Other state
- `mobile/eas.json` — production profile is correct (Release, autoIncrement, image: latest, channel: production)
- `mobile/app.config.ts` — bundle ids, app extension declaration, App Group entitlement, Team ID all wired up
- No uncommitted code changes (`git diff` shows only file-mode bits)
- Latest commit on this branch: `239a46aa fix: correct source paths in Ruby script` (the begin/rescue wrap — it did **not** fix the source-dir issue, just made errors louder)

---

## Recommended next action

Fix the Ruby script at `AlgorithmLens_Cowork/mobile/scripts/add-broadcast-extension.rb` so it pulls each Swift file from the right directory:

- `SampleHandler.swift` ← `modules/broadcast/ios/BroadcastExtension/`
- `FrameProcessor.swift` ← `modules/broadcast/ios/`
- `SharedContainer.swift` ← `modules/broadcast/ios/`
- `Info.plist` and `BroadcastExtension.entitlements` ← `modules/broadcast/ios/BroadcastExtension/`

The same bug needs the same fix in the inline Ruby block in `.github/workflows/diagnose-broadcast.yml`. Either fix the path map or move `FrameProcessor.swift` and `SharedContainer.swift` into `modules/broadcast/ios/BroadcastExtension/` (the JS plugin and main `BroadcastModule.swift` would need their references checked first).

After patching, re-run the diagnostic workflow (free, fast — ~1 min on GitHub Actions) and confirm xcodebuild step shows "BUILD SUCCEEDED" rather than "BUILD FAILED" inside the continue-on-error step. **Then** kick off the EAS production build.

## Other things to be aware of (not blockers)
- The withBroadcastExtension.js JS plugin still copies into `ios/BroadcastExtension/BroadcastExtension/` (double-nested). The Ruby script then deletes/replaces the target and copies into `ios/BroadcastExtension/` (flat). They write to two different paths but the Ruby pass is the authoritative one, so the duplicate JS work is harmless — just dead motion. Worth cleaning up later, not now.
- The diagnostic workflow's `continue-on-error: true` should probably be removed once we trust the build, so a failing Swift compile actually fails the run.
