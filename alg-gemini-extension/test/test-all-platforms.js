#!/usr/bin/env node
/**
 * Unit Tests for AlgorithmLens Utility Functions
 *
 * Tests the shared utility functions from src/scanners/utils.js that are pure
 * functions and can be tested in Node.js without needing a DOM.
 *
 * Usage:
 *   node test/test-all-platforms.js
 */

import {
  parseEngagementCount,
  extractHashtags,
  containsAdIndicator,
  isValidCreator,
  isValidCaption,
  extractInstagramPostId,
  extractYouTubeVideoId,
  hashString
} from '../src/scanners/utils.js';

// Colors for terminal output
const Colors = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  END: '\x1b[0m'
};

// Test runner
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ${Colors.GREEN}✓${Colors.END} ${message}`);
  } else {
    failed++;
    console.error(`  ${Colors.RED}✗${Colors.END} ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ${Colors.GREEN}✓${Colors.END} ${message}`);
  } else {
    failed++;
    console.error(`  ${Colors.RED}✗${Colors.END} ${message}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Got:      ${JSON.stringify(actual)}`);
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

function testParseEngagementCount() {
  console.log(`\n${Colors.BOLD}parseEngagementCount()${Colors.END}`);

  assertEqual(parseEngagementCount('1.2K'), 1200, '"1.2K" → 1200');
  assertEqual(parseEngagementCount('5M'), 5000000, '"5M" → 5000000');
  assertEqual(parseEngagementCount('100'), 100, '"100" → 100');
  assertEqual(parseEngagementCount('1,234'), 1234, '"1,234" → 1234');
  assertEqual(parseEngagementCount(null), null, 'null → null');
  assertEqual(parseEngagementCount(''), null, '"" → null');
  assertEqual(parseEngagementCount('abc'), null, '"abc" → null');
  assertEqual(parseEngagementCount('2.5B'), 2500000000, '"2.5B" → 2500000000');
  assertEqual(parseEngagementCount('999'), 999, '"999" → 999');
  assertEqual(parseEngagementCount('1.5k'), 1500, '"1.5k" → 1500 (lowercase)');
  assertEqual(parseEngagementCount('3,456,789'), 3456789, '"3,456,789" → 3456789 (with commas)');
}

function testExtractHashtags() {
  console.log(`\n${Colors.BOLD}extractHashtags()${Colors.END}`);

  assertEqual(
    extractHashtags('Hello #world #test'),
    ['#world', '#test'],
    '"Hello #world #test" → ["#world", "#test"]'
  );
  assertEqual(
    extractHashtags('No hashtags here'),
    [],
    '"No hashtags here" → []'
  );
  assertEqual(
    extractHashtags(null),
    [],
    'null → []'
  );
  assertEqual(
    extractHashtags('#duplicate #duplicate'),
    ['#duplicate'],
    '"#duplicate #duplicate" → ["#duplicate"] (deduped)'
  );
  assertEqual(
    extractHashtags('#one #two #three #one'),
    ['#one', '#two', '#three'],
    'Multiple with duplicates are deduped'
  );
  assertEqual(
    extractHashtags('Start #hashtag end'),
    ['#hashtag'],
    'Hashtag in middle of text'
  );
}

function testContainsAdIndicator() {
  console.log(`\n${Colors.BOLD}containsAdIndicator()${Colors.END}`);

  assert(containsAdIndicator('Sponsored'), 'Detects "Sponsored"');
  assert(containsAdIndicator('sponsored'), 'Detects "sponsored" (lowercase)');
  assert(containsAdIndicator('Paid Partnership'), 'Detects "Paid Partnership"');
  assert(containsAdIndicator('paid partnership'), 'Detects "paid partnership" (lowercase)');
  assert(containsAdIndicator('This is promoted content'), 'Detects "promoted"');
  assert(containsAdIndicator('Advertisement here'), 'Detects "advertisement"');
  assert(containsAdIndicator('Ad • details'), 'Detects "ad" with bullet separator');
  assert(containsAdIndicator('[ad]'), 'Detects "[ad]"');
  assert(containsAdIndicator('(ad)'), 'Detects "(ad)"');
  assert(!containsAdIndicator('Just a normal post'), 'Rejects "Just a normal post"');
  assert(!containsAdIndicator(null), 'null → false');
  assert(!containsAdIndicator(''), 'Empty string → false');
  assert(!containsAdIndicator('adore the sunset'), 'Does not detect "ad" within "adore"');
}

function testIsValidCreator() {
  console.log(`\n${Colors.BOLD}isValidCreator()${Colors.END}`);

  assert(isValidCreator('@johndoe'), 'Accepts "@johndoe"');
  assert(isValidCreator('John Doe'), 'Accepts "John Doe"');
  assert(!isValidCreator(''), 'Rejects empty string');
  assert(!isValidCreator('sponsored'), 'Rejects "sponsored"');
  assert(!isValidCreator('2h ago'), 'Rejects "2h ago" (time indicator)');
  assert(!isValidCreator('follow'), 'Rejects "follow" (UI element)');
  assert(!isValidCreator('like'), 'Rejects "like" (UI element)');
  assert(!isValidCreator('comment'), 'Rejects "comment" (UI element)');
  assert(!isValidCreator('ad'), 'Rejects "ad" (ad indicator)');
  assert(!isValidCreator('suggested for you'), 'Rejects "suggested for you" (UI)');
  assert(!isValidCreator('just now'), 'Rejects "just now" (time)');
  assert(!isValidCreator('yesterday'), 'Rejects "yesterday" (time)');
  assert(!isValidCreator('1 hour ago'), 'Rejects "1 hour ago" (time)');
  assert(!isValidCreator('instagram'), 'Rejects "instagram" (platform name)');
  assert(!isValidCreator('facebook'), 'Rejects "facebook" (platform name)');
  assert(!isValidCreator('x'), 'Rejects "x" (letter x)');
  assert(isValidCreator('Alice_Smith'), 'Accepts "Alice_Smith" (valid username)');
  assert(!isValidCreator(null), 'null → false');
  assert(!isValidCreator('a'.repeat(100)), 'Rejects extremely long strings (>100 chars)');
}

function testIsValidCaption() {
  console.log(`\n${Colors.BOLD}isValidCaption()${Colors.END}`);

  assert(isValidCaption('This is a normal caption with enough text'), 'Accepts valid caption (>10 chars)');
  assert(!isValidCaption('short'), 'Rejects "short" (less than 10 chars)');
  assert(!isValidCaption('like'), 'Rejects "like" (UI element)');
  assert(!isValidCaption(null), 'null → false');
  assert(!isValidCaption(''), 'Empty string → false');
  assert(!isValidCaption('comment'), 'Rejects "comment" (UI element)');
  assert(!isValidCaption('follow like'), 'Rejects "follow like" (multiple UI elements with short text)');
  assert(!isValidCaption('follow'), 'Rejects "follow" (UI element)');
  assert(!isValidCaption('2h ago'), 'Rejects "2h ago" (timestamp)');
  assert(!isValidCaption('1 hour ago'), 'Rejects "1 hour ago" (timestamp)');
  assert(!isValidCaption('yesterday'), 'Rejects "yesterday" (timestamp)');
  assert(!isValidCaption('100 likes'), 'Rejects "100 likes" (engagement metric)');
  assert(!isValidCaption('500 comments'), 'Rejects "500 comments" (engagement metric)');
  assert(!isValidCaption('audio is muted'), 'Rejects "audio is muted" (UI text)');
  assert(!isValidCaption('original audio'), 'Rejects "original audio" (UI text)');
  assert(!isValidCaption('sponsored'), 'Rejects "sponsored"');
  assert(!isValidCaption('suggested for you'), 'Rejects "suggested for you"');
  assert(isValidCaption('A truly wonderful day at the beach! Beautiful sunset.'), 'Accepts longer valid caption');
  assert(!isValidCaption('view more comments add a comment'), 'Rejects UI patterns');
}

function testExtractInstagramPostId() {
  console.log(`\n${Colors.BOLD}extractInstagramPostId()${Colors.END}`);

  assertEqual(extractInstagramPostId('/p/ABC123_def/'), 'ABC123_def', '"/p/ABC123_def/" → "ABC123_def"');
  assertEqual(extractInstagramPostId('/reel/XYZ789/'), 'XYZ789', '"/reel/XYZ789/" → "XYZ789"');
  assertEqual(extractInstagramPostId('/tv/TV123_abc/'), 'TV123_abc', '"/tv/TV123_abc/" → "TV123_abc"');
  assertEqual(extractInstagramPostId(null), null, 'null → null');
  assertEqual(extractInstagramPostId(''), null, 'Empty string → null');
  assertEqual(
    extractInstagramPostId('https://instagram.com/p/ABCD1234efgh/'),
    'ABCD1234efgh',
    'Full URL extraction'
  );
  assertEqual(
    extractInstagramPostId('/p/Abc-123_xyz/?utm=param'),
    'Abc-123_xyz',
    'Extraction with query params'
  );
}

function testExtractYouTubeVideoId() {
  console.log(`\n${Colors.BOLD}extractYouTubeVideoId()${Colors.END}`);

  assertEqual(
    extractYouTubeVideoId('https://youtube.com/watch?v=abc123'),
    'abc123',
    '"https://youtube.com/watch?v=abc123" → "abc123"'
  );
  assertEqual(
    extractYouTubeVideoId('https://youtube.com/shorts/xyz789'),
    'xyz789',
    '"https://youtube.com/shorts/xyz789" → "xyz789"'
  );
  assertEqual(extractYouTubeVideoId(null), null, 'null → null');
  assertEqual(extractYouTubeVideoId(''), null, 'Empty string → null');
  assertEqual(
    extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ',
    'Shortened youtu.be URL'
  );
  assertEqual(
    extractYouTubeVideoId('https://youtube.com/watch?v=abc123&t=5s&list=xyz'),
    'abc123',
    'URL with multiple query params'
  );
  assertEqual(
    extractYouTubeVideoId('youtube.com/watch?v=test123'),
    'test123',
    'URL without protocol'
  );
}

function testHashString() {
  console.log(`\n${Colors.BOLD}hashString()${Colors.END}`);

  const hash1 = hashString('test string');
  const hash2 = hashString('test string');
  assert(hash1 === hash2, 'Consistent hash for same input');

  const hash3 = hashString('different');
  assert(hash1 !== hash3, 'Different input produces different hash');

  assert(typeof hash1 === 'string', 'Returns string');
  assert(hash1.length > 0, 'Hash is non-empty');

  const hash4 = hashString('');
  assert(typeof hash4 === 'string', 'Handles empty string');

  const hash5 = hashString('a');
  const hash6 = hashString('a');
  assert(hash5 === hash6, 'Single character consistent');
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function runAllTests() {
  console.log(`\n${Colors.BOLD}${'='.repeat(70)}${Colors.END}`);
  console.log(`${Colors.CYAN}AlgorithmLens Utility Functions Test Suite${Colors.END}`);
  console.log(`${'='.repeat(70)}`);

  testParseEngagementCount();
  testExtractHashtags();
  testContainsAdIndicator();
  testIsValidCreator();
  testIsValidCaption();
  testExtractInstagramPostId();
  testExtractYouTubeVideoId();
  testHashString();

  // Print summary
  console.log(`\n${Colors.BOLD}${'='.repeat(70)}${Colors.END}`);
  console.log(`${Colors.BOLD}Test Summary:${Colors.END}`);
  console.log(`  ${Colors.GREEN}Passed: ${passed}${Colors.END}`);
  console.log(`  ${Colors.RED}Failed: ${failed}${Colors.END}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`${'='.repeat(70)}\n`);

  if (failed === 0) {
    console.log(`${Colors.GREEN}${Colors.BOLD}All tests passed!${Colors.END}\n`);
    process.exit(0);
  } else {
    console.log(`${Colors.RED}${Colors.BOLD}Some tests failed.${Colors.END}\n`);
    process.exit(1);
  }
}

runAllTests();
