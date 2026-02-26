# AlgorithmLens Mobile — Visual Audit V3

**Date:** February 25, 2026
**Recording:** ScreenRecording_02-25-2026 10-27-45_1.MP4 (2 min 37 sec, 157 frames)
**Device:** iPhone (Expo Go)
**Previous audits:** V1 (initial), V2 (38 findings), V3 (this document)

---

## Summary of Progress Since V2

**Fixed from V2:**
- Dashboard tabs now render actual content (V2 showed "This section couldn't load" on all 6 tabs)
- Streak display working ("Streak paused — Scan today to start a new streak")
- Screen Capture mode re-enabled and shows as RECOMMENDED on iOS
- Quick Scan mode working end-to-end (27 posts captured, scan saved successfully)
- Per-tab ErrorBoundary wrapping working (no full-screen crashes)
- Tab switching works with haptic feedback
- InsightHero cards rendering on all tabs
- "How We Measure" and "What this might also mean" collapsible sections working

**Still broken / new issues:** 46 findings below

---

## Severity Definitions

| Severity | Definition |
|----------|-----------|
| **CRITICAL (C)** | Feature completely non-functional, blocks core user journey |
| **HIGH (H)** | Major UX problem or data accuracy issue, significantly degrades experience |
| **MEDIUM (M)** | Visual/aesthetic issue or missing feature that reduces polish |
| **LOW (L)** | Minor cosmetic issue or nice-to-have improvement |

---

## CRITICAL Issues

### C-01: Broadcast / Screen Capture Mode Completely Broken
**Frames:** 107–113
**What happens:** User selects YouTube → Screen Capture → taps "Start Screen Capture" → screen goes gray with "Broadcast not available" message → iOS alert appears: "Couldn't Start Recording — We ran into a problem setting up the recording. Please try again. If this keeps happening, restart the app." → After dismissing alert, shows full explanation: "Screen broadcast requires iOS 12+ and the AlgorithmLens development build. Please ensure you're running the app via a development build (not Expo Go). Use Quick Scan to analyze your feed in the meantime."
**Impact:** The RECOMMENDED scan mode is completely non-functional in Expo Go. This was the #1 user complaint. The app actively recommends a mode that cannot work.
**Root cause:** ReplayKit native module requires a development build with expo-dev-client, not Expo Go.

### C-02: Premium Checkout Completely Broken
**Frames:** 085–090
**What happens:** User taps "Try Free" → Unlock Plus modal appears with pricing (Annual $96/year, Monthly $10/month) → taps the CTA button (which shows a loading spinner with no text) → "Checkout Error: Unable to connect to payment server. Please check your internet connection and try again."
**Impact:** No user can upgrade to Plus. Revenue = $0. All premium features permanently locked for all users.
**Details:** The CTA button appears to be in a perpetual loading state (spinner visible, no "Start 14-day free trial" text) before tapping, suggesting the Stripe connection fails during initialization, not just on purchase attempt.

### C-03: 0% Ad Detection Across ALL Scans
**Frames:** 010, 040, 045, 095, 097, 153
**What happens:** Every single scan in history shows "0% ads" — the 14-post scan, the 5-post scan, the 27-post new scan, and even one Instagram scan shows 5% but two others show 0%. The Ads tab says "No content labeled as sponsored was detected in this scan."
**Impact:** A core value proposition of AlgorithmLens is showing users how much advertising they're exposed to. Systematically returning 0% destroys credibility. The Fox News video at frame 137 is clearly news/political content, and many YouTube Shorts are likely promotional — but nothing is flagged.
**Note:** The scan completion screen (frame 153) also confirms "0% Ads" for the 27-post scan.

### C-04: Political Content Detection Fails Despite Visible Political Content
**Frames:** 052–058, 133, 137
**What happens:** Political tab shows "No political content detected" even though the actual YouTube feed being scanned contains clearly political content including: "Ilhan Omar shouts at Donald Trump as he touts ICE success" (Sky News Australia, frame 133), "JUST IN: More than 70 dead as cartel chaos plagues Mexico" (Fox News, frame 137), and "[North Korea] cannot hide the truth forever" (60 Minutes Australia, frame 143).
**Impact:** Completely undermines the Political tab's credibility. Users see no political content despite scrolling past obviously political videos.
**Additional issue:** The Political tab shows BOTH an "Enable AI analysis in Settings" prompt AND "No political content detected" simultaneously (contradictory UI states — frames 052/058).

---

## HIGH Issues

### H-01: @Unknown Dominates Creator Detection (8 of 14 Posts)
**Frames:** 030, 035
**What happens:** Sources tab shows "@Unknown" as the top creator with 8 of 14 posts (57%). The bar chart shows @Unknown with a 100-width bar dwarfing all other creators. The insight text reads "5 accounts shape 86% of everything you see" but the top account is literally "@Unknown."
**Impact:** Creator/source detection is failing for the majority of posts. This makes the Sources tab useless — users see that most of their feed comes from "nobody" rather than getting meaningful source analysis. The "86% concentration" stat is technically correct but meaningless when the dominant source is a detection failure.

### H-02: Tone Tab Shows "No emotional tone data detected" Despite AI Being Enabled
**Frames:** 062, 065
**What happens:** Tone tab shows the AI consent info card explaining how tone classification works, then below it: "No emotional tone data detected — No posts in this scan contained identifiable emotional tone." The suggestion reads "Try scanning a longer session for a fuller picture."
**Impact:** One of the 6 dashboard tabs is entirely empty. Users who enable AI analysis expect to see tone data. YouTube video titles like "She was LOSING HOPE but this SURPRISE CHANGED EVERYTHING" clearly have emotional tone.

### H-03: Suggested vs. Followed Shows 100% Suggested / 0% Following
**Frames:** 070, 075, 117
**What happens:** Every scan shows "100% of your feed came from accounts you don't follow" with "0 of 14 posts were from accounts you follow." The stacked bar is solid blue with 0% Following.
**Impact:** This is likely a detection issue rather than reality. YouTube's home feed does include subscribed channel content, but the classifier is apparently unable to detect the follow relationship on YouTube. This makes the entire Suggested vs. Followed tab appear broken or the number seems unbelievable.

### H-04: Streak Says "Paused" Instead of Active After Recent Scan
**Frame:** 001
**What happens:** Home screen shows "Streak paused — Scan today to start a new streak" even though the "Last scan" card shows "YouTube · 14h ago." A scan 14 hours ago should count as today or yesterday, potentially maintaining a streak.
**Impact:** Streak gamification is supposed to encourage daily scanning. If a scan from 14 hours ago doesn't register as maintaining the streak, the feature is ineffective.

### H-05: "Unlock trend analysis with Plus" Banner Persistent on Every Tab
**Frames:** 005, 025, 040, 070, 117
**What happens:** Every single dashboard tab shows a blue "Unlock trend analysis with Plus" banner with "Try Free" button at the very top, pushing actual content down. This takes up valuable screen real estate on every tab.
**Impact:** Feels aggressive/spammy. The premium upsell should be present but not dominate every view. On a mobile screen, this banner combined with the tab strip and header means users must scroll past ~200px of non-content before seeing any analysis.

### H-06: CTA Button in Unlock Plus Modal Shows Spinner With No Text
**Frame:** 085, 087
**What happens:** The "Start 14-day free trial" button in the Unlock Plus modal shows only a loading spinner animation — no text label visible. This persists across multiple frames.
**Impact:** Users don't know what the button does. A button with just a spinner and no label looks broken.

### H-07: Quick Scan WebView Lacks Scan Duration Guidance
**Frames:** 125–150
**What happens:** Quick Scan shows "Keep scrolling — 1 more post needed" early on, then counts up posts (4, 6, 10, 13, 15, 17, 20, 26, 27) with a timer. At 0:25 it shows "Great sample!" and "Save scan — great sample!" At 0:27 the scan ends with "Saving your scan..."
**Impact:** 27 seconds of scrolling captured 27 posts but the dashboard still shows 0% ads, no political content, no tone data, and @Unknown for most creators. The scan duration/post count is insufficient to produce meaningful results. There's no minimum scan duration enforced, and users can end up with misleading "your feed is clean" results.
**User's note:** "We need to force user to collect more data so they don't see this. Maybe an initial number of minutes first scan needs to be."

### H-08: Scan History Shows Inconsistent Platform Icons
**Frames:** 095, 097, 100
**What happens:** Scan History shows 5 scans total. The first YouTube entry has a red "T" icon, the second YouTube entry has the proper "YT" icon. Instagram entries show "IG" properly. The icon styling is inconsistent.
**Impact:** Visual inconsistency makes the app feel unpolished. Users may not recognize which platform a scan belongs to at a glance.

### H-09: "Fair sample (aim for 20+)" Messaging Contradicts Scan Completion
**Frame:** 095
**What happens:** Scan history shows "14 posts" with a yellow "Fair sample (aim for 20+)" badge, and another with "5 posts" and red "Low sample (aim for 10+)" badge. But the scan completion screen (frame 153) for 27 posts shows a big green checkmark with "Great sample!"
**Impact:** The sample size thresholds are visible in history but not enforced during scanning. If 14 posts is only "fair," the app should push users to continue scrolling rather than letting them save early.

---

## MEDIUM Issues

### M-01: Dashboard Date Shows Previous Scan, Not Current
**Frames:** 005, 117
**What happens:** When first navigating to Dashboard, it shows "Feb 24, 2026 at 7:49 PM — YouTube (14 posts)" which is the previous scan. After completing a new scan, it updates to "Feb 25, 2026 at 10:30 AM — YouTube (27 posts)."
**Impact:** Initially confusing — user may think they're looking at stale data. Could show a "Viewing your latest scan" indicator or auto-refresh prompt.

### M-02: "Tap for more context" Chevron/Dropdown Styling
**Frames:** 005, 048
**What happens:** The "Tap for more context" button under insight cards uses a small down-chevron. The expandable sections ("What this might also mean," "HOW WE MEASURE") use plain text with a chevron.
**Impact:** The expansion affordance is subtle and easy to miss. Users may not realize there's more content below.

### M-03: Content Types Only Shows 2 Categories (Short 57%, Video 43%)
**Frame:** 010, 015
**What happens:** Overview's Content Types section shows only "Short 57%" and "Video 43%" in a two-tone bar. The website version supports more content types (photos, carousels, text posts, etc.).
**Impact:** YouTube only has Shorts and Videos, so this is technically correct for YouTube scans, but the visualization looks sparse. For Instagram scans, more categories should appear.

### M-04: Sources Tab — Bar Chart Shows @Unknown With 100% Width
**Frame:** 030
**What happens:** The bar chart for Top Creators shows @Unknown with a full-width bar labeled "100" (representing its share) while all other creators show tiny 13% bars.
**Impact:** The chart is dominated by an error state (@Unknown) making it visually useless. The y-axis scale is distorted.

### M-05: Political Tab — Contradictory UI States Shown Simultaneously
**Frames:** 052, 058
**What happens:** The Political tab shows ALL of these at once: (1) "Political content analysis requires AI" info card with "Enable AI analysis in Settings" CTA, (2) "What this might also mean" expandable, (3) "No political content detected" empty state. This despite AI analysis being enabled (visible in Settings at frame 080).
**Impact:** Three contradictory messages confuse the user. If AI is enabled, don't show the "requires AI" card. If there's no data, don't show the methodology section above the empty state.

### M-06: Tone Tab Shows "Enable AI" Card Even Though AI Is Enabled
**Frame:** 062
**What happens:** Similar to M-05, the Tone tab shows the AI consent explanation card even though Settings (frame 080) shows "Enable AI analysis" toggle is ON.
**Impact:** The tab is not properly checking the AI consent state, or the consent check is stale.

### M-07: "Scan" Button Floats Over Dashboard Header
**Frame:** 005, 117
**What happens:** Green "Scan" button in the top-right corner of the Dashboard overlaps with the header text.
**Impact:** Minor visual issue. The button works but the layout feels cramped.

### M-08: No Donut/Pie Chart on Mobile (Website Has Them)
**Frames:** All dashboard frames
**What happens:** The website Overview tab has a 2x2 "Topline Summary" grid with pie-chart-style visualizations. Mobile only uses stacked bars and metric cards.
**Impact:** Mobile dashboard looks less rich/varied than the website. Different chart types help users understand data in different ways.

### M-09: No "Your Feed in Minutes" Calculator (Website Feature)
**What happens:** The website Overview tab has a "Your Feed in Minutes" section with mini calculators showing "Minutes per day seeing ads" and "Minutes per day on political content." This is completely absent from mobile.
**Impact:** This is one of the most compelling features — translating percentages into real time. Missing on mobile.

### M-10: No "Content Patterns Observed" Section (Website Feature)
**What happens:** Website Overview has a 3-column "Content Patterns Observed" grid showing top interests, emotional signal, political exposure level, content style, and source diversity. Not on mobile.
**Impact:** Reduces the depth of Overview insights on mobile.

### M-11: No "Brands and Influencers in Your Feed" Section (Website Feature)
**What happens:** Website Overview has a "Brands and Influencers" section (Plus only). Not on mobile.
**Impact:** Premium feature missing from mobile.

### M-12: No Top Advertisers / Product Types Tables (Website Feature)
**What happens:** Website Ads tab has collapsible detail sections with: Top Advertised Companies table, Top Advertised Product Types table, Unlabeled Promotional Content breakdown, and Tone Split (Selling vs Not Selling). Mobile Ads tab only has the composition bar and a count.
**Impact:** The Ads tab on mobile is extremely thin compared to website — just a bar and a number vs. 5+ detailed sections.

### M-13: No Top Political Source Card (Website Feature)
**What happens:** Website Political tab shows the top political source with handle, post count, and progress bar. Mobile only shows the overall political share percentage.
**Impact:** Less actionable insight on mobile.

### M-14: No Ideological Distribution on Mobile (Without Scrolling Past Empty States)
**Frame:** 052–058
**What happens:** The Political tab has the ideological breakdown (Left/Center/Right stacked bar) in code, but it's hidden behind the "no data" states. Even when data exists, it's gated behind a collapsible section with a ChevronDown.
**Impact:** Key political insight is either missing or buried.

### M-15: No Tone Source Rankings (Website Feature)
**What happens:** Website Tone tab shows "Top 5 Sources by Positive Post Volume" and "Top 5 Sources by Negative Post Volume" with horizontal bar charts. Mobile only shows the overall tone distribution bar.
**Impact:** Mobile Tone tab is significantly thinner than website.

### M-16: No Tone Comparison Charts (Website Feature)
**What happens:** Website Tone tab has "Tone: Political vs Non-Political" and "Tone: Selling vs Not Selling" diverging bar charts. Not on mobile.
**Impact:** Removes cross-dimensional analysis from mobile.

### M-17: No "Are These New Voices?" Creator Novelty Section (Website Feature)
**What happens:** Website Suggested tab has a creator novelty analysis showing overlap between suggested and followed creators. Not on mobile.
**Impact:** Loses a key insight about whether the algorithm introduces genuinely new content.

### M-18: No Commercial Content Comparison in Suggested Tab (Website Feature)
**What happens:** Website Suggested tab compares ad rates in suggested vs. followed content. Not on mobile.
**Impact:** Missing cross-tab insight.

### M-19: No Tone Comparison in Suggested Tab (Website Feature)
**What happens:** Website Suggested tab compares emotional tone between suggested and followed posts. Not on mobile.
**Impact:** Missing cross-tab insight.

### M-20: No "What You Can Do" Action Cards (Website Feature)
**What happens:** Website Suggested tab ends with 3 numbered action cards giving users concrete steps. Not on mobile.
**Impact:** Users don't get actionable recommendations.

### M-21: No "Experiment Suggestions" Card (Website Feature)
**What happens:** Website Overview has an "Experiment Suggestions" card with personalized recommendations. Not on mobile.
**Impact:** Reduces actionability.

### M-22: No "AI-made Content Analysis" (Website Feature)
**What happens:** Website Overview shows "% of images/videos showing AI signs." Not on mobile.
**Impact:** Missing a distinctive feature.

### M-23: No Master Numbers Line (Website Feature)
**What happens:** Website tabs end with a "Master Numbers Line" showing scan count, platform count, post count. Not on mobile.
**Impact:** Minor — less contextual grounding.

### M-24: Platform Bottom Sheet Shows "Select a platform" Gray State
**Frame:** 105
**What happens:** When opening the platform picker without a pre-selected platform, the bottom sheet shows a gray "Select a platform" button that's not tappable until a platform is chosen. No platform is highlighted by default.
**Impact:** Minor friction — could default to the user's most-scanned platform.

---

## LOW Issues

### L-01: Home Screen Greeting Doesn't Use User's Name
**Frame:** 001
**What happens:** Shows "Good morning" without the user's name. Could say "Good morning, Justin."
**Impact:** Feels generic. Personalizing the greeting adds warmth.

### L-02: Feed Score Always Shows 80 "Balanced"
**Frames:** 001, 103, 105, 107, 115
**What happens:** Feed Score shows "80 — Balanced" across every viewing, even after a new scan with different data.
**Impact:** If the score never changes, users will stop trusting it. The scoring algorithm may not be sensitive enough to scan differences.

### L-03: "Daily tip" Card Takes Up Space on Home
**Frame:** 103
**What happens:** Home screen shows a "Daily tip" card with text: "Your scans may show how much of your feed comes from accounts you don't follow — compare across sessions to see if this changes."
**Impact:** Good feature but competes for vertical space with the CTA button and last scan card.

### L-04: Scan History Platform Filter Tabs
**Frame:** 095
**What happens:** History shows "All platforms," "YouTube," "Instagram" filter tabs. These work but the active tab styling (filled blue pill) could be more prominent.
**Impact:** Very minor visual polish.

### L-05: Quick Scan Bottom Panel Overlaps Content
**Frame:** 125
**What happens:** During Quick Scan, the bottom instruction panel ("Good start! Keep scrolling," post counter, timer) overlaps the YouTube feed content. The panel is semi-transparent but still covers video thumbnails.
**Impact:** Users may find it hard to see what they're scrolling past. Consider making the panel more compact or movable.

### L-06: iOS System Notifications Overlap During Scan
**Frames:** 135, 137, 140
**What happens:** Outlook Calendar notification ("MBA 2Y Career Advising Appointment - 30 mins...") drops down and covers the scanning header during the scan session.
**Impact:** Not the app's fault, but the scan header could be positioned to minimize overlap with iOS notification banners.

### L-07: Scan Completion "Loading Dashboard..." Button
**Frame:** 153
**What happens:** After scan completes, the primary CTA shows "Loading Dashboard..." with a spinner. This persists for multiple seconds.
**Impact:** Minor — but could show a progress indicator or auto-navigate once dashboard is ready.

### L-08: "Learn more on algorithmlens.com" Links in Dashboard
**Frames:** 035, 045, 055, 075
**What happens:** Multiple dashboard sections have "Learn more on algorithmlens.com" links. In a mobile app context, these would open a browser.
**Impact:** Consider deep-linking to in-app help instead of external website links, or at minimum opening them in an in-app browser.

---

## Website ↔ Mobile Dashboard Parity Gap Summary

The following table summarizes every feature present on the website dashboard and whether it exists on mobile:

| Feature | Website | Mobile | Gap |
|---------|---------|--------|-----|
| **OVERVIEW** | | | |
| Insight Hero | ✅ | ✅ | — |
| Trends CTA (Plus) | ✅ | ✅ (LockedOverlayCard) | — |
| "Your Feed in Minutes" calculators | ✅ | ❌ | **M-09** |
| 2x2 Topline Summary grid | ✅ | Partial (MetricCards) | **M-08** |
| Content Patterns Observed (3-col) | ✅ | ❌ | **M-10** |
| Brands & Influencers (Plus) | ✅ | ❌ | **M-11** |
| Experiment Suggestions | ✅ | ❌ | **M-21** |
| Feed Summary | ✅ | ❌ | Gap |
| AI-made Content Analysis | ✅ | ❌ | **M-22** |
| How the Feedback Loop Works | ✅ | ❌ | Gap |
| Master Numbers Line | ✅ | ❌ | **M-23** |
| **SOURCES** | | | |
| Insight Hero | ✅ | ✅ | — |
| 3-column summary stats | ✅ | Partial (BigNumber only) | Gap |
| Top Sources Table (Top 5/10) | ✅ | ✅ (BarChart) | Different format |
| Concentration Composition Bar | ✅ | ✅ (BigNumber) | Different format |
| **ADS & PROMOS** | | | |
| Insight Hero | ✅ | ✅ | — |
| 3-column summary stats | ✅ | ❌ | Gap |
| Commercial Composition bar | ✅ | ✅ | — |
| Top Advertised Companies table | ✅ | ❌ | **M-12** |
| Top Product Types table | ✅ | ❌ | **M-12** |
| Unlabeled Promo breakdown | ✅ | ❌ | **M-12** |
| Tone: Selling vs Not Selling | ✅ | ❌ | **M-12** |
| **POLITICAL** | | | |
| Insight Hero | ✅ | ✅ | — |
| Political Share % | ✅ | ✅ | — |
| Top Political Source card | ✅ | ❌ | **M-13** |
| Ideological Distribution bar | ✅ | ✅ (in code, gated) | **M-14** |
| **TONE** | | | |
| Insight Hero | ✅ | ✅ | — |
| Tone Distribution bar | ✅ | ✅ | — |
| Top Sources by Positive Volume | ✅ | ❌ | **M-15** |
| Top Sources by Negative Volume | ✅ | ❌ | **M-15** |
| Tone: Political vs Non-Political | ✅ | ❌ | **M-16** |
| Tone: Selling vs Not Selling | ✅ | ❌ | **M-16** |
| **SUGGESTED VS. FOLLOWED** | | | |
| Insight Hero | ✅ | ✅ | — |
| Overall breakdown bar | ✅ | ✅ | — |
| By-platform breakdown | ✅ | ❌ | Gap |
| Creator Novelty Analysis | ✅ | ❌ | **M-17** |
| Commercial Content Comparison | ✅ | ❌ | **M-18** |
| Tone: Suggested vs Followed | ✅ | ❌ | **M-19** |
| Top Topics comparison | ✅ | ❌ | Gap |
| Content Format Preferences | ✅ | ❌ | Gap |
| "What You Can Do" action cards | ✅ | ❌ | **M-20** |

**Total parity gaps: ~25 missing features/sections**

---

## Scan Accuracy Issues Summary

These are systemic data quality problems that affect multiple tabs:

| Issue | Affected Tabs | Severity |
|-------|--------------|----------|
| 0% ad detection on all scans | Ads, Overview | **CRITICAL (C-03)** |
| No political content despite visible political videos | Political | **CRITICAL (C-04)** |
| @Unknown as dominant creator (57% of posts) | Sources, Overview | **HIGH (H-01)** |
| No emotional tone data despite AI enabled | Tone | **HIGH (H-02)** |
| 100% suggested / 0% following on all scans | Suggested | **HIGH (H-03)** |
| Insufficient scan duration for meaningful results | All tabs | **HIGH (H-07)** |

**Root observation:** The Quick Scan WebView-based approach may be fundamentally limited in what metadata it can extract from YouTube's feed. The classifier sees post titles and thumbnails but may not have access to: sponsorship labels, creator follow status, or sufficient text for political/tone classification. This suggests the scan pipeline itself needs investigation beyond just UI fixes.

---

## Issue Count by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 9 |
| MEDIUM | 24 |
| LOW | 8 |
| **TOTAL** | **45** |

---

## Top Priority Areas (For Implementation Planning)

1. **Broadcast/Screen Capture** — Must work or must be hidden. Currently recommends a broken mode.
2. **Stripe/Premium checkout** — Revenue blocker. Must connect to payment server.
3. **Scan accuracy pipeline** — 0% ads, no political content, no tone data, @Unknown creators. Core product value is undermined.
4. **Minimum scan enforcement** — Force longer scans so tabs have data to show.
5. **Dashboard feature parity** — 25+ sections/charts from website missing on mobile.
6. **AI consent state management** — Political and Tone tabs show "enable AI" even when AI is enabled.
