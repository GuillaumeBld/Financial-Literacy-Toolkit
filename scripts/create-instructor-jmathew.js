/**
 * Create instructor admin account for Mathew, Joseph
 * Email: jmathew16@luc.edu
 * Course: QUIN 102 (admin access)
 *
 * Usage: DATABASE_URL="postgresql://..." node scripts/create-instructor-jmathew.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/create-instructor-jmathew.js');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function createInstructor() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const email = 'jmathew16@luc.edu';
    const password = 'jmathew16QUIN102';
    const fullName = 'Joseph Mathew';
    const department = 'Finance';
    const courseName = 'QUIN 102';

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed with bcrypt (10 rounds)');

    // Insert or update instructor
    const instructorResult = await client.query(
      `INSERT INTO instructors (email, hashed_password, full_name, department, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE SET
         hashed_password = EXCLUDED.hashed_password,
         full_name = EXCLUDED.full_name,
         department = EXCLUDED.department,
         is_active = true
       RETURNING instructor_id`,
      [email, hashedPassword, fullName, department]
    );

    const instructorId = instructorResult.rows[0].instructor_id;
    console.log(`Instructor created/updated: ${email} (ID: ${instructorId})`);

    // Find QUIN 102 course
    const courseResult = await client.query(
      `SELECT course_id, name FROM courses WHERE UPPER(REPLACE(name, ' ', '')) LIKE '%QUIN102%' OR UPPER(name) LIKE '%QUIN%102%' LIMIT 1`
    );

    if (courseResult.rows.length === 0) {
      // Try broader search
      const broadSearch = await client.query(`SELECT course_id, name FROM courses`);
      console.log('Available courses:', broadSearch.rows.map(r => r.name).join(', '));
      throw new Error(`Course "${courseName}" not found. See available courses above.`);
    }

    const courseId = courseResult.rows[0].course_id;
    console.log(`Found course: ${courseResult.rows[0].name} (ID: ${courseId})`);

    // Link instructor to course with admin access
    await client.query(
      `INSERT INTO instructor_courses (instructor_id, course_id, access_level)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (instructor_id, course_id) DO UPDATE SET access_level = 'admin'`,
      [instructorId, courseId]
    );

    console.log(`Linked to ${courseResult.rows[0].name} with admin access`);

    await client.query('COMMIT');

    console.log('\n--- Account Created Successfully ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Course:   ${courseResult.rows[0].name} (admin)`);
    console.log('-----------------------------------');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createInstructor();
