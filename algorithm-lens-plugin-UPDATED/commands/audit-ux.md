---
description: Review dashboard UI against design philosophy
allowed-tools: Read, Grep, Glob, Write, Task
---

Perform a comprehensive UX audit of the AlgorithmLens dashboard against the project's design philosophy.

First, read the UI/UX philosophy skill at `${CLAUDE_PLUGIN_ROOT}/skills/ui-ux-philosophy/SKILL.md` and the design patterns reference at `${CLAUDE_PLUGIN_ROOT}/skills/ui-ux-philosophy/references/design-patterns.md`. These define the standards for this audit.

Also read the epistemic restraint skill at `${CLAUDE_PLUGIN_ROOT}/skills/epistemic-restraint/SKILL.md` since microcopy review requires both UX and epistemic compliance.

Then review every screen, component, and layout in the dashboard. Examine React components, CSS/styling files, and any design-related configuration.

Organize findings into these seven categories:

**1. Visual Hierarchy**
- Is there a clear headline insight at the top of each tab?
- Is the most important number the largest and most prominent element?
- Is supporting data visually secondary (smaller, lighter)?
- Are there any "walls of numbers" where everything has equal visual weight?
- Can a user absorb the main takeaway in under 3 seconds?

**2. Progressive Disclosure**
- Does each tab lead with a clear takeaway before showing detail?
- Is detailed information available but not forced on the user?
- Are expandable sections used appropriately for deeper data?
- Is the information architecture shallow-to-deep rather than all-at-once?

**3. Color and Tone**
- Are any colors alarming, aggressive, or visually judgmental?
- Is the palette muted and sophisticated?
- Are bright reds, warning yellows, or neon colors used anywhere?
- Does color communicate structure and category, not urgency or danger?
- Do any color choices subtly imply moral judgment about the data?

**4. Typography and Spacing**
- Is there a clear type hierarchy (headline → section → body → caption)?
- Is anything cramped, cluttered, or inconsistently sized?
- Is white space used generously as a design feature?
- Are font sizes readable (minimum 14px for body text)?

**5. Charts and Data Visualization**
- Are all charts simple and immediately readable?
- Does every chart have a plain-language label?
- Can each chart be understood without reading a legend first?
- Are chart types appropriate (bar, donut, line) vs. overly complex?
- Are axis labels and data points clear?

**6. Microcopy**
- Does all text feel human, calm, and helpful?
- Are tooltips present where methodology needs explanation?
- Do tooltips acknowledge categorization limitations?
- Are empty states encouraging rather than error-like?
- Is button text clear and action-oriented?
- Does any text violate epistemic restraint standards?

**7. Accessibility**
- Are there sufficient color contrast ratios (WCAG AA)?
- Is color used as the sole indicator of meaning anywhere?
- Are font sizes readable?
- Do interactive elements have visible focus states?
- Would the dashboard be usable by someone who is color-blind?

For each issue found, provide:
1. **Component or file** where the issue exists
2. **What the current state looks like** — describe what you observe
3. **Why it falls short** — explain in plain language which design standard it misses
4. **What should change** — describe the specific improvement needed

Save the results as `UX_AUDIT.md` in the project root directory. Include a summary count of findings by category at the top.
