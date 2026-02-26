#!/usr/bin/env node
/**
 * Verify required environment variables are set in .env.local
 *
 * Usage: npm run env:verify
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_FILE = join(__dirname, '..', '.env.local');

const REQUIRED_VARS = [
  'SUPABASE_JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_ANNUAL',
  'VITE_STRIPE_PUBLISHABLE_KEY',
];

function loadEnv() {
  if (!existsSync(ENV_FILE)) {
    return {};
  }

  const content = readFileSync(ENV_FILE, 'utf-8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1]] = match[2];
      }
    }
  }

  return env;
}

function main() {
  const env = loadEnv();
  let allSet = true;

  console.log('Environment Variable Status:');
  console.log('─'.repeat(50));

  for (const varName of REQUIRED_VARS) {
    const value = env[varName];
    const status = value && value.trim() ? 'SET' : 'MISSING';
    const preview = value && value.trim() ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : '';

    console.log(`${varName.padEnd(30)} ${status.padEnd(8)} ${preview}`);

    if (status === 'MISSING') {
      allSet = false;
    }
  }

  console.log('─'.repeat(50));

  if (!allSet) {
    console.log('❌ Some variables are MISSING. Run: npm run env:setup');
    process.exit(1);
  } else {
    console.log('✅ All required variables are SET.');
    process.exit(0);
  }
}

main();
