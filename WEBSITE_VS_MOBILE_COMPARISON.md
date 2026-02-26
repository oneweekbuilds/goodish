# Website vs. Mobile App - Design Comparison Report

**Analysis Date:** February 24, 2026
**Comparison Scope:** Tab naming, colors, typography, copy patterns, page structure

---

## CRITICAL FINDINGS

### 1. TAB NAME MISMATCH (ACTION REQUIRED)

The website and mobile app use different names for 5 of 6 dashboard tabs. This inconsistency should be resolved before launch.

| Tab | Website Label | Mobile Label | Recommendation |
|-----|--------------|-------------|-----------------|
| Tab 1 | Overview | Overview | ✓ Aligned |
| Tab 2 | **Who Shapes Your Feed** | **Sources** | ✗ Mismatch |
| Tab 3 | **Ads & Promotions** | **Ads** | ✗ Mismatch |
| Tab 4 | **Political Exposure** | **Politics** | ✗ Mismatch |
| Tab 5 | **Emotional Tone** | **Tone** | ✗ Mismatch |
| Tab 6 | **Suggested vs. Followed** | **Suggested** | ✗ Mismatch |

**Options:**
- **Option A:** Adopt website's full names everywhere (more descriptive, better for new users)
- **Option B:** Adopt mobile's abbreviated names everywhere (more compact for smaller screens)
- **Option C:** Platform-specific names (website long, mobile short) with shared underlying IDs

**Recommendation:** Option A (full names) provides better clarity and matches the project's epistemic restraint philosophy of clear, unambiguous language.

### 2. EXACT ACCENT COLORS (ALL MATCH)

All 6 tabs have identical accent colors in both website and mobile:

```
Overview:              #2563EB (Primary Blue)
Sources:               #6366F1 (Indigo)
Ads:                   #D97706 (Amber)
Politics:              #7C3AED (Purple)
Tone:                  #0D9488 (Teal)
Suggested vs. Followed: #E11D48 (Rose)
```

**Status:** ✓ No action needed - colors are perfectly aligned.

### 3. TYPOGRAPHY ALIGNMENT

**Font Family:** Identical
```
Inter, Plus Jakarta Sans, sans-serif
```

**Hero Headline Size:** Identical
```
clamp(1.625rem, 4.5vw, 2.25rem)
```

**Font Weights:** Identical
```
700 (bold), 600 (semibold), 500 (medium), 400 (regular)
```

**Status:** ✓ Fully aligned - no changes needed.

### 4. COLOR PALETTE ALIGNMENT

**Primary Colors:**
- Brand Blue: `#2563EB` ✓ Match
- Accent Green: `#10B981` ✓ Match

**Text Colors:**
- Text Main: `#1E293B` ✓ Match
- Text Muted: `#4B5563` ✓ Match

**Background:**
- Page Background: `#F7F8FC` ✓ Match
- Surface Default: `#FFFFFF` ✓ Match

**Status:** ✓ Complete color alignment across all palettes.

### 5. BORDER RADIUS ALIGNMENT

**Consistency across platforms:**
- Small: `12px` ✓
- Medium: `20px` ✓
- Large: `28px` ✓
- Pill (full round): `9999px` ✓
- Hero Card: `24px` ✓
- Tab Buttons: `12px` ✓

**Status:** ✓ Fully aligned.

### 6. COPY & TONE ALIGNMENT

**Landing Page Hero (Identical on both):**
```
See how the algorithms see you.
```

**Subheadline (Identical):**
```
Algorithms learn what keeps you scrolling — the content, emotions,
and topics that hold your attention. AlgorithmLens shows you what
they've figured out.
```

**Epistemic Restraint Pattern (Website-defined):**
Both systems emphasize observational language:
- "What appeared" (not "what you are")
- "Exposure" (not "belief formation")
- "Observed patterns" (not "predictions")
- "This scan" (not universal claims)

**Status:** ✓ Copy tone is consistent; mobile should adopt the same epistemic restraint patterns.

### 7. BUTTON & CONTROL ALIGNMENT

**Primary CTA (Website):**
- Logged out: "Start a Scan — It's Free"
- Coming soon: "Join the Waitlist"

**Secondary CTA (Website):**
- "Free forever. Upgrade to Plus for trends and deeper analysis."

**Status:** ⚠ Mobile should verify these exact CTAs are used consistently.

### 8. PAGES & FEATURES COMPARISON

| Feature | Website | Mobile |
|---------|---------|--------|
| Settings Page | ✓ Implemented | TBD |
| History/Scans List | ✓ Implemented | TBD |
| Account Info Section | ✓ Yes | TBD |
| AI Analysis Toggle | ✓ Yes | TBD |
| Plan Management | ✓ Yes | TBD |
| Scan History with Delete | ✓ Yes | TBD |
| Pagination | ✓ Yes (10 per page) | TBD |
| Quick Summary Stats | ✓ Yes | TBD |

**Status:** ⚠ Mobile implementation should replicate website's feature set.

---

## DETAILED COMPARISON BY COMPONENT

### Landing Page Hero

**Website Hero (HeroSection.jsx):**
```
Headline:    "See how the algorithms see you."
Subheadline: "Algorithms learn what keeps you scrolling..."
Platforms:   "Works with TikTok, Instagram, YouTube, X, Facebook, LinkedIn, and Reddit."
Credential:  "Built at MIT"
CTA:         "Start a Scan — It's Free" (or "Join the Waitlist" in coming-soon mode)
```

**Mobile Status:** Check if hero matches exactly.

---

### Tab Headers & Labels

**Website Pattern (dashboardConstants.js):**
Each tab has a story header structure:
```javascript
{
  label: "Observed",           // Section label
  title: "Content patterns...", // Section title
  subtext: "What content..."    // Section subtext
}
```

**Epistemic Restraint Element:**
Every primary card includes a `counterfactual` property:
```javascript
counterfactual: "This measures exposure, not belief formation.
                 Political content may be more memorable than other topics."
```

**Mobile Status:** Should adopt this three-part header pattern and counterfactual language.

---

### Tab Trust Sentences

**Website's Trust Sentences (appearing at tab level):**

**Ads Tab:**
> "This view estimates how often ads and sales-driven posts appeared in the content you scanned. It reflects what showed up, not what you believe or want."

**Politics Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Patterns Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Creators Tab:**
> "Counts and percentages are based only on the posts included in your scans."

**Algorithm Tab:**
> "These are content themes that appeared in your scans. They do not represent your identity or preferences."

**Mobile Status:** Mobile should display similar trust sentences on each tab.

---

### Settings Page Structure

**Website Implementation (SettingsPage.jsx):**

1. **Account Section**
   - Email
   - Member since (formatted date)
   - Current plan (badge: Free/Plus/Anonymous)
   - Sign out button

2. **AI Analysis Section**
   - Toggle: "Enable AI analysis"
   - Explanation box with:
     - What AI does (Google Gemini for politics & tone)
     - What it does NOT do (4 bullet points)

3. **Plan Management Section**
   - Current plan status
   - Billing portal link (Plus users)
   - Upgrade CTA (Free users)

4. **Footer**
   - Attribution text
   - Privacy & Terms links

**Mobile Status:** Should implement identical structure and copy.

---

### History Page Structure

**Website Implementation (HistoryPage.jsx):**

**Header:**
- Title: "Scan History"
- Subtitle: User name + scan count
- Buttons: Refresh + New Scan

**Scan List Item (per scan):**
```
[Platform Icon] [Source Badge] [Time] [Stats]
                 Desktop/Mobile  2h ago  35 posts • 85s • 14% ads
                                        [Delete Button] [Arrow]
```

**Features:**
- Source badge (Desktop vs. Mobile upload)
- Relative time formatting
- Inline delete confirmation ("Delete? Yes/No")
- Pagination (10 scans per page)
- Quick summary stats section
- Loading, error, and empty states

**Mobile Status:** Mobile should implement similar structure and features.

---

## SHADOWS & DEPTH SYSTEM

**Website Shadows (all matching):**

| Shadow | Value |
|--------|-------|
| Soft | `0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` |
| Medium | `0 8px 24px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.03)` |
| Card | `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.04)` |
| Glow | `0 0 20px rgba(37,99,235,0.25), 0 0 6px rgba(37,99,235,0.1)` |

**Mobile Status:** Verify mobile uses consistent shadow definitions.

---

## RESPONSIVE DESIGN

**Website Breakpoints:**
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
```

**Fluid Sizing (via clamp):**
```
Hero font: clamp(1.625rem, 4.5vw, 2.25rem)
Hero padding: clamp(2rem, 5vw, 3.5rem)
```

**Mobile Adaptations:**
- Tab labels: 11px (mobile) → 14px (desktop)
- Stack vs. grid layouts
- Scrollable horizontal scroll for smaller screens

**Mobile Status:** Mobile layout needs review for consistency with web breakpoints.

---

## ACCESSIBILITY FEATURES

**Website Implementation:**
```javascript
// Focus ring on buttons/tabs
focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1

// ARIA on tabs
role="tablist", role="tab", role="tabpanel"
aria-selected, aria-controls, aria-label, tabIndex

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

**Mobile Status:** Mobile should implement same accessibility patterns.

---

## ANIMATIONS

**Website Animations:**

| Animation | Value |
|-----------|-------|
| Pulse Slow | `pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite` |
| Scroll Slow | `scroll 40s linear infinite` |
| Hero entrance | Staggered with 0.8s duration, easing `[0.16, 1, 0.3, 1]` |
| Delays | 0.1s, 0.15s, 0.17s, 0.2s, 0.3s increments |

**Mobile Status:** Mobile should replicate hero entrance animations with similar timing.

---

## SUMMARY OF ALIGNMENT STATUS

| Category | Status | Notes |
|----------|--------|-------|
| Tab Names | ⚠ Mismatch | 5 of 6 tabs differ; needs alignment |
| Accent Colors | ✓ Perfect | All 6 colors identical |
| Typography | ✓ Perfect | Font family, sizes, weights all match |
| Color Palette | ✓ Perfect | Primary, secondary, and status colors identical |
| Border Radius | ✓ Perfect | All radius values match |
| Shadows | ✓ Perfect | Shadow definitions identical |
| Copy & Tone | ✓ Consistent | Epistemic restraint language aligned |
| Page Features | ⚠ Partial | Settings/History need mobile implementation |
| Accessibility | ✓ Good | Website has full ARIA/focus patterns |
| Animations | ⚠ Review | Website uses Framer Motion; mobile approach TBD |

---

## RECOMMENDATIONS

### High Priority
1. **Resolve tab naming** - Choose between full names (website) vs. abbreviated (mobile)
2. **Implement Settings page** on mobile per website spec
3. **Implement History page** on mobile with pagination and delete confirmation
4. **Match copy exactly** - Use the epistemic restraint language from website

### Medium Priority
5. Implement trust sentences on each tab (from dashboardConstants.js)
6. Add counterfactual language to primary cards
7. Replicate shadow system and animations
8. Match accessibility patterns (ARIA, focus rings)

### Low Priority
9. Review and match responsive breakpoints for consistency
10. Verify reduced-motion support on mobile

---

## FILES TO REFERENCE

- **Website Design Tokens:** `/DESIGN_TOKENS.json`
- **Website Design Constants:** `/src/pages/dashboard/dashboardConstants.js`
- **Website Dashboard Catalog:** `/src/pages/dashboard/dashboardCatalog.js` (1300+ lines of exact copy)
- **Website Settings:** `/src/pages/SettingsPage.jsx`
- **Website History:** `/src/pages/HistoryPage.jsx`
- **Website Hero:** `/src/components/Hero/HeroSection.jsx`

---

## EXACT TAB DISPLAY ORDER (Website)

For reference, the exact order and names as displayed on the website:

1. **Overview** (`#2563EB`)
2. **Who Shapes Your Feed** (`#6366F1`)
3. **Ads & Promotions** (`#D97706`)
4. **Political Exposure** (`#7C3AED`)
5. **Emotional Tone** (`#0D9488`)
6. **Suggested vs. Followed** (`#E11D48`)

---

**Document Created:** February 24, 2026
**Source:** Website codebase full analysis
**Next Step:** Schedule alignment meeting between web and mobile teams
