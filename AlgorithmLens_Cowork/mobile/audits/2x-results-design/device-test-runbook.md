# 2.x Results Screen — Device Test Runbook

## Platform requirement: TestFlight build on a physical iPhone

This runbook requires:
- A TestFlight build of `claude/2x-engine-mvp-results` on a physical iPhone (iOS 12+)
- Signed in as the dev account `27e1531d-86f0-4590-8be1-06c3bec53405` (has scan history that exercises rolling-average + recurrence paths)

The mobile build is iOS-only. The broadcast extension uses ReplayKit, which is iOS-exclusive. There is no Windows, web, or Android alternative for running the build with the broadcast extension functional.

**Earlier-framing correction**: prior versions of this runbook described the constraint as "needs a Mac with Xcode." That was wrong — EAS Build runs on Expo's macOS cloud infrastructure and can be triggered from Windows, Linux, or any platform with a terminal. The build flow below uses EAS rather than local Xcode. PC-only is not a blocker; the gate is producing the TestFlight binary (one EAS command + one EAS submit) and walking the on-iPhone observation checklist.

---

This runbook walks Justin through running the 2.x interpretation engine on a real iPhone with a real YouTube scan, then capturing what the Results screen actually produces.

**Status before you start:** the engine, adapter, Results-screen wiring, design-system primitives, and calm-case template are all on `claude/2x-engine-mvp-results` (HEAD `9b95df41`). The smoke test (Phase 4.5.1a) exercises the engine path end-to-end against a redacted real fixture and passes — what we're missing is the visual confirmation that the rendered screen matches the engine output.

## Prerequisites

- Branch `claude/2x-engine-mvp-results` checked out (or just confirmed via `git status` if you're working from origin directly)
- EAS CLI installed and authenticated (`npm install -g eas-cli`, then `eas login`) — runnable from Windows, Linux, or macOS
- ASC API Key `4V45J7LQRP` and App ID `6759925778` configured in `eas.json` / Apple credentials (already set up; verify with `eas credentials`)
- Physical iPhone running iOS 12+ (broadcast extensions don't work in the Simulator)
- AlgorithmLens TestFlight app installed on the iPhone, signed in to dev account `27e1531d-86f0-4590-8be1-06c3bec53405`

## Required env keys (blocker)

The build needs `EXPO_PUBLIC_GEMINI_API_KEY` set as an **EAS secret** (not a local `.env` value — local builds were the old flow). Check with `eas secret:list`. If absent, add it:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value <your-key>
```

Without this, the analysis pipeline fails at `useAnalysis.start()` and the Results screen never renders the engine output — you'll see the FallbackScreen "Setup required" path on iPhone instead.

`EXPO_PUBLIC_SENTRY_DSN` is also expected but optional — Sentry calls become no-ops without it; the pipeline still runs.

## Launch steps

Run these from any terminal (Windows, Linux, macOS — EAS builds in the cloud).

1. **Sync the branch:**

   ```bash
   cd <worktree>/mobile
   git pull origin claude/2x-engine-mvp-results
   ```

2. **Trigger the iOS build on EAS infrastructure:**

   ```bash
   eas build --platform ios --profile preview
   ```

   EAS runs the build on its macOS cloud (Expo's hosted infrastructure). Build typically takes ~15-30 minutes; you can leave it running and check status with `eas build:list` or via the link EAS prints.

3. **Submit the build to App Store Connect:**

   ```bash
   eas submit --platform ios --latest
   ```

   This uploads the IPA to ASC. After ASC processing (typically 10-30 min more), the build becomes available in TestFlight.

4. **Install on iPhone:**

   - Open the TestFlight app on the iPhone
   - Wait for the new AlgorithmLens build to appear (or pull-to-refresh)
   - Tap **Install** (or **Update**)
   - Open the app and sign in to dev account `27e1531d-86f0-4590-8be1-06c3bec53405` if not already

   No Metro / dev-client setup needed for a TestFlight build — the binary is self-contained.

## Perform the scan

1. On the iPhone, open AlgorithmLens.
2. Confirm you're signed in as the dev account (UUID `27e1531d-86f0-4590-8be1-06c3bec53405`). If not, sign in.
3. From the home tab, tap **Scan** → **YouTube** → **Screen Capture mode**.
4. Tap **Start Screen Recording** to invoke the system broadcast picker.
5. Confirm in the system dialog → broadcast starts.
6. Switch to the **YouTube app**.
7. Scroll the **home feed** for ~30 seconds. A mix of shorts and long-form videos is fine; the goal is realistic scan data, not optimization for any particular template.
8. Return to AlgorithmLens.
9. Tap **Stop**.
10. Wait for the Analyzing screen to progress through PREPARING → ANALYZING → DEDUPLICATING → BUILDING → SAVING → COMPLETE. Frame analysis takes ~5-20 seconds depending on how many frames Gemini gets.
11. The screen transitions to the Results card automatically when COMPLETE fires.

## What to observe

Capture the following on the Results screen. **Screenshots are gold** — even one screenshot is worth more than a verbose description.

### Top of screen

- **ResultsMetaLine** (uppercase micro text near the top): the three brand-blue progress segments + text reading something like `ANALYZED JUST NOW · N POSTS · M:SS SESSION`. Confirm:
  - The leading segment reads "JUST NOW" (not "1 MIN AGO" or stale time)
  - N matches the post count from the scan
  - M:SS matches your recording duration

### Verdict zone

- **VerdictEyebrow**: a short brand-blue horizontal rule + the uppercase label `VERDICT`.
- **VerdictText**: a single sentence in display-weight type. **Capture this string verbatim.** Per the smoke test fixture (Feb 27 production scan, 100% suggested), the expected verdict is:

  > Almost everything in your YouTube feed came from suggestions.

  But the real scan may produce a different variant — if your live scan has a high top-creator share (which the open issue #10 suggests is unlikely on YouTube but possible), the verdict could be `A few voices are shaping your YouTube feed.` (concentrated feed). If neither high-suggested nor concentration fires, you'll get one of the other calm-case variants:
  - `Your YouTube feed was mostly <type>s this session.` (one content type ≥ 50%)
  - `<N> posts captured on your YouTube feed, nothing unusual flagged.` (genuine fallback)

  **Whatever you see, capture it verbatim.**

### Sublines

Each subline has a small marker glyph and an uppercase mode label:

- **OBSERVED** — 12×12 filled brand-blue square + label "OBSERVED" + body text
- **LIKELY** — 12×12 hollow ring (1.5px tertiary-gray border) + label "LIKELY" + body text

Capture each subline's mode and body text verbatim. The gap between sublines should be:
- 12px when both are the same mode
- 22px when crossing modes (OBSERVED → LIKELY or vice versa)
- 24px before a QUESTION (not in Phase 4 — won't appear)

If the screen ever shows an unexpected fallback or empty state, that's a finding to capture. (TestFlight builds don't expose the Metro console, so the `[2x]` developer warnings won't be visible — see the "Metro console" subsection below for what to do instead.)

### Supporting card

A bg-secondary (light gray) card with eyebrow "FROM THIS SCAN" and up to four FactRow children. Each row has a label on the left, a bold value on the right, and optionally a smaller tertiary-gray anchor preceded by " · ".

For each row, capture: label, value, anchor (or `[no anchor]` if absent).

If the card is **not rendered at all**, that means `supportingRows` was empty after filtering — only the calm-case fallback variant from the placeholder used to do this, and the new template always emits 4 rows. **If you see no SupportingCard, that's a finding.**

### CTA + footer

- **PrimaryButton** "View full dashboard" at the bottom
- **CaptureFooter** disclosure: "Frames are analyzed by Google's Gemini. No account credentials are shared. Frames are discarded after analysis."

### Metro console — not available on TestFlight builds

The original runbook (when this flow used `npx expo run:ios --device`) asked you to watch the Metro bundler terminal for `[2x] ...` developer warnings and runtime errors. **TestFlight builds don't expose Metro** — those warnings still fire inside the app but go to the device's system log, not a visible terminal.

If on-screen behavior suggests a developer warning fired (unexpected fallback, missing supporting card, crash), one of these recovers the log:
- **Sentry dashboard** (if `EXPO_PUBLIC_SENTRY_DSN` is configured as an EAS secret) — uncaught errors and explicit captures land there
- **Xcode → Window → Devices and Simulators → View Device Logs** (requires Mac access, optional)
- **Console.app** on a Mac with the iPhone tethered (requires Mac access, optional)

For the device test, focus on what's observable on-screen — visual issues, missing elements, copy that reads off. The runtime `[2x]` warnings are an instrumentation aid rather than a primary check; if a supporting row variant isn't shipped yet, the missing row is itself the visible signal.

## Findings template

Fill this out and paste it back. Copy-paste the section below and replace bracketed placeholders.

```
=== Phase 4.5.3 device test findings ===

Device:        [iPhone model + iOS version]
Worktree HEAD: [output of `git rev-parse HEAD` on the branch that produced the EAS build]
Test account:  [confirm `27e1531d-86f0-4590-8be1-06c3bec53405`]
Scan summary:  [N posts, M:SS duration, what you scrolled]

--- Render ---

ResultsMetaLine text: [verbatim, e.g. "ANALYZED JUST NOW · 47 POSTS · 0:32 SESSION"]

Verdict (verbatim):   [single sentence]

Sublines (in order):
  1. [OBSERVED|LIKELY|other]: [verbatim text]
  2. [OBSERVED|LIKELY|other]: [verbatim text]
  3. ...

Supporting card:      [rendered | NOT rendered]
  Ads:        value=[...]  anchor=[... | no anchor]
  Patterns:   value=[...]  anchor=[... | no anchor]
  Political:  value=[...]  anchor=[... | no anchor]
  Tone:       value=[...]  anchor=[... | no anchor]

CTA visible:   [yes | no]
Footer visible: [yes | no]

--- Metro console ---

[paste any [2x] warns, errors, or other notable output]

--- Visual issues ---

[anything that looked off, even if you can't articulate it precisely.
 Layout overflow, text wrapping awkwardness, color/spacing weirdness,
 missing elements, etc. Screenshot is best.]

--- Screenshots ---

[paths/links if you have them]

=== End findings ===
```

## If something looks wrong

The defensive code review from Phase 4.5.1 is the diagnostic checklist. The most likely failure modes I'd expect, ranked:

- **(A) Verdict feels off:** content/UX quality question, not a crash. We iterate on copy.
- **(B) Anchors mostly missing:** likely the legacy-scan-shape gotcha (pre-Build-#44 rows in your history). The rolling-average extractors return null defensively; this is a known degradation.
- **(C) Platform name capitalization:** "Youtube" vs "YouTube" — easy fix in `utils/platformDisplay.ts`.
- **(D) VerdictText long-line wrapping:** RN limitation documented in `VerdictText.tsx`.
- **(E) Tone/Political shows "No analysis":** expected when backend Gemini enrichment hasn't run on the scan yet. The smoke fixture had this — it's honest output, not a bug, but copy may want iteration (filed as a copy candidate per Phase 4.5.2 wrap).
- **(F) Crash with `RangeError: Invalid time value`:** date parsing in the adapter. Capture the stack trace.

The full review lives in this session's transcript at the Phase 4.5.1 boundary.

## Expected smoke-test parity

For a YouTube scan with high suggested ratio (most YouTube home-feed scans), the engine should produce something close to the Phase 4.5.1a smoke output:

```json
{
  "verdict": "Almost everything in your YouTube feed came from suggestions.",
  "sublines": [
    { "mode": "OBSERVED", "text": "100% of what you saw was suggested, with 0% from accounts you follow." },
    { "mode": "LIKELY",   "text": "Suggestion weights fill the feed when activity from followed accounts is sparse." }
  ],
  "supportingRows": [
    { "label": "Ads",       "value": "3% of feed" },
    { "label": "Patterns",  "value": "Top: Video" },
    { "label": "Political", "value": "No analysis" },
    { "label": "Tone",      "value": "No analysis" }
  ]
}
```

The actual numbers will differ — what we're confirming is the shape, the variant choice, and the rendered output matching the engine's JSON.
