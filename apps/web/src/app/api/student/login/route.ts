import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, studentId } = body;

    // Validate required fields
    if (!courseCode || !studentId) {
      return NextResponse.json(
        { error: 'Course code and student ID are required' },
        { status: 400 }
      );
    }

    // Use transaction for database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      // Look up course by name
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Invalid course code');
      }

      // Create hashed student key (FERPA compliant)
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      // Find or create user
      let user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      let userData;
      if (!user.rows || user.rows.length === 0) {
        // Create new user
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key) VALUES ($1) RETURNING user_id',
          [hashedStudentKey]
        );
        userData = newUser.rows[0];
      } else {
        userData = user.rows[0];
      }

      // Check if user is enrolled in course
      const enrollment = await client.query(
        'SELECT role FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userData.user_id, courseData.course_id]
      );

      if (!enrollment.rows || enrollment.rows.length === 0) {
        // Auto-enroll user if not enrolled
        await client.query(
          'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [userData.user_id, courseData.course_id, 'student']
        );
      }

      // Check if onboarding (profile) is completed
      const profile = await client.query(
        'SELECT profile_id FROM student_profiles WHERE user_id = $1 AND course_id = $2',
        [userData.user_id, courseData.course_id]
      );

      const hasCompletedOnboarding = profile.rows && profile.rows.length > 0;

      // Check for in-progress assessment attempt
      const inProgressAttempt = await client.query(
        `SELECT attempt_id, attempt_type, started_at
         FROM attempts
         WHERE user_id = $1 AND course_id = $2 AND submitted_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        [userData.user_id, courseData.course_id]
      );

      const hasInProgressAttempt = inProgressAttempt.rows && inProgressAttempt.rows.length > 0;
      const attemptData = hasInProgressAttempt ? inProgressAttempt.rows[0] : null;

      // Check if this is the test user (special permissions)
      const normalizedStudentId = studentId.trim().toLowerCase();
      const isTestUser = normalizedStudentId === '123456789';

      return {
        success: true,
        userId: userData.user_id,
        courseId: courseData.course_id,
        hasCompletedOnboarding,
        hasInProgressAttempt,
        attemptId: attemptData?.attempt_id || null,
        attemptType: attemptData?.attempt_type || null,
        isTestUser,
      };
    });

    return NextResponse.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}

