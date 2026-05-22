/**
 * SDM Scorer Unit Tests
 *
 * Tests pure exported functions from score-sdm-responses.ts without
 * hitting the database or OpenRouter API.
 *
 * Run with: npx tsx scripts/score-sdm-responses.test.ts
 */

import {
  extractResponseText,
  parseAiResponse,
  mapConfidence,
  buildDiagnosePrompt,
  buildConfirmPrompt,
  score,
  type ScoreInput,
} from "./score-sdm-responses.js";
import { ITEM_CONFIGS } from "./sdm-item-configs.js";

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
console.log('SDM-10 SCORER UNIT TESTS');
console.log('========================================\n');

// --------------------------------------------------------------------------
// TEST 1: extractResponseText()
// --------------------------------------------------------------------------
console.log('TEST 1: extractResponseText()');
console.log('------------------------------');

assertEqual(extractResponseText("hello"), "hello", "string passthrough");
assertEqual(extractResponseText(""), "", "empty string");
assertEqual(extractResponseText({ answer: "my answer" }), "my answer", "object with .answer");
assertEqual(extractResponseText({ text: "my text" }), "my text", "object with .text");
assertEqual(extractResponseText({ response: "res" }), "res", "object with .response");
assertEqual(extractResponseText(null), "", "null → empty string");
assertEqual(extractResponseText(undefined), "", "undefined → empty string");
assertEqual(extractResponseText(42), "42", "number → string");

// --------------------------------------------------------------------------
// TEST 2: parseAiResponse()
// --------------------------------------------------------------------------
console.log('\nTEST 2: parseAiResponse()');
console.log('--------------------------');

const validJson = '{"credit": 100, "diagnosis_type": "misconception"}';
const parsed1 = parseAiResponse(validJson);
assertEqual(parsed1.credit, 100, "valid JSON: credit=100");
assertEqual(parsed1.diagnosis_type, "misconception", "valid JSON: diagnosis_type");

const fenced = '```json\n{"credit": 50}\n```';
const parsed2 = parseAiResponse(fenced);
assertEqual(parsed2.credit, 50, "fenced JSON: credit=50");

const bad = "not json at all";
const parsed3 = parseAiResponse(bad);
assertEqual(parsed3.error, "parse_failed", "invalid JSON → error=parse_failed");
assert("raw" in parsed3, "invalid JSON → has raw field");

// --------------------------------------------------------------------------
// TEST 3: mapConfidence()
// --------------------------------------------------------------------------
console.log('\nTEST 3: mapConfidence()');
console.log('------------------------');

assertEqual(mapConfidence("high"), 0.9, "high → 0.9");
assertEqual(mapConfidence("medium"), 0.7, "medium → 0.7");
assertEqual(mapConfidence("low"), 0.5, "low → 0.5");
assertEqual(mapConfidence("unknown"), 0.5, "unknown → 0.5 default");
assertEqual(mapConfidence(undefined), 0.5, "undefined → 0.5 default");

// --------------------------------------------------------------------------
// TEST 4: buildDiagnosePrompt()
// --------------------------------------------------------------------------
console.log('\nTEST 4: buildDiagnosePrompt()');
console.log('------------------------------');

const config = ITEM_CONFIGS["Q1"];
assert(config !== undefined, "Q1 config exists in ITEM_CONFIGS");
if (config) {
  const prompt = buildDiagnosePrompt(config, "I thought interest was simple");
  assert(prompt.includes(config.question), "diagnose prompt includes question");
  assert(prompt.includes(config.correct_answer), "diagnose prompt includes correct_answer");
  assert(prompt.includes("I thought interest was simple"), "diagnose prompt includes response text");
  assert(prompt.includes(config.taxonomy), "diagnose prompt includes taxonomy");
}

// --------------------------------------------------------------------------
// TEST 5: buildConfirmPrompt()
// --------------------------------------------------------------------------
console.log('\nTEST 5: buildConfirmPrompt()');
console.log('-----------------------------');

if (config) {
  const prompt = buildConfirmPrompt(config, "because compound grows faster");
  assert(prompt.includes(config.correct_answer), "confirm prompt includes correct_answer");
  assert(prompt.includes(config.rubric.accept), "confirm prompt includes rubric accept");
  assert(prompt.includes(config.rubric.partial), "confirm prompt includes rubric partial");
  assert(prompt.includes("because compound grows faster"), "confirm prompt includes response text");
}

// --------------------------------------------------------------------------
// TEST 6: score() — async tests
// --------------------------------------------------------------------------
console.log('\nTEST 6: score()');
console.log('-----------------');

async function runAsyncTests() {
  // 6a: unknown anchor_item_id → returns error result
  const unknownInput: ScoreInput = {
    responseId: "resp-001",
    rawAnswer: "some text",
    variantType: "Open_Diagnose",
    anchorItemId: "Q999_NONEXISTENT",
  };
  const stubApi = async () => { throw new Error("should not be called"); };
  const r1 = await score(unknownInput, stubApi);
  assertEqual(r1.error, "no_config", "unknown item → error=no_config");
  assertEqual(r1.responseId, "resp-001", "responseId preserved on no_config");

  // 6b: API error → returns api_error result
  const q1Input: ScoreInput = {
    responseId: "resp-002",
    rawAnswer: "I guessed",
    variantType: "Open_Diagnose",
    anchorItemId: "Q1",
  };
  const failApi = async () => { throw new Error("network failure"); };
  const r2 = await score(q1Input, failApi);
  assertEqual(r2.error, "api_error", "API error → error=api_error");
  assertEqual(r2.responseId, "resp-002", "responseId preserved on api_error");
  assert(String(r2.aiFlags.message).includes("network failure"), "error message captured");

  // 6c: parse error from API response → returns parse error
  const parseFailApi = async () => "this is not json";
  const r3 = await score(q1Input, parseFailApi);
  assertEqual(r3.error, "parse_failed", "bad AI response → error=parse_failed");

  // 6d: successful Diagnose scoring
  const diagnoseMock = async () =>
    JSON.stringify({
      diagnosis_type: "misconception",
      credit: 100,
      classification_confidence: "high",
      layer1_code: "INT-01",
      layer2_tag: "compound-growth",
      evidence_quote: "I thought interest was fixed",
      reasoning_summary: "Student shows compound interest misconception",
    });
  const r4 = await score(q1Input, diagnoseMock);
  assert(!r4.error, "successful score → no error");
  assertEqual(r4.score, 100, "credit=100 mapped to score");
  assertEqual(r4.aiConfidence, 0.9, "high confidence → 0.9");
  assertEqual(r4.responseId, "resp-002", "responseId preserved on success");

  // 6e: successful Confirm scoring
  const confirmInput: ScoreInput = {
    responseId: "resp-003",
    rawAnswer: "I knew the formula",
    variantType: "Open_Confirm",
    anchorItemId: "Q1",
  };
  const confirmMock = async () =>
    JSON.stringify({
      understanding_level: "partial",
      credit: 50,
      classification_confidence: "medium",
      reasoning_quality: "vague",
      evidence_quote: "I knew the formula",
      reasoning_summary: "Vague explanation",
    });
  const r5 = await score(confirmInput, confirmMock);
  assert(!r5.error, "confirm score → no error");
  assertEqual(r5.score, 50, "credit=50 mapped to score");
  assertEqual(r5.aiConfidence, 0.7, "medium confidence → 0.7");
}

runAsyncTests()
  .then(() => {
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Total:  ${passCount + failCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('========================================\n');
    if (failCount > 0) process.exit(1);
  })
  .catch((err) => {
    console.error("Test runner crashed:", err);
    process.exit(1);
  });
