# Algorithm Lens - QA Checklist

This checklist ensures all features work correctly across different scenarios and devices.

## Visual & Layout

### Hero Section
- [ ] Logo displays fully without clipping at all window sizes (320px to 1440px+)
- [ ] Hero animation is subtle and smooth
- [ ] Animation stops when `prefers-reduced-motion: reduce` is set
- [ ] Hero scales properly on mobile (no overflow or horizontal scroll)
- [ ] Gradient background orbs are visible but not distracting

### Typography & Spacing
- [ ] All text is readable (meets WCAG AA contrast standards)
- [ ] Font sizes scale appropriately on mobile vs desktop
- [ ] Spacing is consistent across all pages (8-point grid)
- [ ] No jarring size jumps between different pages

### Responsive Breakpoints
- [ ] **320px** (iPhone SE): All content stacks correctly, no horizontal scroll
- [ ] **768px** (iPad): Cards arrange in 2-column grid
- [ ] **1024px** (Desktop): Cards arrange in 3-column grid
- [ ] **1440px+** (Large Desktop): Max-width container centers content

## Email Gate

### Local-only Mode (Default)
- [ ] Email gate appears on first visit
- [ ] Email validation works (invalid emails show error)
- [ ] Consent checkbox must be checked before submission
- [ ] Email is stored in `localStorage` after submission
- [ ] No network requests are made (check Network tab)
- [ ] Success toast appears after submission
- [ ] Email gate doesn't reappear on subsequent visits
- [ ] "Why we ask" expandable section works

### Development Bypass
- [ ] Setting `VITE_DISABLE_EMAIL_GATE=true` skips the gate entirely
- [ ] App still functions normally in bypass mode

### Beehiiv Mode (Optional)
- [ ] When Beehiiv env vars are set, POST request is made to embed action
- [ ] Success toast indicates Beehiiv submission
- [ ] Falls back to local-only if Beehiiv submission fails
- [ ] No console errors on failed Beehiiv requests

## Navigation

### NavBar
- [ ] Privacy Policy icon appears in nav
- [ ] All nav icons have visible hover states
- [ ] All nav icons have proper focus rings (keyboard navigation)
- [ ] Tooltips appear on icon hover
- [ ] Keyboard shortcuts work (R, E, D, ?)

### Footer
- [ ] Privacy Policy link works
- [ ] "Made with ❤️ by Goodish" link opens in new tab
- [ ] Contact link opens email client
- [ ] All links have visible hover/focus states

## Privacy Page

### Content
- [ ] All sections render correctly
- [ ] Email handling section is present and accurate
- [ ] Privacy icon renders
- [ ] Contact email link works
- [ ] Page is readable top to bottom

## Sample Data Flow

### Loading
- [ ] "Try Sample Data" button triggers email gate (if not bypassed)
- [ ] After email submission, navigates to Samples page
- [ ] All 6 platform sample cards render
- [ ] Individual "Load" buttons work
- [ ] "Load All Samples" button works
- [ ] Progress bar updates as samples load
- [ ] Success states appear for loaded samples
- [ ] Total item count displays correctly

### Dashboard Navigation
- [ ] After all samples load, "View Dashboard" button appears
- [ ] Clicking "View Dashboard" navigates to populated dashboard
- [ ] Charts render with sample data
- [ ] No console errors during navigation

## File Import (Drag & Drop)

### Basic Functionality
- [ ] Drop zone is visible and clearly labeled
- [ ] Drag-and-drop accepts .json, .js, .zip files
- [ ] File input fallback works (click to browse)
- [ ] Multiple files can be dropped at once
- [ ] File chips show filename and size

### Progress & Errors
- [ ] Progress stepper shows current step
- [ ] Error states display user-friendly messages
- [ ] Retry button appears on errors
- [ ] Error console shows failed imports
- [ ] Clear errors button works

## Dashboard

### Empty State
- [ ] Clear message explaining how to load data
- [ ] "Try Sample Data" and "Get Started" CTAs present
- [ ] No broken charts or layout issues

### Loaded State
- [ ] Topic mix chart renders
- [ ] Ad vs organic donut chart renders
- [ ] Top creators table renders
- [ ] Sentiment trend line chart renders
- [ ] All data is accurate and matches imported items

## Keyboard Navigation

### Tab Order
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] All interactive elements are reachable via Tab
- [ ] No keyboard traps (can tab out of modals with Escape)

### Focus Indicators
- [ ] All focused elements have visible focus rings
- [ ] Focus rings use brand color (#01B1C0)
- [ ] Focus rings are 2px solid with 2px offset

### Modals
- [ ] Focus is trapped inside open modals
- [ ] Escape key closes modals
- [ ] Focus returns to trigger element after modal closes

## Accessibility

### Screen Readers
- [ ] All images have `alt` text or `aria-label`
- [ ] All icon buttons have `aria-label`
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages have `aria-describedby` on inputs
- [ ] Modals have `role="dialog"` and `aria-modal="true"`

### Color Contrast
- [ ] All text meets WCAG AA standards (4.5:1 for normal text)
- [ ] Large text meets WCAG AA standards (3:1 for 18pt+)
- [ ] Brand color (#01B1C0) on white passes contrast check
- [ ] Accent color (#725cfd) on white passes contrast check

### Reduced Motion
- [ ] All animations stop when `prefers-reduced-motion: reduce`
- [ ] Transitions are minimal or instant
- [ ] Page remains functional without animations

## Performance

### Page Load
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Interactions
- [ ] Sample data loads in < 2 seconds
- [ ] Dashboard renders in < 500ms after data load
- [ ] No frame drops during animations
- [ ] Charts render smoothly

### Bundle Size
- [ ] Main JS bundle < 500KB (gzipped)
- [ ] No unnecessary dependencies

## Privacy & Security

### Network Requests
- [ ] No analytics scripts present
- [ ] No tracking pixels or beacons
- [ ] No external API calls (except Beehiiv if configured)
- [ ] CSP headers block unauthorized scripts (if deployed)

### Data Storage
- [ ] Email stored in `localStorage` under `algorithm-lens-email`
- [ ] Data stored in IndexedDB under `algorithm-lens-storage`
- [ ] "Delete All" button clears all local data
- [ ] Clearing browser data removes all traces

### Privacy Policy
- [ ] Accurately describes local-only processing
- [ ] Explains email handling for both modes
- [ ] Provides clear unsubscribe instructions
- [ ] Contact email is working

## Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work correctly
- [ ] No console errors
- [ ] Styles render correctly

### Firefox
- [ ] All features work correctly
- [ ] No console errors
- [ ] Styles render correctly

### Safari
- [ ] All features work correctly
- [ ] No console errors
- [ ] Styles render correctly
- [ ] IndexedDB persists correctly

## Mobile Testing

### iOS Safari
- [ ] All features work on iPhone
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scroll
- [ ] Pinch-to-zoom works

### Android Chrome
- [ ] All features work on Android
- [ ] Touch targets are at least 48x48px
- [ ] No horizontal scroll

## Error Scenarios

### Invalid Email
- [ ] Shows validation error
- [ ] Submit button is disabled
- [ ] Error message is clear

### Network Failure (Beehiiv mode)
- [ ] Falls back to local-only gracefully
- [ ] No unhandled promise rejections
- [ ] User is not blocked from proceeding

### Corrupted Sample Files
- [ ] Error is caught and logged
- [ ] User sees friendly error message
- [ ] App remains functional

### Empty Import
- [ ] Detects empty files
- [ ] Shows appropriate message
- [ ] Doesn't break dashboard

## SEO

### Meta Tags
- [ ] Title tag is descriptive
- [ ] Meta description is compelling (< 160 chars)
- [ ] Open Graph tags are present
- [ ] Twitter Card tags are present
- [ ] Favicon loads correctly

### Social Sharing
- [ ] OG image displays when shared on Facebook
- [ ] Twitter card displays correctly
- [ ] LinkedIn preview looks good

## Documentation

### README
- [ ] Installation steps are clear
- [ ] Email gate setup is documented
- [ ] Environment variables are explained
- [ ] .env.example exists and is accurate

### Code Comments
- [ ] Complex functions have JSDoc comments
- [ ] TODO comments are addressed or removed
- [ ] Rationale is documented for non-obvious decisions

---

## Test Results

| Date       | Tester | Passed | Failed | Notes |
|------------|--------|--------|--------|-------|
| YYYY-MM-DD |        |        |        |       |

## Blocker Issues

None currently.

## Known Issues (Non-blocking)

None currently.
