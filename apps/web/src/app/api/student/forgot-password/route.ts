import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { findCourseByName } from '@/lib/course-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, studentId, email } = body;

    // Validate required fields
    if (!courseCode || !studentId || !email) {
      return NextResponse.json(
        { error: 'Course code, Student ID, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Use transaction for database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      // Supports both "QUINN 102" and "Financial Literacy" for backward compatibility
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode
      );

      if (!courseData) {
        throw new Error('Invalid course code');
      }

      // Create hashed student key from student ID and course pepper
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId.trim());

      // Find user by hashed_student_key
      const user = await client.query(
        'SELECT user_id, hashed_password FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        // Don't reveal if account exists or not (security best practice)
        return {
          success: true,
          message: 'If an account exists with these credentials, a password reset link has been sent.',
        };
      }

      const userData = user.rows[0];

      // Verify email matches the student profile
      const profile = await client.query(
        `SELECT sp.user_id, sp.email
         FROM student_profiles sp
         WHERE sp.user_id = $1 AND sp.course_id = $2 AND LOWER(sp.email) = LOWER($3)`,
        [userData.user_id, courseData.course_id, email.trim()]
      );

      if (!profile.rows || profile.rows.length === 0) {
        // Email doesn't match - don't reveal this
        return {
          success: true,
          message: 'If an account exists with these credentials, a password reset link has been sent.',
        };
      }

      const profileData = profile.rows[0];

      // Check if user has a password set
      if (!userData.hashed_password) {
        throw new Error('No password set for this account. Please complete onboarding first.');
      }

      // Check if user is enrolled in course
      const enrollment = await client.query(
        'SELECT role FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userData.user_id, courseData.course_id]
      );

      if (!enrollment.rows || enrollment.rows.length === 0) {
        // Don't reveal enrollment status
        return {
          success: true,
          message: 'If an account exists with these credentials, a password reset link has been sent.',
        };
      }

      // Generate secure reset token
      const token = randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Delete any existing unused tokens for this user/course
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND course_id = $2 AND used_at IS NULL',
        [userData.user_id, courseData.course_id]
      );

      // Create new reset token
      await client.query(
        'INSERT INTO password_reset_tokens (user_id, course_id, token, expires_at) VALUES ($1, $2, $3, $4)',
        [userData.user_id, courseData.course_id, token, expiresAt.toISOString()]
      );

      // Send password reset email
      try {
        await sendPasswordResetEmail(profileData.email, token, courseCode.trim());
      } catch (emailError) {
        // Log error but don't fail the request
        // In production, you might want to queue the email for retry
        console.error('Failed to send password reset email:', emailError);
        // Still return success to user (email might be sent later via queue)
      }

      return {
        success: true,
        message: 'If an account exists with these credentials, a password reset link has been sent.',
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reset token' },
      { status: 400 }
    );
  }
}

