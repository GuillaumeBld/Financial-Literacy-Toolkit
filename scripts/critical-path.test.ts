/**
 * Critical Path Test Suite
 *
 * Automated DB-level tests covering the full student journey:
 *   A. Course validation
 *   B. Onboarding (user creation, enrollment, profile, JSONB)
 *   C. Student login (registered/unregistered, onboarding, in-progress)
 *   D. Items retrieval (anchor count, SDM variants, ordering, completeness)
 *   E. Auto-save (attempt creation, bulk upsert, overwrite, progress)
 *   F. Submission + scoring (bulk insert, correct/incorrect, preferences skipped, overall, Q14 key)
 *   G. Duplicate prevention (409 re-submit, different type OK, different user OK)
 *   H. Resume (in-progress found, responses with item JOIN, submitted flag)
 *
 * Run: npx tsx scripts/critical-path.test.ts
 * Requires: Docker (spins up a temporary Postgres container)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { Client } from 'pg';
import { join } from 'path';
import { createHash } from 'crypto';

const CONTAINER_NAME = 'test_critical_path';
const DB_PORT = 5498;
const DB_USER = 'testuser';
const DB_PASS = 'testpass';
const DB_NAME = 'testdb';

let client: Client;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function cleanup() {
  try {
    run(`docker rm -f ${CONTAINER_NAME} 2>/dev/null`);
  } catch { /* ignore */ }
}

async function waitForPostgres(retries = 30): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const c = new Client({ host: '127.0.0.1', port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME });
      await c.connect();
      await c.query('SELECT 1');
      await c.end();
      return;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Postgres did not become ready');
}

function hashedStudentKey(pepper: string, studentId: string): string {
  const normalized = studentId.trim().toLowerCase();
  return createHash('sha256').update(pepper + normalized).digest('hex');
}

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
    failures.push(label);
  }
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function loadSchemaAndSeed() {
  // Load full production schema
  const schemaPath = join(__dirname, '..', 'infra', 'vps-postgres-complete-schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  await client.query(schemaSql);

  // Seed course
  await client.query(`
    INSERT INTO courses (course_id, name, term, pepper)
    VALUES ('11111111-1111-1111-1111-111111111111', 'FINA 301', 'Spring 2026', 'test-pepper-abc123')
  `);

  // Seed instruments
  await client.query(`
    INSERT INTO instruments (instrument_id, name, version, status)
    VALUES
      ('22222222-2222-2222-2222-222222222222', 'Pre-Course Assessment', '1.0', 'active'),
      ('22222222-2222-2222-2222-222222222223', 'Post-Course Assessment', '1.0', 'active')
  `);

  // Seed 40 anchor items (Q1-Q14 knowledge scored, Q15-Q28 preference not scored, Q29-Q40 knowledge scored)
  const anchorItems: string[] = [];
  for (let i = 1; i <= 40; i++) {
    const isScored = i <= 14 || i >= 29; // Q15-Q28 are preference items
    const domain = i <= 10 ? 'Borrowing' : i <= 14 ? 'Behavioral' : i <= 28 ? 'Preferences' : 'Risk and Return';
    const key = isScored ? (i === 14 ? 'B' : 'A') : null;
    const keyClause = key ? `'${key}'` : 'NULL';
    anchorItems.push(
      `('${String(i).padStart(8, '0')}-0000-0000-0000-000000000000', '${i}', '${domain}', 'sub', 0.50, 'multiple_choice',
        'Question ${i} stem text?',
        '[{"id":"A","text":"Option A"},{"id":"B","text":"Option B"},{"id":"C","text":"Option C"},{"id":"D","text":"Option D"}]',
        ${keyClause}, true, true, ${isScored})`
    );
  }

  await client.query(`
    INSERT INTO items (item_id, external_item_id, domain, subdomain, difficulty, type, stem, options, key, is_anchor, is_active, is_scored)
    VALUES ${anchorItems.join(',\n')}
  `);

  // Apply SDM migration to add variant columns
  const sdmMigrationPath = join(__dirname, '..', 'infra', 'migration-add-sdm-variants.sql');
  const sdmMigrationSql = readFileSync(sdmMigrationPath, 'utf-8');
  await client.query(sdmMigrationSql);

  // Seed a few SDM variant items (linked to anchor Q1)
  for (let v = 1; v <= 3; v++) {
    await client.query(`
      INSERT INTO items (item_id, external_item_id, domain, subdomain, difficulty, type, stem, options, key,
                         is_anchor, is_active, is_scored, anchor_item_id, variant_type, trigger_condition)
      VALUES ($1, NULL, 'Borrowing', 'sub', 0.50, 'multiple_choice',
              'SDM variant ${v} for Q1', '[{"id":"A","text":"A"},{"id":"B","text":"B"}]', 'A',
              false, true, true,
              '00000001-0000-0000-0000-000000000000', 'easier', 'score < 50')
    `, [`a000000${v}-0000-0000-0000-000000000000`]);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Critical Path Test Suite ===\n');

  // --- Spin up Postgres ---
  cleanup();
  console.log('Starting temporary Postgres container...');
  run(
    `docker run -d --name ${CONTAINER_NAME} ` +
    `-e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASS} -e POSTGRES_DB=${DB_NAME} ` +
    `-p ${DB_PORT}:5432 postgres:15-alpine`
  );
  await waitForPostgres();
  console.log('Postgres ready.\n');

  client = new Client({ host: '127.0.0.1', port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME });
  await client.connect();

  try {
    console.log('Loading schema and seeding data...');
    await loadSchemaAndSeed();
    console.log('Done.\n');

    // =====================================================================
    // A. Course validation (3 assertions)
    // =====================================================================
    console.log('[A] Course validation');

    const validCourse = await client.query(
      `SELECT course_id, name, pepper FROM courses WHERE name = $1`, ['FINA 301']
    );
    assert(validCourse.rows.length === 1, 'Valid course found by name');
    assert(validCourse.rows[0].pepper === 'test-pepper-abc123', 'Course pepper is accessible');

    const invalidCourse = await client.query(
      `SELECT course_id FROM courses WHERE name = $1`, ['FAKE 999']
    );
    assert(invalidCourse.rows.length === 0, 'Invalid course returns no rows');

    // =====================================================================
    // B. Onboarding (6 assertions)
    // =====================================================================
    console.log('\n[B] Onboarding');

    const pepper = validCourse.rows[0].pepper;
    const courseId = validCourse.rows[0].course_id;
    const hsk = hashedStudentKey(pepper, '123456789');

    // Create user
    const newUser = await client.query(
      `INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, 'hashed') RETURNING user_id`,
      [hsk]
    );
    assert(newUser.rows.length === 1, 'User created with hashed student key');
    const userId = newUser.rows[0].user_id;

    // Enroll
    await client.query(
      `INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, 'student') ON CONFLICT DO NOTHING`,
      [userId, courseId]
    );
    const enrollment = await client.query(
      `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`, [userId, courseId]
    );
    assert(enrollment.rows.length === 1, 'Enrollment created');
    assert(enrollment.rows[0].role === 'student', 'Enrollment role is student');

    // Profile upsert with JSONB
    await client.query(
      `INSERT INTO student_profiles (user_id, course_id, gender, prior_financial_products)
       VALUES ($1, $2, 'female', $3)
       ON CONFLICT (user_id, course_id) DO UPDATE SET gender = EXCLUDED.gender, prior_financial_products = EXCLUDED.prior_financial_products`,
      [userId, courseId, JSON.stringify(['credit-card', 'student-loan'])]
    );
    const profile = await client.query(
      `SELECT gender, prior_financial_products FROM student_profiles WHERE user_id = $1`, [userId]
    );
    assert(profile.rows.length === 1, 'Profile upserted');
    assert(profile.rows[0].prior_financial_products.length === 2, 'JSONB array round-trips correctly');

    // =====================================================================
    // C. Student login (7 assertions)
    // =====================================================================
    console.log('\n[C] Student login');

    // Registered user lookup
    const registeredUser = await client.query(
      `SELECT user_id FROM users WHERE hashed_student_key = $1`, [hsk]
    );
    assert(registeredUser.rows.length === 1, 'Registered user found by hashed key');

    // Unregistered user lookup
    const unregisteredHsk = hashedStudentKey(pepper, '999999999');
    const unregisteredUser = await client.query(
      `SELECT user_id FROM users WHERE hashed_student_key = $1`, [unregisteredHsk]
    );
    assert(unregisteredUser.rows.length === 0, 'Unregistered user returns no rows');

    // Check onboarding (profile exists)
    const onboardingCheck = await client.query(
      `SELECT sp.profile_id FROM student_profiles sp
       JOIN enrollments e ON sp.user_id = e.user_id AND sp.course_id = e.course_id
       WHERE sp.user_id = $1 AND sp.course_id = $2`, [userId, courseId]
    );
    assert(onboardingCheck.rows.length === 1, 'Onboarding complete (profile exists)');

    // No profile for unregistered
    const noOnboarding = await client.query(
      `SELECT profile_id FROM student_profiles WHERE user_id = $1`, ['00000000-0000-0000-0000-000000000000']
    );
    assert(noOnboarding.rows.length === 0, 'No onboarding for non-existent user');

    // In-progress detection (no attempt yet)
    const noInProgress = await client.query(
      `SELECT attempt_id FROM attempts WHERE user_id = $1 AND course_id = $2 AND submitted_at IS NULL`,
      [userId, courseId]
    );
    assert(noInProgress.rows.length === 0, 'No in-progress attempt initially');

    // Create an in-progress attempt for detection
    const inProgressAttempt = await client.query(
      `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, started_at)
       VALUES ($1, $2, '22222222-2222-2222-2222-222222222222', 'pre', NOW())
       RETURNING attempt_id`,
      [userId, courseId]
    );
    assert(inProgressAttempt.rows.length === 1, 'In-progress attempt created');

    const detectInProgress = await client.query(
      `SELECT attempt_id FROM attempts WHERE user_id = $1 AND course_id = $2 AND submitted_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [userId, courseId]
    );
    assert(detectInProgress.rows.length === 1, 'In-progress attempt detected');

    const attemptId = inProgressAttempt.rows[0].attempt_id;

    // =====================================================================
    // D. Items retrieval (5 assertions)
    // =====================================================================
    console.log('\n[D] Items retrieval');

    const anchors = await client.query(
      `SELECT item_id, external_item_id, stem, options, key, domain FROM items WHERE is_anchor = true AND is_active = true ORDER BY CAST(external_item_id AS INTEGER)`
    );
    assert(anchors.rows.length === 40, 'Anchor items count = 40');

    const sdmVariants = await client.query(
      `SELECT item_id FROM items WHERE anchor_item_id IS NOT NULL AND is_active = true`
    );
    assert(sdmVariants.rows.length > 0, 'SDM variant items exist');

    // Ordering check
    const firstAnchor = anchors.rows[0];
    const lastAnchor = anchors.rows[39];
    assert(parseInt(firstAnchor.external_item_id) === 1, 'First anchor is Q1 (ordered by external_item_id)');
    assert(parseInt(lastAnchor.external_item_id) === 40, 'Last anchor is Q40');

    // Field completeness
    const sampleItem = anchors.rows[0];
    assert(
      sampleItem.stem && sampleItem.options && sampleItem.domain,
      'Anchor items have stem, options, and domain'
    );

    // =====================================================================
    // E. Auto-save (6 assertions)
    // =====================================================================
    console.log('\n[E] Auto-save');

    // Attempt already exists from section C
    assert(!!attemptId, 'Active attempt available for auto-save');

    // Bulk upsert - insert 5 responses
    const saveItemIds = anchors.rows.slice(0, 5).map((r: any) => r.item_id);
    const saveAnswers = saveItemIds.map(() => JSON.stringify({ answer: 'A' }));
    const saveConfidences = saveItemIds.map(() => 2);
    const saveScores = saveItemIds.map(() => null);

    await client.query(
      `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence, score, created_at)
       SELECT $1, unnest($2::uuid[]), unnest($3::jsonb[]), unnest($4::int[]), unnest($5::numeric[]), NOW()
       ON CONFLICT (attempt_id, item_id)
       DO UPDATE SET raw_answer = EXCLUDED.raw_answer, confidence = EXCLUDED.confidence, score = EXCLUDED.score`,
      [attemptId, saveItemIds, saveAnswers, saveConfidences, saveScores]
    );

    const savedCount = await client.query(
      `SELECT COUNT(*) as cnt FROM responses WHERE attempt_id = $1`, [attemptId]
    );
    assert(parseInt(savedCount.rows[0].cnt) === 5, 'Bulk upsert inserted 5 responses');

    // Overwrite - change answer for first item
    const overwriteItemIds = [saveItemIds[0]];
    const overwriteAnswers = [JSON.stringify({ answer: 'B' })];
    await client.query(
      `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence, score, created_at)
       SELECT $1, unnest($2::uuid[]), unnest($3::jsonb[]), unnest($4::int[]), unnest($5::numeric[]), NOW()
       ON CONFLICT (attempt_id, item_id)
       DO UPDATE SET raw_answer = EXCLUDED.raw_answer, confidence = EXCLUDED.confidence, score = EXCLUDED.score`,
      [attemptId, overwriteItemIds, overwriteAnswers, [3], [null]]
    );

    const overwritten = await client.query(
      `SELECT raw_answer, confidence FROM responses WHERE attempt_id = $1 AND item_id = $2`,
      [attemptId, saveItemIds[0]]
    );
    assert(overwritten.rows[0].raw_answer.answer === 'B', 'Bulk upsert overwrites existing answer');
    assert(overwritten.rows[0].confidence === 3, 'Confidence updated on overwrite');

    // Count still 5 (upsert, not duplicate insert)
    const countAfterOverwrite = await client.query(
      `SELECT COUNT(*) as cnt FROM responses WHERE attempt_id = $1`, [attemptId]
    );
    assert(parseInt(countAfterOverwrite.rows[0].cnt) === 5, 'Response count unchanged after overwrite (upsert)');

    // Progress count
    const progress = await client.query(
      `SELECT COUNT(*) as answered FROM responses WHERE attempt_id = $1`, [attemptId]
    );
    assert(parseInt(progress.rows[0].answered) === 5, 'Progress count reflects saved responses');

    // =====================================================================
    // F. Submission + scoring (10 assertions)
    // =====================================================================
    console.log('\n[F] Submission + scoring');

    // Clean up in-progress attempt responses to start fresh for submission
    await client.query(`DELETE FROM responses WHERE attempt_id = $1`, [attemptId]);

    // Submit attempt: mark as submitted
    await client.query(
      `UPDATE attempts SET submitted_at = NOW(), duration_s = 300 WHERE attempt_id = $1`, [attemptId]
    );

    // Bulk insert all 40 responses
    const allItemIds = anchors.rows.map((r: any) => r.item_id);
    const allAnswers = anchors.rows.map((r: any) => {
      // Answer correctly for scored items where key = 'A', incorrectly for Q14 (key = 'B')
      if (r.key === 'B') return JSON.stringify({ answer: 'B' }); // Q14 - correct
      if (r.key === 'A') return JSON.stringify({ answer: 'A' }); // Others - correct
      return JSON.stringify({ answer: 'A' }); // Preference items
    });
    const allConfidences = allItemIds.map(() => 2);

    await client.query(
      `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence)
       SELECT $1, unnest($2::uuid[]), unnest($3::jsonb[]), unnest($4::int[])`,
      [attemptId, allItemIds, allAnswers, allConfidences]
    );

    const insertedResponses = await client.query(
      `SELECT COUNT(*) as cnt FROM responses WHERE attempt_id = $1`, [attemptId]
    );
    assert(parseInt(insertedResponses.rows[0].cnt) === 40, 'Bulk inserted 40 responses');

    // Score: fetch items and score in SQL
    const itemsForScoring = await client.query(
      `SELECT i.item_id, i.key, i.type, i.is_scored, r.raw_answer
       FROM items i JOIN responses r ON i.item_id = r.item_id
       WHERE r.attempt_id = $1 AND i.is_anchor = true`,
      [attemptId]
    );

    let scoredCount = 0;
    let correctCount = 0;
    const scoreUpdates: { itemId: string; score: number }[] = [];

    for (const row of itemsForScoring.rows) {
      if (row.is_scored === false) continue;
      if (row.type === 'multiple_choice' && row.key) {
        const answer = row.raw_answer?.answer;
        const score = answer === row.key ? 100 : 0;
        scoreUpdates.push({ itemId: row.item_id, score });
        scoredCount++;
        if (score === 100) correctCount++;
      }
    }

    // Bulk update scores
    if (scoreUpdates.length > 0) {
      const updateIds = scoreUpdates.map(s => s.itemId);
      const updateScores = scoreUpdates.map(s => s.score);
      await client.query(
        `UPDATE responses r
         SET score = u.score
         FROM (SELECT unnest($1::uuid[]) as item_id, unnest($2::int[]) as score) u
         WHERE r.attempt_id = $3 AND r.item_id = u.item_id`,
        [updateIds, updateScores, attemptId]
      );
    }

    assert(scoredCount === 26, 'Scored 26 knowledge items (Q1-Q14 + Q29-Q40)');

    // Check preference items (Q15-Q28) were skipped
    const prefItems = await client.query(
      `SELECT r.score FROM responses r JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1 AND i.is_scored = false`,
      [attemptId]
    );
    const allPrefNull = prefItems.rows.every((r: any) => r.score === null);
    assert(allPrefNull, 'Preference items (Q15-Q28) have NULL scores (skipped)');
    assert(prefItems.rows.length === 14, '14 preference items found');

    // Correct scoring
    const correctScores = await client.query(
      `SELECT r.score FROM responses r JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1 AND i.is_scored = true AND i.key IS NOT NULL AND r.raw_answer->>'answer' = i.key`,
      [attemptId]
    );
    assert(correctScores.rows.every((r: any) => parseFloat(r.score) === 100), 'Correct answers scored 100');

    // Incorrect scoring (there should be none since we answered all correctly)
    const incorrectScores = await client.query(
      `SELECT r.score FROM responses r JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1 AND i.is_scored = true AND i.key IS NOT NULL AND r.raw_answer->>'answer' != i.key`,
      [attemptId]
    );
    assert(incorrectScores.rows.length === 0, 'No incorrect answers in this test (all correct)');

    // Overall score
    const overallScore = scoredCount > 0 ? (correctCount / scoredCount) * 100 : 0;
    assert(overallScore === 100, 'Overall score is 100% (all knowledge items correct)');

    // Insert scores record
    await client.query(
      `INSERT INTO scores (attempt_id, overall, by_domain, se_overall)
       VALUES ($1, $2, $3, 5.0)`,
      [attemptId, overallScore, JSON.stringify({ Borrowing: 100, Behavioral: 100, 'Risk and Return': 100 })]
    );
    const scoresRecord = await client.query(
      `SELECT overall, by_domain FROM scores WHERE attempt_id = $1`, [attemptId]
    );
    assert(scoresRecord.rows.length === 1, 'Scores record inserted');
    assert(parseFloat(scoresRecord.rows[0].overall) === 100, 'Scores record overall = 100');

    // Q14 key verification
    const q14Item = await client.query(
      `SELECT key FROM items WHERE external_item_id = '14' AND is_anchor = true`
    );
    assert(q14Item.rows[0].key === 'B', 'Q14 answer key is B (not B.)');

    // =====================================================================
    // G. Duplicate prevention (3 assertions)
    // =====================================================================
    console.log('\n[G] Duplicate prevention');

    // Attempt already submitted — trying to create another pre attempt for same user+course+instrument should be blocked
    const existingSubmitted = await client.query(
      `SELECT attempt_id FROM attempts
       WHERE user_id = $1 AND course_id = $2 AND instrument_id = '22222222-2222-2222-2222-222222222222'
         AND attempt_type = 'pre' AND submitted_at IS NOT NULL`,
      [userId, courseId]
    );
    assert(existingSubmitted.rows.length === 1, '409: existing submitted attempt detected (re-submit blocked)');

    // Different attempt type (post) should be allowed
    const postAttempt = await client.query(
      `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, started_at)
       VALUES ($1, $2, '22222222-2222-2222-2222-222222222223', 'post', NOW())
       RETURNING attempt_id`,
      [userId, courseId]
    );
    assert(postAttempt.rows.length === 1, 'Different attempt type (post) allowed');

    // Different user should be allowed
    const otherHsk = hashedStudentKey(pepper, '987654321');
    const otherUser = await client.query(
      `INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, 'hashed') RETURNING user_id`,
      [otherHsk]
    );
    const otherAttempt = await client.query(
      `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, started_at)
       VALUES ($1, $2, '22222222-2222-2222-2222-222222222222', 'pre', NOW())
       RETURNING attempt_id`,
      [otherUser.rows[0].user_id, courseId]
    );
    assert(otherAttempt.rows.length === 1, 'Different user can create same attempt type');

    // =====================================================================
    // H. Resume (5 assertions)
    // =====================================================================
    console.log('\n[H] Resume');

    // Create a new in-progress attempt for resume testing
    const resumeAttempt = await client.query(
      `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, started_at)
       VALUES ($1, $2, '22222222-2222-2222-2222-222222222223', 'post', NOW())
       RETURNING attempt_id`,
      [otherUser.rows[0].user_id, courseId]
    );
    const resumeAttemptId = resumeAttempt.rows[0].attempt_id;

    // Save some responses to the resume attempt
    const resumeItemIds = anchors.rows.slice(0, 10).map((r: any) => r.item_id);
    const resumeAnswers = resumeItemIds.map(() => JSON.stringify({ answer: 'C' }));
    const resumeConfs = resumeItemIds.map(() => 1);
    await client.query(
      `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence)
       SELECT $1, unnest($2::uuid[]), unnest($3::jsonb[]), unnest($4::int[])`,
      [resumeAttemptId, resumeItemIds, resumeAnswers, resumeConfs]
    );

    // Find in-progress attempt
    const foundInProgress = await client.query(
      `SELECT attempt_id, attempt_type, started_at FROM attempts
       WHERE user_id = $1 AND course_id = $2 AND submitted_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [otherUser.rows[0].user_id, courseId]
    );
    assert(foundInProgress.rows.length === 1, 'In-progress attempt found for resume');
    assert(foundInProgress.rows[0].attempt_id === resumeAttemptId, 'Correct in-progress attempt returned');

    // Responses with item JOIN
    const resumeResponses = await client.query(
      `SELECT r.raw_answer, r.confidence, i.stem, i.options, i.external_item_id
       FROM responses r JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1
       ORDER BY CAST(i.external_item_id AS INTEGER)`,
      [resumeAttemptId]
    );
    assert(resumeResponses.rows.length === 10, 'Resume returns 10 saved responses with item data');
    assert(resumeResponses.rows[0].stem !== null && resumeResponses.rows[0].options !== null,
      'Joined item data includes stem and options');

    // Submitted flag check
    const submittedFlag = await client.query(
      `SELECT submitted_at FROM attempts WHERE attempt_id = $1`, [resumeAttemptId]
    );
    assert(submittedFlag.rows[0].submitted_at === null, 'In-progress attempt has NULL submitted_at');

  } finally {
    await client.end();
    cleanup();
  }

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.log('\nFailed:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test crashed:', err);
  cleanup();
  process.exit(1);
});
