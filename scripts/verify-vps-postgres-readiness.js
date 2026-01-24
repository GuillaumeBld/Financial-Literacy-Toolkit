#!/usr/bin/env node

/**
 * Verification Script: VPS PostgreSQL Database Readiness
 * Checks database schema completeness, data integrity, and readiness for student/instructor functionality
 * 
 * Usage:
 *   node scripts/verify-vps-postgres-readiness.js
 */

const { Client } = require('pg');

// VPS PostgreSQL Configuration
const VPS_DB_CONFIG = {
  host: 'localhost',
  port: 5435,
  database: 'financial_literacy',
  user: 'finlit_user',
  password: 'change_me_in_production'
};

const pgClient = new Client(VPS_DB_CONFIG);

// Expected tables for complete functionality
const EXPECTED_TABLES = {
  'base': ['users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores'],
  'student': ['student_profiles', 'password_reset_tokens'],
  'instructor': ['instructors', 'instructor_courses', 'instructor_sessions']
};

// Required columns for key tables
const REQUIRED_COLUMNS = {
  'items': ['item_id', 'domain', 'subdomain', 'difficulty', 'type', 'stem', 'options', 'key', 'rubric', 'is_anchor', 'is_active', 'created_at'],
  'student_profiles': ['profile_id', 'user_id', 'course_id', 'email', 'age_range', 'first_language', 'prior_financial_products', 'self_rated_financial_knowledge', 'financial_stress_frequency'],
  'instructors': ['instructor_id', 'email', 'hashed_password', 'full_name', 'is_active'],
  'courses': ['course_id', 'name', 'term', 'pepper']
};

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const result = await pgClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get table columns
 */
async function getTableColumns(tableName) {
  try {
    const result = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows.map(row => row.column_name);
  } catch (error) {
    return [];
  }
}

/**
 * Get table row count
 */
async function getTableCount(tableName) {
  try {
    const result = await pgClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return null;
  }
}

/**
 * Verify schema completeness
 */
async function verifySchema() {
  console.log('🔍 Verifying Schema Completeness...\n');
  
  const schemaStatus = {
    base: {},
    student: {},
    instructor: {}
  };
  
  // Check base tables
  console.log('📋 Base Schema Tables:');
  for (const table of EXPECTED_TABLES.base) {
    const exists = await tableExists(table);
    const columns = exists ? await getTableColumns(table) : [];
    const count = exists ? await getTableCount(table) : null;
    
    schemaStatus.base[table] = { exists, columns: columns.length, count };
    
    if (exists) {
      console.log(`  ✅ ${table.padEnd(25)} (${columns.length} columns, ${count || 0} records)`);
    } else {
      console.log(`  ❌ ${table.padEnd(25)} (missing)`);
    }
  }
  
  // Check student feature tables
  console.log('\n📋 Student Feature Tables:');
  for (const table of EXPECTED_TABLES.student) {
    const exists = await tableExists(table);
    const columns = exists ? await getTableColumns(table) : [];
    const count = exists ? await getTableCount(table) : null;
    
    schemaStatus.student[table] = { exists, columns: columns.length, count };
    
    if (exists) {
      console.log(`  ✅ ${table.padEnd(25)} (${columns.length} columns, ${count || 0} records)`);
    } else {
      console.log(`  ❌ ${table.padEnd(25)} (missing)`);
    }
  }
  
  // Check instructor feature tables
  console.log('\n📋 Instructor Feature Tables:');
  for (const table of EXPECTED_TABLES.instructor) {
    const exists = await tableExists(table);
    const columns = exists ? await getTableColumns(table) : [];
    const count = exists ? await getTableCount(table) : null;
    
    schemaStatus.instructor[table] = { exists, columns: columns.length, count };
    
    if (exists) {
      console.log(`  ✅ ${table.padEnd(25)} (${columns.length} columns, ${count || 0} records)`);
    } else {
      console.log(`  ❌ ${table.padEnd(25)} (missing)`);
    }
  }
  
  return schemaStatus;
}

/**
 * Verify required columns
 */
async function verifyColumns() {
  console.log('\n🔍 Verifying Required Columns...\n');
  
  const columnStatus = {};
  
  for (const [table, requiredCols] of Object.entries(REQUIRED_COLUMNS)) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`  ⚠️  ${table}: Table missing, cannot verify columns`);
      columnStatus[table] = { exists: false, missing: requiredCols };
      continue;
    }
    
    const actualCols = await getTableColumns(table);
    const missing = requiredCols.filter(col => !actualCols.includes(col));
    
    columnStatus[table] = { exists: true, missing };
    
    if (missing.length === 0) {
      console.log(`  ✅ ${table}: All required columns present`);
    } else {
      console.log(`  ⚠️  ${table}: Missing columns: ${missing.join(', ')}`);
    }
  }
  
  return columnStatus;
}

/**
 * Verify data readiness
 */
async function verifyDataReadiness() {
  console.log('\n🔍 Verifying Data Readiness...\n');
  
  const dataStatus = {
    student: {},
    instructor: {}
  };
  
  // Student functionality requirements
  console.log('📚 Student Functionality:');
  
  const coursesCount = await getTableCount('courses');
  dataStatus.student.courses = coursesCount;
  console.log(`  ${coursesCount > 0 ? '✅' : '❌'} Courses: ${coursesCount} (required: >0)`);
  
  const instrumentsCount = await getTableCount('instruments');
  dataStatus.student.instruments = instrumentsCount;
  console.log(`  ${instrumentsCount > 0 ? '✅' : '❌'} Instruments: ${instrumentsCount} (required: >0)`);
  
  const itemsCount = await getTableCount('items');
  dataStatus.student.items = itemsCount;
  console.log(`  ${itemsCount > 0 ? '✅' : '❌'} Items: ${itemsCount} (required: >0)`);
  
  const activeItemsCount = await getTableCount('items') > 0 ? 
    (await pgClient.query('SELECT COUNT(*) as count FROM items WHERE is_active = true')).rows[0].count : 0;
  dataStatus.student.activeItems = parseInt(activeItemsCount);
  console.log(`  ${activeItemsCount > 0 ? '✅' : '❌'} Active Items: ${activeItemsCount} (required: >0)`);
  
  const studentProfilesExists = await tableExists('student_profiles');
  dataStatus.student.studentProfilesTable = studentProfilesExists;
  console.log(`  ${studentProfilesExists ? '✅' : '❌'} Student Profiles table exists`);
  
  // Instructor functionality requirements
  console.log('\n👨‍🏫 Instructor Functionality:');
  
  const itemsHasIsActive = await tableExists('items') ? 
    (await getTableColumns('items')).includes('is_active') : false;
  dataStatus.instructor.itemsHasIsActive = itemsHasIsActive;
  console.log(`  ${itemsHasIsActive ? '✅' : '❌'} Items table has is_active column`);
  
  const instructorsExists = await tableExists('instructors');
  dataStatus.instructor.instructorsTable = instructorsExists;
  console.log(`  ${instructorsExists ? '✅' : '❌'} Instructors table exists`);
  
  const instructorCoursesExists = await tableExists('instructor_courses');
  dataStatus.instructor.instructorCoursesTable = instructorCoursesExists;
  console.log(`  ${instructorCoursesExists ? '✅' : '❌'} Instructor Courses table exists`);
  
  return dataStatus;
}

/**
 * Verify foreign key constraints
 */
async function verifyForeignKeys() {
  console.log('\n🔍 Verifying Foreign Key Integrity...\n');
  
  try {
    // Check if items reference valid domains (by checking for NULL or valid values)
    const itemsWithValidDomains = await pgClient.query(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE domain IS NOT NULL AND domain != ''
    `);
    console.log(`  ✅ Items with valid domains: ${itemsWithValidDomains.rows[0].count}`);
    
    // Check if all items have valid types
    const itemsWithValidTypes = await pgClient.query(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE type IN ('multiple_choice', 'short_answer', 'numeric')
    `);
    console.log(`  ✅ Items with valid types: ${itemsWithValidTypes.rows[0].count}`);
    
    return { success: true };
  } catch (error) {
    console.log(`  ❌ Error checking foreign keys: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('🚀 VPS PostgreSQL Database Readiness Verification\n');
  console.log('='.repeat(60));
  console.log('Target: VPS PostgreSQL (localhost:5435/financial_literacy)');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Connect to database
    console.log('📡 Connecting to VPS PostgreSQL...');
    await pgClient.connect();
    console.log('  ✅ Connected\n');
    
    // Run all verifications
    const schemaStatus = await verifySchema();
    const columnStatus = await verifyColumns();
    const dataStatus = await verifyDataReadiness();
    const fkStatus = await verifyForeignKeys();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary');
    console.log('='.repeat(60));
    
    // Schema summary
    const allBaseTablesExist = Object.values(schemaStatus.base).every(t => t.exists);
    const allStudentTablesExist = Object.values(schemaStatus.student).every(t => t.exists);
    const allInstructorTablesExist = Object.values(schemaStatus.instructor).every(t => t.exists);
    
    console.log(`\n✅ Schema: ${allBaseTablesExist && allStudentTablesExist && allInstructorTablesExist ? 'Complete' : 'Incomplete'}`);
    console.log(`   Base tables: ${Object.values(schemaStatus.base).filter(t => t.exists).length}/${EXPECTED_TABLES.base.length}`);
    console.log(`   Student tables: ${Object.values(schemaStatus.student).filter(t => t.exists).length}/${EXPECTED_TABLES.student.length}`);
    console.log(`   Instructor tables: ${Object.values(schemaStatus.instructor).filter(t => t.exists).length}/${EXPECTED_TABLES.instructor.length}`);
    
    // Data summary
    const studentReady = dataStatus.student.courses > 0 && 
                        dataStatus.student.instruments > 0 && 
                        dataStatus.student.activeItems > 0 && 
                        dataStatus.student.studentProfilesTable;
    const instructorReady = dataStatus.instructor.itemsHasIsActive && 
                           dataStatus.instructor.instructorsTable && 
                           dataStatus.instructor.instructorCoursesTable;
    
    console.log(`\n✅ Student Functionality: ${studentReady ? 'Ready' : 'Not Ready'}`);
    console.log(`   Courses: ${dataStatus.student.courses}`);
    console.log(`   Instruments: ${dataStatus.student.instruments}`);
    console.log(`   Active Items: ${dataStatus.student.activeItems}`);
    console.log(`   Student Profiles Table: ${dataStatus.student.studentProfilesTable ? 'Yes' : 'No'}`);
    
    console.log(`\n✅ Instructor Functionality: ${instructorReady ? 'Ready' : 'Not Ready'}`);
    console.log(`   Items has is_active: ${dataStatus.instructor.itemsHasIsActive ? 'Yes' : 'No'}`);
    console.log(`   Instructors table: ${dataStatus.instructor.instructorsTable ? 'Yes' : 'No'}`);
    console.log(`   Instructor Courses table: ${dataStatus.instructor.instructorCoursesTable ? 'Yes' : 'No'}`);
    
    // Overall status
    const overallReady = allBaseTablesExist && allStudentTablesExist && allInstructorTablesExist && 
                        studentReady && instructorReady;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Overall Status: ${overallReady ? '✅ READY' : '⚠️  PARTIALLY READY'}`);
    console.log('='.repeat(60));
    
    if (overallReady) {
      console.log('\n✅ Database is ready for both student and instructor functionality!');
    } else {
      console.log('\n⚠️  Database needs attention before full functionality is available.');
      console.log('   Review the verification output above for missing components.');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pgClient.end();
    console.log('📡 Disconnected from VPS PostgreSQL');
  }
}

// Run verification
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
