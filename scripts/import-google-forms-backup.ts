/**
 * Google Forms Plan B — Import Script
 *
 * After assessment via Google Forms, export Google Sheets → CSV.
 * This script imports those responses into the production database.
 *
 * Steps:
 *   1. Reads the CSV exported from Google Sheets
 *   2. Hashes student IDs using AuthUtils.createHashedStudentKey()
 *   3. Creates user/enrollment/attempt/response records
 *   4. Scores MCQ answers against item keys (reverse-maps full text → option ID)
 *   5. Inserts scores
 *
 * Run:
 *   DATABASE_URL=postgres://... COURSE_NAME="FINA 301" npx tsx scripts/import-google-forms-backup.ts <path-to-csv>
 *
 * CSV format expected (Google Forms export):
 *   Column 0: Timestamp
 *   Column 1: Student ID
 *   Columns 2-81: Alternating Q1 answer, Q1 confidence, Q2 answer, Q2 confidence, ...
 *
 * Limitations:
 *   - No SDM adaptive questions (10 follow-ups lost)
 *   - No auto-save, no resume
 *   - No anti-cheating metadata
 *   - FERPA: Delete the Google Sheet within 24h of import
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { Client } from 'pg';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
const COURSE_NAME = process.env.COURSE_NAME || 'FINA 301';

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL=postgres://... COURSE_NAME="FINA 301" npx tsx scripts/import-google-forms-backup.ts <csv-file>');
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('ERROR: CSV file path is required as first argument');
  console.error('Usage: DATABASE_URL=postgres://... npx tsx scripts/import-google-forms-backup.ts <csv-file>');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Auth utility (matching apps/web/src/lib/auth.ts)
// ---------------------------------------------------------------------------

function createHashedStudentKey(coursePepper: string, studentId: string): string {
  const normalized = studentId.trim().toLowerCase();
  return createHash('sha256').update(coursePepper + normalized).digest('hex');
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ---------------------------------------------------------------------------
// Option text → option ID reverse mapping
// ---------------------------------------------------------------------------

function reverseMapAnswer(optionsJson: any[], answerText: string): string | null {
  if (!optionsJson || !answerText) return null;

  // Try exact match on text
  for (const opt of optionsJson) {
    if (opt.text === answerText) return opt.id;
  }

  // Try matching with option prefix like "A) More than $102"
  const prefixMatch = answerText.match(/^([A-Z])\)\s*/);
  if (prefixMatch) {
    const letter = prefixMatch[1];
    const opt = optionsJson.find((o: any) => o.id === letter);
    if (opt) return opt.id;
  }

  // Try matching the letter alone
  if (/^[A-Z]$/.test(answerText)) {
    const opt = optionsJson.find((o: any) => o.id === answerText);
    if (opt) return opt.id;
  }

  // Fuzzy: check if answer text contains the option text or vice versa
  for (const opt of optionsJson) {
    if (answerText.includes(opt.text) || opt.text.includes(answerText)) {
      return opt.id;
    }
  }

  return null;
}

function mapConfidence(confText: string): number | null {
  const lower = confText.toLowerCase().trim();
  if (lower.startsWith('1') || lower === 'low') return 1;
  if (lower.startsWith('2') || lower === 'medium') return 2;
  if (lower.startsWith('3') || lower === 'high') return 3;
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Google Forms Import Script ===\n');
  console.log(`CSV:    ${csvPath}`);
  console.log(`Course: ${COURSE_NAME}`);
  console.log(`DB:     ${DATABASE_URL!.replace(/:[^:@]+@/, ':****@')}\n`);

  // Read CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    console.error('ERROR: CSV has no data rows');
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const dataRows = lines.slice(1).map(parseCsvLine);
  console.log(`Found ${dataRows.length} student responses in CSV\n`);

  // Connect to database
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Get course info
    const courseResult = await client.query(
      'SELECT course_id, pepper FROM courses WHERE name = $1 LIMIT 1',
      [COURSE_NAME]
    );
    if (courseResult.rows.length === 0) {
      console.error(`ERROR: Course "${COURSE_NAME}" not found in database`);
      process.exit(1);
    }
    const { course_id: courseId, pepper } = courseResult.rows[0];
    console.log(`Course ID: ${courseId}`);

    // Get instrument
    const instrumentResult = await client.query(
      "SELECT instrument_id FROM instruments WHERE name = 'Pre-Course Assessment' AND status = 'active' LIMIT 1"
    );
    if (instrumentResult.rows.length === 0) {
      console.error('ERROR: No active Pre-Course Assessment instrument found');
      process.exit(1);
    }
    const instrumentId = instrumentResult.rows[0].instrument_id;

    // Get all 40 anchor items ordered by external_item_id
    const itemsResult = await client.query(
      `SELECT item_id, external_item_id, key, type, options, is_scored
       FROM items WHERE is_anchor = true AND is_active = true
       ORDER BY CAST(NULLIF(external_item_id, '') AS INTEGER)`
    );
    if (itemsResult.rows.length !== 40) {
      console.error(`WARNING: Expected 40 anchor items, found ${itemsResult.rows.length}`);
    }
    const items = itemsResult.rows;
    console.log(`Loaded ${items.length} anchor items\n`);

    // Process each student row
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      const studentId = row[1]; // Column 1 = Student ID

      if (!studentId || studentId.trim() === '') {
        console.log(`  Row ${rowIdx + 2}: SKIP (no student ID)`);
        skipped++;
        continue;
      }

      try {
        await client.query('BEGIN');

        // Hash student ID
        const hsk = createHashedStudentKey(pepper, studentId);

        // Find or create user
        let userResult = await client.query(
          'SELECT user_id FROM users WHERE hashed_student_key = $1', [hsk]
        );
        let userId: string;
        if (userResult.rows.length === 0) {
          const newUser = await client.query(
            "INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, 'google-forms-backup') RETURNING user_id",
            [hsk]
          );
          userId = newUser.rows[0].user_id;
        } else {
          userId = userResult.rows[0].user_id;
        }

        // Enroll
        await client.query(
          'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [userId, courseId, 'student']
        );

        // Check for existing submitted attempt
        const existingAttempt = await client.query(
          'SELECT attempt_id FROM attempts WHERE user_id = $1 AND course_id = $2 AND instrument_id = $3 AND attempt_type = $4 AND submitted_at IS NOT NULL',
          [userId, courseId, instrumentId, 'pre']
        );
        if (existingAttempt.rows.length > 0) {
          console.log(`  Row ${rowIdx + 2}: SKIP (student already submitted via app)`);
          await client.query('ROLLBACK');
          skipped++;
          continue;
        }

        // Create attempt
        const attemptResult = await client.query(
          `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, submitted_at, metadata)
           VALUES ($1, $2, $3, 'pre', NOW(), '{"source": "google-forms-backup"}'::jsonb)
           RETURNING attempt_id`,
          [userId, courseId, instrumentId]
        );
        const attemptId = attemptResult.rows[0].attempt_id;

        // Parse responses: columns alternate answer, confidence for Q1-Q40
        // Column 0 = Timestamp, Column 1 = Student ID, Column 2 = Q1 answer, Column 3 = Q1 confidence, ...
        const responseItemIds: string[] = [];
        const responseAnswers: string[] = [];
        const responseConfidences: (number | null)[] = [];
        const responseScores: (number | null)[] = [];
        let totalScore = 0;
        let scoredCount = 0;

        for (let q = 0; q < items.length; q++) {
          const item = items[q];
          const answerCol = 2 + q * 2;
          const confCol = 3 + q * 2;

          const answerText = row[answerCol] || '';
          const confText = row[confCol] || '';

          // Reverse-map full answer text to option ID
          const optionId = reverseMapAnswer(item.options, answerText);
          const confidence = mapConfidence(confText);

          responseItemIds.push(item.item_id);
          responseAnswers.push(JSON.stringify({ answer: optionId || answerText }));
          responseConfidences.push(confidence);

          // Score knowledge items
          if (item.is_scored && item.type === 'multiple_choice' && item.key) {
            const score = optionId === item.key ? 100 : 0;
            responseScores.push(score);
            totalScore += score;
            scoredCount++;
          } else {
            responseScores.push(null);
          }
        }

        // Bulk insert responses
        await client.query(
          `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence, score)
           SELECT $1, unnest($2::uuid[]), unnest($3::jsonb[]), unnest($4::int[]), unnest($5::numeric[])`,
          [attemptId, responseItemIds, responseAnswers, responseConfidences, responseScores]
        );

        // Insert overall score
        const overallScore = scoredCount > 0 ? totalScore / scoredCount : 0;
        await client.query(
          'INSERT INTO scores (attempt_id, overall, by_domain, se_overall) VALUES ($1, $2, $3, 5.0)',
          [attemptId, overallScore, JSON.stringify({})]
        );

        await client.query('COMMIT');
        console.log(`  Row ${rowIdx + 2}: OK (student ${studentId.substring(0, 3)}***, score=${overallScore.toFixed(1)}%)`);
        imported++;

      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`  Row ${rowIdx + 2}: ERROR — ${err.message}`);
        errors++;
      }
    }

    console.log(`\n=== Import Summary ===`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Errors:   ${errors}`);
    console.log(`Total:    ${dataRows.length}`);

    if (errors > 0) {
      console.log('\nWARNING: Some rows had errors. Review output above.');
      process.exit(1);
    }

    console.log('\nFERPA REMINDER: Delete the Google Sheet within 24 hours.');

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Import crashed:', err.message);
  process.exit(1);
});
