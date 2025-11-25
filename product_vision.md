AlgorithmLens – Product Vision (Antigravity Master Spec)

This file is the single source of truth for how AlgorithmLens should look, feel, and behave.
Every agent that works on this project should read this file first and follow it closely.

1. Product Overview

High level:
AlgorithmLens helps people understand what recommendation algorithms see and do in their feeds. The product:

Shows a simulated social feed with realistic posts.

Analyzes each post and the overall feed.

Explains in plain English how the algorithm interprets that content.

Highlights patterns, priorities, and possible biases.

Offers deeper, more advanced views for premium users.

The experience should feel like having a friendly, smart analyst sitting beside you, pointing out what the feed is doing in real time.

2. Target Users and Scenarios
2.1 Primary users

Curious everyday users

Non technical, non academic.

Use social media often, feel overwhelmed or uneasy about how feeds are shaped.

Want an explanation in simple language, not a research report.

Power users and professionals

Journalists, researchers, policy folks, and creators.

Want to see patterns, topics, and biases in more detail.

Comfortable with charts and data, but still want clear language and visual structure.

2.2 Core use cases

First time exploration

User lands on homepage.

Scrolls a demo feed to get a feel for the product.

Hovers the Lens over a post and sees what the algorithm might “see”.

Understands the value of AlgorithmLens within 10 seconds.

Session review

User uploads or streams a real session (future state).

Sees their own feed analyzed in depth.

Understands themes, dominant topics, and how the algorithm is shaping their experience.

Premium deep dive

User has a session open.

Switches to richer views: topic modeling, intensity over time, potential bias views, and “what the algorithm is likely to push next”.

The current phase should focus on making the homepage and demo session extremely clear, polished, and compelling, while preserving hooks for deeper functionality.

3. Brand Identity, Tone, and Voice

AlgorithmLens is a clarity tool. It should feel:

Trustworthy and honest.

Friendly and human.

Slightly playful, but not silly.

Journalistic rather than corporate.

Calm, calm, calm. Never frantic.

When someone lands on the homepage, they should think:

“This finally explains my feed in a way I can understand.”

3.1 What it is NOT

Not academic or jargon heavy.

Not flashy or highly animated in a distracting way.

Not dark, edgy, or conspiracy themed.

Not corporate enterprise software with dense tables.

3.2 Writing style

Sentences are short and clear.

Avoid jargon where possible.

When a technical term is required, give a 1 sentence explanation near it.

Use second person (“you”) often.

Prefer verbs like “see”, “understand”, “notice”, “spot”, “track” instead of “leverage” or “utilize”.

Example tone:

“See what the algorithm thinks you care about.”
“Spot patterns in your feed that you might not notice at a glance.”

4. Visual Design System
4.1 Colors

Use a calm, modern, light theme by default.

Base background: Soft off white or very light warm gray. Pages should feel bright and breathable.

Surface cards: Slightly darker white or light gray panels with subtle shadows.

Primary accent: Use the existing AlgorithmLens brand color (the main purple or similar accent already in the repo). Agents should reuse this instead of inventing new colors.

Secondary accent: A soft complementary color used sparingly for highlights or secondary buttons.

Category colors: A small, stable set of colors reused consistently for content categories (for example, news, politics, lifestyle, wellness, sports). Each category should always have the same color.

Feedback colors:

Green or teal for positive or “healthy” patterns.

Amber for “watch this” or “skewed pattern”.

Red only for strong warnings and used rarely.

4.2 Typography

Use a single, modern, sans serif font throughout the product.

Define a clear type scale. For example:

H1 (page title): Very large, bold, used in hero section.

H2 (section title): Large, bold, used for main sections like “Your Feed Analysis”.

H3 (subtitles): Medium-large, semi bold, used inside cards.

Body: Medium size, comfortable line height.

Small text: For labels and annotations only. Never cram important explanations into tiny text.

Rules:

Do not exceed 2 or 3 sizes within a single card.

Hero area should have large title and one paragraph of supporting text, never a wall of text.

Ensure line height is generous, so text never feels crowded.

4.3 Spacing and Layout

Spacing is critical. The current UI issues are mostly cramped spacing and misaligned components.

Rules:

Use a consistent spacing scale (for example 4, 8, 12, 16, 24, 32 pixels). Agents can pick a scale and reuse it everywhere.

Never place text or components directly against the edge of a card. There should always be visible padding.

Section spacing:

Extra large padding around hero.

Medium spacing between homepage sections.

Small but consistent spacing between items inside a card.

4.4 Cards and Surfaces

Most content should live inside cards.

Card rules:

Slightly rounded corners.

Subtle shadow or border, not harsh.

Consistent padding inside.

Title at top, then content, then optional footer (for example, “Last updated” or “Part of Premium”).

4.5 Icons and Visual Elements

Icons should be simple line icons, not overly detailed.

Use icons to reinforce meaning, not as decoration.

Example uses:

Eye icon for “what the algorithm sees”.

Tag icon for categories.

Clock or calendar for time based patterns.

Triangle or play icon for “next” or “upcoming content”.

5. Layout and Navigation
5.1 Global layout

A simple top navigation bar with:

Logo / brand on left.

Key links on right (for example: “How it works”, “Pricing”, “Sign in”).

On small screens, nav collapses into a hamburger menu.

5.2 Page width

Content should be centered with a max width.
The app should not stretch edge to edge on very large monitors.

The feed may be slightly wider than supporting sidebars, but everything should stay readable.

6. Homepage Vision (Detailed)

The homepage should function as a guided mini AlgorithmLens session using dummy data.

Someone should be able to scroll from top to bottom and understand:

What AlgorithmLens is.

What it does to a feed.

Why that matters.

What extra value premium unlocks.

6.1 Section A – Hero

Goals:

Explain the core idea in one sentence.

Show a simple, strong visual that hints at the Lens and analysis.

Content:

Hero title example:
“See what your feed is really showing you.”

Subtitle example:
“AlgorithmLens turns your scrolling into a clear picture of what the algorithm thinks you want, so you can see patterns, priorities, and blind spots.”

Elements:

Primary call to action button: “Try a demo session”.

Secondary link: “How AlgorithmLens works”.

On the right or just below: a visual card that shows:

A sample feed post.

The Lens hovering over it.

A small bubble with 2 or 3 short insights (for example, “Category: Wellness”, “Boosted by your past likes”, “Similar posts increased 40 percent this week”).

Spacing:

Plenty of space above and below.

No clutter or secondary cards crowding the hero.

6.2 Section B – Scrolling Demo Feed

This is a key differentiator. The user scrolls through a simulated feed and sees AlgorithmLens in action.

Layout:

Left: vertical feed of posts.

Right: pinned analysis area that updates when different posts are in focus.

Or, on smaller screens, analysis appears directly below each active post.

Each feed item should include:

Visual area (image placeholder or gradient block).

Short title or description of the content.

Small meta row:

Source type (for example, “Video recommendation”, “Friend post”, “Ad” if needed later).

Time or ordering hint.

Each post has an associated analysis, which appears in the panel:

Category tags (for example, “Fitness”, “Productivity”, “Politics”).

Sentiment or emotional tone.

Predicted engagement (for example, “High”, “Medium”, “Low”).

Key signals (for example, “You interacted with similar posts recently”, “Similar to videos you watched to the end”).

Simple explanation sentence.

Example explanation sentence:

“The algorithm is boosting this because you often watch wellness videos until the end and click on similar accounts.”

Interaction:

As the user scrolls, the analysis area should clearly show which post is being analyzed (highlighted card or active state).

If a lens overlay is used, it should lock to the currently active post.

6.3 Section C – The Lens Interaction

The Lens is the recognizable interaction pattern.

Goals:

Make the Lens feel intuitive, not gimmicky.

Give a small moment of delight: when hovering or tapping the lens, the explanation appears.

Behavior:

The Lens appears as a circular or rounded shape that slightly hovers over a post.

When user hovers or focuses on the lens, a clear panel appears that explains:

“What the algorithm sees.”

“Why this is here.”

“What it might show next.”

The panel should avoid long paragraphs. Use:

1 short sentence summary.

3 to 5 bullet points or labeled fields.

Optional “Learn more” link that leads to deeper explanations later.

Examples of copy:

“The algorithm classifies this as: wellness, productivity, self improvement.”

“It is showing this because: you engaged with similar content 5 times this week.”

“Next, it may show: more creators in this niche, similar inspirational videos.”

6.4 Section D – Premium Preview

The user should quickly see what they get for free compared to premium.

Layout:

Two side by side cards or a comparison strip.

Left: “Free” card.

Right: “Premium” card.

Free card might show:

Feed with basic labels.

Simple category tags.

Short text explanation.

Premium card might show:

Heatmap or chart of content categories over time.

Topic breakdown for a session.

“Balance” indicator (for example, too much of one topic).

Extended insights like: “Your feed is 70 percent from the same 15 accounts.”

Copy example:

Free: “See what each post is classified as and why it appears.”

Premium: “Zoom out to see patterns, trends, and potential blind spots across entire sessions.”

Do not rely on huge long lists of features. Keep it visual and outcome focused.

6.5 Section E – How It Works

A simple three or four step explanation, visually laid out in cards or a horizontal timeline.

Steps example:

“Capture what you see”

Description: “Connect your device or use our demo feed to create a snapshot of your scrolling.”

“AlgorithmLens analyzes your session”

Description: “We classify each post, estimate what signals the algorithm is using, and look for patterns.”

“You see patterns in plain language”

Description: “Get a clear view of categories, repetition, and what your feed is training you to expect.”

“You decide what to do next”

Description: “Reflect, share with others, or use insights for research or reporting.”

6.6 Section F – Trust and Purpose

Short section that clarifies:

AlgorithmLens is about understanding, not fear.

Privacy: sessions are treated carefully (even if this is demo for now).

Focus on helping people feel informed rather than manipulated.

Keep this concise, but present. A small paragraph or 2 cards is enough.

6.7 Footer

Links to:

About

Privacy Policy

Contact

Small, calm styling.

7. Feed and Analysis Experience (Beyond Homepage)

Even though the current effort is homepage focused, the rest of the app should follow these rules when working on it later.

7.1 Feed layout

Posts appear in a clean vertical list.

Active or selected post is clearly indicated.

The analysis panel updates with context for the active post.

On desktop, analysis panel can be pinned on the side.

On mobile, analysis appears directly below the selected post.

7.2 Types of analysis

Initial version can be simple, but the architecture should support:

Category tagging.

Sentiment or tone.

Source type (friend, brand, ad, recommendation).

Engagement prediction.

Repetition detection (how often similar content appears).

Bias hints (for example, “Most political posts lean in one direction”).

7.3 Plain language

Every analysis block should include a human readable summary, like:

“Most of your recommended posts this session are about productivity and self improvement, often with intense motivational framing.”

8. Lens Interaction Details

Agents should treat the Lens as a reusable component.

8.1 Component behavior

The Lens component:

Receives data about the current post.

Displays a clean summary and a couple of key attributes.

Can be reused on homepage, dashboard, and premium views.

8.2 Visual states

Rest state: lens icon visible, subtle.

Hover or focus state: glows slightly, or grows subtly.

Open state: a card appears with insights.

8.3 Performance

Animations should be smooth and not jittery.

Avoid heavy transitions that may feel sluggish.

9. Free vs Premium Experience

Even if the full gating is not implemented, structure the UI with this distinction in mind.

9.1 Free

Access to:

Demo session on homepage.

Basic session runs (eventually).

Simple labels and per post explanations.

Visual treatment:

Neutral cards, no lock icons over everything.

Occasional, gentle premium prompts.

9.2 Premium

Access to more:

Session overview dashboards.

Timeline of topics.

“Balance” and “intensity” visualizations.

Export options and deeper insights.

Visual treatment:

Premium sections clearly marked, but not aggressive.

Use a subtle accent or badge like “Premium view”.

10. Responsive Behavior

The app must be usable on desktop and mobile.

10.1 Desktop

Feed and analysis can sit side by side.

Charts can spread horizontally.

Navigation is visible in the header.

10.2 Tablet

Either one column with collapsible analysis, or two narrower columns.

Make sure tap targets are large.

10.3 Mobile

Single column layout.

Feed appears first.

When a post is active, its analysis appears below it or in a slide up panel.

Navigation collapses into a simple menu.

11. Accessibility

Accessibility is required, not optional.

Text must have sufficient contrast.

Never encode meaning only in color. Use labels and icons too.

Hover only effects need accessible alternatives, such as focus states and clicks.

Buttons and interactive elements must be large enough for touch.

Make sure important information is not hidden behind hover only states on mobile.

12. Agent Guidelines and Technical Guardrails

These instructions are mainly for the agents working inside Antigravity.

12.1 Do not

Do not introduce new libraries without being explicitly asked.

Do not rewrite the entire backend.

Do not move large directory structures without a clear plan.

Do not rename major components without noting it in a summary.

Do not remove the existing Lens logic outright. It can be refactored, but not thrown away.

12.2 Do

Prefer incremental refactors over complete rewrites.

Reuse existing design tokens, colors, and utilities where possible.

Add comments in code when making significant functional changes.

After changes, always:

Run the app.

Use the browser agent to navigate to the affected pages.

Provide a short summary of:

What was changed.

How it looks.

Any known limitations.

12.3 Browser verification as standard

After any non trivial change:

Launch the dev server.

Use the browser agent to:

Open the homepage.

Scroll through the feed.

Interact with the Lens if present.

Provide a screenshot or video artifact so a non coder can verify visually.

13. Non Goals (For Now)

To keep scope under control, these are not immediate priorities, even if the codebase has hints of them:

Complex multi session comparison views.

Detailed export pipelines.

Full user account system and auth overhaul.

Highly configurable settings pages.

Dark mode.

Agents should not spontaneously build these without direction.

14. Definition of Success for Current Phase

For the upcoming work, success means:

The homepage feels like a polished mini AlgorithmLens session:

Strong, clean hero.

Scrollable demo feed.

Clear analysis.

Visible Lens experience.

Simple premium preview.

Clear, human “How it works” section.

The UI looks and feels:

Spacious, aligned, and consistent.

Visually modern and professional.

Easy for a non technical user to parse quickly.

All changes can be verified visually by a non coder, through screenshots or browser recordings, without reading any code.

If an agent is unsure about a design decision, it should lean toward clarity, spacing, and simplicity, rather than complexity or cleverness.