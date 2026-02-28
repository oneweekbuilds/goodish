# AlgorithmLens Autonomous Quality Loop
## Single Combined Hourly Task

---

## SETUP

1. Download and place these files in your project root (C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\):
   - QUALITY_RUBRIC.md
   - agent_loop_state.json
   - AGENT_LOOP_SETUP.md (this file — for your reference only)

2. Create 1 scheduled task in Cowork:
   - Name: quality-loop
   - Description: Autonomous audit-fix-verify cycle for AlgorithmLens
   - Prompt: (copy the entire prompt below)
   - Model: Default
   - Folder: C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder
   - Frequency: Hourly

3. Keep laptop awake (see power settings discussed earlier)

---

## PROMPT TO PASTE INTO COWORK

```
You are running one cycle of an autonomous quality improvement loop for AlgorithmLens. This loop runs every hour. You will perform 4 phases in sequence: AUDIT → PRIORITIZE → FIX → VERIFY.

FIRST — Read these files for context:
- QUALITY_RUBRIC.md (quality standards, design philosophy, epistemic restraint rules)
- agent_loop_state.json (shared state from previous cycles)
- CLAUDE.md (project-level context)
- AlgorithmLens_Cowork/CLAUDE.md (Cowork-specific context)
- AlgorithmLens_Cowork/DESIGN_TOKENS.json (authoritative design tokens)

Also scan existing audit history to avoid re-discovering known issues:
- AlgorithmLens_Cowork/mobile/audits/ (existing changelogs)
- EQUALIZATION_TRACKER.md (cross-platform parity status)

════════════════════════════════════════
PHASE 1: AUDIT (find new issues)
════════════════════════════════════════

Read the cycle_count from agent_loop_state.json. Use (cycle_count % 8) to determine this cycle's focus:

0: Epistemic restraint — scan all user-facing strings for violations (P0 if found)
1: Cross-platform parity — compare tab names, colors, labels, data formats across mobile/web/extension
2: Error handling — find components missing error boundaries, try/catch, loading states, empty states
3: Code quality — TypeScript errors, unused imports, console.logs, any types, dead code
4: Accessibility — missing aria labels, contrast ratios (4.5:1 min), 44x44pt touch targets, SafeAreaView
5: Copy quality — confusing text, inconsistent terminology, grammar, jargon a normal user wouldn't understand
6: Design token compliance — find hardcoded colors, spacing, fonts that should use DESIGN_TOKENS.json or theme.ts
7: Existing audit follow-up — read mobile/audits/ changelogs and verify claimed fixes actually exist in the code

Where to look (code-based, no visual inspection):
- Mobile: AlgorithmLens_Cowork/mobile/src/ and AlgorithmLens_Cowork/mobile/app/
- Web: AlgorithmLens_Cowork/src/
- Extension: alg-gemini-extension/src/

Rules:
- Do NOT duplicate issues already in the queue (check agent_loop_state.json)
- Each issue needs: specific file path, clear description, severity (P0-P3 per rubric), category, confidence (high/medium)
- Only log medium or high confidence issues

Add new issues to agent_loop_state.json with status "open".

════════════════════════════════════════
PHASE 2: PRIORITIZE (prepare work order)
════════════════════════════════════════

Review all issues with status "open" in agent_loop_state.json:

1. Remove duplicates (same file + same issue)
2. Verify severity ratings match QUALITY_RUBRIC.md definitions
3. Check each issue against the "What Agents Should NOT Touch" list in QUALITY_RUBRIC.md
   - If it requires restricted changes → set status to "needs-human", move to needs_human array
4. If any issue has attempt_count >= 2 → set status to "needs-human"
5. Sort: P0 first, then P1, then P2. Within same priority, prefer confidence "high"
6. Select the top 3 issues for fixing this cycle
   - Prefer related issues in the same area of the codebase
   - Mark these as status "in-progress"

════════════════════════════════════════
PHASE 3: FIX (implement changes)
════════════════════════════════════════

For each issue marked "in-progress", in priority order:

1. Read the relevant source file(s) and understand context
2. Make the MINIMAL fix that resolves the issue — change nothing else
3. Log what you did in the issue's fix_history array
4. Increment attempt_count

Critical rules:
- Do NOT refactor surrounding code
- Do NOT add features or change behavior
- Do NOT touch anything on the "What Agents Should NOT Touch" list
- If a fix requires changing more than 3 files → set status to "needs-human" instead
- If the issue is more complex than expected → set status to "needs-human" instead
- Use design tokens from DESIGN_TOKENS.json or theme.ts — never hardcode colors/spacing

After all fixes, run verification:
- For mobile changes: cd AlgorithmLens_Cowork/mobile && npx tsc --noEmit
- For web changes: cd AlgorithmLens_Cowork && npx tsc --noEmit
- If either fails due to YOUR changes, revert those specific changes and mark the issue as "failed"

Then commit: git add -A && git commit -m "agent-loop cycle [N]: [brief description]"

════════════════════════════════════════
PHASE 4: VERIFY (check the fixes worked)
════════════════════════════════════════

For each issue you just fixed:

1. Re-read the file and confirm the specific issue is actually resolved
2. Check that no new problems were introduced (broken imports, syntax errors)
3. If the fix involved cross-platform consistency, check the other platforms too

Set each issue's status:
- "verified" → move to completed array
- "failed" → set status back to "open", add failure details to fix_history
- If a fix introduced NEW problems → create a new P0 issue and run: git revert HEAD --no-edit

════════════════════════════════════════
FINAL: UPDATE STATE
════════════════════════════════════════

Update agent_loop_state.json:
- Increment cycle_count
- Update all issue statuses
- Update stats (total_issues_found, total_fixed, total_failed, total_needs_human, breakdowns by severity and platform)
- Add commit hash to git_log array
- Save the file

This completes one cycle. The next hourly run will continue from where you left off.
```

---

## CHECKING PROGRESS

Open agent_loop_state.json at any time to see:
- **stats**: Overall progress numbers
- **needs_human**: Issues that need your attention (check once a day)
- **issue_queue**: What's still being worked on
- **completed**: What's been resolved
- **git_log**: All commits made by the loop

For needs_human items, you can:
- Fix it yourself in Cowork
- Add guidance to the issue description and set status back to "open"
- Decide it's not worth fixing and delete it

## EMERGENCY STOP

If things go wrong, see recent changes:
```
git log --oneline -10
```

Revert the last cycle:
```
git revert HEAD --no-edit
```

Or go all the way back to your checkpoint:
```
git reset --hard e9fb70e
```
