#!/usr/bin/env node

// Analyze credentials format and try to understand what they are
const https = require('https');

const publishableKey = 'sb_publishable_4Cnkbmj60Tm8GbrilKw6Rg_JsqfKA8E';
const secretKey = 'sb_secret_Sl1UZBwiQ4Re94XuFDCztQ_UnWvORHA';

console.log('=== ANALYZING CREDENTIALS FORMAT ===\n');

// Extract possible project reference
const parts = publishableKey.split('_');
console.log('Publishable key structure:');
console.log('  Parts:', parts);
console.log('  Part count:', parts.length);

if (parts.length >= 3) {
  const possibleProjectRef = parts[2]; // 4Cnkbmj60Tm8GbrilKw6Rg
  console.log('\n🔍 Extracted possible project reference:', possibleProjectRef);
  console.log('  Length:', possibleProjectRef.length);
  console.log('  URL would be: https://' + possibleProjectRef + '.supabase.co');

  // Try direct REST API call
  const testUrl = `https://${possibleProjectRef}.supabase.co/rest/v1/`;
  
  console.log('\n🔍 Testing direct REST API call...');
  console.log('  URL:', testUrl);
  console.log('  Using secret key as Authorization header');

  const options = {
    hostname: `${possibleProjectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/?select=*',
    method: 'GET',
    headers: {
      'apikey': secretKey,
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(options, (res) => {
    console.log(`\n📡 Response Status: ${res.statusCode}`);
    console.log('  Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('\n✅ Connection successful! (Status indicates Supabase server)');
        console.log('  Response:', data.substring(0, 200));
      } else if (res.statusCode === 401) {
        console.log('\n⚠️  Authentication issue (wrong key format or invalid key)');
        console.log('  Response:', data.substring(0, 200));
      } else {
        console.log('\n❌ Unexpected response');
        console.log('  Response:', data.substring(0, 200));
      }

      // Try with publishable key instead
      console.log('\n\n🔍 Trying with publishable key as apikey...');
      const options2 = {
        hostname: `${possibleProjectRef}.supabase.co`,
        port: 443,
        path: '/rest/v1/?select=*',
        method: 'GET',
        headers: {
          'apikey': publishableKey,
          'Authorization': `Bearer ${publishableKey}`,
          'Content-Type': 'application/json',
        }
      };

      const req2 = https.request(options2, (res2) => {
        console.log(`\n📡 Response Status: ${res2.statusCode}`);
        let data2 = '';
        res2.on('data', (chunk) => data2 += chunk);
        res2.on('end', () => {
          if (res2.statusCode === 200 || res2.statusCode === 404) {
            console.log('✅ Connection successful with publishable key!');
          } else {
            console.log('❌ Failed with publishable key');
          }
        });
      });

      req2.on('error', (e) => {
        console.error('❌ Request error:', e.message);
      });

      req2.end();
    });
  });

  req.on('error', (e) => {
    console.error('\n❌ Request error:', e.message);
    console.log('\n💡 Possible issues:');
    console.log('  1. Project reference might be incorrect');
    console.log('  2. These might not be standard Supabase credentials');
    console.log('  3. Network/DNS issue');
  });

  req.end();

} else {
  console.log('\n❌ Could not extract project reference from credentials');
  console.log('\n💡 These credentials might be in a non-standard format.');
  console.log('   Standard Supabase credentials:');
  console.log('   - URL: https://[project-ref].supabase.co');
  console.log('   - Anon key: JWT token starting with "eyJ"');
  console.log('   - Service role key: JWT token starting with "eyJ"');
  console.log('\n   Your credentials have "sb_publishable_" and "sb_secret_" prefixes.');
  console.log('   These might be from:');
  console.log('   1. A different Supabase service/product');
  console.log('   2. An encoded/encrypted format');
  console.log('   3. A different platform entirely');
}
