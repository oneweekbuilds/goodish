---
name: algorithmlens-app-auditor
description: >
  Complete audit, fix, and verification system for the AlgorithmLens iOS app.
  Use this skill whenever the user mentions auditing, testing, fixing, debugging,
  or reviewing the AlgorithmLens iOS app — especially when they provide a screen
  recording or video file. Also trigger when the user mentions "app issues",
  "app bugs", "screen recording review", "test the app", "verify fixes",
  "what's broken", or anything about the AlgorithmLens mobile app not working
  correctly. This skill handles the full cycle: extracting frames from video,
  cataloging every issue, attempting code fixes, and verifying those fixes with
  new recordings — looping until objectively complete.
---

# AlgorithmLens iOS App Auditor

## Purpose

This skill performs rigorous, evidence-based auditing of the AlgorithmLens iOS
app by analyzing screen recordings, cataloging every issue found, attempting
code fixes, and then requiring NEW screen recordings to verify fixes actually
worked. It continues looping until the issue registry shows 100% resolution
with evidence.

The core philosophy is **"trust nothing, verify everything."** The single
biggest failure mode in AI-assisted debugging is premature closure — claiming
issues are fixed based on code changes alone. This skill treats code changes
as hypotheses and screen recordings as experiments. A fix is not real until
the next recording proves it.

---

## The Anti-Hallucination Contract

These rules exist because the natural tendency is to mark things "fixed" after
editing code. That optimism is the enemy. These rules are non-negotiable:

1. **No VISUAL issue may be marked VERIFIED without frame evidence from a NEW
   recording.** Editing code changes status to FIX_ATTEMPTED, never VERIFIED.
   CODE-VERIFIABLE issues (see Verification Tiers below) can be marked
   CODE_VERIFIED through automated checks — but this is a distinct status
   from VERIFIED, and the scorecard shows them separately.

2. **The scorecard is always honest.** Report "7/43 verified, 12/43 fix attempted,
   24/43 open" — never "most issues resolved" or "significant progress made."

3. **Every verification pass is adversarial.** When reviewing a new recording,
   actively look for ways the fix might have failed, not for confirmation it worked.
   Check edge cases visible in the recording. Look for regressions.

4. **No bulk operations on status.** Each issue is verified individually with
   its own evidence. Never "mark all UI issues as fixed."

5. **When uncertain, the issue stays open.** If a recording doesn't clearly show
   the area where an issue existed, that issue remains at its current status.

6. **Re-check previously verified issues for regressions.** Every new recording
   is an opportunity to catch regressions. If a verified fix regresses, it
   reopens immediately.

---

## Verification Tiers — Minimizing Recordings

Not every issue requires a screen recording to verify. Requiring one for
everything wastes the user's time and creates unnecessary iteration cycles.
The goal is to converge in **3-5 recordings**, not 10-20.

Every issue gets assigned a **verification tier** at discovery time:

### Tier 1: CODE_VERIFIABLE

These issues can be verified WITHOUT a recording through automated checks.
The fix is provable from the code itself.

**Examples:**
- Missing feature/component (the file/route literally didn't exist → now it does)
- Broken import or dependency (build would fail → now it builds)
- Wrong API endpoint URL (was pointing to `/v1/old` → now `/v2/correct`)
- Missing error handling (no try/catch → now has proper error handling)
- Dead code path (function was never called → now wired up)
- Configuration errors (wrong API keys, missing env vars)

**How to verify:** After fixing, run automated checks:
1. Does the project build without errors? (`npm run build`, `xcodebuild`, etc.)
2. Do unit tests pass? (run existing tests, write new ones for the fix)
3. Does static analysis confirm the fix? (grep for the old broken pattern —
   it should be gone; grep for the new pattern — it should exist)
4. Can you trace the code path and confirm it's logically complete?

**Status flow:** OPEN → FIX_ATTEMPTED → CODE_VERIFIED (via automated checks)

CODE_VERIFIED issues are promoted to VERIFIED after the next recording
confirms them visually, BUT they don't block requesting a recording. Think
of CODE_VERIFIED as "high confidence, pending visual confirmation."

### Tier 2: VISUAL_REQUIRED

These issues can ONLY be verified by seeing them on-screen. No amount of
code reading can confirm they're fixed.

**Examples:**
- Layout/spacing issues (does the padding LOOK right?)
- Color or font rendering issues
- Animation smoothness
- Data accuracy as displayed to the user (is the score SHOWN correctly?)
- Interaction feedback (does the button VISUALLY respond to tap?)
- Loading states and transitions
- Any issue where the symptom is "it looks wrong"

**Status flow:** OPEN → FIX_ATTEMPTED → (recording required) → VERIFIED or FIX_FAILED

### Tier 3: HYBRID

Issues where code analysis gives partial confidence, but visual confirmation
is still needed to be certain.

**Examples:**
- Feature that errors on tap (code fix is verifiable, but need to see it
  works in context with real data)
- Performance issues (can optimize code, but need to see actual load times)
- Subscription flow (can verify API integration in code, but need to see
  the full UI flow works end-to-end)

**Status flow:** OPEN → FIX_ATTEMPTED → CODE_VERIFIED (partial) → (recording
required) → VERIFIED or FIX_FAILED

---

## Pre-Flight Check Phase — What Happens BEFORE Requesting a Recording

This phase is CRITICAL for minimizing recordings. After fixing issues, the
agent MUST do all of the following BEFORE asking the user for a new recording:

### Step 1: Build Verification

Attempt to build the project. If the build fails, the fixes are broken —
fix them before involving the user.

```bash
# Check what build system is in use, then run it
# React Native:
npx react-native run-ios --simulator="iPhone 15" 2>&1 | tail -50
# Or just check compilation:
npx tsc --noEmit
# Or for Expo:
npx expo export 2>&1
```

If the build fails, DO NOT request a recording. Fix the build first.

### Step 2: Static Analysis Sweep

For every FIX_ATTEMPTED issue, run a targeted check:

```bash
# For each fix, verify the change actually exists in the codebase
# Example: If you added a LiveBroadcast component, verify it's imported
grep -r "LiveBroadcast" src/ --include="*.tsx" --include="*.ts"

# Verify no obvious errors in changed files
npx eslint <changed_files> 2>&1
```

### Step 3: Code-Path Tracing

For Tier 1 (CODE_VERIFIABLE) issues, trace the code path manually:
1. Start from the entry point (screen, route, button handler)
2. Follow the execution path through the fix
3. Verify the path reaches the intended outcome
4. Check for missing null checks, unhandled promise rejections, etc.

### Step 4: Write Targeted Tests

For critical fixes (especially Live Broadcast and Subscription), write
quick verification scripts:

```javascript
// Example: Verify the subscription endpoint is reachable
const response = await fetch(SUBSCRIPTION_API_URL, { method: 'OPTIONS' });
console.log(`Subscription API: ${response.status === 200 ? 'REACHABLE' : 'BROKEN'}`);
```

### Step 5: Self-Review

Before requesting a recording, the agent must answer these questions and
print the answers:

1. "How many issues did I mark FIX_ATTEMPTED?" → [number]
2. "How many of those could I CODE_VERIFY?" → [number]
3. "For each CODE_VERIFIED issue, what specific check confirmed it?" → [list]
4. "Does the project build successfully?" → [yes/no]
5. "What's my confidence that the remaining VISUAL_REQUIRED fixes will
   pass on first recording?" → [honest percentage]
6. "Are there any fixes I'm uncertain about? Which ones and why?" → [list]

If confidence is below 70%, review the uncertain fixes before requesting
a recording. The user's time recording is more expensive than your compute.

### Step 6: Batch Quality Gate

Only request a recording when ALL of the following are true:
- [ ] Project builds without errors
- [ ] All Tier 1 issues are CODE_VERIFIED
- [ ] All changed files pass linting
- [ ] Agent self-review confidence ≥ 70%
- [ ] No known broken code paths remain

This ensures each recording cycle is maximally productive.

---

## Execution Discipline — Staying Accurate Over Long Runs

Long autonomous runs degrade in accuracy. This is not a hypothetical — it's
a known property of LLM-driven agentic work. The context window fills up,
earlier instructions fade, small errors compound, and rigor drops. The
mitigations below are structural safeguards against this.

### Rule 1: Work in Small Batches, Not One Big Pass

**Never fix all issues in a single continuous run.** Break work into batches
of 5-8 issues maximum. After each batch:

1. Save all changes to disk
2. Re-read the issue_registry.json from disk (not from memory)
3. Run the scorecard script and print it
4. Reconcile: Does what you remember match what the registry says?
   If not, the registry is the source of truth.
5. Then start the next batch

This forces a "context refresh" that prevents drift. The registry file is
the single source of truth — not your conversation history, not your memory
of what you did. If there's a discrepancy, the file wins.

### Rule 2: Re-Read Before Every Phase Transition

At the boundary between any two phases (Audit → Fix, Fix → Pre-Flight,
Pre-Flight → Request Recording, New Recording → Verification), ALWAYS:

1. Re-read this SKILL.md (at minimum, the relevant phase section)
2. Re-read the issue_registry.json from disk
3. Re-read the verification_protocol.md before any verification pass
4. Print a brief status summary confirming what phase you're entering
   and what the current scorecard looks like

This takes 30 seconds of compute. It prevents 30 minutes of wasted work
from operating on stale context.

### Rule 3: Every Action Produces a Structured Artifact

Never rely on prose claims about what was done. Every action must produce
a machine-readable artifact:

| Action | Required Artifact |
|--------|------------------|
| Found an issue | JSON entry in issue_registry.json |
| Attempted a fix | Fix log entry with files_changed + diff_summary |
| Code-verified | Automated check output (build log, test result, grep) |
| Verified from recording | Frame numbers + visual description in registry |
| Changed a status | status_history entry with timestamp + evidence |

If an action didn't produce an artifact, it didn't happen. This is how
the registry stays honest even when the agent's "memory" drifts.

### Rule 4: Reconciliation Checkpoints

After every batch of fixes, run this reconciliation:

```bash
# Count issues in each status
python3 scripts/registry_manager.py --registry issue_registry.json --action validate
python3 scripts/registry_manager.py --registry issue_registry.json --action scorecard
```

Then cross-check:
- "I believe I fixed N issues in this batch" → Does the registry show N
  issues moved to FIX_ATTEMPTED?
- "I changed files X, Y, Z" → Do those files actually contain the changes?
  (Quick grep/diff to confirm)
- "I code-verified issues A, B, C" → Does the registry show CODE_VERIFIED
  with evidence strings?

If any of these don't match, STOP and reconcile before continuing.

### Rule 5: Snapshot Before Every Fix Batch

Before starting a batch of fixes, create a snapshot of the registry:

```bash
cp issue_registry.json issue_registry.snapshot-batch-N.json
```

This enables the diff_registries.py script to show exactly what changed
in each batch, and provides a rollback point if something goes wrong.

### Rule 6: Progressive Summarization for the User

At the end of each batch (not each individual fix), print a brief
human-readable summary:

```
BATCH 2 COMPLETE (issues FUNC-003, FUNC-004, FUNC-005, ACC-001, ACC-002)
─────────────────────────────────────────────────
Fixed: 5 issues
  FUNC-003: Wired up pull-to-refresh handler → FIX_ATTEMPTED
  FUNC-004: Added null check on feed data → FIX_ATTEMPTED
  FUNC-005: Fixed navigation stack for settings → FIX_ATTEMPTED
  ACC-001:  Corrected sentiment score formula → FIX_ATTEMPTED
  ACC-002:  Fixed date parsing for post timestamps → CODE_VERIFIED ✓
    (verified: unit test passes, output matches expected for 5 test cases)

Registry reconciled: ✓ (matches disk)
Build status: ✓ compiles
Running total: 10/43 fix_attempted, 3/43 code_verified, 30/43 open
```

This keeps the user informed without requiring them to intervene, while
also forcing the agent to reconcile its work against the registry.

### Rule 7: Doubt Escalation

If at any point the agent is uncertain about:
- Whether a fix actually addresses the root cause
- Whether the codebase structure is what it expects
- Whether a code-verification check is actually testing the right thing
- Whether an issue should be split into multiple issues

**Flag it to the user immediately** rather than making an assumption and
moving on. One quick question to the user is cheaper than a wrong fix
that cascades into three more problems.

Format: "Quick question before I continue: [specific question]. This
affects issues [X, Y, Z]."

### Why These Rules Matter

Without these guardrails, here's what typically happens in a long run:
- Batch 1: Agent is careful, fixes are good
- Batch 3: Agent starts skipping re-reads, works from memory
- Batch 5: Agent "remembers" fixing something it only planned to fix
- Batch 7: Agent marks issues CODE_VERIFIED without actually running checks
- Batch 9: Agent reports "90% complete" but the registry shows 40%

The user then sends a recording, finds most things still broken, and loses
trust. These rules prevent that by making the registry — not the agent's
memory — the authority on what's true.

---

## Issue Categories

The audit covers six dimensions:

| Category | Code | What to Look For |
|----------|------|-----------------|
| UI/Visual | `UI` | Layout problems, color issues, spacing, text overflow, misalignment, dark mode problems, font inconsistencies, broken images |
| Accuracy | `ACC` | Wrong scores, incorrect analysis results, mismatched data, stale content, hallucinated metrics |
| Functionality | `FUNC` | Buttons that don't respond, broken navigation, features that error on tap, infinite spinners, dead links |
| Performance | `PERF` | Slow loading (>3s), janky animations, stuttering scrolls, memory warnings, crashes |
| Live Broadcast | `LIVE` | The entire live broadcast feature — screen sharing/mirroring from social media apps back to AlgorithmLens. Currently non-existent or erroring. |
| Subscription | `SUB` | Paid version signup flow — currently showing error messages or infinite spinners when tapped |

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────┐
│  1. RECEIVE RECORDING                               │
│     User provides screen recording via upload        │
│     Extract frames using ffmpeg (1 per second)       │
├─────────────────────────────────────────────────────┤
│  2. FRAME-BY-FRAME AUDIT                            │
│     Analyze every frame for all 6 categories         │
│     Create issue with: ID, category, description,    │
│     frame evidence, pass/fail criteria, AND          │
│     verification tier (code/visual/hybrid)           │
├─────────────────────────────────────────────────────┤
│  3. ISSUE REGISTRY                                  │
│     Write all issues to issue_registry.json          │
│     Print full scorecard to user                     │
├─────────────────────────────────────────────────────┤
│  4. FIX CYCLE                                       │
│     For each open issue:                             │
│       - Locate relevant source code                  │
│       - Attempt fix                                  │
│       - Mark ONLY as FIX_ATTEMPTED                   │
│       - Log what was changed and why                 │
├─────────────────────────────────────────────────────┤
│  4b. PRE-FLIGHT CHECKS (before requesting recording)│
│     - Build the project — does it compile?           │
│     - Run linting on all changed files               │
│     - Code-verify all Tier 1 issues automatically    │
│     - Code-verify Tier 3 (hybrid) partially          │
│     - Write/run targeted test scripts                │
│     - Self-review: confidence ≥ 70%?                 │
│     - If pre-flight fails → fix and re-check         │
│     - Only proceed when batch quality gate passes    │
├─────────────────────────────────────────────────────┤
│  5. REQUEST NEW RECORDING                           │
│     Tell user: rebuild app, do full walkthrough,     │
│     send new recording. Give targeted checklist      │
│     of specific screens/features to capture.         │
├─────────────────────────────────────────────────────┤
│  6. VERIFICATION AUDIT                              │
│     Extract frames from new recording                │
│     For each FIX_ATTEMPTED / CODE_VERIFIED issue:    │
│       - Find frames showing the relevant area        │
│       - Apply objective pass/fail criteria            │
│       - Mark VERIFIED only with frame evidence       │
│       - Mark FIX_FAILED if still broken              │
│     Also check: new issues + regressions             │
├─────────────────────────────────────────────────────┤
│  7. LOOP                                            │
│     If any issues remain non-VERIFIED:               │
│       → Go to step 4 (includes pre-flight again)    │
│     If 100% VERIFIED:                                │
│       → Print final report, celebrate                │
└─────────────────────────────────────────────────────┘
```

**Expected iteration count: 3-5 recordings to completion**, because:
- Pre-flight checks catch ~50-70% of broken fixes before a recording
- Tier 1 (code-verifiable) issues never waste a recording cycle
- Each recording cycle is maximally productive since only high-confidence
  fixes go through the quality gate

---

## Phase 0: Pre-Recording Code Analysis (Optional)

If the user triggers this skill BEFORE providing a recording (e.g., "audit
the AlgorithmLens app"), start with a code-level sweep to find obvious issues.
This gives a head start — issues found here can be fixed before the first
recording even arrives.

### What to look for in code:

1. **Build health** — Does the project compile? What warnings/errors exist?
2. **Dead routes/screens** — Are there navigation routes pointing to components
   that don't exist or are commented out?
3. **Error-only handlers** — Components that just render an error message or
   "coming soon" placeholder
4. **TODO/FIXME/HACK comments** — Often mark known broken areas
5. **Missing API integrations** — Endpoints referenced but not implemented
6. **Subscription flow** — Is the payment/IAP integration connected?
7. **Live broadcast feature** — Does the component exist? Is it wired up?
   What permissions does it request?

### How to run this:

```bash
# Find the project
find /mnt/user-data/uploads -name "package.json" -o -name "Podfile" -o -name "*.xcodeproj" 2>/dev/null

# Check for obvious issues
grep -rn "TODO\|FIXME\|HACK\|XXX\|BROKEN\|DISABLED" src/ --include="*.ts" --include="*.tsx" --include="*.swift"
grep -rn "coming soon\|not implemented\|placeholder" src/ --include="*.ts" --include="*.tsx"

# Check for error-state-only components
grep -rn "Error\|error\|Alert.*error" src/ --include="*.tsx" | head -30

# Check subscription integration
grep -rn "purchase\|subscribe\|payment\|IAP\|StoreKit\|stripe" src/ --include="*.ts" --include="*.tsx" --include="*.swift"

# Check live broadcast
grep -rn "broadcast\|stream\|screen.*share\|mirror\|live" src/ --include="*.ts" --include="*.tsx" --include="*.swift"
```

Log any code-level issues found as Tier 1 (CODE_VERIFIABLE) issues in the
registry. These can be fixed immediately without waiting for a recording.

When the first recording arrives, the audit can focus more on visual/UX
issues since the structural code issues are already being handled.

---

## Phase 1: Receiving and Processing a Screen Recording

When the user provides a screen recording:

### Step 1: Locate the video file

The recording will be in `/mnt/user-data/uploads/`. Identify it — it will
typically be .mov, .mp4, or similar.

### Step 2: Extract frames

Use the bundled frame extraction script:

```bash
python3 /path/to/this/skill/scripts/extract_frames.py \
  --input <video_path> \
  --output-dir /home/claude/audit-workspace/frames/recording-<N>/ \
  --fps 1
```

This extracts 1 frame per second. For a typical 2-3 minute recording, this
gives 120-180 frames — enough to catch everything without being overwhelming.

If the recording is long (>5 minutes), consider extracting at 0.5 fps to
keep frame count manageable, then do a second pass at 2 fps on sections
where you spot issues.

### Step 3: Get video metadata

Note the total duration, resolution, and frame count. This becomes part of
the audit record.

---

## Phase 2: Frame-by-Frame Audit

This is the most important phase. Be thorough and paranoid.

### How to analyze frames

1. **View frames sequentially.** Use the `view` tool to look at each frame.
   Don't skip frames — issues can appear for just 1-2 seconds.

2. **For each frame, check all 6 categories.** Don't just scan for obvious
   errors. Actively interrogate:
   - UI: Is spacing consistent? Are elements aligned? Is text readable?
   - Accuracy: Do any visible scores/metrics look wrong or placeholder-ish?
   - Functionality: Is there evidence of a tap that didn't respond? An error
     state? A loading spinner that shouldn't be there?
   - Performance: Are transitions smooth between frames? Any frozen states?
   - Live Broadcast: Is the feature visible? Accessible? Does tapping it
     lead somewhere real?
   - Subscription: Is the upgrade flow visible? Does it load?

3. **Group related frames into "scenes."** A scene is a contiguous sequence
   showing the same screen or interaction. This helps identify what the user
   was doing and what they expected to happen.

4. **When you spot an issue, document it immediately** using the schema below.

### Issue Schema

Every issue MUST have ALL of these fields:

```json
{
  "id": "UI-001",
  "category": "UI",
  "severity": "high|medium|low|critical",
  "verification_tier": "code_verifiable|visual_required|hybrid",
  "title": "Short descriptive title",
  "description": "Detailed description of what's wrong",
  "discovery_evidence": {
    "recording_number": 1,
    "frame_numbers": [45, 46, 47],
    "frame_files": ["frame_0045.png", "frame_0046.png", "frame_0047.png"],
    "visual_description": "What exactly is visible in these frames"
  },
  "pass_fail_criteria": {
    "description": "Objective, binary test for whether this is fixed",
    "check_method": "visual|functional|data_validation",
    "expected_state": "What it SHOULD look like or do",
    "current_state": "What it CURRENTLY looks like or does"
  },
  "status": "OPEN",
  "status_history": [
    {
      "from": null,
      "to": "OPEN",
      "timestamp": "<iso timestamp>",
      "reason": "Discovered in initial audit",
      "evidence": "recording-1/frame_0045.png"
    }
  ],
  "fix_attempts": [],
  "verification_evidence": null,
  "related_issues": [],
  "source_files_likely": []
}
```

### Severity Guide

- **critical**: Feature entirely non-functional, crash, data loss, blocks core
  user flow. (Live broadcast missing, subscription broken = critical)
- **high**: Significant functionality broken or very poor UX that most users
  would notice and be bothered by.
- **medium**: Noticeable issue but workaroundable or affects secondary features.
- **low**: Minor polish issues, slight misalignments, cosmetic.

---

## Phase 3: The Issue Registry

After completing the frame-by-frame audit, compile everything into
`/home/claude/audit-workspace/issue_registry.json`.

Then use the registry management script to generate and print a scorecard:

```bash
python3 /path/to/this/skill/scripts/registry_manager.py \
  --registry /home/claude/audit-workspace/issue_registry.json \
  --action scorecard
```

**Always print the scorecard to the user after any status change.** The
scorecard format:

```
═══════════════════════════════════════════════════
  ALGORITHMLENS AUDIT SCORECARD — Recording #1
═══════════════════════════════════════════════════
  Total Issues Found:     43
  ─────────────────────────────────────────────────
  OPEN:                   43  ████████████████ 100%
  FIX_ATTEMPTED:           0
  CODE_VERIFIED:           0  (verified via code, pending visual confirm)
  VERIFIED:                0
  FIX_FAILED:              0
  REGRESSED:               0
  ─────────────────────────────────────────────────
  By Verification Tier:
    Tier 1 (code-verifiable):  15  → 0/15 code-verified
    Tier 2 (visual required):  20  → need recording
    Tier 3 (hybrid):            8  → 0/8 code-verified
  ─────────────────────────────────────────────────
  By Category:
    UI/Visual:       12  (4 crit, 3 high, 3 med, 2 low)
    Accuracy:         8  (2 crit, 4 high, 2 med)
    Functionality:    9  (3 crit, 2 high, 2 med, 2 low)
    Performance:      5  (1 crit, 2 high, 2 med)
    Live Broadcast:   6  (6 crit — feature missing)
    Subscription:     3  (3 crit — flow broken)
  ─────────────────────────────────────────────────
  Completion: 0.0% verified
  Recording readiness: NOT READY (0/15 tier-1 code-verified)
═══════════════════════════════════════════════════
```

Present the full issue list to the user, grouped by category and severity,
before proceeding to fixes. Ask them: "Does this capture everything you're
seeing? Anything I missed or miscategorized?"

---

## Phase 4: Fix Cycle

### Batch Discipline

**Work in batches of 5-8 issues.** Do NOT attempt to fix all issues in one
continuous run. See "Execution Discipline — Rule 1" for why.

Each batch follows this mini-cycle:
1. Snapshot the registry: `cp issue_registry.json issue_registry.snapshot-batch-N.json`
2. Fix 5-8 issues (see below for how to fix each one)
3. Save the registry to disk after each individual fix
4. After the batch: re-read the registry FROM DISK, run the scorecard,
   reconcile, print the batch summary to the user
5. Start the next batch

### Prioritization

Fix issues in this order:
1. Critical issues (features entirely broken)
2. High severity
3. Medium severity
4. Low severity

Within each severity level, prioritize by likely user impact and by whether
fixing one issue might cascade-fix related issues. Also group issues that
touch the same files into the same batch — this reduces context-switching
and makes it easier to spot interactions between fixes.

### For each issue:

1. **Locate the source code.** Check the codebase for relevant files. If
   the project structure isn't known, start with:
   ```bash
   find /path/to/project -type f \( -name "*.swift" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" \) | head -50
   ```
   Then narrow down based on the issue category.

2. **Understand the current implementation** before changing anything. Read
   the relevant files fully. Understand the data flow.

3. **Make the fix.** Be surgical — change only what's necessary. Document
   exactly what you changed and why.

4. **Update the registry:**
   ```json
   {
     "status": "FIX_ATTEMPTED",
     "fix_attempts": [
       {
         "attempt_number": 1,
         "timestamp": "<iso>",
         "files_changed": ["path/to/file.swift"],
         "description": "What was changed and why",
         "diff_summary": "Brief description of the code diff",
         "confidence": "high|medium|low",
         "confidence_reasoning": "Why you think this will/might/might not work"
       }
     ]
   }
   ```

5. **CRITICAL: Do NOT change status to VERIFIED.** The status goes to
   FIX_ATTEMPTED only. Verification requires a new recording.

### After EACH batch (every 5-8 issues):

**Mandatory reconciliation — do not skip this.**

1. Re-read issue_registry.json from disk (not from memory)
2. Run: `python3 scripts/registry_manager.py -r issue_registry.json -a validate`
3. Run: `python3 scripts/registry_manager.py -r issue_registry.json -a scorecard`
4. Cross-check: Does the number of FIX_ATTEMPTED issues match how many you
   believe you fixed? If not, investigate before continuing.
5. For Tier 1 issues in this batch, run code-verification checks now
6. Print the batch summary to the user (see Execution Discipline Rule 6)
7. If anything feels uncertain, flag it to the user (Rule 7)

### After ALL batches complete, run Pre-Flight:

Print the updated scorecard. Then tell the user:

```
═══════════════════════════════════════════════════════
  FIX BATCH COMPLETE — Pre-Flight Passed
═══════════════════════════════════════════════════════

  Fixes attempted:        43
  Code-verified (Tier 1): 15  ✅ (no recording needed)
  Awaiting visual verify: 28

  PRE-FLIGHT RESULTS:
    Build:                ✅ Compiles clean
    Lint:                 ✅ No errors in changed files
    Code-path tracing:    ✅ All Tier 1 paths confirmed
    Confidence:           78% (above 70% threshold)

  YOUR RECORDING CHECKLIST:
  Focus on these specific screens/interactions:
  1. ☐ [specific screen or feature for issue X]
  2. ☐ [specific interaction for issue Y]
  3. ☐ [specific screen for issue Z]
  ... (generated from Tier 2 + Tier 3 open issues)

  IMPORTANT: You don't need to test everything from
  scratch — just the items above. Estimated recording
  time: ~2 minutes.

  I will NOT mark anything as verified until I see it
  working in your new recording.
═══════════════════════════════════════════════════════
```

The checklist should be generated dynamically from the Tier 2 (VISUAL_REQUIRED)
and Tier 3 (HYBRID) issues that are still FIX_ATTEMPTED. Group them by screen
to minimize navigation — the user shouldn't have to visit the same screen
three times for three different issues.

On later iterations, the checklist gets SHORTER because verified issues drop
off. This is how recordings get faster over time.

---

## Phase 5: Verification Audit

When a new recording arrives:

### Step 0: Context Refresh (MANDATORY)

Before doing ANYTHING with the new recording:
1. Re-read this SKILL.md (at minimum, this section and the Verification Tiers)
2. Re-read references/verification_protocol.md
3. Re-read issue_registry.json from disk
4. Print the current scorecard
5. List how many issues are in each status

This takes a minute. It prevents you from operating on stale assumptions
about what was fixed and what still needs checking.

### Step 1: Extract frames (same as Phase 1)

### Step 1b: Snapshot the registry before making any changes

```bash
cp issue_registry.json issue_registry.pre-verification-rN.json
```

### Step 2: Systematic verification

Verify issues in batches of 5-8, just like fixing. After each verification
batch, save the registry to disk and re-read it before continuing.

For EACH issue with status FIX_ATTEMPTED or CODE_VERIFIED:

**For CODE_VERIFIED issues (Tier 1):**
These already passed automated checks. The recording is a confirmation pass.
If you can see the relevant area and it looks correct, promote to VERIFIED.
If it looks broken despite code checks passing, mark FIX_FAILED and
investigate why code analysis was wrong — this is a learning opportunity.

**For FIX_ATTEMPTED issues (Tier 2 and 3):**

1. **Find the relevant frames.** Scan through the new recording's frames
   to find where the affected area/feature is shown.

2. **Apply the pass/fail criteria.** This was defined during discovery.
   Use it literally. Don't soften it.

3. **Make a binary decision:**
   - **PASS → VERIFIED**: The objective criteria are clearly met in the
     new recording. Log the frame numbers as verification evidence.
   - **FAIL → FIX_FAILED**: The criteria are not met. Log what you see
     and what's still wrong.
   - **INCONCLUSIVE → stays FIX_ATTEMPTED**: The recording doesn't show
     the relevant area clearly enough. Note this and ask the user to
     capture it in the next recording.

4. **Be adversarial.** For each "PASS" you're about to assign, pause and
   ask yourself:
   - Could this be a different screen that looks similar?
   - Could the issue be intermittent and just not showing right now?
   - Is the test truly exercising the same scenario?
   If there's real doubt, mark INCONCLUSIVE, not VERIFIED.

### Step 3: Regression check

Go through ALL previously VERIFIED issues and re-check them against the
new recording. If any have regressed:

```json
{
  "status": "REGRESSED",
  "status_history": [
    "...",
    {
      "from": "VERIFIED",
      "to": "REGRESSED",
      "timestamp": "<iso>",
      "reason": "Regression detected in recording #3",
      "evidence": "recording-3/frame_0089.png"
    }
  ]
}
```

REGRESSED issues are treated as OPEN for the next fix cycle.

### Step 4: New issue discovery

While reviewing the new recording, also look for NEW issues that weren't
in the original audit. These sometimes appear because:
- Fixes introduced new bugs
- The new recording exercises paths the original didn't
- The user navigated to screens not previously captured

Add new issues to the registry with the same rigor as the original audit.

### Step 5: Print updated scorecard

Always show the full scorecard after verification. Highlight changes:

```
═══════════════════════════════════════════════════
  VERIFICATION RESULTS — Recording #2
═══════════════════════════════════════════════════
  Total Issues:           46  (+3 new)
  ─────────────────────────────────────────────────
  VERIFIED:               22  ██████████████      48%
    (15 promoted from CODE_VERIFIED, 7 visual-confirmed)
  CODE_VERIFIED:           0  (all promoted)
  FIX_ATTEMPTED:           2  █                    4%
  OPEN:                    3  █                    7%
  FIX_FAILED:             17  ████████            37%
  REGRESSED:               2  █                    4%
  ─────────────────────────────────────────────────
  Changes this round:
    ✅ Newly verified:   22  (huge jump from Tier 1 promotions)
    ❌ Fix failed:       17
    🔄 Regressed:         2
    🆕 New issues:        3
    ⏳ Inconclusive:      2
  ─────────────────────────────────────────────────
  Completion: 47.8% verified
  Next recording: ~17 items to check (shorter!)
═══════════════════════════════════════════════════
```

### Step 6: Post-Verification Reconciliation

After ALL verification is complete for this recording:

1. Run the diff script to show exactly what changed:
   ```bash
   python3 scripts/diff_registries.py \
     --before issue_registry.pre-verification-rN.json \
     --after issue_registry.json
   ```
2. Validate the registry: `python3 scripts/registry_manager.py -r issue_registry.json -a validate`
3. Confirm: Are there any VERIFIED issues without frame evidence? (Should be zero)
4. Confirm: Does the count of status changes match what you remember doing?

---

## Phase 6: Loop

If completion is less than 100%:

1. Analyze WHY fixes failed. Look for patterns:
   - Were the code changes targeting the wrong file?
   - Is there a build/config issue preventing changes from taking effect?
   - Are there dependency issues?

2. Attempt new fixes for all OPEN, FIX_FAILED, and REGRESSED issues.

3. Request another recording.

4. Verify again.

**The loop continues until the scorecard shows 100% VERIFIED.**

If the user wants to stop early (e.g., deprioritize low-severity issues),
they can explicitly tell you to exclude specific issues. Those get marked
as DEFERRED and are excluded from the completion percentage — but still
tracked.

---

## File Structure

The audit workspace should be organized as:

```
audit-workspace/
├── issue_registry.json          ← The source of truth
├── scorecard_history.json       ← Scorecard at each checkpoint
├── frames/
│   ├── recording-1/             ← Frames from first recording
│   │   ├── frame_0001.png
│   │   ├── frame_0002.png
│   │   └── ...
│   ├── recording-2/             ← Frames from verification recording
│   │   └── ...
│   └── ...
├── reports/
│   ├── audit-report-r1.md       ← Full audit report per recording
│   ├── verification-report-r2.md
│   └── ...
└── fix-logs/
    ├── batch-1/
    │   ├── fix-log.json          ← All fixes in this batch
    │   └── diffs/                ← Actual diffs for reference
    └── ...
```

---

## Important Notes for the Executing Agent

### On being honest about progress

If you fixed 5 out of 40 issues, say "5 out of 40." Never say "significant
progress" or "most issues addressed." Numbers only. Percentages only. The
user deserves to know exactly where things stand.

### On the AlgorithmLens codebase

The AlgorithmLens project likely has:
- A React Native or Swift-based iOS app
- API endpoints for social media feed analysis
- Analysis engine that scores feeds on multiple dimensions
- Live broadcast feature (currently broken/missing)
- Subscription/payment flow (currently broken)

Before making fixes, explore the actual project structure. Don't assume.
Read files before editing them.

### On compute usage

The user has explicitly approved heavy compute usage. Don't cut corners on:
- Frame extraction (extract all frames, don't sample too sparsely)
- Frame analysis (look at every frame, don't skip)
- Fix attempts (try thorough fixes, not quick patches)
- Verification (check every issue individually)

It's better to use 10x the compute and get it right than to save compute
and miss issues.

### On the screen recording workflow

The user records on their iPhone and sends recordings to their laptop via
email or Messages. The file will arrive in uploads. Common formats: .mov
(iPhone default), .mp4. ffmpeg handles both.

### On what "done" means

Done means the scorecard shows either:
- 100% of issues VERIFIED, or
- 100% of non-DEFERRED issues VERIFIED (if user chose to deprioritize some)

Nothing else counts as done.
