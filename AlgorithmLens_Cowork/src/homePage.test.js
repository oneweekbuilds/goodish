// The home page's generated parts (scripts/build-home-page.mjs).
//
// The QR code beside the beta button is written from BETA_LINK in
// public/landing.js (and scripts/build-tt-page.mjs writes the one on /tt/
// from TIKTOK_BETA_LINK). These tests pin the committed pages to the
// generators and read both codes back with a decoder written separately
// from the encoder in scripts/qr.mjs, so a code that does not open the link
// it sits beside fails here.
//
// The three views in the report section are counted from the explorer's
// data. The tests run the explorer's own stats() function, lifted out of
// public/explore/explore.js, beside the generator's, and check the numbers
// the page prints against it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderHome, betaLinks, loadExamples, scanStats, lf, HOME, LANDING_JS, EXAMPLES_JS } from '../scripts/build-home-page.mjs';
import { TARGET as TT } from '../scripts/build-tt-page.mjs';
import { qrMatrix, versionFor, QUIET_ZONE } from '../scripts/qr.mjs';

const home = lf(readFileSync(HOME, 'utf8'));
const tt = lf(readFileSync(TT, 'utf8'));
const js = readFileSync(LANDING_JS, 'utf8');
const examplesSrc = readFileSync(EXAMPLES_JS, 'utf8');
const links = betaLinks(js);

// ---- a small QR reader, for symbols with one Reed-Solomon block (versions 1 to 3 at level M) ----

/** The dark modules of the one QR code on a page, as rows of booleans without the quiet zone. */
function matrixFromPage(html) {
  const svgs = html.match(/<svg class="qr"[^>]*>.*?<\/svg>/gs) || [];
  expect(svgs).toHaveLength(1);
  const svg = svgs[0];
  const span = Number(svg.match(/viewBox="0 0 (\d+) \d+"/)[1]);
  const size = span - 2 * QUIET_ZONE;
  const paths = svg.match(/<path [^>]*>/g);
  expect(paths).toHaveLength(2); // the white ground, then the dark modules
  const d = paths[1].match(/ d="([^"]*)"/)[1];
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const runs = d.match(/M\d+ \d+h\d+v1h-\d+z/g) || [];
  expect(runs.join('')).toBe(d); // nothing in the path but whole runs
  for (const run of runs) {
    const [, x, y, w] = run.match(/M(\d+) (\d+)h(\d+)/).map(Number);
    for (let i = 0; i < w; i++) m[y - QUIET_ZONE][x - QUIET_ZONE + i] = true;
  }
  return m;
}

const MASK = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// GF(256) by log tables (the encoder multiplies bit by bit).
const EXP = new Array(512);
const LOG = new Array(256);
for (let i = 0, v = 1; i < 255; i++) { EXP[i] = v; LOG[v] = i; v <<= 1; if (v & 0x100) v ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/** Reads a version 1 to 3, level M symbol. Returns { version, level, mask, text, syndromesZero, formatOk }. */
function readQr(m) {
  const size = m.length;
  const version = (size - 17) / 4;
  expect([1, 2, 3]).toContain(version);
  const at = (x, y) => (m[y][x] ? 1 : 0);

  // Format information beside the top-left finder: 15 bits, masked with 101010000010010.
  const where = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  let bits = 0;
  where.forEach(([x, y], i) => { bits |= at(x, y) << i; });
  const raw = bits ^ 0x5412;
  const data = raw >>> 10;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const formatOk = (rem & 0x3ff) === (raw & 0x3ff);
  // The second copy, split between the other two finders, must agree.
  const second = [];
  for (let i = 0; i < 8; i++) second.push([size - 1 - i, 8]);
  for (let i = 8; i < 15; i++) second.push([8, size - 15 + i]);
  let bits2 = 0;
  second.forEach(([x, y], i) => { bits2 |= at(x, y) << i; });
  const level = ['M', 'L', 'H', 'Q'][data >>> 3];
  const mask = data & 7;

  // Which modules are not data: finders with separators and format strips, timing, the alignment pattern, the dark module.
  const fn = (x, y) => {
    if (x < 9 && y < 9) return true;
    if (x >= size - 8 && y < 9) return true;
    if (x < 9 && y >= size - 8) return true;
    if (x === 6 || y === 6) return true;
    if (version >= 2) { const c = size - 7; if (Math.abs(x - c) <= 2 && Math.abs(y - c) <= 2) return true; }
    return false;
  };

  // The codeword walk: two-module columns from the right edge, alternately up and down, skipping the timing column.
  const stream = [];
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let k = 0; k < size; k++) {
      const y = up ? size - 1 - k : k;
      for (const x of [col, col - 1]) {
        if (fn(x, y)) continue;
        stream.push(at(x, y) ^ (MASK[mask](x, y) ? 1 : 0));
      }
    }
    up = !up;
  }
  const total = { 1: 26, 2: 44, 3: 70 }[version];
  const dataCount = { 1: 16, 2: 28, 3: 44 }[version];
  const codewords = [];
  for (let i = 0; i < total; i++) codewords.push(stream.slice(i * 8, i * 8 + 8).reduce((a, b) => (a << 1) | b, 0));

  // Reed-Solomon: a valid codeword evaluates to zero at alpha^0 .. alpha^(ec-1).
  let syndromesZero = true;
  for (let i = 0; i < total - dataCount; i++) {
    let v = 0;
    for (const c of codewords) v = mul(v, EXP[i]) ^ c;
    if (v !== 0) syndromesZero = false;
  }

  // Byte mode: 0100, an 8-bit length, the bytes.
  const b = [];
  for (const c of codewords.slice(0, dataCount)) for (let i = 7; i >= 0; i--) b.push((c >>> i) & 1);
  const take = (from, n) => b.slice(from, from + n).reduce((a, x) => (a << 1) | x, 0);
  const modeBits = take(0, 4);
  const length = take(4, 8);
  const bytes = [];
  for (let i = 0; i < length; i++) bytes.push(take(12 + i * 8, 8));
  return { version, level, mask, modeBits, text: new TextDecoder().decode(new Uint8Array(bytes)), syndromesZero, formatOk, formatCopiesAgree: bits === bits2, darkModule: at(8, size - 8) === 1 };
}

describe('the home page QR code', () => {
  it('is what scripts/build-home-page.mjs writes for the current BETA_LINK (run npm run build:home after changing the link)', () => {
    expect(renderHome(home, js, examplesSrc)).toBe(home);
  });

  it('sits between its markers, beside the beta button, with an accessible name and one line of help', () => {
    const block = home.slice(home.indexOf('<!-- beta-qr:start -->'), home.indexOf('<!-- beta-qr:end -->'));
    expect(block).toContain('role="img" aria-label="QR code that opens the AlgorithmLens beta on TestFlight"');
    expect(block).toContain('<p class="qr-note">On a computer? Point your iPhone camera at this code.</p>');
    expect(home.indexOf('id="betaButton"')).toBeLessThan(home.indexOf('<!-- beta-qr:start -->'));
    // Inline SVG only: no image request, nothing for the Content-Security-Policy to refuse.
    expect(block).not.toMatch(/<img|data:|href=/);
  });

  it('reads back as BETA_LINK', () => {
    const r = readQr(matrixFromPage(home));
    expect(r.formatOk).toBe(true);
    expect(r.formatCopiesAgree).toBe(true);
    expect(r.darkModule).toBe(true);
    expect(r.level).toBe('M');
    expect(r.modeBits).toBe(0b0100);
    expect(r.syndromesZero).toBe(true);
    expect(r.text).toBe(links.beta);
    expect(links.beta).toMatch(/^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/);
  });

  it('on /tt/ reads back as the TikTok group link, the one its buttons open', () => {
    const r = readQr(matrixFromPage(tt));
    expect(r.formatOk).toBe(true);
    expect(r.syndromesZero).toBe(true);
    expect(r.text).toBe(links.tiktok || links.beta);
    if (links.tiktok) expect(r.text).not.toBe(links.beta);
  });
});

describe('scripts/qr.mjs', () => {
  it('picks the smallest version that holds the text at level M', () => {
    expect([14, 15, 26, 27, 42, 43, 62, 63].map(versionFor)).toEqual([1, 2, 2, 3, 3, 4, 4, 5]);
    expect(() => versionFor(214)).toThrow();
  });

  it('draws the three finder patterns and the timing lines of a version 1 symbol', () => {
    const { size, modules } = qrMatrix('AlgorithmLens');
    expect(size).toBe(21);
    const finder = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
    for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      const rows = finder.map((_, y) => finder.map((__, x) => (modules[oy + y][ox + x] ? '1' : '0')).join(''));
      expect(rows).toEqual(finder);
    }
    for (let i = 8; i < size - 8; i++) {
      expect(modules[6][i]).toBe(i % 2 === 0);
      expect(modules[i][6]).toBe(i % 2 === 0);
    }
  });

  it('reads back through the separate decoder for texts of several lengths and every mask it happens to choose', () => {
    const seen = new Set();
    for (const text of ['a', 'AlgorithmLens', 'https://example.com/', 'A scan reads what appeared.', 'https://testflight.apple.com/join/abcdefgh', 'x'.repeat(42)]) {
      const { modules, mask } = qrMatrix(text);
      const r = readQr(modules);
      expect(r.mask).toBe(mask);
      expect(r.formatOk && r.formatCopiesAgree && r.syndromesZero).toBe(true);
      expect(r.text).toBe(text);
      seen.add(mask);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('the three report views on the home page', () => {
  const scans = loadExamples(examplesSrc).record.scans;
  const newest = scans[scans.length - 1];
  // The explorer's own counting function, taken from its source as written.
  const explorerJs = lf(readFileSync(new URL('../public/explore/explore.js', import.meta.url), 'utf8'));
  const statsLine = explorerJs.split('\n').find((line) => line.startsWith('function stats(scan){'));
  const explorerStats = new Function(`${statsLine}; return stats;`)();
  const views = home.slice(home.indexOf('<!-- report-views:start -->'), home.indexOf('<!-- report-views:end -->'));

  it('counts every scan the way the explorer does', () => {
    expect(statsLine).toBeTruthy();
    for (const scan of scans) {
      const mine = scanStats(scan);
      const theirs = explorerStats(scan);
      expect(mine.n).toBe(theirs.n);
      expect(mine.ads).toBe(theirs.ads.length);
      expect(mine.adUnknown).toBe(theirs.adUnknown.length);
      expect(mine.followed).toBe(theirs.origins.followed.length);
      expect(mine.suggested).toBe(theirs.origins.suggested.length);
      expect(mine.originUnknown).toBe(theirs.origins.unknown.length);
      expect(mine.accounts).toEqual(theirs.accounts);
      expect(mine.accountUnknown).toBe(theirs.accountUnknown);
      expect(mine.political).toBe(theirs.political.yes.length);
      expect(mine.politicalUnknown).toBe(theirs.political.unknown.length);
    }
  });

  it('prints the explorer\'s numbers for the newest scan', () => {
    const st = explorerStats(newest);
    expect(views).toContain(`<h3>${st.origins.followed.length} followed, ${st.origins.suggested.length} suggested, ${st.origins.unknown.length} unknown</h3>`);
    expect(st.origins.followed.length + st.origins.suggested.length + st.origins.unknown.length).toBe(st.n);
    const repeats = st.accounts.filter((a) => a.positions.length > 1);
    expect(views).toContain(`<h3>${repeats.length} of ${st.accounts.length} accounts appeared more than once</h3>`);
    for (const a of repeats) {
      expect(views).toContain(`<b>${a.name}</b>`);
      expect(views).toContain(`posts ${a.positions.slice(0, -1).join(', ')} and ${a.positions[a.positions.length - 1]}`);
    }
    expect(views).toContain(`${st.ads.length} of ${st.n} posts carried an ad label.`);
    expect(views).toContain(`${st.political.yes.length} of ${st.n} posts were classified as political.`);
    expect(views).toContain(`${st.political.unknown.length} posts not assessed for politics`);
  });

  it('draws one mark per post in the origin rows and one tick per post in each account strip', () => {
    const st = explorerStats(newest);
    const row = (cls) => (views.match(new RegExp(`<div class="unit ${cls}">.*?</div>`, 's'))[0].match(/<i><\/i>/g) || []).length;
    expect([row('f'), row('s'), row('u')]).toEqual([st.origins.followed.length, st.origins.suggested.length, st.origins.unknown.length]);
    const strips = views.match(/<div class="ticks" aria-hidden="true">.*?<\/div>/gs);
    const repeats = st.accounts.filter((a) => a.positions.length > 1);
    expect(strips).toHaveLength(repeats.length);
    strips.forEach((strip, i) => {
      const ticks = strip.match(/<i( class="on")?><\/i>/g);
      expect(ticks).toHaveLength(st.n);
      const on = ticks.map((tick, k) => (tick.includes('on') ? k + 1 : 0)).filter(Boolean);
      expect(on).toEqual(repeats[i].positions);
    });
  });

  it('leaves the page with two ad-label mark grids: the record sheets and the one real scan', () => {
    const bars = home.match(/<div class="countbar"/g) || [];
    expect(bars).toHaveLength(1);
    expect(home.indexOf('<div class="countbar"')).toBeGreaterThan(home.indexOf('<section id="real"'));
    expect(home.indexOf('<div class="countbar"')).toBeLessThan(home.indexOf('<section id="try"'));
    expect(home).toContain('<div class="stage" id="stage" aria-hidden="true"></div>');
  });
});
