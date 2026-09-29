// Screenshots of the live AlgorithmLens site at five widths plus an iPhone
// Safari emulation (Chromium engine, iPhone user agent and viewport).
//   node scripts/web-audit/shoot-live.mjs <outDir> [baseUrl]
// Every section and interactive state of /, /explore/, /explore/specimen.html,
// /explore/experience-film.html, /privacy/, /terms and /methodology.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(process.cwd(), process.argv[2] || '../docs/web-audit/before');
const BASE = (process.argv[3] || 'https://www.algorithmlens.com').replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
const JPG = { type: 'jpeg', quality: 80 };
const headed = process.env.HEADED === '1';

const iphone = devices['iPhone 14'];
const WIDTHS = [
  { name: '375', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: '430', viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: '768', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
  { name: '1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'iphone', viewport: iphone.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone.userAgent },
];
// ONLY=390,1440 limits the run to those widths; NOSTATES=1 skips interactive states.
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const FULL_STATES_AT = new Set(process.env.NOSTATES === '1' ? [] : ['390', '1440']); // interactive states only at two widths
const wait = (page, ms = 500) => page.waitForTimeout(ms);
async function full(page, f) {
  // Sticky headers smear across full-page captures; pin them for the shot.
  await page.addStyleTag({ content: '.topbar,.sidebar{position:static!important}' });
  await page.screenshot({ path: resolve(OUT, f), fullPage: true, ...JPG });
}
const fold = (page, f) => page.screenshot({ path: resolve(OUT, f), ...JPG });
async function el(loc, f) {
  try { await loc.scrollIntoViewIfNeeded(); await loc.page().waitForTimeout(350); await loc.screenshot({ path: resolve(OUT, f), ...JPG }); }
  catch (e) { console.warn('skip', f, e.message.split('\n')[0]); }
}
async function walk(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(120); }
  await page.evaluate(() => { document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('in')); window.scrollTo(0, 0); }); await wait(page, 600);
}

const browser = await chromium.launch({ headless: !headed });
for (const w of WIDTHS.filter((x) => !ONLY || ONLY.has(x.name))) {
  const ctx = await browser.newContext({ viewport: w.viewport, deviceScaleFactor: w.deviceScaleFactor, isMobile: !!w.isMobile, hasTouch: !!w.hasTouch, userAgent: w.userAgent });
  const page = await ctx.newPage();
  const states = FULL_STATES_AT.has(w.name);

  // ---------- Root ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await wait(page, 1200);
  await fold(page, `root-${w.name}-fold.jpg`);
  await walk(page);
  await full(page, `root-${w.name}.jpg`);
  const sections = [['header.top', 'nav'], ['section#top, section.hero', 'hero'], ['#report, #record', 'record'], ['#try', 'try'], ['#limits', 'limits'], ['#how', 'how'], ['#privacy', 'privacy'], ['#ways', 'ways'], ['#trust', 'trust'], ['#launch', 'launch'], ['footer.bottom', 'footer']];
  for (const [sel, name] of sections) await el(page.locator(sel).first(), `root-${w.name}-s-${name}.jpg`);
  if (states) {
    // film toggled, details open, focus ring, form states
    await page.locator('#filmToggle').click(); await wait(page, 400);
    await el(page.locator('.film-card'), `root-${w.name}-state-film-toggled.jpg`);
    await page.locator('section#top details summary, section.hero details summary').first().click(); await wait(page, 300);
    await el(page.locator('section#top, section.hero').first(), `root-${w.name}-state-details-open.jpg`);
    await page.locator('.hero .button').first().focus(); await wait(page, 200);
    await el(page.locator('section#top, section.hero').first(), `root-${w.name}-state-button-focus.jpg`);
    if (await page.locator('#tapFeed').count()) {
      for (let i = 1; i <= 4; i++) { await page.locator(`.read[data-read="${i}"]`).dispatchEvent('click'); await wait(page, 300); if (i === 1) await el(page.locator('#try'), `root-${w.name}-state-try-1tap.jpg`); }
      await el(page.locator('#try'), `root-${w.name}-state-try-4taps.jpg`);
      await page.locator('#readReset').dispatchEvent('click');
      for (let i = 2; i <= 3; i++) { await page.locator(`.step[data-step="${i}"]`).dispatchEvent('click'); await wait(page, 400); await el(page.locator('#how'), `root-${w.name}-state-how-step${i}.jpg`); }
      await page.locator('.way').first().hover(); await wait(page, 300); await el(page.locator('#ways'), `root-${w.name}-state-way-hover.jpg`);
    }
    if (w.name === '1440') { await page.locator('nav.sections a').first().hover(); await wait(page, 200); await el(page.locator('header.top'), `root-${w.name}-state-nav-hover.jpg`); }
    const launch = page.locator('#launch');
    await page.locator('#submit').click(); await wait(page, 400);
    await el(launch, `root-${w.name}-state-form-empty.jpg`);
    await page.fill('#email', 'not-an-email'); await page.locator('#submit').click(); await wait(page, 400);
    await el(launch, `root-${w.name}-state-form-invalid.jpg`);
    await page.fill('#email', 'example@example.com'); await page.locator('#consent').check();
    await page.route('**/functions/v1/launch-list', (r) => r.fulfill({ status: 500, body: '' }));
    await page.locator('#submit').click(); await wait(page, 900);
    await el(launch, `root-${w.name}-state-form-500.jpg`);
    await page.unroute('**/functions/v1/launch-list');
    await page.route('**/functions/v1/launch-list', (r) => r.abort());
    await page.locator('#submit').click(); await wait(page, 900);
    await el(launch, `root-${w.name}-state-form-offline.jpg`);
    await page.unroute('**/functions/v1/launch-list');
    await page.route('**/functions/v1/launch-list', (r) => r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' }));
    await page.locator('#submit').click(); await wait(page, 900);
    await el(launch, `root-${w.name}-state-form-received.jpg`);
    await page.unroute('**/functions/v1/launch-list');
  }

  // ---------- Explorer ----------
  await page.goto(BASE + '/explore/', { waitUntil: 'networkidle' }); await wait(page, 1200);
  await fold(page, `explore-${w.name}-fold.jpg`);
  await full(page, `explore-${w.name}.jpg`);
  if (states) {
    for (const v of ['feed', 'ads', 'origins', 'accounts', 'tone', 'politics', 'record', 'evidence']) {
      await page.goto(BASE + '/explore/#' + v, { waitUntil: 'networkidle' }); await wait(page, 900);
      await fold(page, `explore-${w.name}-view-${v}.jpg`);
      const primary = page.locator('.scene-controls .primary');
      if (await primary.count()) { await primary.first().click(); await wait(page, 700); await fold(page, `explore-${w.name}-view-${v}-primary.jpg`); }
    }
    await page.goto(BASE + '/explore/#feed', { waitUntil: 'networkidle' }); await wait(page, 800);
    await page.locator('.below summary').click(); await wait(page, 300);
    await el(page.locator('.below'), `explore-${w.name}-state-transcript-open.jpg`);
    for (const d of ['thin', 'unreadable', 'empty']) {
      await page.selectOption('#dataset', d); await wait(page, 700);
      await fold(page, `explore-${w.name}-dataset-${d}.jpg`);
    }
  }

  // ---------- Specimen, film, privacy, terms, methodology ----------
  for (const [path, name] of [['/explore/specimen.html', 'specimen'], ['/explore/experience-film.html', 'film'], ['/privacy/', 'privacy'], ['/terms', 'terms'], ['/methodology', 'methodology'], ['/this-page-does-not-exist', '404']]) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' }); await wait(page, 1200);
    await fold(page, `${name}-${w.name}-fold.jpg`);
    await walk(page);
    await full(page, `${name}-${w.name}.jpg`);
  }
  await ctx.close();
}
// Reduced motion, root and explorer at 390 and 1440
for (const w of WIDTHS.filter((x) => FULL_STATES_AT.has(x.name) && (!ONLY || ONLY.has(x.name)))) {
  const ctx = await browser.newContext({ viewport: w.viewport, deviceScaleFactor: w.deviceScaleFactor, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await wait(page, 1200);
  await fold(page, `root-${w.name}-state-reduced-motion.jpg`);
  await page.goto(BASE + '/explore/#record', { waitUntil: 'networkidle' }); await wait(page, 1200);
  await fold(page, `explore-${w.name}-state-reduced-motion.jpg`);
  await ctx.close();
}
await browser.close();
console.log('done ->', OUT);
