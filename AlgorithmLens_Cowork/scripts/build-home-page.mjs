#!/usr/bin/env node
// Fills in the generated parts of the home page (public/index.html), in place.
//
// The QR code beside the beta button. It encodes BETA_LINK, the TestFlight
// link at the top of public/landing.js, and is written as inline SVG between
// the two "beta-qr" comment markers in the hero. The page shows it from
// 1024 px on devices with a mouse or trackpad (the CSS decides), for a
// visitor reading on a computer who wants to open the beta on their iPhone.
// If BETA_LINK is empty the block is left empty and nothing shows.
//
// The same functions serve scripts/build-tt-page.mjs, which draws the code
// for TIKTOK_BETA_LINK on /tt/.
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

/** Line endings as git stores them (see scripts/build-tt-page.mjs for why). */
export const lf = (text) => text.replace(/\r\n/g, '\n');

const QR_START = '<!-- beta-qr:start -->';
const QR_END = '<!-- beta-qr:end -->';
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

/** The page with the block between the markers replaced by the code for `link`. Throws if the markers are missing or repeated. */
export function fillBetaQr(html, link) {
  const a = html.indexOf(QR_START);
  const b = html.indexOf(QR_END);
  if (a < 0 || b < a || html.indexOf(QR_START, a + 1) >= 0 || html.indexOf(QR_END, b + 1) >= 0) {
    throw new Error('build-home-page: expected exactly one pair of beta-qr markers');
  }
  const block = betaQrBlock(link);
  return html.slice(0, a + QR_START.length) + '\n' + (block ? block + '\n' : '') + html.slice(b);
}

/** The home page as it should be committed, given landing.js. */
export function renderHome(html, js) {
  return fillBetaQr(lf(html), betaLinks(js).beta);
}

function main() {
  const current = lf(readFileSync(HOME, 'utf8'));
  const out = renderHome(current, readFileSync(LANDING_JS, 'utf8'));
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
