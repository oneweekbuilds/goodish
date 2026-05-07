/**
 * Em dash sweep for build #44.
 *
 * Walks .tsx/.ts files under app/ and src/, replaces em dashes ONLY in
 * user-facing strings. Conservative line-based approach:
 *   - SKIP entire line if first non-whitespace token starts a comment
 *     ("//", "/*", "*", "*\/")
 *   - SKIP if the em dash sits inside a /* ... *\/ block that opens on
 *     this line and closes on a later line (we track block-comment state
 *     across lines)
 *   - SKIP line containing "/* ... em dash ... *\/" entirely on one line
 *   - OTHERWISE, replace em dashes on the line per these rules:
 *       " — "  →  ", "
 *       " —"   →  ","
 *       "— "   →  ", "
 *       "—"    →  ","
 *
 * Run: node audits/em-dash-sweep.js [--dry]
 *
 * The output prints a diff-style summary.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = ['app', 'src'];
const EXTS = ['.tsx', '.ts'];
const SKIP_PATTERNS = [/__tests__/, /node_modules/];

const DRY = process.argv.includes('--dry');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP_PATTERNS.some((p) => p.test(full))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/**
 * Replace em dashes in a single line ONLY at positions that are not inside
 * an inline /* … *\/ comment. This handles the rare case where a line has
 * "// comment with — em dash" on the right of code; we don't replace those.
 *
 * Strategy: split on // (line comment) and /* … *\/ pairs, replace only in
 * the code segments. For simplicity, we do not split on inline // because
 * em dashes after // should be left alone, AND code with // in a string
 * would mis-split — but that's rare in practice. Tradeoff acceptable for
 * our codebase, which uses // only for line comments.
 */
function replaceLine(line) {
  // 1. If "//" appears anywhere outside a string, split there and only
  //    process the left side. Detecting "outside a string" is hard with a
  //    regex, but we can use a simple heuristic: if "//" appears, look at
  //    chars BEFORE it; if no unmatched ' or " before, it's a real comment.
  //    Even simpler heuristic: if the line trimmed starts with "//", skip
  //    entirely. Otherwise, ignore inline "//" detection — emdashes on
  //    code lines after // are rare and not catastrophic if changed.
  // 2. Then replace " — " / " —" / "— " / "—" by their replacements.

  // Skip lines that are entirely a line comment (already handled by caller)
  // — but also defend against inline /* ... */ on a code line.

  // Naive: replace all em dashes outside any /* ... */ inline block.
  // We do this by splitting on "/*…*/" and only replacing in the gaps.
  const parts = line.split(/(\/\*[\s\S]*?\*\/)/g);
  const replaced = parts.map((part) => {
    if (part.startsWith('/*') && part.endsWith('*/')) return part; // inline block comment, leave
    return part
      .replace(/ — /g, ', ')
      .replace(/ —/g, ',')
      .replace(/— /g, ', ')
      .replace(/—/g, ',');
  });
  return replaced.join('');
}

function sweepFile(src, fileLabel) {
  const lines = src.split(/\r?\n/);
  let inBlockComment = false;
  let changesOnLine = [];

  const newLines = lines.map((line, idx) => {
    let working = line;
    let cursor = 0;
    let outChars = '';

    // Walk char-by-char to honor multi-line block comments.
    while (cursor < working.length) {
      if (inBlockComment) {
        // Look for closing */
        const closeIdx = working.indexOf('*/', cursor);
        if (closeIdx === -1) {
          // No close on this line — append rest, stay in comment, done with line.
          outChars += working.slice(cursor);
          cursor = working.length;
          break;
        } else {
          outChars += working.slice(cursor, closeIdx + 2);
          cursor = closeIdx + 2;
          inBlockComment = false;
        }
      } else {
        // Look for next /* or end of line
        const openIdx = working.indexOf('/*', cursor);
        const lineCommentIdx = working.indexOf('//', cursor);

        // Find which comes first (if any)
        const candidates = [openIdx, lineCommentIdx].filter((x) => x !== -1);
        if (candidates.length === 0) {
          // No comment opens — entire remainder is code. Replace em dashes.
          const segment = working.slice(cursor);
          outChars += applyReplacements(segment, fileLabel, idx + 1, changesOnLine, line);
          cursor = working.length;
          break;
        }
        const nextCommentIdx = Math.min(...candidates);

        // Replace em dashes in code segment up to comment
        const codeSegment = working.slice(cursor, nextCommentIdx);
        outChars += applyReplacements(codeSegment, fileLabel, idx + 1, changesOnLine, line);
        cursor = nextCommentIdx;

        if (cursor === lineCommentIdx) {
          // Rest of line is a // line comment — append as-is
          outChars += working.slice(cursor);
          cursor = working.length;
          break;
        } else {
          // Block comment opens. Add /* and enter block-comment mode.
          outChars += '/*';
          cursor += 2;
          inBlockComment = true;
        }
      }
    }
    return outChars;
  });

  return { out: newLines.join('\n'), subs: changesOnLine };
}

// Per-file skip rules: paths whose entire contents are LLM prompt strings
// (serialized to Gemini API). Em dashes there are part of the prompt text
// and shouldn't be munged.
const SKIP_FILES = [
  /analysisPrompts\.ts$/,
];

// Per-line skip patterns: lines containing these patterns are left alone
// even if they have em dashes. These are non-user-facing (internal logs,
// exception messages, placeholder values).
const SKIP_LINE_PATTERNS = [
  // Placeholder "no data" em dash in MetricCard / fallback strings
  /value="—"/,           // <MetricCard value="—" ... />
  /\?\?\s*['"]—['"]/,    // ?? '—' fallback
  /:\s*['"]—['"]/,       // : '—' ternary fallback
  /return\s*['"]—['"]/,  // return '—'
  // Internal logs / breadcrumbs / exceptions — not user-facing
  /\bconsole\.(log|warn|error|info|debug)\s*\(/,
  /\baddBreadcrumb\s*\(/,
  /\bcaptureMessage\s*\(/,
  /\bthrow\s+new\s+Error\s*\(/,
  /\bnew\s+PipelineError\s*\(/,
];

function applyReplacements(segment, fileLabel, lineNo, changesOnLine, fullLine) {
  // Build #46 prep: also catch the `—` escape sequence form. Build #45
  // missed Home's "Welcome back — ready for a fresh scan?" because the
  // file stored the dash as a 6-char escape, not the literal em dash, and
  // the previous version of this sweep only matched `—`.
  if (!segment.includes('—') && !segment.includes('\\u2014')) return segment;

  // Skip if this file is on the skip list (e.g. LLM prompts)
  if (SKIP_FILES.some((p) => p.test(fileLabel))) return segment;

  // Skip if the FULL LINE matches a skip pattern (e.g. console.warn(...))
  if (fullLine && SKIP_LINE_PATTERNS.some((p) => p.test(fullLine))) return segment;

  // Apply in priority order. Handle both the literal em dash and its
  // `—` JS escape form. The escape-sequence rules treat any number of
  // surrounding ASCII spaces (` `) the same way as the literal-character
  // rules treat literal spaces.
  const before = segment;
  const after = segment
    .replace(/ — /g, ', ')
    .replace(/ —/g, ',')
    .replace(/— /g, ', ')
    .replace(/—/g, ',')
    .replace(/ \\u2014 /g, ', ')
    .replace(/ \\u2014/g, ',')
    .replace(/\\u2014 /g, ', ')
    .replace(/\\u2014/g, ',');
  if (after !== before) {
    changesOnLine.push({
      file: fileLabel,
      line: lineNo,
      before: before.trim().slice(0, 100),
      after: after.trim().slice(0, 100),
    });
  }
  return after;
}

const files = TARGET_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
let totalSubs = 0;
const modifiedFiles = [];
const allSubs = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  // Also fast-skip when neither the literal em dash nor its `—` escape
  // form appears anywhere in the file.
  if (!src.includes('—') && !src.includes('\\u2014')) continue;
  const rel = path.relative(ROOT, file);
  const { out, subs } = sweepFile(src, rel);
  if (subs.length === 0) continue;
  if (out !== src) {
    if (!DRY) fs.writeFileSync(file, out, 'utf8');
    modifiedFiles.push({ file: rel, count: subs.length });
    totalSubs += subs.length;
    allSubs.push(...subs);
  }
}

console.log(`\n${DRY ? '[DRY RUN]' : '[APPLIED]'} ${totalSubs} substitutions across ${modifiedFiles.length} files\n`);
modifiedFiles.forEach(({ file, count }) => {
  console.log(`  ${count.toString().padStart(3)}  ${file}`);
});
console.log('\nAll substitutions (file:line  before  →  after):');
allSubs.forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s.file}:${s.line}`);
  console.log(`       BEFORE: ${s.before}`);
  console.log(`       AFTER:  ${s.after}`);
});
