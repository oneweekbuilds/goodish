// A small QR Code encoder with no dependencies, for the beta link drawn on the
// home page and on /tt/ at build time (scripts/build-home-page.mjs and
// scripts/build-tt-page.mjs). Byte mode, error correction level M, versions 1
// to 10 (up to 213 bytes), which is far more than a TestFlight link needs.
// It follows the QR Code Model 2 specification (ISO/IEC 18004): data
// codewords, Reed-Solomon blocks, interleaving, function patterns, the eight
// masks and the penalty rules that choose among them.
//
// src/homePage.test.js reads the codes on the committed pages back with a
// decoder written separately from this file (format bits, unmasking, the
// codeword walk, the Reed-Solomon check) and compares the text with the
// links. When this file was written its output for six texts, versions 1 to
// 10, was also read back with OpenCV's QR detector (DESIGN_NOTES.md, "Audit
// fixes").

// Per version, level M: total codewords, error correction codewords per
// block, and the data codewords of each block.
const LEVEL_M = [
  null,
  { ec: 10, blocks: [16] },
  { ec: 16, blocks: [28] },
  { ec: 26, blocks: [44] },
  { ec: 18, blocks: [32, 32] },
  { ec: 24, blocks: [43, 43] },
  { ec: 16, blocks: [27, 27, 27, 27] },
  { ec: 18, blocks: [31, 31, 31, 31] },
  { ec: 22, blocks: [38, 38, 39, 39] },
  { ec: 22, blocks: [36, 36, 36, 37, 37] },
  { ec: 26, blocks: [43, 43, 43, 43, 44] },
];
const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
// Bits left over after the last codeword, per version.
const REMAINDER_BITS = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

// Arithmetic in GF(256) with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1.
function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}
function rsDivisor(degree) {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}
function rsRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor); });
  }
  return result;
}

/** The smallest version (1 to 10) whose level M capacity holds `length` bytes. */
export function versionFor(length) {
  for (let v = 1; v <= 10; v++) {
    const dataBits = LEVEL_M[v].blocks.reduce((a, b) => a + b, 0) * 8;
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + 8 * length <= dataBits) return v;
  }
  throw new Error(`qr: ${length} bytes do not fit in a version 10 symbol at level M`);
}

// The data codewords: mode, length, the bytes, terminator and padding.
function dataCodewords(bytes, version) {
  const capacity = LEVEL_M[version].blocks.reduce((a, b) => a + b, 0);
  const bits = [];
  const push = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const out = [];
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0xec; out.length < capacity; pad ^= 0xec ^ 0x11) out.push(pad);
  return out;
}

// Split into blocks, add each block's error correction, and interleave.
function allCodewords(data, version) {
  const { ec, blocks } = LEVEL_M[version];
  const divisor = rsDivisor(ec);
  const dataBlocks = [];
  const ecBlocks = [];
  let at = 0;
  for (const size of blocks) {
    const block = data.slice(at, at + size);
    at += size;
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, divisor));
  }
  const out = [];
  const longest = Math.max(...blocks);
  for (let i = 0; i < longest; i++) for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  for (let i = 0; i < ec; i++) for (const block of ecBlocks) out.push(block[i]);
  return out;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function penalty(m) {
  const size = m.length;
  let score = 0;
  const line = (get) => {
    for (let a = 0; a < size; a++) {
      // Rule 1: runs of five or more modules of one colour.
      let run = 1;
      for (let b = 1; b <= size; b++) {
        if (b < size && get(a, b) === get(a, b - 1)) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      // Rule 3: the finder-like pattern 1011101 with four light modules on one side.
      for (let b = 0; b + 10 < size; b++) {
        const bit = (k) => get(a, b + k);
        const core = (o) => bit(o) && !bit(o + 1) && bit(o + 2) && bit(o + 3) && bit(o + 4) && !bit(o + 5) && bit(o + 6);
        if (core(0) && !bit(7) && !bit(8) && !bit(9) && !bit(10)) score += 40;
        if (!bit(0) && !bit(1) && !bit(2) && !bit(3) && core(4)) score += 40;
      }
    }
  };
  line((y, x) => m[y][x]);
  line((x, y) => m[y][x]);
  // Rule 2: two by two blocks of one colour.
  for (let y = 0; y + 1 < size; y++) {
    for (let x = 0; x + 1 < size; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  }
  // Rule 4: how far the share of dark modules is from one half.
  let dark = 0;
  for (const row of m) for (const c of row) if (c) dark++;
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

/**
 * The symbol for `text` as rows of booleans (true is a dark module), without
 * the quiet zone. Returns { version, size, mask, modules }.
 */
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = versionFor(bytes.length);
  const size = 17 + 4 * version;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { modules[y][x] = dark; isFunction[y][x] = true; };

  // Timing patterns.
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  // Finder patterns with their separators.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  // Alignment patterns.
  const align = ALIGNMENT[version];
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      const last = align.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  // Format information (level M is 00), drawn for a given mask.
  const drawFormat = (mask) => {
    const data = (0b00 << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0);
  // Version information, from version 7.
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }

  // The codewords, placed in the zigzag from the bottom right corner.
  const codewords = allCodewords(dataCodewords(bytes, version), version);
  const totalBits = codewords.length * 8 + REMAINDER_BITS[version];
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (isFunction[y][x] || i >= totalBits) continue;
        modules[y][x] = i < codewords.length * 8 ? ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0 : false;
        i++;
      }
    }
  }
  if (i !== totalBits) throw new Error('qr: the data did not fill the symbol');

  // Try every mask and keep the one the penalty rules like best.
  const applyMask = (mask) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!isFunction[y][x] && MASKS[mask](x, y)) modules[y][x] = !modules[y][x];
  };
  let best = 0, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const score = penalty(modules);
    if (score < bestScore) { bestScore = score; best = mask; }
    applyMask(mask); // masking twice restores the unmasked symbol
  }
  applyMask(best);
  drawFormat(best);
  return { version, size, mask: best, modules };
}

/** The quiet zone around the symbol, in modules. The specification asks for four. */
export const QUIET_ZONE = 4;

/**
 * The symbol as one SVG path over a white ground, with the four-module quiet
 * zone the specification asks for. `title` is the accessible name. Colours
 * are passed in so the page's tokens are used. `scale` is the drawn size of
 * one module in CSS pixels (a whole number keeps every module on the pixel
 * grid); the page's CSS may still resize it.
 */
export function qrSvg(text, { title, dark = '#3A3730', light = '#FFFFFF', className = 'qr', scale = 3 } = {}) {
  const { size, modules } = qrMatrix(text);
  const quiet = QUIET_ZONE;
  const span = size + quiet * 2;
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!modules[y][x]) continue;
      let run = 1;
      while (x + run < size && modules[y][x + run]) run++;
      d += `M${x + quiet} ${y + quiet}h${run}v1h-${run}z`;
      x += run - 1;
    }
  }
  const label = title ? ` role="img" aria-label="${title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : ' aria-hidden="true"';
  return `<svg class="${className}" viewBox="0 0 ${span} ${span}" width="${span * scale}" height="${span * scale}" shape-rendering="crispEdges"${label}><path fill="${light}" d="M0 0h${span}v${span}H0z"/><path fill="${dark}" d="${d}"/></svg>`;
}
