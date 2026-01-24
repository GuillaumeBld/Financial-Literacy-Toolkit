#!/usr/bin/env node

// Direct Supabase connection test using project credentials
const https = require('https');

// Project credentials from documentation
const PROJECT_REF = 'fzjirysmzvhsetmcmfqg';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTkyNDcsImV4cCI6MjA3NjkzNTI0N30.H2-PekFYBydLs2aqp6SV1DJxq7Hf5vRx4_pzwsj3pFs';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KkeCF_3-GWU3WK9mKb5tDpQ1WOM';

console.log('=== SUPABASE CONNECTION TEST ===\n');
console.log('Project ID:', PROJECT_REF);
console.log('URL:', SUPABASE_URL);
console.log('');

// Test 1: Basic REST API connection
function testRestAPI(key, keyType) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing REST API with ${keyType} key...`);
    
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 406) {
          console.log(`   ✅ Connection successful! (Status: ${res.statusCode})`);
          resolve({ success: true, statusCode: res.statusCode, keyType });
        } else if (res.statusCode === 401) {
          console.log(`   ❌ Authentication failed (Status: ${res.statusCode})`);
          resolve({ success: false, statusCode: res.statusCode, keyType, error: 'Unauthorized' });
        } else {
          console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode, keyType });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Request error: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Test 2: Query specific table
function testTableQuery(key, keyType, tableName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing table query: ${tableName} (${keyType} key)...`);
    
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: `/rest/v1/${tableName}?select=count&limit=1`,
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ Table '${tableName}' accessible!`);
          try {
            const parsed = JSON.parse(data);
            console.log(`   📊 Response: ${JSON.stringify(parsed).substring(0, 100)}...`);
          } catch (e) {
            console.log(`   📊 Raw response: ${data.substring(0, 100)}...`);
          }
          resolve({ success: true, tableName, keyType });
        } else {
          console.log(`   ❌ Table '${tableName}' error (Status: ${res.statusCode})`);
          console.log(`   📊 Response: ${data.substring(0, 200)}`);
          resolve({ success: false, tableName, statusCode: res.statusCode, keyType });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Request error: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  try {
    // Test basic connection
    const result1 = await testRestAPI(ANON_KEY, 'anon');
    const result2 = await testRestAPI(SERVICE_ROLE_KEY, 'service role');

    // Test table access with service role key (should have more permissions)
    if (result2.success) {
      const tables = ['users', 'courses', 'instruments', 'items', 'attempts', 'responses', 'scores'];
      for (const table of tables) {
        await testTableQuery(SERVICE_ROLE_KEY, 'service role', table);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Anon Key: ${result1.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`Service Role Key: ${result2.success ? '✅ Working' : '❌ Failed'}`);
    
    if (result1.success || result2.success) {
      console.log('\n✅ Supabase project is accessible!');
      console.log('\n📋 To use these credentials, set environment variables:');
      console.log(`NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`);
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`);
      console.log(`SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`);
    } else {
      console.log('\n❌ Connection failed. Please verify credentials are still valid.');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

runTests();
