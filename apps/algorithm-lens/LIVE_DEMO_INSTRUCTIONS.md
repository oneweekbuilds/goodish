# 🚀 Live Demo Instructions

## Quick Start (2 minutes)

### Step 1: Start the Dev Server

```bash
cd C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens
npm run dev
```

### Step 2: Open Your Browser

Navigate to: **http://localhost:5173**

### Step 3: Access the Demo Page

Click the **🎨 Demo** link in the navigation bar

OR

Go directly to: **http://localhost:5173/#demo** (if using hash routing)

---

## What You'll See on the Demo Page

### 1. **Local Database Status**
- Shows how many items are stored in IndexedDB
- "Load Sample Data" button to populate the database
- Real-time count updates

### 2. **Chart Components Showcase**
Four production-ready chart types:

#### **Ring Gauge**
- Circular progress indicator
- Color-coded bands (green/yellow/red)
- Shows Echo Chamber Score

#### **Tri-Segment Bar**
- Three-way political distribution
- Color-coded: Blue (Left), Gray (Neutral), Red (Right)
- Live percentages

#### **Horizontal Bars**
- Tone distribution with emojis
- Smooth animations
- Percentage labels

#### **Bubble Chart**
- Interactive ad influence visualization
- Click legend to filter categories
- Hover for tooltips

### 3. **UI Components**
- **Dismissible Alerts** - Warning, Error, Info variants
- **Scale Badges** - Metric range indicators

### 4. **Action Modals** (3 types)
- **Opposing Views Modal** - Curated account recommendations
- **Ad Preferences Modal** - Step-by-step platform guides
- **Outrage Tips Modal** - Practical content reduction strategies

### 5. **Dynamic Suggestions**
- Generated based on loaded metrics
- Tailored action items
- Links to relevant modals

---

## Testing the Features

### Test 1: Load Sample Data
1. Click "Load Sample Data" button
2. Wait for loading (~2-3 seconds)
3. Count should update to show items loaded
4. Charts should populate with real data

### Test 2: Check Database Persistence
1. Load sample data
2. Refresh the page
3. Count should still show items loaded
4. Data persists in IndexedDB

### Test 3: Interactive Charts
1. **Bubble Chart**: Click legend items to filter categories
2. **Bubble Chart**: Hover over bubbles for tooltips
3. All charts should be smooth and responsive

### Test 4: Open Modals
1. Click each modal button
2. Modal should open with full content
3. Close button should work
4. Click outside modal to dismiss

### Test 5: View Browser DevTools
1. Open DevTools (F12)
2. Go to **Application → IndexedDB → algorithm-lens**
3. Inspect the `samples` store
4. See actual data objects

---

## What's Different from Production?

The demo page shows:
- ✅ All NEW components (built by me)
- ✅ Real IndexedDB integration
- ✅ Real metrics computation
- ✅ Production-ready code

The rest of the app shows:
- ❌ Old components (existing before I started)
- ❌ Mock data in some places
- ❌ Not yet integrated with new features

---

## If Something Doesn't Work

### Issue: "Cannot find module './routes/Demo'"
**Fix:** Make sure you saved the Demo.tsx file. Run:
```bash
npm run dev
```

### Issue: Charts show mock data
**Fix:** Click "Load Sample Data" button first

### Issue: "idb is not defined" or similar
**Fix:** Ensure dependencies are installed:
```bash
npm install
```

### Issue: TypeScript errors
**Fix:** The demo page uses TypeScript. Some minor type mismatches are expected but won't prevent the app from running in dev mode.

---

## For Deployment to a Live URL

If you want to deploy this to a public URL (Vercel, Netlify, etc.):

### Option 1: Deploy to Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens
vercel
```

Follow prompts, then you'll get a live URL like: `https://algorithm-lens-xyz.vercel.app`

### Option 2: Deploy to Netlify

```bash
# Build the project
npm run build

# Drag and drop the 'dist' folder to https://app.netlify.com/drop
```

### Option 3: GitHub Pages

1. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/oneweekbuilds/',
  // ... rest of config
})
```

2. Build and deploy:
```bash
npm run build
# Then commit and push the 'dist' folder to gh-pages branch
```

---

## Quick Video/Screenshot Capture

Want to show someone? Here's how:

### Take Screenshots
1. Open **http://localhost:5173**
2. Go to Demo page
3. Press **Ctrl+Shift+S** (Windows) or use Snipping Tool
4. Capture each section

### Record Video
1. Use **OBS Studio** (free) or Windows Game Bar (**Win+G**)
2. Record screen while clicking through features
3. Export as MP4

---

## Summary

✅ Demo page showcases ALL new features
✅ No external dependencies or API calls needed
✅ Everything runs locally in your browser
✅ Data persists in IndexedDB
✅ Production-ready code you can integrate

**URL:** http://localhost:5173 → Click "🎨 Demo"

---

Need help? Check the other documentation files:
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `INTEGRATION_GUIDE.md` - How to integrate into main app
- `NEXT_STEPS.md` - Step-by-step integration checklist
