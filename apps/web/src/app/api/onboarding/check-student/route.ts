import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limit check-student requests (use AUTH limits: 30/min per IP)
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.AUTH, 'check-student');
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { courseCode, studentId } = await request.json();

    // Validate required fields
    if (!courseCode || !studentId) {
      return NextResponse.json(
        { error: 'Course code and student ID are required' },
        { status: 400 }
      );
    }

    // Check if student already completed onboarding for this course
    const exists = await transaction(async (client) => {
      // Get course with pepper
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        // Invalid course - return false (don't reveal course validity)
        return false;
      }

      // Hash the student ID using same method as submit endpoint
      const hashedStudentKey = AuthUtils.createHashedStudentKey(
        courseData.pepper,
        studentId
      );

      // Check if user exists AND has completed onboarding (has profile for this course)
      const result = await client.query(
        `SELECT 1 FROM users u
         JOIN student_profiles sp ON u.user_id = sp.user_id AND sp.course_id = $2
         WHERE u.hashed_student_key = $1
         LIMIT 1`,
        [hashedStudentKey, courseData.course_id]
      );

      return result.rows && result.rows.length > 0;
    });

    // Return boolean only - no additional info (FERPA + enumeration protection)
    return NextResponse.json({ exists });

  } catch (error: any) {
    console.error('Check student error:', error);
    // On error, return exists: false (fail open for UX - let them try onboarding)
    return NextResponse.json({ exists: false });
  }
}
