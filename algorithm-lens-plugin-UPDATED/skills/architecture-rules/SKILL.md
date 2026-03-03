---
name: architecture-rules
description: >
  This skill should be used when making changes to the AlgorithmLens codebase,
  including "adding features", "refactoring code", "moving logic between files",
  "creating new endpoints", "modifying the Chrome extension", "updating the
  frontend", or "changing the backend". Also use when reviewing architecture
  decisions or planning new components.
version: 0.1.0
---

# Architecture Rules for AlgorithmLens

AlgorithmLens enforces strict separation of concerns across four layers. Every change must respect these boundaries.

## The Four Layers

### 1. Chrome Extension — Capture Only
- Collects structured feed data from social media platforms
- Transmits snapshot data securely to the backend
- Lives in a separate folder from the main codebase
- Must NEVER process, categorize, or analyze feed data
- Must NEVER render dashboard UI
- Must NEVER store data beyond what is needed for transmission

### 2. Backend (Python) — Processing Only
- Receives raw snapshot data from the extension
- Processes snapshots into analyzable categories
- Exposes secure API endpoints for the frontend
- Validates incoming data before persistence
- Handles Stripe webhook events and subscription management
- Must NEVER render HTML or UI components
- Must NEVER handle snapshot capture logic
- Processing should be deterministic when possible to improve reproducibility

### 3. Frontend (React + Vite) — Rendering Only
- Renders processed data into the six-tab dashboard
- Lives in `apps/alg-gemini`
- Manages UI state, navigation, and user interactions
- Implements feature gating at the UI layer for premium features
- Must NEVER process raw snapshot data
- Must NEVER communicate directly with the Chrome extension
- Must NEVER handle payment processing logic (only display subscription status)

### 4. Database — Storage Only
- Stores user snapshots linked to user identifiers
- Stores subscription status (`is_user_plus` flag)
- Schema prioritizes clarity over premature optimization
- Must NEVER contain business logic or processing rules

## Boundary Violations to Watch For

- Processing logic creeping into frontend components (e.g., categorizing posts in React)
- Rendering logic in backend endpoints (e.g., returning HTML from Python)
- The Chrome extension doing analysis instead of just capture
- Direct database queries from the frontend (must always go through backend API)
- Payment logic scattered across layers instead of centralized in the backend

## The Six Dashboard Tabs

The frontend renders exactly six tabs. This constraint is intentional.

1. **Overview** — Feed structure summary (source concentration, ad share, political presence, tone, suggested vs. followed ratio)
2. **Sources** — Origin analysis (followed vs. suggested accounts, creator concentration)
3. **Ads** — Monetized content (sponsored post count, promotional themes)
4. **Politics** — Civic/political content frequency (no partisan lean assignment)
5. **Tone** — Emotional categorization of posts (no psychological inference)
6. **Suggested vs. Followed** — Ratio of user-chosen content to algorithmically expanded content

## Tech Stack Reference

- Frontend: React, Vite, located in `apps/alg-gemini`
- Backend: Python
- Payments: Stripe
- Database: stores snapshots and subscription state
- Chrome Extension: separate repository/folder
- Deployment: Vercel (coming-soon site), production deployment pipeline in progress
- Monorepo: Multi-app Turborepo structure

## Detailed Reference

For architectural diagrams and data flow specifications, read `references/data-flow.md`.
