# Algorithm Lens - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
# From monorepo root:
pnpm --filter @goodish/algorithm-lens dev

# Or from apps/algorithm-lens:
pnpm dev
```

### 3. Open in Browser
Visit [http://localhost:5173](http://localhost:5173)

---

## 📧 Email Gate Configuration

### Default: Local-Only Mode (No Setup Required!)
By default, emails are stored only in `localStorage`. No network requests are made.

### Option 1: Disable Email Gate (Development)
Create `.env.local`:
```bash
VITE_DISABLE_EMAIL_GATE=true
```

### Option 2: Enable Beehiiv Integration (Optional)
Create `.env.local`:
```bash
VITE_BEEHIIV_EMBED_ACTION=https://embeds.beehiiv.com/YOUR_EMBED_ID
VITE_BEEHIIV_PUBLICATION_ID=your-publication-id
```

---

## 🧪 Testing the Email Gate

### Test Local-Only Mode:
1. Start dev server (no env vars needed)
2. Click "Get Started" or "Try Sample Data"
3. Email gate modal appears
4. Enter email: `test@example.com`
5. Check consent box → Click "Continue"
6. Email saved to `localStorage` (check DevTools → Application → Local Storage)
7. Refresh page → email gate doesn't reappear ✅

### Test Dev Bypass:
1. Set `VITE_DISABLE_EMAIL_GATE=true` in `.env.local`
2. Restart dev server
3. Click "Get Started" → navigates directly to dashboard (no email gate) ✅

### Test Beehiiv Mode:
1. Set both Beehiiv env vars in `.env.local`
2. Restart dev server
3. Submit email → POST request to Beehiiv endpoint
4. Check Network tab → should see request to Beehiiv
5. On error, falls back to local-only gracefully ✅

---

## 🎨 Key Features to Test

### 1. Hero Animation
- Resize browser from 320px to 1440px
- Logo should never clip or overflow
- Enable "Reduce Motion" in browser settings → animations should stop

### 2. Navigation
- Click Privacy icon in nav (when on dashboard)
- Click "Made with ❤️ by Goodish" in footer → opens in new tab
- Tab through all buttons → focus rings should be visible

### 3. Sample Data
- Click "Try Sample Data"
- Email gate appears (if not bypassed)
- Load all samples → dashboard populates with charts

### 4. Keyboard Shortcuts
- `R` - Refresh dashboard
- `E` - Export CSV
- `D` - Delete all data
- `?` - Show help modal

---

## 📁 Project Structure

```
apps/algorithm-lens/
├── src/
│   ├── components/        # UI components
│   │   ├── EmailGateModal.tsx     ⭐ NEW
│   │   ├── NavBar.tsx             ✏️ Modified
│   │   └── HeroGlyph.tsx          ✏️ Modified
│   ├── routes/            # Pages
│   │   ├── Home.tsx               ✏️ Modified
│   │   ├── Privacy.tsx            ✏️ Modified
│   │   └── DashboardNew.tsx       ✏️ Modified
│   ├── lib/               # Business logic
│   │   ├── email.ts               ⭐ NEW
│   │   └── ...
│   ├── store/
│   │   └── data.ts                ✏️ Modified (added email)
│   ├── styles/
│   │   └── tokens.css             ✅ Already good
│   └── App.tsx                    ✏️ Modified (email gate wiring)
├── docs/
│   └── QA.md                      ⭐ NEW
├── public/
│   ├── samples/           # Sample data files
│   └── og-image.txt               ⭐ NEW (spec for designer)
├── .env.example                   ⭐ NEW
├── index.html                     ✏️ Modified (SEO meta tags)
└── README.md                      ✏️ Modified (email gate docs)
```

---

## 🐛 Troubleshooting

### Email gate appears on every page load
**Solution:** Check browser localStorage. Email should be stored at key `algorithm-lens-email`. If missing, try submitting email again.

### Email gate doesn't appear at all
**Solution:** Check if `VITE_DISABLE_EMAIL_GATE=true` is set in `.env.local`. Remove or set to `false`.

### Beehiiv submission fails
**Solution:** This is expected if Beehiiv env vars are not set or incorrect. App falls back to local-only mode. Check:
1. Both env vars are set
2. Embed action URL is correct
3. Publication ID is correct
4. CORS allows requests from localhost

### Logo appears clipped
**Solution:** Clear browser cache and hard refresh. Hero wrapper should be responsive with no overflow.

### TypeScript build errors
**Solution:** Pre-existing errors in codebase (not introduced). They don't affect runtime. Run `pnpm dev` to start dev server, which uses esbuild and is more lenient.

---

## 📚 Documentation

- **[README.md](./README.md)** - Full project documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete changelog
- **[docs/QA.md](./docs/QA.md)** - Comprehensive QA checklist
- **[.env.example](./.env.example)** - Environment variable reference

---

## 🎯 Quick QA Checklist

Before committing changes:
- [ ] Email gate appears on first visit
- [ ] Email persists after submission
- [ ] Privacy page has email handling section
- [ ] Footer has "Made with ❤️ by Goodish" link
- [ ] Hero logo doesn't clip at any viewport size
- [ ] All nav buttons have aria-labels
- [ ] Tab through page → focus rings visible
- [ ] Enable reduced motion → animations stop

---

## 🚢 Ready to Deploy?

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for full deployment checklist.

**TL;DR:**
1. Create og-image.png (1200x630px)
2. Create favicon files
3. Set production env vars (if using Beehiiv)
4. Update OG URL in index.html to production domain
5. Deploy! 🎉

---

**Questions?** Check the comprehensive [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) or open an issue.
