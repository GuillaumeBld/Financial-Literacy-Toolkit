// Test Database Connection
// Run with: node test-database.js
// Requires: DATABASE_URL environment variable

const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load environment variables from .env.local
const envPath = join(__dirname, '.env.local');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.log('⚠️  .env.local file not found. Using process.env only.');
}

// Get DATABASE_URL from env file or process.env
const databaseUrl = envVars.DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ DATABASE_URL not found!');
  console.log('\nPlease set DATABASE_URL in .env.local or as environment variable:');
  console.log('Format: postgresql://username:password@host:port/database');
  console.log('\nExample:');
  console.log('DATABASE_URL=postgresql://user:pass@localhost:5432/financial_literacy');
  process.exit(1);
}

// Mask password in connection string for display
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
console.log('🔍 Testing database connection...');
console.log('📍 Connection: ' + maskedUrl);
console.log('');

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  let client;
  
  try {
    // Test basic connection
    console.log('1️⃣  Testing connection...');
    client = await pool.connect();
    console.log('   ✅ Connection successful!');
    
    // Test query
    console.log('\n2️⃣  Testing query execution...');
    const result = await client.query('SELECT version()');
    console.log('   ✅ Query executed successfully!');
    console.log('   📊 PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Check if courses table exists
    console.log('\n3️⃣  Checking schema...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ⚠️  Courses table not found!');
      console.log('   💡 Run: psql $DATABASE_URL < ../../infra/schema.sql');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('   ✅ Courses table exists!');
    
    // Check courses
    console.log('\n4️⃣  Checking courses...');
    const courses = await client.query('SELECT course_id, name, term FROM courses ORDER BY name');
    
    if (courses.rows.length === 0) {
      console.log('   ⚠️  No courses found in database!');
      console.log('   💡 Run: psql $DATABASE_URL < ../../infra/seed.sql');
    } else {
      console.log('   ✅ Found ' + courses.rows.length + ' course(s):');
      courses.rows.forEach(course => {
        console.log('      - ' + course.name + ' (' + course.term + ')');
      });
      
      // Check for QUINN 102 or Financial Literacy
      const hasQuinn = courses.rows.some(c => c.name === 'QUINN 102');
      const hasFinancial = courses.rows.some(c => c.name === 'Financial Literacy');
      
      if (!hasQuinn && !hasFinancial) {
        console.log('   ⚠️  Warning: Neither "QUINN 102" nor "Financial Literacy" found!');
        console.log('   💡 The course dropdown will use fallback.');
      } else {
        console.log('   ✅ Course name compatible (QUINN 102 or Financial Literacy found)');
      }
    }
    
    // Test other important tables
    console.log('\n5️⃣  Checking other tables...');
    const tables = ['users', 'student_profiles', 'enrollments', 'items', 'instruments'];
    for (const table of tables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (exists.rows[0].exists) {
        console.log('   ✅ ' + table + ' table exists');
      } else {
        console.log('   ⚠️  ' + table + ' table missing');
      }
    }
    
    console.log('\n✅ All database checks passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Test the course dropdown on /start page');
    console.log('   3. Test student registration and login');
    
  } catch (error) {
    console.log('\n❌ Database connection failed!');
    console.log('\nError details:');
    console.log('   Message: ' + error.message);
    
    if (error.message.includes('SASL')) {
      console.log('\n💡 This error usually means:');
      console.log('   - Password contains special characters (need URL encoding)');
      console.log('   - Connection string format is incorrect');
      console.log('   - Database credentials are wrong');
      console.log('\n   Example with special characters:');
      console.log('   Password: "pass@123" → URL encode: "pass%40123"');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout - check:');
      console.log('   - Database host is accessible');
      console.log('   - Firewall rules allow connection');
      console.log('   - Network connectivity');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database not found - check:');
      console.log('   - Database name is correct');
      console.log('   - Database has been created');
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Authentication failed - check:');
      console.log('   - Username is correct');
      console.log('   - Password is correct');
      console.log('   - Password is properly URL-encoded if it has special characters');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        // Client already released, ignore
      }
    }
    try {
      await pool.end();
    } catch (e) {
      // Pool already ended, ignore
    }
  }
}

testConnection();

