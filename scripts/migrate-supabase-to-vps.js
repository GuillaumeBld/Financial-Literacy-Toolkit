#!/usr/bin/env node

/**
 * Complete Migration Script: Supabase to VPS PostgreSQL
 * Exports essential data from Supabase and imports directly to VPS PostgreSQL
 * 
 * Essential tables: courses, instruments, items (for instructor editing and student assessments)
 * 
 * Usage:
 *   node scripts/migrate-supabase-to-vps.js
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://fzjirysmzvhsetmcmfqg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KkeCF_3-GWU3WK9mKb5tDpQ1WOM';

// VPS PostgreSQL Configuration
const VPS_DB_CONFIG = {
  host: 'localhost',
  port: 5435,
  database: 'financial_literacy',
  user: 'finlit_user',
  password: 'change_me_in_production'
};

// Essential tables to migrate (in dependency order)
const ESSENTIAL_TABLES = ['courses', 'instruments', 'items'];

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Initialize PostgreSQL client
const pgClient = new Client(VPS_DB_CONFIG);

/**
 * Export data from Supabase
 */
async function exportFromSupabase(tableName) {
  console.log(`📥 Exporting ${tableName} from Supabase...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`  ❌ Error exporting ${tableName}:`, error.message);
      return null;
    }
    
    const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
    console.log(`  ✅ Exported ${count} records from ${tableName}`);
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch (error) {
    console.error(`  ❌ Exception exporting ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Import data to VPS PostgreSQL
 */
async function importToVPS(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`  ⚠️  No data to import for ${tableName}`);
    return { imported: 0, errors: [] };
  }
  
  console.log(`📤 Importing ${data.length} records to VPS PostgreSQL ${tableName}...`);
  
  const errors = [];
  let imported = 0;
  
  // Build INSERT statement with proper column mapping
  for (const row of data) {
    try {
      // For items table, ensure is_active is set (default to false if missing from Supabase)
      if (tableName === 'items' && row.is_active === undefined) {
        row.is_active = false;
      }
      
      const columns = Object.keys(row).filter(col => row[col] !== undefined);
      
      // Handle JSONB fields properly - ensure they're JavaScript objects/arrays, not strings
      const processedValues = columns.map(col => {
        const value = row[col];
        
        // Skip null values for JSONB columns (let PostgreSQL handle them)
        if (value === null) {
          return null;
        }
        
        // For JSONB columns, ensure they're properly formatted
        if (col === 'options' || col === 'rubric' || col === 'prior_financial_products' || col === 'by_domain' || col === 'raw_answer' || col === 'ai_flags') {
          // If it's already an object/array, return as-is (pg driver handles JSONB automatically)
          if (typeof value === 'object' && value !== null) {
            return value;
          }
          // If it's a string, try to parse it
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              // If parsing fails, return null
              return null;
            }
          }
        }
        
        return value;
      });
      
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      
      // Build ON CONFLICT clause based on primary key
      let conflictClause = '';
      if (tableName === 'courses') {
        conflictClause = 'ON CONFLICT (course_id) DO NOTHING';
      } else if (tableName === 'instruments') {
        conflictClause = 'ON CONFLICT (instrument_id) DO NOTHING';
      } else if (tableName === 'items') {
        conflictClause = 'ON CONFLICT (item_id) DO NOTHING';
      } else {
        conflictClause = 'ON CONFLICT DO NOTHING';
      }
      
      const query = `
        INSERT INTO ${tableName} (${columnNames})
        VALUES (${placeholders})
        ${conflictClause}
      `;
      
      await pgClient.query(query, processedValues);
      imported++;
    } catch (error) {
      errors.push({ row: row, error: error.message });
      console.error(`    ⚠️  Failed to import row (item_id: ${row.item_id || 'N/A'}):`, error.message);
      if (error.message.includes('json') || error.message.includes('JSON')) {
        console.error(`      Problematic field values:`, {
          options: typeof row.options,
          rubric: typeof row.rubric,
          options_value: row.options ? JSON.stringify(row.options).substring(0, 100) : null,
          rubric_value: row.rubric ? JSON.stringify(row.rubric).substring(0, 100) : null
        });
      }
    }
  }
  
  console.log(`  ✅ Imported ${imported}/${data.length} records to ${tableName}`);
  if (errors.length > 0) {
    console.log(`  ⚠️  ${errors.length} records had errors (may be duplicates)`);
  }
  
  return { imported, errors };
}

/**
 * Activate questions for testing
 */
async function activateQuestions() {
  console.log('\n🔧 Activating questions (setting is_active = true)...');
  
  try {
    const result = await pgClient.query(`
      UPDATE items 
      SET is_active = true 
      WHERE is_active = false
    `);
    
    console.log(`  ✅ Activated ${result.rowCount} questions`);
    return result.rowCount;
  } catch (error) {
    console.error(`  ❌ Error activating questions:`, error.message);
    return 0;
  }
}

/**
 * Verify data migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const verification = {};
  
  for (const table of ESSENTIAL_TABLES) {
    try {
      const result = await pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      verification[table] = { count, success: true };
      console.log(`  ✅ ${table}: ${count} records`);
    } catch (error) {
      verification[table] = { count: 0, success: false, error: error.message };
      console.log(`  ❌ ${table}: Error - ${error.message}`);
    }
  }
  
  // Verify items have is_active column and at least some are active
  try {
    const activeItems = await pgClient.query(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE is_active = true
    `);
    const activeCount = parseInt(activeItems.rows[0].count);
    verification['items_active'] = { count: activeCount, success: true };
    console.log(`  ✅ Active items: ${activeCount} questions ready for students`);
  } catch (error) {
    verification['items_active'] = { count: 0, success: false, error: error.message };
    console.log(`  ❌ Error checking active items: ${error.message}`);
  }
  
  return verification;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Supabase to VPS PostgreSQL Migration\n');
  console.log('='.repeat(60));
  console.log('Source: Supabase (https://fzjirysmzvhsetmcmfqg.supabase.co)');
  console.log('Target: VPS PostgreSQL (localhost:5435/financial_literacy)');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Connect to VPS PostgreSQL
    console.log('📡 Connecting to VPS PostgreSQL...');
    await pgClient.connect();
    console.log('  ✅ Connected to VPS PostgreSQL\n');
    
    // Export and import essential tables
    const results = {};
    
    for (const table of ESSENTIAL_TABLES) {
      // Export from Supabase
      const data = await exportFromSupabase(table);
      
      if (data && data.length > 0) {
        // Import to VPS PostgreSQL
        const importResult = await importToVPS(table, data);
        results[table] = {
          exported: data.length,
          imported: importResult.imported,
          errors: importResult.errors.length
        };
      } else {
        results[table] = {
          exported: 0,
          imported: 0,
          errors: 0
        };
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Activate questions for testing
    const activatedCount = await activateQuestions();
    results['items_activated'] = activatedCount;
    
    // Verify migration
    const verification = await verifyMigration();
    results['verification'] = verification;
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    for (const [table, result] of Object.entries(results)) {
      if (table === 'verification') continue;
      if (table === 'items_activated') {
        console.log(`${table.padEnd(25)}: ${result} questions activated`);
      } else {
        console.log(`${table.padEnd(25)}: ${result.exported} exported, ${result.imported} imported, ${result.errors} errors`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Verify database schema completeness');
    console.log('  2. Test student functionality (onboarding, assessment)');
    console.log('  3. Test instructor functionality (login, question management)');
    console.log('  4. Update application DATABASE_URL to use VPS PostgreSQL');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await pgClient.end();
    console.log('📡 Disconnected from VPS PostgreSQL');
  }
}

// Run migration
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
