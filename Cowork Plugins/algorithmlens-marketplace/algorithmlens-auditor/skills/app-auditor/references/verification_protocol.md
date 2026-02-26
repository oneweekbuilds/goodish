# Verification Protocol Reference

This document provides detailed guidance for the adversarial verification pass.
Read this before performing any verification audit (Phase 5).

## The Adversarial Mindset

When verifying fixes, you are NOT confirming that things work. You are TRYING
TO FIND ways they don't work. This is a critical distinction.

Think of yourself as a QA engineer whose bonus depends on finding bugs, not
on signing off on releases.

### Common Verification Failures to Watch For

1. **The "Different Screen" Trap**
   - The recording shows a screen that LOOKS like the affected area but isn't
   - Example: A feed analysis screen that shows correct data, but it's a
     different feed than the one that was broken

2. **The "Happy Path Only" Trap**
   - The fix works for the main flow but breaks edge cases
   - Example: Subscription button works on first tap but infinite-spins on
     second tap after canceling

3. **The "Timing" Trap**
   - The issue is intermittent and just doesn't appear in this recording
   - If an issue was reported as intermittent, one clean recording is NOT
     enough to mark it VERIFIED. Note this explicitly.

4. **The "Cosmetic Fix" Trap**
   - Something visually changed but the underlying issue remains
   - Example: An error message was hidden but the API call still fails

5. **The "Wrong Metric" Trap**
   - For accuracy issues, the displayed number changed but to a different
     wrong value, not the correct one
   - Always check against the expected_state in pass/fail criteria

## Per-Category Verification Checklists

### UI/Visual (UI-xxx)

For each UI issue being verified:
- [ ] Find the exact screen/component in the new recording
- [ ] Compare against the expected_state in pass/fail criteria
- [ ] Check in BOTH portrait and landscape if applicable
- [ ] Check that the fix didn't break adjacent UI elements
- [ ] Look for the issue at different scroll positions
- [ ] Check text truncation at different content lengths

### Accuracy (ACC-xxx)

For each accuracy issue being verified:
- [ ] Find the screen showing the relevant metric/score
- [ ] Compare the displayed value against expected_state
- [ ] Check if the data source is real or placeholder
- [ ] Look for "lorem ipsum", "test", "sample" or zeros that suggest mock data
- [ ] Verify units, labels, and formatting are correct
- [ ] Check multiple instances if the metric appears in multiple places

### Functionality (FUNC-xxx)

For each functionality issue being verified:
- [ ] Find the interaction in the recording (the tap/swipe/gesture)
- [ ] Verify the RESPONSE to the interaction, not just that it was tapped
- [ ] Check for error states, loading states, empty states
- [ ] Verify navigation leads to the correct destination
- [ ] Check that data persists after navigating away and back
- [ ] Look for race conditions (rapid taps, simultaneous actions)

### Performance (PERF-xxx)

For each performance issue being verified:
- [ ] Time the relevant operation by counting frames (at 1fps, each frame ≈ 1s)
- [ ] Compare against the threshold in pass/fail criteria
- [ ] Check for jank/stuttering in transitions (uneven frame spacing)
- [ ] Look for loading indicators that persist too long
- [ ] Check if the fix just added a loading spinner (masking, not fixing)

### Live Broadcast (LIVE-xxx)

The live broadcast feature is the highest-risk area. Verification requires:
- [ ] The feature is VISIBLE and ACCESSIBLE in the UI
- [ ] Tapping it navigates to a real screen (not error, not blank)
- [ ] The permission request flow works (camera/screen recording access)
- [ ] Connection to social media app functions
- [ ] Data flows back to AlgorithmLens from the broadcast
- [ ] The broadcast can be started AND stopped cleanly
- [ ] Returning to the main app after broadcast works

Given this feature was entirely missing, partial verification is acceptable
but must be clearly noted: "LIVE-001: VERIFIED - Feature now accessible and
opens correctly. Note: Could not verify actual broadcast functionality from
recording alone."

### Subscription (SUB-xxx)

For subscription flow verification:
- [ ] The upgrade/subscribe button is visible and tappable
- [ ] Tapping leads to a real payment screen (not error, not spinner)
- [ ] Price information is displayed correctly
- [ ] The payment flow progresses (even if we can't complete a real purchase)
- [ ] Cancel/back navigation works from the payment screen
- [ ] Subscription status displays correctly after flow

## Evidence Documentation

When marking an issue as VERIFIED or FIX_FAILED, document:

```json
{
  "verification_recording": "recording-N",
  "relevant_frames": ["frame_0045.png", "frame_0046.png"],
  "observation": "What exactly is visible in these frames",
  "criteria_met": true,
  "criteria_check": "How each element of pass/fail criteria was evaluated",
  "caveats": "Any limitations of this verification (e.g., couldn't test edge case X)"
}
```

## The 100% Rule

Never report completion higher than what's objectively true.

Wrong: "Almost all issues are resolved, with just a few minor items remaining"
Right: "31 of 46 issues verified (67.4%). 8 fix_failed, 4 open, 3 regressed."

Numbers. Always numbers.
