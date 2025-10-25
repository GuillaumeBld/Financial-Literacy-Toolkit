// Test Supabase Connection
// Run with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const envPath = './.env.local';
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('❌ .env.local file not found. Please create it first.');
  process.exit(1);
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('Please add:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test basic connection
    const { data, error } = await supabase.from('courses').select('*').limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Found tables:', data ? 'Courses table accessible' : 'No data yet');

    // Test if schema exists
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*');

    if (courseError) {
      console.log('⚠️  Database schema not set up yet. Please run infra/schema.sql in Supabase SQL Editor');
    } else {
      console.log('📋 Courses in database:', courses?.length || 0);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testConnection();