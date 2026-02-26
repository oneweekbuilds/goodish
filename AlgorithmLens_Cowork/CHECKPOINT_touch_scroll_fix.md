# Checkpoint: Touch Scroll → Accidental Video Fullscreen Fix

**Date:** February 17, 2026
**Issue:** When scrolling through social media feeds in the scanner, touching/swiping over a video triggers fullscreen mode instead of continuing the scroll.

---

## What's happening (plain language)

When you use your finger to scroll through a social media feed (Instagram, TikTok, YouTube, etc.) inside the AlgorithmLens scanner, every time your finger passes over a video while scrolling, the app thinks you're *tapping* the video rather than *scrolling past it*. This causes the video to try to go fullscreen, which interrupts your scroll and feels broken.

## Why it's happening (the root cause)

There are **three separate problems** working together to cause this:

### Problem 1: No way to tell scrolling apart from tapping
The current code only listens for "click" events on videos and blocks them. But on a touchscreen, the phone converts your finger touches into clicks *after the fact*. The code has no way to know whether your touch was a scroll gesture (finger moving across the screen) or an intentional tap (finger touching and lifting in the same spot). So it sometimes fails to block clicks that the phone generates during scrolls.

### Problem 2: "pointer-events: none" on videos causes touch passthrough issues
On Instagram, Twitter, and Facebook, the code sets a rule that says "ignore all pointer interactions on videos." While this sounds like it should fix the problem, it actually makes things worse — when your finger touches a video area and the video ignores it, the touch can "fall through" to elements *behind* the video (like links or wrappers) that have their own click handlers that trigger fullscreen navigation.

### Problem 3: TikTok completely blocks scrolling on videos
The TikTok code has an even more aggressive rule: `touch-action: none` on videos. This literally means "don't allow any touch gestures on video elements." The result? You physically *cannot scroll* when your finger is on a video. Since TikTok's feed is almost entirely video, this makes scrolling nearly impossible and forces users to find tiny gaps between videos to scroll, which is the worst version of this bug.

## What files are affected

Six platform-specific script files that get injected into the WebView:

1. `mobile/src/lib/platformScripts/instagram.ts` — lines 36-99
2. `mobile/src/lib/platformScripts/tiktok.ts` — lines 22-78
3. `mobile/src/lib/platformScripts/youtube.ts` — lines 20-77
4. `mobile/src/lib/platformScripts/twitter.ts` — lines 24-77
5. `mobile/src/lib/platformScripts/facebook.ts` — lines 25-83
6. `mobile/src/lib/platformScripts/reddit.ts` — (similar pattern)

## Proposed fix

Replace the current "block all clicks on videos" approach with a **smart touch tracker** that can tell the difference between scrolling and tapping:

1. **Track finger movement**: When a finger touches the screen (`touchstart`), record where it landed. As it moves (`touchmove`), track how far it's gone. If the finger moved more than 10 pixels, it's a scroll — let it happen normally. If it barely moved, it's a tap — block it on video elements.

2. **Replace `pointer-events: none` with `touch-action: pan-y`**: Instead of disabling ALL touch interaction on videos (which breaks scrolling), only allow vertical scrolling gestures. This lets users scroll over videos normally while still preventing taps from activating them.

3. **Block the synthetic click event**: After a scroll gesture, the phone sometimes still generates a "click" event. The updated code will check whether the preceding touch was a scroll or a tap, and only block the click if it was a tap on a video.

4. **Keep the existing safety nets**: The fullscreen API overrides and video autoplay blocking stay in place as a backup layer.

### What stays the same
- Fullscreen API is still overridden (requestFullscreen, webkitRequestFullscreen, etc.)
- Video autoplay is still blocked
- Navigation to /reel/, /shorts/, /video/ paths is still blocked
- Banner suppression is untouched
- Feed item capture logic is untouched

### What changes
- `pointer-events: none` on videos → `touch-action: pan-y` (allows scrolling, blocks horizontal swipes)
- `touch-action: none` on TikTok videos → `touch-action: pan-y` (same)
- New `touchstart`/`touchmove`/`touchend` listeners that track whether the user is scrolling or tapping
- The `click` listener now checks the touch state before deciding to block

## Risk assessment

- **Low risk**: The fullscreen API overrides and navigation blocking remain as safety nets
- **The fix only changes how touch events are interpreted** — it doesn't change any data capture or business logic
- **Worst case if the fix doesn't work**: Same behavior as now (videos occasionally going fullscreen during scroll)
- **Best case**: Smooth scrolling across all platforms, no accidental fullscreen triggers
