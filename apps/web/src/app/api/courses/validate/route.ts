import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode } = body;

    if (!courseCode) {
      return NextResponse.json(
        { valid: false, error: 'Course code is required' },
        { status: 400 }
      );
    }

    // Check if course exists in database
    const course = await queryOne<{
      course_id: string;
      name: string;
    }>(
      'SELECT course_id, name FROM courses WHERE name = $1',
      [courseCode.trim()]
    );

    if (!course) {
      return NextResponse.json({
        valid: false,
        error: 'Course not found'
      });
    }

    return NextResponse.json({
      valid: true,
      course: {
        id: course.course_id,
        name: course.name
      }
    });

  } catch (error) {
    console.error('Course validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

