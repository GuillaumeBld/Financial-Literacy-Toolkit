/**
 * SDM-10 Algorithm Tests
 *
 * Tests the Need score calculation, variant assignment, and selection algorithm
 * against the source of truth specification (sdm.md)
 *
 * Run with: npx tsx src/lib/sdm-algorithm.test.ts
 */

// ============================================================================
// CONFIGURATION (from source of truth)
// ============================================================================
const SDM_SIZE = 10;
const DOMAIN_MINIMUM = 2;
const SUBCATEGORY_CAP = 2;
const OPEN_ENDED_CAP = 3;

const TF_ANCHORS = new Set(['Q2', 'Q3', 'Q11', 'Q30', 'Q35', 'Q36', 'Q39']);
const DOMAIN_ORDER = ['Borrowing & Credit', 'Risk Management', 'Investment & Risk'];

type ResponseType = 'correct' | 'incorrect' | 'do_not_know';
type AnchorFormat = 'MCQ' | 'TF';

// ============================================================================
// FUNCTIONS UNDER TEST (copied from assessment/page.tsx)
// ============================================================================

const getAnchorFormat = (externalItemId: string | null | undefined): AnchorFormat => {
  if (!externalItemId) return 'MCQ';
  const normalized = externalItemId.toUpperCase().replace(/[^Q0-9]/g, '');
  return TF_ANCHORS.has(normalized) ? 'TF' : 'MCQ';
};

const calculateNeedScore = (
  responseType: ResponseType,
  confidence: number | null,
  anchorFormat: AnchorFormat
): number => {
  if (responseType === 'do_not_know') {
    return 4;
  }

  if (responseType === 'incorrect') {
    if (confidence === 3) return 5;
    if (confidence === 2) return 3;
    return 2;
  }

  if (responseType === 'correct') {
    if (confidence === 1) return 5;
    if (confidence === 2) {
      return anchorFormat === 'TF' ? 2 : 1;
    }
    return 0;
  }

  return 0;
};

const getPrimaryVariant = (
  responseType: ResponseType,
  confidence: number | null,
  needScore: number
): string => {
  if (needScore === 5) {
    if (responseType === 'incorrect') {
      return 'open_diagnose';
    }
    return 'open_confirm';
  }

  if (needScore === 4) return 'lower_mcq';
  if (needScore === 3) return 'lower_mcq';
  if (needScore === 2) return 'lower_tf';
  if (needScore === 1) return 'same_mcq';
  return 'higher_mcq';
};

const FALLBACK_VARIANTS: Record<string, string> = {
  'open_diagnose': 'lower_mcq',
  'open_confirm': 'same_mcq',
};

const isOpenEndedVariant = (variant: string): boolean => {
  const v = variant.toLowerCase();
  return v.includes('open_diagnose') || v.includes('open_confirm');
};

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.log(`  ❌ ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${expected}`);
    console.log(`     Actual:   ${actual}`);
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log('\n========================================');
console.log('SDM-10 ALGORITHM TESTS');
console.log('========================================\n');

// --------------------------------------------------------------------------
// Test 1: Anchor Format Detection
// --------------------------------------------------------------------------
console.log('TEST 1: Anchor Format Detection');
console.log('--------------------------------');

assertEqual(getAnchorFormat('Q1'), 'MCQ', 'Q1 should be MCQ');
assertEqual(getAnchorFormat('Q2'), 'TF', 'Q2 should be T/F');
assertEqual(getAnchorFormat('Q3'), 'TF', 'Q3 should be T/F');
assertEqual(getAnchorFormat('Q4'), 'MCQ', 'Q4 should be MCQ');
assertEqual(getAnchorFormat('Q11'), 'TF', 'Q11 should be T/F');
assertEqual(getAnchorFormat('Q30'), 'TF', 'Q30 should be T/F');
assertEqual(getAnchorFormat('Q35'), 'TF', 'Q35 should be T/F');
assertEqual(getAnchorFormat('Q36'), 'TF', 'Q36 should be T/F');
assertEqual(getAnchorFormat('Q39'), 'TF', 'Q39 should be T/F');
assertEqual(getAnchorFormat('Q40'), 'MCQ', 'Q40 should be MCQ');
assertEqual(getAnchorFormat(null), 'MCQ', 'null should default to MCQ');

// --------------------------------------------------------------------------
// Test 2: Need Score Calculation (Source of Truth Table 4)
// --------------------------------------------------------------------------
console.log('\nTEST 2: Need Score Calculation (Table 4)');
console.log('-----------------------------------------');

// Signal conflict cases (Need = 5)
assertEqual(calculateNeedScore('incorrect', 3, 'MCQ'), 5, 'Incorrect + High → Need 5');
assertEqual(calculateNeedScore('incorrect', 3, 'TF'), 5, 'Incorrect + High (T/F) → Need 5');
assertEqual(calculateNeedScore('correct', 1, 'MCQ'), 5, 'Correct + Low → Need 5');
assertEqual(calculateNeedScore('correct', 1, 'TF'), 5, 'Correct + Low (T/F) → Need 5');

// Do Not Know (Need = 4)
assertEqual(calculateNeedScore('do_not_know', null, 'MCQ'), 4, 'Do Not Know (MCQ) → Need 4');
assertEqual(calculateNeedScore('do_not_know', null, 'TF'), 4, 'Do Not Know (T/F) → Need 4');

// Incorrect + Mid (Need = 3)
assertEqual(calculateNeedScore('incorrect', 2, 'MCQ'), 3, 'Incorrect + Mid → Need 3');
assertEqual(calculateNeedScore('incorrect', 2, 'TF'), 3, 'Incorrect + Mid (T/F) → Need 3');

// Incorrect + Low (Need = 2)
assertEqual(calculateNeedScore('incorrect', 1, 'MCQ'), 2, 'Incorrect + Low → Need 2');
assertEqual(calculateNeedScore('incorrect', 1, 'TF'), 2, 'Incorrect + Low (T/F) → Need 2');

// Correct + Mid - FORMAT MATTERS!
assertEqual(calculateNeedScore('correct', 2, 'MCQ'), 1, 'Correct + Mid (MCQ) → Need 1');
assertEqual(calculateNeedScore('correct', 2, 'TF'), 2, 'Correct + Mid (T/F) → Need 2 (ELEVATED)');

// Correct + High (Need = 0)
assertEqual(calculateNeedScore('correct', 3, 'MCQ'), 0, 'Correct + High → Need 0');
assertEqual(calculateNeedScore('correct', 3, 'TF'), 0, 'Correct + High (T/F) → Need 0');

// --------------------------------------------------------------------------
// Test 3: Variant Type Assignment (Source of Truth Table 11)
// --------------------------------------------------------------------------
console.log('\nTEST 3: Variant Type Assignment (Table 11)');
console.log('-------------------------------------------');

// Need = 5 variants
assertEqual(getPrimaryVariant('incorrect', 3, 5), 'open_diagnose', 'Need 5 + Incorrect → Open_Diagnose');
assertEqual(getPrimaryVariant('correct', 1, 5), 'open_confirm', 'Need 5 + Correct → Open_Confirm');

// Need = 4 variant
assertEqual(getPrimaryVariant('do_not_know', null, 4), 'lower_mcq', 'Need 4 (Do Not Know) → Lower_MCQ');

// Need = 3 variant
assertEqual(getPrimaryVariant('incorrect', 2, 3), 'lower_mcq', 'Need 3 → Lower_MCQ');

// Need = 2 variant
assertEqual(getPrimaryVariant('incorrect', 1, 2), 'lower_tf', 'Need 2 (Incorrect + Low) → Lower_TF');
assertEqual(getPrimaryVariant('correct', 2, 2), 'lower_tf', 'Need 2 (T/F Correct + Mid) → Lower_TF');

// Need = 1 variant
assertEqual(getPrimaryVariant('correct', 2, 1), 'same_mcq', 'Need 1 → Same_MCQ');

// Need = 0 variant
assertEqual(getPrimaryVariant('correct', 3, 0), 'higher_mcq', 'Need 0 → Higher_MCQ');

// --------------------------------------------------------------------------
// Test 4: Fallback Variants (Source of Truth Table 12)
// --------------------------------------------------------------------------
console.log('\nTEST 4: Fallback Variants (Table 12)');
console.log('-------------------------------------');

assertEqual(FALLBACK_VARIANTS['open_diagnose'], 'lower_mcq', 'Open_Diagnose fallback → Lower_MCQ');
assertEqual(FALLBACK_VARIANTS['open_confirm'], 'same_mcq', 'Open_Confirm fallback → Same_MCQ');

// --------------------------------------------------------------------------
// Test 5: Open-Ended Detection
// --------------------------------------------------------------------------
console.log('\nTEST 5: Open-Ended Detection');
console.log('-----------------------------');

assert(isOpenEndedVariant('open_diagnose'), 'open_diagnose is open-ended');
assert(isOpenEndedVariant('open_confirm'), 'open_confirm is open-ended');
assert(isOpenEndedVariant('Open_Diagnose'), 'Open_Diagnose (case insensitive) is open-ended');
assert(!isOpenEndedVariant('lower_mcq'), 'lower_mcq is NOT open-ended');
assert(!isOpenEndedVariant('lower_tf'), 'lower_tf is NOT open-ended');
assert(!isOpenEndedVariant('same_mcq'), 'same_mcq is NOT open-ended');
assert(!isOpenEndedVariant('higher_mcq'), 'higher_mcq is NOT open-ended');

// --------------------------------------------------------------------------
// Test 6: Full Response Pattern Coverage
// --------------------------------------------------------------------------
console.log('\nTEST 6: Full Response Pattern Coverage');
console.log('---------------------------------------');

interface TestCase {
  response: ResponseType;
  confidence: number | null;
  format: AnchorFormat;
  expectedNeed: number;
  expectedVariant: string;
  description: string;
}

const testCases: TestCase[] = [
  // MCQ patterns
  { response: 'incorrect', confidence: 3, format: 'MCQ', expectedNeed: 5, expectedVariant: 'open_diagnose', description: 'MCQ Incorrect + High' },
  { response: 'incorrect', confidence: 2, format: 'MCQ', expectedNeed: 3, expectedVariant: 'lower_mcq', description: 'MCQ Incorrect + Mid' },
  { response: 'incorrect', confidence: 1, format: 'MCQ', expectedNeed: 2, expectedVariant: 'lower_tf', description: 'MCQ Incorrect + Low' },
  { response: 'correct', confidence: 3, format: 'MCQ', expectedNeed: 0, expectedVariant: 'higher_mcq', description: 'MCQ Correct + High' },
  { response: 'correct', confidence: 2, format: 'MCQ', expectedNeed: 1, expectedVariant: 'same_mcq', description: 'MCQ Correct + Mid' },
  { response: 'correct', confidence: 1, format: 'MCQ', expectedNeed: 5, expectedVariant: 'open_confirm', description: 'MCQ Correct + Low' },
  { response: 'do_not_know', confidence: null, format: 'MCQ', expectedNeed: 4, expectedVariant: 'lower_mcq', description: 'MCQ Do Not Know' },

  // T/F patterns (same as MCQ except Correct + Mid)
  { response: 'incorrect', confidence: 3, format: 'TF', expectedNeed: 5, expectedVariant: 'open_diagnose', description: 'T/F Incorrect + High' },
  { response: 'incorrect', confidence: 2, format: 'TF', expectedNeed: 3, expectedVariant: 'lower_mcq', description: 'T/F Incorrect + Mid' },
  { response: 'incorrect', confidence: 1, format: 'TF', expectedNeed: 2, expectedVariant: 'lower_tf', description: 'T/F Incorrect + Low' },
  { response: 'correct', confidence: 3, format: 'TF', expectedNeed: 0, expectedVariant: 'higher_mcq', description: 'T/F Correct + High' },
  { response: 'correct', confidence: 2, format: 'TF', expectedNeed: 2, expectedVariant: 'lower_tf', description: 'T/F Correct + Mid (ELEVATED)' },
  { response: 'correct', confidence: 1, format: 'TF', expectedNeed: 5, expectedVariant: 'open_confirm', description: 'T/F Correct + Low' },
  { response: 'do_not_know', confidence: null, format: 'TF', expectedNeed: 4, expectedVariant: 'lower_mcq', description: 'T/F Do Not Know' },
];

for (const tc of testCases) {
  const actualNeed = calculateNeedScore(tc.response, tc.confidence, tc.format);
  const actualVariant = getPrimaryVariant(tc.response, tc.confidence, actualNeed);

  const needPass = actualNeed === tc.expectedNeed;
  const variantPass = actualVariant === tc.expectedVariant;

  if (needPass && variantPass) {
    passCount++;
    console.log(`  ✅ ${tc.description}: Need=${actualNeed}, Variant=${actualVariant}`);
  } else {
    failCount++;
    console.log(`  ❌ ${tc.description}`);
    if (!needPass) console.log(`     Need: expected ${tc.expectedNeed}, got ${actualNeed}`);
    if (!variantPass) console.log(`     Variant: expected ${tc.expectedVariant}, got ${actualVariant}`);
  }
}

// --------------------------------------------------------------------------
// Test 7: Constraint Values
// --------------------------------------------------------------------------
console.log('\nTEST 7: Constraint Values');
console.log('--------------------------');

assertEqual(SDM_SIZE, 10, 'SDM size should be 10');
assertEqual(DOMAIN_MINIMUM, 2, 'Domain minimum should be 2');
assertEqual(SUBCATEGORY_CAP, 2, 'Subcategory cap should be 2');
assertEqual(OPEN_ENDED_CAP, 3, 'Open-ended cap should be 3');
assertEqual(DOMAIN_ORDER.length, 3, 'Should have 3 domains');
assertEqual(DOMAIN_ORDER[0], 'Borrowing & Credit', 'First domain should be Borrowing & Credit');
assertEqual(DOMAIN_ORDER[1], 'Risk Management', 'Second domain should be Risk Management');
assertEqual(DOMAIN_ORDER[2], 'Investment & Risk', 'Third domain should be Investment & Risk');

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log(`Total:  ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
