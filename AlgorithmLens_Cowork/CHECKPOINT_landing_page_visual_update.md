# Checkpoint: Landing Page Visual Update
**Date:** February 15, 2026

## Changes Planned

### 1. Remove Social Proof Section
- **File:** `src/App.jsx` (line 12 import, line 152 usage)
- **What:** Commenting out the entire SocialProofSection (waitlist counter, testimonials, trust badges)
- **Why:** Contains unverified claims (1,200+ waitlist, fake testimonials, "Built at MIT" badge)

### 2. Redesign Persona Tags (LabelsPreviewSection)
- **File:** `src/components/Sections/LabelsPreviewSection.jsx`
- **What:** Making tags more colorful with category-based color coding, gradient backgrounds, and better visual pop
- **Before:** Plain white pills with thin left border accent
- **After:** Color-coded by category (political=blue, emotional=purple, consumer=amber, behavioral=green) with gradient fills and glow hover effects

### 3. Redesign Behavioral Signals (SectionTracking)
- **File:** `src/components/Sections/SectionTracking.jsx`
- **What:** Making signal cards more vibrant with colored gradients, bolder icon styling, and better visual hierarchy
- **Before:** Flat gray cards with thin blue left border
- **After:** Colored gradient backgrounds per signal type, more prominent icons, better text contrast

## Files Modified
- `src/App.jsx`
- `src/components/Sections/LabelsPreviewSection.jsx`
- `src/components/Sections/SectionTracking.jsx`

## Rollback
- SocialProofSection.jsx file is preserved (just commented out of App.jsx)
- Original styling can be restored by reverting the two component files
