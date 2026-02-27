# Design Patterns Reference

## Tab Layout Pattern

Each of the six tabs follows the same structural pattern:

```
┌─────────────────────────────────────┐
│  HEADLINE INSIGHT                   │  ← Largest text, most prominent
│  "62% of your feed was suggested"   │     Readable in under 3 seconds
├─────────────────────────────────────┤
│                                     │
│  PRIMARY VISUALIZATION              │  ← Main chart or metric display
│  (donut chart, bar chart, etc.)     │     Clean, labeled, immediately clear
│                                     │
├─────────────────────────────────────┤
│  SUPPORTING METRICS                 │  ← Secondary data points
│  Smaller text, lighter weight       │     Available but not competing
│  Grouped logically                  │     with headline for attention
├─────────────────────────────────────┤
│  ▼ EXPANDABLE DETAIL               │  ← Progressive disclosure
│  (collapsed by default)             │     For users who want to dig deeper
│  Methodology notes, full breakdowns │
└─────────────────────────────────────┘
```

## Color Palette Guidelines

### Category Colors (for charts and indicators)
Use muted, desaturated tones. Think watercolors, not neon signs.

- Suggested content: soft blue-gray
- Followed content: soft teal or sage
- Ads/sponsored: soft amber or warm gray
- Political: soft slate or muted blue
- Tone categories: use a muted gradient within a single hue family

### Status Colors
- Neutral/informational: soft gray, light blue
- Change indicator (increase): muted teal (NOT green — avoid traffic-light metaphors)
- Change indicator (decrease): muted slate (NOT red — avoid alarm associations)

### Colors to NEVER Use
- Bright red (#FF0000 or similar) — feels like an error or danger
- Warning yellow (#FFD700 or similar) — feels alarming
- Neon anything — feels aggressive
- Pure black on pure white at large sizes — feels harsh (use dark gray on off-white)

## Typography Scale

```
Headline metric:    32-40px, bold (700)
Tab title:          20-24px, semibold (600)
Section header:     16-18px, semibold (600)
Body text:          14-16px, regular (400)
Caption/tooltip:    12-13px, regular (400), lighter color
```

## Empty State Pattern

When data is not yet available (e.g., trends for a user with only one scan):

```
┌─────────────────────────────────────┐
│                                     │
│        [Subtle illustration         │
│         or icon — optional]         │
│                                     │
│   "You'll see trends here after     │
│    your second scan."               │
│                                     │
│   "Each snapshot adds to your       │
│    personal feed history."          │
│                                     │
│    [ Scan Now ]  (optional CTA)     │
│                                     │
└─────────────────────────────────────┘
```

Rules for empty states:
- Tone is encouraging and forward-looking
- Explain what will appear here and when
- Never say "No data" or "Error" or "Nothing to show"
- Optionally include a call-to-action that helps the user get to the state where data will appear

## Tooltip Pattern

Tooltips should proactively explain methodology:

```
"Political content" ⓘ
┌─────────────────────────────────────┐
│ Posts categorized as political       │
│ based on mentions of elected         │
│ officials, government institutions,  │
│ legislation, or civic events.        │
│                                     │
│ This categorization is approximate   │
│ and may not capture all political    │
│ content.                             │
└─────────────────────────────────────┘
```

Rules for tooltips:
- Explain the methodology behind the metric
- Acknowledge limitations of the categorization
- Use plain, accessible language
- Keep under 50 words when possible
- Never use jargon without explanation

## Upgrade Prompt Pattern (for free users viewing premium features)

```
┌─────────────────────────────────────┐
│                                     │
│   "See how your feed changes        │
│    over time"                        │
│                                     │
│   Trend analysis shows shifts in     │
│   your feed composition across       │
│   multiple snapshots.                │
│                                     │
│    [ Start Free Trial ]              │
│                                     │
└─────────────────────────────────────┘
```

Rules for upgrade prompts:
- Describe the value, not the restriction
- Feel like an invitation, not a paywall
- Never use "Locked" or "Restricted" or "Upgrade required"
- One calm CTA button
- No urgency language
