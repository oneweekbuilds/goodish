#!/usr/bin/env node
// Renders /tt/ (public/tt/index.html), the page linked from TikTok.
//
// It is a short page, built from parts of the home page (public/index.html)
// so the two cannot say different things: the head and stylesheet, the
// dateline, the headline, the lede, the three lines under the button, the
// limit, and the hero's example screen are lifted from the home page as
// written. Under them it prints three findings from the newest example scan,
// counted from the explorer's data with the same function the home page's
// report views use, and repeats the button. There is no demo, no form and no
// script on it.
//
// What makes it the TikTok page:
//   - <html data-beta-group="tiktok">, and both buttons and the QR code carry
//     TIKTOK_BETA_LINK (top of public/landing.js), a separate TestFlight
//     group, so installs that came from TikTok can be counted in App Store
//     Connect. While that link is empty they carry BETA_LINK.
//   - <meta name="robots" content="noindex">, so search engines keep the home
//     page as the one copy. The canonical link stays on the home page for
//     the same reason; og:url names /tt/ so a share of this page lands back
//     on it. It carries no structured data.
//
// Runs before every `npm run build` (the prebuild script, after the home
// page's own generator) and by hand as `npm run build:tt`.
// src/ttPage.test.js pins the committed copy to this output, so an edit to
// index.html that is not followed by a regeneration fails the test rather
// than drifting.
//
// Usage: node scripts/build-tt-page.mjs [--check]
//   --check  exit 1 if public/tt/index.html is not what this would write.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { betaLinks, betaQrBlock, fill, loadExamples, scanStats, LANDING_JS, EXAMPLES_JS } from './build-home-page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SOURCE = path.join(here, '..', 'public', 'index.html');
export const TARGET = path.join(here, '..', 'public', 'tt', 'index.html');

/** One exact replacement; throws if the anchor is missing or ambiguous, so a refactor of index.html cannot produce a quietly wrong /tt/. */
function once(html, from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`build-tt-page: expected exactly one ${JSON.stringify(from)} in public/index.html, found ${n}`);
  return html.replace(from, to);
}

/** The one stretch of the home page between two anchors, anchors included; throws if either is missing or repeated. */
function lift(html, start, end, what) {
  const a = html.indexOf(start);
  if (a < 0 || html.indexOf(start, a + 1) >= 0) throw new Error(`build-tt-page: expected exactly one ${what} on the home page`);
  const b = html.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`build-tt-page: the ${what} on the home page does not end where expected`);
  return html.slice(a, b + end.length);
}

/**
 * Line endings as git stores them. On a Windows clone with core.autocrlf=true a
 * checkout (a branch switch, a pull) rewrites these files with CRLF, and the
 * anchors below are written with LF; normalizing here keeps the generator and
 * its test independent of how the working tree happens to be checked out.
 */
export const lf = (text) => text.replace(/\r\n/g, '\n');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Layout that only this page needs. Everything else is the home page's stylesheet, lifted with its head.
const TT_CSS = `/* /tt/ only: three findings from the example scan, the closing button, a one-row footer */
.tt-finds{list-style:none;margin:0;padding:0;border-top:2px solid var(--ink)}
.tt-finds li{display:flex;flex-direction:column;gap:6px;padding:18px 0 22px;border-bottom:1px solid var(--line)}
.tt-finds .kicker{font-size:13px;line-height:18px;color:var(--muted)}
.tt-finds b{font:400 28px/34px var(--serif);letter-spacing:-.01em;text-wrap:balance}
.tt-cta{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:32px}
.tt-cta .button{width:100%}
.tt-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0 16px;font-size:13px}
.tt-foot nav{display:flex;flex-wrap:wrap;gap:0 22px}
.tt-foot a{display:inline-flex;align-items:center;min-height:44px;color:var(--ink);text-decoration:none}
.tt-foot a:hover{text-decoration:underline;text-decoration-color:var(--blue);text-underline-offset:4px}
footer.bottom.tt{padding:16px 0 20px}
@media(min-width:900px){
.tt-finds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 32px;border-top:0}
.tt-finds li{border-top:2px solid var(--ink);border-bottom:0;padding:16px 0 0}
.tt-finds b{font-size:30px;line-height:36px}
.tt-cta{flex-direction:row;align-items:center;gap:24px;margin-top:48px}
.tt-cta .button{width:auto}
.tt-foot{font-size:14px}
}`;

/** The home page's markup, turned into the /tt/ page. `js` is landing.js (the two beta links); `examplesSrc` is the explorer's examples.js. */
export function renderTt(html, js = readFileSync(LANDING_JS, 'utf8'), examplesSrc = readFileSync(EXAMPLES_JS, 'utf8')) {
  const home = lf(html);
  const links = betaLinks(js);
  // The same rule the home page applies to its own buttons: this group's link, or the general one while it is empty.
  const link = links.tiktok || links.beta || '#top';

  // The head, with the differences this page exists for.
  let head = lift(home, '<!doctype html>', '</head>', 'head');
  head = once(head, '<!doctype html>\n<html lang="en">',
    '<!doctype html>\n<!-- Generated from public/index.html by scripts/build-tt-page.mjs. Do not edit by hand; run npm run build:tt. -->\n<html lang="en" data-beta-group="tiktok">');
  head = once(head, '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="robots" content="noindex">');
  head = once(head, '<meta property="og:url" content="https://www.algorithmlens.com/">',
    '<meta property="og:url" content="https://www.algorithmlens.com/tt/">');
  // The canonical link must still name the home page.
  if (!head.includes('<link rel="canonical" href="https://www.algorithmlens.com/">')) {
    throw new Error('build-tt-page: the canonical link to the home page is missing');
  }
  // The home page is the one copy search engines should describe.
  head = fill(head, 'structured-data', '');
  head = once(head, '</style>\n', `</style>\n<style>\n${TT_CSS}\n</style>\n`);

  // Parts of the home page, as written there.
  const dateline = lift(home, '<p class="dateline">', '</p>', 'dateline');
  const headline = lift(home, '<h1>', '</h1>', 'headline');
  const lede = lift(home, '<p class="lede">Scan a feed you use.', '</p>', 'hero lede');
  const expect = lift(home, '<ol class="expect">', '</ol>', 'list under the button');
  const limit = lift(home, '<p class="limit">A scan reads what appeared on screen.', '</p>', 'hero limit');
  const shot = lift(home, '<div class="shotwrap">', '</figure>\n</div>', 'example screen');
  // The wordmark as the home page's header draws it (it appears there twice, in the header and the footer).
  const brand = '<svg viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens"><use href="/static/img/wordmark.svg#wordmark"/></svg>';
  if (!home.includes(`<a class="brand" href="#top" aria-label="AlgorithmLens home">${brand}</a>`)) {
    throw new Error('build-tt-page: the home page header no longer draws the wordmark the way this page copies it');
  }

  // Three findings from the newest example scan, counted the way the home page's report views count them.
  const scans = loadExamples(examplesSrc).record.scans;
  const scan = scans[scans.length - 1];
  const st = scanStats(scan);
  const when = new Date(scan.recorded_at);
  const day = `${MONTHS[when.getUTCMonth()]} ${when.getUTCDate()}`;
  const repeats = st.accounts.filter((a) => a.positions.length > 1).length;
  const qr = betaQrBlock(links.tiktok || links.beta);

  return `${head}
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar" id="topbar"><div class="wrap">
<header class="top">
<a class="brand" href="/" aria-label="AlgorithmLens home">${brand}</a>
<div class="topnav">
<a class="pill" id="betaPill" href="${link}" rel="noopener noreferrer">Join the beta</a>
</div>
</header>
</div></div>
<main id="main">
<section class="dots" id="top">
<div class="wrap hero">
${dateline}
<div class="oxford" aria-hidden="true"></div>
${headline}
<div class="front">
<div class="copy">
${lede}
<div class="actions">
<a class="button" id="betaButton" href="${link}" rel="noopener noreferrer">Join the beta on iPhone</a>
<!-- beta-qr:start -->
${qr ? qr + '\n' : ''}<!-- beta-qr:end -->
</div>
${expect}
${limit}
</div>
${shot}
</div>
</div>
</section>

<section class="section band" id="findings">
<div class="wrap">
<div class="sec-top grid">
<div class="sec-title">
<p class="sec-head"><span class="label eyebrow">Example</span></p>
<h2>Three findings from one scan.</h2>
</div>
<div class="sec-lede"><p class="lede">Instagram, ${st.n} posts, ${day}. Your own scan gives you these counts for your feed.</p></div>
</div>
<ol class="tt-finds">
<li><span class="kicker">Ad labels</span><b>${st.ads} of ${st.n} posts carried an ad label.</b></li>
<li><span class="kicker">Where posts came from</span><b>${st.followed} followed, ${st.suggested} suggested, ${st.originUnknown} unknown.</b></li>
<li><span class="kicker">Accounts that came back</span><b>${repeats} of ${st.accounts.length} accounts appeared more than once.</b></li>
</ol>
<div class="tt-cta"><a class="button" href="${link}" rel="noopener noreferrer">Join the beta on iPhone</a><a class="textlink" href="/">See the full site</a></div>
</div>
</section>
</main>
<footer class="bottom tt">
<div class="wrap tt-foot">
<span>&copy; 2026 AlgorithmLens</span>
<nav aria-label="More pages"><a href="/">The full site</a><a href="/methodology">Methodology</a><a href="/privacy/">Privacy policy</a><a href="/terms">Terms</a></nav>
</div>
</footer>
</body>
</html>
`;
}

function main() {
  const html = readFileSync(SOURCE, 'utf8');
  const out = renderTt(html);
  if (process.argv.includes('--check')) {
    const current = existsSync(TARGET) ? lf(readFileSync(TARGET, 'utf8')) : null;
    if (current !== out) {
      console.error('public/tt/index.html is out of date; run npm run build:tt');
      process.exit(1);
    }
    console.log('public/tt/index.html is up to date');
    return;
  }
  mkdirSync(path.dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, out);
  console.log(`wrote ${TARGET} ${Buffer.byteLength(out)} bytes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
