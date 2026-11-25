// The site's three long documents as committed: /methodology and /terms
// (scripts/build-paper-pages.mjs) and /privacy/ (scripts/build-legal-pages.mjs).
//
// November 2026: every heading carries an id, so any passage can be linked
// to, and the methodology page opens with a summary, names its author and
// ends with a dated list of changes. These tests read the generated pages.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const page = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const text = (markup) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const methodology = page('methodology.html');

describe('headings in the three documents', () => {
  for (const file of ['methodology.html', 'terms.html', 'privacy/index.html']) {
    it(`${file}: every heading below the title has an id, and no id repeats`, () => {
      const html = page(file);
      const headings = [...html.matchAll(/<h([2-6])([^>]*)>/g)];
      expect(headings.length).toBeGreaterThan(20);
      const ids = headings.map((h) => (h[2].match(/ id="([^"]+)"/) || [])[1]);
      expect(ids.filter((id) => !id)).toEqual([]);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });

    it(`${file}: every link in the contents list lands on a section heading`, () => {
      const html = page(file);
      const toc = html.match(/<nav class="toc"[\s\S]*?<\/nav>/);
      expect(toc).toBeTruthy();
      const targets = [...toc[0].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
      expect(targets.length).toBeGreaterThan(5);
      for (const id of targets) expect(html).toMatch(new RegExp(`<h2 id="${id}">`));
    });
  }

  it('keeps the section ids other pages already link to', () => {
    expect(page('privacy/index.html')).toContain('<h2 id="3-how-screen-recordings-are-processed">');
    expect(page('privacy/index.html')).toContain('<h2 id="10-what-we-do-not-do">');
    expect(page('privacy/index.html')).toContain('<h3 id="1-2-screen-recording-data">');
    expect(page('terms.html')).toContain('<h2 id="7-pricing">');
    expect(page('terms.html')).toContain('<h2 id="1-what-algorithmlens-does">');
    expect(methodology).toContain('<h2 id="where-the-data-goes">');
  });
});

describe('the methodology page', () => {
  it('names its author and its date under the title', () => {
    expect(methodology).toMatch(/<p class="meta">Last updated: [A-Z][a-z]+ \d{1,2}, 2026\. Written by Justin Winuk\.<\/p>/);
  });

  it('opens with a summary of about 150 words, first in the contents list', () => {
    const summary = methodology.match(/<section class="summary"><h2 id="in-short">In short<\/h2>([\s\S]*?)<\/section>/);
    expect(summary).toBeTruthy();
    const words = text(summary[1]).split(' ').length;
    expect(words).toBeGreaterThanOrEqual(135);
    expect(words).toBeLessThanOrEqual(165);
    const firstLink = methodology.match(/<nav class="toc"[\s\S]*?href="#([^"]+)"/)[1];
    expect(firstLink).toBe('in-short');
    // It comes before everything else in the document column.
    expect(methodology.indexOf('<section class="summary">')).toBeLessThan(methodology.indexOf('This page describes how the AlgorithmLens iPhone app'));
  });

  it('builds the summary only from what the page states further down', () => {
    const summary = text(methodology.match(/<section class="summary">([\s\S]*?)<\/section>/)[1]);
    const rest = text(methodology.slice(methodology.indexOf('</section>', methodology.indexOf('<section class="summary">'))));
    // The two figures in it are the ones the page itself gives.
    const items = summary.match(/on (\d+) items from one YouTube session/)[1];
    expect(rest).toContain(`on ${items} items from one YouTube session`);
    expect(summary).toContain('one frame every 2.5 seconds');
    expect(rest).toContain('samples one frame every 2.5 seconds');
    // Each claim has its sentence in the body.
    for (const phrase of [
      'There is no scraping, no platform API access',
      'happens on the device by fixed rules, not by the AI',
      'Counted from a printed label',
      'The model’s reading',
      'The frames and the post wording go once the count finishes',
      'have never been accuracy-tested against human labels',
      'AlgorithmLens measures what appeared; it cannot see why the platform chose it',
    ]) {
      expect(rest).toContain(phrase);
    }
  });

  it('ends with a dated list of changes, newest first', () => {
    const section = methodology.match(/<h2 id="changes-to-this-page">Changes to this page<\/h2>([\s\S]*?)<\/section>/);
    expect(section).toBeTruthy();
    const dates = [...section[1].matchAll(/<time dateTime="(\d{4}-\d{2}-\d{2})">([^<]+)<\/time>/gi)].map((m) => m[1]);
    expect(dates.length).toBeGreaterThanOrEqual(4);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(dates[dates.length - 1]).toBe('2026-07-03');
    // The newest entry is the day the page says it was last updated.
    const updated = methodology.match(/Last updated: ([A-Z][a-z]+) (\d{1,2}), (\d{4})/);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const iso = `${updated[3]}-${String(months.indexOf(updated[1]) + 1).padStart(2, '0')}-${updated[2].padStart(2, '0')}`;
    expect(dates[0]).toBe(iso);
  });

  it('still says what the page says about the proxy, untouched', () => {
    expect(text(methodology)).toContain('A server-side proxy that would move the API credential off the device is built and not yet switched on');
  });
});

describe('the privacy policy page', () => {
  const policy = text(page('privacy/index.html'));

  it('says one thing about the text of posts, in all three places', () => {
    expect(policy).toContain('We do not store the text of your posts: it is read during analysis and discarded.');
    expect(policy).toContain('These items are stored in our database as text, never as images');
    expect(policy).toContain('The post text is read during analysis and is not saved (Section 1.3).');
    expect(policy).toContain('Only the structured analysis results are stored: text data, not images, and without the text of your posts.');
    expect(policy).toContain('The structured analysis results (text data, not images, and without the text of your posts) are saved by the App');
    // The sentence that read as the opposite of the one before it.
    expect(policy).not.toContain('This text-based data is stored');
  });

  it('describes no streak feature: the app has none', () => {
    expect(policy).not.toMatch(/streak/i);
    expect(policy).toContain('Locally stored data (preferences) is deleted when you uninstall the App.');
  });

  it('carries the date of its source and says where the app shows it', () => {
    expect(policy).toMatch(/Last updated [A-Z][a-z]+ \d{1,2}, 2026\. This is the same text the AlgorithmLens app shows in Settings\./);
  });
});
