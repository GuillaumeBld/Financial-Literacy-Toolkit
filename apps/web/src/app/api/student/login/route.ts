import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, studentId, password } = body;

    // Validate required fields
    if (!courseCode || !studentId || !password) {
      return NextResponse.json(
        { error: 'Course code, student ID, and password are required' },
        { status: 400 }
      );
    }

    // Use transaction for database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      const course = await client.query(
        'SELECT course_id, pepper FROM courses WHERE name = $1 LIMIT 1',
        [courseCode.trim()]
      );

      if (!course.rows || course.rows.length === 0) {
        throw new Error('Invalid course code');
      }

      const courseData = course.rows[0];

      // Create hashed student key (FERPA compliant)
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      // Find user
      const user = await client.query(
        'SELECT user_id, hashed_password FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        throw new Error('Invalid student ID or password');
      }

      const userData = user.rows[0];

      // Check if password is set
      if (!userData.hashed_password) {
        throw new Error('Password not set. Please complete onboarding first.');
      }

      // Verify password
      const isValidPassword = AuthUtils.verifyPassword(password, userData.hashed_password);

      if (!isValidPassword) {
        throw new Error('Invalid student ID or password');
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

      return {
        success: true,
        userId: userData.user_id,
        courseId: courseData.course_id,
        hasCompletedOnboarding,
      };
    });

    return NextResponse.json({
      success: true,
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

