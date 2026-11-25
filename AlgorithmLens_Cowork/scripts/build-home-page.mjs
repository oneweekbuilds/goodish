#!/usr/bin/env node
// Fills in the generated parts of the home page (public/index.html), in place.
// Each part sits between a pair of comment markers; everything else in the
// file is written by hand.
//
// 1. The QR code beside the beta button ("beta-qr"). It encodes BETA_LINK,
//    the TestFlight link at the top of public/landing.js, as inline SVG. The
//    page shows it from 1024 px on devices with a mouse or trackpad (the CSS
//    decides), for a visitor reading on a computer who wants to open the beta
//    on their iPhone. If BETA_LINK is empty the block is left empty and
//    nothing shows. The same functions serve scripts/build-tt-page.mjs,
//    which draws the code for TIKTOK_BETA_LINK on /tt/.
//
// 2. Three views of the newest example scan, in the report section
//    ("report-views"): followed, suggested and unknown; the accounts that
//    appeared more than once; and the observed, inferred, unknown key. Every
//    number is counted here from the explorer's own data
//    (public/explore/examples.js) with the explorer's own definitions
//    (stats() in public/explore/explore.js), so the home page and the
//    explorer cannot quote different counts. src/homePage.test.js runs the
//    explorer's stats() beside scanStats() below to hold the two together.
//
// 3. The beta links themselves. The hero button (#betaButton) and the header
//    pill (#betaPill) carry BETA_LINK in their href in the markup, so they
//    work before any script runs. While BETA_LINK is empty they point at
//    #launch, and landing.js relabels them.
//
// 4. Structured data ("structured-data", in the head): one JSON-LD block
//    describing the app and the page's questions. It is built from what the
//    page already says: the description from the meta description, the
//    questions and answers from the questions section word for word, the
//    install address from BETA_LINK, the author from the about page. It
//    carries no rating, no review and no company detail. A block of type
//    application/ld+json is data, not script, so the Content-Security-Policy
//    (script-src 'self') has nothing to refuse.
//
// Runs before every `npm run build` (the prebuild script, ahead of the /tt/
// page, which is rendered from this one) and by hand as `npm run build:home`.
// src/homePage.test.js pins the committed page to this output, so a change
// of link that is not followed by a regeneration fails the test.
//
// Usage: node scripts/build-home-page.mjs [--check]
//   --check  exit 1 if public/index.html is not what this would write.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { qrSvg } from './qr.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const HOME = path.join(here, '..', 'public', 'index.html');
export const LANDING_JS = path.join(here, '..', 'public', 'landing.js');
export const EXAMPLES_JS = path.join(here, '..', 'public', 'explore', 'examples.js');

/** Line endings as git stores them (see scripts/build-tt-page.mjs for why). */
export const lf = (text) => text.replace(/\r\n/g, '\n');

const JOIN_LINK = /^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/;

/** The two TestFlight links, read from the constants at the top of landing.js. Either may be empty. */
export function betaLinks(js) {
  const read = (name) => {
    const m = lf(js).match(new RegExp(`^const ${name} = "([^"]*)";$`, 'm'));
    if (!m) throw new Error(`build-home-page: ${name} not found in public/landing.js`);
    if (m[1] && !JOIN_LINK.test(m[1])) throw new Error(`build-home-page: ${name} is not a TestFlight join link`);
    return m[1];
  };
  return { beta: read('BETA_LINK'), tiktok: read('TIKTOK_BETA_LINK') };
}

/** The markup that sits between the markers for one link: the code and its one line of help. */
export function betaQrBlock(link) {
  if (!link) return '';
  const svg = qrSvg(link, { title: 'QR code that opens the AlgorithmLens beta on TestFlight', className: 'qr', scale: 3, dark: '#3A3730', light: '#FFFFFF' });
  return `${svg}\n<p class="qr-note">On a computer? Point your iPhone camera at this code.</p>`;
}

/** The block between <!-- name:start --> and <!-- name:end -->, replaced. Throws if the markers are missing or repeated. */
export function fill(html, name, block) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b < a || html.indexOf(start, a + 1) >= 0 || html.indexOf(end, b + 1) >= 0) {
    throw new Error(`build-home-page: expected exactly one pair of ${name} markers`);
  }
  return html.slice(0, a + start.length) + '\n' + (block ? block + '\n' : '') + html.slice(b);
}

/** The page with the QR block redrawn for `link` (empty when there is no link). */
export function fillBetaQr(html, link) {
  return fill(html, 'beta-qr', betaQrBlock(link));
}

/** The explorer's example data: public/explore/examples.js assigns window.EXAMPLES. */
export function loadExamples(src) {
  const window = {};
  new Function('window', src)(window);
  if (!window.EXAMPLES || !window.EXAMPLES.record || !Array.isArray(window.EXAMPLES.record.scans)) {
    throw new Error('build-home-page: public/explore/examples.js did not define EXAMPLES.record.scans');
  }
  return window.EXAMPLES;
}

/**
 * One scan's counts, by the same definitions as stats() in
 * public/explore/explore.js: an ad label is is_ad === true and an unreadable
 * one is is_ad === null; origin is one of followed, suggested, unknown;
 * accounts are grouped by the creator name, most appearances first, then by
 * name; political is true, false or null (not assessed).
 */
export function scanStats(scan) {
  const posts = scan.posts;
  const byName = new Map();
  for (const p of posts) {
    if (!p.creator) continue;
    if (!byName.has(p.creator)) byName.set(p.creator, []);
    byName.get(p.creator).push(p.position);
  }
  const accounts = [...byName].map(([name, positions]) => ({ name, positions }))
    .sort((a, b) => b.positions.length - a.positions.length || a.name.localeCompare(b.name));
  return {
    n: posts.length,
    ads: posts.filter((p) => p.is_ad === true).length,
    adUnknown: posts.filter((p) => p.is_ad === null).length,
    followed: posts.filter((p) => p.origin === 'followed').length,
    suggested: posts.filter((p) => p.origin === 'suggested').length,
    originUnknown: posts.filter((p) => p.origin === 'unknown').length,
    accounts,
    accountUnknown: posts.filter((p) => !p.creator).length,
    political: posts.filter((p) => p.political === true).length,
    politicalUnknown: posts.filter((p) => p.political === null).length,
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** "1, 4 and 22" */
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** The three views, as markup, for one scan of the explorer's data. */
export function reportViewsBlock(scan) {
  const st = scanStats(scan);
  const when = new Date(scan.recorded_at);
  const day = `${MONTHS[when.getUTCMonth()]} ${when.getUTCDate()}`;
  const marks = (n) => '<i></i>'.repeat(n);
  const repeats = st.accounts.filter((a) => a.positions.length > 1);
  const once = st.accounts.length - repeats.length;

  const origin = `<figure class="view" data-reveal>
<figcaption><span class="kicker">Where posts came from</span><h3>${st.followed} followed, ${st.suggested} suggested, ${st.originUnknown} unknown</h3></figcaption>
<div class="units" role="img" aria-label="${st.n} posts as marks in three rows: ${st.followed} followed, ${st.suggested} suggested, ${st.originUnknown} unknown">
<div class="unit f"><span>Followed</span><span class="marks">${marks(st.followed)}</span></div>
<div class="unit s"><span>Suggested</span><span class="marks">${marks(st.suggested)}</span></div>
<div class="unit u"><span>Unknown</span><span class="marks">${marks(st.originUnknown)}</span></div>
</div>
<p class="view-note">One mark is one post. Unknown means the scan could not tell which.</p>
</figure>`;

  const tracks = repeats.map((a) => `<div class="track"><div class="track-head"><b>${escapeHtml(a.name)}</b><span>posts ${listOf(a.positions)}</span></div><div class="ticks" aria-hidden="true">${scan.posts.map((p) => (a.positions.includes(p.position) ? '<i class="on"></i>' : '<i></i>')).join('')}</div></div>`).join('\n');
  const accounts = `<figure class="view" data-reveal>
<figcaption><span class="kicker">Accounts that came back</span><h3>${repeats.length} of ${st.accounts.length} accounts appeared more than once</h3></figcaption>
<div class="tracks">
${tracks}
</div>
<p class="view-note">Each strip is the feed in order, ${st.n} posts. The other ${plural(once, 'account', 'accounts')} appeared once.</p>
<p class="view-limit">Appearances in this scan, not a measure of influence or of your preference.</p>
</figure>`;

  const key = `<figure class="view" data-reveal>
<figcaption><span class="kicker">How each fact is marked</span><h3>Observed, inferred or unknown</h3></figcaption>
<dl class="keylist">
<div><dt><i class="obs"></i>Observed</dt><dd>A label or a name the scan could read. ${st.ads} of ${st.n} posts carried an ad label.</dd></div>
<div><dt><i class="inf"></i>Inferred</dt><dd>A reading of the content, marked as one. ${st.political} of ${st.n} posts were classified as political.</dd></div>
<div><dt><i class="unk"></i>Unknown</dt><dd>What the scan could not read: ${plural(st.adUnknown, 'ad label', 'ad labels')}, and ${plural(st.politicalUnknown, 'post', 'posts')} not assessed for politics.</dd></div>
</dl>
</figure>`;

  return `<div class="views">
<p class="views-head" data-reveal><span class="label">Also in the report, from the scan of ${day}</span></p>
<div class="views-grid">
${origin}
${accounts}
${key}
</div>
</div>`;
}

/** The page with the hero button and the header pill pointed at `link` (or at the launch list when there is none). */
export function setBetaHrefs(html, link) {
  const target = link || '#launch';
  let out = html;
  for (const anchor of ['<a class="pill" id="betaPill" href="', '<a class="button" id="betaButton" href="']) {
    const at = out.indexOf(anchor);
    if (at < 0 || out.indexOf(anchor, at + 1) >= 0) throw new Error(`build-home-page: expected exactly one ${anchor}`);
    const from = at + anchor.length;
    out = out.slice(0, from) + target + out.slice(out.indexOf('"', from));
  }
  return out;
}

const decode = (text) => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const plainText = (markup) => decode(markup.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** The questions section as written on the page: [{ question, answer }], the answer without its "From the ..." line. */
export function pageQuestions(html) {
  const from = html.indexOf('<section id="faq"');
  const to = html.indexOf('</section>', from);
  if (from < 0 || to < 0) throw new Error('build-home-page: the questions section is missing');
  const section = html.slice(from, to);
  const out = [];
  const each = /<div class="qa"[^>]*>\s*<h3>(.*?)<\/h3>\s*<div class="a">\s*<p>(.*?)<\/p>/gs;
  let m;
  while ((m = each.exec(section))) out.push({ question: plainText(m[1]), answer: plainText(m[2]) });
  if (!out.length) throw new Error('build-home-page: no questions found in the questions section');
  return out;
}

/** The JSON-LD block for the head: the app, and the page's questions. */
export function structuredDataBlock(html, link) {
  const description = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
  if (!description) throw new Error('build-home-page: the meta description is missing');
  const app = {
    '@type': 'SoftwareApplication',
    name: 'AlgorithmLens',
    description: decode(description),
    url: 'https://www.algorithmlens.com/',
    operatingSystem: 'iOS 15.1 and later',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Justin Winuk' },
  };
  if (link) app.installUrl = link;
  const faq = {
    '@type': 'FAQPage',
    mainEntity: pageQuestions(html).map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': [app, faq] }, null, 1).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

/** The home page as it should be committed, given landing.js and the explorer's examples.js. */
export function renderHome(html, js, examplesSrc) {
  const link = betaLinks(js).beta;
  let out = fillBetaQr(lf(html), link);
  out = setBetaHrefs(out, link);
  const scans = loadExamples(examplesSrc).record.scans;
  out = fill(out, 'report-views', reportViewsBlock(scans[scans.length - 1]));
  out = fill(out, 'structured-data', structuredDataBlock(out, link));
  return out;
}

function main() {
  const current = lf(readFileSync(HOME, 'utf8'));
  const out = renderHome(current, readFileSync(LANDING_JS, 'utf8'), readFileSync(EXAMPLES_JS, 'utf8'));
  if (process.argv.includes('--check')) {
    if (current !== out) {
      console.error('public/index.html is out of date; run npm run build:home');
      process.exit(1);
    }
    console.log('public/index.html is up to date');
    return;
  }
  if (current !== out) writeFileSync(HOME, out);
  console.log(`${current !== out ? 'wrote' : 'unchanged'} ${HOME} ${Buffer.byteLength(out)} bytes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
