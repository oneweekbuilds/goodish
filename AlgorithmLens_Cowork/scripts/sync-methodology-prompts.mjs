#!/usr/bin/env node
// Generates src/pages/methodologyPrompts.generated.js from the mobile app's
// prompt source, so the public methodology page's "verbatim" prompts are the
// strings the app actually sends and cannot drift by hand.
//
// The source is resolved the same way build-legal-pages.mjs resolves the
// privacy policy: the first argument if given, else the folder named by
// ALGLENS_MOBILE_REPO, else the usual local checkout. The page's test
// (src/methodologyPrompts.test.js) re-extracts from the same source when it
// is present and fails if the committed module is stale.
//
// What is extracted, and only this: the system prompt, the per-frame prompt
// template with its runtime values shown as placeholders, the OCR framing
// sentence, the platform hints in the app's platform order, the topic
// taxonomy, and the model identifier. Nothing is retyped.
//
// Usage: node scripts/sync-methodology-prompts.mjs [mobile-repo-root]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_MOBILE_REPO =
  'C:/Users/jwjwi/Desktop/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile';
export const OUTPUT = path.join(here, '..', 'src', 'pages', 'methodologyPrompts.generated.js');

const PROMPTS_REL = path.join('src', 'lib', 'analysis', 'analysisPrompts.ts');
const CLIENT_REL = path.join('src', 'lib', 'analysis', 'geminiClient.ts');

/** The mobile checkout to read from, or null when none can be found. */
export function resolveMobileRoot(argRoot) {
  if (argRoot) return argRoot;
  if (process.env.ALGLENS_MOBILE_REPO) return process.env.ALGLENS_MOBILE_REPO;
  if (existsSync(LOCAL_MOBILE_REPO)) return LOCAL_MOBILE_REPO;
  return null;
}

/**
 * A template literal's escape sequences, as the running app resolves
 * them: the OCR framing is written with "\n" escapes in the source, and
 * the model receives real line breaks.
 */
function unescapeTemplate(text) {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\`/g, '`')
    .replace(/\\\$/g, '$')
    .replace(/\\\\/g, '\\');
}

/** The text of the template literal that starts right after `marker`. */
function templateAfter(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  const open = src.indexOf('`', at);
  const close = src.indexOf('`', open + 1);
  if (open < 0 || close < 0) throw new Error(`no template literal after: ${marker}`);
  return unescapeTemplate(src.slice(open + 1, close));
}

/** The quoted string that starts right after `marker`. */
function stringAfter(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  const m = src.slice(at + marker.length).match(/^\s*=?\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error(`no string after: ${marker}`);
  return m[1];
}

/** The values the frame prompt fills in per frame, shown as placeholders. */
const FRAME_PLACEHOLDERS = [
  ['${PLATFORM_DISPLAY_NAMES[platform]}', '{platform display name}'],
  ['${frameNumber}', '{frame number}'],
  ['${totalFrames}', '{total frames}'],
  ['${capturedAt}', '{timestamp}'],
  ['${platformHints}', '{platform-specific hints, published below}'],
  [
    '${ocrSection}',
    '{the on-device OCR text for this frame inside the framing published below, or "No OCR text available for this frame."}',
  ],
];

export function extractPrompts(mobileRoot) {
  const promptsPath = path.join(mobileRoot, PROMPTS_REL);
  const clientPath = path.join(mobileRoot, CLIENT_REL);
  const src = readFileSync(promptsPath, 'utf8').replace(/\r\n/g, '\n');
  const client = readFileSync(clientPath, 'utf8').replace(/\r\n/g, '\n');

  const systemPrompt = templateAfter(src, 'export const GEMINI_SYSTEM_PROMPT');
  if (systemPrompt.includes('${')) {
    throw new Error('the system prompt interpolates a value this script does not know how to show');
  }

  // The per-frame prompt is the template returned by buildFramePrompt.
  const fnStart = src.indexOf('export function buildFramePrompt(');
  if (fnStart < 0) throw new Error('buildFramePrompt not found');
  const fnSrc = src.slice(fnStart);
  const open = fnSrc.indexOf('return `');
  const close = fnSrc.indexOf('`;', open + 'return `'.length);
  if (open < 0 || close < 0) throw new Error('buildFramePrompt template not found');
  let framePrompt = unescapeTemplate(fnSrc.slice(open + 'return `'.length, close));
  for (const [from, to] of FRAME_PLACEHOLDERS) framePrompt = framePrompt.split(from).join(to);
  if (framePrompt.includes('${')) {
    throw new Error('the frame prompt interpolates a value this script does not know how to show');
  }

  // The OCR framing: the template the OCR section is built from.
  const ocrFraming = templateAfter(fnSrc, 'const ocrSection = sanitizedOcr.trim()')
    .replace('${sanitizedOcr}', '{the sanitized OCR text, at most 3000 characters}')
    .replace(/^\n/, '');

  // Platform hints, in the app's own order, with the display names.
  const hintsBlock = src.match(
    /export const PLATFORM_HINTS: Record<SupportedPlatform, string> = \{([\s\S]*?)\n\};/,
  );
  if (!hintsBlock) throw new Error('PLATFORM_HINTS not found');
  const namesBlock = src.match(
    /export const PLATFORM_DISPLAY_NAMES: Record<SupportedPlatform, string> = \{([\s\S]*?)\n\};/,
  );
  if (!namesBlock) throw new Error('PLATFORM_DISPLAY_NAMES not found');
  const names = {};
  for (const m of namesBlock[1].matchAll(/(\w+):\s*'([^']+)'/g)) names[m[1]] = m[2];
  const platformHints = [];
  for (const m of hintsBlock[1].matchAll(/(\w+):\s*`([\s\S]*?)`,?/g)) {
    platformHints.push({ key: m[1], name: names[m[1]] || m[1], text: unescapeTemplate(m[2]).trim() });
  }
  if (platformHints.length === 0) throw new Error('no platform hints extracted');

  // The topic taxonomy the extractor is instructed with.
  const topics = src.match(/export const PRIMARY_TOPIC_CATEGORIES = \[([\s\S]*?)\]/);
  if (!topics) throw new Error('PRIMARY_TOPIC_CATEGORIES not found');
  const topicCategories = [...topics[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const model = stringAfter(client, 'export const GEMINI_MODEL');

  return { model, systemPrompt, framePrompt, ocrFraming, platformHints, topicCategories };
}

/** The mobile repository's head commit and date, when it is a git checkout. */
export function sourceStamp(mobileRoot) {
  try {
    const commit = execFileSync('git', ['-C', mobileRoot, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    const date = execFileSync('git', ['-C', mobileRoot, 'log', '-1', '--format=%cs'], {
      encoding: 'utf8',
    }).trim();
    return { commit, date };
  } catch {
    return { commit: 'unknown', date: 'unknown' };
  }
}

export function renderModule(prompts, stamp) {
  const body = JSON.stringify({ ...stamp, ...prompts }, null, 2);
  return (
    '// GENERATED by scripts/sync-methodology-prompts.mjs from the mobile app source.\n' +
    '// Do not edit: re-run the script. src/methodologyPrompts.test.js fails when stale.\n' +
    `export const PROMPTS = ${body};\n`
  );
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]).replace(/\\/g, '/').endsWith('scripts/sync-methodology-prompts.mjs');

if (isMain) {
  const root = resolveMobileRoot(process.argv[2]);
  if (!root || !existsSync(path.join(root, PROMPTS_REL))) {
    console.error(
      'sync-methodology-prompts: cannot find the mobile repository. Set ALGLENS_MOBILE_REPO ' +
        'to the mobile checkout, or pass its root as the first argument.',
    );
    process.exit(1);
  }
  const prompts = extractPrompts(root);
  writeFileSync(OUTPUT, renderModule(prompts, sourceStamp(root)));
  console.log(
    `methodology prompts written: model ${prompts.model}, ${prompts.platformHints.length} platform hint blocks, ` +
      `${prompts.topicCategories.length} topic categories, source ${sourceStamp(root).commit}`,
  );
}
