// The public methodology page publishes the app's prompts "verbatim". These
// tests hold that word: the committed generated module must match a fresh
// extraction from the mobile app's source whenever that checkout is present
// (it is, on the machine that builds the site), the page's schema table must
// name only fields the frame prompt asks for, and the two retired capture
// modes must never come back onto the page.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPTS } from './pages/methodologyPrompts.generated.js';
import { SCHEMA_FIELDS, EVALUATION_FIGURES } from './pages/methodologyContent.js';
import { extractPrompts, resolveMobileRoot } from '../scripts/sync-methodology-prompts.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = resolveMobileRoot();
const mobilePresent =
  mobileRoot !== null && existsSync(path.join(mobileRoot, 'src', 'lib', 'analysis', 'analysisPrompts.ts'));

describe('the methodology page prompts', () => {
  it('names the model the app sends', () => {
    expect(PROMPTS.model).toMatch(/^gemini-/);
    expect(PROMPTS.platformHints.map((h) => h.key)).toEqual([
      'instagram',
      'twitter',
      'youtube',
      'tiktok',
      'facebook',
      'reddit',
    ]);
    expect(PROMPTS.topicCategories.length).toBeGreaterThan(10);
    expect(PROMPTS.systemPrompt).toContain('RESPOND ONLY WITH VALID JSON');
    expect(PROMPTS.framePrompt).toContain('{platform display name}');
    expect(PROMPTS.framePrompt).not.toContain('${');
  });

  (mobilePresent ? it : it.skip)('is a fresh extraction from the mobile source (run npm run build:methodology when this fails)', () => {
    const fresh = extractPrompts(mobileRoot);
    const { commit: _c, date: _d, ...committed } = PROMPTS;
    expect(committed).toEqual(fresh);
  });

  it('the schema table names only fields the frame prompt asks for', () => {
    for (const [field] of SCHEMA_FIELDS) {
      const leaf = field.split('.').pop();
      expect(PROMPTS.framePrompt, field).toContain(`"${leaf}"`);
    }
  });

  it('never describes the retired capture modes', () => {
    const page = readFileSync(path.join(here, 'pages', 'MethodologyPage.jsx'), 'utf8');
    expect(page).not.toMatch(/Screenshot import/);
    expect(page).not.toMatch(/Easy scan/);
    expect(page).not.toMatch(/in-app browser.*fallback/);
    expect(page).not.toMatch(/Gemini 2\.0/);
    expect(page).not.toMatch(/no users yet/i);
    expect(page).not.toMatch(/No accuracy numbers exist/i);
  });

  it('cites only figures the app itself pins', () => {
    // The same numbers the in-app Methodology screen renders from
    // src/config/methodologyEvidence.ts (pinned there to the eval artifacts).
    expect(EVALUATION_FIGURES.goldItems).toBe(110);
    expect(EVALUATION_FIGURES.goldFrames).toBe(35);
    expect(EVALUATION_FIGURES.distinctPosts).toBe(71);
    expect(EVALUATION_FIGURES.annotators).toBe(1);
    expect(EVALUATION_FIGURES.stabilityFlips).toEqual({ ads: 1, origin: 0, politics: 0, tone: 2, observations: 96 });
  });
});
