---
description: Generate a comprehensive QA report
allowed-tools: Read, Grep, Glob, Write, Bash(npm:*, python:*, node:*), Task
---

Generate a comprehensive quality assurance report for the AlgorithmLens project.

First, read the QA process skill at `${CLAUDE_PLUGIN_ROOT}/skills/qa-process/SKILL.md` and the checklists reference at `${CLAUDE_PLUGIN_ROOT}/skills/qa-process/references/checklists.md`. Follow the report structure and severity classification defined there.

Then check for any previous QA reports in the project (search for files matching `QA_REPORT*.md` or similar). If found, use the most recent one as a baseline for comparison.

Conduct a thorough review covering:

**1. What is Complete and Functional**
- Walk through each of the six dashboard tabs and verify they render correctly
- Check that the snapshot capture flow works end-to-end
- Verify basic navigation and state management
- Confirm the demo mode works for presentations
- List every feature that is confirmed working

**2. What is Partially Built**
- Identify features that exist but are incomplete
- Note any placeholder code, stub functions, or TODO comments
- Flag any features that render but with incorrect or missing data
- Check for partial Stripe integration elements

**3. What is Missing**
- Compare the current state against the intended feature set (six tabs, payment flow, feature gating, trend analysis)
- Identify any expected endpoints that don't exist
- Check for missing error handling, loading states, or empty states
- Note any missing environment configuration

**4. What is Broken**
- Identify any crashes, errors, or non-functional features
- Check browser console for JavaScript errors
- Check backend logs for Python errors
- Flag any UI elements that render incorrectly

Organize all findings by severity:
- **Critical** — blocks launch (security issues, payment failures, data loss)
- **Important** — should fix before beta (feature gaps, UX issues, missing error handling)
- **Minor** — can fix later (polish, optimization, edge cases)

If a previous QA report exists, include a **Comparison** section noting what improved, what regressed, and what's new since the last report.

End with a **Recommended Next Steps** section — a prioritized list of the most important items to address, starting with critical issues.

Save the results as `QA_REPORT.md` in the project root directory. Include the date and a summary count at the top.
