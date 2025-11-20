import dotenv from 'dotenv';
import initDatabase from '../db';
import { getAccountAnalysis } from '../analysis';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/ingest.sqlite';

function runAnalysisSmokeTest(): void {
  const accountId = process.argv[2] || 'test_user';

  try {
    console.log(`\n🔍 Analyzing account: ${accountId}\n`);

    // Initialize database
    const db = initDatabase(DATABASE_URL);

    // Get analysis
    const analysis = getAccountAnalysis(db, accountId);

    // Print summary
    console.log('📊 Account Analysis Summary');
    console.log('─'.repeat(50));
    console.log(`Account ID:     ${analysis.accountId}`);
    console.log(`Total Events:   ${analysis.totalEvents}`);
    console.log(`Total Sessions: ${analysis.totalSessions}`);

    if (Object.keys(analysis.platforms).length > 0) {
      console.log('\nPlatforms:');
      const sortedPlatforms = Object.entries(analysis.platforms)
        .sort((a, b) => b[1] - a[1]);
      for (const [platform, count] of sortedPlatforms) {
        console.log(`  ${platform.padEnd(20)} ${count} events`);
      }
    } else {
      console.log('\nPlatforms: (none detected)');
    }

    if (analysis.oldestEvent && analysis.newestEvent) {
      const oldestDate = new Date(analysis.oldestEvent).toISOString();
      const newestDate = new Date(analysis.newestEvent).toISOString();
      console.log(`\nTime Range:`);
      console.log(`  Oldest: ${oldestDate}`);
      console.log(`  Newest: ${newestDate}`);
    } else {
      console.log(`\nTime Range: (no events)`);
    }

    console.log('─'.repeat(50));
    console.log('\n✓ Analysis complete\n');

    // Close database
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error running analysis:', error);
    process.exit(1);
  }
}

// Run the smoke test
runAnalysisSmokeTest();

