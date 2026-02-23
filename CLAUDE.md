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
ALL analysis text MUST follow these rules:
- Describe observable patterns: "Your feed contains 70% content from accounts you don't follow"
- Use hedging language: "This pattern may suggest..." or "Based on observable data..."
- NEVER speculate on algorithmic intent: "The algorithm wants you to..."
- NEVER anthropomorphize the algorithm: "The algorithm is trying to..."
- NEVER make causal claims: "This is designed to keep you scrolling"

## Code Conventions
- Use existing component patterns from the Overview tab as reference
- Follow the CSS framework already in use
- Write tests for new features
- Keep console clean (no warnings in production)

## When Running Ralph Loops
- Check plan.md for current priorities if it exists
- Log progress to activity.md after each iteration
- If stuck for 5+ iterations on the same issue, document the blocker and move on
