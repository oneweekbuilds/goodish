# 2.x Results Screen — Device Test Runbook

This runbook walks Justin through running the 2.x interpretation engine on a real iPhone with a real YouTube scan, then capturing what the Results screen actually produces.

**Status before you start:** the engine, adapter, Results-screen wiring, design-system primitives, and calm-case template are all on `claude/2x-engine-mvp-results` (HEAD `9b95df41`). The smoke test (Phase 4.5.1a) exercises the engine path end-to-end against a redacted real fixture and passes — what we're missing is the visual confirmation that the rendered screen matches the engine output.

## Prerequisites

- macOS with Xcode 15 or later
- Physical iPhone running iOS 12+ (broadcast extensions don't work in the Simulator)
- Apple Developer signing configured in Xcode (free tier works)
- Logged in on the device with the dev account `27e1531d-86f0-4590-8be1-06c3bec53405` — this account has scan history that exercises the rolling-average code path
- Worktree at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\.claude\worktrees\2x-engine-mvp-results\AlgorithmLens_Cowork` synced to the latest commit (`git pull` on `claude/2x-engine-mvp-results` if you're on a different machine than where the work was done)

## Required env keys (blocker)

`mobile/.env` must contain all of these. Phase 4.5.3 verified the file exists with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_API_BASE_URL` present, but **`EXPO_PUBLIC_GEMINI_API_KEY` was absent**. Without it the analysis pipeline fails at `useAnalysis.start()` and the Results screen never renders the engine output — you'll see the FallbackScreen "Setup required" path instead.

Add this line to `mobile/.env` before launching:

```
EXPO_PUBLIC_GEMINI_API_KEY=<your-key>
```

`EXPO_PUBLIC_SENTRY_DSN` is also absent but optional — Sentry calls become no-ops without it; the pipeline still runs.

## Launch steps

Run these from a terminal at the **Mac side** of the worktree (the build needs to happen on macOS even though development was on Windows).

1. **Sync the branch and install deps:**

   ```bash
   cd <worktree>/mobile
   git pull origin claude/2x-engine-mvp-results
   npm install
   ```

2. **Regenerate the native iOS project** (the `ios/` directory is not committed and isn't present on the Windows side — Phase 4.5.3 confirmed it needs regeneration):

   ```bash
   npx expo prebuild --platform ios --clean
   ```

   This runs the Expo config plugins including `withBroadcastExtension` to create the broadcast extension target.

3. **Configure signing in Xcode:**

   ```bash
   open ios/AlgorithmLens.xcworkspace
   ```

   For **both** targets (`AlgorithmLens` and `BroadcastExtension`):
   - Select the target → Signing & Capabilities
   - Pick your development team
   - Confirm App Group `group.com.algorithmlens.broadcast` is checked

4. **Start Metro:**

   ```bash
   npx expo start --dev-client
   ```

   Leave this running.

5. **Build and run on device** (separate terminal):

   ```bash
   npx expo run:ios --device
   ```

   This builds, installs, and launches the dev client on the connected iPhone.

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

If you see a `[2x] subline mode not yet implemented` warning in the Metro console, capture the mode name — that means the engine emitted COACHING or QUESTION, which Phase 4 doesn't render yet.

### Supporting card

A bg-secondary (light gray) card with eyebrow "FROM THIS SCAN" and up to four FactRow children. Each row has a label on the left, a bold value on the right, and optionally a smaller tertiary-gray anchor preceded by " · ".

For each row, capture: label, value, anchor (or `[no anchor]` if absent).

If the card is **not rendered at all**, that means `supportingRows` was empty after filtering — only the calm-case fallback variant from the placeholder used to do this, and the new template always emits 4 rows. **If you see no SupportingCard, that's a finding.**

### CTA + footer

- **PrimaryButton** "View full dashboard" at the bottom
- **CaptureFooter** disclosure: "Frames are analyzed by Google's Gemini. No account credentials are shared. Frames are discarded after analysis."

### Metro console

Watch the Metro bundler terminal during the Results screen render. Specifically look for:

- `[2x] supporting row variant not yet implemented on Results: <variant>` — engine emitted a non-fact row
- `[2x] subline mode not yet implemented on Results: <mode>` — engine emitted COACHING or QUESTION
- Any red ERROR lines
- Any `RangeError: Invalid time value` (would indicate the date-parsing edge case from the defensive review)

## Findings template

Fill this out and paste it back. Copy-paste the section below and replace bracketed placeholders.

```
=== Phase 4.5.3 device test findings ===

Device:        [iPhone model + iOS version]
Worktree HEAD: [output of `git rev-parse HEAD` from the Mac side]
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
