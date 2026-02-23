# AlgorithmLens Deep Dive Plan

## How to use this document

Each step below says **NEW TASK** — meaning open a fresh Cowork session. Copy and paste the text inside the gray code block exactly as written. Wait for it to finish completely before moving to the next step.

**Do them in order.** Each step builds on what the previous step produced.

Every task includes a **5-cycle self-review loop** — Cowork will do the work, then critique its own work harshly, then improve based on that critique, and repeat this 5 times. This means every task gets 5 rounds of polish before it's considered done.

Every task includes a **git save step** at the end so your progress is always saved. If something ever goes wrong, you can always get back to a known good state.

**Expected total time:** 3-6 weeks of Cowork compute.

---

## STEP 0 — Save Current Progress

**NEW TASK.** Paste this:

```
The AlgorithmLens mobile app codebase is at:
/sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Go to that directory and set up git to save our progress. Run these commands:

1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. Create a .gitignore file with these entries:
   node_modules/
   .expo/
   dist/
   *.jks
   *.p8
   *.p12
   *.key
   *.mobileprovision
   *.orig.*
   web-build/
   .env
   .env.local
   ios/
   android/
3. Run: git add -A
4. Run: git commit -m "Baseline: all phases 0-6 complete, pre-deep-dive"

That's it. Just save the current state. Don't change any code.
```

---

## ROUND 1: AUDIT EVERYTHING

The goal of this round is to find every problem before fixing anything. We want a complete picture first.

---

### Step 1 — Full Architecture & Code Quality Audit

**NEW TASK.** Paste this:

```
I need you to perform an exhaustive architecture and code quality audit of the AlgorithmLens mobile app. This is a React Native / Expo app with native iOS (Swift) and Android (Kotlin) modules for screen broadcast capture, a Gemini 2.0 Flash analysis pipeline, and a dashboard.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

DO NOT MAKE ANY CHANGES TO THE APP CODE. This is a read-only audit. Your job is to produce a comprehensive report.

Start by using the algorithm-lens:code-quality skill and the algorithm-lens:architecture-rules skill to understand the project's standards.

Then do all of the following:

1. READ EVERY FILE in these directories:
   - mobile/src/ (all subdirectories — types, lib, hooks, components, context, config)
   - mobile/app/ (all route files)
   - mobile/modules/ (all native module files — Swift, Kotlin, gradle, manifests)
   - mobile/app.json, mobile/package.json, mobile/tsconfig.json, mobile/babel.config.js

2. For every file, check for:
   - Import paths that might not resolve (especially cross-module imports)
   - TypeScript type errors or unsafe `as any` casts
   - Functions that can return undefined/null but callers don't check
   - Promises that aren't awaited or don't have .catch()
   - Event listeners or timers that aren't cleaned up
   - State mutations that could cause stale closures in React hooks
   - Hardcoded values that should be configurable (API URLs, timeouts, magic numbers)
   - Dead code (functions defined but never called, imports never used)
   - Inconsistent patterns (some files do X one way, others do it differently)

3. Map every data flow end-to-end:
   - User taps platform → broadcast starts → frames captured → frames stored → frames read → sent to Gemini → response parsed → UnifiedScanResult built → saved to Supabase → dashboard reads it
   - For EACH step, document: what format is the data in? What could go wrong? What happens if it fails?

4. Check native code specifically:
   - Swift: memory management (retain cycles, autoreleasepool usage in loops, CIContext reuse)
   - Swift: thread safety (what runs on main thread vs background?)
   - Swift: broadcast extension memory limit (50MB) — could we exceed it?
   - Kotlin: bitmap recycling on every code path
   - Kotlin: coroutine cancellation handling
   - Kotlin: foreground service lifecycle edge cases
   - Both: does the Expo module bridge API match what TypeScript expects?

5. Check the Gemini pipeline specifically:
   - Is the API key securely stored?
   - What happens if Gemini returns malformed JSON?
   - What happens if Gemini returns valid JSON but with unexpected field values?
   - What happens if the API is rate limited or returns 500?
   - Is the prompt injection safe? (Could a social media post contain text that tricks Gemini?)
   - Are we handling the response size limit correctly?

Save your complete report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/01_architecture_code_quality.md

Format the report as:
- **CRITICAL** issues (will cause crashes or data loss)
- **HIGH** issues (will cause bad user experience or silent failures)
- **MEDIUM** issues (code quality, maintainability, potential future bugs)
- **LOW** issues (style, naming, documentation)

For each issue include: file path, line number(s), what's wrong, and exactly how to fix it.

At the end of the report, include a "Data Flow Map" section that traces the complete broadcast → analysis → dashboard pipeline with every transformation documented.

--- SELF-REVIEW CYCLE ---

Now do the following 5 times. Each cycle, you must ACTUALLY re-read the report you saved, find problems with it, and improve it. Do not skip cycles or say "looks good" without finding something to improve.

CYCLE 1: Re-read your report. Ask yourself: "Did I actually read every single file, or did I skip some? Did I check every item in the checklist above?" Go back and read any files you missed. Add any findings you missed to the report. Save the updated report.

CYCLE 2: Re-read your report. Ask yourself: "Are my fix suggestions specific enough that someone could implement them without asking questions? Or are any of them vague like 'add error handling'?" Rewrite any vague suggestions to include exact code changes. Save the updated report.

CYCLE 3: Re-read your report. Ask yourself: "Did I correctly assess severity? Is anything marked MEDIUM that's really CRITICAL? Is anything marked CRITICAL that's actually LOW?" Adjust severities. Also check: did I miss any edge cases in the data flow map? Save the updated report.

CYCLE 4: Re-read your report. Ask yourself: "If I were a completely different engineer reading this report for the first time, would I understand every issue clearly? Is there any jargon that needs explanation? Are the file paths all correct?" Clean up clarity and verify all file paths exist. Save the updated report.

CYCLE 5: Re-read your report one final time. Ask yourself: "Is there anything about this codebase that worries me that I haven't written down? Any gut feelings I ignored?" Add a "Gut Check" section at the very end with anything that still concerns you, even if you can't fully articulate why. Save the final report.

After all 5 review cycles, the report at mobile/audits/01_architecture_code_quality.md should be complete and thorough. You're done.
```

---

### Step 2 — Security & Privacy Audit

**NEW TASK.** Paste this:

```
I need you to perform an exhaustive security and privacy audit of the AlgorithmLens mobile app. This app records users' screens and sends screenshots to Google's Gemini API for analysis. The security bar is extremely high.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

DO NOT MAKE ANY CHANGES. Read-only audit.

Start by using the algorithm-lens:audit-security skill.

Then check ALL of the following:

**API Key Security:**
- Where is the Gemini API key stored? Is it in the app bundle? Could someone decompile the app and extract it?
- Where are the Supabase credentials? Same question.
- Are any secrets in source control, .env files committed, or hardcoded in code?
- Is there a .gitignore that properly excludes sensitive files?

**Data at Rest:**
- Captured frames (JPEG screenshots) — where are they stored on disk? Are they encrypted? When are they deleted?
- Frame metadata (JSON) — same questions
- Session data in AsyncStorage — what's stored? Is any of it sensitive?
- Supabase data — what's in the scans table? Could one user access another user's data?
- Are there any temporary files that persist after the app closes?

**Data in Transit:**
- Are all API calls using HTTPS?
- Is the Gemini API call authenticated properly?
- Are Supabase calls using the anon key or a service key? (anon key is fine for client-side with RLS)
- Could a man-in-the-middle intercept screenshot data?

**Data Processing:**
- Are captured screenshots ever sent anywhere besides Gemini?
- Is the "fire-and-forget" backend enrichment call safe? What data does it send?
- Could a malicious Gemini response cause code execution? (Check JSON.parse usage)
- Could a malicious social media post content (extracted via OCR) cause injection?

**iOS Specific:**
- Is the App Group container accessible to other apps? (Should be NO)
- Is the broadcast extension properly sandboxed?
- Are frames deleted from the shared container after processing?

**Android Specific:**
- Is internal storage properly scoped? (Other apps shouldn't access it)
- Is the MediaProjection permission properly revoked after use?
- Are frames deleted after processing?

**App Store Privacy Requirements:**
- What data do we collect? (Apple requires disclosure)
- Do we need App Tracking Transparency? (If we send any identifiers to third parties)
- What would our Privacy Nutrition Label look like?
- Do we need a privacy policy URL? What should it say?

**Authentication:**
- How is user authentication handled?
- Are auth tokens stored securely (Keychain on iOS, encrypted storage on Android)?
- Is there proper session expiry?
- Can an unauthenticated user access any functionality?

**Supabase Row Level Security:**
- Read the Supabase client setup and check: are RLS policies assumed? What happens if they're not configured?
- Could a user craft a query to see other users' scan data?

Save your complete report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/02_security_privacy.md

For each finding:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Category: API Keys, Data at Rest, Data in Transit, Privacy, Authentication, Authorization
- What's wrong (specific file + line)
- Exact fix needed
- Whether it's an App Store rejection risk

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read your report. For every finding, ask: "Could I actually exploit this vulnerability right now if I had the app installed?" If the answer is unclear, go back to the code and verify. Remove false positives. Add any real vulnerabilities you missed. Save the updated report.

CYCLE 2: Re-read your report. Ask: "Did I check every single file that handles sensitive data — API keys, tokens, user data, screenshots?" List every file that touches sensitive data and verify you audited each one. Save the updated report.

CYCLE 3: Re-read your report. Ask: "Would Apple reject this app for any privacy reason? Did I check every requirement from Apple's App Review Guidelines Section 5 (Privacy)?" Add any App Store rejection risks you missed. Save the updated report.

CYCLE 4: Re-read your report. Ask: "Are my fix suggestions actually secure, or could they introduce new vulnerabilities?" Verify each suggested fix is correct. Save the updated report.

CYCLE 5: Re-read your report one final time. Add a "Top 5 Scariest Things" section at the end — the five security/privacy issues that worry you most, ranked by how bad the consequences would be if exploited. Save the final report.

After all 5 review cycles, the report at mobile/audits/02_security_privacy.md should be complete. You're done.
```

---

### Step 3 — UX, Accessibility & Copy Audit

**NEW TASK.** Paste this:

```
I need you to perform an exhaustive UX, accessibility, and copy audit of the AlgorithmLens mobile app. The goal: this app should look and feel as polished as a top-10 App Store app. Right now it was built by engineers, not designers. Find every place where a designer would cringe.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

DO NOT MAKE ANY CHANGES. Read-only audit.

Start by using the algorithm-lens:ui-ux-philosophy skill and the algorithm-lens:epistemic-restraint skill.

Then audit ALL of the following:

**Visual Consistency:**
- Read mobile/src/lib/theme.ts and mobile/src/context/ThemeContext.tsx
- Then read EVERY component and screen file
- Check: are colors always from the theme, or are there hardcoded hex values?
- Check: is spacing always using SPACING constants, or are there magic numbers?
- Check: is typography always using TYPOGRAPHY, or are there inline font styles?
- Check: are border radiuses consistent? Shadow styles consistent?
- Check: does every screen use SafeAreaView correctly?

**Empty States:**
- What does the dashboard look like with zero scans?
- What does history look like with zero scans?
- What does the home screen look like for a brand new user?
- Are empty states helpful or just blank?

**Loading States:**
- What does each screen show while data is loading?
- Are there skeleton loaders or just spinners?
- Does any screen flash blank then load content (layout shift)?

**Error States:**
- What does the user see when Gemini fails?
- What does the user see when Supabase is unreachable?
- What does the user see when broadcast permission is denied?
- Are error messages helpful or technical?

**Accessibility:**
- Does every interactive element have an accessibilityLabel?
- Does every image/icon have an accessibilityRole?
- Would VoiceOver read the screens sensibly?
- Do touch targets meet the 44x44pt minimum?
- Does the app respect Dynamic Type (system font size)?
- Are color contrasts WCAG AA compliant? (especially text on colored backgrounds)

**Responsiveness:**
- Would layouts break on iPhone SE (320pt wide)?
- Would layouts break on iPhone 15 Pro Max (430pt wide)?
- Are any elements cut off or overlapping on small screens?
- Is horizontal scrolling ever needed? (it shouldn't be)

**Animations & Micro-interactions:**
- Are there entrance animations on screens?
- Do buttons have press feedback (opacity, scale)?
- Does the progress bar animate smoothly?
- Are transitions between screens smooth?
- Is there haptic feedback at key moments?

**Copy (All User-Facing Text):**
- Read every string that a user would see: titles, labels, buttons, descriptions, error messages, empty states, tooltips
- Is the tone consistent? (Should be: warm, clear, non-alarming, factual without being preachy)
- Are there any typos or grammatical errors?
- Is any text too technical for a non-technical user?
- Are button labels clear about what will happen when tapped?
- Does any text make claims that are too strong? ("Your feed is toxic" vs "Your feed shows high ad density")

**Dark Mode:**
- Read the ThemeContext to understand dark mode implementation
- Check every component: do they all use theme colors?
- Are there any hardcoded colors that would look wrong in dark mode?
- Do images/icons adapt to dark mode?

**Navigation & Information Architecture:**
- Is the tab bar labeling clear?
- Can users always get back to where they came from?
- Is there a clear path from "I just opened the app" to "I completed a scan"?
- Are there any dead ends?

Save your complete report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/03_ux_accessibility_copy.md

For each finding:
- Category: Visual, Empty State, Loading State, Error State, Accessibility, Responsiveness, Animation, Copy, Dark Mode, Navigation
- Severity: CRITICAL (broken/unusable) / HIGH (looks unprofessional) / MEDIUM (could be better) / LOW (nice to have)
- File + line number
- What's wrong
- Exactly what it should look like instead (be specific — give exact colors, spacing values, text strings)

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read your report. Ask: "Did I actually read every component file? Every screen file?" Go back and verify. Check for any files you skipped. Add findings. Save.

CYCLE 2: Re-read your report. For every "what it should look like instead" suggestion, ask: "Is this specific enough to implement? Did I give exact hex colors, exact pixel values, exact text strings?" Rewrite any vague suggestions. Save.

CYCLE 3: Re-read your report. Ask: "Would a blind user be able to use this app? Did I check every interactive element for accessibility labels?" Go through every TouchableOpacity, Pressable, and Button in the codebase and verify. Save.

CYCLE 4: Re-read your report. Ask: "Did I check dark mode for every single component, or just the screens? Did I verify every hardcoded color?" Search the codebase for any hex color (#) that's not in the theme file and list every one. Save.

CYCLE 5: Re-read your report one final time. Add a "If I Could Only Fix 10 Things" section — your top 10 highest-impact UX improvements ranked by how much they'd improve the first impression of the app. Save the final report.

After all 5 review cycles, the report at mobile/audits/03_ux_accessibility_copy.md should be complete. You're done.
```

---

### Step 4 — Accuracy & Edge Case Audit

**NEW TASK.** Paste this:

```
I need you to perform an exhaustive accuracy and edge case audit of the AlgorithmLens mobile app. This app captures screenshots of social media feeds and uses Gemini 2.0 Flash to extract and classify feed items. The accuracy of that classification is the core value proposition. If the numbers on the dashboard are wrong, the app is useless.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

DO NOT MAKE ANY CHANGES. Read-only audit.

Start by using the algorithm-lens:scan-accuracy skill.

Then audit ALL of the following:

**Gemini Prompt Quality:**
- Read mobile/src/lib/analysis/analysisPrompts.ts thoroughly
- Is the system prompt clear and unambiguous?
- Could Gemini misinterpret what counts as an "ad"? (Sponsored posts vs organic brand content vs influencer partnerships)
- Could Gemini misinterpret "political" content? (News about politics vs political activism vs policy discussion)
- Are the platform hints accurate for each platform's current UI?
- Could the prompt produce hallucinated data? (Gemini inventing items that weren't in the screenshot)
- Is the deduplication prompt robust? Could it merge items that are actually different?
- Could the prompt be improved with few-shot examples?
- Is temperature 0.1 the right choice? Should it be 0?

**Response Parsing Robustness:**
- Read mobile/src/lib/analysis/geminiFlashService.ts
- What happens if Gemini returns a JSON object wrapped in markdown backticks?
- What happens if Gemini returns extra text before/after the JSON?
- What happens if a field is the wrong type (string instead of number, etc.)?
- What happens if Gemini returns more items than were actually in the screenshot?
- What happens if Gemini returns zero items for a frame that clearly has content?
- Is sanitizeExtractedItem defensive enough?

**Pipeline Logic:**
- Read mobile/src/lib/analysis/broadcastAnalysisPipeline.ts
- Trace buildUnifiedScanResult — does every field get computed correctly?
- Are aggregate statistics (ad_percentage, political_percentage, etc.) computed from the right source data?
- If Gemini extracts 50 items but dedup reduces to 30, are the aggregates computed from 30?
- Is the topic distribution computed correctly?
- Is the emotional tone aggregation correct?

**Dashboard Data Display:**
- Read mobile/src/lib/computeDashboardData.ts
- Does the dashboard correctly read the data that the pipeline saves?
- Could any percentage exceed 100% or go below 0%?
- Could any count be negative?
- Are division-by-zero cases handled (e.g., 0 posts)?

**Edge Cases — Broadcast Capture:**
- What happens if the user starts a broadcast but never switches to a social media app? (0 useful frames)
- What happens if the user captures only 1 frame?
- What happens if all captured frames are identical? (User didn't scroll)
- What happens if the phone screen rotates during capture?
- What happens if a phone call comes in during capture?
- What happens if the user locks their phone during capture?
- What happens if iOS kills the broadcast extension for memory?
- What happens if the user has split-screen or Picture-in-Picture active?
- What happens if the capture duration exceeds the 10-minute limit?

**Edge Cases — Analysis Pipeline:**
- What happens if the Gemini API key is expired or invalid?
- What happens if the user has no internet during analysis?
- What happens if internet drops partway through (5 of 20 frames analyzed)?
- What happens if the user backgrounds the app during analysis?
- What happens if analysis takes more than 5 minutes? (analysisDataStore TTL)
- What happens if the user starts a second scan while the first is still analyzing?
- What happens if Supabase is down when trying to save results?
- What happens if the user's Supabase auth token has expired?

**Edge Cases — Dashboard:**
- What happens if a scan has 0 feed items? (Gemini found nothing)
- What happens if all items are ads? (100% ad percentage)
- What happens if raw_data.analysis is null? (Old scan format)
- What happens if the user has 1000+ scans? (Performance)

Save your complete report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md

For each finding:
- Category: Prompt Quality, Response Parsing, Pipeline Logic, Dashboard Data, Broadcast Edge Case, Analysis Edge Case, Dashboard Edge Case
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- What could go wrong
- What currently happens (read the code to verify)
- What SHOULD happen
- Exact fix needed

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read your report. For every edge case you documented, ask: "Did I actually trace through the code to see what happens, or did I guess?" Go back to the code and verify each edge case answer with line-by-line tracing. Save.

CYCLE 2: Re-read your report. Ask: "Did I miss any edge cases? What about: memory pressure on old devices, extremely long usernames, emoji in content, RTL languages, timezone issues, daylight savings time, year boundaries for streaks?" Add any new edge cases. Save.

CYCLE 3: Re-read your report. Focus on the Gemini prompts. Ask: "If I were Gemini reading this prompt, what would confuse me? What would I get wrong?" Try to find ambiguities in every instruction. Save.

CYCLE 4: Re-read your report. For every "exact fix needed," ask: "Would this fix actually work? Could it introduce a new bug?" Verify each fix suggestion is correct and complete. Save.

CYCLE 5: Re-read your report one final time. Add a "Confidence Assessment" section: for each major component (broadcast capture, Gemini analysis, dedup, dashboard computation), rate your confidence from 1-10 that it produces correct results, and explain why. Save the final report.

After all 5 review cycles, the report at mobile/audits/04_accuracy_edge_cases.md should be complete. You're done.
```

---

## ROUND 2: FIX EVERYTHING

Now we fix every issue found in Round 1, starting with the most severe.

---

### Step 5 — Fix All Critical & High Issues

**NEW TASK.** Paste this:

```
You are fixing all CRITICAL and HIGH severity issues found in the AlgorithmLens mobile app audits. The audit reports are at:

- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/01_architecture_code_quality.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/02_security_privacy.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/03_ux_accessibility_copy.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Read ALL FOUR audit reports first. Make a combined list of every CRITICAL and HIGH issue across all reports. Then fix them all, one by one.

For each fix:
1. Read the relevant file(s)
2. Make the change
3. Verify the fix doesn't break anything nearby
4. Move to the next issue

Use the algorithm-lens:code-quality skill and algorithm-lens:architecture-rules skill to ensure fixes follow project standards.

After fixing everything, run `npx tsc --noEmit` from the mobile directory to verify zero TypeScript errors. If there are errors, fix them too.

Save a changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/05_critical_high_fixes_changelog.md

The changelog should list every issue fixed, with before/after code snippets and which audit report it came from.

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read every audit report. Go through the CRITICAL and HIGH issues one by one. For each one, open the actual code file and verify the fix is in place. If any fix is missing or incomplete, fix it now. Save updated changelog.

CYCLE 2: Run `npx tsc --noEmit` again. If there are ANY errors, fix them. Then read every file you modified and ask: "Did my fix introduce any new bugs? Did I break any imports? Did I change any function signatures that other files depend on?" Fix anything you find. Save updated changelog.

CYCLE 3: Re-read all your changes. Ask: "Did I take the easy way out on any fix? Did I just silence an error instead of actually fixing the root cause?" If you find any band-aid fixes, replace them with proper fixes. Save updated changelog.

CYCLE 4: For every fix, re-read the surrounding code (the whole function, not just the line you changed). Ask: "Does my fix fit naturally into the existing code style? Would a code reviewer approve this?" Clean up anything that looks out of place. Save updated changelog.

CYCLE 5: One final check. Read the changelog top to bottom. Ask: "Is every fix documented clearly with before/after? Could someone understand what changed and why without reading the audit reports?" Clean up the changelog for clarity. Then run `npx tsc --noEmit` one final time to confirm zero errors. Save the final changelog.

After all 5 review cycles, save your work with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Fix all critical and high severity issues from Round 1 audits"

You're done.
```

---

### Step 6 — Fix All Medium & Low Issues

**NEW TASK.** Paste this:

```
You are fixing all MEDIUM and LOW severity issues found in the AlgorithmLens mobile app audits. Critical and High issues were already fixed.

Read the audit reports:
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/01_architecture_code_quality.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/02_security_privacy.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/03_ux_accessibility_copy.md
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md

Also read what was already fixed:
- /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/05_critical_high_fixes_changelog.md

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Fix every MEDIUM and LOW issue. Use the same process: read, fix, verify, next.

Use the algorithm-lens:code-quality skill and algorithm-lens:architecture-rules skill.

After fixing everything, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/06_medium_low_fixes_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read every audit report. Go through ALL MEDIUM and LOW issues. For each one, open the file and verify it's fixed. If any are missed, fix them now. Save updated changelog.

CYCLE 2: Run `npx tsc --noEmit`. Fix any errors. Read every modified file and check for new bugs introduced by your fixes. Save updated changelog.

CYCLE 3: Ask: "Are there any MEDIUM/LOW issues from the 'Gut Check' or 'Top 5 Scariest Things' or 'If I Could Only Fix 10 Things' sections of the audit reports that I haven't addressed?" Fix any remaining items. Save updated changelog.

CYCLE 4: Re-read all modified files for code style consistency. Make sure everything follows the same patterns as the rest of the codebase. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit` one final time. Review the complete changelog for clarity. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Fix all medium and low severity issues from Round 1 audits"

You're done.
```

---

### Step 7 — Error Handling Hardening

**NEW TASK.** Paste this:

```
You are hardening every error path in the AlgorithmLens mobile app so that no user ever sees a crash, a blank screen, a cryptic error message, or a silent failure. Every failure should result in a helpful, non-technical message and a clear path to recovery.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Read the edge case audit for context: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/04_accuracy_edge_cases.md

Use the algorithm-lens:epistemic-restraint skill for all user-facing error messages.

For every screen and every hook in the app, implement proper error handling:

**1. Network Failures (no internet / Gemini down / Supabase down):**
- Every fetch/API call needs a try-catch with a user-friendly error message
- If Gemini is unreachable, show: "Can't reach the analysis service right now. Check your internet connection and try again."
- If Supabase is unreachable, the app should still work — just can't save. Show a warning, not an error.
- Add a simple network connectivity check utility

**2. Broadcast Failures:**
- If the user denies screen recording permission: clear message, button to retry
- If the extension crashes mid-capture: detect it, inform user, offer to retry
- If zero frames are captured: explain why this might happen and what to do differently
- If the shared container is inaccessible: clear error, not a crash

**3. Analysis Pipeline Failures:**
- If any single frame fails Gemini analysis: skip it, continue with others, tell user "Analyzed X of Y frames"
- If ALL frames fail: clear error message with retry button
- If deduplication fails: fall back to using all items (already fixed, verify it works)
- If the result can't be saved to Supabase: show results anyway, warn that they won't appear in history
- If the user backgrounds the app during analysis: analysis should continue (or pause and resume)

**4. Dashboard Failures:**
- If a scan has malformed data: show "This scan couldn't be displayed" instead of crashing
- If computeDashboardData throws: catch it, show empty dashboard with error message
- If a specific tab's data is missing: show "No data for this category" not a blank screen

**5. Global Error Boundary:**
- Verify there's a React error boundary at the root level
- If an unhandled error occurs, show a "Something went wrong" screen with a "Restart" button

**6. Timeout Handling:**
- Gemini API calls should have a timeout (30 seconds per frame)
- Supabase calls should have a timeout (10 seconds)
- Broadcast session should auto-stop at 10 minutes with a clear message

For each error case, use the algorithm-lens:epistemic-restraint skill to make sure error messages are warm, clear, and never blame the user.

After implementing all error handling, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save a report of everything you added to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/07_error_handling_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Go through every single API call, fetch, and async function in the codebase. Verify each one has proper error handling. List any you missed and fix them. Save updated changelog.

CYCLE 2: Re-read every user-facing error message you wrote. Ask: "If I were a non-technical person who just wanted to scan my Instagram feed, would this message make sense? Would I know what to do next?" Rewrite any confusing messages. Save updated changelog.

CYCLE 3: Trace every error path mentally. Starting from each possible failure (no internet, permission denied, API error, timeout, etc.), follow the code path and make sure the user ends up seeing a helpful message — not a blank screen, not an unhandled crash, not a spinner that spins forever. Fix any gaps. Save updated changelog.

CYCLE 4: Check that no error handling silently swallows important errors. Every catch block should either show the user a message OR log the error for debugging. No empty catch blocks. Fix any you find. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Read the complete changelog. Verify it's clear and complete. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Harden all error handling paths"

You're done.
```

---

## ROUND 3: MAKE IT BEAUTIFUL AND COMPELLING

This round transforms the app from "it works" to "I want to use this every day."

---

### Step 8 — UI Overhaul: Design System & Theme

**NEW TASK.** Paste this:

```
You are overhauling the design system and theme of the AlgorithmLens mobile app to bring it to the quality level of a top-10 App Store app. Think: Calm app meets Duolingo meets a modern fintech app. Clean, trustworthy, sophisticated, slightly playful.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Start by using the algorithm-lens:ui-ux-philosophy skill to understand the design principles.

Read the UX audit for specific issues: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/03_ux_accessibility_copy.md

**Your tasks:**

1. **Upgrade the theme system** (mobile/src/lib/theme.ts and mobile/src/context/ThemeContext.tsx):
   - Define a complete color palette: primary, secondary, accent, success, warning, error, neutrals (50-900 scale)
   - Define elevation/shadow system: sm, md, lg, xl
   - Define a spacing scale that's mathematically consistent (4pt grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
   - Define typography scale: display, h1, h2, h3, body, bodySmall, caption, label — with letter-spacing and line-height
   - Define border radius scale: sm (6), md (10), lg (14), xl (20), full (9999)
   - Add semantic color tokens: textPrimary, textSecondary, textTertiary, textInverse, bgPrimary, bgSecondary, bgElevated, borderDefault, borderSubtle
   - Make dark mode a first-class citizen with carefully chosen dark colors (not just inverted light colors)
   - Add a subtle gradient palette for cards and backgrounds

2. **Create reusable UI primitives** (mobile/src/components/ui/):
   - Button component: primary, secondary, ghost, danger variants. Proper press states, loading state, disabled state. Minimum 44pt touch target.
   - Card component: default, elevated, interactive variants. Consistent padding, border, shadow.
   - Badge component: colored pills for tags, status indicators
   - ProgressBar component: animated, themed, multiple color options
   - EmptyState component: icon + title + description + action button
   - ErrorState component: icon + message + retry button
   - Divider component: subtle horizontal rule
   - Chip component: for filters, tags, selection states

3. **Eliminate ALL hardcoded styles across the entire app:**
   - Search every file for hardcoded hex colors (#xxx) and replace with theme tokens
   - Search every file for hardcoded pixel values and replace with SPACING constants
   - Search every file for inline fontSize/fontWeight and replace with TYPOGRAPHY presets
   - Search every file for inline borderRadius and replace with RADIUS constants

4. **Dark mode verification:**
   - After updating the theme, go through every screen component and verify it uses theme colors
   - Test mentally: would this look good on a dark background?

After completing all changes, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save a report of everything you changed to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/08_design_system_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Search the entire codebase for any remaining hardcoded hex colors (#), hardcoded pixel values, inline font sizes, and inline border radiuses. List every one you find and fix them. Save updated changelog.

CYCLE 2: Open each new UI primitive component you created. Ask: "Does this component handle every state — default, pressed, disabled, loading, error? Is the API flexible enough for all the places it will be used?" Improve any component that's missing states. Save updated changelog.

CYCLE 3: Mentally render each screen in dark mode. Read the color values for every element and ask: "Is this readable? Is the contrast sufficient? Does it look good, not just functional?" Fix any dark mode issues. Save updated changelog.

CYCLE 4: Check that the theme system is internally consistent. Are all the scales (spacing, typography, colors, radii, shadows) logically structured? Could a new developer understand the system without explanation? Clean up any inconsistencies. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Review the complete changelog. Save the final version.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Overhaul design system: new theme, UI primitives, eliminate hardcoded styles"

You're done.
```

---

### Step 9 — UI Overhaul: Home Screen & Onboarding

**NEW TASK.** Paste this:

```
You are redesigning the home screen and creating an onboarding flow for AlgorithmLens that makes users excited to start their first scan within 30 seconds of opening the app. Think of the best onboarding you've ever seen in a mobile app — that's the bar.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Use the algorithm-lens:ui-ux-philosophy skill and algorithm-lens:epistemic-restraint skill.

Read the design system: mobile/src/lib/theme.ts and mobile/src/components/ui/

**1. Home Screen Redesign** (mobile/src/components/home/ and mobile/app/(tabs)/index.tsx):

The home screen is the most important screen. Users see it every time they open the app. It needs to:
- Feel calm and sophisticated, not busy or cluttered
- Give returning users a reason to scan today (streak, score change, insight)
- Make starting a scan feel effortless (one prominent CTA, not a grid of choices)

Redesign it with:
- A greeting section: "Good morning, Justin" with the current streak prominently displayed
- A "Feed Health Score" card: if they have recent scans, show their score with a subtle trend indicator. If no scans, show an inviting prompt.
- A primary CTA: "Scan Your Feed" — big, beautiful, impossible to miss
- Platform selection: after tapping the CTA, a smooth bottom sheet slides up with platform icons (not a grid on the home screen)
- Recent scan preview: a small card showing their last scan result ("Instagram · 2 hours ago · 23 posts · 12% ads")
- Daily tip: a rotating insight card ("Did you know? The average user sees 40% suggested content on Instagram")

**2. Onboarding Flow** (create new screens as needed):

First-time users need a 3-screen onboarding that takes 15 seconds max:
- Screen 1: "See what's really in your feed" — brief explanation with an elegant illustration (use a simple SVG or abstract graphic, not a stock photo)
- Screen 2: "How it works" — 3 simple steps with icons: Open → Scroll → Discover
- Screen 3: "Start your first scan" — platform selection with a "Let's go" button

Design principles:
- Use the design system components you created in Step 8
- No walls of text — every screen should be scannable in 2 seconds
- The CTA should always be the most visually prominent element

After completing, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/09_home_onboarding_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read the home screen code. Ask: "If I opened this app for the very first time, would I know what it does and what to do next within 5 seconds?" If the answer is unclear, simplify. Save updated changelog.

CYCLE 2: Re-read the onboarding flow. Ask: "Could I remove any words and still communicate the same thing? Is every sentence absolutely necessary?" Cut ruthlessly. Shorter is better. Save updated changelog.

CYCLE 3: Check that every component uses the design system — theme colors, spacing constants, typography presets, UI primitives. No hardcoded values. Fix any you find. Save updated changelog.

CYCLE 4: Check accessibility: does every element have proper accessibilityLabels? Are touch targets 44pt minimum? Would the onboarding make sense to a VoiceOver user? Fix any issues. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Do a final read-through of all code you wrote. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Redesign home screen, add onboarding flow"

You're done.
```

---

### Step 10 — UI Overhaul: Dashboard, History & Analysis Screens

**NEW TASK.** Paste this:

```
You are redesigning the dashboard, history, broadcast, and analysis screens of AlgorithmLens to match the quality of the home screen and design system created in previous steps.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Use the algorithm-lens:ui-ux-philosophy skill. Read the design system at mobile/src/lib/theme.ts and mobile/src/components/ui/.

**1. Dashboard Overhaul** (mobile/app/(tabs)/dashboard.tsx and mobile/src/components/dashboard/):

The dashboard is where users see the value of scanning. It needs to feel like a premium analytics tool, not a developer debug panel.

- Overview tab: a clean summary card with key metrics (post count, ad %, suggested %, political %). Use subtle icons, not just numbers.
- Each metric should have context: "12% ads — that's lower than average" or "35% suggested content — higher than last week"
- Tab switching should animate smoothly
- Empty tab states should have a helpful illustration and clear CTA
- The comparison view should feel intuitive with clear before/after visual treatment

**2. History Screen** (mobile/app/(tabs)/history.tsx):

- Scan cards should have a mini-visualization (tiny bar chart or sparkline) not just text
- Group scans by day with section headers ("Today", "Yesterday", "This Week")
- Add pull-to-refresh
- The comparison mode selection should feel tactile (selection glow, haptic on select)
- Add a filter option: by platform, by date range

**3. Broadcast Screen** (mobile/app/broadcast/[platform].tsx):

This screen records the user's screen. It needs to feel SAFE and TRUSTWORTHY.

- Use the platform's brand color as an accent throughout
- The recording indicator should be clearly visible but not alarming
- Stats during recording should update smoothly
- The "Stop" button should be large and easy to tap
- After stopping, the transition to analysis should feel rewarding

**4. Analysis Screen** (mobile/app/analysis/[sessionId].tsx):

The analysis screen is a waiting room. Make the wait feel productive and engaging.

- The progress stages should feel like a journey, not a loading bar
- Each stage could have a fun micro-fact: "Examining your feed for hidden patterns..."
- The completion moment should be satisfying (checkmark animation, haptic)
- The results summary should tease key findings to build excitement before they tap "View Dashboard"

After completing all changes, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/10_screens_overhaul_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Open every screen you modified. Ask: "Does this screen use the design system consistently? Any hardcoded colors, spacing, or fonts?" Fix any violations. Save updated changelog.

CYCLE 2: Trace the full user journey: Home → tap Scan → pick platform → broadcast screen → stop → analysis → results → dashboard → history. Ask: "Is the visual transition smooth between every screen? Does the design language feel consistent throughout?" Fix any jarring transitions. Save updated changelog.

CYCLE 3: Check every screen for empty states, loading states, and error states. Each must have a polished design using the EmptyState or ErrorState UI primitives. Fix any missing states. Save updated changelog.

CYCLE 4: Check accessibility on every screen: labels, roles, touch targets, contrast ratios. Fix any issues. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Final review of all changes. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Overhaul dashboard, history, broadcast, and analysis screens"

You're done.
```

---

### Step 11 — Habit-Forming Features

**NEW TASK.** Paste this:

```
You are adding features that make AlgorithmLens a daily habit. Study what makes Duolingo, Wordle, and fitness apps addictive — then apply those patterns tastefully to AlgorithmLens. The goal: users should feel a pull to open the app every day, not because we're manipulating them, but because the insights are genuinely valuable and the experience of tracking their feed health is rewarding.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Use the algorithm-lens:product-context skill and algorithm-lens:ui-ux-philosophy skill.

**1. Streak System Enhancement** (mobile/src/lib/streakManager.ts, mobile/src/components/home/):

The streak system exists but is basic. Upgrade it:
- Add streak freeze: users can "freeze" their streak once per week (like Duolingo)
- Add visual streak progression: not just a number but a visual that grows (flame icon that gets bigger, color that changes)
- Milestone celebrations: when hitting 3, 7, 14, 30 days — show a special card with a shareable badge
- Streak at risk indicator: if it's evening and the user hasn't scanned today, show a gentle reminder on the home screen

**2. Weekly Summary Report** (new component):

Every Monday, show a card on the home screen with their weekly recap:
- "You scanned X times this week"
- "Your ad exposure decreased by Y%"
- "Top platform: Instagram (5 scans)"
- Make it feel like a reward for their effort

**3. Achievement System** (new: mobile/src/lib/achievements.ts):

Create an achievement/badge system:
- "First Scan" — completed your first scan
- "Multi-Platform" — scanned 3+ different platforms
- "Streak Starter" — 3-day streak
- "Week Warrior" — 7-day streak
- "Feed Detective" — scanned 50+ total posts
- "Pattern Spotter" — noticed a trend change (ad % went down)
- "Night Owl" — scanned after 10pm
- "Early Bird" — scanned before 8am
- Store achievements in AsyncStorage
- Show earned badges on the home screen in a subtle collection
- Animate badge earning moment

**4. Feed Health Score Trending:**

- Track the Feed Health Score over time (store each scan's score)
- Show a 7-day sparkline/trend on the home screen
- Color-code: improving (green arrow up), declining (orange arrow down), stable (gray dash)
- Add context: "Your feed health improved 8% this week"

**5. Smart Scan Suggestions:**

- After 3+ scans on one platform, suggest scanning a different platform
- After not scanning for 2+ days: "Your last scan was Tuesday. Things change fast — want to check in?"
- Time-based: "Most people's feeds change between morning and evening. Try scanning at a different time of day."

All text must follow the algorithm-lens:epistemic-restraint skill — warm, factual, never preachy or alarming.

After completing all features, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/11_habit_forming_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Read every new feature you built. Ask: "Does this feel like it was designed with care, or slapped together? Would this feel at home in Duolingo?" Improve any feature that feels rushed. Save updated changelog.

CYCLE 2: Re-read every piece of user-facing text in your new features. Apply the algorithm-lens:epistemic-restraint skill strictly. Ask: "Is any text manipulative, preachy, or anxiety-inducing?" Rewrite anything that crosses the line. The tone should be encouraging, never guilt-tripping. Save updated changelog.

CYCLE 3: Check that every new feature uses the design system: theme colors, spacing, typography, UI primitives. No hardcoded values. Fix any violations. Save updated changelog.

CYCLE 4: Test edge cases in your new features. What if the user has zero scans? What if they have 1000 scans? What if AsyncStorage is full? What if the date is January 1st (new year edge case for streaks)? Fix any edge cases. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Final review. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Add habit-forming features: streaks, achievements, weekly summary, trends"

You're done.
```

---

### Step 12 — Performance & Accessibility

**NEW TASK.** Paste this:

```
You are optimizing the AlgorithmLens mobile app for performance and accessibility. The app should feel instant on a 3-year-old phone, and fully usable by someone who is blind, has low vision, or has motor difficulties.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

**PERFORMANCE:**

1. **React Performance:**
   - Find every component that re-renders unnecessarily. Add React.memo where appropriate.
   - Find every expensive computation in render. Wrap in useMemo.
   - Find every callback created in render. Wrap in useCallback.
   - Find any FlatList without keyExtractor, getItemLayout, or windowSize optimization.
   - Check: are large lists virtualized? (History with 1000+ scans)
   - Check: are images optimized? (JPEG quality, dimensions)

2. **Memory Management:**
   - The broadcast extension has a 50MB memory limit. Verify frame processing stays under it.
   - The analysis pipeline loads base64 frame data into memory. With 200 frames, this could be 200MB+. Implement streaming or batching if needed.
   - Check: are there memory leaks from subscriptions, timers, or event listeners not cleaned up?
   - Add explicit cleanup in every useEffect that creates resources.

3. **Startup Performance:**
   - Trace the code path from _layout.tsx to the first visible screen.
   - Are there any synchronous blocking operations on startup?
   - Can any initialization be deferred or lazy-loaded?

4. **Bundle Size:**
   - Are there any large dependencies we could replace with smaller alternatives?
   - Are there any unused dependencies in package.json?
   - Could we lazy-import the analysis pipeline (only load when needed)?

**ACCESSIBILITY:**

5. **VoiceOver/TalkBack Support:**
   - Go through every screen and component and add:
     - accessibilityLabel (for every interactive element)
     - accessibilityRole (button, link, header, image, etc.)
     - accessibilityHint (for non-obvious actions)
     - accessibilityState (disabled, selected, checked, etc.)
   - Ensure focus order is logical (top to bottom, left to right)

6. **Dynamic Type:**
   - Check: does every Text component scale with system font size?
   - If using fixed fontSize, use allowFontScaling or relative sizing.

7. **Touch Targets:**
   - Every tappable element must be at least 44x44 points
   - Add hitSlop where the visual element is smaller than 44pt

8. **Color Contrast:**
   - Check every text color against its background
   - Minimum ratios: 4.5:1 for body text, 3:1 for large text (WCAG AA)

9. **Reduced Motion:**
   - Add AccessibilityInfo.isReduceMotionEnabled checks where animations are used

After completing everything, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/12_performance_accessibility_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Go through every component file in the app. For each interactive element (buttons, pressables, touchables, links), verify it has an accessibilityLabel and meets the 44pt touch target. List any you missed and fix them. Save updated changelog.

CYCLE 2: Check every useMemo, useCallback, and React.memo you added. Ask: "Is this actually necessary, or am I prematurely optimizing? Could this memo cause bugs by preventing needed re-renders?" Remove any that are unnecessary or harmful. Save updated changelog.

CYCLE 3: Check every useEffect in the codebase. Does each one that creates a subscription, timer, or listener have a cleanup function? Fix any that don't. Save updated changelog.

CYCLE 4: Mentally walk through the app as a VoiceOver user. Screen by screen, element by element. Would the reading order make sense? Would every element be described clearly? Fix any issues. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit`. Fix any errors. Final review. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Optimize performance and add full accessibility support"

You're done.
```

---

## ROUND 4: VERIFY EVERYTHING AGAIN

After all those changes, we need to audit again to make sure nothing broke.

---

### Step 13 — Second Full Audit

**NEW TASK.** Paste this:

```
You are performing a SECOND full audit of the AlgorithmLens mobile app after extensive improvements. The previous audit reports and fix changelogs are in mobile/audits/. The app has gone through: architecture fixes, security hardening, error handling, UI overhaul, habit-forming features, and performance/accessibility work.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Your job: find everything that's STILL wrong or that was introduced by the previous fixes. Be MORE critical than the first audit. The bar is: "Would a senior engineer at Apple approve this for the App Store?"

Do all of the following:

1. Run `npx tsc --noEmit` and report ANY errors
2. Read EVERY file that was changed (check the changelogs in mobile/audits/ for the list)
3. Check for NEW bugs introduced by the fixes
4. Check that all the original CRITICAL/HIGH issues from Round 1 are actually fixed (not just papered over)
5. Check the new features (achievements, weekly summary, streak enhancements) for bugs
6. Check the new UI components for accessibility compliance
7. Check that dark mode works with ALL the new components
8. Check that the error handling actually catches every case
9. Verify the design system is consistently applied (no hardcoded colors/spacing remaining)
10. Check for any TODO or FIXME comments that were left behind

Use the algorithm-lens:qa-process skill.

Save your report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/13_second_audit.md

Same format: CRITICAL / HIGH / MEDIUM / LOW with file paths, line numbers, and exact fixes.

At the end, include a "Remaining Issues Summary" — a bulleted list of everything that still needs fixing before this app is App Store ready.

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Go back to the Round 1 audit reports (01-04). For every CRITICAL and HIGH issue, verify in the actual code that it's been fixed. If ANYTHING was missed, add it to your report. Save updated report.

CYCLE 2: Search the codebase for: `as any`, `TODO`, `FIXME`, `HACK`, `console.log`, hardcoded hex colors (#), and unused imports. List every occurrence. Save updated report.

CYCLE 3: For every new feature added in Steps 8-12, trace through the code looking for bugs. Pay special attention to state management, async operations, and edge cases. Save updated report.

CYCLE 4: Check every screen in the app for dark mode, accessibility, and empty/loading/error states. Each screen should handle all three gracefully. Save updated report.

CYCLE 5: Finalize the "Remaining Issues Summary." Be brutally honest. Is this app ready? If not, exactly what remains? Save the final report.

After all 5 review cycles, you're done. Do not make any code changes in this step.
```

---

### Step 14 — Fix Everything from Second Audit

**NEW TASK.** Paste this:

```
Fix every issue found in the second audit of AlgorithmLens.

Read the second audit report: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/13_second_audit.md

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Fix ALL issues — CRITICAL, HIGH, MEDIUM, and LOW. Leave nothing. The goal is zero known issues.

Use the algorithm-lens:code-quality skill.

After fixing everything, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/14_second_fixes_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read the second audit report. Check every single issue against the actual code. Verify each is truly fixed. Fix any that were missed. Save updated changelog.

CYCLE 2: Run `npx tsc --noEmit`. Fix any errors. Read every modified file and check for new bugs. Save updated changelog.

CYCLE 3: Search the codebase one more time for: `as any`, `TODO`, `FIXME`, `HACK`, `console.log` (that shouldn't be in production). Remove or fix each one. Save updated changelog.

CYCLE 4: Do a final consistency pass: are all files using the same patterns? Same error handling style? Same naming conventions? Fix any inconsistencies. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit` one final time. Review the complete changelog. Save the final version.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Fix all issues from second audit — zero known issues"

You're done.
```

---

## ROUND 5: APP STORE PREPARATION

---

### Step 15 — App Store Assets & Configuration

**NEW TASK.** Paste this:

```
You are preparing the AlgorithmLens mobile app for App Store submission. This includes everything Apple requires and everything that makes the listing look professional.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

**1. App Icon:**
- Create an SVG app icon at mobile/assets/icon.svg
- The icon should represent: clarity, insight, awareness — like a lens or prism that reveals hidden patterns
- Colors: use the app's primary blue palette
- Must work at 1024x1024 and look good at 60x60 (no fine details that disappear at small sizes)

**2. Splash Screen:**
- Create an SVG at mobile/assets/splash.svg
- Should show the app icon centered with the app name below it
- Background color should match the app's bgPrimary

**3. App Store Metadata** (save to mobile/APP_STORE_METADATA.md):

Write the following:
- **App Name:** AlgorithmLens (30 char max)
- **Subtitle:** See what's really in your feed (30 char max)
- **Description:** (4000 char max) Write compelling App Store description. Start with the hook, explain the value, describe how it works, end with a CTA. No marketing fluff — be factual and warm.
- **Keywords:** (100 char max, comma-separated) Research what people search for related to social media analysis, feed health, algorithm awareness
- **Category:** Primary: Utilities. Secondary: Social Networking.
- **Age Rating:** 4+ (no objectionable content)
- **Review Notes for Apple:** Write a note explaining what the broadcast extension does and why it needs screen recording permission. Apple scrutinizes this. Be transparent and clear.

**4. Screenshot Specifications** (save to mobile/SCREENSHOT_SPEC.md):

Document what screenshots to take for the App Store listing:
- Screen 1: Home screen with streak and feed score
- Screen 2: Broadcast recording in progress
- Screen 3: Analysis results summary
- Screen 4: Dashboard overview tab
- Screen 5: History with comparison mode
- For each, specify: what data should be shown, what state the app should be in

**5. EAS Build Configuration:**

Create mobile/eas.json with proper build profiles:
- development: for testing on device
- preview: for TestFlight
- production: for App Store submission

Update mobile/app.json with any missing fields Apple requires.

After completing everything, run `npx tsc --noEmit` to verify zero TypeScript errors.

Save a changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/15_app_store_prep_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read the App Store description. Ask: "Would I download this app based on this description? Does the first sentence hook me? Does it explain what the app does clearly without jargon?" Rewrite if needed. Save.

CYCLE 2: Re-read the Review Notes for Apple. Ask: "Would an Apple reviewer understand exactly why we need screen recording? Could they think we're doing something malicious? Is our explanation thorough and transparent?" Improve if needed. Save.

CYCLE 3: Check app.json and eas.json thoroughly. Compare against Apple's requirements. Are all required fields present? Is the bundle identifier correct? Are entitlements correct? Fix any gaps. Save.

CYCLE 4: Re-read the keywords. Research competitors and see what keywords they use. Are we missing any high-value keywords? Optimize the 100-character limit. Save.

CYCLE 5: Final review of all assets and documents. Run `npx tsc --noEmit`. Save the final changelog.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Add App Store assets, metadata, and EAS build configuration"

You're done.
```

---

### Step 16 — Privacy Policy, Terms & Legal

**NEW TASK.** Paste this:

```
You are creating the legal documents needed for the AlgorithmLens App Store listing. These must be thorough, professional, and legally sound.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Read the security audit for context on what data the app handles: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/02_security_privacy.md

**1. Privacy Policy** (save to mobile/legal/PRIVACY_POLICY.md):

Write a comprehensive privacy policy that covers:
- What personal data we collect (account info, scan results, usage analytics)
- What device data we access (screen recording via broadcast extension)
- How screen recordings are processed (captured locally, sent to Google Gemini for analysis, then deleted)
- Third-party services: Google Gemini (what data we send, link to their privacy policy), Supabase (where data is stored, link to their privacy policy)
- Data retention: how long we keep scan results, when frames are deleted
- User rights: how to request data deletion, how to export data
- Children's privacy (COPPA compliance)
- International data transfers
- Contact information
- How we notify users of privacy policy changes

**2. Terms of Service** (save to mobile/legal/TERMS_OF_SERVICE.md):

Write terms covering:
- Acceptable use (don't use to stalk people, don't abuse the API)
- Intellectual property
- Disclaimer (we're not responsible for the accuracy of AI analysis)
- Limitation of liability
- Account termination
- Governing law

**3. Apple App Privacy Details** (save to mobile/legal/APP_PRIVACY_DETAILS.md):

Document exactly what to select in App Store Connect's privacy section:
- Data types collected (with yes/no for each Apple category)
- For each data type: is it linked to identity? Is it used for tracking?
- Data used for: App Functionality, Analytics, Product Personalization, Third-Party Advertising (should be NO for ads)

Make these documents clear, readable, and not full of unnecessary legalese. A regular person should be able to understand them.

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read the Privacy Policy. Ask: "Does this accurately describe what the app actually does with user data? Did I miss any data collection?" Go back to the codebase and verify every data flow is covered. Save.

CYCLE 2: Re-read the Privacy Policy from a user's perspective. Ask: "Would I feel comfortable using this app after reading this? Is anything alarming that should be explained better? Is anything missing that a privacy-conscious user would want to know?" Improve. Save.

CYCLE 3: Re-read the Terms of Service. Ask: "Are there any edge cases not covered? What if someone uses the app maliciously? What if the AI gives wrong information and the user makes decisions based on it?" Add any missing protections. Save.

CYCLE 4: Re-read the Apple App Privacy Details. Compare against the actual code: for every API call and data storage, verify it's accurately represented in the privacy details. Fix any discrepancies. Save.

CYCLE 5: Final review of all three documents. Check for typos, inconsistencies between documents, and missing information. Save the final versions.

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Add privacy policy, terms of service, and Apple privacy details"

You're done.
```

---

## ROUND 6: FINAL VERIFICATION

---

### Step 17 — Final QA Pass

**NEW TASK.** Paste this:

```
You are performing the FINAL quality assurance pass on the AlgorithmLens mobile app before App Store submission. This is the last check. Be ruthless. Find anything that isn't perfect.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

Use the algorithm-lens:qa-process skill and the algorithm-lens:prep-beta skill.

Perform ALL of the following checks:

1. **TypeScript:** Run `npx tsc --noEmit`. Zero errors required.

2. **Every screen — mental walkthrough:**
   - Open the app cold (first launch). What happens?
   - Open as returning user. What happens?
   - Navigate to every screen. Does each one render correctly?
   - Go back from every screen. Does navigation work?

3. **Every user flow — happy path:**
   - Sign up → onboarding → first scan → see results → dashboard → history
   - Return next day → streak increments → scan again → compare two scans
   - Try each platform: Instagram, X, YouTube, TikTok, Facebook, Reddit
   - Use iOS Shortcuts to start a scan

4. **Every user flow — sad path:**
   - No internet → try to scan → what happens?
   - Deny screen recording permission → what happens?
   - Kill app during broadcast → reopen → what happens?
   - Kill app during analysis → reopen → what happens?
   - Gemini API key missing → what happens?

5. **Code quality final check:**
   - Any remaining `as any` casts? List them all.
   - Any remaining TODO/FIXME/HACK comments? List them all.
   - Any console.log statements that should be removed for production?
   - Any unused imports or variables?
   - Any functions defined but never called?

6. **Bundle and build readiness:**
   - Is app.json complete with all required fields?
   - Is eas.json configured correctly?
   - Are all native module configs correct?
   - Are Android permissions correctly declared?
   - Are iOS entitlements correctly configured?

7. **Legal readiness:**
   - Does the privacy policy exist and cover all data practices?
   - Does the terms of service exist?
   - Are the App Privacy Details documented?

Save your FINAL report to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/17_final_qa.md

End the report with a clear YES or NO: "Is this app ready for App Store submission?"

If NO, list exactly what remains to be done.

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read your report. For every "everything looks fine" statement, go back and actually verify it in the code. Don't trust your memory. Open the file. Check the lines. Save updated report.

CYCLE 2: Search the codebase one final time for: `as any`, `TODO`, `FIXME`, `HACK`, `console.log`, `console.warn`, `console.error` (check if they should be there), hardcoded hex colors, and unused exports. Be exhaustive. Save updated report.

CYCLE 3: Re-read the full user journey one more time, from cold launch to dashboard. For every screen transition, ask: "Could anything go wrong here that I haven't accounted for?" Save updated report.

CYCLE 4: Re-read app.json and eas.json one more time. Check every field. Verify the bundle identifier, version number, permissions, entitlements, and plugin configurations are all correct. Save updated report.

CYCLE 5: Write your final verdict. Be honest. If there are any remaining concerns, document them — even small ones. The "YES or NO" at the end should reflect reality, not optimism. Save the final report.

After all 5 review cycles, you're done. Do not make code changes in this step.
```

---

### Step 18 — Fix Final Issues

**NEW TASK.** Paste this:

```
Read the final QA report: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/17_final_qa.md

If there are remaining issues, fix ALL of them. Leave absolutely nothing.

The codebase is at: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile

After fixing, run `npx tsc --noEmit` one final time.

Save the final changelog to: /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile/audits/18_final_fixes_changelog.md

--- SELF-REVIEW CYCLE ---

Now do the following 5 times:

CYCLE 1: Re-read the QA report. Verify every single issue is fixed in the actual code. Save updated changelog.

CYCLE 2: Run `npx tsc --noEmit`. If there are ANY errors, fix them. Read every modified file and check for new bugs. Save updated changelog.

CYCLE 3: Do one final search: `as any`, `TODO`, `FIXME`, `HACK`, `console.log`, hardcoded hex colors, unused imports, unused variables. If you find ANY, fix them. Save updated changelog.

CYCLE 4: Read the entire changelog from this step. Verify every change is documented clearly. Save updated changelog.

CYCLE 5: Run `npx tsc --noEmit` one absolute final time. Confirm zero errors. Save the final changelog. End with: "All issues resolved. The app is ready for App Store submission."

After all 5 review cycles, save with git:
1. cd /sessions/sharp-trusting-wright/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile
2. git add -A
3. git commit -m "Final fixes — app is App Store ready"

You're done.
```

---

## AFTER ALL 18 STEPS

When all steps are done, open a new Cowork task and paste:

```
I've completed the 18-step deep dive plan for AlgorithmLens. All audit reports and changelogs are in mobile/audits/. Read the final QA report at mobile/audits/17_final_qa.md and the final fixes changelog at mobile/audits/18_final_fixes_changelog.md. Give me a one-paragraph summary of the app's readiness, and tell me what to do next to get this on the App Store.
```
