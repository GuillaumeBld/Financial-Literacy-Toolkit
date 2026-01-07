#!/usr/bin/env node

/**
 * Supabase Data Export Script
 * Exports all data from Supabase to JSON files for migration to PostgreSQL
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node data-export.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Tables to export (in dependency order to maintain referential integrity)
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

// Create export directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const exportDir = path.join(__dirname, 'exports', `supabase_export_${timestamp}`);
fs.mkdirSync(exportDir, { recursive: true });

console.log(`Export directory: ${exportDir}`);

/**
 * Make HTTP request to Supabase REST API
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Export a single table
 */
async function exportTable(tableName) {
  console.log(`Exporting table: ${tableName}...`);
  
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
  const options = {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  try {
    const data = await makeRequest(url, options);
    
    // Handle both array and single object responses
    const rows = Array.isArray(data) ? data : [data];
    
    // Save to file
    const outputFile = path.join(exportDir, `${tableName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
    
    console.log(`  ✓ Exported ${rows.length} rows from ${tableName}`);
    return { table: tableName, count: rows.length, success: true };
  } catch (error) {
    console.error(`  ✗ Error exporting ${tableName}:`, error.message);
    return { table: tableName, count: 0, success: false, error: error.message };
  }
}

/**
 * Main export function
 */
async function main() {
  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node data-export.js');
    process.exit(1);
  }
  
  console.log('Starting Supabase data export...');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');
  
  const results = [];
  
  // Export all tables
  for (const table of TABLES) {
    const result = await exportTable(table);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Create manifest
  const manifest = {
    export_timestamp: timestamp,
    export_date: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables_exported: TABLES,
    results: results,
    export_directory: exportDir
  };
  
  const manifestFile = path.join(exportDir, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  
  // Summary
  console.log('');
  console.log('Export Summary:');
  console.log('===============');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRows = results.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`Total tables: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total rows exported: ${totalRows}`);
  console.log('');
  console.log(`Export directory: ${exportDir}`);
  console.log(`Manifest file: ${manifestFile}`);
  
  if (failed.length > 0) {
    console.error('');
    console.error('Failed exports:');
    failed.forEach(f => {
      console.error(`  - ${f.table}: ${f.error}`);
    });
    process.exit(1);
  }
  
  console.log('');
  console.log('✓ Export completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review exported data files');
  console.log('2. Run import script: node migration/data-import.js');
  console.log('3. Run verification script: ./migration/verify-migration.sh');
}

// Run export
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



