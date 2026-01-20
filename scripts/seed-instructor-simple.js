const { Client } = require('pg');
const { pbkdf2Sync, randomBytes } = require('crypto');

const pg = new Client({
  host: 'localhost',
  port: 5435,
  database: 'financial_literacy',
  user: 'finlit_user',
  password: 'change_me_in_production'
});

async function main() {
  await pg.connect();
  
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync('instructor123', salt, 10000, 64, 'sha512').toString('hex');
  const hashedPassword = `${salt}:${hash}`;
  
  await pg.query(
    `INSERT INTO instructors (email, hashed_password, full_name, department, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password`,
    ['instructor@university.edu', hashedPassword, 'Dr. Test Instructor', 'Finance', true]
  );
  
  await pg.query(
    `INSERT INTO instructor_courses (instructor_id, course_id, access_level)
     SELECT i.instructor_id, c.course_id, 'admin'
     FROM instructors i CROSS JOIN courses c
     WHERE i.email = $1 AND c.name = 'QUINN 102'
     ON CONFLICT (instructor_id, course_id) DO NOTHING`,
    ['instructor@university.edu']
  );
  
  console.log('✅ Instructor seeded successfully');
  await pg.end();
}

main().catch(console.error);
