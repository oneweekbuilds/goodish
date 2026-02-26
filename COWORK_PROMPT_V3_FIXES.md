# AlgorithmLens Mobile — V3 Fix Prompts for Cowork

**Date:** February 25, 2026
**Source:** MOBILE_VISUAL_AUDIT_V3.md (45 findings)
**Instructions:** Execute each prompt in order in a separate Cowork session. Each prompt is self-contained.

---

## PROMPT 1 OF 8: Fix Broadcast / Screen Capture Mode (C-01)

You are working on the AlgorithmLens React Native mobile app located at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
Screen Capture (Broadcast) mode is the RECOMMENDED scan mode on iOS but it completely crashes when used in Expo Go. When the user taps "Start Screen Capture," they see "Broadcast not available" and an iOS alert: "Couldn't Start Recording." The underlying cause is that ReplayKit requires native modules only available in a development build (expo-dev-client), not Expo Go.

### What to Do

**The fix is to make Screen Capture mode ONLY appear when running in a development build, and default to Quick Scan (Precision Mode) in Expo Go.** Do NOT try to make ReplayKit work in Expo Go — that is architecturally impossible.

1. **`src/components/home/ModeToggle.tsx`:**
   - Import `Constants` from `expo-constants`
   - Add detection: `const isExpoGo = Constants.appOwnership === 'expo'`
   - If `isExpoGo` is true AND platform is iOS: hide the Screen Capture option entirely, show only Quick Scan
   - If NOT `isExpoGo` AND platform is iOS: show both options with Screen Capture as RECOMMENDED
   - On Android: always hide Screen Capture (MediaProjection not implemented), show only Quick Scan
   - When Screen Capture is hidden, do NOT show any "preview" or "dev build only" badge — just don't show it at all. The user should only see Quick Scan as if it's the only option.

2. **`src/components/home/PlatformBottomSheet.tsx`:**
   - Import `Constants` from `expo-constants`
   - Add same `isExpoGo` detection
   - Default the scan mode to `'precision'` (Quick Scan) when in Expo Go or on Android
   - Only default to `'broadcast'` when in a development build on iOS

3. **`app/broadcast/[platform].tsx`:**
   - Add a safety guard at the top of the component: if `Constants.appOwnership === 'expo'`, immediately show an Alert saying "This feature requires the AlgorithmLens development build" and navigate back to home using `router.replace('/(tabs)/')`
   - This is a safety net in case the user somehow reaches the broadcast screen despite the UI hiding

### Verification Checklist — Do ALL of These
After making changes:
- [ ] Read back every modified file and confirm the logic is correct
- [ ] Search the entire `mobile/` codebase for any other references to `broadcast`, `Screen Capture`, `ReplayKit`, or `BroadcastPicker` that might also need the Expo Go guard
- [ ] Confirm that `expo-constants` is in package.json dependencies (it should already be)
- [ ] Verify there are no TypeScript errors by checking that all imports resolve
- [ ] Read ModeToggle.tsx one final time end-to-end and trace the logic: "If I'm in Expo Go on iOS, what does the user see?" — the answer must be "Only Quick Scan, no mention of Screen Capture"
- [ ] Read PlatformBottomSheet.tsx one final time and verify: "What scan mode is selected by default in Expo Go?" — the answer must be `'precision'`
- [ ] Read broadcast/[platform].tsx and verify the guard will redirect before any ReplayKit code runs

---

## PROMPT 2 OF 8: Fix Stripe Premium Checkout (C-02, H-06)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
The "Unlock Plus" modal shows pricing but when the user taps the CTA button:
1. The button shows only a loading spinner with NO text label (H-06)
2. After tapping, it shows "Checkout Error: Unable to connect to payment server"
The entire premium upgrade flow is broken — zero users can upgrade.

### What to Do

**Step 1: Find all payment/checkout related files.** Search the entire mobile codebase for files related to Stripe, checkout, subscription, payment, premium, and "Unlock Plus." Read every single one. Key files likely include:
- The Unlock Plus modal component (search for "Unlock Plus" or "UnlockPlus" or "PaywallModal" or "SubscriptionModal")
- `app/checkout/success.tsx` and `app/checkout/cancel.tsx`
- Any API service file that calls a backend checkout endpoint
- Any configuration file with Stripe keys or API URLs

**Step 2: Diagnose the connection failure.** The error "Unable to connect to payment server" means either:
- (a) The API URL for the checkout endpoint is wrong, missing, or pointing to localhost
- (b) The backend endpoint doesn't exist or is not deployed
- (c) There's a network/CORS issue
- (d) The Stripe API key is missing or invalid

Read the code that creates the checkout session. Trace the full flow:
1. User taps CTA → what function is called?
2. That function calls what API endpoint? What URL?
3. Is that URL correct for the current environment?
4. What response does it expect?

**Step 3: Fix the CTA button text.** Find the checkout button component. It should show:
- Default state: "Start 14-day free trial"
- Loading state: "Start 14-day free trial" with a spinner (text should NOT disappear)
- Error state: Show error message with a "Try again" button

The button must NEVER show just a spinner with no text. Fix this regardless of the API issue.

**Step 4: Fix the API connection.** Based on your diagnosis:
- If the API URL is wrong/localhost → update to the correct production URL
- If the API URL uses an environment variable → check that it's properly configured in the Expo config (app.json or app.config.js)
- If the endpoint is missing → document this as a backend blocker that Justin needs to deploy
- Make sure the checkout flow uses `Linking.openURL()` to open Stripe Checkout in the system browser (since in-app WebView won't work well for payment), with deep-link return to `algorithmlens://checkout/success`

**Step 5: Verify the deep-link handlers.**
- Read `app/checkout/success.tsx` — confirm it properly handles the return from Stripe, refreshes subscription status, and navigates back to the app
- Read `app/checkout/cancel.tsx` — confirm it handles cancellation gracefully
- Check `app.json` or `app.config.js` for the URL scheme configuration (`algorithmlens://`)

### Verification Checklist — Do ALL of These
- [ ] Read every payment-related file you found and list them all
- [ ] Trace the full checkout flow from button tap to Stripe redirect and document each step
- [ ] Confirm the CTA button shows text in ALL states (default, loading, error)
- [ ] Read the API URL configuration and confirm it points to a real, deployed endpoint (not localhost)
- [ ] Read `app/checkout/success.tsx` and `cancel.tsx` end-to-end
- [ ] Search for any hardcoded Stripe test keys or localhost URLs that need updating
- [ ] Read the modal component one final time and confirm the user experience: tap → see text + spinner → either redirect to Stripe OR see clear error with retry option
- [ ] If the backend endpoint is missing/undeployed, create a clear TODO comment in the code noting exactly what endpoint needs to exist and what it should return

---

## PROMPT 3 OF 8: Fix Scan Accuracy Pipeline — Creator Detection, Ad Detection, Political, Tone (C-03, C-04, H-01, H-02, H-03)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
The scan pipeline is producing garbage data across ALL tabs:
- **Sources:** "@Unknown" is the #1 creator (8/14 posts = 57%). Creator handles are not being extracted.
- **Ads:** 0% ads detected across EVERY scan in history. Not a single ad ever detected.
- **Political:** "No political content detected" despite the YouTube feed containing Fox News, Sky News Australia covering Trump/ICE, 60 Minutes Australia on North Korea — all obviously political.
- **Tone:** "No emotional tone data detected" despite video titles with clear emotional language.
- **Suggested vs Followed:** 100% suggested / 0% following on every YouTube scan. YouTube does show subscribed content on the home feed.

### What to Do

**This is the most important prompt. Take your time. Read everything carefully.**

**Step 1: Understand the data pipeline end-to-end.** Read these files in order:
1. `src/lib/computeDashboardData.ts` — the complete file, not just the first 30 lines. This computes all dashboard metrics from raw post data. Understand what `RawPost` fields it expects.
2. Find the scanner/capture component that extracts posts from the WebView. This is likely in `app/scanner/[platform].tsx` or a component it uses. Read the ENTIRE file. Understand exactly what data is captured per post.
3. Find any JavaScript injection code that runs inside the WebView to scrape YouTube's DOM. This is the critical piece — it extracts post metadata from the actual YouTube page.
4. Find any API call to Google Gemini/Flash for AI classification. Read the prompt being sent and the response parsing code.

**Step 2: Trace each broken field specifically.**

For **@Unknown creators (H-01):**
- Find where creator handles are extracted from the YouTube DOM
- YouTube Shorts and regular videos display creator names differently. The scraper may only handle one format.
- Check: Is the scraper looking for the right CSS selectors / DOM elements for YouTube's current layout?
- Check: When a creator can't be identified, is it defaulting to "@Unknown" instead of trying harder?
- YouTube Shorts show creator names in a specific overlay format. Regular videos show them below the thumbnail. The scraper needs to handle BOTH.

For **0% ads (C-03):**
- Find where ad/sponsorship detection happens. On YouTube, sponsored content appears as:
  - "Sponsored" label on promoted videos
  - "Ad" badge on pre-roll/mid-roll promoted results
  - "Includes paid promotion" disclosure on creator videos
  - Sponsored product placement cards
- Check: Is the scraper looking for these specific YouTube ad indicators?
- Check: Is the ad classification logic in `computeDashboardData.ts` correctly reading the `isAd` or `isSponsored` field from raw posts?
- Check: If ad detection relies on Gemini AI, is the prompt asking about ads? Is the response being parsed correctly?

For **No political content (C-04):**
- Political classification requires Gemini AI analysis of post text
- Check: Is the Gemini API actually being called during scans?
- Check: Is the AI prompt asking Gemini to classify political content? Read the exact prompt.
- Check: Is the response from Gemini being parsed and stored with the scan data?
- Check: In `computeDashboardData.ts`, how does it read political analysis data? Does it require a specific field from the scan that might be missing?
- Check: The Political tab code in `dashboard.tsx` has an `aiConsent` gate — is the consent state being read correctly?

For **No tone data (H-02):**
- Same pipeline as political — requires Gemini AI
- Check: Is tone classification included in the same Gemini prompt as political, or is it a separate call?
- Check: Is the response parsed into the right format that `computeDashboardData.ts` expects?

For **100% suggested / 0% following (H-03):**
- On YouTube, distinguishing "suggested" from "subscribed" content requires checking for signals like:
  - "Subscriptions" shelf
  - Creator names matching the user's subscription list
  - "Recommended for you" vs content from subscribed channels
- Check: Does the scraper attempt to classify follow status at all?
- Check: Is there a default value of "suggested" being applied when classification fails?

**Step 3: Fix every issue you find.** For each broken field:
- If the DOM scraper is using wrong selectors → update to current YouTube DOM structure
- If fields are missing from the `RawPost` type → add them
- If the Gemini prompt is missing classification categories → add them
- If response parsing is dropping data → fix the parsing
- If default values mask failures (like defaulting to "@Unknown" or "suggested") → add better fallback logic and logging

**Step 4: If the YouTube DOM scraper is the bottleneck,** focus on improving what data it extracts per post. Each post captured from YouTube should ideally include:
- Creator handle/name (from channel name element)
- Video title (from title element)
- Whether it's a Short or regular video
- Any "Sponsored" or "Ad" label visible
- Whether it appears in a "Subscriptions" context or "Recommended" context
- Thumbnail URL (for potential AI analysis)

### Verification Checklist — Do ALL of These
- [ ] Read `computeDashboardData.ts` end-to-end and document every field of `RawPost` it uses
- [ ] Find and read the WebView JavaScript injection code that scrapes YouTube's DOM
- [ ] List every CSS selector or DOM query the scraper uses, and for each one, determine if it matches YouTube's current DOM structure
- [ ] Find and read the Gemini API prompt. Copy the exact prompt text into a comment at the top of the file for easy reference.
- [ ] Find and read the Gemini response parsing code
- [ ] For each of the 5 broken data points (creators, ads, political, tone, suggested), trace the COMPLETE data flow: capture → storage → computation → display
- [ ] After making fixes, re-read every modified file to confirm no syntax errors or logic bugs
- [ ] Search for any hardcoded test data or mock data that might be interfering with real scan results
- [ ] Verify that the Gemini API key is properly configured (check environment variables / app config)
- [ ] Read `computeDashboardData.ts` one final time after all fixes and confirm: "If a scan captures 14 YouTube posts including Fox News and a Sponsored video, will the dashboard show >0% political and >0% ads?" — the answer must be yes

---

## PROMPT 4 OF 8: Enforce Minimum Scan Duration and Sample Size (H-07, H-09)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
Users can complete a scan in under 30 seconds with only 5-14 posts. This leads to dashboards showing "no data" across multiple tabs. The scan completion praises "Great sample!" at 27 posts in 27 seconds, but the resulting dashboard has 0% ads, no political content, no tone data, and @Unknown as the top creator. The existing "Fair sample (aim for 20+)" and "Low sample (aim for 10+)" badges in Scan History are informational only — they don't prevent bad scans.

### What to Do

**Step 1: Find the Quick Scan (WebView scanner) component.** Read the entire file — likely `app/scanner/[platform].tsx` or similar. Understand:
- How the post counter works
- How the timer works
- What triggers scan completion (user taps "Save" or some auto-complete condition)
- Where the "Keep scrolling — X more posts needed" and "Great sample!" messages come from

**Step 2: Implement a minimum scan requirement.** Add these constraints:

**Minimum thresholds:**
- Minimum posts: 20 posts
- Minimum scan duration: 60 seconds (1 minute)
- Both conditions must be met before the user can save

**UI behavior during scanning:**
- Show a progress indicator at the bottom with BOTH requirements:
  - "Posts: 12/20" with a progress bar
  - "Time: 0:38/1:00" with a progress bar
- When BOTH thresholds are met, show: "Great sample! You can save now or keep scrolling for richer insights."
- The "Save scan" button should be DISABLED (grayed out, not tappable) until both thresholds are met
- If the user tries to go back/exit before thresholds: show an Alert: "Your scan doesn't have enough data yet. Scans need at least 20 posts and 1 minute of scrolling for accurate analysis. Keep scrolling?" with "Keep Scanning" (primary) and "Discard & Exit" (destructive) buttons

**Stretch goals (only after core thresholds work):**
- After 20 posts: "Good start! Keep going for better accuracy."
- After 30 posts: "Great sample! Save anytime."
- After 50 posts: "Excellent! This will give you very detailed insights."
- After 2 minutes: "Great session length! Your results will be comprehensive."

**Step 3: Update Scan History sample badges to match.**
- < 10 posts: Red badge "Very low sample"
- 10-19 posts: Orange badge "Low sample (aim for 20+)"
- 20-29 posts: Yellow badge "Fair sample"
- 30-49 posts: Green badge "Good sample"
- 50+ posts: Green badge "Excellent sample"

**Step 4: Also add the threshold to Broadcast mode** in `app/broadcast/[platform].tsx`:
- Same minimum 20 posts / 60 seconds rule
- Same disabled save button until thresholds met
- Same exit warning if user tries to leave early

### Verification Checklist — Do ALL of These
- [ ] Read the scanner component end-to-end before making changes
- [ ] After changes, read the modified file end-to-end and verify: "If a user has 15 posts at 45 seconds, can they save?" — answer must be NO
- [ ] Verify: "If a user has 25 posts at 30 seconds, can they save?" — answer must be NO (time not met)
- [ ] Verify: "If a user has 25 posts at 65 seconds, can they save?" — answer must be YES
- [ ] Check that the back/exit guard works and shows the alert
- [ ] Verify the progress indicators show accurate counts
- [ ] Read Scan History component and confirm badge thresholds are updated
- [ ] Read the broadcast component and confirm same thresholds are applied
- [ ] Search for any other places where scan completion is triggered and ensure thresholds are checked there too
- [ ] Final read of all modified files to catch any bugs

---

## PROMPT 5 OF 8: Fix AI Consent State + Political/Tone Tab Empty States (M-05, M-06, H-02, H-04)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
The Political and Tone tabs show contradictory states simultaneously:
1. An "Enable AI analysis in Settings" info card (suggesting AI is OFF)
2. AND "No political content detected" or "No emotional tone data detected" empty state (suggesting AI IS on and ran but found nothing)
Meanwhile, Settings shows the "Enable AI analysis" toggle IS turned on.

The issue is the AI consent check is either stale, not reading the right value, or the conditional rendering logic is wrong.

### What to Do

**Step 1: Find and read the AI consent state management.** Search for:
- `aiConsent`, `aiEnabled`, `enableAI`, `AI analysis`, `gemini` across the mobile codebase
- Find where the consent toggle in Settings writes the value
- Find where the Political and Tone tabs read the value
- Determine if it's stored in AsyncStorage, React context, Supabase, or somewhere else

**Step 2: Fix the conditional rendering in PoliticsContent and ToneContent** (both inside `app/(tabs)/dashboard.tsx`):

The current logic likely looks something like:
```
if (!aiConsent) show AiConsentCard
// AND
if (noData) show EmptyState
```

It should be:
```
if (!aiConsent) {
  show ONLY AiConsentCard — nothing else
  return early
}
if (aiConsent && noData) {
  show ONLY the "no data" state with helpful suggestion
  return early
}
if (aiConsent && hasData) {
  show the actual charts and insights
}
```

The key fix is **mutual exclusivity** — only ONE state should render at a time, and it should return early so nothing below it renders.

**Step 3: Fix the "Enable AI" card to actually reflect current state.**
- If AI IS enabled in Settings, the Political/Tone tabs should NEVER show "Enable AI analysis in Settings"
- If AI is NOT enabled, show the consent card with a button that either navigates to Settings or enables AI inline
- Make sure the consent state is reactive — if the user enables AI in Settings and comes back to the dashboard, it should update immediately without requiring an app restart

**Step 4: Improve the "no data" empty states.**
When AI IS enabled but there's no political/tone data, the message should be helpful and specific:
- Political: "No political keywords or themes were detected in this scan's [N] posts. Try scanning during peak news hours or scroll through more content for a fuller picture."
- Tone: "Emotional tone classification didn't find clear signals in this scan's [N] posts. Short video titles may not contain enough text for tone analysis. Try scanning longer or on a platform with more text-based posts."

Do NOT show "Try scanning a longer session for a fuller picture" when the scan had enough posts — that's misleading. Only suggest longer scanning if the post count was low.

**Step 5: Also fix the "Unlock trend analysis with Plus" banner (H-05).**
The blue "Unlock trend analysis with Plus / Try Free" banner appears at the very top of EVERY dashboard tab, pushing content down. This is too aggressive.
- Move this banner to the BOTTOM of each tab, after all the content
- OR reduce it to a single subtle line (not a full-width card) at the top
- OR only show it on the Overview tab, not all 6 tabs
Pick whichever approach is easiest to implement, but it must not dominate the top of every tab.

### Verification Checklist — Do ALL of These
- [ ] Read the Settings toggle code and document exactly where AI consent is stored
- [ ] Read PoliticsContent and ToneContent before making changes and document the current conditional logic
- [ ] After fixing, read PoliticsContent and trace: "If aiConsent=true and politicalData is empty, what renders?" — answer must be ONLY the no-data message
- [ ] Trace: "If aiConsent=false, what renders?" — answer must be ONLY the AiConsentCard
- [ ] Trace: "If aiConsent=true and politicalData has results, what renders?" — answer must be the charts/insights with NO consent card and NO empty state
- [ ] Do the same 3 traces for ToneContent
- [ ] Verify the Plus upsell banner is no longer the first thing users see on every tab
- [ ] Read all modified sections one final time for logic errors
- [ ] Search for any other components that check `aiConsent` and verify they follow the same pattern

---

## PROMPT 6 OF 8: Dashboard Feature Parity — Overview, Sources, Ads Tabs (M-08 through M-12, M-21, M-22, M-23)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
The mobile dashboard is missing ~25 sections/charts that exist on the website. This prompt covers the first three tabs: Overview, Sources, and Ads.

### Reference: Website Components
Read the WEBSITE versions of these tabs to understand what needs to be added:
- `src/pages/dashboard/tabs/OverviewTab.jsx` (in the main AlgorithmLens_Cowork directory, NOT mobile)
- `src/pages/dashboard/tabs/SourcesTab.jsx`
- `src/pages/dashboard/tabs/AdsTab.jsx`

### What to Add — Overview Tab

The mobile Overview tab currently has: InsightHero, Posts scanned MetricCard, Ads/Suggested MetricCards, Top 5 concentration, Content Types bar, and a locked Trends card.

Add these MISSING sections (in this order, after existing content):

1. **"Your Feed in Minutes" Section** — Two mini calculators:
   - "Minutes per day seeing ads": Calculate `(adPercentage / 100) * dailyMinutes` where `dailyMinutes` is a configurable assumption (default 45 min/day — this is the average social media usage). Show as a large number with "min/day on ads" subtitle.
   - "Minutes per day on political content": Same calculation with political percentage.
   - If ad% or political% is 0, show "< 1 min/day" instead of "0 min"
   - Add a small info tooltip: "Based on average daily social media usage of 45 minutes"

2. **"Content Patterns Observed" Section** — An expandable card showing:
   - Top interests/topics (from the scan data if available, or skip if not computed)
   - Emotional signal summary (1 line: "Mostly neutral" or "Mix of positive and negative")
   - Source diversity summary (1 line: "Concentrated — top 5 creators make up X%")
   - Use existing data from `computeDashboardData.ts` — don't invent new data fields

3. **"Experiment Suggestions" Card** — A card with 2-3 actionable suggestions based on the scan data:
   - If suggested% > 60%: "Try using chronological feed mode to see more from accounts you follow"
   - If top5Concentration > 70%: "Explore new creators — your feed is heavily concentrated"
   - If adPercent > 20%: "Consider using ad-blocking features on this platform"
   - If adPercent = 0%: "Your scan showed no detected ads — scan longer next time for more complete results"
   - Always include: "Compare results across multiple scans to see patterns"

4. **Master Numbers Line** at the very bottom — a subtle row showing:
   - "Scan #X" (the scan number in their history)
   - Platform name
   - Post count
   - Date
   - Light gray text, small font

### What to Add — Sources Tab

The mobile Sources tab currently has: InsightHero, BarChart of top creators, BigNumber for concentration, and locked Creator Breakdowns card.

Add:

1. **3-column summary stat cards** at the top (before the bar chart):
   - Top 5 Concentration: "X%" with label "of posts from top 5"
   - Top Source: "@handle" with label "most frequent"
   - Total Sources: "X" with label "unique creators"

2. **Concentration Composition Bar** — A horizontal stacked bar showing:
   - Top 5 concentration %
   - Top 6-10 concentration % (if available)
   - Others %
   - Use the existing `StackedBar100` component with appropriate colors

### What to Add — Ads Tab

The mobile Ads tab currently has: InsightHero, StackedBar100 (non-sponsored vs sponsored), a count, and locked Ad Trends card. This is the THINNEST tab compared to website.

Add:

1. **3-column summary stat cards** at the top:
   - Ad Posts: "X" with "Y% of posts"
   - Top Advertiser: "@name" (if any ads detected)
   - Unlabeled Promos: "X%" (if this data exists in computeDashboardData)

2. **"Top Advertised Companies" section** (collapsible) — a simple list showing advertisers detected in the scan. If no ads were detected, skip this section entirely (don't show an empty table).

3. **"Ad Detection Note" card** when 0% ads — Instead of just "No content labeled as sponsored was detected," show a more informative card:
   - "We look for platform-provided ad labels (like 'Sponsored' or 'Ad' badges). Some promotional content doesn't carry visible labels."
   - "Native advertising, influencer partnerships, and product placements may not have standard ad markers."
   - "Scan longer and scroll through more content — ads may appear at different points in your feed."

### Implementation Notes
- Use EXISTING visualization components (`MetricCard`, `StackedBar100`, `BigNumber`, `SectionHeader`, `BarChart`) — do NOT create new chart components
- Pull all data from `computeDashboardData.ts` — if a field doesn't exist, add it there first
- Follow the existing visual style: white cards with subtle shadows, blue accent color, `SPACING` and `TYPOGRAPHY` constants
- Every new section should be wrapped in a `View` with consistent `marginBottom: SPACING.lg`

### Verification Checklist — Do ALL of These
- [ ] Read the website OverviewTab.jsx, SourcesTab.jsx, and AdsTab.jsx first to understand what you're replicating
- [ ] Read the current mobile dashboard.tsx Overview, Sources, and Ads sections before making changes
- [ ] Read computeDashboardData.ts and confirm every data field you need is available (add any missing fields)
- [ ] After implementing, read the entire OverviewContent function and verify every new section renders correctly
- [ ] Read the entire SourcesContent function and verify the new stat cards appear above the bar chart
- [ ] Read the entire AdsContent function and verify the new sections appear in the right order
- [ ] Verify that all new sections use existing components (MetricCard, BigNumber, SectionHeader, StackedBar100) — NO new component files should be needed
- [ ] Check that the "Your Feed in Minutes" calculation is mathematically correct: `(percentage / 100) * 45` minutes
- [ ] Verify that "Experiment Suggestions" conditionals match the data field names in computeDashboardData.ts
- [ ] Read all modified code one final time for rendering issues, missing imports, or style inconsistencies
- [ ] Ensure no new TypeScript warnings or errors from added code

---

## PROMPT 7 OF 8: Dashboard Feature Parity — Political, Tone, Suggested Tabs (M-13 through M-20)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
The Political, Tone, and Suggested vs. Followed tabs are much thinner than their website counterparts, missing key charts and cross-dimensional analysis.

### Reference: Website Components
Read the WEBSITE versions first:
- `src/pages/dashboard/tabs/PoliticsTab.jsx`
- `src/pages/dashboard/tabs/ToneTab.jsx`
- `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`

### What to Add — Political Tab

Currently has: InsightHero, AI consent gate, Political Share BigNumber, collapsible Ideological Distribution, locked Trends card.

Add:

1. **Top Political Source Card** — After the Political Share BigNumber:
   - Show the @handle of the source with the most political posts
   - Show: "X of Y political posts" and a percentage
   - Show a small horizontal progress bar for visual weight
   - Pull from `computeDashboardData.ts` — add a `topPoliticalSource` field if it doesn't exist

2. **Political Summary sentence** — Between the BigNumber and Ideological Distribution:
   - Auto-generated based on data: "Political content made up X% of your feed, mostly from @handle. The ideological distribution leaned [left/center/right]."
   - Use hedging language per epistemic restraint rules: "Based on keyword and AI analysis, your feed appeared to contain..."

### What to Add — Tone Tab

Currently has: InsightHero, AI consent gate, StackedBar100 (Positive/Neutral/Negative), MetricCard summary, locked Rare Content card.

Add:

1. **Top Sources by Tone** — Two small sections:
   - "Most positive sources": Top 3 creators with most positive posts (list with @handle and count)
   - "Most negative sources": Top 3 creators with most negative posts (list with @handle and count)
   - Use simple text lists, not full BarCharts — keep it compact on mobile
   - Pull from `computeDashboardData.ts` — add `topPositiveSources` and `topNegativeSources` fields if needed

2. **Tone Comparison: Suggested vs Followed** — A simple side-by-side view:
   - "Tone of suggested content": Mini stacked bar (Pos/Neu/Neg %)
   - "Tone of followed content": Mini stacked bar (Pos/Neu/Neg %)
   - Only show this section if both suggested and followed posts exist AND tone data exists
   - Add this data cross-reference to `computeDashboardData.ts` if it doesn't exist

### What to Add — Suggested vs. Followed Tab

Currently has: InsightHero, StackedBar100 (Following/Suggested), MetricCard with contextual interpretation.

Add:

1. **"Are These New Voices?" Section** — Creator novelty analysis:
   - Large BigNumber: "X% of suggested posts are from creators you don't follow"
   - Three stat cards in a row:
     - Total suggested creators
     - Overlap (creators appearing in both suggested and followed)
     - Total followed creators
   - If this data isn't computed, add it to `computeDashboardData.ts`
   - If the data can't be reliably computed (because follow status detection is broken — see H-03), show this section but with a note: "Follow detection is limited on some platforms. These numbers are approximate."

2. **"What You Can Do" Action Cards** — 3 numbered cards at the bottom:
   - "1. Follow more diverse accounts" with brief explanation
   - "2. Use chronological feeds when available" with brief explanation
   - "3. Engage with content you value" with brief explanation
   - Style: numbered circles (1, 2, 3) in blue, with bold title and light description text
   - These are static content — no data needed

3. **Master Numbers Line** — Same as Overview (Scan #, platform, post count, date)

### Implementation Notes
- All cross-tab data (like "tone of suggested vs followed") should be computed in `computeDashboardData.ts`, not in the rendering components
- Use existing components wherever possible
- If a data field requires information that the scan pipeline doesn't currently capture (like creator overlap), add the field to `computeDashboardData.ts` with a `null` default and only render the section when the data is available
- Follow epistemic restraint: all new insight text must use hedging language ("appeared to," "based on observable signals," "may suggest")

### Verification Checklist — Do ALL of These
- [ ] Read website PoliticsTab.jsx, ToneTab.jsx, SuggestedVsFollowedTab.jsx first
- [ ] Read current mobile PoliticsContent, ToneContent, SuggestedContent before changes
- [ ] Read computeDashboardData.ts and list every new field you need to add
- [ ] After implementing, read PoliticsContent end-to-end and verify: Top Political Source card appears after BigNumber
- [ ] Read ToneContent end-to-end and verify: Top Sources by Tone appears after the main bar
- [ ] Read SuggestedContent end-to-end and verify: "Are These New Voices?" and "What You Can Do" appear in order
- [ ] Verify all new insight text uses hedging language (no "the algorithm wants," no absolute claims)
- [ ] Check that all conditional sections handle null/empty data gracefully (don't render if data unavailable)
- [ ] Read computeDashboardData.ts after all additions and verify no circular dependencies or computation errors
- [ ] Read all modified code one final time — check imports, style constants, and component props
- [ ] Verify the "What You Can Do" cards render with proper numbering and styling

---

## PROMPT 8 OF 8: UI Polish, Streak Fix, and Remaining Issues (H-04, H-08, L-01, L-02, L-05, L-07, L-08, M-01, M-02, M-07, M-24)

You are working on the AlgorithmLens React Native mobile app at `C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile`.

### Problem
Various UI polish issues and minor bugs that affect the overall feel of the app.

### Fixes to Make

**1. Streak Logic Fix (H-04):**
Find the streak calculation logic (likely in the home screen component or a hook). The issue: a scan completed 14 hours ago shows "Streak paused — Scan today to start a new streak" instead of counting as maintaining the streak.
- A scan should count toward "today" if it was completed within the last 24 hours OR if it was completed on the current calendar date
- The streak should show: "1-day streak! Scan again tomorrow to continue." when the user has scanned today
- "Streak paused" should only appear if the last scan was >24 hours ago AND on a previous calendar date
- Read the streak logic, fix the date comparison, and verify with edge cases:
  - Scan at 11pm → check at 8am next morning = still active (within 24h)
  - Scan 2 days ago = paused
  - No scans ever = "Start your first streak!"

**2. Scan History Platform Icons (H-08):**
Find the Scan History component (likely `app/(tabs)/history.tsx`). The issue: YouTube entries show different icons — one has a red "T" and another has "YT."
- Make ALL YouTube entries use a consistent icon (the official YouTube "YT" icon or the play button icon)
- Make ALL Instagram entries use the consistent "IG" icon
- Check all 6 supported platforms (Instagram, YouTube, TikTok, X, Facebook, Reddit) have consistent icons

**3. Personalized Greeting (L-01):**
Find the home screen greeting. Currently shows "Good morning" without the user's name.
- Pull the user's name from the auth context/profile: `const { user } = useAuth()`
- Show "Good morning, [firstName]" (just the first name, not full name)
- If no name available, fall back to just "Good morning"
- Adjust greeting for time of day: Good morning (5am-12pm), Good afternoon (12pm-5pm), Good evening (5pm-9pm), Good night (9pm-5am)

**4. Feed Score Staleness (L-02):**
The Feed Score always shows "80 — Balanced." Find where this score is computed.
- If it's hardcoded, make it dynamic based on actual scan data
- The score should factor in: source diversity (lower concentration = higher score), ad percentage (lower = higher), suggested vs followed ratio (more following = higher), and variety of content types
- If the scoring algorithm exists but is returning a static value, fix the computation
- If there's no scoring algorithm, add a simple one: start at 100, subtract points for high concentration, high ads, high suggested ratio, etc.

**5. Scan Button Overlap (M-07):**
The green "Scan" button in the Dashboard header overlaps with text. Find the Dashboard header layout.
- Add proper spacing/padding so the "Scan" button doesn't overlap with "Your Dashboard" or the date text
- Consider reducing the button size slightly or moving it to align with the header row properly

**6. "Loading Dashboard..." Button After Scan (L-07):**
Find the scan completion screen. After "Saving your scan..." the CTA shows "Loading Dashboard..." with a spinner.
- Add a timeout: if dashboard doesn't load within 5 seconds, show "View Dashboard" as a regular button (no spinner)
- The button should be tappable even while loading — navigate to dashboard and let it load there

**7. "Learn more on algorithmlens.com" Links (L-08):**
Search for all instances of "algorithmlens.com" links in dashboard content.
- Replace external browser links with in-app behavior: use `Linking.openURL()` which will open in the system browser (acceptable for now)
- Add the link text as "Learn more →" instead of showing the full URL
- Long-term: these should link to in-app help screens, but for now external is fine

**8. Platform Picker Default (M-24):**
The platform picker shows no platform selected by default.
- Default to the user's most recently scanned platform
- If no scan history, default to the first platform (Instagram)
- The default should be visually selected (highlighted) when the picker opens

**9. Quick Scan Bottom Panel (L-05):**
The scanning instruction panel during Quick Scan overlaps YouTube content.
- Make the panel more compact: reduce vertical padding
- Use a slightly more opaque background so text is readable over any content
- Consider making the panel collapsible (tap to minimize to just the post counter and timer)

### Verification Checklist — Do ALL of These
- [ ] Read and fix streak logic. Trace: "Last scan was 14 hours ago. Is streak active?" — answer must be YES
- [ ] Read Scan History and verify ALL platforms use consistent icon styling
- [ ] Read home screen and verify greeting uses the user's first name and adjusts for time of day
- [ ] Read Feed Score computation and verify it produces different values for different scan data
- [ ] Read Dashboard header layout and verify Scan button has proper spacing
- [ ] Read scan completion screen and verify the Loading button has a timeout fallback
- [ ] Search for all "algorithmlens.com" links and verify they use "Learn more →" text
- [ ] Read platform picker and verify it defaults to the most recent platform
- [ ] Read Quick Scan bottom panel styling and verify reduced padding
- [ ] Do a final search for any remaining TODO comments, hardcoded test values, or placeholder text across the entire mobile codebase
- [ ] Read every single modified file one final time top to bottom — confirm no broken imports, no syntax errors, no missing closing braces
- [ ] Final check: are there any console.log or console.warn statements that should be removed for production?
