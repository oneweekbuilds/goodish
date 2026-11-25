// /tt/ is the page linked from TikTok. Since November 2026 it is a short
// page (the headline, one example visual, three findings, the button), built
// from parts of the home page by scripts/build-tt-page.mjs. This test pins
// the committed copy to that output and checks what the page exists for:
// its own TestFlight group, no indexing, and the home page as the canonical
// copy.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderTt, lf, SOURCE, TARGET } from '../scripts/build-tt-page.mjs';
import { betaLinks, loadExamples, scanStats, LANDING_JS, EXAMPLES_JS } from '../scripts/build-home-page.mjs';

// Compared with LF line endings, as git stores them: a Windows checkout with
// core.autocrlf=true may hold either file with CRLF in the working tree.
const home = lf(readFileSync(SOURCE, 'utf8'));
const tt = lf(readFileSync(TARGET, 'utf8'));
const js = lf(readFileSync(LANDING_JS, 'utf8'));
const links = betaLinks(js);
const group = links.tiktok || links.beta;
const body = tt.slice(tt.indexOf('<body>'));

describe('the /tt/ page', () => {
  it('is the generator output for the current home page (run npm run build:tt after editing index.html)', () => {
    expect(tt).toBe(renderTt(home));
  });

  it('marks itself as the TikTok beta group and asks not to be indexed', () => {
    expect(tt).toContain('<html lang="en" data-beta-group="tiktok">');
    expect(tt).toContain('<meta name="robots" content="noindex">');
    expect(home).not.toContain('data-beta-group');
    expect(home).not.toContain('name="robots"');
  });

  it('keeps the home page as the canonical copy', () => {
    expect(tt).toContain('<link rel="canonical" href="https://www.algorithmlens.com/">');
    expect(tt).toContain('<meta property="og:url" content="https://www.algorithmlens.com/tt/">');
  });

  it('is a short page: the home page headline, one example visual, three findings, the button', () => {
    const headline = home.match(/<h1>.*?<\/h1>/s)[0];
    expect(body).toContain(headline);
    // One example visual: the app screen from the home page's hero, with its label.
    expect(body.match(/<img /g)).toHaveLength(1);
    expect(body).toContain('<img src="/static/img/app-first-card-2026-10-27.png"');
    expect(body).toContain('<span class="label">Example</span>');
    // Three findings.
    expect(body.match(/<ol class="tt-finds">.*?<\/ol>/s)[0].match(/<li>/g)).toHaveLength(3);
    // None of the home page's ten sections.
    for (const id of ['report', 'real', 'try', 'limits', 'how', 'privacy', 'ways', 'trust', 'faq', 'launch']) {
      expect(body).not.toContain(`<section id="${id}"`);
    }
    const words = body.replace(/<svg.*?<\/svg>/gs, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThan(260);
  });

  it('prints three findings counted from the newest example scan in the explorer', () => {
    const scans = loadExamples(readFileSync(EXAMPLES_JS, 'utf8')).record.scans;
    const st = scanStats(scans[scans.length - 1]);
    const repeats = st.accounts.filter((a) => a.positions.length > 1).length;
    expect(body).toContain(`<b>${st.ads} of ${st.n} posts carried an ad label.</b>`);
    expect(body).toContain(`<b>${st.followed} followed, ${st.suggested} suggested, ${st.originUnknown} unknown.</b>`);
    expect(body).toContain(`<b>${repeats} of ${st.accounts.length} accounts appeared more than once.</b>`);
    // The same three counts are on the home page.
    expect(home).toContain(`${st.ads} of ${st.n} posts carried an ad label.`);
    expect(home).toContain(`<h3>${st.followed} followed, ${st.suggested} suggested, ${st.originUnknown} unknown</h3>`);
    expect(home).toContain(`<h3>${repeats} of ${st.accounts.length} accounts appeared more than once</h3>`);
  });

  it('sends the header pill and both buttons to the TikTok group, in the markup itself', () => {
    expect(group).toMatch(/^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/);
    expect(body).toContain(`<a class="pill" id="betaPill" href="${group}" rel="noopener noreferrer">Join the beta</a>`);
    expect(body).toContain(`<a class="button" id="betaButton" href="${group}" rel="noopener noreferrer">Join the beta on iPhone</a>`);
    expect(body.match(/>Join the beta on iPhone<\/a>/g)).toHaveLength(2);
    const testflight = body.match(/href="https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+"/g);
    expect(testflight).toHaveLength(3);
    for (const href of testflight) expect(href).toBe(`href="${group}"`);
  });

  it('carries no script and no form: nothing on it needs one', () => {
    expect(tt).not.toContain('<script');
    expect(tt).not.toContain('<form');
    expect(tt).not.toContain('ld+json');
  });

  it('every link on it leads somewhere that exists', () => {
    const hrefs = [...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      expect(['#main', '/', '/methodology', '/privacy/', '/terms', '/static/img/wordmark.svg#wordmark', group]).toContain(href);
    }
    expect(body).toContain('id="main"');
  });
});

describe('the beta links and the launch form after the short /tt/ page', () => {
  it('landing.js still holds both beta links, the second for the generator', () => {
    expect(js).toMatch(/^const BETA_LINK = "https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+";$/m);
    expect(js).toMatch(/^const TIKTOK_BETA_LINK = "(https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+)?";$/m);
    // No page with a script reads the group any more.
    expect(js).not.toContain('BETA_GROUP');
  });

  it('the home page form names its page in a hidden field, and no field has a name', () => {
    expect(home).toContain('<input type="hidden" id="source" value="algorithmlens-launch-list">');
    expect(js).toContain("source && source.value ? source.value : 'algorithmlens-launch-list'");
    // No field of the form has a name, so a submit without the script sends nothing.
    const form = home.slice(home.indexOf('<form id="launchForm"'), home.indexOf('</form>'));
    expect(form).not.toMatch(/\sname=/);
  });
});
