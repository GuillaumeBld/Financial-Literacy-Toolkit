#!/usr/bin/env node

// Simple Supabase Schema Verification using JS client
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fzjirysmzvhsetmcmfqg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KkeCF_3-GWU3WK9mKb5tDpQ1WOM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

console.log('=== SUPABASE SCHEMA VERIFICATION ===\n');
console.log('Project: fzjirysmzvhsetmcmfqg');
console.log('URL:', SUPABASE_URL);
console.log('');

// Expected tables
const EXPECTED_TABLES = [
  'users',
  'courses',
  'enrollments',
  'instruments',
  'items',
  'attempts',
  'responses',
  'scores',
  'student_profiles',
  'password_reset_tokens'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      // Check if error is "relation does not exist" (table missing)
      if (error.message && (error.message.includes('does not exist') || error.code === '42P01')) {
        return { exists: false, count: null, error: error.message };
      }
      // Other errors might mean table exists but has permission issues
      return { exists: false, count: null, error: error.message };
    }
    
    // If no error, table exists (even if empty)
    return { exists: true, count: data?.length || 0, error: null };
  } catch (error) {
    return { exists: false, count: null, error: error.message };
  }
}

async function getTableCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return null;
    }
    return count;
  } catch (error) {
    return null;
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return [];
    }
    
    return Object.keys(data[0]);
  } catch (error) {
    return [];
  }
}

async function verifySchema() {
  console.log('🔍 Checking base tables...\n');
  
  const tableStatus = {};
  
  for (const table of EXPECTED_TABLES) {
    const result = await checkTableExists(table);
    tableStatus[table] = result;
    
    if (result.exists) {
      const count = await getTableCount(table);
      const countDisplay = count !== null ? `(${count} records)` : '';
      console.log(`✅ ${table.padEnd(25)} ${countDisplay}`);
    } else {
      const errorMsg = result.error ? ` - ${result.error.substring(0, 50)}` : '';
      console.log(`❌ ${table.padEnd(25)} (missing${errorMsg})`);
    }
  }

  console.log('\n🔍 Checking feature migrations...\n');

  // Check items table for is_active column
  console.log('📋 Items table columns:');
  if (tableStatus['items']?.exists) {
    const itemsColumns = await getTableColumns('items');
    if (itemsColumns.length > 0) {
      const hasIsActive = itemsColumns.includes('is_active');
      const hasIsAnchor = itemsColumns.includes('is_anchor');
      console.log(`   ${hasIsActive ? '✅' : '❌'} is_active column${hasIsActive ? '' : ' (missing - migration-add-is-active-to-items.sql)'}`);
      console.log(`   ${hasIsAnchor ? '✅' : '❌'} is_anchor column${hasIsAnchor ? '' : ' (missing - schema.sql)'}`);
      console.log(`   Found columns: ${itemsColumns.join(', ')}`);
    } else {
      console.log('   ⚠️  Table exists but cannot read columns (empty table?)');
    }
  } else {
    console.log('   ❌ Table missing');
  }

  // Check student_profiles table
  console.log('\n📋 Student Profiles table:');
  if (tableStatus['student_profiles']?.exists) {
    console.log('   ✅ Table exists (migration-add-student-profiles.sql applied)');
    const profileColumns = await getTableColumns('student_profiles');
    if (profileColumns.length > 0) {
      console.log(`   Found ${profileColumns.length} columns: ${profileColumns.slice(0, 10).join(', ')}${profileColumns.length > 10 ? '...' : ''}`);
      
      // Check for baseline covariates
      const hasAgeRange = profileColumns.includes('age_range');
      const hasFirstLanguage = profileColumns.includes('first_language');
      const hasPriorFinancialProducts = profileColumns.includes('prior_financial_products');
      const hasSelfRatedKnowledge = profileColumns.includes('self_rated_financial_knowledge');
      const hasFinancialStress = profileColumns.includes('financial_stress_frequency');
      const hasStudentLoanDebt = profileColumns.includes('has_student_loan_debt');
      const hasStudentLoanInterestRate = profileColumns.includes('student_loan_interest_rate');
      
      console.log(`   ${hasAgeRange ? '✅' : '❌'} age_range${hasAgeRange ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasFirstLanguage ? '✅' : '❌'} first_language${hasFirstLanguage ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasPriorFinancialProducts ? '✅' : '❌'} prior_financial_products${hasPriorFinancialProducts ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasSelfRatedKnowledge ? '✅' : '❌'} self_rated_financial_knowledge${hasSelfRatedKnowledge ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasFinancialStress ? '✅' : '❌'} financial_stress_frequency${hasFinancialStress ? '' : ' (missing - migration-add-baseline-covariates.sql)'}`);
      console.log(`   ${hasStudentLoanDebt ? '✅' : '❌'} has_student_loan_debt${hasStudentLoanDebt ? '' : ' (missing - migration-add-student-loan-debt-status.sql)'}`);
      console.log(`   ${hasStudentLoanInterestRate ? '✅' : '❌'} student_loan_interest_rate${hasStudentLoanInterestRate ? '' : ' (missing - migration-add-student-loan-debt-status.sql)'}`);
      
      // Check for password reset fields
      const hasEmail = profileColumns.includes('email');
      console.log(`   ${hasEmail ? '✅' : '❌'} email${hasEmail ? '' : ' (missing - migration-add-password-reset.sql)'}`);
    } else {
      console.log('   ⚠️  Table exists but cannot read columns (empty table?)');
    }
  } else {
    console.log('   ❌ Table missing (migration-add-student-profiles.sql not applied)');
  }

  // Check password_reset_tokens table
  console.log('\n📋 Password Reset Tokens table:');
  if (tableStatus['password_reset_tokens']?.exists) {
    console.log('   ✅ Table exists (migration-add-password-reset.sql applied)');
    const tokenColumns = await getTableColumns('password_reset_tokens');
    if (tokenColumns.length > 0) {
      console.log(`   Found ${tokenColumns.length} columns: ${tokenColumns.join(', ')}`);
    }
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
  const studentProfilesExists = tableStatus['student_profiles']?.exists;
  console.log(`   ${studentProfilesExists ? '✅' : '❌'} migration-add-student-profiles.sql`);
  
  if (studentProfilesExists) {
    const profileColumns = await getTableColumns('student_profiles');
    const hasBaselineCovariates = profileColumns.includes('age_range') && 
                                  profileColumns.includes('first_language') &&
                                  profileColumns.includes('prior_financial_products');
    console.log(`   ${hasBaselineCovariates ? '✅' : '❌'} migration-add-baseline-covariates.sql`);
  } else {
    console.log(`   ❌ migration-add-baseline-covariates.sql (depends on student_profiles)`);
  }
  
  let hasIsActive = false;
  if (tableStatus['items']?.exists) {
    const itemsColumns = await getTableColumns('items');
    hasIsActive = itemsColumns.includes('is_active');
  }
  console.log(`   ${hasIsActive ? '✅' : '❌'} migration-add-is-active-to-items.sql`);
  
  console.log(`   ${tableStatus['password_reset_tokens']?.exists ? '✅' : '❌'} migration-add-password-reset.sql`);
  
  console.log(`\nData Status:`);
  for (const [table, status] of Object.entries(tableStatus)) {
    if (status.exists) {
      const count = await getTableCount(table);
      if (count !== null) {
        console.log(`   ${table.padEnd(25)}: ${count} records`);
      }
    }
  }

  console.log('\n=== END VERIFICATION ===\n');
}

verifySchema().catch(error => {
  console.error('❌ Verification failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
