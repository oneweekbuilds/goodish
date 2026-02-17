# AlgorithmLens Mobile App — Phase 1: Data Access Research

## The Bottom Line (Read This First)

**No social media platform lets a third-party app access what posts their algorithm shows a user.** This is the single most important finding. Every platform deliberately keeps their algorithmic feed proprietary — it's their core competitive advantage, and they've locked it down completely.

This means the "dream scenario" — user opens AlgorithmLens once, grants permission, gets ongoing feed analysis with zero effort — is **not technically possible** through any single approach.

**But there's a realistic path forward.** My recommendation is a hybrid approach that combines the methods that actually work, matching how your existing Chrome extension already operates while adding mobile-native convenience. Details below.

---

## Your Existing Folder Structure

Before anything else, here's where things live:

```
AlgorithmLens_Cowork/
├── src/                    ← React + Vite frontend (dashboard website)
│   ├── components/         ← Reusable UI components
│   │   ├── dashboard/      ← Dashboard-specific (InsightHero, ViewCard, charts)
│   │   ├── ui/             ← Generic UI (Button, Toast, Skeleton)
│   │   └── ...
│   ├── pages/dashboard/tabs/  ← The six tabs (Overview, Sources, Ads, Politics, Tone, SuggestedVsFollowed)
│   ├── lib/theme/tokens.js    ← Design tokens (colors, tints, borders)
│   └── ...
├── backend/                ← Python backend (FastAPI + Supabase)
├── tailwind.config.js      ← Full color palette, typography, spacing
├── package.json            ← React 19, Framer Motion, Lucide icons, Stripe
└── (no extension folder in this repo — extension is likely separate)
```

The `/mobile` folder will be completely separate. I've already created it for this document.

---

## Approach-by-Approach Analysis

### 1. Official Platform APIs

**Verdict: Cannot access feed data. Not useful for AlgorithmLens's core purpose.**

| Platform | Can Access User's Algorithmic Feed? | What IS Available | Cost |
|----------|-------------------------------------|-------------------|------|
| Instagram | No | Your own posts, engagement metrics (business/creator accounts only) | Free (rate-limited) |
| Twitter/X | No | Search, tweet lookup, posting (no "For You" feed) | $200+/month minimum |
| YouTube | Deprecated endpoint only | Channel management, search, upload — home feed endpoint deprecated and not personalized | Free (10K units/day quota) |
| TikTok | No | Your own videos, basic profile — For You Page completely closed | Free |
| Facebook | No (removed 2018) | Page management only — personal News Feed access removed after Cambridge Analytica | Free |
| Reddit | No official endpoint | Subreddit content, user activity — no personalized home feed endpoint | Free for non-commercial |

**Why this matters:** Even if you wanted to pay $5,000/month for Twitter's Pro tier, you still can't get what posts their algorithm showed a specific user. The APIs are designed for *posting and managing content*, not for *seeing what the algorithm serves to readers*.

**One partial exception:** Reddit's API lets you browse subreddit feeds (hot, new, top), and since Reddit's algorithm is less opaque than others, you could approximate what a user sees. But it's still not the actual personalized home feed.

---

### 2. Platform Data Exports (GDPR/CCPA)

**Verdict: Doesn't include feed data. Not useful.**

Every platform lets users download their data, but here's what you actually get:

- **What's included:** Posts you created, messages you sent, accounts you follow, ads you clicked, your profile info
- **What's NOT included:** What posts appeared in your feed, how the algorithm ranked them, what was recommended to you

This is a fundamental gap. GDPR/CCPA require platforms to give you *your* data — but platforms argue the algorithmic feed is *their* product, not *your* data. So the export shows what you *did* but not what you *saw*.

Other problems: exports take hours to days, can't be automated from a mobile app, and can only be requested through each platform's settings page manually.

---

### 3. Accessibility Services (Android Only)

**Verdict: Technically possible, will get your app banned.**

Android's Accessibility Services can read screen content from other apps. An app could theoretically read Instagram's feed by parsing the accessibility tree while a user scrolls.

**Why it won't work in practice:**
- Google's October 2025 policy update explicitly bans using accessibility services for non-accessibility purposes
- Apps caught doing this get removed from the Play Store and the developer account gets terminated
- Google introduced "Advanced Protection Mode" that automatically revokes accessibility permissions from non-accessibility apps
- Not available on iOS at all

---

### 4. VPN/Proxy Traffic Interception

**Verdict: Blocked by SSL certificate pinning. Policy-violating.**

The idea: your app acts as a local VPN, intercepts the API responses that social media apps receive, and analyzes the feed data from the network traffic.

**Why it won't work:**
- Social media apps use SSL certificate pinning — they only trust their own certificates, so a proxy can't decrypt the traffic
- Bypassing certificate pinning requires jailbreaking/rooting the phone (not a consumer product)
- Instagram, TikTok, and others actively update their pinning to defeat bypass attempts
- Both Apple and Google have removed apps that intercept traffic (Luna VPN, Adblock Focus, etc.)

---

### 5. Share Sheet / Intent Integration

**Verdict: Works, but high friction — user must manually share each post.**

When a user hits "Share" on an Instagram post and picks AlgorithmLens, the app receives the post URL and sometimes the caption/image. This is completely legitimate and works on both iOS and Android.

**The problem:** To analyze a feed of 100+ posts, the user would need to manually share each one. That's worse friction than the Chrome extension's start/stop scan approach. It could work as a *supplement* (user shares interesting posts for deeper analysis) but not as the primary data collection method.

**What you get when a user shares:**
- Post URL (always)
- Caption text (sometimes, varies by platform)
- Image/video thumbnail (sometimes)
- Creator handle (embedded in URL)

---

### 6. Screen Capture / OCR

**Verdict: Possible on Android with permission, blocked on iOS. Battery killer.**

**On Android:** An app can request screen capture permission (MediaProjection API) and then use OCR/vision AI to extract feed content. The user must explicitly grant permission each time.

**On iOS:** Apps cannot capture the screen of other apps. Period. Users can screen record manually, but there's no API for an app to do this programmatically.

**Additional problems:**
- Massive battery drain from continuous screen capture + OCR processing
- Poor data quality — OCR misses metadata, can't detect ad labels, can't distinguish suggested vs. followed content
- Users would see a persistent "recording" notification (Android requires this)

---

### 7. Push Notification Monitoring

**Verdict: Minimal data, not useful for feed analysis.**

**Android:** NotificationListenerService can read notifications from other apps ("@user liked your photo," "You have new followers"). But notifications represent a tiny, biased slice of feed activity — most posts a user sees never generate a notification.

**iOS:** Apps cannot read other apps' notifications. Not possible.

---

## The Comparison Matrix

| Approach | Feed Data? | User Friction | iOS? | Android? | App Store Safe? | Data Quality |
|----------|-----------|---------------|------|----------|----------------|-------------|
| Official APIs | No | Low | Yes | Yes | Yes | N/A (no feed data) |
| Data Exports | No | Very High | Yes | Yes | Yes | N/A (no feed data) |
| Accessibility Services | Partial | Medium | No | Yes (banned) | No | Medium |
| VPN/Proxy | Blocked | Low | No | No | No | N/A (SSL pinning) |
| Share Sheet | Partial | Very High | Yes | Yes | Yes | Low-Medium |
| Screen Capture + OCR | Partial | Medium | No | Yes | Risky | Low |
| Push Notifications | No | Low | No | Android only | Risky | Very Low |

---

## My Recommendation: Hybrid Approach

Given that no single method solves the problem, here's what I recommend — a layered strategy that matches your existing product's philosophy while adding mobile convenience.

### Layer 1: In-App Browser (Primary — Works Day One)

**How it works:** AlgorithmLens includes a built-in browser (WebView) where users log into their social media accounts. While they scroll their feed inside this browser, AlgorithmLens captures the page content — exactly like your Chrome extension does, but inside the app itself.

**Why this is the strongest option:**
- It's essentially your Chrome extension reimagined as a mobile experience
- No API access needed — you're reading the web version of the feed, which the user is viewing voluntarily
- Works for all platforms (Instagram web, Twitter/X web, YouTube web, Reddit web, TikTok web)
- Captures the actual algorithmic feed the user sees
- App store compliant — you're just a browser with analytics
- The user is in control (they choose when to browse and what platforms to open)

**User experience:**
1. User opens AlgorithmLens
2. Taps "Scan Instagram" (or any platform)
3. Instagram's mobile website loads in an in-app browser
4. User scrolls their feed normally for 5-10 minutes
5. AlgorithmLens captures and analyzes the content in real-time
6. User taps "Done" and sees their dashboard results

**Friction level:** Moderate — similar to your current Chrome extension, but more convenient because it's one app instead of browser + extension.

### Layer 2: Share Sheet Integration (Supplementary)

**How it works:** Users can share individual posts from native social media apps into AlgorithmLens for deeper analysis. This adds posts to their scan history without needing the in-app browser.

**Best for:** Capturing specific posts the user wants to flag, or adding data between in-app browser sessions.

### Layer 3: Periodic Scan Reminders (Engagement)

**How it works:** The app sends gentle notifications reminding users to do a scan. ("It's been 5 days since your last Instagram scan. Want to check how your feed has changed?")

**Why this helps:** Builds the habit loop and generates the longitudinal data that Plus users pay for.

### Layer 4: Screenshot Import (Optional Power Feature)

**How it works:** Users can import screenshots of their social media feeds. The app uses vision AI to extract post content, creator names, ad labels, etc.

**Best for:** Power users who want to add data from native apps without using the in-app browser. Works on both iOS and Android.

---

## How This Maps to Your Six Dashboard Tabs

| Tab | In-App Browser | Share Sheet | Screenshot Import |
|-----|---------------|------------|-------------------|
| Overview | Full data | Partial (individual posts) | Partial (visible content) |
| Sources | Full (can detect all creators) | Yes (one at a time) | Partial (OCR quality varies) |
| Ads | Full (can detect ad labels in page source) | Limited | Limited (visual detection only) |
| Politics | Full (with AI analysis) | Yes | Limited |
| Tone | Full (with AI analysis) | Yes | Limited |
| Suggested vs. Followed | Full (can detect "Suggested for you" labels) | No (lost in sharing) | Partial (if label visible) |

The in-app browser approach gives you the richest data across all six tabs — it's the only approach that can reliably detect "Suggested for you" labels and ad markers, because those are embedded in the page source.

---

## Tech Stack Recommendation (Preview for Phase 2)

**React Native with Expo** — for these reasons:
- Your website is already React. Components, patterns, and potentially some logic can be shared.
- Expo handles both iOS and Android from one codebase
- Excellent WebView support (critical for Layer 1)
- Most compatible with AI-assisted development (Cursor, Cowork, etc.)
- Large ecosystem and community — easier to find solutions when things break

---

## What I Need From You

Before I start Phase 2 (building the app), I need your decision on:

1. **Does the hybrid approach make sense?** The in-app browser as the primary method mirrors your Chrome extension approach. Are you comfortable with users scrolling their feed inside AlgorithmLens rather than in the native Instagram/TikTok apps?

2. **Which layers do you want in V1?** I'd recommend:
   - Layer 1 (in-app browser) = must have
   - Layer 2 (share sheet) = nice to have
   - Layer 3 (scan reminders) = nice to have
   - Layer 4 (screenshot import) = future feature

3. **React Native (Expo) as the framework?** Or do you have a preference?

4. **Any platforms to prioritize?** Building all six at once is doable, but if you want to focus on 2-3 platforms first for beta, which ones matter most to your users?

---

*This document was created as a Phase 1 checkpoint. No code has been written yet. No files outside `/mobile` have been modified.*
