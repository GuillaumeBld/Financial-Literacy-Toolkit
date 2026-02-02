import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getCourseDisplayName } from '@/lib/course-utils';

export const dynamic = 'force-dynamic';

/**
 * Get list of available courses for student selection
 * Returns active courses that students can enroll in
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active courses
    const courses = await queryMany<{
      course_id: string;
      name: string;
      term: string;
    }>(
      'SELECT course_id, name, term FROM courses ORDER BY name, term DESC'
    );

    // Format courses for dropdown
    // Format course list for display
    const courseList = courses.map(course => {
      // Get display name
      const displayName = getCourseDisplayName(course.name);
      
      return {
        id: course.course_id,
        name: course.name, // Keep original name for database queries
        term: course.term,
        displayName: course.term ? `${displayName} (${course.term})` : displayName,
      };
    });

    // If no courses found, return empty array (frontend will handle fallback)
    return NextResponse.json({
      success: true,
      courses: courseList,
    });
  } catch (error: any) {
    console.error('Error fetching courses:', error);

    // Provide user-friendly error message, don't expose database internals
    let userMessage = 'Unable to load courses';
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('SASL') ||
      error.message?.includes('authentication') ||
      error.message?.includes('connect') ||
      error.message?.includes('timeout')
    ) {
      userMessage = 'Service temporarily unavailable';
    }

    // Return empty array on error - frontend will use fallback
    return NextResponse.json({
      success: false,
      courses: [],
      error: userMessage,
    });
  }
}

