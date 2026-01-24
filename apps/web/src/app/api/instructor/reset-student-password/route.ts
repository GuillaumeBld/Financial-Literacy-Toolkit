import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { verifyInstructorToken } from '@/lib/instructor-auth';

/**
 * Instructor-assisted password reset
 * Allows instructors to reset student passwords for their courses
 * This is the primary free password recovery method for academic use
 */
export async function POST(request: NextRequest) {
  try {
    // Verify instructor authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, studentEmail, newPassword } = body;

    // Validate required fields
    if (!courseId || !studentEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Course ID, student email, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Use transaction for database operations
    const result = await transaction(async (client) => {
      // Verify instructor has access to this course
      const instructorCourse = await client.query(
        'SELECT access_level FROM instructor_courses WHERE instructor_id = $1 AND course_id = $2',
        [instructorId, courseId]
      );

      if (!instructorCourse.rows || instructorCourse.rows.length === 0) {
        throw new Error('Instructor does not have access to this course');
      }

      // Find student by email in the course
      const studentProfile = await client.query(
        `SELECT sp.user_id, sp.email, u.hashed_password
         FROM student_profiles sp
         JOIN users u ON sp.user_id = u.user_id
         WHERE sp.course_id = $1 AND LOWER(sp.email) = LOWER($2)`,
        [courseId, studentEmail.trim()]
      );

      if (!studentProfile.rows || studentProfile.rows.length === 0) {
        throw new Error('Student not found in this course');
      }

      const studentData = studentProfile.rows[0];

      // Hash new password
      const hashedPassword = AuthUtils.hashPassword(newPassword);

      // Update student password
      await client.query(
        'UPDATE users SET hashed_password = $1 WHERE user_id = $2',
        [hashedPassword, studentData.user_id]
      );

      // Log the reset action (for audit trail)
      // You might want to create an audit_log table for this
      console.log(`Password reset by instructor ${instructorId} for student ${studentData.user_id} in course ${courseId}`);

      return {
        success: true,
        message: 'Password reset successfully',
        studentEmail: studentData.email,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Student password has been reset successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Instructor password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 400 }
    );
  }
}

/**
 * GET: Search for students in instructor's course
 * Allows instructor to find student by email or student ID
 */
export async function GET(request: NextRequest) {
  try {
    // Verify instructor authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const searchTerm = searchParams.get('search') || '';

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Verify instructor has access to this course
    const instructorCourse = await query(
      'SELECT access_level FROM instructor_courses WHERE instructor_id = $1 AND course_id = $2',
      [instructorId, courseId]
    );

    if (!instructorCourse.rows || instructorCourse.rows.length === 0) {
      return NextResponse.json(
        { error: 'Instructor does not have access to this course' },
        { status: 403 }
      );
    }

    // Search for students by email (partial match)
    const students = await query(
      `SELECT 
        sp.user_id,
        sp.email,
        CASE WHEN u.hashed_password IS NOT NULL THEN true ELSE false END as has_password
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       WHERE sp.course_id = $1 
         AND (LOWER(sp.email) LIKE LOWER($2) OR sp.email = $3)
       ORDER BY sp.email
       LIMIT 20`,
      [courseId, `%${searchTerm}%`, searchTerm]
    );

    return NextResponse.json({
      success: true,
      students: students.rows.map((row: any) => ({
        userId: row.user_id,
        email: row.email,
        hasPassword: row.has_password,
      })),
    });
  } catch (error: any) {
    console.error('Search students error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search students' },
      { status: 500 }
    );
  }
}

