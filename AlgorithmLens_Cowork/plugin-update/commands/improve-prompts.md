---
description: Rewrite Google Flash prompts based on the most recent accuracy audit findings
allowed-tools: Read, Grep, Glob, Write, Task
---

Read the most recent `ACCURACY_AUDIT.md` report from the project root directory. If no accuracy audit exists, stop and tell the user to run `/audit-accuracy` first.

Also read the scan accuracy skill at `${CLAUDE_PLUGIN_ROOT}/skills/scan-accuracy/SKILL.md` and the epistemic restraint skill at `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/SKILL.md` — all prompt rewrites must follow accuracy standards and epistemic principles.

**Important privacy constraint:** Never include actual user feed data in prompt examples. Use synthetic or hypothetical examples only.

**Important change constraint:** Do NOT apply any changes to the codebase. Present all proposed changes for the user's review first. The user will decide which changes to approve.

Then, based on the audit findings, rewrite the prompts sent to Google Flash. Follow these steps:

---

**Step 1 — Identify All Prompts**

Using the pipeline map from the accuracy audit, locate every prompt or instruction string that is sent to Google Flash. Read each one in full.

---

**Step 2 — Prioritize by Impact**

Review the findings from the accuracy audit. Rank the prompt-related issues by their expected impact on user-facing accuracy. Issues that could cause widespread misclassification rank higher than issues that affect rare edge cases.

---

**Step 3 — Rewrite Prompts**

For each prompt that needs improvement, produce a side-by-side comparison:

### [Issue Title — e.g., "Missing edge case for sponsored political content"]

**Why this matters (plain language):**
[Explain what the problem is and what kind of misclassification it could cause, in terms a non-developer would understand]

**Impact:** [High / Medium / Low]

**Original prompt text:**
```
[exact current text]
```

**Proposed replacement:**
```
[rewritten text]
```

**What changed and why:**
[Explain each change in plain language — what was added, removed, or reworded, and how it improves accuracy]

---

**Step 4 — Organize by Impact**

Present all proposed changes organized from highest impact to lowest impact. Group related changes together if multiple changes address the same underlying issue.

---

**Step 5 — Summary**

At the top of the document, include:
- Total number of prompt changes proposed
- Count by impact level (high / medium / low)
- A one-paragraph plain-language summary of what the rewrites accomplish overall
- A note reminding the user that no changes have been applied — these are proposals for review

---

Save the proposed changes as `PROMPT_IMPROVEMENTS.md` in the project root directory.
