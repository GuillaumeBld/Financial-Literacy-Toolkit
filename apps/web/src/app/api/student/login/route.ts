import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limit login attempts
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.AUTH, 'login');
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

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

      // Find existing user - DO NOT create new users here (they must go through onboarding)
      const user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        // User doesn't exist - they need to go through onboarding first
        throw new Error('NOT_REGISTERED');
      }

      const userData = user.rows[0];

      // Check if onboarding (profile) is completed
      const profile = await client.query(
        'SELECT profile_id FROM student_profiles WHERE user_id = $1 AND course_id = $2',
        [userData.user_id, courseData.course_id]
      );

      const hasCompletedOnboarding = profile.rows && profile.rows.length > 0;

      if (!hasCompletedOnboarding) {
        // User exists but hasn't completed onboarding
        throw new Error('NOT_REGISTERED');
      }

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

      // Generate new session token for multi-tab prevention
      // This invalidates any previous sessions for this attempt
      let sessionToken: string | null = null;
      if (attemptData) {
        sessionToken = randomUUID();
        await client.query(
          `UPDATE attempts
           SET session_token = $1, session_created_at = NOW()
           WHERE attempt_id = $2`,
          [sessionToken, attemptData.attempt_id]
        );
      }

      return {
        success: true,
        userId: userData.user_id,
        courseId: courseData.course_id,
        hasCompletedOnboarding,
        hasInProgressAttempt,
        attemptId: attemptData?.attempt_id || null,
        attemptType: attemptData?.attempt_type || null,
        isTestUser,
        sessionToken,
      };
    });

    return NextResponse.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    // Provide user-friendly error messages instead of exposing internal errors
    let userMessage = 'Login failed';
    let statusCode = 401;

    if (error.message === 'Invalid course code') {
      userMessage = 'Invalid course code. Please check and try again.';
      statusCode = 400;
    } else if (error.message === 'Student ID is required') {
      userMessage = 'Student ID is required.';
      statusCode = 400;
    } else if (error.message === 'NOT_REGISTERED') {
      userMessage = 'Account not found. Please complete onboarding first using the "Start Onboarding" button.';
      statusCode = 404;
    } else if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('SASL') ||
      error.message?.includes('authentication') ||
      error.message?.includes('connect') ||
      error.message?.includes('timeout')
    ) {
      // Database connection errors - don't expose details
      userMessage = 'Service temporarily unavailable. Please try again in a few moments.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}

