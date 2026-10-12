#!/usr/bin/env node
// Renders /tt/ (public/tt/index.html) from the home page (public/index.html).
//
// /tt/ is the page linked from TikTok. It is the home page with two
// differences: <html data-beta-group="tiktok">, which makes landing.js point
// the beta buttons at TIKTOK_BETA_LINK (a separate TestFlight group, so
// installs that came from TikTok can be counted in App Store Connect) and
// name the launch-list form's source "algorithmlens-launch-list-tt"; and
// <meta name="robots" content="noindex">, so search engines keep the home
// page as the one copy. The canonical link stays on the home page for the
// same reason; og:url names /tt/ so a share of the TikTok page lands back
// on it.
//
// Runs before every `npm run build` (the prebuild script) and by hand as
// `npm run build:tt`. src/ttPage.test.js pins the committed copy to this
// output, so an edit to index.html that is not followed by a regeneration
// fails the test rather than drifting.
//
// Usage: node scripts/build-tt-page.mjs [--check]
//   --check  exit 1 if public/tt/index.html is not what this would write.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SOURCE = path.join(here, '..', 'public', 'index.html');
export const TARGET = path.join(here, '..', 'public', 'tt', 'index.html');

/** One exact replacement; throws if the anchor is missing or ambiguous, so a refactor of index.html cannot produce a quietly wrong /tt/. */
function once(html, from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`build-tt-page: expected exactly one ${JSON.stringify(from)} in public/index.html, found ${n}`);
  return html.replace(from, to);
}

/** The home page's markup, turned into the /tt/ page. */
export function renderTt(html) {
  let out = html;
  out = once(out, '<!doctype html>\n<html lang="en">',
    '<!doctype html>\n<!-- Generated from public/index.html by scripts/build-tt-page.mjs. Do not edit by hand; run npm run build:tt. -->\n<html lang="en" data-beta-group="tiktok">');
  out = once(out, '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="robots" content="noindex">');
  out = once(out, '<meta property="og:url" content="https://www.algorithmlens.com/">',
    '<meta property="og:url" content="https://www.algorithmlens.com/tt/">');
  // The canonical link must still name the home page.
  if (!out.includes('<link rel="canonical" href="https://www.algorithmlens.com/">')) {
    throw new Error('build-tt-page: the canonical link to the home page is missing');
  }
  return out;
}

function main() {
  const html = readFileSync(SOURCE, 'utf8');
  const out = renderTt(html);
  if (process.argv.includes('--check')) {
    const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : null;
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
