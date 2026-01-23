import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { findCourseByName } from '@/lib/course-utils';

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
    // Supports both "QUIN 102" and "Financial Literacy" for backward compatibility
    const course = await findCourseByName(
      async (sql: string, params: any[]) => {
        const result = await queryOne<{
          course_id: string;
          name: string;
          pepper?: string;
        }>(sql, params);
        // Convert queryOne result to query format
        return { rows: result ? [result] : [] };
      },
      courseCode
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

