// Screenshots of the old AlgorithmLens site (the Vite/React app before commit
// 80175e24), served locally from the goodish-old worktree:
//   5199: VITE_COMING_SOON_MODE=false (the full LandingV12 page and app routes)
//   5198: VITE_COMING_SOON_MODE=true  (the Coming Soon gate that was live)
// Headed Chromium so the run is visible. Output: docs/web-audit/old/.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(process.cwd(), '../docs/web-audit/old');
mkdirSync(OUT, { recursive: true });
const FULL = 'http://localhost:5199';
const GATE = 'http://localhost:5198';
const JPG = { type: 'jpeg', quality: 82 };

const WIDTHS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: '1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

async function settle(page, ms = 600) { await page.waitForTimeout(ms); }

async function revealAll(page) {
  // Walk the page so IntersectionObserver reveals and framer whileInView fire.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(140); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 900);
}

async function shotFull(page, file) { await page.screenshot({ path: resolve(OUT, file), fullPage: true, ...JPG }); }
async function shotFold(page, file) { await page.screenshot({ path: resolve(OUT, file), ...JPG }); }
async function shotEl(loc, file) {
  try { await loc.scrollIntoViewIfNeeded(); await loc.page().waitForTimeout(500); await loc.screenshot({ path: resolve(OUT, file), ...JPG }); }
  catch (e) { console.warn('skip', file, e.message.split('\n')[0]); }
}

async function facts(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.alv12 *'));
    const tally = (key) => { const m = new Map(); for (const el of els) { const v = getComputedStyle(el)[key]; if (!v) continue; m.set(v, (m.get(v) || 0) + 1); } return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 40); };
    const text = document.querySelector('.alv12')?.innerText || '';
    return {
      colors: tally('color'), backgrounds: tally('backgroundColor'), fonts: tally('fontFamily'), weights: tally('fontWeight'),
      radii: tally('borderRadius'), shadows: tally('boxShadow').filter(([v]) => v !== 'none'),
      uppercase: els.filter((e) => getComputedStyle(e).textTransform === 'uppercase').length,
      gradients: els.filter((e) => getComputedStyle(e).backgroundImage.includes('gradient')).length,
      emDashes: (text.match(/—/g) || []).length,
      fontSizes: tally('fontSize').slice(0, 30),
      letterSpacing: tally('letterSpacing').slice(0, 15),
    };
  });
}

const browser = await chromium.launch({ headless: false });
const collected = {};
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: w.viewport, deviceScaleFactor: w.deviceScaleFactor, isMobile: !!w.isMobile, hasTouch: !!w.hasTouch });
  const page = await ctx.newPage();

  // ---------- Full LandingV12 ----------
  await page.goto(FULL + '/', { waitUntil: 'networkidle' });
  await settle(page, 1500);
  await shotFold(page, `landing-${w.name}-fold.jpg`);
  await revealAll(page);
  await shotFull(page, `landing-${w.name}.jpg`);
  collected['landing' + w.name] = await facts(page);

  const root = page.locator('.alv12');
  const kids = root.locator(':scope > *');
  const names = ['nav', 'hero', 'report', 'loop', 'labels', 'how', 'privacy', 'ways', 'trust', 'final-cta', 'footer'];
  const n = await kids.count();
  for (let i = 0; i < n && i < names.length; i++) await shotEl(kids.nth(i), `landing-${w.name}-s${String(i).padStart(2, '0')}-${names[i]}.jpg`);

  // States: nav hover underline, card hover, way-card hover (desktop only)
  if (w.name === '1440') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.al-navlink', { hasText: 'How it works' }).hover(); await settle(page, 400);
    await shotEl(kids.nth(0), `landing-${w.name}-state-nav-hover.jpg`);
    await page.locator('#report .al-card').hover(); await settle(page, 400);
    await shotEl(kids.nth(2), `landing-${w.name}-state-report-card-hover.jpg`);
    await page.locator('.al-way').first().hover(); await settle(page, 450);
    await shotEl(kids.nth(7), `landing-${w.name}-state-way-hover.jpg`);
  }
  // Feedback loop: tap all four signals
  const loop = kids.nth(3);
  await loop.scrollIntoViewIfNeeded();
  const feed = page.locator('.al-feed');
  await feed.locator('button').nth(0).dispatchEvent('click'); await settle(page, 500);
  await shotEl(loop, `landing-${w.name}-state-loop-1tap.jpg`);
  await feed.locator('button', { hasText: 'Follow' }).dispatchEvent('click'); await settle(page, 300);
  await feed.locator('button').filter({ hasText: /3,20/ }).dispatchEvent('click'); await settle(page, 300);
  await feed.locator('button', { hasText: 'Shop now' }).dispatchEvent('click'); await settle(page, 700);
  await shotEl(loop, `landing-${w.name}-state-loop-4taps.jpg`);
  await page.locator('button', { hasText: 'Start over' }).dispatchEvent('click'); await settle(page, 300);
  // How it works: each step
  const how = kids.nth(5);
  const steps = how.locator('button[aria-pressed]');
  for (let i = 0; i < 3; i++) { await steps.nth(i).dispatchEvent('click'); await settle(page, 700); await shotEl(how, `landing-${w.name}-state-how-step${i + 1}.jpg`); }
  // Labels marquee a beat later, to show the movement
  await settle(page, 1200);
  await shotEl(kids.nth(4), `landing-${w.name}-state-labels-later.jpg`);

  // ---------- Other app routes ----------
  for (const [path, name] of [['/methodology', 'methodology'], ['/privacy', 'privacy'], ['/terms', 'terms'], ['/plus', 'plus'], ['/start', 'start'], ['/does-not-exist', '404']]) {
    await page.goto(FULL + path, { waitUntil: 'networkidle' }); await settle(page, 1200);
    await shotFold(page, `${name}-${w.name}-fold.jpg`);
    await revealAll(page);
    await shotFull(page, `${name}-${w.name}.jpg`);
  }

  // ---------- Coming Soon gate (what was actually live) ----------
  await page.goto(GATE + '/', { waitUntil: 'networkidle' }); await settle(page, 1200);
  await shotFold(page, `gate-${w.name}-fold.jpg`);
  await revealAll(page);
  await shotFull(page, `gate-${w.name}.jpg`);
  await shotEl(page.locator('nav[aria-label="Main navigation"]'), `gate-${w.name}-s00-nav.jpg`);
  await shotEl(page.locator('.sticky').first(), `gate-${w.name}-s01-banner.jpg`);
  await shotEl(page.locator('#main-content section').first(), `gate-${w.name}-s02-waitlist.jpg`);
  await shotEl(page.locator('footer').first(), `gate-${w.name}-s03-footer.jpg`);
  if (w.name === '390') await shotEl(page.locator('nav[aria-label="Mobile navigation"]'), `gate-${w.name}-s04-tabbar.jpg`);
  if (w.name === '1440') { await page.locator('nav[aria-label="Main navigation"] span[role=link]').first().hover(); await settle(page, 400); await shotEl(page.locator('nav[aria-label="Main navigation"]'), `gate-${w.name}-state-disabled-hover.jpg`); }
  // Waitlist form states: empty submit, invalid
  await page.locator('#main-content form button[type=submit]').click(); await settle(page, 400);
  await shotEl(page.locator('#main-content section').first(), `gate-${w.name}-state-form-empty.jpg`);
  await page.fill('#main-content form input[type=email]', 'not-an-email'); await page.locator('#main-content form button[type=submit]').click(); await settle(page, 400);
  await shotEl(page.locator('#main-content section').first(), `gate-${w.name}-state-form-invalid.jpg`);

  await ctx.close();

  // ---------- Reduced motion ----------
  const rm = await browser.newContext({ viewport: w.viewport, deviceScaleFactor: w.deviceScaleFactor, reducedMotion: 'reduce' });
  const rp = await rm.newPage();
  await rp.goto(FULL + '/', { waitUntil: 'networkidle' }); await settle(rp, 1200);
  await shotFold(rp, `landing-${w.name}-state-reduced-motion-fold.jpg`);
  await rm.close();
}
writeFileSync(resolve(OUT, 'old-site-facts.json'), JSON.stringify(collected, null, 2));
await browser.close();
console.log('done ->', OUT);
