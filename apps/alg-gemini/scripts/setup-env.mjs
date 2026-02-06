#!/usr/bin/env node
/**
 * Interactive environment setup for AlgorithmLens conversion flow
 * Prompts for required secrets and writes them to .env.local
 *
 * Usage: npm run env:setup
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_FILE = join(__dirname, '..', '.env.local');

const REQUIRED_VARS = [
  {
    key: 'SUPABASE_JWT_SECRET',
    prompt: 'SUPABASE_JWT_SECRET',
    source: 'Supabase Dashboard → Settings → API → JWT Settings → JWT Secret',
    validate: (val) => val.length >= 20,
    errorMsg: 'Must be at least 20 characters',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    prompt: 'STRIPE_SECRET_KEY (Test mode)',
    source: 'Stripe Dashboard (Test mode ON) → Developers → API keys → Secret key',
    validate: (val) => val.startsWith('sk_test_') || val.startsWith('sk_live_'),
    errorMsg: 'Must start with sk_test_ or sk_live_',
  },
  {
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    prompt: 'VITE_STRIPE_PUBLISHABLE_KEY (Test mode)',
    source: 'Stripe Dashboard (Test mode ON) → Developers → API keys → Publishable key',
    validate: (val) => val.startsWith('pk_test_') || val.startsWith('pk_live_'),
    errorMsg: 'Must start with pk_test_ or pk_live_',
  },
  {
    key: 'STRIPE_PRICE_MONTHLY',
    prompt: 'STRIPE_PRICE_MONTHLY',
    source: 'Stripe Dashboard → Products → [Your Product] → Pricing → Monthly price ID',
    validate: (val) => val.startsWith('price_'),
    errorMsg: 'Must start with price_',
  },
  {
    key: 'STRIPE_PRICE_ANNUAL',
    prompt: 'STRIPE_PRICE_ANNUAL',
    source: 'Stripe Dashboard → Products → [Your Product] → Pricing → Annual price ID',
    validate: (val) => val.startsWith('price_'),
    errorMsg: 'Must start with price_',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    prompt: 'STRIPE_WEBHOOK_SECRET',
    source: 'Run: stripe listen --print-secret (or paste from existing Stripe CLI output)',
    validate: (val) => val.startsWith('whsec_'),
    errorMsg: 'Must start with whsec_',
    optional: true, // Can run stripe listen for this
  },
];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function tryStripeListenForWebhookSecret() {
  console.log('\n🔍 Checking if Stripe CLI is available...');

  return new Promise((resolve) => {
    const child = spawn('stripe', ['listen', '--print-secret'], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    const timeout = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 5000);

    child.stdout.on('data', (data) => {
      output += data.toString();
      const match = output.match(/whsec_[a-zA-Z0-9]+/);
      if (match) {
        clearTimeout(timeout);
        child.kill();
        resolve(match[0]);
      }
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

async function promptForValue(config) {
  while (true) {
    console.log(`\n📋 ${config.prompt}`);
    console.log(`   Source: ${config.source}`);

    // Special handling for webhook secret
    if (config.key === 'STRIPE_WEBHOOK_SECRET') {
      const autoSecret = await tryStripeListenForWebhookSecret();
      if (autoSecret) {
        console.log(`✅ Auto-detected webhook secret from Stripe CLI`);
        console.log(`   Value: ${autoSecret.substring(0, 10)}...${autoSecret.substring(autoSecret.length - 4)}`);
        const confirm = await question('   Use this value? (y/n): ');
        if (confirm.toLowerCase() === 'y') {
          return autoSecret;
        }
      } else {
        console.log('   ⚠️  Stripe CLI not available or failed. Please run manually:');
        console.log('   stripe listen --print-secret');
        console.log('   Then paste the whsec_... value below.');
      }
    }

    const value = (await question(`   Enter ${config.key}: `)).trim();

    if (!value) {
      console.log('   ❌ Value cannot be empty. Please try again.');
      continue;
    }

    if (!config.validate(value)) {
      console.log(`   ❌ Invalid value: ${config.errorMsg}`);
      continue;
    }

    return value;
  }
}

async function loadExistingEnv() {
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

function writeEnvFile(values) {
  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf-8') : '';

  // Parse existing env to preserve unrelated keys
  const existingLines = existing.split('\n');
  const preservedLines = [];
  const handledKeys = new Set(REQUIRED_VARS.map(v => v.key));

  // First pass: preserve non-conversion keys
  for (const line of existingLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      // Skip old conversion headers
      if (trimmed.includes('AlgorithmLens conversion') || trimmed.includes('local only')) {
        continue;
      }
      preservedLines.push(line);
      continue;
    }

    const match = trimmed.match(/^([^=]+)=/);
    if (match && !handledKeys.has(match[1])) {
      preservedLines.push(line);
    }
  }

  // Build new content
  const lines = [];

  // Add preserved lines first
  if (preservedLines.length > 0) {
    lines.push(...preservedLines);
    lines.push('');
  }

  // Add conversion env block
  lines.push('# AlgorithmLens conversion env (local only, do not commit)');
  lines.push(`SUPABASE_JWT_SECRET=${values.SUPABASE_JWT_SECRET}`);
  lines.push(`STRIPE_SECRET_KEY=${values.STRIPE_SECRET_KEY}`);
  lines.push(`STRIPE_WEBHOOK_SECRET=${values.STRIPE_WEBHOOK_SECRET}`);
  lines.push(`STRIPE_PRICE_MONTHLY=${values.STRIPE_PRICE_MONTHLY}`);
  lines.push(`STRIPE_PRICE_ANNUAL=${values.STRIPE_PRICE_ANNUAL}`);
  lines.push(`VITE_STRIPE_PUBLISHABLE_KEY=${values.VITE_STRIPE_PUBLISHABLE_KEY}`);
  lines.push('');

  writeFileSync(ENV_FILE, lines.join('\n'), 'utf-8');
}

function verifyEnv(values) {
  console.log('\n✅ Environment Variable Status:');
  console.log('─'.repeat(50));

  for (const config of REQUIRED_VARS) {
    const value = values[config.key];
    const status = value ? 'SET' : 'MISSING';
    const preview = value ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : '';
    console.log(`${config.key.padEnd(30)} ${status.padEnd(8)} ${preview}`);
  }
}

async function main() {
  console.log('🔧 AlgorithmLens Environment Setup');
  console.log('═'.repeat(50));
  console.log('This script will prompt for required environment variables.');
  console.log('Values are validated and written to .env.local (gitignored).');
  console.log('═'.repeat(50));

  const existing = await loadExistingEnv();
  const values = {};

  for (const config of REQUIRED_VARS) {
    if (existing[config.key]) {
      console.log(`\n✓ ${config.key} already set (${existing[config.key].substring(0, 6)}...)`);
      const overwrite = await question('  Overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        values[config.key] = existing[config.key];
        continue;
      }
    }

    values[config.key] = await promptForValue(config);
  }

  console.log('\n💾 Writing to .env.local...');
  writeEnvFile(values);
  console.log('✅ Wrote apps/alg-gemini/.env.local successfully.');

  verifyEnv(values);

  rl.close();
}

main().catch((err) => {
  console.error('❌ Setup failed:', err);
  rl.close();
  process.exit(1);
});
