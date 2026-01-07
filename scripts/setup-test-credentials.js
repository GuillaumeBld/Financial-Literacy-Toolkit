#!/usr/bin/env node
/**
 * Setup and Test Credentials Script
 * 
 * This script:
 * 1. Tests database connection
 * 2. Creates test instructor credentials
 * 3. Creates test student credentials
 * 4. Tests both authentication methods
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://finlit_user:change_me_in_production@localhost:5432/financial_literacy';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Test credentials configuration
const TEST_CREDENTIALS = {
  instructor: {
    email: 'test.instructor@university.edu',
    password: 'TestInstructor123!',
    full_name: 'Test Instructor',
    department: 'Finance'
  },
  student: {
    courseCode: 'Financial Literacy',
    studentId: '123456789',
    // The hashed key will be computed using: SHA256(course_pepper + student_id)
  }
};

/**
 * Hash password using SHA256 (matching current implementation)
 */
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Create hashed student key (FERPA compliant)
 */
function createHashedStudentKey(coursePepper, studentId) {
  const normalizedId = studentId.trim().toLowerCase();
  const hash = createHash('sha256');
  hash.update(coursePepper + normalizedId);
  return hash.digest('hex');
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Check if tables exist
 */
async function checkTables() {
  console.log('\n=== Checking Required Tables ===');
  const requiredTables = [
    'instructors', 'instructor_sessions', 'instructor_courses',
    'users', 'courses', 'enrollments'
  ];
  
  const missingTables = [];
  for (const table of requiredTables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' is missing`);
        missingTables.push(table);
      }
    } catch (error) {
      console.error(`❌ Error checking table '${table}':`, error.message);
      missingTables.push(table);
    }
  }
  
  return missingTables.length === 0;
}

/**
 * Ensure test course exists
 */
async function ensureTestCourse() {
  console.log('\n=== Ensuring Test Course Exists ===');
  try {
    // Check if course exists
    const courseResult = await pool.query(
      'SELECT course_id, name, pepper FROM courses WHERE name = $1',
      [TEST_CREDENTIALS.student.courseCode]
    );
    
    if (courseResult.rows.length > 0) {
      console.log(`✅ Course '${TEST_CREDENTIALS.student.courseCode}' exists`);
      return courseResult.rows[0];
    }
    
    // Create course if it doesn't exist
    console.log(`⚠️  Course '${TEST_CREDENTIALS.student.courseCode}' not found, creating...`);
    const pepper = createHash('sha256')
      .update(Math.random().toString() + Date.now().toString())
      .digest('hex')
      .substring(0, 32);
    
    const insertResult = await pool.query(
      `INSERT INTO courses (name, term, pepper) 
       VALUES ($1, $2, $3) 
       RETURNING course_id, name, pepper`,
      [TEST_CREDENTIALS.student.courseCode, 'Fall 2025', pepper]
    );
    
    console.log(`✅ Course '${TEST_CREDENTIALS.student.courseCode}' created`);
    return insertResult.rows[0];
  } catch (error) {
    console.error('❌ Error ensuring test course:', error.message);
    throw error;
  }
}

/**
 * Create or update test instructor
 */
async function setupInstructor() {
  console.log('\n=== Setting Up Test Instructor ===');
  try {
    const hashedPassword = hashPassword(TEST_CREDENTIALS.instructor.password);
    
    // Check if instructor exists
    const existing = await pool.query(
      'SELECT instructor_id, email FROM instructors WHERE email = $1',
      [TEST_CREDENTIALS.instructor.email.toLowerCase()]
    );
    
    if (existing.rows.length > 0) {
      // Update password
      await pool.query(
        'UPDATE instructors SET hashed_password = $1, full_name = $2, department = $3, is_active = true WHERE email = $4',
        [
          hashedPassword,
          TEST_CREDENTIALS.instructor.full_name,
          TEST_CREDENTIALS.instructor.department,
          TEST_CREDENTIALS.instructor.email.toLowerCase()
        ]
      );
      console.log(`✅ Instructor '${TEST_CREDENTIALS.instructor.email}' updated`);
      return existing.rows[0].instructor_id;
    } else {
      // Create new instructor
      const result = await pool.query(
        `INSERT INTO instructors (email, hashed_password, full_name, department, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING instructor_id`,
        [
          TEST_CREDENTIALS.instructor.email.toLowerCase(),
          hashedPassword,
          TEST_CREDENTIALS.instructor.full_name,
          TEST_CREDENTIALS.instructor.department
        ]
      );
      console.log(`✅ Instructor '${TEST_CREDENTIALS.instructor.email}' created`);
      return result.rows[0].instructor_id;
    }
  } catch (error) {
    console.error('❌ Error setting up instructor:', error.message);
    throw error;
  }
}

/**
 * Link instructor to course
 */
async function linkInstructorToCourse(instructorId, courseId) {
  console.log('\n=== Linking Instructor to Course ===');
  try {
    await pool.query(
      `INSERT INTO instructor_courses (instructor_id, course_id, access_level)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (instructor_id, course_id) DO UPDATE SET access_level = 'admin'`,
      [instructorId, courseId]
    );
    console.log('✅ Instructor linked to course with admin access');
  } catch (error) {
    console.error('❌ Error linking instructor to course:', error.message);
    throw error;
  }
}

/**
 * Create or update test student
 */
async function setupStudent(course) {
  console.log('\n=== Setting Up Test Student ===');
  try {
    const hashedStudentKey = createHashedStudentKey(
      course.pepper,
      TEST_CREDENTIALS.student.studentId
    );
    
    // Check if user exists
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE hashed_student_key = $1',
      [hashedStudentKey]
    );
    
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].user_id;
      console.log(`✅ Student user already exists`);
    } else {
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (hashed_student_key, sso_provider)
         VALUES ($1, 'test')
         RETURNING user_id`,
        [hashedStudentKey]
      );
      userId = result.rows[0].user_id;
      console.log(`✅ Student user created`);
    }
    
    // Ensure enrollment
    await pool.query(
      `INSERT INTO enrollments (user_id, course_id, role)
       VALUES ($1, $2, 'student')
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, course.course_id]
    );
    console.log('✅ Student enrolled in course');
    
    return { userId, hashedStudentKey };
  } catch (error) {
    console.error('❌ Error setting up student:', error.message);
    throw error;
  }
}

/**
 * Test instructor login
 */
async function testInstructorLogin() {
  console.log('\n=== Testing Instructor Login ===');
  try {
    // Simulate login process
    const instructor = await pool.query(
      'SELECT instructor_id, email, hashed_password FROM instructors WHERE email = $1',
      [TEST_CREDENTIALS.instructor.email.toLowerCase()]
    );
    
    if (instructor.rows.length === 0) {
      console.log('❌ Instructor not found');
      return false;
    }
    
    const hashedPassword = hashPassword(TEST_CREDENTIALS.instructor.password);
    const isValid = hashedPassword === instructor.rows[0].hashed_password;
    
    if (isValid) {
      console.log('✅ Instructor login test passed');
      console.log(`   Email: ${TEST_CREDENTIALS.instructor.email}`);
      console.log(`   Password: ${TEST_CREDENTIALS.instructor.password}`);
      return true;
    } else {
      console.log('❌ Instructor password verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing instructor login:', error.message);
    return false;
  }
}

/**
 * Test student authentication
 */
async function testStudentAuth(course) {
  console.log('\n=== Testing Student Authentication ===');
  try {
    const hashedStudentKey = createHashedStudentKey(
      course.pepper,
      TEST_CREDENTIALS.student.studentId
    );
    
    const user = await pool.query(
      'SELECT user_id FROM users WHERE hashed_student_key = $1',
      [hashedStudentKey]
    );
    
    if (user.rows.length === 0) {
      console.log('❌ Student not found');
      return false;
    }
    
    // Check enrollment
    const enrollment = await pool.query(
      'SELECT role FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user.rows[0].user_id, course.course_id]
    );
    
    if (enrollment.rows.length === 0) {
      console.log('❌ Student not enrolled in course');
      return false;
    }
    
    console.log('✅ Student authentication test passed');
    console.log(`   Course Code: ${TEST_CREDENTIALS.student.courseCode}`);
    console.log(`   Student ID: ${TEST_CREDENTIALS.student.studentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error testing student authentication:', error.message);
    return false;
  }
}

/**
 * Print credentials summary
 */
function printCredentialsSummary(course) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST CREDENTIALS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📧 INSTRUCTOR CREDENTIALS:');
  console.log('   Email:', TEST_CREDENTIALS.instructor.email);
  console.log('   Password:', TEST_CREDENTIALS.instructor.password);
  console.log('   Full Name:', TEST_CREDENTIALS.instructor.full_name);
  console.log('   Department:', TEST_CREDENTIALS.instructor.department);
  
  console.log('\n👤 STUDENT CREDENTIALS:');
  console.log('   Course Code:', TEST_CREDENTIALS.student.courseCode);
  console.log('   Student ID:', TEST_CREDENTIALS.student.studentId);
  console.log('   Course Pepper:', course.pepper);
  
  console.log('\n📝 USAGE:');
  console.log('   Instructor Login: POST /api/instructor/login');
  console.log('     Body: { "email": "' + TEST_CREDENTIALS.instructor.email + '", "password": "' + TEST_CREDENTIALS.instructor.password + '" }');
  console.log('   Student Assessment: POST /api/assessment/submit');
  console.log('     Body: { "courseCode": "' + TEST_CREDENTIALS.student.courseCode + '", "studentId": "' + TEST_CREDENTIALS.student.studentId + '", ... }');
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Test Credentials Setup...\n');
  
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      process.exit(1);
    }
    
    // Check tables
    const tablesOk = await checkTables();
    if (!tablesOk) {
      console.log('\n⚠️  Some tables are missing. Please run schema migrations first.');
      process.exit(1);
    }
    
    // Ensure test course exists
    const course = await ensureTestCourse();
    
    // Setup instructor
    const instructorId = await setupInstructor();
    await linkInstructorToCourse(instructorId, course.course_id);
    
    // Setup student
    await setupStudent(course);
    
    // Test authentications
    const instructorTest = await testInstructorLogin();
    const studentTest = await testStudentAuth(course);
    
    // Print summary
    if (instructorTest && studentTest) {
      printCredentialsSummary(course);
      console.log('\n✅ All tests passed! Credentials are ready to use.\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

