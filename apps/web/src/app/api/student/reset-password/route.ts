import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, token, newPassword } = body;

    // Validate required fields
    if (!courseCode || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Course code, token, and new password are required' },
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
      // Get course information (including pepper for hashing)
      // Supports both "QUINN 102" and "Financial Literacy" for backward compatibility
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode
      );

      if (!courseData) {
        throw new Error('Invalid course code');
      }

      // Find and validate reset token (token contains user_id and course_id)
      const resetToken = await client.query(
        `SELECT token_id, user_id, expires_at, used_at 
         FROM password_reset_tokens 
         WHERE course_id = $1 AND token = $2`,
        [courseData.course_id, token.trim()]
      );

      if (!resetToken.rows || resetToken.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const tokenData = resetToken.rows[0];

      // Check if token is already used
      if (tokenData.used_at) {
        throw new Error('This reset token has already been used');
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        throw new Error('Reset token has expired. Please request a new one.');
      }

      const userId = tokenData.user_id;

      // Hash new password
      const hashedPassword = AuthUtils.hashPassword(newPassword);

      // Update user password
      await client.query(
        'UPDATE users SET hashed_password = $1 WHERE user_id = $2',
        [hashedPassword, userId]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_id = $1',
        [tokenData.token_id]
      );

      // Delete all other unused tokens for this user/course
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND course_id = $2 AND used_at IS NULL AND token_id != $3',
        [userId, courseData.course_id, tokenData.token_id]
      );

      return {
        success: true,
        message: 'Password reset successfully',
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 400 }
    );
  }
}

