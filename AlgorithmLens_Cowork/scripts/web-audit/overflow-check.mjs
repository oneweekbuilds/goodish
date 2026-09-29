// Horizontal overflow check: document width against the viewport at the five
// audit widths, for every static page. Fails if any page is wider than its
// viewport (a horizontal scrollbar on a phone).
//   node scripts/web-audit/overflow-check.mjs [baseUrl]
import { chromium } from 'playwright';
const BASE = (process.argv[2] || 'https://www.algorithmlens.com').replace(/\/$/, '');
const PAGES = ['/', '/explore/', '/explore/specimen.html', '/explore/experience-film.html', '/privacy/', '/about/', '/terms', '/methodology', '/this-page-does-not-exist'];
const WIDTHS = [375, 390, 430, 768, 1440];
const browser = await chromium.launch();
let failures = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 700, hasTouch: width < 700, deviceScaleFactor: width < 700 ? 2 : 1 });
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const doc = document.documentElement;
      const wide = Array.from(document.querySelectorAll('body *')).filter((e) => e.getBoundingClientRect().right > doc.clientWidth + 1 && getComputedStyle(e).position !== 'fixed');
      return { sw: doc.scrollWidth, cw: doc.clientWidth, wide: wide.slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')) };
    });
    const bad = r.sw > r.cw;
    if (bad) failures++;
    console.log(`${bad ? 'FAIL' : 'ok  '} ${String(width).padStart(4)} ${path.padEnd(32)} document ${r.sw} in ${r.cw}${bad ? ' ' + r.wide.join(', ') : ''}`);
  }
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
