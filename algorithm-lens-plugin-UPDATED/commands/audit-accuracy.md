---
description: Trace the entire classification pipeline from end to end and produce a comprehensive accuracy audit
allowed-tools: Read, Grep, Glob, Write, Task
model: opus
---

Perform a comprehensive accuracy audit of the AlgorithmLens scan classification pipeline. This is the most important audit command for product quality — if the scan misclassifies content, the entire dashboard becomes misleading.

First, read the scan accuracy skill at `${CLAUDE_PLUGIN_ROOT}/skills/scan-accuracy/SKILL.md` and the detailed pipeline reference at `${CLAUDE_PLUGIN_ROOT}/skills/scan-accuracy/references/pipeline-layers.md`. These define the accuracy standards and evaluation criteria for this audit.

Also read the architecture rules at `${CLAUDE_PLUGIN_ROOT}/skills/architecture-rules/SKILL.md` and the epistemic restraint rules at `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/SKILL.md` — the accuracy audit must respect the four-layer architecture and the product's epistemic principles.

**Important privacy constraint:** Never process, view, or store actual user feed data. All analysis must happen at the system level. Use synthetic or hypothetical examples for testing, never real user data.

Then perform each of the following steps in order:

---

**Step 1 — Find and Map the Pipeline**

Locate every file involved in the scan process:
- The code that sends captured feed data to Google Gemini Flash
- The prompt text or instructions sent with the API call
- The code that receives and parses the response
- The code that maps parsed results to dashboard categories

Search the entire codebase using Grep and Glob. Look for references to Gemini, Google Flash, classification, categorization, scan processing, and the six dashboard tab names.

Create a clear map of the pipeline showing which files are involved and what each one does. Explain this map in plain, non-technical language so a non-developer can understand the flow.

---

**Step 2 — Audit the Prompts**

Review every prompt or instruction sent to Google Flash. Evaluate each prompt for:

- **Clarity** — would a human reading this know exactly what to do?
- **Completeness** — are all six dashboard categories (Overview, Sources, Ads, Politics, Tone, Suggested vs Followed) addressed?
- **Edge case handling** — what happens with: sponsored political content? content in other languages? memes with ambiguous tone? content that fits multiple categories? empty or malformed posts?
- **Consistency** — do the prompt instructions match the category definitions displayed on the dashboard?

Flag every gap or ambiguity found. For each issue, explain in plain language what the problem is and what kind of misclassification it could cause.

---

**Step 3 — Audit the Category Definitions**

For each of the six dashboard tabs, document the current definition of what content belongs in that category (as defined in the prompts and/or code).

Then generate at least 10 hypothetical edge case posts per category that would be difficult to classify. For each edge case, evaluate whether the current definitions handle it clearly. Document which edge cases expose ambiguity.

Organize findings by category, showing: the current definition, the edge cases tested, and which ones revealed problems.

---

**Step 4 — Audit the Response Parsing**

Review the code that processes Google Flash's responses. Check for:

- **Silent failures** — anywhere an error could occur without producing a visible warning
- **Missing error handling** — what happens when the response is malformed, partial, or empty?
- **Format assumptions** — does the code assume a specific response structure? What happens if the structure changes?
- **Field validation** — are expected fields checked before use? What happens if a field is missing or has an unexpected type?
- **Schema mismatches** — does the parsing code expect exactly what the prompt asks Google Flash to produce? Is there any drift?

Flag anywhere data could be lost or misinterpreted. For each issue, explain what could go wrong in plain language.

---

**Step 5 — Audit Determinism**

Check how the Google Flash API is being called. Look at:

- **Temperature settings** — is it set to 0 or the lowest possible value for consistent classification?
- **Structured output configuration** — is JSON mode or structured output enabled?
- **Model version** — is the model version pinned, or does it use "latest" which could change?
- **Retry logic** — if a call fails, does it retry? Could retries produce different results?
- **Seed parameter** — if available, is it being used?

Flag any configurations that could produce different results for the same input. Explain the impact of each finding in plain language.

---

**Step 6 — Audit Data Coverage**

Trace the path of a hypothetical post from extension capture through API processing to dashboard display. At each stage, identify:

1. How many posts enter this stage?
2. How many posts leave this stage?
3. Is there any mechanism to verify the counts match?
4. What happens if a post is dropped at this stage?

Identify every point where a post could be silently dropped, skipped, or miscounted. Flag any gaps in the pipeline where content could disappear without an error.

---

**Step 7 — Recommend Improvements**

Based on everything found in Steps 1–6, produce a prioritized list of accuracy improvements. For each recommendation:

1. **What the problem is** — explain in plain, non-technical language
2. **What could go wrong** — the real-world consequence for users if this isn't fixed
3. **What the fix would involve** — a plain-language description of the solution
4. **Severity** — critical, important, or minor (using the standard severity definitions from the QA Process skill)

Rank recommendations by impact on user-facing accuracy. The most impactful improvements should be listed first.

---

Save the full report as `ACCURACY_AUDIT.md` in the project root directory. Include a summary at the top with:
- Total issues found by severity (critical / important / minor)
- A one-paragraph plain-language summary of the pipeline's current accuracy posture
- The pipeline map from Step 1 as a quick reference
