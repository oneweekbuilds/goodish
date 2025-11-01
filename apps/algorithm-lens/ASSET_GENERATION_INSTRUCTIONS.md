# 🎨 AlgorithmLens Brand Assets - Generation Instructions

## Quick Start

### Live Asset Generator
**Open this URL in your browser:**
```
http://localhost:5173/generate-assets.html
```

This interactive page generates all required assets with pixel-perfect rendering using the Canvas API.

---

## What You'll See

The generator page displays:
1. **OG Image Preview** (1200×630) - Full social sharing image
2. **SVG Favicon Preview** - Vector logo
3. **PNG Favicons** - Three sizes (16×16, 32×32, 180×180)

Each preview has a **Download** button below it.

---

## Step-by-Step Download Process

### Method 1: Download All at Once (Recommended)
1. Open [http://localhost:5173/generate-assets.html](http://localhost:5173/generate-assets.html)
2. Scroll to the bottom
3. Click the big green **"📥 Download All Assets"** button
4. Wait for 5 files to download to your Downloads folder:
   - `og-image.png` (1200×630)
   - `favicon.svg` (vector)
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png` (180×180)

### Method 2: Download Individually
Click each "Download" button next to each asset preview.

---

## Installing the Assets

### 1. Move Downloaded Files
Move all downloaded files to:
```
apps/algorithm-lens/public/
```

Replace any existing placeholder files.

### 2. Verify File Structure
Your `/public` directory should now contain:
```
public/
├── og-image.png           ✅ (1200×630)
├── favicon.svg            ✅ (already created)
├── favicon-16x16.png      ✅ (download from generator)
├── favicon-32x32.png      ✅ (download from generator)
├── apple-touch-icon.png   ✅ (download from generator)
└── generate-assets.html   (tool, can keep or remove)
```

### 3. Test the Assets

#### Test OG Image
```bash
# Check file exists and is correct size
ls -lh public/og-image.png
# Should show ~50-100KB file
```

Open in browser:
```
http://localhost:5173/og-image.png
```
You should see the full brand image with:
- Gradient background (off-white to teal)
- "AlgorithmLens" title
- "See what your algorithm sees in you." slogan
- Circular lens icon on the right
- Privacy badge at bottom

#### Test Favicons
Open these URLs in separate tabs:
```
http://localhost:5173/favicon.svg
http://localhost:5173/favicon-16x16.png
http://localhost:5173/favicon-32x32.png
http://localhost:5173/apple-touch-icon.png
```

Each should display a centered circular lens icon with data bars inside.

---

## Brand Specifications

### Colors
- **Primary Brand Color:** `#01B1C0` (Teal)
- **Background Gradient:** `#FDFDFD` → `#E9FBFC`
- **Text Dark:** `#0e0f11` (Ink)
- **Text Muted:** `#5b5f6a` (Ink Muted)
- **Privacy Badge:** `#2ec27e` (Green)

### Typography
- **Title:** Bold 96px sans-serif - "AlgorithmLens"
- **Slogan:** Regular 42px sans-serif - "See what your algorithm sees in you."
- **Font Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Layout (OG Image)
- **Canvas:** 1200×630px
- **Top Accent Bar:** 8px solid teal (#01B1C0)
- **Text Position:** 80px from left edge
- **Lens Icon:** Centered at (950px, 315px), radius 140px
- **Padding:** ~80px margin from all edges

---

## Validation Checklist

Before deploying, verify:

### Visual Quality
- [ ] OG image is exactly 1200×630 pixels
- [ ] Text is perfectly legible at 100% and 50% zoom
- [ ] No text clipping or overlapping
- [ ] Gradient background is smooth (no banding)
- [ ] Lens icon doesn't overlap text
- [ ] All favicons have transparent or gradient backgrounds
- [ ] Data bars are visible in 32×32 and larger favicons

### Technical
- [ ] All PNG files are saved with optimal compression
- [ ] SVG file is valid and renders in all browsers
- [ ] File sizes are reasonable:
  - OG image: ~50-100KB
  - Favicon SVG: ~1-2KB
  - Favicon PNGs: ~1-5KB each
  - Apple touch icon: ~10-20KB

### Browser Testing
- [ ] Open main app at http://localhost:5173
- [ ] Check browser tab - favicon should appear
- [ ] Share link on Slack/Discord - OG image should preview
- [ ] View source - meta tags reference correct paths

---

## Deployment

### Update index.html (if needed)
The `index.html` file already references these assets:

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

<!-- Open Graph -->
<meta property="og:image" content="/og-image.png" />
```

These paths are already correct! ✅

### Production Deployment
When deploying to production:
1. Ensure all assets are in the `/public` folder
2. Build the app: `pnpm run build`
3. Verify assets are copied to `dist/` folder
4. Deploy `dist/` to your hosting platform
5. Test OG image sharing on Twitter, Facebook, LinkedIn
6. Verify favicon appears in browser tabs

---

## Troubleshooting

### "Download All" doesn't download files
**Solution:** Some browsers block multiple simultaneous downloads. Click each "Download" button individually.

### OG image looks blurry when shared
**Solution:**
1. Ensure file is exactly 1200×630 pixels
2. Check file size - should be at least 50KB
3. Wait 5-10 minutes for social media caches to clear
4. Use Facebook's Sharing Debugger: https://developers.facebook.com/tools/debug/

### Favicon doesn't update in browser
**Solution:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser DevTools → Application → Manifest
3. Force refresh the favicon: `http://localhost:5173/favicon.svg?v=2`

### Generator page shows blank canvas
**Solution:**
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try a different browser (Chrome recommended)
4. Check that the page loaded completely

---

## Alternative: Manual Asset Creation

If you prefer to create assets manually using design tools:

### Using Figma/Sketch/Canva
1. Create new artboard: 1200×630px
2. Add gradient background (see specs above)
3. Add text layers (see typography specs)
4. Add circular lens icon (see layout specs)
5. Export as PNG at 2x resolution for crisp quality

### Using Photoshop
1. New document: 1200×630px, 72 DPI, RGB
2. Create gradient layer (specs above)
3. Add text with proper fonts and sizes
4. Draw lens icon with circular shapes
5. Export for Web (PNG-24, optimized)

### Using Code (Node.js + Canvas)
See `generate-assets.html` source code for canvas API implementation.

---

## Support

Questions? Check:
- **Specs:** [/public/og-image-spec.txt](../public/og-image-spec.txt)
- **Implementation:** [/public/generate-assets.html](../public/generate-assets.html)
- **Main README:** [../README.md](../README.md)

---

**Generated assets follow the new brand line: "See what your algorithm sees in you."** 🎯
