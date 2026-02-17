# AlgorithmLens UI/UX Audit — Checkpoint Document

**Date:** February 17, 2026
**Scope:** Full site audit at http://localhost:5173 (non-coming-soon mode)
**Goal:** Maximize engagement, professional feel, and conversion

---

## Critical Issues (Blocks Conversion or Core Experience)

### C1 — Plus Page Hero Is Invisible

**What's happening:** When you visit the /plus page, the entire hero section (title, subtitle, CTA button, social proof) appears as a blank white area. The text and buttons exist in the code but are invisible on screen.

**Why it matters:** This is the primary conversion page. If visitors can't see the pitch or the "Start your free trial" button, conversion is zero.

**Root cause:** Every element on the Plus page uses framer-motion `whileInView` animations that start at `opacity: 0`. The IntersectionObserver that's supposed to trigger the fade-in isn't firing reliably, so everything stays transparent. The homepage hero works fine because it uses `animate` (fires immediately) instead of `whileInView`.

**Proposed fix:** Change the hero section elements from `whileInView` to `animate` so they appear immediately on page load. Keep `whileInView` for sections further down the page where scroll-triggered animation makes sense.

**File:** `src/pages/plus/PlusPage.jsx`

---

### C2 — Plus Page "Free vs. Plus" Comparison Table Is Empty

**What's happening:** The "Free vs. Plus" section heading appears (faintly), but the two comparison cards below it are completely invisible — just a huge blank space.

**Why it matters:** This is the key conversion element. Users need to see exactly what they get with Free vs. Plus to make a purchase decision.

**Root cause:** Same framer-motion `whileInView` issue as C1. The comparison cards use `stagger(0.1)` and `stagger(0.2)` which inherit the `whileInView` behavior.

**Proposed fix:** Same approach — use `animate` for this section since it's critical conversion content.

**File:** `src/pages/plus/PlusPage.jsx`

---

### C3 — Scan Upload Fails (No Backend Running)

**What's happening:** Clicking "Upload & Analyze" on the scan page fails because the upload endpoint (`http://127.0.0.1:8000/api/scan/upload`) isn't reachable.

**Why it matters:** Without working uploads, you can't test the full dashboard experience with real data, and any beta tester running locally would hit this wall.

**Root cause:** The Vite dev server only serves the frontend. The Python/FastAPI backend (which handles video upload, OCR processing, and Gemini classification) isn't running. The frontend correctly defaults to `http://127.0.0.1:8000` in dev mode, but there's no backend there.

**What's needed to fix:** Start the Python backend server. This requires:
1. The backend dependencies installed (`pip install -r requirements.txt` or similar)
2. Environment variables set (Gemini API key, Supabase credentials, etc.)
3. Running `uvicorn` or the backend start command

**Note:** This is an infrastructure issue, not a code bug. The upload code itself looks correct. Without the API keys and backend config, I can't start the backend in this Cowork session. If you can share backend startup instructions and required env vars, I can attempt it.

---

## High-Priority UX Issues (Engagement & Polish)

### H1 — "Categories" Section Should Show Algorithmic Inferences

**What's happening:** The scrolling labels section on the homepage currently shows generic content categories: "Technology", "Sports & Outdoors", "Video-Heavy Feed", "Sponsored Content", etc.

**What you want:** This section previously showed what algorithms likely infer about the user (e.g., "Left-leaning", "Environmentally conscious", "Fitness enthusiast"). You want to bring back that feel — not claiming these are facts about the user, but framing them as what algorithms likely think based on feed patterns.

**Why it matters:** This is the emotional hook. Generic categories like "Technology" don't make someone stop scrolling. But seeing "The algorithm likely thinks you're a night owl who's interested in politics" — that's visceral. That's what makes people want to scan their own feed.

**Proposed approach (epistemically restrained):**

The heading would change from:
> "Your feed reveals the categories platforms associate with you."

To something like:
> "Based on your feed, here's what the algorithm likely thinks about you."

The subtitle would change from:
> "From your activity, platforms sort you into categories that determine what content appears."

To:
> "Algorithms build a profile from your behavior — what you pause on, like, and skip. Your feed is the evidence."

The scrolling labels would change from topic names to inference-style labels:
- "Likely interested in politics" (instead of "Politics & Policy")
- "Probably a night owl" (instead of "Late-Night Content")
- "Fitness-motivated" (instead of "Fitness & Health")
- "Price-conscious shopper" (instead of "Shopping & Deals")
- "Climate-aware" (instead of "Climate & Environment")
- "Drawn to emotional content" (instead of "True Crime")
- "Tech early adopter" (instead of "Technology")
- "Sports fan" (instead of "Sports & Outdoors")
- "Crypto-curious" (instead of "Cryptocurrency")
- "Home cook" (instead of "Food & Cooking")
- "Self-improvement seeker" (instead of "Wellness & Self-Care")
- "Video-first consumer" (instead of "Video-Heavy Feed")
- "Entertainment-driven" (instead of "Gaming & Entertainment")
- "News follower" (instead of "News & Current Events")
- "Brand-receptive" (instead of "Sponsored Content")
- "Finance-focused" (instead of "Personal Finance")

**Epistemic compliance note:** Using "likely" and "probably" keeps this observational. We're not saying the user IS these things — we're saying the algorithm likely CATEGORIZES them this way based on feed patterns. The key hedge language: "likely thinks", "probably", "based on your feed patterns."

**File:** `src/components/Sections/LabelsPreviewSection.jsx`

---

### H2 — Homepage Hero: "See how the algorithms see you" — Epistemic Tension

**What's happening:** The main headline is "See how the algorithms see you." The subtitle says "Algorithms influence what appears in your feed."

**Why it matters:** The headline implies AlgorithmLens can reveal what algorithms think about you, which is compelling but epistemically bold. The product actually shows feed composition patterns, not the algorithm's internal model. However, the headline is a strong hook.

**My recommendation:** Keep the headline — it's the emotional draw and doesn't make a false claim (it's an invitation, not a data assertion). The subtitle already grounds it: "AlgorithmLens shows you the patterns behind your feed so you can browse with more awareness." This pairing works.

**No change recommended** unless you disagree.

---

### H3 — Plus Page: "Political lean analysis" Listed Under Free Tier

**What's happening:** The Free tier comparison card lists "Political lean analysis" as an included feature.

**Why it matters:** The previous audit changed this to "Political content detection" in the PricingPage, but the Plus page comparison still uses the old wording. "Political lean analysis" implies the tool determines a user's political lean, which is a stronger claim than what the product does (it detects political content in the feed).

**Proposed fix:** Change "Political lean analysis" to "Political content detection" in the Plus page comparison list.

**File:** `src/pages/plus/PlusPage.jsx` (line 509)

---

## Medium-Priority UX Issues (Polish & Professionalism)

### M1 — Dashboard Shows "Showing 1 of 2 scans" Without Real Data

**What's happening:** The dashboard loads and shows "Showing 1 of 2 scans" even without any real scans uploaded. This appears to be pulling from cached/demo data.

**Why it matters:** If a new user visits the dashboard before scanning, they'll see either an error or misleading data counts. The empty state should be clear and encouraging.

**Recommendation:** Check what data source is populating this — it may be the demo mode data from a `?demo=1` parameter or cached localStorage. Ensure the empty state is: "You'll see your feed analysis here after your first scan."

---

### M2 — History Page Shows Red Error State

**What's happening:** The History page shows "Error Loading History — Failed to fetch" with a red error box and pink "Try Again" button.

**Why it matters:** This is expected without the backend, but the error styling is alarming. Per the UI/UX philosophy, the app should never feel alarming.

**Proposed fix:** Change the error state to a softer, more helpful message. Instead of a red error box, show a calm empty state: "Unable to load your scan history. Make sure you're connected and try again." Use the standard blue/slate color palette instead of red.

**File:** `src/pages/HistoryPage.jsx`

---

### M3 — Homepage "See how the algorithms see you" — Redundant "see" Wording

**Current:** "See how the algorithms **see** you."

This double use of "see" is intentional wordplay but could feel awkward. Consider: "See what the algorithms think about you." — this is more direct and sets up the inference framing.

**No change unless you prefer the alternative.**

---

### M4 — Footer Copy Inconsistency

**What's happening:** The footer says "Understand what appears in your social media feed. Built by an MIT student." — this is good, accurate, and epistemically clean.

**No change needed.** Just confirming this is in good shape.

---

## Summary of Proposed Changes

| ID | Issue | File | Priority |
|----|-------|------|----------|
| C1 | Plus hero invisible | PlusPage.jsx | Critical |
| C2 | Plus comparison empty | PlusPage.jsx | Critical |
| C3 | Scan upload fails | Backend config | Critical |
| H1 | Categories → Inferences | LabelsPreviewSection.jsx | High |
| H2 | Homepage hero headline | HeroSection.jsx | No change |
| H3 | "Political lean analysis" | PlusPage.jsx | High |
| M1 | Dashboard empty state | DashboardPage.jsx | Medium |
| M2 | History error styling | HistoryPage.jsx | Medium |

**Awaiting your approval before making any changes.**
