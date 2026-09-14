#!/usr/bin/env node
// Screenshot the approved Dashboard design (Dashboard.dc.html) as ground truth.
// Usage: node shoot-design.mjs  (run from mobile/ so playwright resolves)
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE = path.resolve(__dirname, '..', '..', 'AlgorithmLens_Cowork', 'mobile');
const { chromium } = await import(
  pathToFileURL(path.join(MOBILE, 'node_modules', 'playwright', 'index.mjs')).href
);
const OUT = path.join(__dirname, 'renders');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { label: '430x932', width: 430, height: 932 },
  { label: '375x667', width: 375, height: 667 },
];

const fileUrl = 'file:///' + path.join(__dirname, 'Dashboard.dc.html').replace(/\\/g, '/');

const browser = await chromium.launch({ headless: true });
for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.log(`[console:${vp.label}]`, m.text().slice(0, 300));
  });
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  // Full page shot
  await page.screenshot({ path: path.join(OUT, `design-${vp.label}-full.png`), fullPage: true });

  // Viewport-height segments
  const total = await page.evaluate(() => document.body.scrollHeight);
  const segments = Math.min(Math.ceil(total / vp.height), 12);
  for (let s = 0; s < segments; s++) {
    await page.evaluate((y) => window.scrollTo(0, y), s * vp.height);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `design-${vp.label}-s${s}.png`) });
  }
  console.log(`[shoot] ${vp.label}: total height ${total}px, ${segments} segments`);
  await context.close();
}
await browser.close();
console.log('[shoot] done ->', OUT);
