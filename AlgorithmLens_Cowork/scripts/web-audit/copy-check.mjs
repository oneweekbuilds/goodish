// Copy checks for the static pages: uppercase transforms, em dashes,
// forbidden inference verbs and completeness claims. Runs against a base URL.
//   node scripts/web-audit/copy-check.mjs [baseUrl]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const BASE = (process.argv[2] || 'https://www.algorithmlens.com').replace(/\/$/, '');
const PAGES = ['/', '/explore/', '/explore/specimen.html', '/explore/experience-film.html', '/privacy/', '/about/', '/terms', '/methodology', '/404.html'];
// Locked mirror texts: the privacy policy, the terms and the methodology are the app's own
// documents (legal text and the verbatim analysis prompts), not marketing copy.
const LOCKED = new Set(['/privacy/', '/terms', '/methodology']);
// D-192: the verb lists, the agency claims, the certainty markers, the
// completeness claims, the em dash, the colour tokens and the motion curve
// come from canon/canon.json, the copy the mobile repo writes with
// scripts/export-example-record.mjs, so the two scanners cannot drift. The
// JSON holds regular expression sources, compiled with the flags it names.
const here = path.dirname(fileURLToPath(import.meta.url));
const CANON = JSON.parse(readFileSync(path.join(here, '..', '..', 'canon', 'canon.json'), 'utf8'));
const compile = (e) => new RegExp(e.pattern, e.flags ?? '');
const VERBS = [...CANON.forbiddenInferenceVerbs, ...CANON.agencyClaims, ...CANON.certaintyMarkers].map(compile);
// Two site-only agency shapes the mobile list does not need (its copy never second-persons the platform).
VERBS.push(/\bwants? you\b/i, /\btargets? you\b/i);
const COMPLETE = CANON.completenessClaims.map(compile);
const NEGATED = compile(CANON.completenessNegation);
const EM = new RegExp(CANON.emDash, 'g');
// Colour and motion parity: a page that defines these custom properties must define them as the canon does.
const TOKEN_VARS = { '--paper': CANON.colours.paper, '--ink': CANON.colours.ink, '--muted': CANON.colours.muted, '--line': CANON.colours.line, '--blue': CANON.colours.blue, '--green': CANON.colours.green };
const CANON_EASE = `cubic-bezier(${CANON.motion.curve.join(',')})`;
const normalizeEase = (s) => s.replace(/\s+/g, '').replace(/0\./g, '.').replace(/\(\./g, '(.').toLowerCase();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failures = 0;
for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const r = await page.evaluate((emDash) => {
    const els = Array.from(document.querySelectorAll('body *'));
    const upper = els.filter((e) => getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim()).length;
    const gradients = els.filter((e) => { const b = getComputedStyle(e).backgroundImage; return b.includes('linear-gradient') && !b.includes('radial-gradient'); }).length;
    // Verbatim quoted source (the methodology's prompt strings, in <pre>) is not the site's own copy.
    const quoted = Array.from(document.querySelectorAll('pre')).map((e) => e.innerText).join('\n');
    const text = document.body.innerText;
    const html = document.documentElement.outerHTML;
    const em = new RegExp(emDash, 'g');
    let emHtml = (html.match(em) || []).length;
    Array.from(document.querySelectorAll('pre')).forEach((e) => { emHtml -= (e.outerHTML.match(em) || []).length; });
    const rootStyle = getComputedStyle(document.documentElement);
    const vars = {};
    for (const name of ['--paper', '--ink', '--muted', '--line', '--blue', '--green', '--ease', '--tick', '--beat', '--settle']) {
      const v = rootStyle.getPropertyValue(name).trim();
      if (v) vars[name] = v;
    }
    return { upper, gradients, text, quoted, emHtml, vars };
  }, CANON.emDash);
  const em = (r.text.match(EM) || []).length - (r.quoted.match(EM) || []).length;
  const verbs = LOCKED.has(path) ? [] : VERBS.flatMap((v) => r.text.match(new RegExp(v.source, 'gi')) || []);
  // A completeness claim is a sentence that asserts the whole feed; a sentence that denies it ("not your whole feed") is a limit.
  const sentences = r.text.split(/(?<=[.!?])\s+|\n+/);
  const complete = LOCKED.has(path) ? [] : sentences.filter((sen) => COMPLETE.some((v) => v.test(sen)) && !NEGATED.test(sen));
  const drift = [];
  for (const [name, want] of Object.entries(TOKEN_VARS)) {
    if (r.vars[name] && r.vars[name].toUpperCase() !== want.toUpperCase()) drift.push(`${name} ${r.vars[name]} (canon ${want})`);
  }
  if (r.vars['--ease'] && normalizeEase(r.vars['--ease']) !== normalizeEase(CANON_EASE)) drift.push(`--ease ${r.vars['--ease']} (canon ${CANON_EASE})`);
  for (const [name, key] of [['--tick', 'tick'], ['--beat', 'beat'], ['--settle', 'settle']]) {
    if (r.vars[name] && r.vars[name] !== `${CANON.motion[key]}ms`) drift.push(`${name} ${r.vars[name]} (canon ${CANON.motion[key]}ms)`);
  }
  const bad = r.upper || em || r.emHtml || verbs.length || complete.length || drift.length;
  if (bad) failures++;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${path}: uppercase ${r.upper}, em dashes ${em} (in html ${r.emHtml}), linear gradients ${r.gradients}, inference verbs [${verbs.join(', ')}], completeness [${complete.join(' | ')}], canon drift [${drift.join(' | ')}]`);
}
await browser.close();
process.exit(failures ? 1 : 0);
