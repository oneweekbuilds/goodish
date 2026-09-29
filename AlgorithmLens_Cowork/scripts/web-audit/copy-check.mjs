// Copy checks for the static pages: uppercase transforms, em dashes,
// forbidden inference verbs and completeness claims. Runs against a base URL.
//   node scripts/web-audit/copy-check.mjs [baseUrl]
import { chromium } from 'playwright';
const BASE = (process.argv[2] || 'https://www.algorithmlens.com').replace(/\/$/, '');
const PAGES = ['/', '/explore/', '/explore/specimen.html', '/explore/experience-film.html', '/privacy/', '/about/', '/terms', '/methodology', '/404.html'];
// Locked mirror texts: the privacy policy, the terms and the methodology are the app's own
// documents (legal text and the verbatim analysis prompts), not marketing copy.
const LOCKED = new Set(['/privacy/', '/terms', '/methodology']);
const VERBS = [/\bbecause\b/i, /\bproves?\b/i, /\bshows? that\b/i, /\bis designed to\b/i, /\balways\b/i, /\bdefinitely\b/i, /\bchosen for you\b/i, /\bwants? you\b/i, /\btargets? you\b/i];
const COMPLETE = [/\byour (whole|entire|full) feed\b/i, /\bevery post\b/i, /\ball (of )?your posts\b/i, /\beverything (you|in your feed)\b/i, /\bcomplete (picture|history)\b/i];
const NEGATED = /\b(not|cannot|never|only)\b/i;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failures = 0;
for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('body *'));
    const upper = els.filter((e) => getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim()).length;
    const gradients = els.filter((e) => { const b = getComputedStyle(e).backgroundImage; return b.includes('linear-gradient') && !b.includes('radial-gradient'); }).length;
    // Verbatim quoted source (the methodology's prompt strings, in <pre>) is not the site's own copy.
    const quoted = Array.from(document.querySelectorAll('pre')).map((e) => e.innerText).join('\n');
    const text = document.body.innerText;
    const html = document.documentElement.outerHTML;
    let emHtml = (html.match(/—/g) || []).length;
    Array.from(document.querySelectorAll('pre')).forEach((e) => { emHtml -= (e.outerHTML.match(/—/g) || []).length; });
    return { upper, gradients, text, quoted, emHtml };
  });
  const em = (r.text.match(/—/g) || []).length - (r.quoted.match(/—/g) || []).length;
  const verbs = LOCKED.has(path) ? [] : VERBS.flatMap((v) => r.text.match(new RegExp(v.source, 'gi')) || []);
  // A completeness claim is a sentence that asserts the whole feed; a sentence that denies it ("not your whole feed") is a limit.
  const sentences = r.text.split(/(?<=[.!?])\s+|\n+/);
  const complete = LOCKED.has(path) ? [] : sentences.filter((sen) => COMPLETE.some((v) => v.test(sen)) && !NEGATED.test(sen));
  const bad = r.upper || em || r.emHtml || verbs.length || complete.length;
  if (bad) failures++;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${path}: uppercase ${r.upper}, em dashes ${em} (in html ${r.emHtml}), linear gradients ${r.gradients}, inference verbs [${verbs.join(', ')}], completeness [${complete.join(' | ')}]`);
}
await browser.close();
process.exit(failures ? 1 : 0);
