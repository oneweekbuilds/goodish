# Code Conventions Reference

## Python Backend Conventions

### Error Handling Pattern
```python
# GOOD — explicit error handling with meaningful messages
try:
    snapshot = process_snapshot(raw_data)
except ValidationError as e:
    logger.error(f"Snapshot validation failed: {e}", extra={"user_id": user_id})
    return {"error": "Invalid snapshot data", "details": str(e)}, 400
except ProcessingError as e:
    logger.error(f"Snapshot processing failed: {e}", extra={"user_id": user_id})
    return {"error": "Processing failed. Please try again."}, 500

# BAD — silent error swallowing
try:
    snapshot = process_snapshot(raw_data)
except:
    pass
```

### API Endpoint Pattern
```python
# Every endpoint should:
# 1. Validate input
# 2. Check authentication/authorization
# 3. Perform the operation
# 4. Return structured response
# 5. Handle errors explicitly
```

### Environment Variable Pattern
```python
# GOOD
import os
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
if not STRIPE_SECRET_KEY:
    raise EnvironmentError("STRIPE_SECRET_KEY is required")

# BAD
STRIPE_SECRET_KEY = "sk_live_abc123..."
```

## React Frontend Conventions

### Component Structure
- One component per file
- Component name matches filename
- Props should be typed (TypeScript) or documented
- State management should be local unless shared state is needed

### Error State Pattern
```jsx
// Every data-fetching component should handle:
// 1. Loading state
// 2. Success state (with data)
// 3. Error state (user-friendly message)
// 4. Empty state (no data yet — encouraging, not error-like)
```

### Feature Gating Pattern
```jsx
// Premium features must check subscription status
// UI should hide or disable premium elements for free users
// Never show premium features with a broken or empty state — either show them fully or show an upgrade prompt
```

## Git Conventions

### Commit Message Format
- Start with a verb: "Add", "Fix", "Update", "Remove", "Refactor"
- Be specific: "Fix Stripe webhook retry handling" not "Fix bug"
- Reference the layer affected when relevant: "[Backend] Add snapshot validation"

### Checkpoint Commits
- Create before risky refactors
- Format: "CHECKPOINT: [description of stable state]"
- Tag milestones: `git tag -a v0.x.x -m "description"`

### Branch Hygiene
- Feature branches for new work
- Never commit directly to main in production
- Keep branches short-lived and focused
