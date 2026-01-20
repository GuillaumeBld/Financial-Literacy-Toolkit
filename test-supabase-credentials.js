#!/usr/bin/env node

// Test Supabase credentials provided by user
const { createClient } = require('@supabase/supabase-js');

// Credentials provided
const publishableKey = 'sb_publishable_4Cnkbmj60Tm8GbrilKw6Rg_JsqfKA8E';
const secretKey = 'sb_secret_Sl1UZBwiQ4Re94XuFDCztQ_UnWvORHA';

console.log('=== TESTING SUPABASE CREDENTIALS ===\n');

// Try to extract project reference from publishable key
// Format might be: sb_publishable_[project-ref]_[something]
const parts = publishableKey.split('_');
const possibleProjectRef = parts.length > 2 ? parts[2] : null;

console.log('Publishable key parts:', parts);
console.log('Possible project ref:', possibleProjectRef);

// Try different URL formats
const possibleUrls = [
  `https://${possibleProjectRef}.supabase.co`,
  `https://${possibleProjectRef}.supabase.co/rest/v1`,
  publishableKey.includes('http') ? publishableKey : null,
].filter(Boolean);

console.log('\n🔍 Testing different URL formats...\n');

async function testConnection(url, key, label) {
  console.log(`\n📋 Testing: ${label}`);
  console.log(`   URL: ${url.substring(0, 50)}...`);
  console.log(`   Key: ${key.substring(0, 30)}...`);

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false }
    });

    // Try a simple query
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ SUCCESS! Connection established`);
    return { url, key, supabase };
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  // Test 1: Use publishable key parts as project ref
  if (possibleProjectRef) {
    const url = `https://${possibleProjectRef}.supabase.co`;
    const result1 = await testConnection(url, secretKey, 'Project ref from publishable key + secret key');
    if (result1) {
      console.log('\n✅ Found working configuration!');
      console.log(`\nEnvironment variables to use:`);
      console.log(`SUPABASE_URL=${url}`);
      console.log(`NEXT_PUBLIC_SUPABASE_URL=${url}`);
      console.log(`SUPABASE_SERVICE_ROLE_KEY=${secretKey}`);
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${publishableKey}`);
      return;
    }

    // Test 2: Try with publishable key as anon key
    const result2 = await testConnection(url, publishableKey, 'Project ref URL + publishable key as anon key');
    if (result2) {
      console.log('\n✅ Found working configuration (anon key)!');
      return;
    }
  }

  // Test 3: Try direct REST API call to see what format these are
  console.log('\n🔍 Trying direct API call to understand format...');
  
  // Maybe these are actually different keys - try extracting just the key part
  const extractKey = (fullKey) => {
    // Remove sb_publishable_ or sb_secret_ prefix
    return fullKey.replace(/^sb_(publishable|secret)_/, '');
  };

  const extractedPublishable = extractKey(publishableKey);
  const extractedSecret = extractKey(secretKey);

  console.log(`Extracted publishable: ${extractedPublishable.substring(0, 30)}...`);
  console.log(`Extracted secret: ${extractedSecret.substring(0, 30)}...`);

  // If project ref is actually the first part of the extracted key
  const possibleRef2 = extractedPublishable.split('_')[0];
  if (possibleRef2 && possibleRef2.length >= 20) {
    const url2 = `https://${possibleRef2}.supabase.co`;
    const result3 = await testConnection(url2, extractedSecret, 'Extracted project ref + extracted secret');
  }

  console.log('\n❌ Could not establish connection with provided credentials.');
  console.log('\nPlease verify:');
  console.log('1. The credentials are from Supabase Dashboard → Settings → API');
  console.log('2. The URL format is: https://[project-ref].supabase.co');
  console.log('3. The keys are the actual JWT tokens (usually starting with eyJ)');
}

main().catch(console.error);
