# AlgorithmLens Design Extraction - Complete Index

**Extraction Date:** February 24, 2026
**Scope:** Website design values for comparison with mobile app
**Status:** Complete

---

## DELIVERABLES

Three comprehensive documents have been created to provide complete design system documentation:

### 1. WEBSITE_DESIGN_EXTRACT.md (18 KB)
**Purpose:** Complete technical design specification from website codebase
**File Path:** `/sessions/laughing-upbeat-hawking/mnt/AlgorithmLens_ParentFolder/WEBSITE_DESIGN_EXTRACT.md`

**Contents:**
- Complete color system with all hex values
- Dashboard tab catalog with exact labels and accent colors
- Hero section copy and CTAs (word-for-word)
- Tab-specific story headers and takeaway patterns
- Typography system (fonts, sizes, weights, spacing)
- Border radius values for all components
- Shadow definitions for all depth levels
- Settings page structure and content
- History page structure with features
- Responsive breakpoints and adaptive patterns
- Animations and transitions
- Accessibility specifications (ARIA, focus states)
- Epistemic restraint language patterns
- Trust sentences for each tab
- Key file references

**Best For:**
- Developers implementing mobile features
- Designers ensuring pixel-perfect consistency
- QA validating design system compliance

---

### 2. WEBSITE_DESIGN_QUICK_REF.json (7.6 KB)
**Purpose:** Programmatic quick reference for design values
**File Path:** `/sessions/laughing-upbeat-hawking/mnt/AlgorithmLens_ParentFolder/WEBSITE_DESIGN_QUICK_REF.json`

**Contents:**
- Tab configuration array (all 6 tabs with IDs, labels, colors)
- Color palette object (easily imported into code)
- Typography specifications (font, sizes, weights)
- Spacing values
- Border radius values
- Shadow definitions
- Hero section copy (for easy string lookup)
- Tab naming mismatch alert with recommendations
- Page structure metadata (Settings, History)
- Key differences between platforms

**Best For:**
- CSS/styling in mobile development
- Configuration files and constants
- Quick lookups during implementation
- Automated consistency checks

**Usage Example:**
```javascript
import designTokens from './WEBSITE_DESIGN_QUICK_REF.json';

const tabColors = designTokens.tabConfiguration.tabs.map(tab => ({
  label: tab.websiteLabel,
  accent: tab.accentColor
}));
```

---

### 3. WEBSITE_VS_MOBILE_COMPARISON.md (12 KB)
**Purpose:** Actionable comparison and gap analysis
**File Path:** `/sessions/laughing-upbeat-hawking/mnt/AlgorithmLens_ParentFolder/WEBSITE_VS_MOBILE_COMPARISON.md`

**Contents:**
- Critical findings summary (tab name mismatch alert)
- Tab name comparison table with recommendations
- Accent color alignment verification
- Typography alignment assessment
- Color palette alignment check
- Border radius alignment
- Copy and tone consistency analysis
- Pages and features comparison matrix
- Detailed component-by-component comparison
- Shadows and depth system alignment
- Responsive design review
- Accessibility features audit
- Animations comparison
- Summary alignment status table
- Prioritized recommendations (High/Medium/Low)
- Exact tab display order reference

**Best For:**
- Team alignment meetings
- Scoping mobile implementation
- Identifying gaps and mismatches
- Prioritizing work items
- Stakeholder presentations

---

## SOURCE FILES ANALYZED

All design information extracted from these website codebase files:

| File | Size | Purpose |
|------|------|---------|
| `/src/DESIGN_TOKENS.json` | 9.9 KB | Canonical machine-readable design tokens |
| `/src/index.css` | 1.7 KB | Global styles, scrollbar, animations |
| `/tailwind.config.js` | 3.1 KB | Tailwind CSS theme configuration |
| `/src/pages/dashboard/dashboardCatalog.js` | 37 KB | Tab definitions, all copy, view catalog (1300+ lines) |
| `/src/pages/dashboard/dashboardConstants.js` | 8.5 KB | Theme constants, tab headers, surfaces |
| `/src/components/Hero/HeroSection.jsx` | 4.7 KB | Landing page hero component |
| `/src/components/Hero/HeroDashboardPreview.jsx` | 16 KB | Hero preview profiles and stories |
| `/src/pages/SettingsPage.jsx` | 15 KB | Settings page implementation (full structure) |
| `/src/pages/HistoryPage.jsx` | 18 KB | Scan history page implementation |
| `/src/config/platforms.js` | 2.2 KB | Platform configuration (icon, color, label) |

**Total Analyzed:** ~115 KB of source code

---

## KEY FINDINGS AT A GLANCE

### Tab Naming Mismatch (ACTION REQUIRED)
```
Website              Mobile               Status
Overview      →      Overview             ✓ Match
Who Shapes... →      Sources              ✗ MISMATCH
Ads & Promo..→      Ads                  ✗ MISMATCH
Political... →      Politics             ✗ MISMATCH
Emotional... →      Tone                 ✗ MISMATCH
Suggested... →      Suggested            ✗ MISMATCH
```

### Perfect Alignment
- ✓ All 6 tab accent colors (identical hex values)
- ✓ Font family (Inter + Plus Jakarta Sans)
- ✓ Primary colors (blue #2563EB, green #10B981)
- ✓ Typography scale and weights
- ✓ Border radius values
- ✓ Shadow definitions
- ✓ Hero copy and messaging

---

## CRITICAL COPY EXTRACTS

### Landing Page Hero
```
Headline:
"See how the algorithms see you."

Subheadline:
"Algorithms learn what keeps you scrolling — the content, emotions,
and topics that hold your attention. AlgorithmLens shows you what
they've figured out."

Platforms Supported:
"Works with TikTok, Instagram, YouTube, X, Facebook, LinkedIn, and Reddit."

Credential:
"Built at MIT"

Primary CTA:
"Start a Scan — It's Free"

Secondary CTA:
"Free forever. Upgrade to Plus for trends and deeper analysis."
```

### Tab Trust Sentences
Each tab has a trust sentence grounding analysis in observation:
- Ads: "...reflects what showed up, not what you believe or want."
- Politics: "...based only on the posts included in your scans."
- Patterns: "...based only on the posts included in your scans."
- Creators: "...based only on the posts included in your scans."
- Algorithm: "...They do not represent your identity or preferences."

---

## DASHBOARD TABS - COMPLETE SPECIFICATION

All exact names, colors, and hero copy patterns extracted:

### 1. Overview (`#2563EB` - Primary Blue)
- Hero Title: "Content patterns during this window"
- Hero Subtext: "What content appeared based on your recent activity."
- Label: "Observed"

### 2. Who Shapes Your Feed (`#6366F1` - Indigo)
- Hero Title: "Influence during this window"
- Hero Subtext: "Which accounts shaped what you saw. What appeared, not who you are."
- Label: "Observed"
- Context Title: "How influence concentrated"
- Context Subtext: "Whether a few voices dominated or many contributed."

### 3. Ads & Promotions (`#D97706` - Amber)
- Hero Title: "Commercial content in your feed"
- Hero Subtext: "What share of your feed contains labeled ads and promotional content."
- Label: "Observed"
- Trust Sentence: "...reflects what showed up, not what you believe or want."
- Counterfactual: "Some ads blend in with regular content."

### 4. Political Exposure (`#7C3AED` - Purple)
- Hero Title: "Political keywords during this window"
- Hero Subtext: "Measures exposure to political content, not belief formation."
- Label: "Observed"
- Trust Sentence: "Based only on the posts included in your scans."
- Counterfactual: "Political content may be more memorable than other topics."

### 5. Emotional Tone (`#0D9488` - Teal)
- Hero Title: "Topics during this window"
- Hero Subtext: "What surfaced. Patterns in exposure, not preference."
- Label: "Observed"

### 6. Suggested vs. Followed (`#E11D48` - Rose)
- Hero Title: "Your feed split"
- Hero Subtext: "How much of your feed comes from suggested posts vs accounts you follow."

---

## SETTINGS PAGE STRUCTURE

Exact sections in order:

1. **Account Section**
   - Icon: User
   - Fields: Email, Member since, Current plan (badge), Sign out

2. **AI Analysis Section**
   - Icon: Brain
   - Toggle: "Enable AI analysis"
   - Explanation: What AI does (Google Gemini) & what it doesn't do

3. **Plan Management Section**
   - Icon: CreditCard
   - Plus users: Status card + billing portal link
   - Free users: Upgrade card with CTA

4. **Footer**
   - Attribution: "AlgorithmLens — built by Goodish to increase human agency"
   - Links: Privacy Policy, Terms of Service

---

## HISTORY PAGE STRUCTURE

Key features:

- **Header Section:** Title, scan count, Refresh + New Scan buttons
- **Scan List Item:** Platform icon → source badge (Desktop/Mobile) → time → stats → delete button
- **Stats:** Post count, duration (seconds), ad percentage
- **Actions:** Inline delete confirmation, hover effects
- **Pagination:** 10 scans per page, Previous/Current/Next
- **Summary Section:** Total scans, posts analyzed, platforms, avg ads
- **States:** Loading (skeletons), error, empty (zero scans)

---

## DESIGN SYSTEM SPECIFICATIONS

### Colors (All Extracted)
- **Primary:** Blue #2563EB (70% dominance)
- **Secondary:** Green #10B981 (30% dominance)
- **Status:** Red #DC2626 (error), Green #059669 (success), Amber #D97706 (warning)
- **Text:** #1E293B (main), #4B5563 (muted)
- **Backgrounds:** #F7F8FC (page), #FFFFFF (surface)

### Typography
- **Font:** Inter + Plus Jakarta Sans
- **Hero Size:** Fluid clamp(1.625rem, 4.5vw, 2.25rem)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Line Height:** 1.25 (hero), 1.65 (body)

### Spacing
- **Hero Padding:** Fluid clamp(2rem, 5vw, 3.5rem) vertical × clamp(1.75rem, 4vw, 3rem) horizontal
- **Margins:** 40px (hero), 48-80px (sections)

### Components
- **Border Radius:** 12px (sm), 20px (md), 28px (lg), 9999px (pill), 24px (hero)
- **Shadows:** Soft, medium, strong, glow, card variations
- **Animations:** Pulse (8s), scroll (40s), hero stagger (0.8s)

---

## RECOMMENDED NEXT STEPS

### Phase 1: Alignment (Week 1)
- [ ] Review tab naming mismatch with product team
- [ ] Choose naming standard (full vs. abbreviated)
- [ ] Update mobile to match chosen standard
- [ ] Review settings page implementation requirements

### Phase 2: Implementation (Weeks 2-3)
- [ ] Implement Settings page on mobile
- [ ] Implement History page on mobile with pagination
- [ ] Copy exact hero copy and CTAs to mobile
- [ ] Add trust sentences to each tab

### Phase 3: Refinement (Week 4)
- [ ] Add counterfactual language to primary cards
- [ ] Verify shadow system matches
- [ ] Test animations match website
- [ ] QA accessibility patterns (ARIA, focus)

---

## USAGE INSTRUCTIONS

### For Mobile Developer
1. Start with `WEBSITE_DESIGN_QUICK_REF.json` for constants/configs
2. Reference `WEBSITE_DESIGN_EXTRACT.md` for detailed specifications
3. Check `WEBSITE_VS_MOBILE_COMPARISON.md` for gap analysis
4. Cross-check with actual website codebase files for context

### For Designer
1. Use `WEBSITE_DESIGN_EXTRACT.md` as design spec document
2. Review `WEBSITE_VS_MOBILE_COMPARISON.md` for consistency gaps
3. Use color/typography sections as design system reference
4. Share `WEBSITE_DESIGN_QUICK_REF.json` with developers

### For Product/PM
1. Read Critical Findings section in `WEBSITE_VS_MOBILE_COMPARISON.md`
2. Review Recommendations section for prioritized work items
3. Use Tab Naming Mismatch table for stakeholder discussion
4. Share Key Findings at a Glance with leadership

### For QA/Testing
1. Use color values from `WEBSITE_DESIGN_QUICK_REF.json` for visual regression testing
2. Reference typography sizes in `WEBSITE_DESIGN_EXTRACT.md` for responsive testing
3. Verify Settings and History page features match specification
4. Test accessibility patterns from `WEBSITE_DESIGN_EXTRACT.md`

---

## DOCUMENT MAINTENANCE

**Last Updated:** February 24, 2026
**Next Review:** After mobile implementation of Settings/History pages
**Owner:** Mobile Development Team
**Version:** 1.0

To maintain accuracy:
- Update these docs when website design system changes
- Add mobile implementation details as features are built
- Cross-reference with actual codebase for source of truth
- Schedule quarterly alignment reviews between web and mobile teams

---

## QUICK LINKS

- **Website Codebase:** `/sessions/laughing-upbeat-hawking/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/src/`
- **Main Dashboard Catalog:** `/src/pages/dashboard/dashboardCatalog.js`
- **Design Tokens:** `/src/DESIGN_TOKENS.json`
- **Hero Component:** `/src/components/Hero/HeroSection.jsx`
- **Settings Implementation:** `/src/pages/SettingsPage.jsx`
- **History Implementation:** `/src/pages/HistoryPage.jsx`

---

**End of Index**
