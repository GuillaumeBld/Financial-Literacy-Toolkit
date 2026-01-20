import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';
import { supabase } from '@/lib/supabase';

function isAllowedEmail(email: string): boolean {
  const allowed = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!allowed) return true;

  const domains = allowed
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (domains.length === 0) return true;

  const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
  return domains.includes(emailDomain);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }

    const body = await request.json();
    const { courseCode, studentId } = body;

    if (!courseCode || !studentId) {
      return NextResponse.json(
        { error: 'Course ID and Student ID are required' },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      return NextResponse.json({ error: 'Invalid Microsoft session' }, { status: 401 });
    }

    const ssoUser = userData.user;
    const email = (ssoUser?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: 'Microsoft account email is required' },
        { status: 401 }
      );
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        { error: 'Email domain is not allowed for this school' },
        { status: 403 }
      );
    }

    const result = await transaction(async (client) => {
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Invalid course code');
      }

      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      let user = await client.query('SELECT user_id FROM users WHERE hashed_student_key = $1', [
        hashedStudentKey,
      ]);

      if (!user.rows || user.rows.length === 0) {
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, $2) RETURNING user_id',
          [hashedStudentKey, 'azure']
        );
        user = newUser;
      } else {
        await client.query('UPDATE users SET sso_provider = $1 WHERE user_id = $2', [
          'azure',
          user.rows[0].user_id,
        ]);
      }

      const userId = user.rows[0].user_id;

      await client.query(
        'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, courseData.course_id, 'student']
      );

      const profile = await client.query(
        'SELECT profile_id FROM student_profiles WHERE user_id = $1 AND course_id = $2',
        [userId, courseData.course_id]
      );

      const hasCompletedOnboarding = Boolean(profile.rows && profile.rows.length > 0);

      return {
        userId,
        courseId: courseData.course_id,
        hasCompletedOnboarding,
        email,
      };
    });

    return NextResponse.json({
      message: 'SSO login successful',
      ...result,
    });
  } catch (error: any) {
    console.error('SSO login error:', error);
    return NextResponse.json(
      { error: error.message || 'SSO login failed' },
      { status: 401 }
    );
  }
}
