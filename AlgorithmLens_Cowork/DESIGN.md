# AlgorithmLens Design System

## 1. Brand context

AlgorithmLens is an iOS app that analyzes a user's social media feed across YouTube, Instagram, TikTok, X, Facebook, and Reddit. It captures the feed as the user scrolls, sends frames to a vision model, and produces a dashboard showing what was actually shown: top sources, ad density, political content exposure, emotional tone, and the ratio of suggested to followed content.

The brand voice is "epistemic restraint." We describe what is in the feed without overclaiming algorithmic intent. We do not say "the algorithm wants you to see this." We say "67 percent of what you saw came from accounts you do not follow." We trust the user to draw their own conclusions from accurate, well-presented data.

The product feels calm, restrained, and data-first. It is the opposite of most social media adjacent apps, which use color, motion, and gamification to drive engagement. AlgorithmLens uses generous whitespace, a tight palette, and typography that does the work.

## 2. Visual foundations

Three reference points, used in combination:

- Oura Ring score cards. The trust signal is "we made sense of your data for you." A big single-number hero with a plain-language interpretation label sits at the top of any data-dense screen. Domain-specific scores live in cards beneath.
- FanDuel expandable bet rows. Dense rows that tap to expand. Predictable structure across many items. The user can scan twenty items in seconds and expand only the ones that earn attention.
- Apple iOS native aesthetic. SF Pro typography, generous whitespace, no decorative elements that do not earn their place, native-feeling controls.

## 3. Color tokens

The palette is intentionally narrow. Decorative color is forbidden.

- --bg-primary: #FFFFFF (pure white background)
- --bg-secondary: #F7F7F8 (subtle off-white for grouped sections)
- --text-primary: #0A0A0A (near-black, used for all primary content)
- --text-secondary: #6B6B70 (gray, used for metadata and labels)
- --text-tertiary: #A0A0A5 (light gray, used sparingly for de-emphasis)
- --border: #E5E5EA (hairline dividers and card borders)
- --brand-primary: #007AFF (iOS system blue, used for primary actions and selected states only)
- --success: #34C759 (iOS system green, used for positive states only, e.g. high source diversity)
- --caution: #FFCC00 (iOS system yellow, used ONLY for low-sample-size warnings or interpretive caveats)
- --destructive: #FF3B30 (iOS system red, used ONLY for destructive confirmations such as delete session)

Forbidden colors in this design system: orange, purple, pink, teal, brown, and any gradient. If a screen feels like it needs decorative color, it does not. Add whitespace instead.

## 4. Typography

System font stack: SF Pro Display, SF Pro Text, fallback to -apple-system, BlinkMacSystemFont, Segoe UI, Roboto.

Type scale:

- --type-hero: 64px / 72px line height / weight 600 (used once per screen for the headline metric)
- --type-display: 32px / 38px / weight 600 (used for screen titles)
- --type-heading: 22px / 28px / weight 600 (used for section headings)
- --type-subheading: 17px / 22px / weight 600 (used for card titles)
- --type-body: 16px / 22px / weight 400 (default body text)
- --type-body-strong: 16px / 22px / weight 600 (emphasis within body)
- --type-caption: 13px / 18px / weight 400 (used for metadata and disclosure rows)
- --type-micro: 11px / 14px / weight 500 / letter-spacing 0.5px / uppercase (used for tab labels and small section labels only)

Numbers in hero positions use tabular figures (font-variant-numeric: tabular-nums) so they do not jitter when values change.

## 5. Spacing and layout

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (in pixels).

Default screen padding on mobile: 20px horizontal, 24px vertical.

Card internal padding: 20px on all sides.

Vertical rhythm between cards: 12px.

Vertical rhythm between distinct sections: 32px.

Mobile design dimensions: iPhone, 390px wide. All layouts are designed mobile first.

## 6. Component patterns

### 6.1 Hero stat
A single large number with a plain-language interpretation label below it. No decoration, no chart, no progress ring. The number uses --type-hero. The interpretation label uses --type-subheading and sits 8px below the number. A one-line description in --type-body (color --text-secondary) sits 4px below the label.

### 6.2 Expandable domain card
The primary repeating component on dense screens. Collapsed state shows: section icon (16px, monochrome, color --text-secondary), card title (--type-subheading), headline metric on the right (--type-heading, tabular figures), chevron indicator (12px, color --text-tertiary).

Tapping anywhere on the card expands it to reveal supporting data. Expanded state preserves the collapsed header and adds detail content below with 16px top padding.

Cards use a 12px corner radius and a 1px border in --border. No shadow.

### 6.3 Tab bar
Horizontal scrollable tab bar at the top of multi-section screens. Active tab uses --brand-primary text and a 2px underline in --brand-primary. Inactive tabs use --text-secondary. No pill backgrounds, no colored dots.

### 6.4 Disclosure row
A reusable About this analysis row appears at the bottom of data-dense screens. Compact (44px tall), with a small info icon on the left, label text in --type-caption color --text-secondary, and a chevron on the right. Tapping it opens a sheet that explains the data behind the screen, including frames analyzed, session length, and a one-sentence epistemic disclaimer.

### 6.5 Caution badge
Used only when the underlying sample size is too small to be confident. Shows a 12px caution icon and a one-line message in --type-caption, color --text-primary, against a --caution background tinted to 12 percent opacity. Pill-shaped, 8px vertical padding, 12px horizontal padding.

### 6.6 Primary button
Filled rectangle with --brand-primary background, white text in --type-subheading, 12px corner radius, 14px vertical padding, full-width on mobile. No gradient, no shadow.

### 6.7 Secondary button
Same dimensions as primary. Background --bg-primary, 1px border in --border, text in --text-primary.

## 7. Motion and interaction

Motion is calm and native. Springs use iOS defaults: response 0.5, damping 0.8.

Card expand and collapse animates over 280ms with a soft spring. Content fades in over the last 120ms.

No bounce, no parallax, no celebratory animations. Even success states are quiet.

## 8. Accessibility

Minimum contrast 4.5:1 for body text, 3:1 for large text. All hero numbers and headings comfortably exceed this.

Dynamic Type support is required. All type sizes are starting points that scale with the user preferred text size.

Tap targets are 44px minimum on all sides.

Every chart, hero number, and badge has a VoiceOver label that says the data in plain language.

## 9. Voice and copy rules

- No em dashes anywhere in UI strings. Use commas, semicolons, colons, parentheses, or two short sentences.
- No exclamation points.
- No hype words: powerful, incredible, amazing, revolutionary. Avoid.
- Prefer "what you saw" over "what you were shown."
- Prefer specific numbers over qualitative claims. "67 percent" not "a lot."
- Plain-language interpretations sit alongside numbers, never replace them.
- When sample size is low, say so plainly: "Based on 12 frames. Interpret with care."
- Headers are sentence case, not title case: "Top sources," not "Top Sources."

## 10. Do and Do Not

Do
- Let typography carry the visual hierarchy.
- Use whitespace as a primary design element.
- Show numbers with their unit and a one-line interpretation.
- Reuse the expandable card pattern across all data domains.

Do Not
- Introduce orange, purple, pink, teal, or any gradient.
- Use icons decoratively. Icons appear only when they serve a function.
- Use progress rings, bar charts, or pie charts on the Overview screen. Save visual chart types for deeper-dive screens where the user has opted in.
- Add streak counters, badges, gamification, or social-proof elements. They do not belong here.
- Use em dashes in copy.
