# Build #44 — Splash icon conversion (one-time CLI step)

## Why this exists
`assets/splash-icon.png` is currently the Expo placeholder bullseye. A new icon-only SVG was created at `assets/splash-icon.svg`. Before the EAS build, you need to convert the SVG to a 1024x1024 PNG and overwrite the existing `splash-icon.png`. This step needs a system with image-conversion tooling available, which Claude Code doesn't have in this environment.

## What you need to produce
- **Output file:** `AlgorithmLens_Cowork/mobile/assets/splash-icon.png`
- **Dimensions:** 1024 x 1024 pixels
- **Format:** PNG with transparency (RGBA, 8-bit per channel)
- **Source:** `AlgorithmLens_Cowork/mobile/assets/splash-icon.svg`

App.config.ts already points at `./assets/splash-icon.png` — once you overwrite the placeholder PNG with the new render, no further config change is needed.

Only ONE size is needed. Expo's splash plugin handles all device-specific scaling at build time from this single 1024x1024 input (because `app.config.ts` uses `resizeMode: 'contain'` with a square icon-style image).

## Recommended command (no install required)

Open a terminal at `AlgorithmLens_Cowork/mobile/` and run:

```bash
npx @resvg/resvg-js-cli@latest assets/splash-icon.svg --output assets/splash-icon.png --width 1024
```

`@resvg/resvg-js-cli` is a pure-Rust SVG renderer wrapped as an npm package. It downloads on first run (~5 MB), no global install needed, no system librsvg / Inkscape required, works on Windows / macOS / Linux.

## Alternative if `@resvg/resvg-js-cli` doesn't work on your machine

**Option A — sharp-cli (npm):**
```bash
npx sharp-cli@latest --input assets/splash-icon.svg --output assets/splash-icon.png resize 1024 1024
```
Note: sharp's SVG support depends on librsvg being available on your system. On Windows this may fail; if it does, use the resvg option above.

**Option B — Inkscape (if you have it installed):**
```bash
inkscape --export-type=png --export-width=1024 --export-filename=assets/splash-icon.png assets/splash-icon.svg
```

**Option C — ImageMagick (if you have it):**
```bash
magick -background none -density 300 assets/splash-icon.svg -resize 1024x1024 assets/splash-icon.png
```

## Verification

After conversion, run from `AlgorithmLens_Cowork/mobile/`:

```bash
file assets/splash-icon.png
```

Expected output:
```
assets/splash-icon.png: PNG image data, 1024 x 1024, 8-bit/color RGBA, non-interlaced
```

Or in PowerShell, if `file` isn't available, check the file size:
```powershell
Get-Item assets/splash-icon.png | Select-Object Length
```

The new PNG should be substantially different in size from the old placeholder (the old was 17,547 bytes — the new render will likely be 30-80 KB).

## After conversion succeeds

The PNG is now in place. The EAS build will pick it up automatically on next run. No further code changes needed.

## If conversion fails

If none of the commands work, fall back: skip Item 5 entirely for build #44 and ship with the placeholder one more time. The other 12 items still produce a meaningful build. Tell me to proceed without the splash change.
