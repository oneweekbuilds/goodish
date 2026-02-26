# AlgorithmLens — Claude Code Project Instructions

## Project Overview
AlgorithmLens is a consumer AI transparency tool that analyzes social media feeds with "epistemic restraint." It consists of three platforms:
- **Website** — Main marketing and dashboard site
- **Chrome Extension** — Browser extension for real-time feed analysis
- **Mobile App** — React Native mobile companion

## Dashboard Structure
The dashboard has six tabs:
1. Overview
2. Sources
3. Ads
4. Politics
5. Tone
6. Suggested vs. Followed

## Critical: Epistemic Restraint Standards
Marketing and homepage copy:
- It IS acceptable to state that algorithms optimize for engagement
- It IS acceptable to say algorithms are designed to keep users scrolling
- Avoid specific unverifiable claims about individual platform mechanics (e.g., don't say "TikTok uses X specific technique")

Dashboard analysis tabs (specific user data):
- Describe observable patterns: "Your feed contains 70% content from accounts you don't follow"
- Use hedging language for specific data interpretations: "This pattern may suggest..." or "Based on observable data..."
- NEVER anthropomorphize the algorithm with emotions or desires: "The algorithm wants you to..."

## Code Conventions
- Use existing component patterns from the Overview tab as reference
- Follow the CSS framework already in use
- Write tests for new features
- Keep console clean (no warnings in production)

## When Running Ralph Loops
- Check plan.md for current priorities if it exists
- Log progress to activity.md after each iteration
- If stuck for 5+ iterations on the same issue, document the blocker and move on
