#!/usr/bin/env node
// Draws the home page's share image (the picture a link to algorithmlens.com
// carries in a message or a post): public/static/img/og-home-2026-11.png,
// 1200 x 630.
//
// It shows the wordmark, the page's headline, "Free iPhone app, in beta" and
// one example visual with its label: the same app screen the home page's hero
// shows (public/static/img/app-first-card-2026-10-27.png, a render from the
// app's own gallery with its sample data). Nothing on it is a number the page
// does not also show.
//
// The picture is drawn in a headless browser from the markup below, with the
// site's own fonts, wordmark and colour tokens, so it is run by hand when the
// headline or the screen changes, not on every build:
//
//   npm run build:share
//
// Files under /static/ are cached for a year, and the services that show link
// previews keep their own copies by address, so a changed picture gets a new
// file name here and in public/index.html (and src/homePage.test.js).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, '..', 'public');
export const SHARE_IMAGE = path.join(pub, 'static', 'img', 'og-home-2026-11.png');
export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;

const dataUri = (file, type) => `data:${type};base64,${readFileSync(path.join(pub, file)).toString('base64')}`;

/** The picture as a page: tokens from canon/canon.json, the serif from /static/fonts. */
export function shareMarkup() {
  const wordmark = readFileSync(path.join(pub, 'static', 'img', 'wordmark.svg'), 'utf8')
    .replace(/^<svg[^>]*><symbol[^>]*>/, '').replace(/<\/symbol>\s*<\/svg>\s*$/, '');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>
@font-face{font-family:Source;src:url(${dataUri('static/fonts/source-serif-4-regular.woff2', 'font/woff2')}) format('woff2');font-weight:400;font-style:normal}
@font-face{font-family:Source;src:url(${dataUri('static/fonts/source-serif-4-italic.woff2', 'font/woff2')}) format('woff2');font-weight:400;font-style:italic}
:root{--paper:#F5F4F0;--panel:#FFFFFF;--field:#FFFDF9;--line:#DDD8CD;--muted:#6D685F;--ink:#3A3730;--green:#20A888}
*{box-sizing:border-box;margin:0}
body{width:${SHARE_WIDTH}px;height:${SHARE_HEIGHT}px;overflow:hidden;position:relative;color:var(--ink);font-family:"Segoe UI",-apple-system,"SF Pro Text",system-ui,sans-serif;
  background-color:var(--paper);background-image:radial-gradient(circle,var(--line) 1px,transparent 1.3px);background-size:26px 26px;background-position:8px 8px}
.copy{position:absolute;left:72px;top:56px;width:600px;bottom:52px;display:flex;flex-direction:column}
.wordmark{width:238px;height:48px;display:block}
.oxford{height:6px;border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);margin:22px 0 30px}
h1{font:400 69px/1.02 Source,Georgia,serif;letter-spacing:-.022em}
h1 i{position:relative;white-space:nowrap}
h1 i svg{position:absolute;left:0;bottom:-.03em;width:100%;height:.15em;overflow:visible}
h1 i path{stroke:var(--green);stroke-width:3.4;fill:none;stroke-linecap:round}
.free{margin-top:auto;display:flex;align-items:center;gap:14px;font-size:30px;line-height:36px}
.free::before{content:"";width:20px;height:20px;border:2.5px solid var(--ink);border-radius:50%;flex-shrink:0}
.site{margin-top:10px;margin-left:34px;font-size:22px;line-height:28px;color:var(--muted)}
.plate{position:absolute;left:744px;top:0;bottom:0;width:384px;border-left:1px solid var(--line)}
.label{position:absolute;left:36px;top:30px;display:flex;align-items:center;gap:10px;font-size:20px;line-height:24px;color:var(--muted)}
.label::before{content:"";width:15px;height:15px;border:2px solid var(--ink);border-radius:50%}
.phone{position:absolute;left:36px;top:76px;width:360px;border-radius:44px 44px 0 0;background:var(--ink);padding:8px 8px 0;box-shadow:0 22px 44px rgba(58,55,48,.2)}
.phone img{display:block;width:344px;height:auto;border-radius:36px 36px 0 0;background:var(--field)}
</style></head>
<body>
<div class="copy">
<svg class="wordmark" viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens">${wordmark}</svg>
<div class="oxford"></div>
<h1>See what is <i>actually<svg viewBox="0 0 160 10" preserveAspectRatio="none"><path d="M2 7 Q 30 2, 62 6 T 120 6 T 158 5"/></svg></i> in your social media feed</h1>
<p class="free">Free iPhone app, in beta</p>
<p class="site">algorithmlens.com</p>
</div>
<div class="plate">
<span class="label">Example screen</span>
<div class="phone"><img src="${dataUri('static/img/app-first-card-2026-10-27.png', 'image/png')}" alt=""></div>
</div>
</body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SHARE_WIDTH, height: SHARE_HEIGHT }, deviceScaleFactor: 1 });
  await page.setContent(shareMarkup(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style}`));
  if (fonts.length < 2) throw new Error(`build-share-image: the serif did not load (${fonts.join(', ') || 'none'})`);
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: SHARE_WIDTH, height: SHARE_HEIGHT } });
  await browser.close();
  writeFileSync(SHARE_IMAGE, png);
  console.log(`wrote ${SHARE_IMAGE} ${png.length} bytes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
