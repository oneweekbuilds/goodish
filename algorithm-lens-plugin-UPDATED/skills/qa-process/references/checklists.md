# QA Checklists by Feature Area

## Dashboard — All Six Tabs

### Overview Tab
- [ ] Loads without errors
- [ ] Displays source concentration metrics
- [ ] Displays commercial content share
- [ ] Displays political presence indicator
- [ ] Displays tonal distribution
- [ ] Displays suggested vs. followed ratio
- [ ] Headline insight is prominent and immediately readable
- [ ] All labels use epistemically restrained language

### Sources Tab
- [ ] Distinguishes followed vs. suggested accounts
- [ ] Shows creator concentration
- [ ] No moral labeling of sources
- [ ] Metrics are proportional (percentages, not raw counts alone)

### Ads Tab
- [ ] Quantifies sponsored material
- [ ] Categorizes promotional themes when identifiable
- [ ] No accusatory language about advertising

### Politics Tab
- [ ] Identifies overt civic/political content
- [ ] Does NOT assign partisan lean
- [ ] Does NOT speculate on ideological intent
- [ ] Measures frequency only

### Tone Tab
- [ ] Categorizes posts into emotional buckets
- [ ] Does NOT make psychological inferences
- [ ] Does NOT claim to diagnose mood effects
- [ ] Categories are clearly labeled with methodology tooltips

### Suggested vs. Followed Tab
- [ ] Clearly shows ratio of user-chosen vs. algorithmic content
- [ ] Framing is descriptive, not judgmental
- [ ] Headline insight communicates the key finding in under 3 seconds

## Payment Flow

- [ ] Stripe checkout initiates correctly
- [ ] Successful payment flips `is_user_plus` to true
- [ ] Webhook signature validation works in production mode
- [ ] Failed payments do not grant access
- [ ] Trial starts correctly (14 days)
- [ ] Trial expiration transitions user to free tier
- [ ] Cancellation revokes Plus access
- [ ] Subscription renewal maintains Plus access
- [ ] Billing portal is accessible
- [ ] Webhook handling is idempotent (processing same event twice is safe)
- [ ] Annual and monthly pricing both work

## Security

- [ ] No API keys or secrets in source files
- [ ] Environment variables are used for all configuration
- [ ] `.env` is in `.gitignore`
- [ ] API endpoints require authentication where appropriate
- [ ] Input validation on all API endpoints
- [ ] CORS is configured correctly
- [ ] Stripe webhook endpoint validates signatures
- [ ] No sensitive data in client-side code or logs

## Chrome Extension

- [ ] Captures feed data correctly
- [ ] Does NOT process or analyze data
- [ ] Transmits data securely (HTTPS)
- [ ] Handles network failures gracefully
- [ ] Meets Chrome Web Store requirements
- [ ] Permissions are minimal and justified

## Feature Gating

- [ ] Free users see all six tabs for individual snapshots
- [ ] Free users cannot access longitudinal trends
- [ ] Plus users see trend analysis
- [ ] API returns 403 for premium endpoints when user is free
- [ ] UI hides/disables premium features for free users
- [ ] Upgrade prompts are clear and non-aggressive
- [ ] No broken or empty premium UI visible to free users
