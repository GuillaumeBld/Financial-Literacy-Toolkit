import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany, transaction, Database } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';

export async function POST(request: NextRequest) {
  console.log('=== CLEANUP API START ===');
  try {
    const body = await request.json();
    const { studentId, courseCode, resetOnly } = body;
    // resetOnly: if true, only delete attempts/responses/scores (keep user, profile, enrollment)

    if (!studentId || !courseCode) {
      return NextResponse.json(
        { error: 'Missing studentId or courseCode' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
    // Get course
      // Look up course by name
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Course not found');
      }

    // Create hashed key
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

    // Find user
      const user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        return { message: 'No data found for this student', deletedUserId: null };
    }

      const userId = user.rows[0].user_id;

    // Get all attempts for this user
      const attempts = await client.query(
        'SELECT attempt_id FROM attempts WHERE user_id = $1',
        [userId]
      );

      if (attempts.rows && attempts.rows.length > 0) {
        const attemptIds = (attempts.rows as Array<{ attempt_id: string }>).map((a) => a.attempt_id);

      console.log('Deleting scores...');
        await client.query(
          'DELETE FROM scores WHERE attempt_id = ANY($1)',
          [attemptIds]
        );

      console.log('Deleting responses...');
        await client.query(
          'DELETE FROM responses WHERE attempt_id = ANY($1)',
          [attemptIds]
        );

      console.log('Deleting attempts...');
        await client.query(
          'DELETE FROM attempts WHERE user_id = $1',
          [userId]
        );
    }

    // If resetOnly, stop here (keep user, profile, enrollment)
    if (resetOnly) {
      return { message: 'Assessment data reset successfully (user and profile preserved)', deletedUserId: userId, resetOnly: true };
    }

    console.log('Deleting student profile...');
      await client.query(
        'DELETE FROM student_profiles WHERE user_id = $1',
        [userId]
      );

    console.log('Deleting enrollments...');
      await client.query(
        'DELETE FROM enrollments WHERE user_id = $1',
        [userId]
      );

    console.log('Deleting user...');
      await client.query(
        'DELETE FROM users WHERE user_id = $1',
        [userId]
      );

      return { message: 'Student data cleaned up successfully', deletedUserId: userId, resetOnly: false };
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      deletedUserId: result.deletedUserId,
      resetOnly: result.resetOnly || false
    });

  } catch (error) {
    console.error('=== CLEANUP API ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    if (errorMessage.includes('Course not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
