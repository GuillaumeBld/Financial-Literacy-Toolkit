/**
 * Test: migration-fix-q14-answer-key.sql
 *
 * Verifies that the migration:
 * 1. Fixes Q14's answer key from 'B.' to 'B'
 * 2. Re-scores Q14 responses where the student answered 'B' but got 0 points
 * 3. Does NOT change responses that were genuinely incorrect
 *
 * Run with: npx tsx scripts/migration-fix-q14.test.ts
 *
 * Requires: Docker (spins up a temporary Postgres container)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { Client } from 'pg';
import { join } from 'path';

const CONTAINER_NAME = 'test_q14_migration';
const DB_PORT = 5499;
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

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Test: migration-fix-q14-answer-key.sql ===\n');

  // --- Spin up Postgres ------------------------------------------------
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
    // --- Create minimal schema matching production ----------------------
    console.log('Setting up schema...');
    await client.query(`
      CREATE TABLE items (
        item_id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        subdomain TEXT NOT NULL DEFAULT '',
        difficulty NUMERIC(3,2) NOT NULL DEFAULT 0.50,
        type TEXT NOT NULL DEFAULT 'multiple_choice',
        stem TEXT NOT NULL,
        options JSONB,
        key TEXT,
        rubric JSONB,
        is_anchor BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT false,
        is_scored BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        anchor_item_id TEXT,
        variant_type TEXT,
        trigger_condition TEXT
      );

      CREATE TABLE attempts (
        attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE responses (
        response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID NOT NULL,
        item_id TEXT NOT NULL,
        raw_answer JSONB NOT NULL,
        score NUMERIC(5,2),
        confidence INTEGER,
        ai_confidence NUMERIC(3,2),
        ai_flags JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // --- Seed buggy Q14 item -------------------------------------------
    console.log('Seeding test data...\n');
    await client.query(`
      INSERT INTO items (item_id, domain, stem, options, key, is_anchor, is_active, is_scored)
      VALUES (
        'Q14',
        'Behavioral and Risk Management Knowledge',
        'When an investor spreads money among different assets, the risk of losing money usually:',
        '[{"id":"A","text":"Increases"},{"id":"B","text":"Decreases"},{"id":"C","text":"Stays the same"},{"id":"D","text":"Do not know"}]',
        'B.',
        true, true, true
      );
    `);

    // Seed a non-buggy item for control
    await client.query(`
      INSERT INTO items (item_id, domain, stem, key, is_anchor, is_active, is_scored)
      VALUES ('Q1', 'Borrowing', 'Suppose you had $100 in a savings account...', 'A', true, true, true);
    `);

    // Create an attempt for response rows
    const { rows: [{ attempt_id }] } = await client.query(`
      INSERT INTO attempts DEFAULT VALUES RETURNING attempt_id;
    `);

    // Response 1: Student answered B correctly — should be re-scored from 0 → 100
    await client.query(`
      INSERT INTO responses (attempt_id, item_id, raw_answer, score, confidence)
      VALUES ($1, 'Q14', '{"answer":"B"}', 0.00, 2);
    `, [attempt_id]);

    // Response 2: Student answered C incorrectly — should stay 0
    await client.query(`
      INSERT INTO responses (attempt_id, item_id, raw_answer, score, confidence)
      VALUES ($1, 'Q14', '{"answer":"C"}', 0.00, 3);
    `, [attempt_id]);

    // Response 3: Student answered A incorrectly — should stay 0
    await client.query(`
      INSERT INTO responses (attempt_id, item_id, raw_answer, score, confidence)
      VALUES ($1, 'Q14', '{"answer":"A"}', 0.00, 1);
    `, [attempt_id]);

    // Response 4: Student answered B for Q1 (wrong, key=A) — should NOT be touched
    await client.query(`
      INSERT INTO responses (attempt_id, item_id, raw_answer, score, confidence)
      VALUES ($1, 'Q1', '{"answer":"B"}', 0.00, 2);
    `, [attempt_id]);

    // ----------------------------------------------------------------
    // PRE-MIGRATION ASSERTIONS
    // ----------------------------------------------------------------
    console.log('[Pre-migration checks]');

    const preMigItem = await client.query(`SELECT key FROM items WHERE item_id = 'Q14'`);
    assert(preMigItem.rows[0].key === 'B.', 'Q14 key is "B." (buggy) before migration');

    const preMigScores = await client.query(
      `SELECT raw_answer->>'answer' as ans, score FROM responses WHERE item_id = 'Q14' ORDER BY raw_answer->>'answer'`
    );
    const preB = preMigScores.rows.find((r: any) => r.ans === 'B');
    assert(preB && parseFloat(preB.score) === 0, 'Correct answer "B" is scored 0 before migration');

    // ----------------------------------------------------------------
    // APPLY MIGRATION
    // ----------------------------------------------------------------
    console.log('\n[Applying migration]');
    const migrationPath = join(__dirname, '..', 'infra', 'migration-fix-q14-answer-key.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSQL);
    console.log('  Migration applied.\n');

    // ----------------------------------------------------------------
    // POST-MIGRATION ASSERTIONS
    // ----------------------------------------------------------------
    console.log('[Post-migration checks]');

    // 1. Q14 key should now be 'B'
    const postItem = await client.query(`SELECT key FROM items WHERE item_id = 'Q14'`);
    assert(postItem.rows[0].key === 'B', 'Q14 key is now "B" (fixed)');

    // 2. Correct response (answer=B) should be re-scored to 100
    const postScores = await client.query(
      `SELECT raw_answer->>'answer' as ans, score FROM responses WHERE item_id = 'Q14' ORDER BY raw_answer->>'answer'`
    );
    const postB = postScores.rows.find((r: any) => r.ans === 'B');
    assert(postB && parseFloat(postB.score) === 100, 'Correct answer "B" re-scored to 100');

    // 3. Incorrect responses should remain 0
    const postC = postScores.rows.find((r: any) => r.ans === 'C');
    assert(postC && parseFloat(postC.score) === 0, 'Incorrect answer "C" still scored 0');

    const postA = postScores.rows.find((r: any) => r.ans === 'A');
    assert(postA && parseFloat(postA.score) === 0, 'Incorrect answer "A" still scored 0');

    // 4. Q1 response should be untouched
    const q1Score = await client.query(
      `SELECT score FROM responses WHERE item_id = 'Q1'`
    );
    assert(q1Score.rows[0] && parseFloat(q1Score.rows[0].score) === 0, 'Q1 response untouched (still 0)');

    // 5. Other items not affected
    const q1Item = await client.query(`SELECT key FROM items WHERE item_id = 'Q1'`);
    assert(q1Item.rows[0].key === 'A', 'Q1 key unchanged ("A")');

    // 6. Idempotency — running migration again should be safe
    console.log('\n[Idempotency check]');
    await client.query(migrationSQL);
    const idempotentItem = await client.query(`SELECT key FROM items WHERE item_id = 'Q14'`);
    assert(idempotentItem.rows[0].key === 'B', 'Migration is idempotent — key still "B" after second run');

    const idempotentScore = await client.query(
      `SELECT score FROM responses WHERE item_id = 'Q14' AND raw_answer->>'answer' = 'B'`
    );
    assert(parseFloat(idempotentScore.rows[0].score) === 100, 'Score still 100 after second migration run');

  } finally {
    await client.end();
    cleanup();
  }

  // --- Summary -------------------------------------------------------
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test crashed:', err);
  cleanup();
  process.exit(1);
});
