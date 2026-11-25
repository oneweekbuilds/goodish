// The explorer's example data (public/explore/examples.js).
//
// In November 2026 the placeholder accounts ("@example_5" to "@example_45")
// were given invented names and one-line captions. Nothing else was allowed
// to move: the site quotes this scan's counts on the home page, in the
// explorer and on the share image. These tests hold every one of those
// counts, and check that the page which draws one scan up close reads this
// same file instead of a second copy.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = fileURLToPath(new URL('../public', import.meta.url));
const read = (file) => readFileSync(path.join(pub, file), 'utf8');

const window = {};
new Function('window', read('explore/examples.js'))(window);
const EXAMPLES = window.EXAMPLES;
const scans = EXAMPLES.record.scans;
const newest = scans[scans.length - 1];
const positions = (posts, test) => posts.filter(test).map((p) => p.position);
const count = (posts, test) => posts.filter(test).length;

describe('the example scan the site quotes (September 20)', () => {
  it('still has 45 posts from 42 accounts', () => {
    expect(newest.recorded_at).toBe('2026-09-20T18:40:00Z');
    expect(newest.posts).toHaveLength(45);
    expect(new Set(newest.posts.map((p) => p.creator)).size).toBe(42);
  });

  it('still has 6 ad labels and 1 that could not be read, at the same positions', () => {
    expect(positions(newest.posts, (p) => p.is_ad === true)).toEqual([1, 8, 17, 24, 33, 41]);
    expect(positions(newest.posts, (p) => p.is_ad === null)).toEqual([7]);
  });

  it('still has 16 followed, 14 suggested and 15 unknown', () => {
    expect(count(newest.posts, (p) => p.origin === 'followed')).toBe(16);
    expect(count(newest.posts, (p) => p.origin === 'suggested')).toBe(14);
    expect(count(newest.posts, (p) => p.origin === 'unknown')).toBe(15);
  });

  it('still has @harbor.coffee at posts 1, 4 and 22 and @city.notes at 2 and 18, and no other repeat', () => {
    expect(positions(newest.posts, (p) => p.creator === '@harbor.coffee')).toEqual([1, 4, 22]);
    expect(positions(newest.posts, (p) => p.creator === '@city.notes')).toEqual([2, 18]);
    const seen = new Map();
    newest.posts.forEach((p) => seen.set(p.creator, (seen.get(p.creator) || 0) + 1));
    expect([...seen].filter(([, n]) => n > 1).map(([name]) => name).sort()).toEqual(['@city.notes', '@harbor.coffee']);
  });

  it('still has the same tone and politics counts', () => {
    const tone = (v) => count(newest.posts, (p) => p.valence === v);
    expect([tone('neutral'), tone('negative'), tone('mixed'), tone('positive'), tone(null)]).toEqual([16, 8, 7, 7, 7]);
    expect(positions(newest.posts, (p) => p.political === true)).toEqual([2, 12, 23, 31, 39]);
    expect(count(newest.posts, (p) => p.political === null)).toBe(6);
  });

  it('sits in a record of four scans of 33, 39, 8 and 45 posts, each the opening stretch of the same feed', () => {
    expect(scans.map((s) => s.posts.length)).toEqual([33, 39, 8, 45]);
    for (const scan of scans) expect(scan.posts).toEqual(newest.posts.slice(0, scan.posts.length));
  });
});

describe('account names and captions', () => {
  const named = [...scans, EXAMPLES.thin].flatMap((s) => s.posts);

  it('gives every post an invented account name: no placeholder is left', () => {
    for (const p of named) {
      expect(p.creator).toMatch(/^@[a-z]+(\.[a-z]+)+$/);
      expect(p.creator).not.toMatch(/example/);
    }
  });

  it('gives every post one caption, in one or two short sentences', () => {
    for (const p of newest.posts) {
      expect(typeof p.demo.caption).toBe('string');
      expect(p.demo.caption.length).toBeGreaterThan(4);
      expect(p.demo.caption.length).toBeLessThan(80);
    }
    expect(new Set(newest.posts.map((p) => p.demo.caption)).size).toBe(45);
  });

  it('shows the same first four posts as the home page demo', () => {
    const home = read('index.html');
    for (const p of newest.posts.slice(0, 4)) {
      expect(home).toContain(p.creator);
      expect(home).toContain(`<p>${p.demo.caption}</p>`);
    }
  });

  it('leaves the unreadable example unreadable', () => {
    expect(EXAMPLES.unreadable.posts.every((p) => p.creator === null)).toBe(true);
  });
});

describe('one dataset for the whole explorer', () => {
  it('the page that draws one scan up close loads examples.js and carries no data of its own', () => {
    const html = read('explore/specimen.html');
    expect(html.indexOf('<script src="examples.js"></script>')).toBeGreaterThan(-1);
    expect(html.indexOf('<script src="examples.js"></script>')).toBeLessThan(html.indexOf('<script src="specimen.js"></script>'));
    const js = read('explore/specimen.js');
    expect(js).toContain('const EXAMPLE_DATA=window.EXAMPLES;');
    expect(js).not.toContain('"scan_id"');
  });

  it('no placeholder account name is left in any page or script of the site', () => {
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(path.join(pub, dir), { withFileTypes: true })) {
        const rel = path.posix.join(dir, entry.name);
        if (entry.isDirectory()) { if (rel !== 'design-brief' && rel !== 'static') walk(rel); } else if (/\.(html|js|json)$/.test(entry.name)) files.push(rel);
      }
    };
    walk('.');
    expect(files.length).toBeGreaterThan(8);
    for (const file of files) expect(`${file}: ${/example_\d/.test(read(file))}`).toBe(`${file}: false`);
  });

  it('the file pickers are hidden: the app has no scan file to open in them', () => {
    expect(read('explore/index.html')).toContain('<label class="upload" hidden>');
    expect(read('explore/specimen.html')).toContain('<label class="file-label" hidden>');
    expect(read('explore/specimen.html')).toContain('<details hidden><summary>Use your own scan</summary>');
  });
});
