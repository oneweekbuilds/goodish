#!/usr/bin/env node

/**
 * lint-changed.mjs
 *
 * Lints only files changed in git (staged + unstaged).
 * Filters to JS/JSX/TS/TSX files under src/
 *
 * Usage:
 *   npm run lint          → Fast day-to-day lint (changed files only) [RECOMMENDED]
 *   npm run lint:changed  → Alias for above
 *   npm run lint:all      → Full codebase audit (reports all pre-existing errors)
 *
 * Why: The full codebase has ~138 pre-existing lint errors. This script
 * lets you verify your new changes are clean without noise from legacy code.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, relative } from 'path';

try {
  // Get changed files (staged + unstaged, relative to repo root)
  const gitOutput = execSync('git diff --name-only HEAD', { encoding: 'utf8' }).trim();

  if (!gitOutput) {
    console.log('✓ No changed files to lint.');
    process.exit(0);
  }

  const changedFiles = gitOutput.split('\n').filter(Boolean);

  // Filter to alg-gemini src files with relevant extensions
  const srcFiles = changedFiles.filter(file => {
    return file.startsWith('apps/alg-gemini/src/') &&
           /\.(js|jsx|ts|tsx)$/.test(file);
  });

  if (srcFiles.length === 0) {
    console.log('✓ No changed src files to lint.');
    process.exit(0);
  }

  console.log(`Linting ${srcFiles.length} changed file(s):\n`);
  srcFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Strip apps/alg-gemini/ prefix for eslint (since we run from that directory)
  const localPaths = srcFiles.map(f => f.replace('apps/alg-gemini/', ''));
  const filesArg = localPaths.join(' ');
  execSync(`npx eslint ${filesArg}`, { stdio: 'inherit' });

  console.log('\n✓ Lint passed for changed files.');
  process.exit(0);

} catch (error) {
  if (error.status !== undefined) {
    // ESLint found errors
    console.error('\n✖ Lint failed for changed files.');
    process.exit(error.status);
  } else {
    // Script error
    console.error('Error running lint-changed:', error.message);
    process.exit(1);
  }
}
