# AlgorithmLens — On-Device Testing Checklist

Use this checklist when testing the app on your iPhone. Go through each section in order. If something doesn't work, note exactly what you see (screenshot if possible) and what step you were on.

---

## 1. App Opens and Home Screen Loads

- [ ] Open the app
- [ ] You should see the home screen with "AlgorithmLens" at the top
- [ ] You should see platform icons (Instagram, X, YouTube, TikTok, Facebook, Reddit)
- [ ] You should see a streak counter (starts at 0)
- [ ] The bottom tab bar should have tabs (Home, Dashboard, History)

**If something is wrong:** Note what you see instead. Blank screen? Error message? Crash?

---

## 2. Pick a Platform

- [ ] Tap one of the platform icons (start with Instagram)
- [ ] A toggle should appear: "Broadcast" mode and "Precision" mode
- [ ] "Broadcast" should be selected by default
- [ ] Tap "Start Broadcast" (or whatever the action button says)

**Expected:** You should be taken to the broadcast screen

---

## 3. Broadcast Screen

- [ ] You should see the broadcast screen with the platform name at the top
- [ ] There should be a big circular button to start broadcasting
- [ ] There should be a "How it works" section explaining the steps
- [ ] Tap the broadcast button

**Expected on iPhone:** A system popup appears asking you to choose "AlgorithmLens" from a list of broadcast targets. Tap it.

**Expected on Android:** A permission dialog appears asking to record your screen. Tap "Start now."

---

## 4. Recording Your Feed

- [ ] After starting the broadcast, switch to the actual social media app (e.g., open Instagram)
- [ ] Scroll through your feed normally for about 30-60 seconds
- [ ] Switch back to AlgorithmLens

**Expected:** You should see:
- A "Recording" status
- Frame count going up (should be 10-25 frames for 60 seconds)
- A timer showing how long you've been recording
- A red "Stop" button

---

## 5. Stop and View Results

- [ ] Tap "Stop Recording"
- [ ] Confirm when asked
- [ ] You should see a "View Results" button after the recording stops
- [ ] Tap "View Results"

**Expected:** You're taken to the analysis screen

---

## 6. Analysis Screen

- [ ] You should see a progress indicator
- [ ] The status should change through these stages:
  - "Preparing..."
  - "Analyzing frames..." (this takes the longest, maybe 30-60 seconds)
  - "Deduplicating..."
  - "Building results..."
  - "Saving..."
  - "Complete!"
- [ ] When complete, you should see a results summary card showing:
  - How many feed items were found
  - Ad percentage
  - Topics detected
  - Political content percentage
  - Overall tone

**If it fails:** Note the error message. Most likely cause: missing or invalid Gemini API key.

---

## 7. Dashboard

- [ ] From the results summary, tap "View Full Dashboard"
- [ ] The dashboard should load with data from your scan
- [ ] Check the tabs: Overview, Sources, Ads, Politics, Tone, Suggested
- [ ] Each tab should show data (not "No data available")

---

## 8. History

- [ ] Go to the History tab (bottom tab bar)
- [ ] Your scan should appear as a card with:
  - Platform name and color
  - "Broadcast" badge (small blue label)
  - Time ("just now" or "1m ago")
  - Number of posts
  - Ad percentage
- [ ] Tap the scan card — it should open the dashboard for that scan

---

## 9. Streak System

- [ ] Go back to the Home tab
- [ ] Your streak counter should now show "1" (you completed one scan)
- [ ] Do another scan tomorrow — the streak should go to "2"

---

## 10. iOS Shortcuts (iPhone only)

- [ ] Open the Shortcuts app on your iPhone
- [ ] Tap the "+" to create a new shortcut
- [ ] Search for "AlgorithmLens"
- [ ] You should see two actions: "Scan Feed" and "Quick Scan"
- [ ] Add "Scan Feed" and pick a platform (e.g., Instagram)
- [ ] Run the shortcut
- [ ] AlgorithmLens should open directly to the broadcast screen for that platform
- [ ] You should see a blue banner saying "Launched from Shortcut"

---

## Environment Setup Reminders

Before testing, make sure:

1. **Gemini API Key** is set in the app's `.env` file:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
   ```
   Get one free at: https://aistudio.google.com/apikey

2. **Supabase** is configured (for saving scan results):
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. The social media app you're testing with (Instagram, etc.) is installed on the same device

---

## Quick Reference: What's Normal vs. What's a Bug

| What you see | Normal or Bug? |
|---|---|
| Frame count stays at 0 while recording | **Bug** — frames should capture every ~2.5 seconds |
| Analysis takes 30-60 seconds | **Normal** — Gemini processes each frame |
| "No frames captured" after stopping | **Bug** — you may need to scroll more slowly |
| Dashboard shows 0 posts | **Bug** — Gemini may have failed to extract |
| Shortcuts don't appear in Shortcuts app | **Likely normal** — requires iOS 16+ |
| Broadcast picker doesn't show AlgorithmLens | **Bug** — broadcast extension may not be configured |
