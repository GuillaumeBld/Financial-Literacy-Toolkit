#!/usr/bin/env node

// Verify Supabase Schema - Check which migrations have been applied
const https = require('https');

const PROJECT_REF = 'fzjirysmzvhsetmcmfqg';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KweCF_3-GWU3WK9mKb5tDpQ1WOM';

console.log('=== SUPABASE SCHEMA VERIFICATION ===\n');
console.log('Project:', PROJECT_REF);
console.log('URL:', SUPABASE_URL);
console.log('');

// Expected tables from migrations
const EXPECTED_TABLES = [
  'users',
  'courses',
  'enrollments',
  'instruments',
  'items',
  'attempts',
  'responses',
  'scores',
  'student_profiles',      // From migration-add-student-profiles.sql
  'password_reset_tokens'  // From migration-add-password-reset.sql
];

// Expected columns for items table (with feature migrations)
const EXPECTED_ITEMS_COLUMNS = [
  'item_id',
  'domain',
  'subdomain',
  'difficulty',
  'type',
  'stem',
  'options',
  'key',
  'rubric',
  'is_anchor',
  'created_at',
  'is_active'  // From migration-add-is-active-to-items.sql
];

// Expected columns for student_profiles (with all migrations)
const EXPECTED_STUDENT_PROFILES_COLUMNS = [
  'profile_id',
  'user_id',
  'course_id',
  'gender',
  'race_ethnicity',
  'age_range',
  'first_language',
  'first_language_other',
  'work_experience',
  'prior_financial_products',
  'self_rated_financial_knowledge',
  'financial_stress_frequency',
  'household_income',
  'parental_education',
  'first_generation_college',
  'financial_aid_recipient',
  'has_student_loan_debt',
  'student_loan_interest_rate',
  'living_situation',
  'work_study',
  'email',  // From migration-add-password-reset.sql
  'completed_at',
  'created_at',
  'updated_at'
];

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: true, data: parsed, statusCode: res.statusCode });
          } catch (e) {
            resolve({ success: true, data: data, statusCode: res.statusCode, raw: true });
          }
        } else {
          resolve({ success: false, statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function checkTableExists(tableName) {
  try {
    // Try to query the table directly - Supabase REST API will return 200 if table exists
    // or 404/406 if it doesn't exist
    const result = await makeRequest(`/rest/v1/${tableName}?limit=1`);
    return result.success && result.statusCode === 200;
  } catch (error) {
    return false;
  }
}

async function getTableColumns(tableName) {
  // Use RPC or query information_schema via REST
  // For now, try to query the table and infer from response
  try {
    const result = await makeRequest(`/rest/v1/${tableName}?limit=1`);
    if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
      return Object.keys(result.data[0]);
    } else if (result.success && result.data && typeof result.data === 'object') {
      return Object.keys(result.data);
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getTableCount(tableName) {
  try {
    const result = await makeRequest(`/rest/v1/${tableName}?select=count&limit=1`);
    if (result.success && result.data) {
      // Try to extract count from response
      if (Array.isArray(result.data) && result.data[0] && typeof result.data[0].count === 'number') {
        return result.data[0].count;
      }
      // Alternative: query with count in select
      const countResult = await makeRequest(`/rest/v1/${tableName}?select=*&limit=1000`);
      if (countResult.success && Array.isArray(countResult.data)) {
        return countResult.data.length;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function verifySchema() {
  console.log('🔍 Checking base tables...\n');
  
  const tableStatus = {};
  
  for (const table of EXPECTED_TABLES) {
    const exists = await checkTableExists(table);
    const count = exists ? await getTableCount(table) : null;
    tableStatus[table] = { exists, count };
    
    if (exists) {
      console.log(`✅ ${table.padEnd(25)} ${count !== null ? `(${count} records)` : '(accessible)'}`);
    } else {
      console.log(`❌ ${table.padEnd(25)} (missing)`);
    }
  }

  console.log('\n🔍 Checking feature migrations...\n');

  // Check items table for is_active column
  console.log('📋 Items table columns:');
  let itemsColumns = [];
  let hasIsActive = false;
  let hasIsAnchor = false;
  
  if (tableStatus['items']?.exists) {
    itemsColumns = await getTableColumns('items');
    if (itemsColumns.length > 0) {
      hasIsActive = itemsColumns.includes('is_active');
      hasIsAnchor = itemsColumns.includes('is_anchor');
      console.log(`   ${hasIsActive ? '✅' : '❌'} is_active column${hasIsActive ? '' : ' (missing - migration-add-is-active-to-items.sql)'}`);
      console.log(`   ${hasIsAnchor ? '✅' : '❌'} is_anchor column${hasIsAnchor ? '' : ' (missing - schema.sql)'}`);
      console.log(`   Found ${itemsColumns.length} total columns`);
    } else {
      console.log('   ❌ Cannot read columns');
    }
  } else {
    console.log('   ❌ Table missing');
  }

  // Check student_profiles table
  console.log('\n📋 Student Profiles table:');
  const studentProfilesExists = tableStatus['student_profiles']?.exists;
  if (studentProfilesExists) {
    console.log('   ✅ Table exists (migration-add-student-profiles.sql applied)');
    const profileColumns = await getTableColumns('student_profiles');
    if (profileColumns.length > 0) {
      console.log(`   Found ${profileColumns.length} columns`);
      
      // Check for baseline covariates
      const hasAgeRange = profileColumns.includes('age_range');
      const hasFirstLanguage = profileColumns.includes('first_language');
      const hasPriorFinancialProducts = profileColumns.includes('prior_financial_products');
      const hasSelfRatedKnowledge = profileColumns.includes('self_rated_financial_knowledge');
      const hasFinancialStress = profileColumns.includes('financial_stress_frequency');
      
      console.log(`   ${hasAgeRange ? '✅' : '❌'} age_range${hasAgeRange ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasFirstLanguage ? '✅' : '❌'} first_language${hasFirstLanguage ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasPriorFinancialProducts ? '✅' : '❌'} prior_financial_products${hasPriorFinancialProducts ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasSelfRatedKnowledge ? '✅' : '❌'} self_rated_financial_knowledge${hasSelfRatedKnowledge ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasFinancialStress ? '✅' : '❌'} financial_stress_frequency${hasFinancialStress ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      
      // Check for password reset fields
      const hasEmail = profileColumns.includes('email');
      console.log(`   ${hasEmail ? '✅' : '❌'} email${hasEmail ? '' : ' (missing - migration-add-password-reset.sql)'}`);
    }
  } else {
    console.log('   ❌ Table missing (migration-add-student-profiles.sql not applied)');
  }

  // Check password_reset_tokens table
  console.log('\n📋 Password Reset Tokens table:');
  const passwordResetExists = tableStatus['password_reset_tokens']?.exists;
  if (passwordResetExists) {
    console.log('   ✅ Table exists (migration-add-password-reset.sql applied)');
  } else {
    console.log('   ❌ Table missing (migration-add-password-reset.sql not applied)');
  }

  // Summary
  console.log('\n=== MIGRATION STATUS SUMMARY ===\n');
  
  const baseTables = ['users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores'];
  const allBaseTablesExist = baseTables.every(t => tableStatus[t]?.exists);
  
  console.log(`Base Schema (schema.sql):`);
  console.log(`   ${allBaseTablesExist ? '✅' : '❌'} All core tables exist`);
  
  console.log(`\nFeature Migrations:`);
  console.log(`   ${tableStatus['student_profiles']?.exists ? '✅' : '❌'} migration-add-student-profiles.sql`);
  
  if (tableStatus['student_profiles']?.exists) {
    const profileColumns = await getTableColumns('student_profiles');
    const hasBaselineCovariates = profileColumns.includes('age_range') && 
                                  profileColumns.includes('first_language') &&
                                  profileColumns.includes('prior_financial_products');
    console.log(`   ${hasBaselineCovariates ? '✅' : '❌'} migration-add-baseline-covariates.sql`);
  } else {
    console.log(`   ❌ migration-add-baseline-covariates.sql (depends on student_profiles)`);
  }
  
  // Reuse itemsColumns from earlier check
  console.log(`   ${hasIsActive ? '✅' : '❌'} migration-add-is-active-to-items.sql`);
  
  console.log(`   ${tableStatus['password_reset_tokens']?.exists ? '✅' : '❌'} migration-add-password-reset.sql`);
  
  if (tableStatus['student_profiles']?.exists) {
    const profileColumns = await getTableColumns('student_profiles');
    const hasEmail = profileColumns.includes('email');
    console.log(`   ${hasEmail ? '✅' : '❌'} migration-add-password-reset.sql (email column)`);
  }
  
  console.log(`\nData Status:`);
  Object.entries(tableStatus).forEach(([table, status]) => {
    if (status.exists && status.count !== null) {
      console.log(`   ${table}: ${status.count} records`);
    }
  });

  console.log('\n=== END VERIFICATION ===\n');
}

verifySchema().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
