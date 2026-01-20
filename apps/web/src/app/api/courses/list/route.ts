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
    // Map "Financial Literacy" to "QUINN 102" for display (backward compatibility)
    const courseList = courses.map(course => {
      // Get display name (maps "Financial Literacy" to "QUINN 102")
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
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Return empty array on error - frontend will use fallback
    return NextResponse.json({
      success: false,
      courses: [],
      error: error instanceof Error ? error.message : 'Failed to fetch courses',
    });
  }
}

