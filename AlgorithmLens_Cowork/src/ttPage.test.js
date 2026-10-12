// Beta site (October 2026): /tt/ is the home page rendered for the TikTok
// beta group. public/tt/index.html is generated from public/index.html by
// scripts/build-tt-page.mjs; this test pins the committed copy to that
// output and checks the two differences the page exists for.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderTt, SOURCE, TARGET } from '../scripts/build-tt-page.mjs';

const home = readFileSync(SOURCE, 'utf8');
const tt = readFileSync(TARGET, 'utf8');

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

  it('loads the shared scripts by absolute path so they resolve from /tt/', () => {
    expect(tt).toContain('<script src="/example-record.js"></script>');
    expect(tt).toContain('<script src="/landing.js"></script>');
    expect(tt).not.toMatch(/(href|src)="(explore\/|example-record\.js|landing\.js)/);
  });

  it('landing.js holds both beta links and picks the TikTok one for this group', () => {
    const js = readFileSync(new URL('../public/landing.js', import.meta.url), 'utf8');
    expect(js).toMatch(/^const BETA_LINK = "https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+";$/m);
    expect(js).toMatch(/^const TIKTOK_BETA_LINK = "(https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+)?";$/m);
    expect(js).toContain("BETA_GROUP === 'tiktok' && TIKTOK_BETA_LINK");
    expect(js).toContain("'algorithmlens-launch-list-tt'");
  });
});
