#!/usr/bin/env node

// Simple Supabase connection test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('URL:', supabaseUrl ? 'Set' : 'NOT SET');
console.log('Service Key:', supabaseServiceRoleKey ? 'Set' : 'NOT SET');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

async function testConnection() {
  try {
    console.log('\n🔍 Testing basic connection...');
    const { data, error } = await supabase.from('courses').select('count').limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Basic connection OK');

    console.log('\n🔍 Checking tables exist...');
    const tables = ['users', 'courses', 'instruments', 'items', 'attempts', 'responses', 'scores'];

    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1);
      if (tableError) {
        console.error(`❌ Table '${table}' missing or inaccessible:`, tableError.message);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    console.log('\n🔍 Checking sample data...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('name')
      .eq('name', 'Financial Literacy');

    if (coursesError) {
      console.error('❌ Courses query failed:', coursesError.message);
    } else if (!courses || courses.length === 0) {
      console.error('❌ No "Financial Literacy" course found');
    } else {
      console.log('✅ Sample course exists');
    }

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('count');

    if (itemsError) {
      console.error('❌ Items query failed:', itemsError.message);
    } else {
      console.log(`✅ ${items?.length || 0} items found`);
    }

    console.log('\n🔍 Testing write permissions...');
    // Test insert (will be rolled back)
    const testData = {
      hashed_student_key: 'test_' + Date.now(),
      sso_provider: 'test'
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(testData);

    if (insertError) {
      console.error('❌ Write permission failed:', insertError.message);
    } else {
      console.log('✅ Write permissions OK');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();