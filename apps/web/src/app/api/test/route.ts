import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('=== TEST API START ===');
  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('course_id, name')
      .limit(1);

    if (coursesError) {
      console.error('Courses query failed:', coursesError);
      return NextResponse.json(
        { error: 'Database connection failed', details: coursesError },
        { status: 500 }
      );
    }

    console.log('Courses found:', courses);

    // Test RLS policies by trying to insert (should fail for anon key)
    console.log('Testing RLS policies...');
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        hashed_student_key: 'test_' + Date.now(),
        sso_provider: 'test'
      });

    if (insertError) {
      console.log('Insert failed as expected (RLS working):', insertError.message);
    } else {
      console.log('Insert succeeded (RLS not working!)');
    }

    // Test service role access by checking if we can select from tables
    console.log('Testing service role access...');
    const tables = ['users', 'courses', 'instruments', 'items', 'attempts', 'responses', 'scores'];

    const results = {};
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          results[table] = { status: 'error', error: error.message };
        } else {
          results[table] = { status: 'success', count: data?.length || 0 };
        }
      } catch (err) {
        results[table] = { status: 'exception', error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      database: 'connected',
      tables: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== TEST API ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}