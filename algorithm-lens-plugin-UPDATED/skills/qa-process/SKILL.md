---
name: qa-process
description: >
  This skill should be used when performing "QA", "quality assurance", "testing",
  "audit", "reviewing the codebase", "checking for issues", "documenting bugs",
  "creating a QA report", or preparing for any kind of release milestone on the
  AlgorithmLens project.
version: 0.1.0
---

# QA Process for AlgorithmLens

Quality assurance in AlgorithmLens follows a structured, documented process. Every QA pass produces artifacts that serve as baselines for future work.

## Before Making Changes

1. Document the current state in a markdown file
2. Note any existing issues found during review
3. Identify which layer(s) will be affected (extension, backend, frontend, database)
4. Create a checkpoint commit if the changes are risky

## After Making Changes

1. Document what was changed and why
2. Compare current state against the last documented baseline
3. Tag milestone moments in git history
4. Update any affected QA documentation

## Severity Classification

Organize all findings by severity:

### Critical — Blocks Launch
- Security vulnerabilities (exposed keys, missing auth)
- Payment flow failures (charges fail, subscriptions don't activate)
- Data loss scenarios (snapshots disappear, user data corrupted)
- Complete feature breakage (dashboard won't load, tabs crash)

### Important — Fix Before Beta
- Partial feature breakage (one tab doesn't render correctly)
- Missing error handling on key paths
- UI inconsistencies that confuse users
- Feature gating gaps (premium content visible to free users)
- Missing input validation

### Minor — Can Fix Later
- Visual polish issues (spacing, alignment)
- Non-critical copy improvements
- Performance optimizations
- Edge case handling for unusual inputs
- Documentation gaps

## QA Report Structure

Every QA report should follow this format:

```markdown
# QA Report — [Date]

## Baseline
What was the state before this pass? Reference the previous report if one exists.

## Scope
What was reviewed in this pass?

## Findings

### Critical
[numbered list with file paths and descriptions]

### Important
[numbered list with file paths and descriptions]

### Minor
[numbered list with file paths and descriptions]

## What's Working
[list of features confirmed functional]

## Comparison to Previous Baseline
[what improved, what regressed, what's new]

## Recommended Next Steps
[prioritized action items]
```

## Detailed Reference

For QA checklists organized by feature area, read `references/checklists.md`.
