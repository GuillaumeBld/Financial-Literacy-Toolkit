#!/usr/bin/env node

/**
 * PostgreSQL Data Import Script
 * Imports exported JSON data from Supabase into PostgreSQL
 * 
 * Usage:
 *   DATABASE_URL=... node data-import.js [export_directory]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://finlit_user:password@localhost:5432/financial_literacy';

// Tables to import (in dependency order)
const TABLES = [
  'courses',
  'instruments',
  'items',
  'users',
  'enrollments',
  'attempts',
  'responses',
  'scores'
];

/**
 * Find latest export directory
 */
function findLatestExport() {
  const exportDir = path.join(__dirname, 'exports');
  
  if (!fs.existsSync(exportDir)) {
    throw new Error(`Export directory not found: ${exportDir}\nPlease run export script first.`);
  }
  
  const dirs = fs.readdirSync(exportDir)
    .filter(name => name.startsWith('supabase_export_'))
    .map(name => path.join(exportDir, name))
    .filter(dir => fs.statSync(dir).isDirectory())
    .sort()
    .reverse();
  
  if (dirs.length === 0) {
    throw new Error(`No export directories found in ${exportDir}`);
  }
  
  return dirs[0];
}

/**
 * Import a single table from JSON
 */
async function importTable(client, tableName, jsonFile) {
  console.log(`Importing table: ${tableName}...`);
  
  if (!fs.existsSync(jsonFile)) {
    console.log(`  ⚠ Warning: ${jsonFile} not found, skipping ${tableName}`);
    return { table: tableName, count: 0, success: true };
  }
  
  // Read JSON data
  const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const rows = Array.isArray(jsonData) ? jsonData : [jsonData];
  
  if (rows.length === 0) {
    console.log(`  ⚠ No data to import for ${tableName}`);
    return { table: tableName, count: 0, success: true };
  }
  
  try {
    await client.query('BEGIN');
    
    // Build INSERT statement dynamically based on table structure
    // Get column names from first row
    const firstRow = rows[0];
    const columns = Object.keys(firstRow).filter(key => firstRow[key] !== null);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    // Build VALUES clause for all rows
    let values = [];
    let paramIndex = 1;
    const valueClauses = [];
    
    for (const row of rows) {
      const rowValues = columns.map(col => {
        const value = row[col];
        // Handle JSONB fields
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      });
      valueClauses.push(`(${rowValues.map((_, i) => `$${paramIndex++}`).join(', ')})`);
      values.push(...rowValues);
    }
    
    const insertQuery = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES ${valueClauses.join(', ')}
      ON CONFLICT DO NOTHING
    `;
    
    const result = await client.query(insertQuery, values);
    
    // Get actual count
    const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    const actualCount = parseInt(countResult.rows[0].count);
    
    await client.query('COMMIT');
    
    console.log(`  ✓ Imported ${rows.length} rows into ${tableName} (total: ${actualCount})`);
    return { table: tableName, count: rows.length, success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Error importing ${tableName}:`, error.message);
    return { table: tableName, count: 0, success: false, error: error.message };
  }
}

/**
 * Main import function
 */
async function main() {
  // Get export directory (from argument or find latest)
  const exportDir = process.argv[2] || findLatestExport();
  
  console.log(`Export directory: ${exportDir}`);
  
  // Check manifest
  const manifestFile = path.join(exportDir, 'manifest.json');
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    console.log(`Export date: ${manifest.export_date}`);
  }
  console.log('');
  
  // Connect to database
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✓ Database connection established');
    console.log('');
    
    // Verify connection
    const result = await client.query('SELECT NOW()');
    console.log(`Database time: ${result.rows[0].now}`);
    console.log('');
    
    // Import all tables
    console.log('Starting data import...');
    console.log('');
    
    const results = [];
    
    for (const table of TABLES) {
      const jsonFile = path.join(exportDir, `${table}.json`);
      const result = await importTable(client, table, jsonFile);
      results.push(result);
      
      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Summary
    console.log('');
    console.log('Import Summary:');
    console.log('===============');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalRows = results.reduce((sum, r) => sum + r.count, 0);
    
    console.log(`Total tables: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Total rows imported: ${totalRows}`);
    
    if (failed.length > 0) {
      console.error('');
      console.error('Failed imports:');
      failed.forEach(f => {
        console.error(`  - ${f.table}: ${f.error}`);
      });
      process.exit(1);
    }
    
    console.log('');
    console.log('✓ Import completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run verification script: ./migration/verify-migration.sh');
    console.log('2. Test application with new database');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run import
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



