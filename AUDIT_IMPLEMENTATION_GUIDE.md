# UX Design Audit — Implementation Guide

**Reference:** `/UX_DESIGN_AUDIT.md` — Read full audit before implementing

This guide provides specific code changes for each issue.

---

## CRITICAL Issues — Implement Immediately

### C1: Prevent Anthropomorphized Language in Dashboard

**File:** `/src/components/dashboard/ViewCard.jsx`

**Current Code (Lines 391-396):**
```jsx
{isPrimary && takeawayText && (
  <div className="pb-6 mb-5 border-b border-border-light">
    <p className="text-xl text-text-main font-semibold leading-relaxed tracking-tight">
      {takeawayText}
    </p>
  </div>
)}
```

**Issue:** `takeawayText` may contain phrases like "The algorithm wants..." or "The algorithm prioritizes..." which anthropomorphize the system.

**Solution:** Add validation layer before rendering:

```jsx
/**
 * validateTakeawayForAnthropomorphization - PHASE 12: Epistemic restraint
 * Ensure takeaway uses only observable patterns, not attributed desires/intentions
 *
 * Reject patterns like:
 * - "The algorithm wants..."
 * - "The algorithm prioritizes..."
 * - "The algorithm designed to keep you..."
 *
 * Accept patterns like:
 * - "This pattern suggests..."
 * - "Your feed contains..."
 * - "Based on observable data..."
 */
const validateTakeawayForAnthropomorphization = (text) => {
  if (!text) return true;

  const forbiddenPatterns = [
    /\balgorithm\s+wants\b/i,
    /\balgorithm\s+prioritizes\b/i,
    /\balgorithm\s+designed\s+to\b/i,
    /\balgorithm\s+tries\s+to\b/i,
    /\balgorithm\s+intends\b/i,
    /\balgorithm\s+aims\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      console.warn(`[Epistemic Restraint] Anthropomorphized takeaway detected: "${text}"`);
      return false;
    }
  }
  return true;
};

// In ViewCard render, before displaying takeaway:
const isTakeawayValid = validateTakeawayForAnthropomorphization(takeawayText);

{isPrimary && takeawayText && isTakeawayValid && (
  <div className="pb-6 mb-5 border-b border-border-light">
    <p className="text-xl text-text-main font-semibold leading-relaxed tracking-tight">
      {takeawayText}
    </p>
  </div>
)}
```

**Also Update:** Search all view configurations in `/src/lib/dashboard/dashboardCatalog.js` and any `takeaway` function definitions to ensure they never generate anthropomorphic language.

**Test:**
```javascript
// Add to test suite
it('rejects anthropomorphic takeaway language', () => {
  expect(validateTakeawayForAnthropomorphization("The algorithm wants you to scroll")).toBe(false);
  expect(validateTakeawayForAnthropomorphization("Your feed contains 70% sponsored content")).toBe(true);
});
```

---

### C2: Constrain Mobile App Width on Web

**File:** `/mobile/app/(tabs)/_layout.tsx` (or root layout file)

**Current:** App fills full viewport width

**Solution:**

Option A — React Native Web Wrapper:
```tsx
import React from 'react';
import { View, SafeAreaView } from 'react-native';

const RootLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Constrain max width for web platforms */}
      <View
        style={{
          flex: 1,
          maxWidth: 428, // iPhone 12 Pro Max width
          marginHorizontal: 'auto',
          width: '100%',
          // Add subtle frame effect on web
          backgroundColor: __DEV__ && Platform.OS === 'web' ? '#f0f0f0' : undefined,
        }}
      >
        {/* All screens rendered here */}
        <TabNavigator />
      </View>
    </SafeAreaView>
  );
};

export default RootLayout;
```

Option B — CSS Override for Web Preview:
```css
/* In a web-specific stylesheet or tailwind.config.js */
@media (platform: web) {
  #root {
    max-width: 428px;
    margin: 0 auto;
    background: #f0f0f0; /* Frame effect */
    padding: 8px; /* Simulate bezel */
  }
}
```

**Browser Testing:**
- Open mobile app web build on 1440px desktop browser
- Content should be centered in 428px column
- Should feel like a phone preview, not stretched desktop app

---

## IMPORTANT Issues — Fix in v1.0

### I1: Ensure All Tabs Have a Headline Insight

**File:** `/src/pages/dashboard/TabRenderer.jsx`

**Current:** Tabs render multiple cards, unclear which is primary

**Solution:**
1. **Audit Step:** Check that every tab has exactly ONE card with `isPrimary={true}`
2. **Refactor Step:** If multiple cards are equally important, create a summary card

Example pattern for Sources tab:
```jsx
// CURRENT (unclear hierarchy)
<ViewCard view={sourcesViews[0]} dataResult={data1} isPrimary={false} />
<ViewCard view={sourcesViews[1]} dataResult={data2} isPrimary={false} />
<ViewCard view={sourcesViews[2]} dataResult={data3} isPrimary={false} />

// FIXED (clear hierarchy)
<ViewCard
  view={summaryCardView}
  dataResult={summaryData}
  isPrimary={true}
  isSummaryCard={true}
/>
<ViewCard view={sourcesViews[0]} dataResult={data1} isPrimary={false} />
<ViewCard view={sourcesViews[1]} dataResult={data2} isPrimary={false} />
```

**Audit Checklist:**
- [ ] Overview tab — has primary card showing top insight
- [ ] Sources tab — has primary card summarizing where posts come from
- [ ] Ads tab — has primary card about ad prevalence
- [ ] Politics tab — has primary card about political content
- [ ] Tone tab — has primary card about content tone
- [ ] Suggested vs Followed — has primary card about source distribution

For each tab without a clear primary, either:
A. Designate one existing card as primary, or
B. Create a new summary card that rolls up key insights

---

### I2: Fix Tab Navigation on Mobile

**File:** `/src/pages/dashboard/TabNavigation.jsx`

**Current Code (Lines 24-30):**
```jsx
style={{
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch',
  background: 'linear-gradient(180deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
  border: '1px solid rgba(226, 232, 240, 0.6)',
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
}}
```

**Issue:** Gradient is subtle on mobile, active tab indicator may misalign on smaller screens

**Solution:**
```jsx
// Use responsive background depending on viewport
const tabBarStyle = {
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch',
  // More contrast on mobile
  background: window.innerWidth < 768
    ? 'rgba(248, 250, 252, 0.95)' // Solid light background
    : 'linear-gradient(180deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', // Slight shadow for depth
};
```

**Also Fix:** Ensure active tab indicator width calculation is precise:

In `/src/pages/dashboard/DashboardPage.jsx` (Lines 138-149):
```jsx
useEffect(() => {
  if (tabContainerRef.current) {
    const activeButton = tabContainerRef.current.querySelector('[data-tab-active="true"]');
    if (activeButton) {
      // Account for button padding in calculation
      const rect = activeButton.getBoundingClientRect();
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: rect.left - containerRect.left,
        width: rect.width,
      });
    }
  }
}, [activeTab]);
```

**Test:**
- [ ] Open dashboard on 375px mobile
- [ ] Tab bar background is clearly visible
- [ ] Active tab indicator aligns perfectly with button
- [ ] No jank when switching tabs

---

### I3: Rewrite Empty State Messages

**File:** `/src/components/dashboard/EmptyState.jsx`

**Current (Lines 71-99):**
```javascript
const qualityReason = chartQuality?.quality_reason || missing || 'Not enough data for a reliable analysis.';
const calmWhy = qualityReason; // Still clinical
```

**Solution:**

```javascript
const getWarmCopyForInsufficient Data = (chartQuality, missing) => {
  const qualityReason = chartQuality?.quality_reason || missing || '';

  // Extract threshold if present
  const thresholdMatch = qualityReason.match(/(\d+)\s+(posts?|items?|scans?)/i);
  const threshold = thresholdMatch ? thresholdMatch[1] : null;
  const unit = thresholdMatch ? thresholdMatch[2] : 'items';

  if (threshold) {
    return {
      title: 'You're almost there!',
      why: `Great start! You've gathered some data. Once you have at least ${threshold} ${unit}, we'll show you reliable patterns. Right now, individual items have too much influence on results.`,
      howToUnlock: [
        `Capture ~${threshold} ${unit} total to unlock insights`,
        'Keep scrolling and scanning',
      ],
    };
  }

  return {
    title: 'Almost there!',
    why: qualityReason || 'Run a few more scans to reach the data threshold. We want to show you patterns, not noise.',
    howToUnlock: [
      'Run more scans to increase sample size',
      'Make sure each scan captures a good scrolling session',
    ],
  };
};

// Usage:
case EMPTY_STATE_TYPES.INSUFFICIENT_DATA:
  const warmCopy = getWarmCopyForInsufficient Data(chartQuality, missing);
  return {
    icon: 'quality',
    title: warmCopy.title,
    why: warmCopy.why,
    howToUnlock: warmCopy.howToUnlock,
    cta: { label: 'Run Another Scan', to: '/start' },
  };
```

**Before & After:**
- ❌ "We need at least 50 posts to show meaningful patterns"
- ✅ "You're almost there! Once you have 50 posts, we'll show you reliable patterns"

**Test with Users:**
- Show empty state to 5 users
- Ask: "Does this feel encouraging or like you failed?"
- Target: 4/5 say "encouraging"

---

### I4: Fix Color Contrast on Hover States

**File:** `/src/pages/dashboard/TabNavigation.jsx` (Lines 53-64)

**Current:**
```jsx
onMouseEnter={(e) => {
  if (!isActive) {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
    e.currentTarget.style.color = '#1E293B';
  }
}}
```

**Problem:** White with opacity on light gray background; text may not have 4.5:1 contrast

**Solution:**

```jsx
onMouseEnter={(e) => {
  if (!isActive) {
    // Use design system color instead of manual white
    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)'; // primary-blue/5 equivalent
    e.currentTarget.style.color = '#1E293B'; // text-main
  }
}}
onMouseLeave={(e) => {
  if (!isActive) {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = '#64748B'; // text-muted
  }
}}
```

**Verify Contrast:**
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Test: `#1E293B` (text) on `rgba(37, 99, 235, 0.08)` background
3. Target: Minimum 4.5:1 ratio
4. Screenshot the result for QA

---

## MINOR Issues — Polish (v1.1+)

### M1: Align Header Padding (ViewCard.jsx)

**Current (Lines 280-300):**
```jsx
if (isPrimary && hasData) {
  return 'px-8 py-7 bg-white border-b border-border-light pl-9'; // py-7
}
// ...
return 'px-6 py-5'; // py-5 — inconsistent
```

**Fix:**
```jsx
if (isPrimary && hasData) {
  return 'px-8 py-6 bg-white border-b border-border-light pl-9'; // Align to py-6
}
// ...
return 'px-6 py-6'; // Consistent vertical padding
```

---

### M2: Humanize "How We Measure" Title

**Current (Line 66):**
```jsx
<p className="text-[11px] font-medium text-text-muted uppercase tracking-[0.12em]">
  How we measure
</p>
```

**Fix:**
```jsx
<p className="text-[11px] font-medium text-text-muted tracking-normal">
  How we measure this
</p>
```

Remove `uppercase` and reduce `tracking-[0.12em]` to `tracking-normal`. Optional: Add info icon.

---

### M3: Test Chart Opacity

**Current (Line 400):**
```jsx
<div className={isPrimary ? 'opacity-75' : ''}>
  {renderContent()}
</div>
```

**Action:** Run A/B test with users:
- Version A: `opacity-75` (current)
- Version B: `opacity-60`
- Version C: `opacity-50`
- Question: "Which feels like the supporting detail, not the main insight?"

Record user preference and implement winner.

---

### M4: Verify Scrollbar Contrast

**Test Steps:**
1. Open dashboard on Firefox and Chrome
2. Look at scrollbar on light gray page background (#F7F8FC)
3. Use color picker: scrollbar color is #CBD5E1
4. Test contrast: #CBD5E1 on #F7F8FC using WebAIM
5. If < 3:1, darken scrollbar to #94A3B8

**Fix (if needed) in `/src/index.css`:**
```css
::-webkit-scrollbar-thumb {
  background: #94A3B8; /* Darker slate */
  border-radius: 9999px;
}

* {
  scrollbar-color: #94A3B8 transparent;
}
```

---

### M5: Upgrade Loading Spinner

**Current `/src/pages/dashboard/DashboardPage.jsx` (Lines 286-294):**
```jsx
<div className="w-12 h-12 border-4 border-border-light/30 border-t-primary-blue rounded-full animate-spin"></div>
```

**Better Approach:**
```jsx
import { motion } from 'framer-motion';

function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 rounded-full border-4 border-primary-blue/20"
      style={{
        borderTopColor: '#2563EB',
        boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)',
      }}
    />
  );
}
```

Softer animation, subtle glow matches design system.

---

### M6: Simplify Mobile Date Range UI

**File:** `/src/pages/dashboard/DashboardHeader.jsx`

**For mobile (< 640px), hide advanced options:**

```jsx
<div className={`flex flex-col ${isOnAlgorithmTab ? 'gap-2' : 'gap-3 md:flex-row md:items-center md:justify-between'}`}>
  {/* Label + select on same row */}
  <div className="flex items-center gap-2 w-full">
    <label htmlFor="date-preset" className="text-xs text-text-muted whitespace-nowrap">
      Date range:
    </label>
    <select /* ... */ className="flex-1 px-3 py-1.5" />
  </div>

  {/* Hide premium hint on mobile */}
  <div className="hidden md:block text-xs text-slate-500">
    Upgrade to Premium to unlock 30-day, 90-day, and custom date ranges.
  </div>
</div>
```

---

### M7: Warm Up "Master Count Line" Phrasing

**File:** `/src/pages/dashboard/MasterCountLine.jsx`

**Current (Line 20):**
```javascript
Based on {masterCounts.scanCount} scan{s} across {masterCounts.platformCount} platform{s}
```

**Better:**
```javascript
Your analysis is based on {masterCounts.scanCount} scan{s} across {masterCounts.platformCount} platform{s} and {masterCounts.postCount} posts
```

Or even warmer:
```javascript
We analyzed {masterCounts.postCount} posts from {masterCounts.scanCount} scan{s} on {masterCounts.platformCount} platform{s}
```

---

### M8: Increase Primary Card Border Contrast

**File:** `/src/components/dashboard/ViewCard.jsx` (Lines 231-235)

**Current:**
```jsx
const accentBorder = accentColor === 'green' ? 'border-emerald-200' : 'border-primary-blue/20';
```

**Fix:**
```jsx
const accentBorder = accentColor === 'green' ? 'border-emerald-300' : 'border-primary-blue/40';
```

This increases visibility without being aggressive. Test with users to ensure it still feels "sophisticated."

---

### M9: Remove Redundant Title Attributes

**File:** `/src/pages/dashboard/TabNavigation.jsx` (Line 69)

**Current:**
```jsx
title={tab.label}
```

**Fix:**
```jsx
// Remove title={tab.label} entirely
// Screen readers will announce the visible text: <span>{tab.label}</span>
```

Screen readers will say "Overview" once, not twice.

---

### M10: Add Loading State to Extension Popup

**File:** `/alg-gemini-extension/src/popup/popup.js`

**Around Lines 138-140:**
```javascript
// CURRENT
fetchAndDisplayPlan().then(() => {
  loadScanHistory();
});

// IMPROVED
function showScanHistorySkeleton() {
  const historyContainer = document.getElementById('scanHistory');
  historyContainer.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>
  `;
}

showScanHistorySkeleton(); // Show skeleton immediately
fetchAndDisplayPlan().then(() => {
  loadScanHistory(); // Replace skeleton with real data
});
```

**Add CSS:**
```css
.skeleton-item {
  height: 40px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: loading 2s infinite;
  margin-bottom: 8px;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Implementation Timeline

### Sprint 1 (Week 1)
- [ ] C1: Epistemic restraint validation
- [ ] C2: Mobile app max-width constraint

### Sprint 2 (Week 2)
- [ ] I1: Audit tabs for headline insights
- [ ] I2: Tab navigation responsive styling
- [ ] I3: Empty state copy rewrite
- [ ] I4: Hover contrast verification

### Sprint 3+ (Ongoing)
- [ ] M1-M10: Polish items as time permits

---

## Quality Assurance Checklist

After implementing each fix:

- [ ] Test on desktop (1440px), tablet (768px), mobile (375px)
- [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Test color contrast with WebAIM Contrast Checker
- [ ] Test keyboard navigation (tab, arrow keys, escape)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Take screenshot for audit documentation
- [ ] Get user feedback (if time allows)

---

## References

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WAI-ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- Oura Ring Design Philosophy (inspiration): https://www.ouraring.com/

---

**Implementation Guide Complete.** All fixes are non-breaking and can be implemented incrementally.
