#!/usr/bin/env node

// Apply Missing Migrations to Supabase
// This script applies the missing migrations identified in the schema verification

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fzjirysmzvhsetmcmfqg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KkeCF_3-GWU3WK9mKb5tDpQ1WOM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

console.log('=== APPLYING MISSING MIGRATIONS TO SUPABASE ===\n');
console.log('Project: fzjirysmzvhsetmcmfqg');
console.log('');

// Read migration files
function readMigrationFile(filename) {
  try {
    const filePath = path.join(__dirname, '..', 'infra', filename);
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return null;
  }
}

// Execute SQL via Supabase RPC (if available) or provide instructions
async function executeSQL(sql, migrationName) {
  console.log(`\n📋 Migration: ${migrationName}`);
  console.log(`   SQL Preview (first 200 chars): ${sql.substring(0, 200)}...`);
  
  // Note: Supabase JS client doesn't support direct SQL execution
  // We'll use the REST API or provide instructions
  console.log('\n⚠️  Note: Direct SQL execution via JS client is limited.');
  console.log('   Please run this SQL in Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/fzjirysmzvhsetmcmfqg/sql/new\n');
  
  return { success: false, note: 'Manual execution required' };
}

// Check current state before applying
async function checkCurrentState() {
  console.log('🔍 Checking current state...\n');
  
  // Check items.is_active
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .limit(1);
    
    if (!error && items && items.length > 0) {
      const hasIsActive = 'is_active' in items[0];
      console.log(`   items.is_active: ${hasIsActive ? '✅ EXISTS' : '❌ MISSING'}`);
    }
  } catch (e) {
    console.log(`   items.is_active: ⚠️  Cannot check`);
  }
  
  // Check student_profiles columns
  try {
    const { data: profiles, error } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(1);
    
    if (!error) {
      const columns = profiles && profiles.length > 0 ? Object.keys(profiles[0]) : [];
      const hasAgeRange = columns.includes('age_range');
      const hasFirstLanguage = columns.includes('first_language');
      const hasPriorProducts = columns.includes('prior_financial_products');
      const hasSelfRated = columns.includes('self_rated_financial_knowledge');
      const hasStress = columns.includes('financial_stress_frequency');
      
      console.log(`   student_profiles.age_range: ${hasAgeRange ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   student_profiles.first_language: ${hasFirstLanguage ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   student_profiles.prior_financial_products: ${hasPriorProducts ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   student_profiles.self_rated_financial_knowledge: ${hasSelfRated ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   student_profiles.financial_stress_frequency: ${hasStress ? '✅ EXISTS' : '❌ MISSING'}`);
    }
  } catch (e) {
    console.log(`   student_profiles: ⚠️  Cannot check`);
  }
}

async function applyMigrations() {
  await checkCurrentState();
  
  console.log('\n📦 Preparing migrations...\n');
  
  // Migration 1: Add is_active to items
  const migration1 = readMigrationFile('migration-add-is-active-to-items.sql');
  if (migration1) {
    console.log('✅ Loaded: migration-add-is-active-to-items.sql');
    await executeSQL(migration1, 'migration-add-is-active-to-items.sql');
  }
  
  // Migration 2: Add baseline covariates
  const migration2 = readMigrationFile('migration-add-baseline-covariates.sql');
  if (migration2) {
    console.log('✅ Loaded: migration-add-baseline-covariates.sql');
    await executeSQL(migration2, 'migration-add-baseline-covariates.sql');
  }
  
  console.log('\n=== MIGRATION SQL READY ===\n');
  console.log('Since Supabase JS client doesn\'t support direct SQL execution,');
  console.log('please run these migrations manually in Supabase SQL Editor:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/fzjirysmzvhsetmcmfqg/sql/new');
  console.log('2. Copy and paste the SQL from each migration file');
  console.log('3. Click "Run" to execute\n');
  
  if (migration1) {
    console.log('=== MIGRATION 1: migration-add-is-active-to-items.sql ===');
    console.log(migration1);
    console.log('\n');
  }
  
  if (migration2) {
    console.log('=== MIGRATION 2: migration-add-baseline-covariates.sql ===');
    console.log(migration2);
    console.log('\n');
  }
  
  console.log('=== END MIGRATION SQL ===\n');
  console.log('After running these migrations, verify with:');
  console.log('   node scripts/verify-supabase-schema-simple.js\n');
}

applyMigrations().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
