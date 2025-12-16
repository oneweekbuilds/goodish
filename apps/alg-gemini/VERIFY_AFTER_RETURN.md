# Verification Checklist - AlgorithmLens Dashboard

Use this checklist when returning to verify launch-readiness.

---

## Quick Smoke Test

### 1. Dashboard Loads
- [ ] Navigate to `/dashboard`
- [ ] All 5 tabs render without errors
- [ ] Tab labels show: Ads & Influence, Politics & Worldview, Patterns in Your Feed, Creators & Voices, What the Algorithm Thinks

### 2. Primary Cards Visible
- [ ] Each tab has exactly ONE primary card at the top
- [ ] Primary cards are visually emphasized (larger, first position)

### 3. Trust Sentences Display
- [ ] Each tab shows its trust sentence at the top
- [ ] Trust sentences match LAUNCH_DECISIONS.md

---

## Trust Verification

### Qualitative Labels (No Percentages)
- [ ] `politics-leaning`: Shows "Leans left/right/mixed" NOT percentages
- [ ] `patterns-echo-risk`: Shows "High/Moderate/Low concentration" NOT scores
- [ ] `creators-concentration`: Shows qualitative text NOT "X% from top 10"
- [ ] `ads-concentration`: Shows qualitative text NOT percentages

### Thresholds Working
Verify these show "insufficient data" messages when data is thin:
- [ ] Political leaning requires 30+ signals
- [ ] Creator concentration requires 100+ posts
- [ ] Emotional tone requires 50+ posts
- [ ] Topic distribution requires 3+ unique topics
- [ ] Advertiser insights requires 50+ signals AND 3+ categories

### Opt-In Features
- [ ] `politics-leaning` hidden until opt-in toggle is enabled
- [ ] `politics-balance` hidden until opt-in toggle is enabled
- [ ] `politics-blind-spots` hidden until opt-in toggle is enabled

---

## Language Audit

### Check These Specific Strings
- [ ] NO "the algorithm thinks" anywhere
- [ ] NO "advertisers think you like" anywhere
- [ ] NO "manipulation score" or "misinformation" anywhere
- [ ] All actions use "you could" not "you should"

### Card Titles Are Neutral
- [ ] `ads-advertiser-insights` title is "Ad Categories You See Most" (not "What Advertisers Think You Like")
- [ ] `algo-topics-liked` title is "What the Algorithm Shows You Most"

---

## Hidden Views Stay Hidden

Verify these DO NOT render on the dashboard:
- [ ] `ads-trend`
- [ ] `ads-explicit-vs-hidden`
- [ ] `ads-promo-creators`
- [ ] `ads-themes`
- [ ] `politics-repetition`
- [ ] `politics-tone`
- [ ] `politics-trend`
- [ ] `patterns-sentiment-balance`
- [ ] `patterns-discovery`
- [ ] `patterns-rare-content`
- [ ] `patterns-intensity-spikes`
- [ ] `creators-new-vs-familiar`
- [ ] `creators-driving-ads`
- [ ] `creators-driving-politics`
- [ ] `creators-by-topic`
- [ ] `creators-by-tone`
- [ ] `algo-topics-avoided`
- [ ] `algo-products`
- [ ] `algo-political-themes`
- [ ] `algo-emotional-triggers`
- [ ] `algo-uncertain`

---

## Collapsed Views Expand Correctly

- [ ] Click collapsed card expands it
- [ ] Expanded content renders correctly
- [ ] Re-collapsing works

---

## Empty States

### When No Scans
- [ ] Dashboard shows appropriate "run a scan" message
- [ ] No broken UI or errors

### When Insufficient Data
- [ ] Cards show "Not enough data..." messages (not errors)
- [ ] Thresholds are enforced per LAUNCH_DECISIONS.md

---

## Cross-Platform Features

### When User Has 1 Platform
- [ ] `ads-by-platform` shows "Need scans from at least 2 platforms"
- [ ] `politics-by-platform` shows similar message
- [ ] `creators-cross-platform` shows similar message

### When User Has 2+ Platforms
- [ ] Comparison views render correctly
- [ ] Platform names display properly

---

## Code Grep Verification

Run these greps to verify trust changes are in place:

```bash
# PHASE 9 markers should exist in dataHelpers.js
grep -n "PHASE 9" apps/alg-gemini/src/lib/dashboard/dataHelpers.js

# No banned metrics
grep -rn "manipulation" apps/alg-gemini/src/ | grep -v "test"
grep -rn "misinformation" apps/alg-gemini/src/ | grep -v "test"
grep -rn "partisanship" apps/alg-gemini/src/ | grep -v "test"

# Qualitative labels in place
grep -n "qualitativeLabel" apps/alg-gemini/src/lib/dashboard/dataHelpers.js
```

---

## Performance Check

- [ ] Dashboard loads in < 3 seconds with cached scans
- [ ] Tab switching is instant (no full reload)
- [ ] No console errors in browser dev tools

---

## Files Changed Reference

Key files modified in trust/accuracy passes:
- `apps/alg-gemini/src/pages/dashboard/dashboardCatalog.js`
- `apps/alg-gemini/src/lib/dashboard/dataHelpers.js`
- `apps/alg-gemini/src/lib/dashboard/scanAggregator.js`
- `apps/alg-gemini/src/pages/dashboard/DashboardPage.jsx`

---

## Known Limitations

1. **Political classification is keyword-based** - Will miss nuance
2. **Promotional detection is heuristic** - Cannot prove sponsorship
3. **Per-item emotion data not available** - Creator tone view won't work
4. **Cross-platform requires 2+ platforms** - Many users have only one

---

## If Something Breaks

1. Check browser console for errors
2. Check `dataFn` return values in console
3. Verify scan data structure matches expected format
4. Check `scanAggregator.js` for aggregation logic

---

## Sign-Off

- [ ] All checks pass
- [ ] Ready for user testing
- [ ] Document any new issues found

Date: ____________
Reviewer: ____________
