---
description: Scan all user-facing text for epistemic restraint violations
allowed-tools: Read, Grep, Glob, Write, Task
---

Perform a comprehensive copy audit of the AlgorithmLens project. The goal is to find every piece of user-facing text that violates the epistemic restraint standards.

First, read the epistemic restraint skill at `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/SKILL.md` and the detailed language guide at `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/references/language-guide.md`. These define the rules for this audit.

Then scan every file in the project that could contain user-facing text. This includes but is not limited to:

- React component files (.jsx, .tsx) — look for string literals, labels, button text, headings, descriptions, placeholder text
- HTML files — look for visible text content
- JSON/YAML files — look for user-facing messages, error messages, notification text
- Email templates — look for subject lines and body copy
- Landing page content — look for headlines, descriptions, calls to action
- Tooltip text and help text
- Error messages and validation messages
- Onboarding flow text
- Empty state messages
- Confirmation dialogs
- Navigation labels and tab names

For each violation found, document:

1. **File path and line number** where the violation occurs
2. **The exact text** that violates the standard
3. **Why it's a problem** — explain in plain, non-technical language which rule it breaks and what impression it could give users
4. **Suggested replacement** — provide specific alternative text that conveys the same information while respecting epistemic restraint

Also flag any text that is borderline — not clearly a violation but worth reviewing for tone.

Organize findings into three sections:
- **Clear Violations** — text that definitely breaks the rules
- **Borderline — Worth Reviewing** — text that might be fine but could be improved
- **Positive Examples** — text that does an especially good job of epistemic restraint (include a few to show what good looks like)

Save the complete results as a markdown file called `COPY_AUDIT.md` in the project root directory. Include a summary count at the top: total violations found, total borderline items, and total files scanned.
