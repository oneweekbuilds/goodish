Audit and align the [TAB_NAME] tab across all three AlgorithmLens platforms.

Read CLAUDE.md for project conventions.

Reference Implementation: Use [website/extension/app] as the source of truth.

Process:
1. Read the reference implementation thoroughly
2. Compare each other platform's version
3. Identify missing features, data fields, or behavior differences
4. Implement changes to match the reference
5. Run tests on each platform after changes

Success Criteria:
- All three platforms display the same data fields and analysis
- No build errors on any platform
- All existing tests pass
- Intentional platform differences documented in PARITY_NOTES.md
- No epistemic restraint violations

If stuck after 10 iterations: Document the specific platform/feature causing issues in activity.md. Skip it and move to the next discrepancy.

When ALL criteria are met, output exactly: <promise>PARITY_DONE</promise>
