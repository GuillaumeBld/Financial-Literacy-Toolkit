import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== TEST API START ===');
  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const courses = await queryMany<{ course_id: string; name: string }>(
      'SELECT course_id, name FROM courses LIMIT 1'
    );

    console.log('Courses found:', courses);

    // Test service role access by checking if we can select from tables
    console.log('Testing database access...');
    const tables = ['users', 'courses', 'instruments', 'items', 'attempts', 'responses', 'scores'];

    const results: Record<string, any> = {};
    for (const table of tables) {
      try {
        const data = await queryMany(`SELECT * FROM ${table} LIMIT 1`);
        results[table] = { status: 'success', count: data.length };
      } catch (err) {
        results[table] = { 
          status: 'error', 
          error: err instanceof Error ? err.message : String(err) 
        };
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
