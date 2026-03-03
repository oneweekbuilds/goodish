---
description: Fix issues from the most recent audit report
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(npm:*, python:*, node:*, git:*), Task
---

Help the user fix issues identified in the most recent audit or QA report.

**Step 1: Find the most recent report**
Search the project for audit and QA files: `COPY_AUDIT.md`, `BILLING_AUDIT.md`, `SECURITY_AUDIT.md`, `QA_REPORT.md`, `UX_AUDIT.md`, `BETA_READINESS.md`. Read the most recently modified one. If multiple exist, read the most recent and mention the others.

**Step 2: Present the issues**
Show the user a numbered list of all issues found in the report. For each issue, show:
- A short description (one line)
- The severity level
- The file or area affected

Ask the user which issues they want to fix. Wait for their response before proceeding.

**Step 3: Fix approved issues one at a time**
For each issue the user approved:

1. **Explain what you're about to change** — in plain, non-technical language, describe what the current problem is and what the fix will look like. Do not make changes until you've explained.

2. **Make the change** — implement the fix carefully. Follow the code quality standards from the project's skills (no placeholders, explicit error handling, environment variables for secrets).

3. **Confirm what changed** — after making the fix, briefly summarize what was modified and why.

4. **Move to the next issue** — repeat for each approved item.

**Step 4: Generate updated report**
After all approved fixes are complete, generate a new QA report following the format in the QA process skill at `${CLAUDE_PLUGIN_ROOT}/skills/qa-process/SKILL.md`. The new report should:
- Note which issues were fixed in this session
- Re-assess remaining issues
- Compare against the previous report as a baseline
- Save as `QA_REPORT.md` in the project root (overwriting or creating new as appropriate)

Throughout this process, respect the architecture rules (don't move logic between layers), the epistemic restraint standards (for any copy changes), and the code quality standards (for any code changes). If a fix is risky, suggest a checkpoint commit before making it.
