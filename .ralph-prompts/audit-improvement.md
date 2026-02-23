Improve the automated feed analysis accuracy for [CATEGORY].

Read CLAUDE.md for epistemic restraint standards.

Current State:
- Audit scripts location: [PATH]
- Test data location: [PATH]
- Current accuracy: [X]%

Process:
1. Run existing audit against test data, record baseline scores
2. Analyze failure cases — what is the audit getting wrong?
3. Improve analysis prompts/logic for failing cases
4. Re-run audit, compare before/after
5. Ensure no other categories regressed

Success Criteria:
- Target category reaches [TARGET]% accuracy
- No other category regresses more than 2%
- All analysis text follows epistemic restraint standards
- Results logged to activity.md

When ALL criteria are met, output exactly: <promise>AUDIT_DONE</promise>
