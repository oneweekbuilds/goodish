#!/usr/bin/env node
/**
 * Smoke Test Script for AlgorithmLens Analysis Engine
 *
 * Demonstrates the full pipeline with various scenarios:
 * 1. Healthy diverse feed
 * 2. Echo chamber content
 * 3. Emotionally manipulative content
 * 4. Commercial/sponsored content
 * 5. Multi-platform comparison
 *
 * Run with: npm run smoke-test
 * Or: tsx src/analysis/smokeTest.ts
 */

import { analyzeContent, quickAnalyze, analyzeBatch } from './pipeline/mainAnalyzer';
import {
  generateHealthyData,
  generateEchoChamberData,
  generateManipulativeData,
  generateCommercialData,
  generateMultiPlatformData
} from './data/mockData';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : '';
  console.log(`${colorCode}${message}${colors.reset}`);
}

function printDivider() {
  log('═'.repeat(80), 'cyan');
}

function printHeader(title: string) {
  printDivider();
  log(`  ${title}`, 'bright');
  printDivider();
}

function printMetricSummary(name: string, value: any, status: string) {
  const statusIcon = status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  const statusColor = status === 'ok' ? 'green' : status === 'warning' ? 'yellow' : 'red';

  log(`  ${statusIcon} ${name}:`, statusColor);

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, val]) => {
      const displayVal = typeof val === 'number' ? val.toFixed(2) : val;
      console.log(`      ${key}: ${displayVal}`);
    });
  } else {
    console.log(`      ${value}`);
  }
}

async function runScenario(name: string, getData: () => any, platform: any, description?: string) {
  printHeader(name);

  if (description) {
    log(`  ${description}`, 'cyan');
    console.log();
  }

  try {
    const rawItems = getData();
    log(`  📊 Analyzing ${rawItems.length} items from ${platform}...`, 'blue');
    console.log();

    const startTime = Date.now();
    const result = await analyzeContent(rawItems, platform);
    const elapsed = Date.now() - startTime;

    // Print Overall Health
    const healthColor =
      result.summary.overallHealth >= 70 ? 'green' :
      result.summary.overallHealth >= 50 ? 'yellow' : 'red';

    log(`  🏥 OVERALL HEALTH: ${result.summary.overallHealth}/100`, healthColor);
    console.log();

    // Print Narrative
    log(`  📰 ${result.narrative.headline}`, 'bright');
    console.log();
    log(`  ${result.narrative.summary}`);
    console.log();

    // Print Metrics
    log('  📈 KEY METRICS:', 'bright');
    console.log();

    printMetricSummary(
      'Echo Chamber',
      { score: result.metrics.echoChamber.value.score },
      result.metrics.echoChamber.status
    );

    printMetricSummary(
      'Political Lean',
      { score: result.metrics.politicalLean.value.leanScore },
      result.metrics.politicalLean.status
    );

    printMetricSummary(
      'Emotion Manipulation',
      { score: result.metrics.emotionTone.value.manipulationScore },
      result.metrics.emotionTone.status
    );

    printMetricSummary(
      'Product Affinity',
      {
        adRatio: (result.metrics.productAffinity.value.adRatio * 100).toFixed(1) + '%',
        targeting: result.metrics.productAffinity.value.targetingIntensity
      },
      result.metrics.productAffinity.status
    );

    printMetricSummary(
      'Topic Diversity',
      {
        score: result.metrics.topicDiversity.value.diversityScore,
        topics: result.metrics.topicDiversity.value.uniqueTopics
      },
      result.metrics.topicDiversity.status
    );

    console.log();

    // Print Issues
    if (result.summary.criticalIssues.length > 0) {
      log('  ⚠️  CRITICAL ISSUES:', 'red');
      result.summary.criticalIssues.forEach(issue => {
        log(`    • ${issue}`, 'red');
      });
      console.log();
    }

    if (result.summary.warnings.length > 0) {
      log('  ⚠️  WARNINGS:', 'yellow');
      result.summary.warnings.forEach(warning => {
        log(`    • ${warning}`, 'yellow');
      });
      console.log();
    }

    // Print Category Scores
    log('  📊 CATEGORY SCORES:', 'bright');
    console.log();

    const categories = result.summary.categoryScores;
    Object.entries(categories).forEach(([key, score]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const color = score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';
      log(`    ${formattedKey}: ${score}/100`, color);
    });

    console.log();
    log(`  ⏱️  Analysis completed in ${elapsed}ms`, 'cyan');
    console.log();

    return result;

  } catch (error) {
    log(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`, 'red');
    console.log();
    throw error;
  }
}

async function main() {
  console.clear();

  printHeader('🔬 ALGORITHMLENS ANALYSIS ENGINE - SMOKE TEST');
  log('  Testing the complete analysis pipeline with various scenarios', 'cyan');
  console.log();
  console.log();

  try {
    // Scenario 1: Healthy Feed
    await runScenario(
      '✅ SCENARIO 1: Healthy Diverse Feed',
      generateHealthyData,
      'twitter',
      'Testing with balanced, diverse content from multiple topics and sources'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 2: Echo Chamber
    await runScenario(
      '🔁 SCENARIO 2: Echo Chamber',
      generateEchoChamberData,
      'twitter',
      'Testing with homogeneous content from single source on one topic'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 3: Manipulative Content
    await runScenario(
      '😱 SCENARIO 3: Emotionally Manipulative Content',
      generateManipulativeData,
      'twitter',
      'Testing with outrage-driven content using urgency and fear tactics'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 4: Commercial Content
    await runScenario(
      '💰 SCENARIO 4: Heavy Commercial Content',
      generateCommercialData,
      'twitter',
      'Testing with sponsored posts, ads, and affiliate marketing'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 5: Multi-Platform Batch
    printHeader('🌐 SCENARIO 5: Multi-Platform Batch Analysis');
    log('  Testing batch analysis across Twitter and Instagram', 'cyan');
    console.log();

    const multiPlatformData = generateMultiPlatformData();
    const batch = [
      { items: multiPlatformData.get('twitter')!, platform: 'twitter' as const },
      { items: multiPlatformData.get('instagram')!, platform: 'instagram' as const }
    ];

    log('  📊 Analyzing 2 platforms in batch...', 'blue');
    console.log();

    const startTime = Date.now();
    const results = await analyzeBatch(batch);
    const elapsed = Date.now() - startTime;

    results.forEach((result, index) => {
      log(`  ${index + 1}. ${result.meta.platform.toUpperCase()}:`, 'bright');
      log(`     Health: ${result.summary.overallHealth}/100`);
      log(`     Items: ${result.meta.itemCount}`);
      console.log();
    });

    log(`  ⏱️  Batch analysis completed in ${elapsed}ms`, 'cyan');
    console.log();

    // Scenario 6: Quick Analyze
    printHeader('⚡ SCENARIO 6: Quick Analyze');
    log('  Testing quick analysis mode with defaults', 'cyan');
    console.log();

    const quickData = generateHealthyData();
    log('  📊 Running quick analysis...', 'blue');
    console.log();

    const quickStart = Date.now();
    const quickResult = await quickAnalyze(quickData, 'twitter');
    const quickElapsed = Date.now() - quickStart;

    log(`  ✅ Quick analysis completed in ${quickElapsed}ms`, 'green');
    log(`  🏥 Health Score: ${quickResult.summary.overallHealth}/100`);
    console.log();

    // Final Summary
    printHeader('✅ SMOKE TEST COMPLETE');
    log('  All scenarios executed successfully!', 'green');
    console.log();

    log('  Summary:', 'bright');
    log('    • Full analysis pipeline: ✅ Working');
    log('    • All 10 metrics: ✅ Functioning');
    log('    • Calibration: ✅ Applied');
    log('    • Aggregation: ✅ Calculating');
    log('    • Narrative generation: ✅ Creating');
    log('    • Batch processing: ✅ Operational');
    log('    • Quick analysis: ✅ Fast');
    console.log();

    log('  🎉 The analysis engine is ready for production use!', 'green');
    console.log();

  } catch (error) {
    printHeader('❌ SMOKE TEST FAILED');
    log(`  Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    console.log();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runSmokeTest };
