# AlgorithmLens Critical UI Audit — Apple Standard

**Date:** February 26, 2026
**Standard:** Would this feel at home next to Apple Health, Apple Fitness, or iOS Settings?
**Verdict:** No. Not close. This looks like a competent developer's first app, not a shipping consumer product. Every screen has multiple issues that would immediately signal "indie app" to any user who lives in the Apple ecosystem.

---

## EXECUTIVE SUMMARY

**Overall polish rating: 2.5 / 5** (where 5 = Apple/Instagram quality)

The app is *functional* — it works, the data flows, the scan completes. But "functional" is table stakes. The gap between this and what Apple ships is not a matter of tweaks. It's a systematic failure across typography, spacing, color, component design, information hierarchy, and interaction design. Below is every single issue, organized by severity.

---

## 1. TYPOGRAPHY — Grade: D

Apple's typography is obsessively controlled. Every font size, weight, and line-height exists for a reason. AlgorithmLens treats typography as an afterthought.

### 1.1 Too Many Font Sizes With No Clear System
**Screens:** All dashboard tabs, Home screen
The app uses what appears to be 6-8 different font sizes with no discernible scale. Apple uses a strict type ramp (Title 1/2/3, Headline, Body, Callout, Subhead, Footnote, Caption). AlgorithmLens has sizes that feel arbitrary — the "72" Feed Score number is huge, "Balanced" next to it is medium, the description below is small, and the "Based on source diversity..." caveat is slightly smaller still. That's 4 sizes in one card with no clear hierarchy relationship.

### 1.2 Inconsistent Font Weights
**Screens:** Dashboard Overview, Sources, Ads & Promos
Some section headers are bold ("Key Metrics", "Content Types"), others are semibold ("Your Feed in Minutes"), others appear regular weight ("Content Patterns Observed"). Apple never mixes weights randomly within the same hierarchy level. Pick one weight per hierarchy level and never deviate.

### 1.3 The Blue Insight Cards Use Oversized, Cramped Type
**Screens:** All dashboard tab hero cards
"Your feed draws from many voices (24% from top 5)" — this headline is too large for the card width, causing ugly line breaks. Apple would size this down to fit on 2 lines maximum, or restructure the card to be wider. The current approach makes it look like the text is fighting the container. On the Ads & Promos tab, "No labeled ads appeared in this 62-post scan" breaks across 4 lines, which is visually suffocating.

### 1.4 Body Text Line Length Is Too Wide
**Screens:** All tabs, all explanatory text
Body text runs nearly edge-to-edge within cards. Apple maintains 50-75 characters per line for comfortable reading. Many text blocks in AlgorithmLens hit 80+ characters, making paragraphs feel dense and uninviting.

### 1.5 Section Labels Are Inconsistent
**Screens:** Dashboard
"HOW WE MEASURE" is all-caps, "What this might also mean" is title case, "Key Metrics" is title case, "Content Patterns Observed" is title case, "SOURCE DIVERSITY" is all-caps again. Pick ONE convention. Apple uses consistent casing across all section types.

### 1.6 The "Learn more →" Links Look Dated
**Screens:** Multiple
Blue "Learn more →" links with an arrow feel like 2015 web design, not a 2026 native app. Apple uses subtle, integrated disclosure (chevrons, expandable sections) — never this style.

---

## 2. SPACING & LAYOUT — Grade: D+

### 2.1 No Consistent Spacing Grid
**Screens:** Every screen
There is no evidence of a consistent spacing system. Gaps between cards vary. Padding inside cards varies. The space between a section header and its content varies. Apple uses a strict 4pt/8pt grid. Nothing in AlgorithmLens aligns to a visible rhythm. This is the single biggest contributor to the "indie app" feeling.

### 2.2 Cards Have Inconsistent Internal Padding
**Screens:** Home, Dashboard
The Feed Score card on Home has different internal padding than the "Last scan" card below it. The "Daily tip" card has different padding still. The blue insight cards on Dashboard tabs have tighter padding than the metric cards below them. Every card should use the same internal padding (Apple standard: 16pt all sides).

### 2.3 The Tab Bar (Overview / Sources / Ads & Promos / Political / Tone / Suggested vs. Followed) Is Cramped
**Screens:** Dashboard
Six tabs in a horizontal scrolling pill bar is already questionable — but the pills are too tightly packed, with inconsistent spacing between them. When scrolled, tabs like "Suggested vs. Followed" are cut off. Apple's approach: use a segmented control for 2-5 options, or a full-width scrolling tab bar with generous spacing. The current implementation looks like a prototype.

### 2.4 Horizontal Tab Bar Clips on Scroll
**Screens:** Frames 18-21
When the user scrolls the dashboard tab bar, partial tab labels appear at the edges ("urces", "mos", "cal"). Apple never clips text mid-word at screen edges — there's always a fade gradient or the tabs are sized to avoid this.

### 2.5 The "Your Dashboard" Header + Scan Button Feels Cramped
**Screens:** Dashboard
"Your Dashboard" (large title), the date/platform subtitle, and the green "Scan" button are all packed too tightly. The Scan button sits at the same vertical position as the title, creating a visually heavy top section. Apple would give the title its own breathing room, with the action button below or more clearly separated.

### 2.6 Bottom Tab Bar Icons Are Not Optically Aligned
**Screens:** All
The Home, Dashboard, History, and Settings icons have slightly different visual weights. The Dashboard icon (4 squares) appears heavier than the others. Apple's tab bar icons are meticulously optically balanced — each icon occupies the same visual area regardless of shape.

### 2.7 Excessive Vertical Scrolling Required on Dashboard Tabs
**Screens:** Overview tab
The Overview tab requires scrolling through: hero insight card, "What this might also mean", "HOW WE MEASURE", Key Metrics (3 metric cards), Content Types bar, "Your Feed in Minutes", "Content Patterns Observed", "Ideas to Explore", and the trend analysis upsell. That's 9+ distinct sections on a single tab. Apple would use progressive disclosure (collapsed sections, tap-to-expand) rather than an infinitely scrolling column.

---

## 3. COLOR — Grade: C

### 3.1 The Blue Is Overused and Monotone
**Screens:** All
Almost everything interactive or prominent is the same shade of blue: the "Scan" button, the "Choose a Platform" button, the tab pills, the bar charts, the "Start exploring" button, the insight card backgrounds, the progress indicators. There's no color differentiation between different types of elements. Apple uses color sparingly and precisely — a single accent color for interactive elements, with careful use of secondary colors for data visualization.

### 3.2 The Insight Card Blue-to-White Gradient Feels Cheap
**Screens:** Dashboard tabs
The blue gradient background on insight cards (hero cards at top of each tab) is a simple linear gradient that fades to white. It lacks the sophistication of Apple's gradient treatments, which use subtle radial blends, multiple color stops, and material effects (blur, vibrancy). The current gradient looks like a CSS tutorial example.

### 3.3 Red "Delete Account" Text Is Jarring
**Screen:** Settings
"Delete Account" in red is the iOS convention, but the shade of red used here appears darker/more muted than Apple's system red (#FF3B30). This makes it look like a custom color that's trying to be the system red but isn't.

### 3.4 The Green Score Number Doesn't Belong
**Screens:** Home, Dashboard
The "72" and "73" Feed Score numbers are in green. Green implies "good" — but the app is supposed to be informational, not judgmental (per the epistemic restraint philosophy). The color itself is also not from a cohesive palette — it feels picked independently from the rest of the blue-dominant scheme.

### 3.5 The History Screen Uses Red/Green/Yellow for Sample Quality
**Screen:** Scan History
"Excellent sample" in green, "Low sample" in yellow, "Fair sample" in red-ish/teal — this traffic light pattern is the opposite of the "calm, non-judgmental" design philosophy. Apple Health never color-codes your data as "good" or "bad" — it presents it neutrally with context.

### 3.6 The Scan Progress Overlay Uses Yellow/Orange Accent
**Screens:** Scanning flow (frames 33-68)
The scanning panel uses golden/amber for the bullet point and text, contrasting with the blue used everywhere else. This creates a visual disconnect — it looks like a different app's UI was pasted in.

---

## 4. COMPONENT DESIGN — Grade: C-

### 4.1 Cards Lack Elevation and Depth
**Screens:** Home, Dashboard
The cards are flat white rectangles with very faint (nearly invisible) borders. Apple uses subtle shadows and slight elevation to create depth hierarchy. The current cards blend into the white background, making it hard to distinguish card boundaries at a glance.

### 4.2 The "Choose a Platform to Scan" Button Is Oversized
**Screen:** Home
This is the largest element on the Home screen — a full-width blue button with large text and a bracket icon. It dominates the visual hierarchy, pushing Feed Score and Last Scan into secondary positions. Apple never lets a single CTA overwhelm the primary content. This should be refined to be prominent but not dominant.

### 4.3 The Platform Picker Bottom Sheet Feels Unfinished
**Screen:** Frame 30, 32
The platform selection sheet has: 6 platform icons in a 3x2 grid, a "Screen Capture / COMING SOON" card on the left, a "Quick Scan" card on the right, and a full-width "Start Quick Scan" button at the bottom. Problems: (a) the "COMING SOON" badge is a small green pill that looks out of place, (b) the two cards at the bottom (Screen Capture vs Quick Scan) create a confusing choice — why show an option that doesn't work? (c) YouTube has a red outline suggesting it's selected, but the selection state is unclear. Apple would never show a disabled "coming soon" option in a primary flow.

### 4.4 The "Screen Capture Coming Soon" Modal Is Low Quality
**Screen:** Frame 31
A dark semi-transparent modal with white text in the center. The text is small, dense, and not well-formatted. The "Got it" button is just blue text, not a proper button. Apple modals have clear visual hierarchy, generous padding, and a styled dismiss button.

### 4.5 The Horizontal Bar Charts Are Too Primitive
**Screens:** Sources tab (Top Creators), Overview tab (Content Types, Content Origin)
The bar charts are simple colored rectangles with percentage labels. No rounded corners on bars, no subtle gradients, no animation or transition feel. The "100% / 80% / 40%" bars under Top Creators are just blue rectangles ending at arbitrary points. Apple Health's bar charts have rounded ends, subtle fill gradients, and consistent labeling.

### 4.6 The Stacked Bar (Content Origin: 31% / 69%) Looks Clunky
**Screens:** Suggested vs. Followed tab
The following/suggested bar is a rounded-rectangle split into two sections. The blue (31%) and light gray (69%) sections look like a Bootstrap progress bar from 2018. Apple would use a custom ring chart, a clean donut, or at least give the bar more visual sophistication (subtle shadow, better corner radius handling at the split point).

### 4.7 The "Tap for more context" Button on Insight Cards
**Screens:** All dashboard tabs
A small pill button at the bottom of insight cards. It's functional but feels like a web tooltip trigger, not an iOS native element. Apple would make the entire card tappable, or use a standard "See More" disclosure indicator.

### 4.8 The Metric Cards (Posts Scanned, Ads Detected, Suggested, Top 5 Concentration) Are Too Dense
**Screens:** Overview tab
Four metrics in a 2x2 grid with small emoji icons, numbers, and labels. The emoji icons (lock, chart, group) are inconsistent in style — some are emoji, some appear to be SF Symbols. Apple never mixes emoji with system icons. Use SF Symbols exclusively.

### 4.9 The Upsell/Paywall Cards Look Like Ads
**Screens:** Dashboard (Trend Analysis, Creator Breakdowns)
The "Trend analysis" and "Creator breakdowns" upsell cards with a sparkle icon and "Start exploring / Free for 14 days" look like generic SaaS upgrade prompts. They don't feel native to iOS. Apple's approach to upselling (see Apple One, iCloud+) uses subtle, integrated messaging — not cards that look like web banner ads.

---

## 5. SCAN FLOW — Grade: C+

### 5.1 The Scanning Overlay Panel Is Visually Disconnected
**Screens:** Frames 33-68
During scanning, a bottom panel appears with: status text ("Keep scrolling — building your sample"), post count, timer, and a progress indicator. This panel uses amber/gold text and a different visual language than the rest of the app. It should match the app's blue accent color and card styling.

### 5.2 The Post Counter Pill (Bottom Right During Scan) Changes Color Arbitrarily
**Screens:** Frames 33-68
The pill showing "15 0:14" starts blue, then changes to green at "49 1:00" when the scan completes enough posts. The color transition logic is unclear to the user. Apple uses consistent, predictable color states.

### 5.3 The "Save scan — great sample!" Button Appears Abruptly
**Screen:** Frame 68
The green "Save scan" button appears at the bottom when the sample is sufficient. There's no transition or animation visible — it just appears. Apple would animate this in with a gentle slide-up or fade.

### 5.4 The Scan Complete Screen Is Acceptable but Not Great
**Screen:** Frame 69
A centered checkmark, "Scan Complete", stats (49 Posts, 4% Ads, 100% Suggested), and three action buttons. This is the most Apple-like screen in the app, but the three stat pills at the center use an unusual layout (horizontal row of rounded boxes) that doesn't match any Apple pattern. Apple would likely use a cleaner list or a single summary card.

---

## 6. SCAN HISTORY — Grade: C+

### 6.1 History Cards Are Information-Dense But Not Elegant
**Screen:** Frames 25-26
Each history card shows: platform icon, platform name, time ago, post count, ad %, suggested %, sample quality badge, a mini bar chart, "Followed / Suggested" legend, and "View Results" link. That's 8+ pieces of information per card. Apple presents 2-3 key pieces per list item and lets users tap for details.

### 6.2 Sample Quality Badges Use Web-Style Colored Pills
**Screen:** Frames 25-26
"Excellent sample (50+ posts)" in green, "Fair sample (20+ posts)" in teal, "Low sample (aim for 20+)" in yellow, "Very low sample (aim for 10+)" in orange. These colored pills look like GitHub labels, not iOS components. Apple would use a single, neutral indicator or integrate this into a progress ring.

### 6.3 The Mini Progress Bars in History Cards Are Tiny and Hard to Read
**Screen:** Frames 25-26
Each card has a tiny horizontal bar split into "Followed" and "Suggested" segments. At this size, the colors are nearly indistinguishable. Either make these larger or remove them and show the data differently.

---

## 7. SETTINGS — Grade: C

### 7.1 Settings Screen Looks Like a Web Form, Not iOS Settings
**Screen:** Frame 27
The Settings screen has: section headers in ALL CAPS ("AI ANALYSIS", "SCAN REMINDERS", "DATA & PRIVACY", "ABOUT"), toggle switches, and text descriptions. The overall structure is correct but the execution is off — the section headers should use the system secondary label color, the spacing between sections is inconsistent, and the toggle descriptions are too long (they should be shorter with a "Learn More" option).

### 7.2 The Upgrade Banner at Bottom of Settings Looks Like a Foreign Element
**Screen:** Frame 28
A dark banner with "Upgrade to Plus — track trends over time" and a "Try Free" button floats at the bottom of Settings. It looks bolted on — like a web ad banner, not a native iOS element. Apple integrates subscription prompts into the settings list itself (e.g., "iCloud+" row), not as floating overlay banners.

---

## 8. PAYWALL / SUBSCRIPTION SCREEN — Grade: C+

### 8.1 The Feature List Uses Blue Dots Instead of Checkmarks
**Screen:** Frames 72-78
The "Unlock Plus" sheet lists features with blue dots on the right side. Apple's standard for feature comparison lists uses green checkmarks (and sometimes red X marks for what's not included). Blue dots convey "info" not "included."

### 8.2 The "Free:" Subtext Under Each Feature Is Clever But Cramped
**Screen:** Frames 72-78
Each feature shows what the free tier gets ("Free: Limited charts per tab"). This is good information architecture, but the text is small and gray, making it hard to scan quickly. Apple would give these comparison rows more vertical space.

### 8.3 The Annual/Monthly Toggle Cards Are Reasonable
**Screen:** Frames 72-78
The pricing cards with "SAVE 20%" badge on Annual and a clean Monthly option are competent. The selected state (blue border) is clear. This is one of the better-designed components in the app.

### 8.4 The "Start 14-day free trial" Button Animation
**Screen:** Frames 72-78
The button appears to have a subtle shimmer/loading animation (sparkle icon). This is a nice touch but the button itself is the same omnipresent blue. A distinctive CTA color would help conversion.

---

## 9. HOME SCREEN — Grade: C

### 9.1 "Good morning" Greeting Appears Only Sometimes
**Screens:** Frame 70 shows "Good morning / See what's in your social media feed" while Frame 1/29 show no greeting. This inconsistency feels unfinished. Apple's approach: either always show contextual greetings (like Apple Health's summary) or never.

### 9.2 The "Streak paused" Card
**Screen:** Frame 70
A card showing "Streak paused / Scan today to start a new streak." The icon is a small flame emoji. The streak mechanic is fine but the card design is generic — it doesn't create excitement or motivation. Apple Fitness uses vibrant ring animations for streaks. This looks like a Duolingo feature bolted onto a different app.

### 9.3 The "Daily tip" Card Is Low-Value
**Screens:** Frame 1, 29
"Scanning across multiple platforms can reveal how content composition varies between them." This is generic filler content. Every surface in the app should earn its space. Apple would either show contextually relevant tips based on user behavior or not show tips at all.

---

## 10. INFORMATION ARCHITECTURE — Grade: C-

### 10.1 The Dashboard Has Too Many Tabs
**Screens:** Dashboard
Six tabs: Overview, Sources, Ads & Promos, Political, Tone, Suggested vs. Followed. This is too many. Users have to scroll horizontally to discover half of them. Apple's approach: 3-4 tabs maximum, or use a different navigation pattern (card-based, list-based). The current approach buries important information in tabs users may never discover.

### 10.2 Multiple Tabs Show "Nothing Found" States
**Screens:** Political tab, Tone tab
"Political content wasn't prominent in this scan" and "Emotional tone wasn't prominent in this scan" — two entire tabs showing empty states. If a tab frequently has no content, it shouldn't be a top-level tab. Consider showing these as conditional sections within Overview, only when there's data to display.

### 10.3 The "What this might also mean" and "HOW WE MEASURE" Accordions Are Repetitive
**Screens:** Every dashboard tab
Every single tab has the same two expandable sections: "What this might also mean" and "HOW WE MEASURE." This is good for transparency but creates repetitive UI. Apple would consolidate this into a single "About this analysis" disclosure at the bottom, or use an info button (ⓘ) that opens a sheet.

### 10.4 The "Ideas to Explore" Section at Bottom of Tabs
**Screen:** Frame 24
Suggestions like "Diversify your follows" feel like editorial content shoehorned into a data dashboard. Apple keeps data views focused on data and separates editorial/educational content into dedicated sections or flows.

---

## 11. INTERACTION DESIGN — Grade: D+

### 11.1 No Visible Haptic or Tap Feedback
**Screens:** Throughout
This is a web app running in Safari (the "< Safari" back button is visible). No haptic feedback on taps, no native press states, no spring animations. Apple apps use spring-damped animations for everything. This single factor makes the entire app feel non-native.

### 11.2 It's a Web App, Not a Native App
**Screens:** All — "< Safari" back button visible in status bar
The most fundamental issue: this is a Progressive Web App or mobile website viewed in Safari, not a native iOS app. Apple's HIG assumes native UIKit/SwiftUI components with system behaviors (swipe-to-go-back, native scroll physics, system sheets, haptics). None of that exists here. Every interaction will feel subtly wrong to iOS users.

### 11.3 The Scanning Flow Locks Users in a WebView
**Screens:** Frames 33-68
During scanning, users browse YouTube inside what appears to be a WKWebView. The scanning overlay sits on top of the actual YouTube content. The interaction here is clever, but the overlay panel feels disconnected from the parent app — like two separate UIs stacked on top of each other.

### 11.4 No Pull-to-Refresh on Any Screen
**Screens:** Home, Dashboard, History
iOS users expect pull-to-refresh on list/scroll views. There's no evidence of this behavior in the recording.

---

## 12. CRITICAL DESIGN PATTERNS APPLE USES THAT ARE MISSING

### 12.1 No Large Title Navigation
Apple's large-title navigation pattern (title that shrinks on scroll) is the standard for iOS. The dashboard header ("Your Dashboard") stays static. Implementing this pattern alone would make the app feel 30% more native.

### 12.2 No System Materials (Blur, Vibrancy)
Apple extensively uses blur effects (UIBlurEffect) for overlays, bottom sheets, and backgrounds. AlgorithmLens uses flat colors everywhere. The bottom sheets (platform picker, paywall) have no blur backdrop.

### 12.3 No SF Symbols
The app uses a mix of custom icons and what appear to be emoji. Apple expects SF Symbols for all iconography — they scale correctly, match text weight, support accessibility, and look native.

### 12.4 No System Colors
Apple provides dynamic system colors (systemBackground, secondarySystemBackground, label, secondaryLabel, etc.) that adapt to light/dark mode and accessibility settings. The app appears to use hardcoded colors.

### 12.5 No Contextual Menus or Haptics
Long-press for contextual menus, haptic feedback on toggle changes, and system-standard gesture recognizers are absent.

---

## SUMMARY TABLE

| Area | Grade | Key Issue |
|------|-------|-----------|
| Typography | D | No type scale, inconsistent weights/sizes |
| Spacing & Layout | D+ | No grid system, inconsistent padding |
| Color | C | Monotone blue, gradient quality, judgmental colors |
| Component Design | C- | Flat cards, web-style elements, primitive charts |
| Scan Flow | C+ | Visual disconnect, color inconsistency |
| Scan History | C+ | Information-dense, web-style badges |
| Settings | C | Web form feel, floating upgrade banner |
| Paywall | C+ | Reasonable but needs refinement |
| Home Screen | C | Generic content, inconsistent greeting |
| Information Architecture | C- | Too many tabs, empty states, repetitive sections |
| Interaction Design | D+ | Web app, no haptics, no native behaviors |

---

## THE HARD TRUTH

The single biggest issue is **11.2: It's a web app, not a native app.** Until this is a native SwiftUI/UIKit application, it will never feel like an Apple app, period. The web-to-native gap is not something you can CSS your way out of. Native scroll physics, haptic feedback, spring animations, system sheets, SF Symbols, system colors, large-title navigation — none of these can be replicated in a web view with sufficient fidelity.

If going native isn't possible right now, the second most impactful changes would be:

1. **Establish a strict 4pt spacing grid** and apply it everywhere
2. **Reduce the type scale to 5 sizes** matching Apple's HIG
3. **Reduce dashboard tabs from 6 to 3-4** (merge empty tabs into Overview)
4. **Add depth to cards** with subtle shadows (even in web, box-shadow helps)
5. **Replace all emoji icons with a consistent icon set** (Phosphor, Lucide, or similar)
6. **Kill the floating upgrade banners** and integrate upsells into the content flow
7. **Reduce information density** on every screen by 30-40%

This app has good bones. The data is interesting, the scan flow is clever, the epistemic restraint copy is well-written. But the visual execution is not at a level where a user who uses Apple Health, Oura, or Instagram daily would perceive it as equally polished. It needs a design system, not more features.
