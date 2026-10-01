// Mega run phase 5a (D-191): the site's example data is the exported copy of
// the mobile repo's canon/example-record.json, and every surface that shows
// it agrees on the counts.
//
// public/example-record.json and public/example-record.js are written by
// mobile/scripts/export-example-record.mjs; the landing page's record
// section reads window.EXAMPLE_RECORD from the .js copy; the explorer's
// examples.js holds the same four scans with per-post detail. This test
// pins all three to one another: a change to the dataset is made in the
// mobile repo, exported, and lands here with the counts still matching.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const json = JSON.parse(readFileSync(path.join(root, 'public', 'example-record.json'), 'utf8'));

function loadWindowScript(file, key) {
  const src = readFileSync(path.join(root, 'public', file), 'utf8');
  const window = {};
  new Function('window', src)(window);
  return window[key];
}

describe('the example record on the site (D-191)', () => {
  it('the .js copy the landing page reads is the .json copy, verbatim', () => {
    const fromJs = loadWindowScript('example-record.js', 'EXAMPLE_RECORD');
    expect(fromJs).toEqual(json);
  });

  it('the explorer holds the same four scans: dates, post counts, ad labels, unknowns', () => {
    const examples = loadWindowScript('explore/examples.js', 'EXAMPLES');
    const explorerScans = examples.record.scans;
    expect(explorerScans).toHaveLength(json.record.scans.length);
    json.record.scans.forEach((scan, i) => {
      const e = explorerScans[i];
      expect(e.scan_id).toBe(scan.id);
      expect(e.recorded_at).toBe(scan.recordedAt);
      expect(e.posts.length).toBe(scan.posts);
      expect(e.posts.filter((p) => p.is_ad === true).map((p) => p.position)).toEqual(scan.ads);
      expect(e.posts.filter((p) => p.is_ad === null).map((p) => p.position)).toEqual(scan.unknown);
      expect(e.is_example).toBe(true);
    });
  });

  it('the landing page markup states the same counts for the newest sheet', () => {
    const html = readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
    const newest = json.record.scans[json.record.scans.length - 1];
    const total = json.record.scans.reduce((a, s) => a + s.posts, 0);
    expect(html).toContain(`<div class="tile"><b>${newest.posts}</b><span>Posts recorded</span></div>`);
    expect(html).toContain(`<div class="tile blue"><b>${newest.ads.length}</b><span>Printed ad labels</span></div>`);
    expect(html).toContain(`<div class="tile"><b>${json.record.scans.length}</b><span>Scans on record</span></div>`);
    expect(html).toContain(`${newest.posts} posts in this scan. ${newest.ads.length} carried a printed ad label. ${total} posts across ${json.record.scans.length} scans.`);
    expect(html).toContain('<script src="example-record.js"></script>');
  });

  it('every dataset is labelled Example and carries its limit', () => {
    expect(json.label).toBe('Example');
    expect(json.record.limit.length).toBeGreaterThan(20);
    expect(json.replay.limit.length).toBeGreaterThan(20);
  });
});
