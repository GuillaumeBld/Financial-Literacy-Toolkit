// migration/init-database.js
// Script to initialize PostgreSQL database schema and RLS policies
// This can be run from the VPS or locally if database is accessible

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection from environment variables
const databaseUrl = process.env.DATABASE_URL || 
  'postgresql://finlit_user:FinLit2025SecurePassword@localhost:5432/financial_literacy';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runSQLFile(filePath) {
  console.log(`\n📄 Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`   Executing SQL statements...`);
  try {
    await pool.query(sql);
    console.log(`   ✅ Successfully executed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error executing ${path.basename(filePath)}:`, error.message);
    // Continue even if some statements fail (e.g., IF NOT EXISTS)
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️  Some objects already exist (this is OK)`);
      return true;
    }
    throw error;
  }
}

async function initDatabase() {
  console.log('🚀 Starting database initialization...');
  console.log(`📊 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Database connection successful');

    // Run schema migration
    const schemaPath = path.join(__dirname, 'supabase-to-postgres.sql');
    await runSQLFile(schemaPath);

    // Run RLS policies migration
    const rlsPath = path.join(__dirname, 'migrate-rls-policies.sql');
    await runSQLFile(rlsPath);

    // Verify tables were created
    console.log('\n🔍 Verifying database schema...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`   ✅ Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`      - ${table}`));

    // Check for expected tables
    const expectedTables = [
      'users', 'courses', 'enrollments', 'instruments', 'items',
      'attempts', 'responses', 'scores', 'instructors',
      'instructor_courses', 'instructor_sessions'
    ];

    const missingTables = expectedTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('   ✅ All expected tables are present');
    }

    console.log('\n✨ Database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. If you have existing data, run: node migration/data-import.js');
    console.log('   2. Verify data integrity: node migration/verify-migration.js');
    console.log('   3. Deploy the application via Dokploy');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = { initDatabase };

