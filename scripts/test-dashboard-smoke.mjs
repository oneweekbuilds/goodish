#!/usr/bin/env node

/**
 * Script to run dashboard smoke test from repo root
 * 
 * Usage:
 *   node scripts/test-dashboard-smoke.mjs
 * 
 * Or with custom base URL:
 *   BASE_URL=http://localhost:5174 node scripts/test-dashboard-smoke.mjs
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const algGeminiDir = join(repoRoot, 'apps', 'alg-gemini');

console.log('Running dashboard smoke test...');
console.log(`Working directory: ${algGeminiDir}\n`);

try {
  // Change to alg-gemini directory and run the test
  execSync('npm run test:smoke', {
    cwd: algGeminiDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      BASE_URL: process.env.BASE_URL || 'http://localhost:5173',
    },
  });
  
  console.log('\n✓ Smoke test passed!');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Smoke test failed!');
  process.exit(1);
}
