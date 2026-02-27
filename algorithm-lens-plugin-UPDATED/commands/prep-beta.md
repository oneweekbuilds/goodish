---
description: Run all audits and generate beta-readiness assessment
allowed-tools: Read, Grep, Glob, Write, Bash(npm:*, python:*, node:*, git:*), Task
model: opus
---

Generate a comprehensive beta-readiness assessment for AlgorithmLens by running all five audits in sequence, then synthesizing the results.

First, read all relevant skills to ensure you have full context:
- `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/architecture-rules/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/code-quality/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/qa-process/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/pricing-billing/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/product-context/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/ui-ux-philosophy/SKILL.md`

Then perform each audit in sequence. For each audit, conduct the full analysis described in its respective command, but save results as sections within the final report rather than separate files:

**Step 1: Copy Audit** — scan all user-facing text for epistemic restraint violations
**Step 2: Billing Audit** — review the complete Stripe payment flow
**Step 3: Security Audit** — check for vulnerabilities and exposed secrets
**Step 4: QA Report** — assess what works, what's partial, what's missing, what's broken
**Step 5: UX Audit** — review dashboard against design philosophy

After completing all five audits, synthesize the findings into a beta-readiness assessment with these sections:

**Beta Readiness Verdict**
A clear YES or NO on whether the product is ready for a controlled beta, with a one-paragraph explanation of the reasoning.

**Critical Blockers**
A ranked list of issues that MUST be fixed before any beta users see the product. These are items from any audit classified as critical severity.

**Important Items**
Issues that should be fixed soon but don't strictly block a controlled beta. Ranked by impact.

**Minor Items**
Polish and optimization items that can be addressed after beta begins.

**Recommended Action Plan**
A prioritized, ordered list of specific tasks to complete before beta launch. Each task should include:
- What to do (in plain language)
- Which audit identified it
- Estimated complexity (simple, moderate, complex)
- Why it matters

Order the action plan by: critical items first, then important items ordered by impact-to-effort ratio.

Save the complete assessment as `BETA_READINESS.md` in the project root directory.
