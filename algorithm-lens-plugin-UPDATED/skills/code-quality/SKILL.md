---
name: code-quality
description: >
  This skill should be used when "writing code", "reviewing code", "fixing bugs",
  "adding features", "refactoring", "creating functions", "handling errors",
  or doing any implementation work on the AlgorithmLens project. Also use when
  checking code for production readiness or reviewing pull requests.
version: 0.1.0
---

# Code Quality Standards for AlgorithmLens

All code in AlgorithmLens must be production-ready. The founder does not write code directly — AI tools generate all code, which makes these standards essential for maintaining quality and trust.

## Non-Negotiable Rules

### No Placeholders in Production Code
- Never leave `TODO` comments in production paths
- Never use `// placeholder` or `# implement later`
- Never insert mock data in production code paths
- Never write stub functions that do nothing
- Every function must be complete and operational
- If a feature is not ready, it should not exist in the codebase at all — do not leave half-built scaffolding

### Explicit Error Handling
- Every function that can fail must handle errors explicitly
- Never silently swallow errors with empty catch blocks
- Log errors in a structured format that aids debugging
- Return meaningful error messages to API consumers
- Frontend must display user-friendly error states, not raw error text
- Distinguish between user errors (400-level) and system errors (500-level)

### Secrets and Configuration
- All secrets, API keys, and credentials must live in environment variables
- Never hardcode sensitive values in source files
- Never commit `.env` files to version control
- Use `.env.example` files to document required variables (without actual values)
- Different environments (dev, staging, production) must use different credentials

### Checkpoint Commits
- Before making risky changes, suggest a checkpoint commit message
- This preserves a known-good state to roll back to
- Tag milestone moments in the git history
- Commit messages should describe what changed and why

## Code Organization

- Functions should do one thing and do it well
- Name functions and variables descriptively — code should be self-documenting
- Group related functionality into modules
- Keep files focused — if a file is doing too many things, split it
- Follow existing patterns in the codebase rather than introducing new ones unnecessarily

## Detailed Reference

For language-specific conventions and patterns used in this project, read `references/conventions.md`.
